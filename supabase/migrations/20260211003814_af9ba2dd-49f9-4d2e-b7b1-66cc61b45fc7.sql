
-- Create storage bucket for sourate content
INSERT INTO storage.buckets (id, name, public) VALUES ('sourate-content', 'sourate-content', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sourate-content bucket
CREATE POLICY "Anyone can view sourate content files"
ON storage.objects FOR SELECT
USING (bucket_id = 'sourate-content');

CREATE POLICY "Admins can upload sourate content"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sourate-content' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update sourate content"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sourate-content' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete sourate content"
ON storage.objects FOR DELETE
USING (bucket_id = 'sourate-content' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Table for admin-uploaded content per sourate (videos, PDFs, images)
CREATE TABLE public.sourate_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sourate_id integer NOT NULL REFERENCES public.sourates(id),
  content_type text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sourate_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sourate content"
ON public.sourate_content FOR SELECT
USING (true);

CREATE POLICY "Admins can insert sourate content"
ON public.sourate_content FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update sourate content"
ON public.sourate_content FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete sourate content"
ON public.sourate_content FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Table for verse-by-verse progress tracking
CREATE TABLE public.user_sourate_verse_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  sourate_id integer NOT NULL REFERENCES public.sourates(id),
  verse_number integer NOT NULL,
  is_validated boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, sourate_id, verse_number)
);

ALTER TABLE public.user_sourate_verse_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own verse progress"
ON public.user_sourate_verse_progress FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verse progress"
ON public.user_sourate_verse_progress FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Table for admin-unlocked sourates (per user)
CREATE TABLE public.sourate_admin_unlocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  sourate_id integer NOT NULL REFERENCES public.sourates(id),
  unlocked_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, sourate_id)
);

ALTER TABLE public.sourate_admin_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sourate unlocks"
ON public.sourate_admin_unlocks FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can view their own unlocks"
ON public.sourate_admin_unlocks FOR SELECT
USING (auth.uid() = user_id);

-- Add trigger for updated_at on verse progress
CREATE TRIGGER update_user_sourate_verse_progress_updated_at
BEFORE UPDATE ON public.user_sourate_verse_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
