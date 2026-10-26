-- 🎁 Trésor (+10 points) et 🌟 diamant bonus (+5 points) au classement (demande de Nadia, 2026-10-26).
-- Les récompenses sont vérifiées par la base (fonction claim_program_reward) : impossible de tricher depuis l'appli.

CREATE TABLE IF NOT EXISTS public.program_rewards (
  program_id uuid NOT NULL REFERENCES public.weekly_programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('tresor', 'bonus')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (program_id, kind)
);
ALTER TABLE public.program_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_own_program_rewards" ON public.program_rewards;
CREATE POLICY "read_own_program_rewards" ON public.program_rewards FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "admin_insert_program_rewards" ON public.program_rewards;
CREATE POLICY "admin_insert_program_rewards" ON public.program_rewards FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'program_rewards') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.program_rewards;
  END IF;
END $$;
DROP TRIGGER IF EXISTS recalculate_points ON public.program_rewards;
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE ON public.program_rewards
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_points();

INSERT INTO public.point_settings (action_key, label, points, is_active)
SELECT 'tresor_ouvert', '🎁 Trésor de la semaine ouvert', 10, true
WHERE NOT EXISTS (SELECT 1 FROM public.point_settings WHERE action_key = 'tresor_ouvert');
INSERT INTO public.point_settings (action_key, label, points, is_active)
SELECT 'bonus_semaine', '🌟 Diamant bonus (tout fait avant le cours)', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.point_settings WHERE action_key = 'bonus_semaine');

CREATE OR REPLACE FUNCTION public.recalculate_student_points(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total INTEGER := 0;
  n INTEGER;
  pts INTEGER;
  r RECORD;
BEGIN
  -- Pour chaque ligne du barème : nombre d'actions de l'élève × points (0 si la ligne est désactivée)
  FOR r IN SELECT action_key, CASE WHEN is_active THEN points ELSE 0 END AS p FROM point_settings LOOP
    n := 0;
    CASE r.action_key
      WHEN 'sourate_validee' THEN SELECT COUNT(*) INTO n FROM user_sourate_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'nourania_lecon_validee' THEN SELECT COUNT(*) INTO n FROM user_nourania_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'invocation_vue' THEN SELECT COUNT(*) INTO n FROM user_invocation_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'alphabet_lettre_apprise' THEN SELECT COUNT(*) INTO n FROM user_alphabet_progress WHERE user_id = p_user_id AND is_validated;
      -- Jeux de l'Alphabet : seule la meilleure partie de chaque jeu et de chaque jour compte
      WHEN 'alphabet_bonne_reponse' THEN SELECT COALESCE(SUM(best), 0) INTO n FROM (SELECT MAX(score) AS best FROM alphabet_game_scores WHERE user_id = p_user_id GROUP BY game, played_on) b;
      WHEN 'devoir_rendu' THEN SELECT COUNT(*) INTO n FROM devoirs_rendus WHERE student_id = p_user_id;
      WHEN 'devoir_corrige' THEN SELECT COUNT(*) INTO n FROM devoirs_rendus WHERE student_id = p_user_id AND statut = 'corrige';
      WHEN 'presence_marquee' THEN SELECT COUNT(*) INTO n FROM attendance_records WHERE user_id = p_user_id AND status IN ('present', 'late');
      WHEN 'priere_validee' THEN SELECT COUNT(*) INTO n FROM user_prayer_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'jeune_marque' THEN SELECT COUNT(*) INTO n FROM user_ramadan_fasting WHERE user_id = p_user_id AND COALESCE(has_fasted, is_fasting, false);
      WHEN 'quiz_reussi' THEN SELECT COUNT(*) INTO n FROM user_ramadan_progress WHERE user_id = p_user_id AND quiz_completed;
      WHEN 'ramadan_jour_complete' THEN SELECT COUNT(*) INTO n FROM user_ramadan_progress WHERE user_id = p_user_id AND is_completed;
      WHEN 'message_envoye' THEN SELECT COUNT(*) INTO n FROM user_messages WHERE sender_id = p_user_id AND deleted_at IS NULL;
      WHEN 'vocabulaire_appris' THEN SELECT COUNT(*) INTO n FROM user_flashcard_learned WHERE user_id = p_user_id;
      -- Chemin de la semaine (2026-10-26) : trésor ouvert (+10) et diamant bonus (+5)
      WHEN 'tresor_ouvert' THEN SELECT COUNT(*) INTO n FROM program_rewards WHERE user_id = p_user_id AND kind = 'tresor';
      WHEN 'bonus_semaine' THEN SELECT COUNT(*) INTO n FROM program_rewards WHERE user_id = p_user_id AND kind = 'bonus';
      ELSE n := 0;
    END CASE;
    total := total + COALESCE(n, 0) * COALESCE(r.p, 0);
  END LOOP;

  INSERT INTO student_ranking (user_id, total_points, updated_at)
  VALUES (p_user_id, total, now())
  ON CONFLICT (user_id) DO UPDATE SET total_points = total, updated_at = now();

  UPDATE profiles SET points = total WHERE user_id = p_user_id;
END;
$function$;

-- Date de création de chaque devoir dans son diamant (pour la date limite du bonus)
CREATE OR REPLACE FUNCTION public.program_items(p_user uuid, p_week date, p_stored jsonb)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT jsonb_agg(it) FROM jsonb_array_elements(COALESCE(p_stored, '[]'::jsonb)) it WHERE it->>'module' = 'allah_names'), '[]'::jsonb)
      || COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'module', 'devoir', 'item_id', d.id::text, 'label', d.titre,
          'detail', CASE d.type WHEN 'sourate' THEN 'Sourate' WHEN 'recitation' THEN 'Récitation' WHEN 'nourania' THEN 'Nourania' WHEN 'allah_names' THEN '99 noms' WHEN 'alphabet' THEN 'Alphabet' WHEN 'invocations' THEN 'Invocation' WHEN 'priere' THEN 'Prière' WHEN 'coran' THEN 'Coran' ELSE 'Devoir' END
                    || COALESCE(' · pour le ' || to_char(d.date_limite AT TIME ZONE 'Europe/Paris', 'DD/MM'), ''),
          'path', '/?open=devoirs#devoir-' || d.id::text,
          'emoji', CASE d.type WHEN 'sourate' THEN '📖' WHEN 'recitation' THEN '🎙️' WHEN 'nourania' THEN '✨' WHEN 'allah_names' THEN '🌟' WHEN 'alphabet' THEN '🔤' WHEN 'invocations' THEN '🤲' WHEN 'priere' THEN '🕌' WHEN 'coran' THEN '📗' ELSE '📚' END,
          'steps_total', jsonb_array_length(d.etapes),
          'created_at', d.created_at
        ) ORDER BY d.created_at)
        FROM devoirs d
        WHERE (d.assigned_to = 'all' OR d.student_id = p_user
               OR (d.group_id IS NOT NULL AND d.group_id IN (SELECT g.group_id FROM student_group_members g WHERE g.user_id = p_user)))
          AND (
            -- la semaine dure jusqu'à la création de la suivante (vacances : pas de nouvelle semaine, les devoirs s'ajoutent quand même)
            (d.created_at >= p_week AND d.created_at < COALESCE((SELECT min(w2.week_start) FROM weekly_programs w2 WHERE w2.student_id = p_user AND w2.week_start > p_week), 'infinity'::date))
            -- Devoir obligatoire (2026-10-26) : donné à partir du 26/10/2026 et pas fait = il reste sur le chemin jusqu'à ce qu'il
            -- soit fait, même après sa date (seulement depuis l'arrivée de l'élève)
            OR (d.created_at < p_week AND d.created_at >= '2026-10-26'::date
                AND d.created_at >= COALESCE((SELECT pr.created_at FROM profiles pr WHERE pr.user_id = p_user), '-infinity'::timestamptz)
                AND NOT program_item_done(p_user, 'devoir', d.id::text))
            -- Devoirs plus anciens : règle d'avant (30 jours, pas expirés)
            OR (d.created_at < p_week AND d.created_at < '2026-10-26'::date AND d.created_at >= p_week - 30
                AND (d.date_limite IS NULL OR d.date_limite >= p_week)
                AND NOT program_item_done(p_user, 'devoir', d.id::text))
          )
      ), '[]'::jsonb);
$function$;

-- Jour du cours pour le bonus : le premier mercredi après le dernier devoir donné (ou après le début de la semaine)
CREATE OR REPLACE FUNCTION public.program_deadline(p_week date, p_items jsonb)
 RETURNS date LANGUAGE sql IMMUTABLE
AS $function$
  WITH base AS (
    SELECT GREATEST(p_week, COALESCE((SELECT max((it->>'created_at')::timestamptz AT TIME ZONE 'Europe/Paris')::date
      FROM jsonb_array_elements(p_items) it WHERE it ? 'created_at'), p_week)) AS d
  )
  SELECT (d + ((3 - extract(isodow FROM d)::int + 7) % 7) + CASE WHEN extract(isodow FROM d)::int = 3 THEN 7 ELSE 0 END)::date FROM base;
$function$;

-- Réclamer une récompense : la base vérifie que tous les diamants brillent (et, pour le bonus, avant le jour du cours)
CREATE OR REPLACE FUNCTION public.claim_program_reward(p_kind text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE w record; it jsonb; items jsonb; all_done boolean; deadline date; late boolean;
BEGIN
  IF p_kind NOT IN ('tresor', 'bonus') THEN RETURN false; END IF;
  SELECT * INTO w FROM weekly_programs WHERE student_id = auth.uid() ORDER BY week_start DESC LIMIT 1;
  IF NOT FOUND THEN RETURN false; END IF;
  items := program_items(w.student_id, w.week_start, w.items);
  IF jsonb_array_length(items) = 0 THEN RETURN false; END IF;
  SELECT bool_and(program_item_done(w.student_id, x->>'module', x->>'item_id')) INTO all_done FROM jsonb_array_elements(items) x;
  IF NOT all_done THEN RETURN false; END IF;
  IF p_kind = 'bonus' THEN
    deadline := program_deadline(w.week_start, items);
    SELECT bool_or((program_item_done_at(w.student_id, x->>'module', x->>'item_id') AT TIME ZONE 'Europe/Paris')::date >= deadline) INTO late
      FROM jsonb_array_elements(items) x;
    IF COALESCE(late, false) THEN RETURN false; END IF;
  END IF;
  INSERT INTO program_rewards (program_id, user_id, kind) VALUES (w.id, w.student_id, p_kind) ON CONFLICT DO NOTHING;
  RETURN true;
END $function$;
