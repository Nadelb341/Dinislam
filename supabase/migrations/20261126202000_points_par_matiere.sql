-- 🏆 Nadia (2026-11-26) : dans le Classement, toucher un élève montre ses points PAR MATIÈRE.
-- Pour que ces points soient TOUJOURS les mêmes que le total, le calcul est rangé à UN seul endroit :
--   _points_detail(élève) → une ligne par règle du barème (nombre × points) ;
--   recalculate_student_points(élève) fait la somme de ces lignes (même calcul qu'avant, aucune règle changée) ;
--   points_par_matiere(élève) = la même chose, lisible par l'enseignante (ou l'élève lui-même).
-- Rétrograder / dévalider une leçon retire la ligne validée → le déclencheur recalcule → les points baissent.
CREATE OR REPLACE FUNCTION public._points_detail(p_user_id uuid)
 RETURNS TABLE(action_key text, nombre integer, points integer)
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  n INTEGER;
  r RECORD;
BEGIN
  FOR r IN SELECT ps.action_key, CASE WHEN ps.is_active THEN ps.points ELSE 0 END AS p FROM point_settings ps LOOP
    n := 0;
    CASE r.action_key
      -- 📖 Sourate validée OU débloquée par l'enseignante (Nadia, 2026-11-17). Chaque sourate ne compte qu'UNE fois.
      WHEN 'sourate_validee' THEN SELECT COUNT(*) INTO n FROM (
        SELECT sourate_id FROM user_sourate_progress WHERE user_id = p_user_id AND is_validated
        UNION
        SELECT sourate_id FROM sourate_admin_unlocks WHERE user_id = p_user_id
      ) s;
      -- 🔤 Leçon Nourania validée OU ouverte à la main par l'enseignante (Nadia, 2026-11-18 : « oui »). Une fois par leçon.
      WHEN 'nourania_lecon_validee' THEN SELECT COUNT(*) INTO n FROM (
        SELECT lesson_id FROM user_nourania_progress WHERE user_id = p_user_id AND is_validated
        UNION
        SELECT lesson_id FROM nourania_admin_unlocks WHERE student_id = p_user_id
      ) l;
      WHEN 'invocation_vue' THEN SELECT COUNT(*) INTO n FROM user_invocation_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'alphabet_lettre_apprise' THEN SELECT COUNT(*) INTO n FROM user_alphabet_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'alphabet_bonne_reponse' THEN SELECT COALESCE(SUM(best), 0) INTO n FROM (SELECT MAX(score) AS best FROM alphabet_game_scores WHERE user_id = p_user_id GROUP BY game, played_on) b;
      WHEN 'devoir_rendu' THEN SELECT COUNT(*) INTO n FROM devoirs_rendus WHERE student_id = p_user_id;
      WHEN 'devoir_corrige' THEN SELECT COUNT(*) INTO n FROM devoirs_rendus WHERE student_id = p_user_id AND statut = 'corrige';
      WHEN 'presence_marquee' THEN SELECT COUNT(*) INTO n FROM attendance_records WHERE user_id = p_user_id AND status IN ('present', 'late');
      WHEN 'priere_validee' THEN SELECT COUNT(*) INTO n FROM user_prayer_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'jeune_marque' THEN SELECT COUNT(*) INTO n FROM user_ramadan_fasting WHERE user_id = p_user_id AND COALESCE(has_fasted, is_fasting, false);
      WHEN 'quiz_reussi' THEN SELECT COUNT(*) INTO n FROM user_ramadan_progress WHERE user_id = p_user_id AND quiz_completed;
      WHEN 'ramadan_jour_complete' THEN SELECT COUNT(*) INTO n FROM user_ramadan_progress WHERE user_id = p_user_id AND is_completed;
      WHEN 'message_envoye' THEN SELECT COUNT(*) INTO n FROM user_messages WHERE sender_id = p_user_id AND deleted_at IS NULL;
      WHEN 'allah_nom_valide' THEN SELECT COUNT(*) INTO n FROM user_allah_name_progress WHERE user_id = p_user_id AND is_validated;
      WHEN 'vocabulaire_appris' THEN SELECT COUNT(*) INTO n FROM user_flashcard_learned WHERE user_id = p_user_id;
      WHEN 'tresor_ouvert' THEN SELECT COUNT(*) INTO n FROM program_rewards WHERE user_id = p_user_id AND kind = 'tresor';
      WHEN 'bonus_semaine' THEN SELECT COUNT(*) INTO n FROM program_rewards WHERE user_id = p_user_id AND kind = 'bonus';
      WHEN 'anniversaire' THEN SELECT COUNT(*) INTO n FROM anniversaires_fetes WHERE user_id = p_user_id;
      -- 🕌 Journée des 5 prières cochées (Nadia, 2026-11-26, idée d) : 10 points par journée complète
      WHEN 'journee_5_prieres' THEN SELECT COUNT(*) INTO n FROM (
        SELECT date FROM user_daily_prayers WHERE user_id = p_user_id AND is_checked
          AND prayer_name IN ('sobh', 'dhuhr', 'asr', 'maghrib', 'isha')
        GROUP BY date HAVING COUNT(DISTINCT prayer_name) = 5
      ) j;
      ELSE n := 0;
    END CASE;
    action_key := r.action_key; nombre := COALESCE(n, 0); points := COALESCE(n, 0) * COALESCE(r.p, 0);
    RETURN NEXT;
  END LOOP;
END;
$function$;
revoke all on function public._points_detail(uuid) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.recalculate_student_points(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total INTEGER := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN RETURN; END IF; -- compte en cours de suppression
  SELECT COALESCE(SUM(d.points), 0) INTO total FROM public._points_detail(p_user_id) d;

  INSERT INTO student_ranking (user_id, total_points, updated_at)
  VALUES (p_user_id, total, now())
  ON CONFLICT (user_id) DO UPDATE SET total_points = total, updated_at = now();

  UPDATE profiles SET points = total WHERE user_id = p_user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.points_par_matiere(p_user_id uuid)
 RETURNS TABLE(action_key text, nombre integer, points integer)
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR (auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN QUERY SELECT d.action_key, d.nombre, d.points FROM public._points_detail(p_user_id) d;
END;
$function$;
revoke all on function public.points_par_matiere(uuid) from public, anon;
grant execute on function public.points_par_matiere(uuid) to authenticated;
