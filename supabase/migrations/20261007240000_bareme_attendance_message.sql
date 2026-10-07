-- 1) Classement : le calcul suit le barème (choix « A » de Nadia, 2026-10-07) pour les sourates et les leçons Nourania
CREATE OR REPLACE FUNCTION public.recalculate_student_points(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  total INTEGER := 0;
  pts_sourate INTEGER; pts_nourania INTEGER; pts_lettre INTEGER; pts_reponse INTEGER;
BEGIN
  SELECT CASE WHEN is_active THEN points ELSE 0 END INTO pts_sourate FROM point_settings WHERE action_key = 'sourate_validee';
  SELECT CASE WHEN is_active THEN points ELSE 0 END INTO pts_nourania FROM point_settings WHERE action_key = 'nourania_lecon_validee';
  SELECT CASE WHEN is_active THEN points ELSE 0 END INTO pts_lettre FROM point_settings WHERE action_key = 'alphabet_lettre_apprise';
  SELECT CASE WHEN is_active THEN points ELSE 0 END INTO pts_reponse FROM point_settings WHERE action_key = 'alphabet_bonne_reponse';

  SELECT total + COALESCE(COUNT(*) * COALESCE(pts_sourate, 10), 0) INTO total
  FROM user_sourate_progress WHERE user_id = p_user_id AND is_validated = true;

  SELECT total + COALESCE(COUNT(*) * COALESCE(pts_nourania, 5), 0) INTO total
  FROM user_nourania_progress WHERE user_id = p_user_id AND is_validated = true;

  -- Invocations : 5 par invocation validée (pas encore de ligne correspondante dans le barème)
  SELECT total + COALESCE(COUNT(*) * 5, 0) INTO total
  FROM user_invocation_progress WHERE user_id = p_user_id AND is_validated = true;

  SELECT total + COALESCE(COUNT(*) * COALESCE(pts_lettre, 5), 0) INTO total
  FROM user_alphabet_progress WHERE user_id = p_user_id AND is_validated = true;

  -- Alphabet : jeux (seule la meilleure partie de chaque jeu et de chaque jour compte)
  SELECT total + COALESCE(SUM(best) * COALESCE(pts_reponse, 1), 0) INTO total
  FROM (SELECT MAX(score) AS best FROM alphabet_game_scores WHERE user_id = p_user_id GROUP BY game, played_on) b;

  INSERT INTO student_ranking (user_id, total_points, updated_at)
  VALUES (p_user_id, total, now())
  ON CONFLICT (user_id) DO UPDATE SET total_points = total, updated_at = now();

  UPDATE profiles SET points = total WHERE user_id = p_user_id;
END;
$function$;

-- Changer un chiffre du barème recalcule les points de tout le monde
CREATE OR REPLACE FUNCTION public.recalculate_all_points_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE u uuid;
BEGIN
  FOR u IN SELECT user_id FROM profiles LOOP PERFORM recalculate_student_points(u); END LOOP;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS recalculate_all_points ON public.point_settings;
CREATE TRIGGER recalculate_all_points AFTER INSERT OR UPDATE OR DELETE ON public.point_settings
  FOR EACH STATEMENT EXECUTE FUNCTION public.recalculate_all_points_trigger();

DO $$ DECLARE u uuid; BEGIN FOR u IN SELECT user_id FROM profiles LOOP PERFORM public.recalculate_student_points(u); END LOOP; END $$;

-- 2) Message éphémère après le dernier cours (une seule fois), désactivable par l'enseignante pour un élève et une séance
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS send_message boolean NOT NULL DEFAULT true;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS message_seen_at timestamptz;
UPDATE public.attendance_records SET message_seen_at = now() WHERE message_seen_at IS NULL; -- anciennes séances : pas de message

CREATE OR REPLACE FUNCTION public.mark_attendance_message_seen(p_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE attendance_records SET message_seen_at = now() WHERE id = p_id AND user_id = auth.uid() AND message_seen_at IS NULL;
$$;
REVOKE ALL ON FUNCTION public.mark_attendance_message_seen(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.mark_attendance_message_seen(uuid) TO authenticated;
