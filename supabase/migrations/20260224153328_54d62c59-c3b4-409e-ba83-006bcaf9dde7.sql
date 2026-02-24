
-- Create ramadan_day_activities table
CREATE TABLE public.ramadan_day_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id INTEGER NOT NULL REFERENCES public.ramadan_days(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('document', 'video', 'audio')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ramadan_day_activities ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage ramadan day activities"
ON public.ramadan_day_activities FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Anyone can read
CREATE POLICY "Anyone can read ramadan day activities"
ON public.ramadan_day_activities FOR SELECT
USING (true);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('ramadan-activities', 'ramadan-activities', true);

-- Storage policies
CREATE POLICY "Admin can upload ramadan activities"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ramadan-activities' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admin can delete ramadan activities"
ON storage.objects FOR DELETE
USING (bucket_id = 'ramadan-activities' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Anyone can view ramadan activities"
ON storage.objects FOR SELECT
USING (bucket_id = 'ramadan-activities');
