-- 1) Rappel du mardi personnalisé (idée 2, 2026-10-08) : sourate et leçon Nourania en cours de chaque élève
--    Sourate en cours = 1ʳᵉ pas encore validée dans l'ordre du parcours (114, 113, 112, Ayat Al-Kursi, 111 … 1)
--    Leçon en cours = 1ʳᵉ leçon Nourania pas encore validée (ordre des numéros)
CREATE OR REPLACE FUNCTION public.course_reminder_targets()
RETURNS TABLE(user_id uuid, full_name text, gender text, sourate text, lecon text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.user_id, p.full_name, p.gender,
    (SELECT split_part(s.name_french, ' (', 1) FROM sourates s
      WHERE NOT EXISTS (SELECT 1 FROM user_sourate_progress u WHERE u.user_id = p.user_id AND u.sourate_id = s.id AND u.is_validated AND u.context = 'sourates')
      ORDER BY CASE WHEN s.number = 1000 THEN 111.5 ELSE s.number END DESC LIMIT 1),
    (SELECT 'leçon ' || l.lesson_number FROM nourania_lessons l
      WHERE NOT EXISTS (SELECT 1 FROM user_nourania_progress u WHERE u.user_id = p.user_id AND u.lesson_id = l.id AND u.is_validated)
      ORDER BY l.lesson_number LIMIT 1)
  FROM profiles p
  WHERE p.is_approved AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id AND r.role = 'admin');
$$;
REVOKE ALL ON FUNCTION public.course_reminder_targets() FROM public, anon, authenticated;

-- 2) Pause pendant les vacances scolaires (idée 3) : périodes modifiables par l'enseignante + case par notification
CREATE TABLE IF NOT EXISTS public.school_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
ALTER TABLE public.school_holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "school_holidays_read" ON public.school_holidays;
CREATE POLICY "school_holidays_read" ON public.school_holidays FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "school_holidays_admin" ON public.school_holidays;
CREATE POLICY "school_holidays_admin" ON public.school_holidays FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Zone C (académie de Montpellier), calendrier officiel 2026-2027 : du samedi de départ à la veille de la reprise
INSERT INTO public.school_holidays (label, start_date, end_date)
SELECT v.label, v.s::date, v.e::date FROM (VALUES
  ('Vacances de la Toussaint', '2026-10-17', '2026-11-01'),
  ('Vacances de Noël', '2026-12-19', '2027-01-03'),
  ('Vacances d''hiver', '2027-02-06', '2027-02-21'),
  ('Vacances de printemps', '2027-04-03', '2027-04-18'),
  ('Vacances d''été', '2027-07-03', '2027-08-31')
) AS v(label, s, e)
WHERE NOT EXISTS (SELECT 1 FROM public.school_holidays h WHERE h.label = v.label AND h.start_date = v.s::date);

ALTER TABLE public.scheduled_notifications ADD COLUMN IF NOT EXISTS skip_holidays boolean NOT NULL DEFAULT false;
UPDATE public.scheduled_notifications SET skip_holidays = true WHERE module = 'cours';
