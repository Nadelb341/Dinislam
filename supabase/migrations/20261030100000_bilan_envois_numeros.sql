-- 📱 Numéros des parents dans la fiche (idée 5, 2026-10-30) + WhatsApp / SMS dans l'historique des envois
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_phone_nom text;   -- ex. « Maman » pour profiles.parent_phone
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent2_phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent2_phone_nom text;  -- ex. « Papa »
ALTER TABLE public.bilan_envois DROP CONSTRAINT IF EXISTS bilan_envois_canal_check;
ALTER TABLE public.bilan_envois ADD CONSTRAINT bilan_envois_canal_check CHECK (canal IN ('partage', 'telechargement', 'copie', 'whatsapp', 'sms', 'relance'));
