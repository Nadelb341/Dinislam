-- 2026-11-11 — Demande de Nadia : l'élève coche les lignes Nourania qu'il a travaillées (carré à gauche de chaque ligne).
-- Sert aussi au devoir de la semaine : il est pré-rempli avec la ligne juste en dessous de la dernière cochée.
create table if not exists public.nourania_lignes_faites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.nourania_lessons(id) on delete cascade,
  content_id uuid references public.nourania_lesson_content(id) on delete set null,
  ligne int not null check (ligne > 0),
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id, ligne)
);
create index if not exists nourania_lignes_faites_user on public.nourania_lignes_faites (user_id, lesson_id);
alter table public.nourania_lignes_faites enable row level security;
drop policy if exists nlf_lecture on public.nourania_lignes_faites;
create policy nlf_lecture on public.nourania_lignes_faites for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));
drop policy if exists nlf_ajout on public.nourania_lignes_faites;
create policy nlf_ajout on public.nourania_lignes_faites for insert to authenticated with check (user_id = auth.uid());
drop policy if exists nlf_retrait on public.nourania_lignes_faites;
create policy nlf_retrait on public.nourania_lignes_faites for delete to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'nourania_lignes_faites') then
    alter publication supabase_realtime add table public.nourania_lignes_faites;
  end if;
end $$;
