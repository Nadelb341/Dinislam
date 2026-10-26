-- 📓 Cahier de texte côté professeur (demande de Nadia, 2026-10-26) : déroulé du cours (D), tableau de la classe (C),
-- récapitulatif (E) et idées 1 à 9. Les vacances sont celles de la table school_holidays (zone C).

-- Horaire du cours de chaque groupe (les groupes ont des horaires décalés)
CREATE TABLE IF NOT EXISTS public.group_schedules (
  group_id uuid PRIMARY KEY REFERENCES public.student_groups(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7), -- 1 = lundi … 7 = dimanche
  start_time time NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.group_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_group_schedules" ON public.group_schedules;
CREATE POLICY "read_group_schedules" ON public.group_schedules FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_group_schedules" ON public.group_schedules;
CREATE POLICY "admin_group_schedules" ON public.group_schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Idée 1 : niveaux dans un groupe (ex. « Dalil » seul, « les autres » ensemble)
CREATE TABLE IF NOT EXISTS public.group_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  member_ids uuid[] NOT NULL DEFAULT '{}',
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.group_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_group_levels" ON public.group_levels;
CREATE POLICY "admin_group_levels" ON public.group_levels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Idée 3 : consigne audio du professeur ; idée 4 : correction audio
ALTER TABLE public.devoirs ADD COLUMN IF NOT EXISTS consigne_audio_url text;
ALTER TABLE public.devoirs_rendus ADD COLUMN IF NOT EXISTS correction_audio_url text;

-- Idée 5 : « Ce qu'on a vu » pendant le cours, envoyé automatiquement aux absents (s'il est rempli)
CREATE TABLE IF NOT EXISTS public.group_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  seen text,
  seen_sent_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, session_date)
);
ALTER TABLE public.group_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_group_sessions" ON public.group_sessions;
CREATE POLICY "admin_group_sessions" ON public.group_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Idée 7 : « Prêt pour le cours ✅ » coché par l'élève
CREATE TABLE IF NOT EXISTS public.course_ready (
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_date date NOT NULL,
  ready_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, course_date)
);
ALTER TABLE public.course_ready ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_course_ready" ON public.course_ready;
CREATE POLICY "own_course_ready" ON public.course_ready FOR ALL TO authenticated
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "admin_read_course_ready" ON public.course_ready;
CREATE POLICY "admin_read_course_ready" ON public.course_ready FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Idée 8 : objectif du jour coché par l'élève (série 🔥)
CREATE TABLE IF NOT EXISTS public.daily_goals (
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL,
  label text,
  done_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, day)
);
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_daily_goals" ON public.daily_goals;
CREATE POLICY "own_daily_goals" ON public.daily_goals FOR ALL TO authenticated
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "admin_read_daily_goals" ON public.daily_goals;
CREATE POLICY "admin_read_daily_goals" ON public.daily_goals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Idée 9 : bilans des élèves (note, appréciation, message de motivation), envoyés aux parents par texto avant les vacances
CREATE TABLE IF NOT EXISTS public.student_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_label text NOT NULL,
  note numeric(4,1) CHECK (note IS NULL OR (note >= 0 AND note <= 20)),
  appreciation text,
  motivation text,
  sent_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, period_label)
);
ALTER TABLE public.student_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_student_reports" ON public.student_reports;
CREATE POLICY "admin_student_reports" ON public.student_reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_phone text;

-- Messages automatiques et leurs boutons dans la carte Notifications
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS notif_cours_prep boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS notif_adm_bilan boolean DEFAULT true;

-- En direct
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['group_schedules', 'group_levels', 'group_sessions', 'course_ready', 'daily_goals', 'student_reports'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
