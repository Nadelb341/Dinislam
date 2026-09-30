-- Son des notifications (normal ou silencieux / vibration) + heures du mode calme réglables (Nadia, 2026-09-30)
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS notif_silent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiet_start smallint NOT NULL DEFAULT 21 CHECK (quiet_start BETWEEN 0 AND 23),
  ADD COLUMN IF NOT EXISTS quiet_end smallint NOT NULL DEFAULT 8 CHECK (quiet_end BETWEEN 0 AND 23);
