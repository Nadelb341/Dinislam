-- ✋ Ordre des cartes « fixes » (listes définies dans l'appli, ex. les jeux de l'Alphabet), choisi par Nadia.
-- Une ligne par liste : cle (ex. 'alphabet-jeux') → ordre des identifiants. Les élèves voient le même ordre.
create table if not exists public.ordre_cartes (
  cle text primary key,
  ordre text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.ordre_cartes enable row level security;
drop policy if exists "ordre_cartes_lecture" on public.ordre_cartes;
create policy "ordre_cartes_lecture" on public.ordre_cartes for select to authenticated using (true);
drop policy if exists "ordre_cartes_admin" on public.ordre_cartes;
create policy "ordre_cartes_admin" on public.ordre_cartes for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ordre_cartes') then
    alter publication supabase_realtime add table public.ordre_cartes;
  end if;
end $$;
