-- Create prayer_categories table for the Prière section
CREATE TABLE public.prayer_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_arabic TEXT NOT NULL,
  name_french TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Hand',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prayer_content table for content within each category
CREATE TABLE public.prayer_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.prayer_categories(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('pdf', 'video', 'text')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_prayer_progress table for tracking validation
CREATE TABLE public.user_prayer_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.prayer_categories(id) ON DELETE CASCADE,
  is_validated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Enable RLS
ALTER TABLE public.prayer_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_prayer_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prayer_categories
CREATE POLICY "Anyone can read prayer categories" 
ON public.prayer_categories FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage prayer categories" 
ON public.prayer_categories FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for prayer_content
CREATE POLICY "Anyone can read prayer content" 
ON public.prayer_content FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage prayer content" 
ON public.prayer_content FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_prayer_progress
CREATE POLICY "Users manage their own prayer progress" 
ON public.user_prayer_progress FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all prayer progress" 
ON public.user_prayer_progress FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Insert the 8 default prayer categories
INSERT INTO public.prayer_categories (name_arabic, name_french, display_order, is_default, icon) VALUES
  ('الوضوء الأصغر', 'Petites ablutions', 1, true, 'Droplets'),
  ('الوضوء الأكبر', 'Grandes ablutions', 2, true, 'Waves'),
  ('صلاة الصبح', 'Prière Sobh', 3, true, 'Sunrise'),
  ('صلاة الظهر', 'Prière Dhor', 4, true, 'Sun'),
  ('صلاة العصر', 'Prière Asr', 5, true, 'CloudSun'),
  ('صلاة المغرب', 'Prière Maghreb', 6, true, 'Sunset'),
  ('صلاة العشاء', 'Prière Isha', 7, true, 'Moon'),
  ('مراحل الصلاة', 'Les étapes de la prière', 8, true, 'BookOpen');

-- Add trigger for updated_at
CREATE TRIGGER update_prayer_categories_updated_at
BEFORE UPDATE ON public.prayer_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prayer_content_updated_at
BEFORE UPDATE ON public.prayer_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_prayer_progress_updated_at
BEFORE UPDATE ON public.user_prayer_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();