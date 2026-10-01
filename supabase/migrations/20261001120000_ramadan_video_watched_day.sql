-- Vidéos du Ramadan « regardées » : le code enregistre et filtre par day_id, colonne absente de la base
-- (découvert au nettoyage du 2026-10-01) → aucune vidéo regardée n'était jamais enregistrée.
ALTER TABLE public.user_ramadan_video_watched ADD COLUMN IF NOT EXISTS day_id uuid REFERENCES public.ramadan_days(id) ON DELETE CASCADE;
