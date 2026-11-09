-- 2026-11-09 — Idée 11 de l'audit : VRAIS rappels de prière envoyés par le serveur (choix de Nadia :
-- moment au choix de chacun — à l'heure, 5, 10 ou 15 min avant — ; éteints au départ, chacun allume).
-- Ville et méthode de calcul étaient seulement sur l'appareil → copiées ici pour que le serveur calcule les heures.
alter table public.notification_preferences add column if not exists priere_ville text;
alter table public.notification_preferences add column if not exists priere_pays text;
alter table public.notification_preferences add column if not exists priere_lat double precision;
alter table public.notification_preferences add column if not exists priere_lon double precision;
alter table public.notification_preferences add column if not exists priere_methode smallint;
alter table public.notification_preferences add column if not exists priere_avance smallint not null default 0;
alter table public.notification_preferences drop constraint if exists priere_avance_valeurs;
alter table public.notification_preferences add constraint priere_avance_valeurs check (priere_avance in (0, 5, 10, 15));

-- Un seul rappel par personne, par jour et par prière (le serveur passe toutes les 5 minutes)
create table if not exists public.rappels_priere_envoyes (
  user_id uuid not null references auth.users(id) on delete cascade,
  jour date not null,
  priere text not null,
  envoye_le timestamptz not null default now(),
  primary key (user_id, jour, priere)
);
alter table public.rappels_priere_envoyes enable row level security; -- serveur seulement (aucune règle = aucun accès élève)

-- Heures du jour par ville (une seule demande à Aladhan par ville et par jour)
create table if not exists public.horaires_priere_jour (
  cle text primary key,               -- lat,lon,méthode,jour
  horaires jsonb not null,            -- {"fajr":"05:52",…}
  cree_le timestamptz not null default now()
);
alter table public.horaires_priere_jour enable row level security;

-- Tâche planifiée : toutes les 5 minutes. On recopie l'appel de la tâche des rappels de devoirs (qui marche)
-- en changeant seulement l'adresse → aucune clé écrite dans ce fichier (dépôt public).
do $$
declare c text;
begin
  select command into c from cron.job where jobname = 'dinislam-homework-reminders';
  if c is null then raise exception 'tâche modèle introuvable'; end if;
  perform cron.unschedule(jobid) from cron.job where jobname = 'dinislam-rappels-priere';
  perform cron.schedule('dinislam-rappels-priere', '*/5 * * * *', replace(c, '/functions/v1/homework-reminders', '/functions/v1/prayer-reminders'));
end $$;
