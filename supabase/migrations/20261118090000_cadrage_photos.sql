-- 📐 Cadrage des photos dans leur emplacement (règle commune de Nadia du 2026-11-04, appliquée à Dinislam le 2026-11-18) :
-- { "<emplacement>": { "x": 0-100, "y": 0-100, "zoom": 1-3 } } ; la photo elle-même n'est jamais modifiée.
ALTER TABLE public.allah_names ADD COLUMN IF NOT EXISTS image_cadrage jsonb;
ALTER TABLE public.prayer_cards ADD COLUMN IF NOT EXISTS image_cadrage jsonb;
