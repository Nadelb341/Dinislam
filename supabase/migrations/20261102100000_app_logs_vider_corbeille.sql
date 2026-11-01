-- 🗑️ « Vider les logs » du Monitoring (2026-11-02) : avant, le bouton ne faisait rien (aucune règle DELETE),
-- et s'il avait marché il aurait effacé sans corbeille. Désormais : l'admin peut effacer les journaux
-- (après copie dans la corbeille, faite par l'appli) et les remettre depuis la corbeille.
DROP POLICY IF EXISTS "Admins can delete app_logs" ON public.app_logs;
CREATE POLICY "Admins can delete app_logs" ON public.app_logs
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can restore app_logs" ON public.app_logs;
CREATE POLICY "Admins can restore app_logs" ON public.app_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
