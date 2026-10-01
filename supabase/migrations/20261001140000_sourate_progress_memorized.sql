-- Sourate entièrement mémorisée (pages Sourates et Coran) : le code enregistre is_memorized dans
-- user_sourate_progress, colonne absente (découvert au nettoyage du 2026-10-01) → l'enregistrement échouait.
ALTER TABLE public.user_sourate_progress ADD COLUMN IF NOT EXISTS is_memorized boolean NOT NULL DEFAULT false;
