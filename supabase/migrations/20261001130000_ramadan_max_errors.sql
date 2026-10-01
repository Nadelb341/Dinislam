-- Réglage « nombre d'erreurs autorisées » des quiz du Ramadan : le code l'enregistre et le lit dans
-- ramadan_settings.max_errors, colonne absente (découvert au nettoyage du 2026-10-01) → le réglage de l'admin
-- n'était jamais enregistré et l'appli utilisait toujours 3. Valeur par défaut gardée à 3 (comportement actuel).
ALTER TABLE public.ramadan_settings ADD COLUMN IF NOT EXISTS max_errors integer NOT NULL DEFAULT 3;
