-- Une seule demande de validation EN ATTENTE par élève et par sourate / leçon / invocation
-- (2026-10-07 : Boulajhaf a envoyé 8 demandes pour Ayat Al-Kursi → 8 notifications à l'enseignante).
CREATE UNIQUE INDEX IF NOT EXISTS sourate_validation_one_pending
  ON public.sourate_validation_requests (user_id, sourate_id) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS nourania_validation_one_pending
  ON public.nourania_validation_requests (user_id, lesson_id) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS invocation_validation_one_pending
  ON public.invocation_validation_requests (user_id, invocation_id) WHERE status = 'pending';
