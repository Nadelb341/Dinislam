-- Carte « À FAIRE » (2026-10-25) : documents, photos, vidéos… sur chaque ligne des 4 onglets
-- (Prochain cours, Devoirs à préparer, À apporter, Mémo). Carte réservée à l'enseignante → stockage privé.
ALTER TABLE public.admin_tasks ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-todo', 'admin-todo', false)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "admin_manage_admin_todo" ON storage.objects;
CREATE POLICY "admin_manage_admin_todo" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'admin-todo' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'admin-todo' AND public.has_role(auth.uid(), 'admin'::public.app_role));
