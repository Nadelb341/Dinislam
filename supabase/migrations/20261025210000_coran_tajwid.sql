-- Nouvelle carte « Coran » (Coran Al-Tajwid, 2026-10-25) : Lire / Juz' / Lieu de révélation / Programme.

-- 1. Pages du Coran (676 images WebP : 001 = couverture, 002 = « Un exemple qui explique », 004 = page 1 du Coran)
INSERT INTO storage.buckets (id, name, public)
VALUES ('coran-pages', 'coran-pages', true)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "public_read_coran_pages" ON storage.objects;
CREATE POLICY "public_read_coran_pages" ON storage.objects FOR SELECT USING (bucket_id = 'coran-pages');
DROP POLICY IF EXISTS "admin_manage_coran_pages" ON storage.objects;
CREATE POLICY "admin_manage_coran_pages" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'coran-pages' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'coran-pages' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Progression : une ligne par élève, par onglet et par clé
--    kind 'lecture' / key 'main'      → { page, bookmarks: [{ page, color, label }] }
--    kind 'juz'     / key '1'..'30'   → { done: [numéros de sourates terminées] }
--    kind 'programme' / key 'active'  → { plan, start, pagesPerDay, endDate, doneDays: [n], reminder }
CREATE TABLE IF NOT EXISTS public.coran_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('lecture', 'juz', 'programme')),
  key text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, key)
);
ALTER TABLE public.coran_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_coran_progress" ON public.coran_progress;
CREATE POLICY "own_coran_progress" ON public.coran_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "admin_read_coran_progress" ON public.coran_progress;
CREATE POLICY "admin_read_coran_progress" ON public.coran_progress FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Histoire de chaque sourate (relue et validée par l'enseignante avant d'être visible des élèves)
CREATE TABLE IF NOT EXISTS public.sourate_stories (
  sourate_number int PRIMARY KEY CHECK (sourate_number BETWEEN 1 AND 114),
  titre text NOT NULL DEFAULT '',
  texte text NOT NULL DEFAULT '',
  merite text,
  cause_authentique boolean NOT NULL DEFAULT false,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  validated boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sourate_stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_validated_sourate_stories" ON public.sourate_stories;
CREATE POLICY "read_validated_sourate_stories" ON public.sourate_stories FOR SELECT TO authenticated
  USING (validated OR public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "admin_manage_sourate_stories" ON public.sourate_stories;
CREATE POLICY "admin_manage_sourate_stories" ON public.sourate_stories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. En direct (règle « tout changement visible en direct »)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['coran_progress', 'sourate_stories'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- 5. Rappel du programme de lecture (bouton dans la carte Notifications)
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS notif_coran boolean DEFAULT true;
CREATE TABLE IF NOT EXISTS public.coran_reminder_logs (
  user_id uuid NOT NULL,
  sent_on date NOT NULL,
  PRIMARY KEY (user_id, sent_on)
);
ALTER TABLE public.coran_reminder_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_coran_reminder_logs" ON public.coran_reminder_logs;
CREATE POLICY "admin_coran_reminder_logs" ON public.coran_reminder_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 18 h et 19 h UTC ; la fonction n'agit que s'il est 20 h à Paris (été comme hiver)
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname = 'dinislam-coran-reminders';
SELECT cron.schedule('dinislam-coran-reminders', '0 18,19 * * *', $$
  SELECT net.http_post(
    url := 'https://zgnxqhfcmdonvdxqpekl.supabase.co/functions/v1/coran-reminders',
    body := '{}'::jsonb
  );
$$);
