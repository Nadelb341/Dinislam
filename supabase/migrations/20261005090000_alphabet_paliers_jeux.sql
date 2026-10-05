-- Alphabet par paliers (2026-10-05) : déblocages manuels par l'admin, scores des jeux, points au Classement,
-- et recalcul AUTOMATIQUE des points (avant : jamais recalculés sauf validation d'invocation / accès complet,
-- le Classement était figé depuis avril 2026).

-- 1. Lettres débloquées à la main par l'admin pour un élève (ne débloque PAS les lettres suivantes)
CREATE TABLE IF NOT EXISTS public.alphabet_admin_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  letter_id integer NOT NULL REFERENCES public.alphabet_letters(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT alphabet_admin_unlocks_user_letter UNIQUE (user_id, letter_id)
);
ALTER TABLE public.alphabet_admin_unlocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_all_alphabet_unlocks ON public.alphabet_admin_unlocks;
CREATE POLICY admin_all_alphabet_unlocks ON public.alphabet_admin_unlocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS student_read_own_alphabet_unlocks ON public.alphabet_admin_unlocks;
CREATE POLICY student_read_own_alphabet_unlocks ON public.alphabet_admin_unlocks FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 2. Parties jouées dans les jeux de l'Alphabet
CREATE TABLE IF NOT EXISTS public.alphabet_game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game text NOT NULL CHECK (game IN ('ecoute', 'ballons', 'formes', 'sosies', 'defi')),
  score integer NOT NULL CHECK (score >= 0),
  total integer NOT NULL CHECK (total > 0 AND score <= total),
  missed integer[] NOT NULL DEFAULT '{}',
  played_on date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Paris')::date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS alphabet_game_scores_user_idx ON public.alphabet_game_scores (user_id, created_at DESC);
ALTER TABLE public.alphabet_game_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS own_insert_alphabet_scores ON public.alphabet_game_scores;
CREATE POLICY own_insert_alphabet_scores ON public.alphabet_game_scores FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS own_read_alphabet_scores ON public.alphabet_game_scores;
CREATE POLICY own_read_alphabet_scores ON public.alphabet_game_scores FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Barème de l'Alphabet (modifiable par l'enseignante dans le Classement)
INSERT INTO public.point_settings (action_key, label, points, points_per_validation, is_active)
SELECT 'alphabet_lettre_apprise', '🔤 Alphabet — Lettre apprise', 5, 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.point_settings WHERE action_key = 'alphabet_lettre_apprise');
INSERT INTO public.point_settings (action_key, label, points, points_per_validation, is_active)
SELECT 'alphabet_bonne_reponse', '🎮 Alphabet — Bonne réponse aux jeux (meilleure partie du jour par jeu)', 1, 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.point_settings WHERE action_key = 'alphabet_bonne_reponse');

-- 4. Calcul des points : formules existantes inchangées + Alphabet
CREATE OR REPLACE FUNCTION public.recalculate_student_points(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total INTEGER := 0;
  pts_lettre INTEGER;
  pts_reponse INTEGER;
BEGIN
  SELECT total + COALESCE(COUNT(*) * 10, 0) INTO total
  FROM user_sourate_progress WHERE user_id = p_user_id AND is_validated = true;

  SELECT total + COALESCE(COUNT(*) * 5, 0) INTO total
  FROM user_nourania_progress WHERE user_id = p_user_id AND is_validated = true;

  SELECT total + COALESCE(COUNT(*) * 5, 0) INTO total
  FROM user_invocation_progress WHERE user_id = p_user_id AND is_validated = true;

  -- Alphabet : lettres apprises
  SELECT CASE WHEN is_active THEN points ELSE 0 END INTO pts_lettre FROM point_settings WHERE action_key = 'alphabet_lettre_apprise';
  SELECT total + COALESCE(COUNT(*) * COALESCE(pts_lettre, 5), 0) INTO total
  FROM user_alphabet_progress WHERE user_id = p_user_id AND is_validated = true;

  -- Alphabet : jeux (seule la meilleure partie de chaque jeu et de chaque jour compte → pas de points « à la chaîne »)
  SELECT CASE WHEN is_active THEN points ELSE 0 END INTO pts_reponse FROM point_settings WHERE action_key = 'alphabet_bonne_reponse';
  SELECT total + COALESCE(SUM(best) * COALESCE(pts_reponse, 1), 0) INTO total
  FROM (SELECT MAX(score) AS best FROM alphabet_game_scores WHERE user_id = p_user_id GROUP BY game, played_on) b;

  INSERT INTO student_ranking (user_id, total_points, updated_at)
  VALUES (p_user_id, total, now())
  ON CONFLICT (user_id) DO UPDATE SET total_points = total, updated_at = now();

  UPDATE profiles SET points = total WHERE user_id = p_user_id;
END;
$function$;

-- 5. Recalcul automatique dès qu'une progression ou une partie change
CREATE OR REPLACE FUNCTION public.trg_recalculate_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_student_points(OLD.user_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalculate_student_points(NEW.user_id);
  IF TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    PERFORM public.recalculate_student_points(OLD.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['user_sourate_progress','user_nourania_progress','user_invocation_progress','user_alphabet_progress','alphabet_game_scores'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS recalculate_points ON public.%I', t);
    EXECUTE format('CREATE TRIGGER recalculate_points AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_points()', t);
  END LOOP;
END $$;

-- 6. Rattrapage : remettre à jour les points de tous les élèves (figés depuis avril)
DO $$
DECLARE u uuid;
BEGIN
  FOR u IN SELECT user_id FROM public.profiles LOOP
    PERFORM public.recalculate_student_points(u);
  END LOOP;
END $$;
