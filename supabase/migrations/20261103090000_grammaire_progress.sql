-- 📖 Progression de la Grammaire gardée dans la base (avant : seulement dans le téléphone, localStorage)
-- lecon_at = leçon ouverte ; exercices_at = onglet Exercices ouvert.
-- Pas de clé étrangère en cascade : une carte mise à la corbeille puis restaurée retrouve la progression.
CREATE TABLE IF NOT EXISTS public.user_grammaire_progress (
  user_id uuid NOT NULL,
  card_id uuid NOT NULL,
  lecon_at timestamptz,
  exercices_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, card_id)
);
ALTER TABLE public.user_grammaire_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS own_grammaire_progress ON public.user_grammaire_progress;
CREATE POLICY own_grammaire_progress ON public.user_grammaire_progress FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS admin_read_grammaire_progress ON public.user_grammaire_progress;
CREATE POLICY admin_read_grammaire_progress ON public.user_grammaire_progress FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_grammaire_progress;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
