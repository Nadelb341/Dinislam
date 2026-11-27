-- 📒 Carnet du dhikr visible de l'enseignante (Nadia, 2026-11-27)
-- Avant : « Mon carnet » (dhikr de la semaine) était SEULEMENT sur l'appareil de l'élève.
-- Maintenant : une ligne par élève et par semaine (semaine = date du lundi, heure de l'appareil), remplacée par
-- l'appareil à chaque dhikr (photo complète de la semaine). Sans réseau : gardée sur l'appareil, envoyée au retour.
-- AUCUN effet sur les points (pas de déclencheur de points sur cette table).
-- Additif uniquement : relancer ce fichier ne change rien.

create table if not exists public.dhikr_carnet_semaines (
  user_id uuid not null references auth.users(id) on delete cascade,
  semaine date not null,
  total integer not null default 0 check (total between 0 and 10000000),
  par_dhikr jsonb not null default '{}'::jsonb,   -- { clé du dhikr : { titre, nombre } }
  par_jour jsonb not null default '{}'::jsonb,    -- { "2026-11-23" : 133, … }
  series_matin smallint not null default 0 check (series_matin between 0 and 7),
  series_soir smallint not null default 0 check (series_soir between 0 and 7),
  series_reveil smallint not null default 0 check (series_reveil between 0 and 7),
  moments text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, semaine),
  check (extract(isodow from semaine) = 1),
  check (jsonb_typeof(par_dhikr) = 'object' and jsonb_typeof(par_jour) = 'object')
);

create index if not exists dhikr_carnet_semaines_semaine on public.dhikr_carnet_semaines (semaine);

drop trigger if exists dhikr_carnet_semaines_updated_at on public.dhikr_carnet_semaines;
create trigger dhikr_carnet_semaines_updated_at before update on public.dhikr_carnet_semaines
  for each row execute function public.update_updated_at_column();

alter table public.dhikr_carnet_semaines enable row level security;

-- Lecture : l'élève les siennes, l'enseignante (admin) tout
drop policy if exists "dhikr_carnet_lecture" on public.dhikr_carnet_semaines;
create policy "dhikr_carnet_lecture" on public.dhikr_carnet_semaines for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));

-- Écriture : l'élève seulement pour lui-même, et seulement des semaines récentes (envoi au retour du réseau compris)
drop policy if exists "dhikr_carnet_ajout" on public.dhikr_carnet_semaines;
create policy "dhikr_carnet_ajout" on public.dhikr_carnet_semaines for insert to authenticated
  with check (user_id = auth.uid() and semaine between current_date - 35 and current_date + 7);

drop policy if exists "dhikr_carnet_maj" on public.dhikr_carnet_semaines;
create policy "dhikr_carnet_maj" on public.dhikr_carnet_semaines for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and semaine between current_date - 35 and current_date + 7);

-- Pas de règle de suppression pour les élèves (l'historique reste) ; aucune suppression prévue dans l'appli.

-- ⚡ En direct : la fiche de l'élève chez l'enseignante se met à jour toute seule
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'dhikr_carnet_semaines') then
    alter publication supabase_realtime add table public.dhikr_carnet_semaines;
  end if;
end $$;
