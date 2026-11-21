-- ✏️ « Modifier la carte » (2026-11-21) : l'image d'une carte de l'accueil peut être cadrée (comme les 99 noms et la Prière).
alter table public.learning_modules add column if not exists image_cadrage jsonb;
