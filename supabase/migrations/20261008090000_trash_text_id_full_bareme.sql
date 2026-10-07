-- 1) Corbeille : l'identifiant d'origine devient du texte. Avant (uuid), la mise en corbeille ÉCHOUAIT pour tout élément
--    dont l'identifiant n'est pas un uuid : séance de présence (date), brouillon (clé), nom d'Allah / invocation (nombre),
--    modèle audio d'une ligne de l'Alphabet, audio d'une lettre… → suppression bloquée (« mise en corbeille impossible »).
ALTER TABLE public.trash_items ALTER COLUMN original_id TYPE text USING original_id::text;

-- 2) Classement : TOUTES les lignes du barème comptent (choix de Nadia, 2026-10-08)
UPDATE public.point_settings SET label = '🤲 Invocation validée' WHERE action_key = 'invocation_vue';

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
      ELSE n := 0; -- ex. vocabulaire_appris : rien n'enregistre encore le vocabulaire appris
    END CASE;
    total := total + COALESCE(n, 0) * COALESCE(r.p, 0);
  END LOOP;

  INSERT INTO student_ranking (user_id, total_points, updated_at)
  VALUES (p_user_id, total, now())
  ON CONFLICT (user_id) DO UPDATE SET total_points = total, updated_at = now();

  UPDATE profiles SET points = total WHERE user_id = p_user_id;
END;
$function$;

-- Déclencheur générique : la colonne qui désigne l'élève est passée en argument
CREATE OR REPLACE FUNCTION public.trg_recalculate_points_col()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE col text := TG_ARGV[0]; o uuid; nw uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN o := (to_jsonb(OLD) ->> col)::uuid; END IF;
  IF TG_OP <> 'DELETE' THEN nw := (to_jsonb(NEW) ->> col)::uuid; END IF;
  IF nw IS NOT NULL THEN PERFORM recalculate_student_points(nw); END IF;
  IF o IS NOT NULL AND o IS DISTINCT FROM nw THEN PERFORM recalculate_student_points(o); END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS recalculate_points ON public.devoirs_rendus;
CREATE TRIGGER recalculate_points AFTER INSERT OR UPDATE OR DELETE ON public.devoirs_rendus FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_points_col('student_id');
DROP TRIGGER IF EXISTS recalculate_points ON public.attendance_records;
CREATE TRIGGER recalculate_points AFTER INSERT OR UPDATE OF status, user_id OR DELETE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_points_col('user_id');
DROP TRIGGER IF EXISTS recalculate_points ON public.user_prayer_progress;
CREATE TRIGGER recalculate_points AFTER INSERT OR UPDATE OR DELETE ON public.user_prayer_progress FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_points_col('user_id');
DROP TRIGGER IF EXISTS recalculate_points ON public.user_ramadan_fasting;
CREATE TRIGGER recalculate_points AFTER INSERT OR UPDATE OR DELETE ON public.user_ramadan_fasting FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_points_col('user_id');
DROP TRIGGER IF EXISTS recalculate_points ON public.user_ramadan_progress;
CREATE TRIGGER recalculate_points AFTER INSERT OR UPDATE OR DELETE ON public.user_ramadan_progress FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_points_col('user_id');
DROP TRIGGER IF EXISTS recalculate_points ON public.user_messages;
CREATE TRIGGER recalculate_points AFTER INSERT OR UPDATE OF deleted_at OR DELETE ON public.user_messages FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_points_col('sender_id');

DO $$ DECLARE u uuid; BEGIN FOR u IN SELECT user_id FROM profiles LOOP PERFORM public.recalculate_student_points(u); END LOOP; END $$;
