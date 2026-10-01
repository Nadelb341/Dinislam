-- Fonctionnalités bloquées depuis Lovable, découvertes au nettoyage du 2026-10-01 :
-- 1. Activités des jours de Ramadan : la colonne activity_type était obligatoire mais le code envoie `type`
--    → chaque ajout échouait (table vide). On la rend facultative et on la remplit automatiquement.
ALTER TABLE public.ramadan_day_activities ALTER COLUMN activity_type DROP NOT NULL;
CREATE OR REPLACE FUNCTION public.ramadan_activity_fill_type() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.activity_type := COALESCE(NEW.activity_type, NEW.type);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_ramadan_activity_fill_type ON public.ramadan_day_activities;
CREATE TRIGGER trg_ramadan_activity_fill_type BEFORE INSERT OR UPDATE ON public.ramadan_day_activities
  FOR EACH ROW EXECUTE FUNCTION public.ramadan_activity_fill_type();

-- 2. Quiz du Ramadan : anciennes colonnes option_a / option_b / correct_answer obligatoires, alors que le code
--    utilise options / correct_options → plus aucune question ne pouvait être ajoutée depuis mars.
ALTER TABLE public.ramadan_quizzes ALTER COLUMN option_a DROP NOT NULL;
ALTER TABLE public.ramadan_quizzes ALTER COLUMN option_b DROP NOT NULL;
ALTER TABLE public.ramadan_quizzes ALTER COLUMN correct_answer DROP NOT NULL;

-- 3. Médias (image / audio / vidéo) des 99 Noms d'Allah : la table n'avait jamais été créée.
CREATE TABLE IF NOT EXISTS public.allah_name_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_id integer NOT NULL REFERENCES public.allah_names(id) ON DELETE CASCADE,
  media_type text NOT NULL,
  file_url text NOT NULL,
  file_name text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.allah_name_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allah_name_media_read" ON public.allah_name_media;
CREATE POLICY "allah_name_media_read" ON public.allah_name_media FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "allah_name_media_admin_write" ON public.allah_name_media;
CREATE POLICY "allah_name_media_admin_write" ON public.allah_name_media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
