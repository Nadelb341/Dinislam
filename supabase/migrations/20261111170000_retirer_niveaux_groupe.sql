-- 2026-11-11 — Devoirs élève par élève (choix de Nadia Q3-A : « tout supprimer, y compris l'écran Niveaux »).
-- Les niveaux d'un groupe ne servaient qu'à choisir les destinataires d'un devoir. Vérifié avant : 0 niveau,
-- 0 fonction SQL, 0 vue, 0 élément dans la corbeille → rien n'est perdu.
drop table if exists public.group_levels;
