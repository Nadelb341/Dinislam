
-- Create updated_at helper function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Table sourate_recitations
CREATE TABLE public.sourate_recitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sourate_id UUID NOT NULL REFERENCES public.sourates(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  audio_url TEXT NOT NULL,
  student_comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_audio_url TEXT,
  admin_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sourate_recitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own recitations"
  ON public.sourate_recitations FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own recitations"
  ON public.sourate_recitations FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins full access on recitations"
  ON public.sourate_recitations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sourate_recitations_updated_at
  BEFORE UPDATE ON public.sourate_recitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket recitations (public, 50MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('recitations', 'recitations', true, 52428800);

CREATE POLICY "Public read recitations"
  ON storage.objects FOR SELECT USING (bucket_id = 'recitations');

CREATE POLICY "Auth users upload own recitations"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recitations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins manage recitations files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'recitations' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'recitations' AND public.has_role(auth.uid(), 'admin'::app_role));
