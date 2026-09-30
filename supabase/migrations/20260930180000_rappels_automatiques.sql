-- Rappels automatiques (accord de Nadia du 2026-09-30) : ils n'avaient jamais tourné (aucune tâche planifiée).
-- 1. Table de déduplication des rappels de devoirs (migration du 2026-05-20 jamais appliquée)
CREATE TABLE IF NOT EXISTS public.homework_reminder_logs (
  devoir_id uuid NOT NULL REFERENCES public.devoirs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (devoir_id, student_id)
);
ALTER TABLE public.homework_reminder_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_homework_reminder_logs" ON public.homework_reminder_logs;
CREATE POLICY "admin_homework_reminder_logs" ON public.homework_reminder_logs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Notifications programmées : jour du dernier envoi (évite les doublons)
ALTER TABLE public.scheduled_notifications ADD COLUMN IF NOT EXISTS last_sent_on date;

-- 3. Tâches planifiées
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('dinislam-homework-reminders', 'dinislam-scheduled-notifications');

-- Rappels de devoirs : 16 h et 17 h UTC ; la fonction n'agit que s'il est 18 h à Paris (été comme hiver)
SELECT cron.schedule('dinislam-homework-reminders', '0 16,17 * * *', $$
  SELECT net.http_post(
    url := 'https://zgnxqhfcmdonvdxqpekl.supabase.co/functions/v1/homework-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbnhxaGZjbWRvbnZkeHFwZWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTQ3NTgsImV4cCI6MjEwNjI5MDc1OH0.F79Qws-3I-jUxGXC_sWCd20B3h8tmdcsT-_q_uMRgxo', 'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbnhxaGZjbWRvbnZkeHFwZWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTQ3NTgsImV4cCI6MjEwNjI5MDc1OH0.F79Qws-3I-jUxGXC_sWCd20B3h8tmdcsT-_q_uMRgxo'),
    body := '{}'::jsonb
  );
$$);

-- Notifications programmées : toutes les 5 minutes
SELECT cron.schedule('dinislam-scheduled-notifications', '*/5 * * * *', $$
  SELECT net.http_post(
    url := 'https://zgnxqhfcmdonvdxqpekl.supabase.co/functions/v1/process-scheduled-notifications',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbnhxaGZjbWRvbnZkeHFwZWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTQ3NTgsImV4cCI6MjEwNjI5MDc1OH0.F79Qws-3I-jUxGXC_sWCd20B3h8tmdcsT-_q_uMRgxo', 'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbnhxaGZjbWRvbnZkeHFwZWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTQ3NTgsImV4cCI6MjEwNjI5MDc1OH0.F79Qws-3I-jUxGXC_sWCd20B3h8tmdcsT-_q_uMRgxo'),
    body := '{}'::jsonb
  );
$$);
