-- 🔔 Interrupteurs des nouvelles notifications (Paramètres › Notifications) + nombre de bilans pas encore lus (2026-10-28)
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS notif_par_bilan boolean DEFAULT true;  -- 📊 nouveau bilan (parents)
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS notif_par_abs boolean DEFAULT true;    -- ⚠️ enfant absent au cours sans justification
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS notif_adm_abs boolean DEFAULT true;    -- 🙋 absence signalée par des parents
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS notif_adm_par boolean DEFAULT true;    -- 👨‍👩‍👧 parent relié à ses enfants

-- Pastille « 1 nouveau bilan » avant même d'entrer le code (seulement un nombre)
CREATE OR REPLACE FUNCTION public.parent_unread_count(p_child uuid) RETURNS int
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.can_act_for_child(p_child) THEN RETURN 0; END IF;
  RETURN (SELECT count(*) FROM student_reports r WHERE r.student_id = p_child AND r.sent_at IS NOT NULL AND r.snapshot IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM bilan_reads b WHERE b.report_id = r.id));
END $$;
