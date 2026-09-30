-- Espace parents réglable par élève + fiche élève (réglages de notifications visibles par l'admin) — Nadia, 2026-09-30
CREATE TABLE IF NOT EXISTS public.parent_lock_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'auto' CHECK (mode IN ('auto', 'on', 'off')), -- auto = selon l'âge (moins de 12 ans)
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.parent_lock_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_or_admin_read_parent_lock" ON public.parent_lock_settings;
CREATE POLICY "own_or_admin_read_parent_lock" ON public.parent_lock_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));
-- Seule l'enseignante décide (un enfant ne peut pas retirer son propre verrou)
DROP POLICY IF EXISTS "admin_write_parent_lock" ON public.parent_lock_settings;
CREATE POLICY "admin_write_parent_lock" ON public.parent_lock_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- L'admin peut consulter les réglages de notifications des élèves (lecture seule)
DROP POLICY IF EXISTS "Admins can view all notification prefs" ON public.notification_preferences;
CREATE POLICY "Admins can view all notification prefs" ON public.notification_preferences
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
