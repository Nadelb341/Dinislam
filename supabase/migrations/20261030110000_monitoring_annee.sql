-- 📈 Monitoring › « Santé de l'appli » : historique sur 12 mois, calculé par la base (2026-10-30). Réservé à l'enseignante.
CREATE OR REPLACE FUNCTION public.monitoring_annee()
RETURNS TABLE(mois date, inscriptions int, connexions int, actifs int, validations int, messages int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN QUERY
  WITH m AS (SELECT generate_series(date_trunc('month', now() AT TIME ZONE 'Europe/Paris') - interval '11 months',
                                    date_trunc('month', now() AT TIME ZONE 'Europe/Paris'), interval '1 month')::date AS mois)
  SELECT m.mois,
    (SELECT count(*)::int FROM profiles p WHERE date_trunc('month', p.created_at AT TIME ZONE 'Europe/Paris')::date = m.mois),
    (SELECT count(*)::int FROM connexion_logs c WHERE date_trunc('month', c.login_at AT TIME ZONE 'Europe/Paris')::date = m.mois),
    (SELECT count(DISTINCT c.user_id)::int FROM connexion_logs c WHERE date_trunc('month', c.login_at AT TIME ZONE 'Europe/Paris')::date = m.mois),
    ((SELECT count(*) FROM sourate_validation_requests v WHERE date_trunc('month', v.created_at AT TIME ZONE 'Europe/Paris')::date = m.mois)
     + (SELECT count(*) FROM nourania_validation_requests v WHERE date_trunc('month', v.created_at AT TIME ZONE 'Europe/Paris')::date = m.mois)
     + (SELECT count(*) FROM invocation_validation_requests v WHERE date_trunc('month', v.created_at AT TIME ZONE 'Europe/Paris')::date = m.mois)
     + (SELECT count(*) FROM sourate_recitations v WHERE date_trunc('month', v.created_at AT TIME ZONE 'Europe/Paris')::date = m.mois))::int,
    (SELECT count(*)::int FROM user_messages u WHERE date_trunc('month', u.created_at AT TIME ZONE 'Europe/Paris')::date = m.mois)
  FROM m ORDER BY m.mois;
END $$;
