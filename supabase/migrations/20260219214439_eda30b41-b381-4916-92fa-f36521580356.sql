
-- Add display_order and image_url columns to invocations table
ALTER TABLE public.invocations 
ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_url text;

-- Insert default invocations
INSERT INTO public.invocations (title_french, title_arabic, category, display_order) VALUES
('Matin', 'أذكار الصباح', 'quotidienne', 0),
('Soir', 'أذكار المساء', 'quotidienne', 1),
('Nuit', 'أذكار النوم', 'quotidienne', 2),
('Maison', 'دعاء دخول المنزل', 'lieu', 3),
('Décès', 'الدعاء عند الموت', 'événement', 4),
('Mosquée', 'دعاء دخول المسجد', 'lieu', 5),
('Voyage', 'دعاء السفر', 'lieu', 6),
('Habits', 'دعاء لبس الثياب', 'quotidienne', 7),
('Toilettes', 'دعاء دخول الخلاء', 'quotidienne', 8),
('Nourriture', 'دعاء الطعام', 'quotidienne', 9),
('Pluie', 'دعاء المطر', 'nature', 10),
('Mariage', 'دعاء الزواج', 'événement', 11),
('Sommeil', 'دعاء النوم', 'quotidienne', 12),
('Ablutions', 'دعاء الوضوء', 'quotidienne', 13),
('Animaux', 'دعاء الحيوانات', 'nature', 14),
('Maladie', 'دعاء المريض', 'événement', 15)
ON CONFLICT DO NOTHING;
