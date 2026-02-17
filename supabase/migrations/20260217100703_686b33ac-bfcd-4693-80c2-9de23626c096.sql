
-- Create nourania_validation_requests table (same pattern as sourate_validation_requests)
CREATE TABLE public.nourania_validation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id INTEGER NOT NULL REFERENCES public.nourania_lessons(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Enable RLS
ALTER TABLE public.nourania_validation_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create nourania validation requests"
ON public.nourania_validation_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own nourania validation requests"
ON public.nourania_validation_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all nourania validation requests"
ON public.nourania_validation_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update nourania validation requests"
ON public.nourania_validation_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete nourania validation requests"
ON public.nourania_validation_requests FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.nourania_validation_requests;
