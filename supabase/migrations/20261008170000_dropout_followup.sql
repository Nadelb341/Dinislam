-- Suivi des décrocheurs, mélange des idées 1 + 4 + 5 (choix de Nadia, 2026-10-08)

-- Journal des encouragements envoyés (à la main ou automatiquement) : affiché dans la fiche « suivi » de l'élève
CREATE TABLE IF NOT EXISTS public.encouragement_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  automatic boolean NOT NULL DEFAULT false,
  sent_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.encouragement_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "encouragement_logs_admin" ON public.encouragement_logs;
CREATE POLICY "encouragement_logs_admin" ON public.encouragement_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Idée 1 : relance automatique douce (interrupteur dans le Cahier de texte)
ALTER TABLE public.weekly_program_settings ADD COLUMN IF NOT EXISTS auto_nudge boolean NOT NULL DEFAULT true;

-- État de suivi de chaque élève : niveau actuel, depuis quand, et « bon retour » à fêter (idée 5)
CREATE TABLE IF NOT EXISTS public.dropout_state (
  student_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level text,                     -- 'red', 'orange' ou NULL
  since timestamptz,              -- début du niveau actuel
  comeback_at timestamptz,        -- dernier retour fêté
  comeback_seen boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dropout_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dropout_state_read" ON public.dropout_state;
CREATE POLICY "dropout_state_read" ON public.dropout_state FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- L'élève indique qu'il a vu son « bon retour » (une seule fois)
CREATE OR REPLACE FUNCTION public.mark_comeback_seen()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE dropout_state SET comeback_seen = true WHERE student_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.mark_comeback_seen() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.mark_comeback_seen() TO authenticated;

-- Même règle que l'appli (src/lib/engagement.ts) : rouge = 2 semaines sans diamant ou rien validé depuis 21 jours ; orange = 1 semaine
CREATE OR REPLACE FUNCTION public.dropout_level_of(p_missed integer, p_last timestamptz, p_joined timestamptz)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_missed >= 2 OR COALESCE(p_last, p_joined) <= now() - interval '21 days' THEN 'red'
    WHEN p_missed = 1 THEN 'orange'
    ELSE NULL END;
$$;
