-- 📚 Parcours d'un devoir (demande de Nadia, 2026-10-26) :
--  à faire → « Je valide mon devoir » (+ audio si l'enseignante l'a demandé) = diamant ORANGE (en attente)
--  → l'enseignante valide = diamant DORÉ qui brille. « Commencer mon travail » ouvre le bon élément (cible_module / cible_id).
--  La date à rendre est choisie par l'enseignante (pas de cours pendant les vacances).

ALTER TABLE public.devoirs ADD COLUMN IF NOT EXISTS cible_module text;
ALTER TABLE public.devoirs ADD COLUMN IF NOT EXISTS cible_id text;
ALTER TABLE public.devoirs ADD COLUMN IF NOT EXISTS audio_requis boolean NOT NULL DEFAULT false;

-- Diamant allumé = devoir validé par l'enseignante
CREATE OR REPLACE FUNCTION public.program_item_done(p_user uuid, p_module text, p_item text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT CASE p_module
    WHEN 'devoir' THEN EXISTS (SELECT 1 FROM devoirs_rendus r WHERE r.student_id = p_user AND r.devoir_id::text = p_item AND r.statut = 'corrige')
    WHEN 'nourania' THEN EXISTS (SELECT 1 FROM user_nourania_progress u WHERE u.user_id = p_user AND u.lesson_id::text = p_item AND u.is_validated)
    WHEN 'sourates' THEN EXISTS (SELECT 1 FROM user_sourate_progress u WHERE u.user_id = p_user AND u.sourate_id::text = p_item AND u.is_validated AND u.context = 'sourates')
    WHEN 'allah_names' THEN EXISTS (SELECT 1 FROM user_allah_name_progress u WHERE u.user_id = p_user AND u.name_id::text = p_item AND u.is_validated)
    WHEN 'alphabet' THEN EXISTS (SELECT 1 FROM user_alphabet_progress u WHERE u.user_id = p_user AND u.letter_id::text = p_item AND u.is_validated)
    WHEN 'invocations' THEN EXISTS (SELECT 1 FROM user_invocation_progress u WHERE u.user_id = p_user AND u.invocation_id::text = p_item AND u.is_validated)
    WHEN 'priere' THEN EXISTS (SELECT 1 FROM user_prayer_progress u WHERE u.user_id = p_user AND u.card_id::text = p_item AND u.is_validated)
    ELSE false END;
$function$;

-- Diamant orange = devoir envoyé, en attente de la validation de l'enseignante
CREATE OR REPLACE FUNCTION public.program_item_pending(p_user uuid, p_module text, p_item text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT CASE p_module
    WHEN 'devoir' THEN EXISTS (SELECT 1 FROM devoirs_rendus r WHERE r.student_id = p_user AND r.devoir_id::text = p_item AND r.statut = 'rendu')
    WHEN 'allah_names' THEN EXISTS (SELECT 1 FROM sourate_recitations s WHERE s.student_id = p_user AND s.allah_name_id::text = p_item AND s.status = 'pending')
    ELSE false END;
$function$;

-- Quand l'élève a envoyé son devoir (pour le bonus : envoyé à temps, puis validé)
CREATE OR REPLACE FUNCTION public.program_item_done_at(p_user uuid, p_module text, p_item text)
 RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT CASE p_module
    WHEN 'devoir' THEN (SELECT r.rendu_at FROM devoirs_rendus r WHERE r.student_id = p_user AND r.devoir_id::text = p_item AND r.statut = 'corrige' LIMIT 1)
    WHEN 'allah_names' THEN (SELECT u.validated_at FROM user_allah_name_progress u WHERE u.user_id = p_user AND u.name_id::text = p_item AND u.is_validated LIMIT 1)
    ELSE NULL END;
$function$;

CREATE OR REPLACE FUNCTION public.program_items(p_user uuid, p_week date, p_stored jsonb)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT jsonb_agg(it) FROM jsonb_array_elements(COALESCE(p_stored, '[]'::jsonb)) it WHERE it->>'module' = 'allah_names'), '[]'::jsonb)
      || COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'module', 'devoir', 'item_id', d.id::text, 'label', d.titre,
          'detail', CASE d.type WHEN 'sourate' THEN 'Sourate' WHEN 'recitation' THEN 'Récitation' WHEN 'nourania' THEN 'Nourania' WHEN 'allah_names' THEN '99 noms' WHEN 'alphabet' THEN 'Alphabet' WHEN 'invocations' THEN 'Invocation' WHEN 'priere' THEN 'Prière' WHEN 'coran' THEN 'Coran' ELSE 'Devoir' END
                    || COALESCE(' · pour le ' || to_char(d.date_limite AT TIME ZONE 'Europe/Paris', 'DD/MM'), ''),
          'path', '/?open=devoirs#devoir-' || d.id::text,
          'emoji', CASE d.type WHEN 'sourate' THEN '📖' WHEN 'recitation' THEN '🎙️' WHEN 'nourania' THEN '✨' WHEN 'allah_names' THEN '🌟' WHEN 'alphabet' THEN '🔤' WHEN 'invocations' THEN '🤲' WHEN 'priere' THEN '🕌' WHEN 'coran' THEN '📗' ELSE '📚' END,
          'steps_total', jsonb_array_length(d.etapes),
          'created_at', d.created_at,
          'due', d.date_limite
        ) ORDER BY d.created_at)
        FROM devoirs d
        WHERE (d.assigned_to = 'all' OR d.student_id = p_user
               OR (d.group_id IS NOT NULL AND d.group_id IN (SELECT g.group_id FROM student_group_members g WHERE g.user_id = p_user)))
          AND (
            -- la semaine dure jusqu'à la création de la suivante (vacances : pas de nouvelle semaine, les devoirs s'ajoutent quand même)
            (d.created_at >= p_week AND d.created_at < COALESCE((SELECT min(w2.week_start) FROM weekly_programs w2 WHERE w2.student_id = p_user AND w2.week_start > p_week), 'infinity'::date))
            -- Devoir obligatoire (2026-10-26) : donné à partir du 26/10/2026 et pas fait = il reste sur le chemin jusqu'à ce qu'il
            -- soit fait, même après sa date (seulement depuis l'arrivée de l'élève)
            OR (d.created_at < p_week AND d.created_at >= '2026-10-26'::date
                AND d.created_at >= COALESCE((SELECT pr.created_at FROM profiles pr WHERE pr.user_id = p_user), '-infinity'::timestamptz)
                AND NOT program_item_done(p_user, 'devoir', d.id::text))
            -- Devoirs plus anciens : règle d'avant (30 jours, pas expirés)
            OR (d.created_at < p_week AND d.created_at < '2026-10-26'::date AND d.created_at >= p_week - 30
                AND (d.date_limite IS NULL OR d.date_limite >= p_week)
                AND NOT program_item_done(p_user, 'devoir', d.id::text))
          )
      ), '[]'::jsonb);
$function$;

CREATE OR REPLACE FUNCTION public.weekly_program_view(p_student uuid DEFAULT NULL::uuid)
 RETURNS TABLE(program_id uuid, student_id uuid, full_name text, gender text, week_start date, items jsonb, message_index smallint, teacher_note text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE all_ok boolean := public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.role() = 'service_role';
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (w.student_id) w.id, w.student_id, p.full_name, p.gender, w.week_start,
    COALESCE((SELECT jsonb_agg(it || jsonb_build_object(
                'done', program_item_done(w.student_id, it->>'module', it->>'item_id'),
                'pending', program_item_pending(w.student_id, it->>'module', it->>'item_id'),
                'done_at', program_item_done_at(w.student_id, it->>'module', it->>'item_id'),
                'steps_done', CASE WHEN it->>'module' = 'devoir'
                  THEN (SELECT count(*) FROM devoir_steps ds WHERE ds.student_id = w.student_id AND ds.devoir_id::text = it->>'item_id') ELSE 0 END))
              FROM jsonb_array_elements(program_items(w.student_id, w.week_start, w.items)) it), '[]'::jsonb),
    w.message_index, w.teacher_note
  FROM weekly_programs w JOIN profiles p ON p.user_id = w.student_id
  WHERE CASE WHEN all_ok THEN (p_student IS NULL OR w.student_id = p_student) ELSE w.student_id = auth.uid() END
  ORDER BY w.student_id, w.week_start DESC;
END $function$;

-- Bonus : chaque devoir envoyé avant SA date à rendre (ou, sans date, avant le mercredi qui suit) puis validé
CREATE OR REPLACE FUNCTION public.claim_program_reward(p_kind text)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE w record; items jsonb; all_done boolean; deadline date; late boolean;
BEGIN
  IF p_kind NOT IN ('tresor', 'bonus') THEN RETURN false; END IF;
  SELECT * INTO w FROM weekly_programs WHERE student_id = auth.uid() ORDER BY week_start DESC LIMIT 1;
  IF NOT FOUND THEN RETURN false; END IF;
  items := program_items(w.student_id, w.week_start, w.items);
  IF jsonb_array_length(items) = 0 THEN RETURN false; END IF;
  SELECT bool_and(program_item_done(w.student_id, x->>'module', x->>'item_id')) INTO all_done FROM jsonb_array_elements(items) x;
  IF NOT all_done THEN RETURN false; END IF;
  IF p_kind = 'bonus' THEN
    deadline := program_deadline(w.week_start, items);
    SELECT bool_or(CASE
        WHEN x->>'due' IS NOT NULL THEN program_item_done_at(w.student_id, x->>'module', x->>'item_id') > (x->>'due')::timestamptz
        ELSE (program_item_done_at(w.student_id, x->>'module', x->>'item_id') AT TIME ZONE 'Europe/Paris')::date >= deadline END)
      INTO late FROM jsonb_array_elements(items) x;
    IF COALESCE(late, false) THEN RETURN false; END IF;
  END IF;
  INSERT INTO program_rewards (program_id, user_id, kind) VALUES (w.id, w.student_id, p_kind) ON CONFLICT DO NOTHING;
  RETURN true;
END $function$;
