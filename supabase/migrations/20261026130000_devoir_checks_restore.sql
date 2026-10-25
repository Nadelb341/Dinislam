-- Restaurer un devoir depuis la corbeille remet aussi les cases « J'ai travaillé ce devoir » des élèves (2026-10-26)
DROP POLICY IF EXISTS "admin_insert_devoir_checks" ON public.devoir_checks;
CREATE POLICY "admin_insert_devoir_checks" ON public.devoir_checks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
