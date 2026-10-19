-- 99 noms d'Allah (2026-10-19, demande de Nadia) : l'élève envoie un audio de chaque nom,
-- l'enseignante le valide (ou envoie une correction) dans « Récitations à corriger », comme les sourates.
-- Même table que les récitations de sourates : une récitation concerne SOIT une sourate, SOIT un nom.
alter table public.sourate_recitations alter column sourate_id drop not null;
alter table public.sourate_recitations add column if not exists allah_name_id integer references public.allah_names(id);
alter table public.sourate_recitations drop constraint if exists recitation_target_check;
alter table public.sourate_recitations add constraint recitation_target_check
  check ((sourate_id is not null) <> (allah_name_id is not null));
create index if not exists sourate_recitations_allah_name_idx on public.sourate_recitations (allah_name_id) where allah_name_id is not null;
