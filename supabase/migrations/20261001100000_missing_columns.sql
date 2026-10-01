-- Colonnes utilisées par le code mais absentes de la base (découvertes au nettoyage du 2026-10-01) :
-- - profiles.prayer_group : groupe de prière choisi par l'enseignante (migration du 2026-03-02 jamais présente en base)
--   → l'écran « Groupes de prière » et le filtre des cartes de prière ne pouvaient pas fonctionner.
-- - student_groups.position : ordre des groupes d'élèves (glisser-déposer) → l'ordre n'était jamais enregistré.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prayer_group text DEFAULT NULL;
ALTER TABLE public.student_groups ADD COLUMN IF NOT EXISTS position integer;
