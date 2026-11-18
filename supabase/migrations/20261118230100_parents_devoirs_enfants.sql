-- 2026-11-18 — Choix de Nadia (idée 16, modèle 2 « Carte à part sur l'accueil » + idées 1, 2, 3) :
-- un parent relié et CONFIRMÉ voit les devoirs de la semaine de chaque enfant (mêmes états que les diamants),
-- reçoit « 📓 <Enfant> : nouveaux devoirs » (catégorie par_dev) et un rappel la veille si pas fait (par_rap).
-- Rien ne se mélange avec ses propres devoirs : carte à part, catégories à part, interrupteurs à part.

-- (1) Le programme de la semaine d'un enfant est lisible par son parent confirmé (et seulement lui)
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
  WHERE CASE WHEN all_ok THEN (p_student IS NULL OR w.student_id = p_student)
             ELSE (w.student_id = COALESCE(p_student, auth.uid())
                   AND (w.student_id = auth.uid() OR public.is_parent_of(auth.uid(), w.student_id))) END
  ORDER BY w.student_id, w.week_start DESC;
END $function$;

-- (2) Interrupteurs à part dans ⚙️ Paramètres › Espace parents
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS notif_par_dev boolean DEFAULT true; -- 📓 nouveaux devoirs d'un enfant
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS notif_par_rap boolean DEFAULT true; -- ⏰ rappel la veille (enfant)
