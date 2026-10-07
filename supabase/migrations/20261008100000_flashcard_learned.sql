-- « ✅ Je connais ce mot » sur les flashcards (option 2 de Nadia, 2026-10-08) → ligne « Vocabulaire appris » du barème
CREATE TABLE IF NOT EXISTS public.user_flashcard_learned (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id uuid NOT NULL REFERENCES public.module_flashcards(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, flashcard_id)
);
ALTER TABLE public.user_flashcard_learned ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flashcard_learned_read" ON public.user_flashcard_learned;
CREATE POLICY "flashcard_learned_read" ON public.user_flashcard_learned FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "flashcard_learned_insert" ON public.user_flashcard_learned;
CREATE POLICY "flashcard_learned_insert" ON public.user_flashcard_learned FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "flashcard_learned_delete" ON public.user_flashcard_learned;
CREATE POLICY "flashcard_learned_delete" ON public.user_flashcard_learned FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS recalculate_points ON public.user_flashcard_learned;
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE ON public.user_flashcard_learned
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_points_col('user_id');

CREATE OR REPLACE FUNCTION public.recalculate_student_points(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  total INTEGER := 0;
  n INTEGER;
  pts INTEGER;
  r RECORD;
BEGIN
  -- Pour chaque ligne du barème : nombre d'actions de l'élève × points (0 si la ligne est désactivée)
  FOR r IN SELECT action_key, CASE WHEN is_active THEN points ELSE 0 END AS p FROM point_settings LOOP
    n := 0;
    CASE r.action_key
      WHEN 'sourate_validee' THEN SELECT COUNT(*) INTO n FROM user_sourate_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'nourania_lecon_validee' THEN SELECT COUNT(*) INTO n FROM user_nourania_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'invocation_vue' THEN SELECT COUNT(*) INTO n FROM user_invocation_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'alphabet_lettre_apprise' THEN SELECT COUNT(*) INTO n FROM user_alphabet_progress WHERE user_id = p_user_id AND is_validated;
      -- Jeux de l'Alphabet : seule la meilleure partie de chaque jeu et de chaque jour compte
      WHEN 'alphabet_bonne_reponse' THEN SELECT COALESCE(SUM(best), 0) INTO n FROM (SELECT MAX(score) AS best FROM alphabet_game_scores WHERE user_id = p_user_id GROUP BY game, played_on) b;
      WHEN 'devoir_rendu' THEN SELECT COUNT(*) INTO n FROM devoirs_rendus WHERE student_id = p_user_id;
      WHEN 'devoir_corrige' THEN SELECT COUNT(*) INTO n FROM devoirs_rendus WHERE student_id = p_user_id AND statut = 'corrige';
      WHEN 'presence_marquee' THEN SELECT COUNT(*) INTO n FROM attendance_records WHERE user_id = p_user_id AND status IN ('present', 'late');
      WHEN 'priere_validee' THEN SELECT COUNT(*) INTO n FROM user_prayer_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'jeune_marque' THEN SELECT COUNT(*) INTO n FROM user_ramadan_fasting WHERE user_id = p_user_id AND COALESCE(has_fasted, is_fasting, false);
      WHEN 'quiz_reussi' THEN SELECT COUNT(*) INTO n FROM user_ramadan_progress WHERE user_id = p_user_id AND quiz_completed;
      WHEN 'ramadan_jour_complete' THEN SELECT COUNT(*) INTO n FROM user_ramadan_progress WHERE user_id = p_user_id AND is_completed;
      WHEN 'message_envoye' THEN SELECT COUNT(*) INTO n FROM user_messages WHERE sender_id = p_user_id AND deleted_at IS NULL;
      WHEN 'vocabulaire_appris' THEN SELECT COUNT(*) INTO n FROM user_flashcard_learned WHERE user_id = p_user_id;
      ELSE n := 0;
    END CASE;
    total := total + COALESCE(n, 0) * COALESCE(r.p, 0);
  END LOOP;

  INSERT INTO student_ranking (user_id, total_points, updated_at)
  VALUES (p_user_id, total, now())
  ON CONFLICT (user_id) DO UPDATE SET total_points = total, updated_at = now();

  UPDATE profiles SET points = total WHERE user_id = p_user_id;
END;
$function$;
