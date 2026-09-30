-- Sécurité (accord de Nadia du 2026-10-01) : plus aucun mot de passe d'élève conservé en clair.
-- Le code ne lit ni n'écrit plus cette colonne depuis le commit 208176d.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS plain_password;
