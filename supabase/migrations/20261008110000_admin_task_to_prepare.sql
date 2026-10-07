-- Onglet « 📚 Devoirs à préparer » dans la fenêtre d'un groupe (carte À FAIRE, demande de Nadia 2026-10-08)
ALTER TABLE public.admin_tasks ADD COLUMN IF NOT EXISTS to_prepare boolean NOT NULL DEFAULT false;
ALTER TABLE public.admin_task_templates ADD COLUMN IF NOT EXISTS to_prepare boolean NOT NULL DEFAULT false;
