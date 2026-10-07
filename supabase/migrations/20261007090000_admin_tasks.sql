-- Carte « À FAIRE » de l'accueil (enseignante seulement, demande de Nadia 2026-10-07) :
-- tâches rapides rangées par groupe d'élèves (group_id NULL = « Général »).
CREATE TABLE IF NOT EXISTS public.admin_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.student_groups(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  due_date date,
  remind_at timestamptz,
  reminded_at timestamptz,
  student_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recurrence text CHECK (recurrence IN ('weekly')),
  urgent boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_tasks_group_idx ON public.admin_tasks (group_id, done, position);
CREATE INDEX IF NOT EXISTS admin_tasks_remind_idx ON public.admin_tasks (remind_at) WHERE reminded_at IS NULL AND done = false;
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_all_admin_tasks ON public.admin_tasks;
CREATE POLICY admin_all_admin_tasks ON public.admin_tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Interrupteur de la notification « Rappel d'une tâche À FAIRE » (bouclier › Notifs › Espace enseignante)
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS notif_adm_task boolean NOT NULL DEFAULT true;
