
-- Table for application logs
CREATE TABLE public.app_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  context jsonb DEFAULT '{}',
  user_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage app_logs" ON public.app_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX idx_app_logs_level ON public.app_logs(level);
CREATE INDEX idx_app_logs_created_at ON public.app_logs(created_at DESC);

-- Table for notification send history
CREATE TABLE public.notification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'broadcast',
  sent_by uuid,
  total_recipients integer NOT NULL DEFAULT 0,
  successful_sends integer NOT NULL DEFAULT 0,
  failed_sends integer NOT NULL DEFAULT 0,
  expired_cleaned integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification_history" ON public.notification_history
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
