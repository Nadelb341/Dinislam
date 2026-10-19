-- Alerte « chat qui pleure » (2026-10-19, demande de Nadia)
-- 1) Un plantage reste « à régler » tant que l'enseignante n'a pas appuyé sur « Problème résolu »
alter table public.app_logs add column if not exists resolved_at timestamptz;
-- L'enseignante peut marquer lu / résolu (avant : aucune règle → « Marquer lu » ne faisait rien)
drop policy if exists "Admins can update app_logs" on public.app_logs;
create policy "Admins can update app_logs" on public.app_logs for update
  using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));

-- 2) Réglages de la notification qui revient (une seule ligne)
create table if not exists public.crash_alert_settings (
  id int primary key default 1 check (id = 1),
  interval_hours int not null default 1 check (interval_hours between 1 and 4),
  -- null = jusqu'à ce que le problème soit résolu
  until_at timestamptz,
  last_sent_at timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.crash_alert_settings (id) values (1) on conflict (id) do nothing;
alter table public.crash_alert_settings enable row level security;
drop policy if exists "Admins manage crash alert settings" on public.crash_alert_settings;
create policy "Admins manage crash alert settings" on public.crash_alert_settings for all
  using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));

-- 3) Interrupteur dans Paramètres › Notifications
alter table public.notification_preferences add column if not exists notif_adm_crash boolean not null default true;
