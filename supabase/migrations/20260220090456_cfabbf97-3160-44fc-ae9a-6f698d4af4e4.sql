
-- Table to track daily prayer checks (5 prayers per day)
CREATE TABLE IF NOT EXISTS public.user_daily_prayers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  prayer_name TEXT NOT NULL, -- 'sobh', 'dhuhr', 'asr', 'maghrib', 'isha'
  is_checked BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, prayer_name)
);

ALTER TABLE public.user_daily_prayers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily prayers"
ON public.user_daily_prayers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily prayers"
ON public.user_daily_prayers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily prayers"
ON public.user_daily_prayers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily prayers"
ON public.user_daily_prayers FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all daily prayers"
ON public.user_daily_prayers FOR SELECT
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TRIGGER update_user_daily_prayers_updated_at
BEFORE UPDATE ON public.user_daily_prayers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
