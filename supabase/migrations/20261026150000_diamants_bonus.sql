-- 💎 Chemin de la semaine, idées acceptées par Nadia (2026-10-26) :
-- 1 diamant bonus (tout fait avant le cours) → date de chaque diamant (done_at) ; 2 série de semaines (my_program_streak) ;
-- 5 devoir en étapes (devoirs.etapes + devoir_steps) ; 6 rappel la veille du cours (notif_prog_eve).

ALTER TABLE public.devoirs ADD COLUMN IF NOT EXISTS etapes jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.devoir_steps (
  devoir_id uuid NOT NULL REFERENCES public.devoirs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step smallint NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (devoir_id, student_id, step)
);
ALTER TABLE public.devoir_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_devoir_steps" ON public.devoir_steps;
CREATE POLICY "own_devoir_steps" ON public.devoir_steps FOR ALL TO authenticated
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "admin_read_devoir_steps" ON public.devoir_steps;
CREATE POLICY "admin_read_devoir_steps" ON public.devoir_steps FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "admin_insert_devoir_steps" ON public.devoir_steps;
CREATE POLICY "admin_insert_devoir_steps" ON public.devoir_steps FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'devoir_steps') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.devoir_steps;
  END IF;
END $$;

-- Quand le diamant s'est allumé
CREATE OR REPLACE FUNCTION public.program_item_done_at(p_user uuid, p_module text, p_item text)
 RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT CASE p_module
    WHEN 'devoir' THEN LEAST(
      (SELECT c.checked_at FROM devoir_checks c WHERE c.student_id = p_user AND c.devoir_id::text = p_item),
      (SELECT r.rendu_at FROM devoirs_rendus r WHERE r.student_id = p_user AND r.devoir_id::text = p_item AND r.statut <> 'a_refaire' LIMIT 1))
    WHEN 'allah_names' THEN (SELECT u.validated_at FROM user_allah_name_progress u WHERE u.user_id = p_user AND u.name_id::text = p_item AND u.is_validated LIMIT 1)
    ELSE NULL END;
$function$;

-- Étapes : nombre total (devoir) — ajouté à chaque diamant de devoir
CREATE OR REPLACE FUNCTION public.program_items(p_user uuid, p_week date, p_stored jsonb)
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT jsonb_agg(it) FROM jsonb_array_elements(COALESCE(p_stored, '[]'::jsonb)) it WHERE it->>'module' = 'allah_names'), '[]'::jsonb)
      || COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'module', 'devoir', 'item_id', d.id::text, 'label', d.titre,
          'detail', CASE d.type WHEN 'sourate' THEN 'Sourate' WHEN 'recitation' THEN 'Récitation' WHEN 'nourania' THEN 'Nourania' ELSE 'Devoir' END
                    || COALESCE(' · pour le ' || to_char(d.date_limite AT TIME ZONE 'Europe/Paris', 'DD/MM'), ''),
          'path', '/?open=devoirs#devoir-' || d.id::text,
          'emoji', CASE d.type WHEN 'sourate' THEN '📖' WHEN 'recitation' THEN '🎙️' WHEN 'nourania' THEN '✨' ELSE '📚' END,
          'steps_total', jsonb_array_length(d.etapes)
        ) ORDER BY d.created_at)
        FROM devoirs d
        WHERE (d.assigned_to = 'all' OR d.student_id = p_user
               OR (d.group_id IS NOT NULL AND d.group_id IN (SELECT g.group_id FROM student_group_members g WHERE g.user_id = p_user)))
          AND (
            -- la semaine dure jusqu'à la création de la suivante (vacances : pas de nouvelle semaine, les devoirs s'ajoutent quand même)
            (d.created_at >= p_week AND d.created_at < COALESCE((SELECT min(w2.week_start) FROM weekly_programs w2 WHERE w2.student_id = p_user AND w2.week_start > p_week), 'infinity'::date))
            OR (d.created_at < p_week AND d.created_at >= p_week - 30
                AND (d.date_limite IS NULL OR d.date_limite >= p_week)
                AND NOT program_item_done(p_user, 'devoir', d.id::text))
          )
      ), '[]'::jsonb);
$function$;

CREATE OR REPLACE FUNCTION public.weekly_program_view(p_student uuid DEFAULT NULL::uuid)
 RETURNS TABLE(program_id uuid, student_id uuid, full_name text, gender text, week_start date, items jsonb, message_index smallint, teacher_note text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE all_ok boolean := public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.role() = 'service_role';
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (w.student_id) w.id, w.student_id, p.full_name, p.gender, w.week_start,
    COALESCE((SELECT jsonb_agg(it || jsonb_build_object(
                'done', program_item_done(w.student_id, it->>'module', it->>'item_id'),
                'done_at', program_item_done_at(w.student_id, it->>'module', it->>'item_id'),
                'steps_done', CASE WHEN it->>'module' = 'devoir'
                  THEN (SELECT count(*) FROM devoir_steps ds WHERE ds.student_id = w.student_id AND ds.devoir_id::text = it->>'item_id') ELSE 0 END))
              FROM jsonb_array_elements(program_items(w.student_id, w.week_start, w.items)) it), '[]'::jsonb),
    w.message_index, w.teacher_note
  FROM weekly_programs w JOIN profiles p ON p.user_id = w.student_id
  WHERE CASE WHEN all_ok THEN (p_student IS NULL OR w.student_id = p_student) ELSE w.student_id = auth.uid() END
  ORDER BY w.student_id, w.week_start DESC;
END $function$;

-- 🔥 Série : semaines d'affilée (de la plus récente) où tous les diamants ont brillé ; la semaine en cours compte si elle est complète
CREATE OR REPLACE FUNCTION public.program_streak(p_user uuid)
 RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH wk AS (
    SELECT w.week_start, row_number() OVER (ORDER BY w.week_start DESC) AS rn,
      jsonb_array_length(program_items(w.student_id, w.week_start, w.items)) AS total,
      (SELECT count(*) FROM jsonb_array_elements(program_items(w.student_id, w.week_start, w.items)) it
        WHERE program_item_done(w.student_id, it->>'module', it->>'item_id')) AS done
    FROM weekly_programs w WHERE w.student_id = p_user
  ), flagged AS (
    SELECT rn, (total > 0 AND done = total) AS ok FROM wk
  ), counted AS (
    -- semaine en cours pas finie : on ne casse pas la série, on regarde à partir de la précédente
    SELECT rn, ok FROM flagged WHERE NOT (rn = 1 AND NOT ok)
  )
  SELECT COALESCE((SELECT count(*)::int FROM counted c
    WHERE c.ok AND NOT EXISTS (SELECT 1 FROM counted c2 WHERE c2.rn < c.rn AND NOT c2.ok)), 0);
$function$;

CREATE OR REPLACE FUNCTION public.my_program_streak()
 RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ SELECT public.program_streak(auth.uid()); $function$;

CREATE OR REPLACE FUNCTION public.class_program_streaks()
 RETURNS TABLE(student_id uuid, streak integer) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Réservé à l''enseignante'; END IF;
  RETURN QUERY SELECT DISTINCT w.student_id, public.program_streak(w.student_id) FROM weekly_programs w;
END $function$;

-- 🔔 Rappel la veille du cours (mardi 18 h) : bouton dans la carte Notifications
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS notif_prog_eve boolean DEFAULT true;
