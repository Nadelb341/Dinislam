-- Colonnes affichées par l'appli mais absentes de la base (nettoyage du 2026-10-01) :
-- - formes des lettres arabes (page Alphabet) ;
-- - nombre d'envois réussis / de destinataires dans l'historique des notifications (Monitoring).
ALTER TABLE public.alphabet_letters
  ADD COLUMN IF NOT EXISTS position_isolated text,
  ADD COLUMN IF NOT EXISTS position_initial text,
  ADD COLUMN IF NOT EXISTS position_medial text,
  ADD COLUMN IF NOT EXISTS position_final text;
ALTER TABLE public.notification_history
  ADD COLUMN IF NOT EXISTS successful_sends integer,
  ADD COLUMN IF NOT EXISTS total_recipients integer;
