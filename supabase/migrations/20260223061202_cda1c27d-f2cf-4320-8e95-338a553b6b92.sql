-- Add audio_url column to homework_assignments for admin audio attachments
ALTER TABLE public.homework_assignments ADD COLUMN audio_url text DEFAULT NULL;
