-- 💎 Chemin de la semaine refait (demande de Nadia, 2026-10-26) : les diamants dépendent des DEVOIRS donnés à chaque
-- élève (niveaux différents dans un même groupe), plus de leçon / sourate entière automatique ; seul le diamant des
-- 99 noms d'Allah garde l'ancien principe. Un devoir est « fait » quand l'élève coche « J'ai travaillé ce devoir »
-- (devoir_checks) ou quand il a envoyé son audio (devoirs_rendus, sauf « à refaire »).

CREATE TABLE IF NOT EXISTS public.devoir_checks (
  devoir_id uuid NOT NULL REFERENCES public.devoirs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (devoir_id, student_id)
);
ALTER TABLE public.devoir_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_devoir_checks" ON public.devoir_checks;
CREATE POLICY "own_devoir_checks" ON public.devoir_checks FOR ALL TO authenticated
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "admin_read_devoir_checks" ON public.devoir_checks;
CREATE POLICY "admin_read_devoir_checks" ON public.devoir_checks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'devoir_checks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.devoir_checks;
  END IF;
END $$;

-- Étape faite : + le module « devoir »
CREATE OR REPLACE FUNCTION public.program_item_done(p_user uuid, p_module text, p_item text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT CASE p_module
    WHEN 'devoir' THEN EXISTS (SELECT 1 FROM devoir_checks c WHERE c.student_id = p_user AND c.devoir_id::text = p_item)
                    OR EXISTS (SELECT 1 FROM devoirs_rendus r WHERE r.student_id = p_user AND r.devoir_id::text = p_item AND r.statut <> 'a_refaire')
    WHEN 'nourania' THEN EXISTS (SELECT 1 FROM user_nourania_progress u WHERE u.user_id = p_user AND u.lesson_id::text = p_item AND u.is_validated)
    WHEN 'sourates' THEN EXISTS (SELECT 1 FROM user_sourate_progress u WHERE u.user_id = p_user AND u.sourate_id::text = p_item AND u.is_validated AND u.context = 'sourates')
    WHEN 'allah_names' THEN EXISTS (SELECT 1 FROM user_allah_name_progress u WHERE u.user_id = p_user AND u.name_id::text = p_item AND u.is_validated)
    WHEN 'alphabet' THEN EXISTS (SELECT 1 FROM user_alphabet_progress u WHERE u.user_id = p_user AND u.letter_id::text = p_item AND u.is_validated)
    WHEN 'invocations' THEN EXISTS (SELECT 1 FROM user_invocation_progress u WHERE u.user_id = p_user AND u.invocation_id::text = p_item AND u.is_validated)
    WHEN 'priere' THEN EXISTS (SELECT 1 FROM user_prayer_progress u WHERE u.user_id = p_user AND u.card_id::text = p_item AND u.is_validated)
    ELSE false END;
$function$;

-- Les diamants d'une semaine : le diamant des 99 noms (gardé dans la semaine) + un diamant par devoir de l'élève.
-- Devoirs de la semaine = donnés depuis le début de la semaine (jusqu'à la semaine suivante), ou plus anciens (30 jours) encore à faire et pas expirés.
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
          'emoji', CASE d.type WHEN 'sourate' THEN '📖' WHEN 'recitation' THEN '🎙️' WHEN 'nourania' THEN '✨' ELSE '📚' END
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
    COALESCE((SELECT jsonb_agg(it || jsonb_build_object('done', program_item_done(w.student_id, it->>'module', it->>'item_id')))
              FROM jsonb_array_elements(program_items(w.student_id, w.week_start, w.items)) it), '[]'::jsonb),
    w.message_index, w.teacher_note
  FROM weekly_programs w JOIN profiles p ON p.user_id = w.student_id
  WHERE CASE WHEN all_ok THEN (p_student IS NULL OR w.student_id = p_student) ELSE w.student_id = auth.uid() END
  ORDER BY w.student_id, w.week_start DESC;
END $function$;

-- Le mercredi : on garde seulement le diamant des 99 noms ; la semaine est créée même sans lui (les devoirs s'ajoutent tout seuls)
CREATE OR REPLACE FUNCTION public.next_program_items(p_user uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE items jsonb := '[]'::jsonb; r record;
BEGIN
  IF module_visible_for('/allah-names', p_user) THEN
    SELECT a.id::text AS id, 'Nom n° ' || a.display_order || COALESCE(' · ' || NULLIF(a.transliteration, ''), '') AS detail INTO r FROM allah_names a
      WHERE NOT EXISTS (SELECT 1 FROM user_allah_name_progress u WHERE u.user_id = p_user AND u.name_id = a.id AND u.is_validated)
      ORDER BY a.display_order LIMIT 1;
    IF FOUND THEN items := items || jsonb_build_object('module','allah_names','item_id',r.id,'label','99 Noms','detail',r.detail,'path','/allah-names','emoji','🌟'); END IF;
  END IF;
  RETURN items;
END $function$;

CREATE OR REPLACE FUNCTION public.generate_weekly_programs(p_week date)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE s record; it jsonb; last_idx smallint; idx smallint; n integer := 0; excluded uuid[];
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Réservé à l''enseignante'; END IF;
  SELECT disabled_group_ids INTO excluded FROM weekly_program_settings WHERE id = 1;
  FOR s IN SELECT p.user_id FROM profiles p
    WHERE p.is_approved AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'admin')
      AND NOT EXISTS (SELECT 1 FROM student_group_members g WHERE g.user_id = p.user_id AND g.group_id = ANY(COALESCE(excluded, '{}')))
  LOOP
    it := next_program_items(s.user_id);
    SELECT w.message_index INTO last_idx FROM weekly_programs w WHERE w.student_id = s.user_id ORDER BY week_start DESC LIMIT 1;
    idx := floor(random() * 24)::smallint;
    IF idx = last_idx THEN idx := ((idx + 1) % 24)::smallint; END IF; -- jamais le même message 2 semaines de suite
    INSERT INTO weekly_programs (student_id, week_start, items, message_index) VALUES (s.user_id, p_week, it, idx)
      ON CONFLICT (student_id, week_start) DO NOTHING;
    IF FOUND THEN n := n + 1; END IF;
  END LOOP;
  RETURN n;
END $function$;

CREATE OR REPLACE FUNCTION public.student_engagement()
 RETURNS TABLE(student_id uuid, full_name text, gender text, joined_at timestamp with time zone, last_validation timestamp with time zone, missed_streak integer, weeks jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE current_week date;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Réservé à l''enseignante'; END IF;
  SELECT max(w.week_start) INTO current_week FROM weekly_programs w;
  RETURN QUERY
  WITH st AS (
    SELECT p.user_id, p.full_name, p.gender, p.created_at FROM profiles p
    WHERE p.is_approved AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'admin')
  ),
  last_val AS (
    SELECT x.uid, max(x.at) AS at FROM (
      SELECT user_id AS uid, COALESCE(validated_at, created_at) AS at FROM user_sourate_progress WHERE is_validated
      UNION ALL SELECT user_id, COALESCE(completed_at, created_at) FROM user_nourania_progress WHERE is_validated
      UNION ALL SELECT user_id, COALESCE(completed_at, created_at) FROM user_alphabet_progress WHERE is_validated
      UNION ALL SELECT user_id, COALESCE(completed_at, updated_at, created_at) FROM user_invocation_progress WHERE is_validated
      UNION ALL SELECT user_id, validated_at FROM user_allah_name_progress WHERE is_validated
      UNION ALL SELECT user_id, COALESCE(completed_at, created_at) FROM user_prayer_progress WHERE is_validated
    ) x GROUP BY x.uid
  ),
  wk AS (
    SELECT w.student_id, w.week_start,
      jsonb_array_length(program_items(w.student_id, w.week_start, w.items)) AS total,
      (SELECT count(*) FROM jsonb_array_elements(program_items(w.student_id, w.week_start, w.items)) it WHERE program_item_done(w.student_id, it->>'module', it->>'item_id'))::int AS done
    FROM weekly_programs w WHERE w.week_start >= current_date - 70
  )
  SELECT st.user_id, st.full_name, st.gender, st.created_at, lv.at,
    -- semaines passées (pas celle en cours) d'affilée sans aucun diamant, en partant de la plus récente
    (SELECT count(*)::int FROM (
       SELECT wk.done, row_number() OVER (ORDER BY wk.week_start DESC) AS rn,
              sum(CASE WHEN wk.done > 0 THEN 1 ELSE 0 END) OVER (ORDER BY wk.week_start DESC) AS seen_ok
       FROM wk WHERE wk.student_id = st.user_id AND wk.week_start < current_week AND wk.total > 0
     ) z WHERE z.seen_ok = 0),
    COALESCE((SELECT jsonb_agg(jsonb_build_object('week', wk.week_start, 'total', wk.total, 'done', wk.done) ORDER BY wk.week_start DESC)
              FROM wk WHERE wk.student_id = st.user_id), '[]'::jsonb)
  FROM st LEFT JOIN last_val lv ON lv.uid = st.user_id;
END $function$;
