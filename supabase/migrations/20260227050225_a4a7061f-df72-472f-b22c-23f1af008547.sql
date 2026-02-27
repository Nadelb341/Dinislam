
-- prayer_cards table
CREATE TABLE public.prayer_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_key text NOT NULL,
  title text NOT NULL,
  title_arabic text,
  image_url text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prayer_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage prayer cards" ON public.prayer_cards FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Anyone can read prayer cards" ON public.prayer_cards FOR SELECT USING (true);

-- prayer_card_content table
CREATE TABLE public.prayer_card_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.prayer_cards(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prayer_card_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage prayer card content" ON public.prayer_card_content FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Anyone can read prayer card content" ON public.prayer_card_content FOR SELECT USING (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('prayer-cards', 'prayer-cards', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can read prayer-cards files" ON storage.objects FOR SELECT USING (bucket_id = 'prayer-cards');
CREATE POLICY "Admins can upload prayer-cards files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'prayer-cards' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update prayer-cards files" ON storage.objects FOR UPDATE USING (bucket_id = 'prayer-cards' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete prayer-cards files" ON storage.objects FOR DELETE USING (bucket_id = 'prayer-cards' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Insert cards for each group
DO $$
DECLARE
  card_titles text[] := ARRAY[
    'L''importance de la prière',
    'Comment faire petites ablutions',
    'Comment faire grandes ablutions',
    'Prière de Sobh',
    'Prière de Dhor',
    'Prière de Asr',
    'Prière de Maghreb',
    'Prière de Isha',
    'Prière de Chfa3 et Lothar',
    'Ce qui annule les ablutions'
  ];
  groups text[] := ARRAY['petits', 'jeunes', 'adultes'];
  g text;
  i int;
BEGIN
  FOREACH g IN ARRAY groups LOOP
    FOR i IN 1..array_length(card_titles, 1) LOOP
      INSERT INTO public.prayer_cards (group_key, title, display_order)
      VALUES (g, card_titles[i], i);
    END LOOP;
  END LOOP;
END $$;
