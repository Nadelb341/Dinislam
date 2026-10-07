-- Notifications programmées : jours de la semaine (1 = lundi … 7 = dimanche ; vide = tous les jours)
ALTER TABLE public.scheduled_notifications ADD COLUMN IF NOT EXISTS weekdays smallint[];

-- Rappel aux élèves chaque mardi à 17 h 30 (demande de Nadia, 2026-10-08), modifiable dans bouclier › Notifs › programmées
INSERT INTO public.scheduled_notifications (module, message, start_date, end_date, send_time, recipients, is_active, require_confirmation, weekdays, created_by)
SELECT 'cours', '📖 Demain, c''est cours d''arabe ! Pense à travailler ta leçon et ta sourate ce soir, inch''Allah 💪',
       '2026-10-08', '2027-07-31', '17:30', '"all"'::jsonb, true, false, ARRAY[2]::smallint[], '849384ad-e6ec-4ec4-b17a-ec51129ce50e'
WHERE NOT EXISTS (SELECT 1 FROM public.scheduled_notifications WHERE module = 'cours' AND weekdays = ARRAY[2]::smallint[]);

-- Rappels automatiques déjà envoyés (un seul envoi par jour et par sorte de rappel)
CREATE TABLE IF NOT EXISTS public.auto_reminder_logs (
  kind text NOT NULL,
  sent_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, sent_on)
);
ALTER TABLE public.auto_reminder_logs ENABLE ROW LEVEL SECURITY; -- aucune règle : seule la fonction serveur (clé de service) y écrit
