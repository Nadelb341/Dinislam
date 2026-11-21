-- La vidéo du haut d'une particularité = sa 1re zone « vidéo » (supprimable → corbeille, comme les autres zones).
-- Les 2 colonnes créées juste avant (vides, jamais utilisées) sont retirées pour ne rien laisser d'orphelin.
alter table public.alphabet_particularites drop column if exists video_url;
alter table public.alphabet_particularites drop column if exists video_type;
