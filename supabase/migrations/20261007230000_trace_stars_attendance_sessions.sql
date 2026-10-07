-- 1) Étoiles de tracé de l'Alphabet (idée 2 du 2026-10-07) : une étoile par lettre et par forme (0 isolée, 1 début, 2 milieu, 3 fin)
CREATE TABLE IF NOT EXISTS public.alphabet_trace_stars (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  letter_id integer NOT NULL REFERENCES public.alphabet_letters(id) ON DELETE CASCADE,
  form smallint NOT NULL CHECK (form BETWEEN 0 AND 3),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, letter_id, form)
);
ALTER TABLE public.alphabet_trace_stars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trace_stars_own_read" ON public.alphabet_trace_stars;
CREATE POLICY "trace_stars_own_read" ON public.alphabet_trace_stars FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "trace_stars_own_insert" ON public.alphabet_trace_stars;
CREATE POLICY "trace_stars_own_insert" ON public.alphabet_trace_stars FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 2) Séances du registre de présence : une date peut exister sans aucune présence notée
--    (avant, « ajouter la séance du jour » marquait le 1er élève présent pour créer la date)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  date date PRIMARY KEY,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendance_sessions_read" ON public.attendance_sessions;
CREATE POLICY "attendance_sessions_read" ON public.attendance_sessions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "attendance_sessions_admin" ON public.attendance_sessions;
CREATE POLICY "attendance_sessions_admin" ON public.attendance_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
INSERT INTO public.attendance_sessions (date)
  SELECT DISTINCT date FROM public.attendance_records ON CONFLICT DO NOTHING;

-- Changer la date d'une séance : déplace la séance et toutes ses présences (admin seulement)
CREATE OR REPLACE FUNCTION public.move_attendance_session(p_from date, p_to date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'Réservé à l''enseignante'; END IF;
  IF p_from = p_to THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM attendance_sessions WHERE date = p_to) OR EXISTS (SELECT 1 FROM attendance_records WHERE date = p_to) THEN
    RAISE EXCEPTION 'Il y a déjà une séance le %', to_char(p_to, 'DD/MM/YYYY');
  END IF;
  INSERT INTO attendance_sessions (date, created_by) VALUES (p_to, auth.uid());
  UPDATE attendance_records SET date = p_to WHERE date = p_from;
  DELETE FROM attendance_sessions WHERE date = p_from;
END $$;
REVOKE ALL ON FUNCTION public.move_attendance_session(date, date) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.move_attendance_session(date, date) TO authenticated;
