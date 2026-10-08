-- 💎 « Mon chemin de la semaine » (choix « 2 » de Nadia, 2026-10-08) : chaque mercredi 21 h, un programme par élève
--    = l'étape suivante de chaque carte VISIBLE pour lui (Nourania, Sourates, 99 Noms, Alphabet, Invocations, Prière).
CREATE TABLE IF NOT EXISTS public.weekly_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  message_index smallint NOT NULL DEFAULT 0,
  teacher_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, week_start)
);
ALTER TABLE public.weekly_programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "weekly_programs_read" ON public.weekly_programs;
CREATE POLICY "weekly_programs_read" ON public.weekly_programs FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "weekly_programs_admin" ON public.weekly_programs;
CREATE POLICY "weekly_programs_admin" ON public.weekly_programs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Réglages : programme automatique activé, groupes exclus
CREATE TABLE IF NOT EXISTS public.weekly_program_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  disabled_group_ids uuid[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.weekly_program_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE public.weekly_program_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "weekly_program_settings_admin" ON public.weekly_program_settings;
CREATE POLICY "weekly_program_settings_admin" ON public.weekly_program_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Une carte est-elle visible pour cet élève ? (même règle que l'accueil : ciblage personnes/groupes, sinon « affichée »)
CREATE OR REPLACE FUNCTION public.module_visible_for(p_path text, p_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT CASE
      WHEN v.visibility_type = 'users' THEN p_user = ANY(v.user_ids)
      WHEN v.visibility_type = 'groups' THEN EXISTS (SELECT 1 FROM student_group_members g WHERE g.user_id = p_user AND g.group_id = ANY(v.group_ids))
      ELSE m.is_active END
    FROM learning_modules m LEFT JOIN module_visibility v ON v.module_id = m.id
    WHERE m.builtin_path = p_path LIMIT 1), false);
$$;

-- Étapes suivantes d'un élève (une par carte visible qui a encore quelque chose à valider)
CREATE OR REPLACE FUNCTION public.next_program_items(p_user uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE items jsonb := '[]'::jsonb; r record;
BEGIN
  IF module_visible_for('/nourania', p_user) THEN
    SELECT l.id::text AS id, 'Leçon ' || l.lesson_number AS detail INTO r FROM nourania_lessons l
      WHERE NOT EXISTS (SELECT 1 FROM user_nourania_progress u WHERE u.user_id = p_user AND u.lesson_id = l.id AND u.is_validated)
      ORDER BY l.lesson_number LIMIT 1;
    IF FOUND THEN items := items || jsonb_build_object('module','nourania','item_id',r.id,'label','Nourania','detail',r.detail,'path','/nourania','emoji','✨'); END IF;
  END IF;
  IF module_visible_for('/sourates', p_user) THEN
    SELECT s.id::text AS id, split_part(s.name_french, ' (', 1) AS detail INTO r FROM sourates s
      WHERE NOT EXISTS (SELECT 1 FROM user_sourate_progress u WHERE u.user_id = p_user AND u.sourate_id = s.id AND u.is_validated AND u.context = 'sourates')
      ORDER BY CASE WHEN s.number = 1000 THEN 111.5 ELSE s.number END DESC LIMIT 1;
    IF FOUND THEN items := items || jsonb_build_object('module','sourates','item_id',r.id,'label','Sourate','detail',r.detail,'path','/sourates','emoji','📖'); END IF;
  END IF;
  IF module_visible_for('/allah-names', p_user) THEN
    SELECT a.id::text AS id, 'Nom n° ' || a.display_order || COALESCE(' · ' || NULLIF(a.transliteration, ''), '') AS detail INTO r FROM allah_names a
      WHERE NOT EXISTS (SELECT 1 FROM user_allah_name_progress u WHERE u.user_id = p_user AND u.name_id = a.id AND u.is_validated)
      ORDER BY a.display_order LIMIT 1;
    IF FOUND THEN items := items || jsonb_build_object('module','allah_names','item_id',r.id,'label','99 Noms','detail',r.detail,'path','/allah-names','emoji','🌟'); END IF;
  END IF;
  IF module_visible_for('/alphabet', p_user) THEN
    SELECT a.id::text AS id, 'Lettre ' || a.name_french || ' ' || a.letter_arabic AS detail INTO r FROM alphabet_letters a
      WHERE NOT EXISTS (SELECT 1 FROM user_alphabet_progress u WHERE u.user_id = p_user AND u.letter_id = a.id AND u.is_validated)
      ORDER BY a.display_order LIMIT 1;
    IF FOUND THEN items := items || jsonb_build_object('module','alphabet','item_id',r.id,'label','Alphabet','detail',r.detail,'path','/alphabet','emoji','🔤'); END IF;
  END IF;
  IF module_visible_for('/invocations', p_user) THEN
    SELECT i.id::text AS id, COALESCE(NULLIF(i.title_french, ''), i.title_arabic) AS detail INTO r FROM invocations i
      WHERE NOT EXISTS (SELECT 1 FROM user_invocation_progress u WHERE u.user_id = p_user AND u.invocation_id = i.id AND u.is_validated)
      ORDER BY i.display_order LIMIT 1;
    IF FOUND THEN items := items || jsonb_build_object('module','invocations','item_id',r.id,'label','Invocation','detail',r.detail,'path','/invocations','emoji','🤲'); END IF;
  END IF;
  IF module_visible_for('/priere', p_user) THEN
    SELECT c.id::text AS id, COALESCE(NULLIF(c.title_french, ''), c.title, c.title_arabic) AS detail INTO r FROM prayer_cards c
      WHERE NOT EXISTS (SELECT 1 FROM user_prayer_progress u WHERE u.user_id = p_user AND u.card_id = c.id AND u.is_validated)
      ORDER BY c.display_order LIMIT 1;
    IF FOUND THEN items := items || jsonb_build_object('module','priere','item_id',r.id,'label','Prière','detail',r.detail,'path','/priere','emoji','🕌'); END IF;
  END IF;
  RETURN items;
END $$;

-- Une étape du programme est-elle validée ?
CREATE OR REPLACE FUNCTION public.program_item_done(p_user uuid, p_module text, p_item text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE p_module
    WHEN 'nourania' THEN EXISTS (SELECT 1 FROM user_nourania_progress u WHERE u.user_id = p_user AND u.lesson_id::text = p_item AND u.is_validated)
    WHEN 'sourates' THEN EXISTS (SELECT 1 FROM user_sourate_progress u WHERE u.user_id = p_user AND u.sourate_id::text = p_item AND u.is_validated AND u.context = 'sourates')
    WHEN 'allah_names' THEN EXISTS (SELECT 1 FROM user_allah_name_progress u WHERE u.user_id = p_user AND u.name_id::text = p_item AND u.is_validated)
    WHEN 'alphabet' THEN EXISTS (SELECT 1 FROM user_alphabet_progress u WHERE u.user_id = p_user AND u.letter_id::text = p_item AND u.is_validated)
    WHEN 'invocations' THEN EXISTS (SELECT 1 FROM user_invocation_progress u WHERE u.user_id = p_user AND u.invocation_id::text = p_item AND u.is_validated)
    WHEN 'priere' THEN EXISTS (SELECT 1 FROM user_prayer_progress u WHERE u.user_id = p_user AND u.card_id::text = p_item AND u.is_validated)
    ELSE false END;
$$;

-- Le dernier programme de chaque élève, avec l'état « validé » de chaque diamant.
-- Élève : seulement le sien. Enseignante (ou fonction serveur) : tous, ou un élève précis.
CREATE OR REPLACE FUNCTION public.weekly_program_view(p_student uuid DEFAULT NULL)
RETURNS TABLE(program_id uuid, student_id uuid, full_name text, gender text, week_start date, items jsonb, message_index smallint, teacher_note text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE all_ok boolean := public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.role() = 'service_role';
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (w.student_id) w.id, w.student_id, p.full_name, p.gender, w.week_start,
    COALESCE((SELECT jsonb_agg(it || jsonb_build_object('done', program_item_done(w.student_id, it->>'module', it->>'item_id')))
              FROM jsonb_array_elements(w.items) it), '[]'::jsonb),
    w.message_index, w.teacher_note
  FROM weekly_programs w JOIN profiles p ON p.user_id = w.student_id
  WHERE CASE WHEN all_ok THEN (p_student IS NULL OR w.student_id = p_student) ELSE w.student_id = auth.uid() END
  ORDER BY w.student_id, w.week_start DESC;
END $$;
GRANT EXECUTE ON FUNCTION public.weekly_program_view(uuid) TO authenticated;

-- Création des programmes de la semaine (fonction serveur du mercredi 21 h, ou bouton de l'enseignante)
CREATE OR REPLACE FUNCTION public.generate_weekly_programs(p_week date)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s record; it jsonb; last_idx smallint; idx smallint; n integer := 0; excluded uuid[];
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.role() = 'service_role') THEN RAISE EXCEPTION 'Réservé à l''enseignante'; END IF;
  SELECT disabled_group_ids INTO excluded FROM weekly_program_settings WHERE id = 1;
  FOR s IN SELECT p.user_id FROM profiles p
    WHERE p.is_approved AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'admin')
      AND NOT EXISTS (SELECT 1 FROM student_group_members g WHERE g.user_id = p.user_id AND g.group_id = ANY(COALESCE(excluded, '{}')))
  LOOP
    it := next_program_items(s.user_id);
    IF jsonb_array_length(it) = 0 THEN CONTINUE; END IF;
    SELECT w.message_index INTO last_idx FROM weekly_programs w WHERE w.student_id = s.user_id ORDER BY week_start DESC LIMIT 1;
    idx := floor(random() * 24)::smallint;
    IF idx = last_idx THEN idx := ((idx + 1) % 24)::smallint; END IF; -- jamais le même message 2 semaines de suite
    INSERT INTO weekly_programs (student_id, week_start, items, message_index) VALUES (s.user_id, p_week, it, idx)
      ON CONFLICT (student_id, week_start) DO NOTHING;
    IF FOUND THEN n := n + 1; END IF;
  END LOOP;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.generate_weekly_programs(date) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.generate_weekly_programs(date) TO authenticated;
REVOKE ALL ON FUNCTION public.next_program_items(uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.program_item_done(uuid, text, text) FROM public, anon, authenticated;

-- Interrupteurs de notifications : « Mon chemin de la semaine » (élève) et « Récap du lundi » (enseignante)
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS notif_prog_week boolean NOT NULL DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS notif_adm_recap boolean NOT NULL DEFAULT true;
