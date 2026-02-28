
-- Add date_of_birth and dob_set_by_user to profiles, keep age for backward compat
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob_set_by_user boolean NOT NULL DEFAULT false;
