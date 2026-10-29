-- 📜 Historique des envois du bilan (2026-10-29, demande de Nadia) : à qui, quand, comment ; renvoi illimité
CREATE TABLE IF NOT EXISTS public.bilan_envois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.student_reports(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  destinataire text NOT NULL,
  canal text NOT NULL CHECK (canal IN ('partage', 'telechargement', 'copie')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_by uuid
);
CREATE INDEX IF NOT EXISTS bilan_envois_report_idx ON public.bilan_envois (report_id, sent_at DESC);
ALTER TABLE public.bilan_envois ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_bilan_envois ON public.bilan_envois;
CREATE POLICY admin_bilan_envois ON public.bilan_envois FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bilan_envois') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bilan_envois;
  END IF;
END $$;
