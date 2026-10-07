-- Alphabet validé par l'enseignante (demande de Nadia 2026-10-07, « comme le Ramadan ») :
-- l'élève s'entraîne ligne par ligne (exercices libres) puis demande la validation de la lettre ;
-- la lettre suivante ne s'ouvre qu'après validation par l'enseignante.

-- 1. Envois des élèves (exercices par ligne + demandes de validation de la lettre) et réponses de l'enseignante
CREATE TABLE IF NOT EXISTS public.alphabet_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  letter_id integer NOT NULL REFERENCES public.alphabet_letters(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('exercise', 'final')),
  line_key text CHECK (line_key IN ('formes', 'courtes', 'longues', 'tanouines', 'soukoune', 'chadda')),
  audio_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'corrected', 'redo', 'validated', 'to_review')),
  admin_comment text,
  admin_audio_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CONSTRAINT alphabet_submissions_shape CHECK (
    (kind = 'exercise' AND line_key IS NOT NULL AND audio_url IS NOT NULL) OR (kind = 'final' AND line_key IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS alphabet_submissions_student_idx ON public.alphabet_submissions (student_id, letter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS alphabet_submissions_pending_idx ON public.alphabet_submissions (status) WHERE status = 'pending';
ALTER TABLE public.alphabet_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_all_alphabet_submissions ON public.alphabet_submissions;
CREATE POLICY admin_all_alphabet_submissions ON public.alphabet_submissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS student_read_own_alphabet_submissions ON public.alphabet_submissions;
CREATE POLICY student_read_own_alphabet_submissions ON public.alphabet_submissions FOR SELECT TO authenticated
  USING (student_id = auth.uid());
DROP POLICY IF EXISTS student_send_alphabet_submissions ON public.alphabet_submissions;
CREATE POLICY student_send_alphabet_submissions ON public.alphabet_submissions FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND status = 'pending' AND admin_comment IS NULL AND admin_audio_url IS NULL AND reviewed_at IS NULL);
ALTER PUBLICATION supabase_realtime ADD TABLE public.alphabet_submissions;

-- 2. Modèles audio de l'enseignante pour chaque ligne d'une lettre (« écoute ton prof et répète ») + mot exemple
CREATE TABLE IF NOT EXISTS public.alphabet_line_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id integer NOT NULL REFERENCES public.alphabet_letters(id) ON DELETE CASCADE,
  line_key text NOT NULL CHECK (line_key IN ('formes', 'courtes', 'longues', 'tanouines', 'soukoune', 'chadda', 'mot')),
  audio_url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT alphabet_line_models_unique UNIQUE (letter_id, line_key)
);
ALTER TABLE public.alphabet_line_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anyone_read_alphabet_line_models ON public.alphabet_line_models;
CREATE POLICY anyone_read_alphabet_line_models ON public.alphabet_line_models FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS admin_write_alphabet_line_models ON public.alphabet_line_models;
CREATE POLICY admin_write_alphabet_line_models ON public.alphabet_line_models FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Progression : un élève ne peut plus valider lui-même une lettre ; l'enseignante oui
DROP POLICY IF EXISTS "Users can manage own alphabet progress" ON public.user_alphabet_progress;
DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_alphabet_progress;
DROP POLICY IF EXISTS admin_all_alphabet_progress ON public.user_alphabet_progress;
CREATE POLICY admin_all_alphabet_progress ON public.user_alphabet_progress FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
-- (la politique « Users can view own progress » reste : l'élève voit sa progression)

-- Élève de 20 ans et plus : validation directe, comme pour les sourates/la Nourania (vérifié côté serveur)
CREATE OR REPLACE FUNCTION public.alphabet_self_validate(p_letter_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_age integer;
  v_dob date;
BEGIN
  SELECT age, date_of_birth INTO v_age, v_dob FROM profiles WHERE user_id = auth.uid();
  IF v_dob IS NOT NULL THEN v_age := date_part('year', age(current_date, v_dob)); END IF;
  IF COALESCE(v_age, 0) < 20 THEN RAISE EXCEPTION 'Validation réservée à l''enseignante'; END IF;
  UPDATE user_alphabet_progress SET is_validated = true, completed_at = now() WHERE user_id = auth.uid() AND letter_id = p_letter_id;
  IF NOT FOUND THEN
    INSERT INTO user_alphabet_progress (user_id, letter_id, is_validated, is_completed, completed_at) VALUES (auth.uid(), p_letter_id, true, true, now());
  END IF;
END;
$function$;
REVOKE ALL ON FUNCTION public.alphabet_self_validate(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.alphabet_self_validate(integer) TO authenticated;

-- 4. Nouveaux jeux : jeu de la lettre, syllabes (révision), défi du jour
ALTER TABLE public.alphabet_game_scores DROP CONSTRAINT IF EXISTS alphabet_game_scores_game_check;
ALTER TABLE public.alphabet_game_scores ADD CONSTRAINT alphabet_game_scores_game_check
  CHECK (game IN ('ecoute', 'ballons', 'formes', 'sosies', 'defi', 'lettre', 'syllabes', 'defi_jour'));
