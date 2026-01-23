-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

-- Create sourates table (114 surahs)
CREATE TABLE public.sourates (
    id SERIAL PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE,
    name_arabic TEXT NOT NULL,
    name_french TEXT NOT NULL,
    audio_url TEXT,
    verses_count INTEGER NOT NULL DEFAULT 0,
    revelation_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_sourate_progress table
CREATE TABLE public.user_sourate_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sourate_id INTEGER REFERENCES public.sourates(id) ON DELETE CASCADE NOT NULL,
    is_validated BOOLEAN NOT NULL DEFAULT false,
    is_memorized BOOLEAN NOT NULL DEFAULT false,
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    last_practiced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, sourate_id)
);

-- Create invocations table
CREATE TABLE public.invocations (
    id SERIAL PRIMARY KEY,
    title_arabic TEXT NOT NULL,
    title_french TEXT NOT NULL,
    content_arabic TEXT,
    content_french TEXT,
    audio_url TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_invocation_progress table
CREATE TABLE public.user_invocation_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invocation_id INTEGER REFERENCES public.invocations(id) ON DELETE CASCADE NOT NULL,
    is_validated BOOLEAN NOT NULL DEFAULT false,
    is_memorized BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, invocation_id)
);

-- Create nourania_lessons table (17 lessons)
CREATE TABLE public.nourania_lessons (
    id SERIAL PRIMARY KEY,
    lesson_number INTEGER NOT NULL UNIQUE,
    title_arabic TEXT NOT NULL,
    title_french TEXT NOT NULL,
    description TEXT,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_nourania_progress table
CREATE TABLE public.user_nourania_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lesson_id INTEGER REFERENCES public.nourania_lessons(id) ON DELETE CASCADE NOT NULL,
    is_validated BOOLEAN NOT NULL DEFAULT false,
    is_memorized BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, lesson_id)
);

-- Create alphabet_letters table (28 letters)
CREATE TABLE public.alphabet_letters (
    id SERIAL PRIMARY KEY,
    letter_arabic TEXT NOT NULL,
    name_arabic TEXT NOT NULL,
    name_french TEXT NOT NULL,
    audio_url TEXT,
    position_initial TEXT,
    position_medial TEXT,
    position_final TEXT,
    position_isolated TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_alphabet_progress table
CREATE TABLE public.user_alphabet_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    letter_id INTEGER REFERENCES public.alphabet_letters(id) ON DELETE CASCADE NOT NULL,
    is_validated BOOLEAN NOT NULL DEFAULT false,
    quiz_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, letter_id)
);

-- Create ramadan_days table (30 days)
CREATE TABLE public.ramadan_days (
    id SERIAL PRIMARY KEY,
    day_number INTEGER NOT NULL UNIQUE,
    video_url TEXT,
    pdf_url TEXT,
    theme TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ramadan_quizzes table
CREATE TABLE public.ramadan_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id INTEGER REFERENCES public.ramadan_days(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    correct_option INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_responses table (for real-time polling)
CREATE TABLE public.quiz_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.ramadan_quizzes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    selected_option INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(quiz_id, user_id)
);

-- Create user_ramadan_progress table
CREATE TABLE public.user_ramadan_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    day_id INTEGER REFERENCES public.ramadan_days(id) ON DELETE CASCADE NOT NULL,
    video_watched BOOLEAN NOT NULL DEFAULT false,
    quiz_completed BOOLEAN NOT NULL DEFAULT false,
    pdf_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, day_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sourate_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invocation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nourania_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_nourania_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alphabet_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alphabet_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ramadan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ramadan_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ramadan_progress ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles (only admin can manage roles)
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for content tables (public read, admin write)
CREATE POLICY "Anyone can read sourates" ON public.sourates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage sourates" ON public.sourates FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read invocations" ON public.invocations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage invocations" ON public.invocations FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read nourania lessons" ON public.nourania_lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage nourania lessons" ON public.nourania_lessons FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read alphabet letters" ON public.alphabet_letters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage alphabet letters" ON public.alphabet_letters FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read ramadan days" ON public.ramadan_days FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage ramadan days" ON public.ramadan_days FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read quizzes" ON public.ramadan_quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage quizzes" ON public.ramadan_quizzes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for progress tables (users manage their own)
CREATE POLICY "Users manage their own sourate progress" ON public.user_sourate_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sourate progress" ON public.user_sourate_progress FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users manage their own invocation progress" ON public.user_invocation_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all invocation progress" ON public.user_invocation_progress FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users manage their own nourania progress" ON public.user_nourania_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all nourania progress" ON public.user_nourania_progress FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users manage their own alphabet progress" ON public.user_alphabet_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all alphabet progress" ON public.user_alphabet_progress FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users manage their own ramadan progress" ON public.user_ramadan_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all ramadan progress" ON public.user_ramadan_progress FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for quiz responses
CREATE POLICY "Users can submit quiz responses" ON public.quiz_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own responses" ON public.quiz_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view response counts" ON public.quiz_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can view all responses" ON public.quiz_responses FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_sourate_progress_updated_at BEFORE UPDATE ON public.user_sourate_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_invocation_progress_updated_at BEFORE UPDATE ON public.user_invocation_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_nourania_progress_updated_at BEFORE UPDATE ON public.user_nourania_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_alphabet_progress_updated_at BEFORE UPDATE ON public.user_alphabet_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_ramadan_progress_updated_at BEFORE UPDATE ON public.user_ramadan_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ramadan_days_updated_at BEFORE UPDATE ON public.ramadan_days FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for quiz responses (for live polling)
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_responses;