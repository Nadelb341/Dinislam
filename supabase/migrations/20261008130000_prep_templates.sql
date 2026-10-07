-- Modèles prêts pour « 📚 Devoirs à préparer » (idée 4 acceptée par Nadia, 2026-10-08) — modifiables / supprimables (corbeille)
INSERT INTO public.admin_task_templates (title, next_course, to_bring, to_prepare, created_by)
SELECT t, false, false, true, '849384ad-e6ec-4ec4-b17a-ec51129ce50e'
FROM unnest(ARRAY[
  'Fiche à colorier',
  'Écrire les lettres vues en cours',
  'Réciter la sourate vue en cours',
  'Lire la leçon de Nourania',
  'Apprendre les mots de vocabulaire vus en cours'
]) AS t
WHERE NOT EXISTS (SELECT 1 FROM public.admin_task_templates x WHERE x.title = t AND x.to_prepare);
