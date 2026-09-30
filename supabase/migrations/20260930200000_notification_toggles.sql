-- Interrupteurs de notifications par catégorie + mode calme (piste B choisie par Nadia le 2026-09-30).
-- Tout est activé par défaut : un élève qui n'a rien réglé continue de tout recevoir.
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS notif_msg boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_hw_new boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_hw_rem boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_hw_res boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_rec boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_lesson boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_act boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_sched boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_adm_msg boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_adm_hw boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_adm_valid boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_adm_reg boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS quiet_mode boolean NOT NULL DEFAULT false;

