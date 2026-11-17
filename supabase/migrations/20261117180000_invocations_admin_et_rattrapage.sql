-- 🤲 Bug trouvé le 2026-11-17 (contrôle complet demandé par Nadia) : AUCUNE règle ne permettait à l'enseignante d'écrire
-- dans user_invocation_progress → « ✅ Valider » une invocation marquait la demande « approuvée » mais la validation de l'élève
-- était refusée en silence (Jade et Kenzo, 15/11 : invocation 1 acceptée, jamais validée, 0 point). Même règle que les autres tables.
DROP POLICY IF EXISTS "Admins can manage all invocation progress" ON public.user_invocation_progress;
CREATE POLICY "Admins can manage all invocation progress" ON public.user_invocation_progress
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Rattrapage : toute demande ACCEPTÉE (la plus récente pour cet élément) doit être validée chez l'élève
INSERT INTO public.user_invocation_progress (user_id, invocation_id, is_validated, is_memorized, is_completed, completed_at)
SELECT DISTINCT ON (r.user_id, r.invocation_id) r.user_id, r.invocation_id, true, true, true, r.reviewed_at
  FROM public.invocation_validation_requests r
 WHERE r.status = 'approved'
   AND NOT EXISTS (SELECT 1 FROM public.user_invocation_progress p WHERE p.user_id = r.user_id AND p.invocation_id = r.invocation_id)
   AND NOT EXISTS (SELECT 1 FROM public.invocation_validation_requests r2 WHERE r2.user_id = r.user_id AND r2.invocation_id = r.invocation_id AND r2.created_at > r.created_at)
 ORDER BY r.user_id, r.invocation_id, r.created_at DESC;
UPDATE public.user_invocation_progress p SET is_validated = true, is_memorized = true
  FROM public.invocation_validation_requests r
 WHERE r.user_id = p.user_id AND r.invocation_id = p.invocation_id AND r.status = 'approved' AND NOT p.is_validated
   AND NOT EXISTS (SELECT 1 FROM public.invocation_validation_requests r2 WHERE r2.user_id = r.user_id AND r2.invocation_id = r.invocation_id AND r2.created_at > r.created_at);

-- Même rattrapage pour les sourates et les leçons Nourania (demande acceptée, la plus récente, mais pas validée)
UPDATE public.user_sourate_progress p SET is_validated = true, is_memorized = true, progress_percentage = 100, validated_at = COALESCE(p.validated_at, r.reviewed_at)
  FROM public.sourate_validation_requests r
 WHERE r.user_id = p.user_id AND r.sourate_id = p.sourate_id AND p.context = 'sourates' AND r.status = 'approved' AND NOT p.is_validated
   AND NOT EXISTS (SELECT 1 FROM public.sourate_validation_requests r2 WHERE r2.user_id = r.user_id AND r2.sourate_id = r.sourate_id AND r2.created_at > r.created_at);
UPDATE public.user_nourania_progress p SET is_validated = true, is_completed = true, progress_percentage = 100
  FROM public.nourania_validation_requests r
 WHERE r.user_id = p.user_id AND r.lesson_id = p.lesson_id AND r.status = 'approved' AND NOT p.is_validated
   AND NOT EXISTS (SELECT 1 FROM public.nourania_validation_requests r2 WHERE r2.user_id = r.user_id AND r2.lesson_id = r.lesson_id AND r2.created_at > r.created_at);
