-- ✏️ Zones de contenu communes (Nadia, 2026-11-21, proposition 4 du crayon) : sur n'importe quelle carte / fiche,
-- l'enseignante ajoute, modifie, range et supprime du texte, des images, des vidéos (fichier ou YouTube), des PDF, de l'audio.
-- « cible » = l'endroit (ex. 'sourate:12', 'ramadan:3', 'lettre:5', 'nom-allah:<id>', 'sous-carte:<id>', 'nourania:<id>').
create table if not exists public.zones_contenu (
  id uuid primary key default gen_random_uuid(),
  cible text not null,
  kind text not null check (kind in ('texte', 'image', 'video', 'youtube', 'pdf', 'audio')),
  texte text,
  url text,
  nom text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists zones_contenu_cible on public.zones_contenu (cible, position);
alter table public.zones_contenu enable row level security;
drop policy if exists "zones_contenu_lecture" on public.zones_contenu;
create policy "zones_contenu_lecture" on public.zones_contenu for select to authenticated using (true);
drop policy if exists "zones_contenu_admin" on public.zones_contenu;
create policy "zones_contenu_admin" on public.zones_contenu for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'zones_contenu') then
    alter publication supabase_realtime add table public.zones_contenu;
  end if;
end $$;
