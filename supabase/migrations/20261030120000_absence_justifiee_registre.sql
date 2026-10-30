-- 🔵 « Absence justifiée » dans le Registre de présence (2026-10-30, demande de Nadia) :
-- quand un parent signale une absence, la case de l'élève passe en bleu dans le registre, toute seule.
-- Statut 'justified' dans attendance_records (présent / absent / en retard / absence justifiée).

-- 1. Le parent justifie : la justification ET le registre (sans écraser un « présent » ou un « en retard » déjà noté)
CREATE OR REPLACE FUNCTION public.justify_absence(p_child uuid, p_code text, p_dates date[], p_reason text DEFAULT NULL) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l text;
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  l := public.parent_code_label(p_child, p_code);
  IF l IS NULL THEN PERFORM pg_sleep(0.5); RAISE EXCEPTION 'Code parents incorrect'; END IF;
  INSERT INTO absence_justifications (student_id, course_date, reason, declared_by, declared_label)
    SELECT p_child, d, NULLIF(btrim(p_reason), ''), auth.uid(), l FROM unnest(p_dates) d
  ON CONFLICT (student_id, course_date) DO UPDATE SET reason = EXCLUDED.reason, declared_by = EXCLUDED.declared_by, declared_label = EXCLUDED.declared_label, created_at = now();
  INSERT INTO attendance_records (user_id, date, status, notes)
    SELECT p_child, d, 'justified', NULLIF(btrim(p_reason), '') FROM unnest(p_dates) d
  ON CONFLICT (user_id, date) DO UPDATE SET status = 'justified', notes = COALESCE(EXCLUDED.notes, attendance_records.notes)
    WHERE attendance_records.status = 'absent';
  RETURN l;
END $$;

-- 2. Les absences déjà signalées (règle « une nouvelle règle s'applique aussi aux anciennes données »)
INSERT INTO attendance_records (user_id, date, status, notes)
  SELECT j.student_id, j.course_date, 'justified', j.reason FROM absence_justifications j
ON CONFLICT (user_id, date) DO UPDATE SET status = 'justified' WHERE attendance_records.status = 'absent';
