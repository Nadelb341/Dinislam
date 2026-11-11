-- 2026-11-12 — ⏰ Tâches automatiques (carnet programmé + relance, rendez-vous du mardi). Fonction taches-automatiques.
-- Journal « une fois par semaine » : la clé (ex. bilan-semaine-2026-11-17) ne peut être écrite qu'une fois.
create table if not exists public.taches_auto_journal (
  cle text primary key,
  fait_le timestamptz not null default now()
);
alter table public.taches_auto_journal enable row level security;
drop policy if exists taches_auto_journal_admin on public.taches_auto_journal;
create policy taches_auto_journal_admin on public.taches_auto_journal for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Toutes les 15 minutes (appel recopié de la tâche des devoirs, aucune clé écrite ici)
do $$
declare c text;
begin
  select command into c from cron.job where jobname = 'dinislam-homework-reminders';
  if c is null then raise exception 'tâche modèle introuvable'; end if;
  perform cron.unschedule(jobid) from cron.job where jobname = 'dinislam-taches-automatiques';
  perform cron.schedule('dinislam-taches-automatiques', '*/15 * * * *', replace(c, '/functions/v1/homework-reminders', '/functions/v1/taches-automatiques'));
end $$;
