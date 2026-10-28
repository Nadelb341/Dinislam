-- 👨‍👩‍👧 Espace parents + 📊 Bilan trimestriel + 🙋 absences justifiées (2026-10-28, choix de Nadia)

-- ── Fiche élève ──
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ask_birth_date boolean NOT NULL DEFAULT true;      -- message « ta date de naissance » (Nadia peut le couper)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS children_question text CHECK (children_question IN ('non', 'oui')); -- élève adulte : « as-tu des enfants élèves ? »
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bilan_arabe text CHECK (bilan_arabe IN ('fusha', 'darija')); -- bilan aussi en arabe (null = français seul)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS espace_parents text NOT NULL DEFAULT 'auto' CHECK (espace_parents IN ('auto', 'on', 'off')); -- auto = moins de 18 ans

-- ── Codes des parents (6 chiffres, jusqu'à 2 par enfant : ex. Maman et Papa), jamais lisibles par l'appli ──
CREATE TABLE IF NOT EXISTS public.parent_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL,
  label text NOT NULL,
  code_hash text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_id, label)
);
ALTER TABLE public.parent_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_parent_codes ON public.parent_codes;
CREATE POLICY admin_parent_codes ON public.parent_codes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── Parent (élève adulte) ↔ ses enfants élèves ──
CREATE TABLE IF NOT EXISTS public.parent_links (
  parent_id uuid NOT NULL,
  child_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_id, child_id)
);
ALTER TABLE public.parent_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_parent_links ON public.parent_links;
CREATE POLICY admin_parent_links ON public.parent_links FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS read_own_parent_links ON public.parent_links;
CREATE POLICY read_own_parent_links ON public.parent_links FOR SELECT USING (parent_id = auth.uid() OR child_id = auth.uid());
DROP POLICY IF EXISTS parent_unlink_own ON public.parent_links;
CREATE POLICY parent_unlink_own ON public.parent_links FOR DELETE USING (parent_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_parent_of(p_parent uuid, p_child uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM parent_links WHERE parent_id = p_parent AND child_id = p_child);
$$;

-- L'enfant lui-même (ses parents utilisent son compte), un parent relié, ou Nadia
CREATE OR REPLACE FUNCTION public.can_act_for_child(p_child uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT auth.uid() = p_child OR public.is_parent_of(auth.uid(), p_child) OR public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

-- ── Absences justifiées par les parents ──
CREATE TABLE IF NOT EXISTS public.absence_justifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  course_date date NOT NULL,
  reason text,
  declared_by uuid,
  declared_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_date)
);
ALTER TABLE public.absence_justifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_absence_justifications ON public.absence_justifications;
CREATE POLICY admin_absence_justifications ON public.absence_justifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS read_absence_justifications ON public.absence_justifications;
CREATE POLICY read_absence_justifications ON public.absence_justifications FOR SELECT USING (public.can_act_for_child(student_id));

-- Idée 3 : message aux parents si l'enfant est noté absent sans justification (une seule fois)
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS absence_alert_sent_at timestamptz;

-- ── Idée I : comportement noté pendant le cours ──
CREATE TABLE IF NOT EXISTS public.behavior_marks (
  student_id uuid NOT NULL,
  course_date date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('attentif', 'participe', 'bavarde')),
  marked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, course_date, kind)
);
ALTER TABLE public.behavior_marks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_behavior_marks ON public.behavior_marks;
CREATE POLICY admin_behavior_marks ON public.behavior_marks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── « Validé du premier coup » : on retient qu'un devoir a été « à refaire » au moins une fois ──
ALTER TABLE public.devoirs_rendus ADD COLUMN IF NOT EXISTS a_ete_refait boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.devoirs_rendus_trace_refait() RETURNS trigger
LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.statut = 'a_refaire' THEN NEW.a_ete_refait := true; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_devoirs_rendus_refait ON public.devoirs_rendus;
CREATE TRIGGER trg_devoirs_rendus_refait BEFORE INSERT OR UPDATE OF statut ON public.devoirs_rendus
  FOR EACH ROW EXECUTE FUNCTION public.devoirs_rendus_trace_refait();

-- ── Bilan trimestriel : on garde student_reports (les anciens bilans restent) et on ajoute la nouvelle présentation ──
ALTER TABLE public.student_reports ADD COLUMN IF NOT EXISTS snapshot jsonb;          -- chiffres figés à l'envoi (tuiles, frise, progression)
ALTER TABLE public.student_reports ADD COLUMN IF NOT EXISTS guide jsonb;             -- points forts / à travailler / à la maison / objectif
ALTER TABLE public.student_reports ADD COLUMN IF NOT EXISTS show_note boolean NOT NULL DEFAULT false;
ALTER TABLE public.student_reports ADD COLUMN IF NOT EXISTS traduction jsonb;        -- version arabe relue par Nadia
ALTER TABLE public.student_reports ADD COLUMN IF NOT EXISTS langue_ar text CHECK (langue_ar IN ('fusha', 'darija'));
ALTER TABLE public.student_reports ADD COLUMN IF NOT EXISTS share_token text UNIQUE; -- lien envoyé par message
ALTER TABLE public.student_reports ADD COLUMN IF NOT EXISTS period_start date;
ALTER TABLE public.student_reports ADD COLUMN IF NOT EXISTS period_end date;

-- Idée 2 : accusé de lecture (« Lu par Maman le … »)
CREATE TABLE IF NOT EXISTS public.bilan_reads (
  report_id uuid NOT NULL REFERENCES public.student_reports(id) ON DELETE CASCADE,
  label text NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (report_id, label)
);
ALTER TABLE public.bilan_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_bilan_reads ON public.bilan_reads;
CREATE POLICY admin_bilan_reads ON public.bilan_reads FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ── Fonctions de l'Espace parents (le code n'est jamais renvoyé à l'appli) ──

CREATE OR REPLACE FUNCTION public.parent_code_label(p_child uuid, p_code text) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'extensions' AS $$
  SELECT label FROM parent_codes WHERE child_id = p_child AND code_hash = extensions.crypt(p_code, code_hash) LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.parent_code_label(uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.parent_space_info(p_child uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  RETURN jsonb_build_object('labels', COALESCE((SELECT jsonb_agg(label ORDER BY created_at) FROM parent_codes WHERE child_id = p_child), '[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.parent_code_create(p_child uuid, p_label text, p_code text, p_current text DEFAULT NULL) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions' AS $$
DECLARE n int;
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF p_code !~ '^[0-9]{6}$' THEN RAISE EXCEPTION 'Le code doit avoir 6 chiffres'; END IF;
  IF COALESCE(btrim(p_label), '') = '' THEN RAISE EXCEPTION 'Indiquez qui crée le code (ex. Maman)'; END IF;
  SELECT count(*) INTO n FROM parent_codes WHERE child_id = p_child;
  IF n >= 2 THEN RAISE EXCEPTION 'Il y a déjà 2 codes pour cet enfant'; END IF;
  -- Un 2e code ne peut être créé que par quelqu'un qui connaît déjà le 1er
  IF n > 0 AND (p_current IS NULL OR public.parent_code_label(p_child, p_current) IS NULL) THEN RAISE EXCEPTION 'Code actuel incorrect'; END IF;
  INSERT INTO parent_codes (child_id, label, code_hash, created_by) VALUES (p_child, btrim(p_label), extensions.crypt(p_code, extensions.gen_salt('bf')), auth.uid());
  RETURN btrim(p_label);
END $$;

CREATE OR REPLACE FUNCTION public.parent_code_check(p_child uuid, p_code text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l text;
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  l := public.parent_code_label(p_child, p_code);
  IF l IS NULL THEN PERFORM pg_sleep(0.5); END IF; -- freine les essais au hasard
  RETURN l;
END $$;

-- Enfants reliés au parent connecté, triés par prénom
CREATE OR REPLACE FUNCTION public.parent_children() RETURNS TABLE(child_id uuid, full_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT l.child_id, p.full_name FROM parent_links l JOIN profiles p ON p.user_id = l.child_id
  WHERE l.parent_id = auth.uid() ORDER BY lower(p.full_name);
$$;

-- Prénom écrit en entier → élèves qui portent ce prénom (prénom + initiale du nom, pas plus)
CREATE OR REPLACE FUNCTION public.find_students_by_first_name(p_first text) RETURNS TABLE(user_id uuid, display text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH norm AS (SELECT translate(lower(btrim(p_first)), 'àâäáãéèêëíìîïóòôöõúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn') AS q)
  SELECT p.user_id,
         split_part(btrim(p.full_name), ' ', 1) || COALESCE(' ' || NULLIF(left(btrim(substr(btrim(p.full_name), length(split_part(btrim(p.full_name), ' ', 1)) + 1)), 1), '') || '.', '')
  FROM profiles p, norm
  WHERE length(norm.q) >= 2 AND auth.uid() IS NOT NULL AND p.user_id <> auth.uid() AND p.is_approved
    AND NOT public.has_role(p.user_id, 'admin'::public.app_role)
    AND translate(lower(split_part(btrim(p.full_name), ' ', 1)), 'àâäáãéèêëíìîïóòôöõúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn') = norm.q
  ORDER BY p.full_name LIMIT 10;
$$;

CREATE OR REPLACE FUNCTION public.link_children(p_children uuid[]) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  INSERT INTO parent_links (parent_id, child_id)
    SELECT auth.uid(), c FROM unnest(p_children) c JOIN profiles p ON p.user_id = c AND p.is_approved
    WHERE c <> auth.uid() ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  UPDATE profiles SET children_question = 'oui' WHERE user_id = auth.uid();
  RETURN n;
END $$;

-- 🙋 Absence justifiée par un parent (code demandé)
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
  RETURN l;
END $$;

-- 📊 Bilans envoyés d'un enfant (code demandé)
CREATE OR REPLACE FUNCTION public.parent_bilans(p_child uuid, p_code text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF public.parent_code_label(p_child, p_code) IS NULL THEN PERFORM pg_sleep(0.5); RAISE EXCEPTION 'Code parents incorrect'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'id', r.id, 'period_label', r.period_label, 'snapshot', r.snapshot, 'guide', r.guide, 'appreciation', r.appreciation,
      'motivation', r.motivation, 'note', CASE WHEN r.show_note THEN r.note END, 'traduction', r.traduction, 'langue_ar', r.langue_ar,
      'sent_at', r.sent_at, 'lu', EXISTS (SELECT 1 FROM bilan_reads b WHERE b.report_id = r.id)) ORDER BY r.sent_at DESC)
    FROM student_reports r WHERE r.student_id = p_child AND r.sent_at IS NOT NULL AND r.snapshot IS NOT NULL), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.bilan_mark_read(p_report uuid, p_code text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE c uuid; l text;
BEGIN
  SELECT student_id INTO c FROM student_reports WHERE id = p_report;
  IF c IS NULL OR NOT public.can_act_for_child(c) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  l := public.parent_code_label(c, p_code);
  IF l IS NULL THEN RAISE EXCEPTION 'Code parents incorrect'; END IF;
  INSERT INTO bilan_reads (report_id, label) VALUES (p_report, l) ON CONFLICT DO NOTHING;
END $$;

-- 🔗 Lien envoyé par message : ouvrable sans compte, avec le code parents
CREATE OR REPLACE FUNCTION public.bilan_public(p_token text, p_code text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r student_reports; l text; nom text;
BEGIN
  SELECT * INTO r FROM student_reports WHERE share_token = p_token AND sent_at IS NOT NULL;
  IF r.id IS NULL THEN PERFORM pg_sleep(0.5); RAISE EXCEPTION 'Lien inconnu'; END IF;
  l := public.parent_code_label(r.student_id, p_code);
  IF l IS NULL THEN PERFORM pg_sleep(0.5); RAISE EXCEPTION 'Code parents incorrect'; END IF;
  INSERT INTO bilan_reads (report_id, label) VALUES (r.id, l) ON CONFLICT DO NOTHING;
  SELECT full_name INTO nom FROM profiles WHERE user_id = r.student_id;
  RETURN jsonb_build_object('id', r.id, 'full_name', nom, 'period_label', r.period_label, 'snapshot', r.snapshot, 'guide', r.guide,
    'appreciation', r.appreciation, 'motivation', r.motivation, 'note', CASE WHEN r.show_note THEN r.note END,
    'traduction', r.traduction, 'langue_ar', r.langue_ar, 'sent_at', r.sent_at);
END $$;
GRANT EXECUTE ON FUNCTION public.bilan_public(text, text) TO anon, authenticated;

-- 📓 Idée 4 : le cahier de texte de l'enfant, en lecture seule pour un parent relié
CREATE OR REPLACE FUNCTION public.parent_child_devoirs(p_child uuid, p_code text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF public.parent_code_label(p_child, p_code) IS NULL THEN PERFORM pg_sleep(0.5); RAISE EXCEPTION 'Code parents incorrect'; END IF;
  RETURN jsonb_build_object(
    'groups', COALESCE((SELECT jsonb_agg(group_id) FROM student_group_members WHERE user_id = p_child), '[]'::jsonb),
    'devoirs', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', d.id, 'titre', d.titre, 'type', d.type, 'created_at', d.created_at,
        'visible_a', d.visible_a, 'date_limite', d.date_limite, 'group_id', d.group_id,
        'statut', (SELECT r.statut FROM devoirs_rendus r WHERE r.devoir_id = d.id AND r.student_id = p_child LIMIT 1),
        'rendu_at', (SELECT r.rendu_at FROM devoirs_rendus r WHERE r.devoir_id = d.id AND r.student_id = p_child LIMIT 1)) ORDER BY d.created_at DESC)
      FROM devoirs d
      WHERE (d.assigned_to = 'all' OR d.student_id = p_child OR d.group_id IN (SELECT group_id FROM student_group_members WHERE user_id = p_child))
        AND (d.visible_a IS NULL OR d.visible_a <= now()) AND d.created_at >= now() - interval '45 days'), '[]'::jsonb));
END $$;

-- ⚠️ Idée 3 : élèves notés absents aujourd'hui, sans justification, 15 min après le début de leur cours (lu par le serveur)
CREATE OR REPLACE FUNCTION public.absence_alert_targets() RETURNS TABLE(record_id uuid, student_id uuid, full_name text, gender text, parent_ids uuid[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT a.id, a.user_id, p.full_name, p.gender,
         COALESCE((SELECT array_agg(l.parent_id) FROM parent_links l WHERE l.child_id = a.user_id), '{}')
  FROM attendance_records a JOIN profiles p ON p.user_id = a.user_id
  WHERE a.status = 'absent' AND a.absence_alert_sent_at IS NULL
    AND a.date = (now() AT TIME ZONE 'Europe/Paris')::date
    AND NOT EXISTS (SELECT 1 FROM absence_justifications j WHERE j.student_id = a.user_id AND j.course_date = a.date)
    AND EXISTS (SELECT 1 FROM student_group_members m JOIN group_schedules s ON s.group_id = m.group_id
                WHERE m.user_id = a.user_id AND s.weekday = extract(isodow FROM a.date)
                  AND (now() AT TIME ZONE 'Europe/Paris')::time BETWEEN s.start_time + interval '15 minutes' AND s.start_time + interval '4 hours');
$$;
REVOKE ALL ON FUNCTION public.absence_alert_targets() FROM PUBLIC, anon, authenticated;

-- ── En direct ──
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['parent_links', 'absence_justifications', 'behavior_marks', 'bilan_reads', 'student_reports'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
