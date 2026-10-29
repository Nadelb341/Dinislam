-- 🔧 Apparence de l'appli (2026-10-29, demande de Nadia) : réglages visuels partagés, modifiables seulement par l'enseignante
-- (ligne « titre » = le haut de l'accueil : icône, nom, traits, effets, textes d'accueil, couleurs du Ramadan)
CREATE TABLE IF NOT EXISTS public.app_appearance (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.app_appearance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_app_appearance ON public.app_appearance;
CREATE POLICY read_app_appearance ON public.app_appearance FOR SELECT USING (true);
DROP POLICY IF EXISTS admin_app_appearance ON public.app_appearance;
CREATE POLICY admin_app_appearance ON public.app_appearance FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'app_appearance') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_appearance;
  END IF;
END $$;
