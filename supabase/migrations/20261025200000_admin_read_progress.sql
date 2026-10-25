-- L'enseignante (admin) lit la progression des élèves : avant, seules des règles « own » → 0 prière validée
-- dans le tableau de bord et les fiches élèves (2026-10-25). Lecture seule, aucun droit d'écriture ajouté.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['user_prayer_progress', 'user_daily_prayers', 'user_sourate_verse_progress', 'user_ramadan_fasting'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t AND policyname = 'Admin can view all ' || t) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (has_role(auth.uid(), ''admin''::app_role))', 'Admin can view all ' || t, t);
    END IF;
  END LOOP;
END $$;
