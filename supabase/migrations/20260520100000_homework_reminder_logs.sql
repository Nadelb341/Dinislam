-- Table de déduplication pour les rappels de devoirs
CREATE TABLE IF NOT EXISTS public.homework_reminder_logs (
  devoir_id uuid NOT NULL REFERENCES public.devoirs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (devoir_id, student_id)
);

ALTER TABLE public.homework_reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_homework_reminder_logs"
  ON public.homework_reminder_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
