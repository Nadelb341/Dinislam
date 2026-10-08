-- Suivi des élèves qui décrochent (idée 2 + demande de Nadia, 2026-10-08) — enseignante seulement
-- Pour chaque élève : dernière validation (toutes cartes), historique des chemins de la semaine (fait / total),
-- nombre de semaines PASSÉES d'affilée sans aucun diamant (orange = 1, rouge = 2 ou plus).
CREATE OR REPLACE FUNCTION public.student_engagement()
RETURNS TABLE(student_id uuid, full_name text, gender text, joined_at timestamptz, last_validation timestamptz, missed_streak integer, weeks jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
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
      jsonb_array_length(w.items) AS total,
      (SELECT count(*) FROM jsonb_array_elements(w.items) it WHERE program_item_done(w.student_id, it->>'module', it->>'item_id'))::int AS done
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
END $$;
REVOKE ALL ON FUNCTION public.student_engagement() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.student_engagement() TO authenticated;
