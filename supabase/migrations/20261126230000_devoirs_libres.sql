-- 📝 Devoirs libres (Nadia, 2026-11-26, organisation « C. Des modèles prêts à remplir ») :
-- devoirs qu'elle prépare elle-même (dictée, texte à lire, vidéo + questions, fiche, écriture, libre),
-- donnés en général à un GROUPE entier. Comme les autres devoirs : UNE ligne par élève (assigned_to 'student',
-- jamais de group_id, sinon la règle de lecture montrerait le devoir à tout le groupe, même aux élèves décochés).
-- Les copies d'un même devoir partagent `libre_lot` (✏️ modifier / 🗑️ supprimer en une fois) ; `libre_groupe` = le groupe visé.
-- Migration ADDITIVE : nouvelles colonnes seulement + le type « libre » autorisé. Rien n'est effacé.

-- 1. Le type « libre » rejoint les matières autorisées
ALTER TABLE public.devoirs DROP CONSTRAINT IF EXISTS devoirs_type_check;
ALTER TABLE public.devoirs ADD CONSTRAINT devoirs_type_check CHECK (type = ANY (ARRAY[
  'sourate', 'nourania', 'recitation', 'exercice_pdf', 'autre', 'allah_names', 'alphabet', 'invocations', 'priere', 'coran', 'libre'
]::text[]));

-- 2. Ce que Nadia prépare
ALTER TABLE public.devoirs ADD COLUMN IF NOT EXISTS libre_modele text;
ALTER TABLE public.devoirs ADD COLUMN IF NOT EXISTS libre_lot uuid;
ALTER TABLE public.devoirs ADD COLUMN IF NOT EXISTS libre_groupe uuid REFERENCES public.student_groups(id) ON DELETE SET NULL;
-- Formes de réponse attendues : 'texte', 'photo', 'audio', 'questions'
ALTER TABLE public.devoirs ADD COLUMN IF NOT EXISTS reponses_attendues text[] NOT NULL DEFAULT '{}'::text[];
-- Questions du modèle « Vidéo + questions » (1 à 5 textes)
ALTER TABLE public.devoirs ADD COLUMN IF NOT EXISTS questions jsonb NOT NULL DEFAULT '[]'::jsonb;
-- Lien d'une vidéo (YouTube lu SANS sortie possible, ou fichier vidéo)
ALTER TABLE public.devoirs ADD COLUMN IF NOT EXISTS video_lien text;

ALTER TABLE public.devoirs DROP CONSTRAINT IF EXISTS devoirs_libre_modele_check;
ALTER TABLE public.devoirs ADD CONSTRAINT devoirs_libre_modele_check CHECK (
  libre_modele IS NULL OR libre_modele = ANY (ARRAY['dictee', 'texte', 'video', 'fiche', 'ecriture', 'libre']::text[])
);
ALTER TABLE public.devoirs DROP CONSTRAINT IF EXISTS devoirs_reponses_attendues_check;
ALTER TABLE public.devoirs ADD CONSTRAINT devoirs_reponses_attendues_check CHECK (
  reponses_attendues <@ ARRAY['texte', 'photo', 'audio', 'questions']::text[]
);
ALTER TABLE public.devoirs DROP CONSTRAINT IF EXISTS devoirs_questions_tableau_check;
ALTER TABLE public.devoirs ADD CONSTRAINT devoirs_questions_tableau_check CHECK (jsonb_typeof(questions) = 'array');

CREATE INDEX IF NOT EXISTS devoirs_libre_lot_idx ON public.devoirs (libre_lot) WHERE libre_lot IS NOT NULL;

-- 3. Ce que l'élève renvoie : un texte écrit, et ses réponses aux questions (même ordre que devoirs.questions)
ALTER TABLE public.devoirs_rendus ADD COLUMN IF NOT EXISTS reponse_texte text;
ALTER TABLE public.devoirs_rendus ADD COLUMN IF NOT EXISTS reponses jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.devoirs_rendus DROP CONSTRAINT IF EXISTS devoirs_rendus_reponses_tableau_check;
ALTER TABLE public.devoirs_rendus ADD CONSTRAINT devoirs_rendus_reponses_tableau_check CHECK (jsonb_typeof(reponses) = 'array');

-- Règles de lecture / écriture : INCHANGÉES (admin = tout ; élève = ses devoirs et SES rendus).
-- Direct : `devoirs` et `devoirs_rendus` sont déjà dans la publication supabase_realtime.
