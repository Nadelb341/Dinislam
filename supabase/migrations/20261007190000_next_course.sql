-- « 🎒 À faire au prochain cours » dans la carte À FAIRE (proposition C choisie par Nadia, 2026-10-07)
ALTER TABLE public.admin_tasks ADD COLUMN IF NOT EXISTS next_course boolean NOT NULL DEFAULT false;
-- 🧳 À apporter par les élèves (cahier, Coran…) — fait aussi partie du prochain cours
ALTER TABLE public.admin_tasks ADD COLUMN IF NOT EXISTS to_bring boolean NOT NULL DEFAULT false;
-- 🔁 Nombre de fois où la ligne a été reportée au cours suivant (« Terminer le cours » sans l'avoir faite)
ALTER TABLE public.admin_tasks ADD COLUMN IF NOT EXISTS carried integer NOT NULL DEFAULT 0;

-- Modèles : lignes qui reviennent souvent, ajoutées en un clic
CREATE TABLE IF NOT EXISTS public.admin_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(trim(title)) > 0),
  next_course boolean NOT NULL DEFAULT true,
  to_bring boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_task_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_all_admin_task_templates ON public.admin_task_templates;
CREATE POLICY admin_all_admin_task_templates ON public.admin_task_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
