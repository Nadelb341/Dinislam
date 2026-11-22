-- 🔧 Petits réglages de l'appli choisis par l'enseignante (Nadia, 2026-11-22). 1er réglage : le son doux joué quand
-- un tout-petit se trompe dans un jeu (« son_erreur_petits », de 1 à 10). Tout le monde lit, seule l'enseignante change.
create table if not exists public.reglages_appli (
  cle text primary key,
  valeur jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.reglages_appli enable row level security;
drop policy if exists "reglages_appli_lecture" on public.reglages_appli;
create policy "reglages_appli_lecture" on public.reglages_appli for select to authenticated using (true);
drop policy if exists "reglages_appli_admin" on public.reglages_appli;
create policy "reglages_appli_admin" on public.reglages_appli for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

insert into public.reglages_appli (cle, valeur) values ('son_erreur_petits', '1'::jsonb) on conflict (cle) do nothing;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reglages_appli') then
    alter publication supabase_realtime add table public.reglages_appli;
  end if;
end $$;
