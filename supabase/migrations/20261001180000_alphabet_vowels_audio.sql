-- Deuxième audio par lettre : la lettre avec ses voyelles (ba, bi, bou), enregistré par l'enseignante
ALTER TABLE public.alphabet_letters ADD COLUMN IF NOT EXISTS audio_vowels_url text;
