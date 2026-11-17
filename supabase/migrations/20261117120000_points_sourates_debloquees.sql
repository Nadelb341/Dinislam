-- 🏆 Points du classement — grand nettoyage demandé par Nadia le 2026-11-17
-- 1) Une sourate débloquée par l'enseignante (« Débloquer des sourates pour un élève ») compte comme une sourate validée (15 pts),
--    une seule fois même si elle est aussi validée.
-- 2) Le déblocage / re-verrouillage d'une sourate recalcule tout de suite les points de l'élève (déclencheur).
-- 3) Libellé des 99 Noms : « 🌟 99 Noms d'Allah — Nom appris » (Nadia lisait « non validé »).
-- 4) Recalcul complet de TOUS les élèves à partir de ce qui est validé AUJOURD'HUI (ce qui a été dévalidé ne compte plus).

CREATE OR REPLACE FUNCTION public.recalculate_student_points(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total INTEGER := 0;
  n INTEGER;
  pts INTEGER;
  r RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN RETURN; END IF; -- compte en cours de suppression
  -- Pour chaque ligne du barème : nombre d'actions de l'élève × points (0 si la ligne est désactivée)
  FOR r IN SELECT action_key, CASE WHEN is_active THEN points ELSE 0 END AS p FROM point_settings LOOP
    n := 0;
    CASE r.action_key
      -- 📖 Sourate validée = validée par l'élève, par l'enseignante (mode fantôme, validation) OU débloquée par l'enseignante
      --    dans Coran/Sourates › Gérer le contenu › « Débloquer des sourates pour un élève » (Nadia, 2026-11-17 : « ça compte comme
      --    si c'était l'élève qui les avait validées »). Chaque sourate ne compte qu'UNE fois.
      WHEN 'sourate_validee' THEN SELECT COUNT(*) INTO n FROM (
        SELECT sourate_id FROM user_sourate_progress WHERE user_id = p_user_id AND is_validated
        UNION
        SELECT sourate_id FROM sourate_admin_unlocks WHERE user_id = p_user_id
      ) s;
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
      -- 🌟 99 Noms d'Allah : nom validé (2026-11-04, demande de Nadia)
      WHEN 'allah_nom_valide' THEN SELECT COUNT(*) INTO n FROM user_allah_name_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'vocabulaire_appris' THEN SELECT COUNT(*) INTO n FROM user_flashcard_learned WHERE user_id = p_user_id;
      -- Chemin de la semaine (2026-10-26) : trésor ouvert (+10) et diamant bonus (+5)
      WHEN 'tresor_ouvert' THEN SELECT COUNT(*) INTO n FROM program_rewards WHERE user_id = p_user_id AND kind = 'tresor';
      WHEN 'bonus_semaine' THEN SELECT COUNT(*) INTO n FROM program_rewards WHERE user_id = p_user_id AND kind = 'bonus';
      -- 🎉 Un an de plus (anniversaire, 2026-11-15) : une fois par an
      WHEN 'anniversaire' THEN SELECT COUNT(*) INTO n FROM anniversaires_fetes WHERE user_id = p_user_id;
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

DROP TRIGGER IF EXISTS recalculate_points ON public.sourate_admin_unlocks;
CREATE TRIGGER recalculate_points AFTER INSERT OR DELETE OR UPDATE ON public.sourate_admin_unlocks
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_points_col('user_id');

UPDATE public.point_settings SET label = '🌟 99 Noms d''Allah — Nom appris' WHERE action_key = 'allah_nom_valide';

DO $$ DECLARE u uuid; BEGIN
  FOR u IN SELECT user_id FROM public.profiles LOOP PERFORM public.recalculate_student_points(u); END LOOP;
END $$;
