-- 💬 Espace commentaires / questions de chaque particularité de l'Alphabet (Nadia, 2026-11-21).
-- Un élève pose une question ou laisse un commentaire ; Nadia (et les élèves) répondent dessous. Toute la classe lit.
-- Le prénom affiché est rempli par la base (impossible de se faire passer pour un autre).
create table if not exists public.alphabet_commentaires (
  id uuid primary key default gen_random_uuid(),
  particularite_id uuid not null references public.alphabet_particularites(id) on delete cascade,
  parent_id uuid references public.alphabet_commentaires(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  auteur text,
  est_admin boolean not null default false,
  texte text not null check (length(btrim(texte)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists alphabet_commentaires_part on public.alphabet_commentaires (particularite_id, created_at);

create or replace function public.alphabet_commentaires_auteur() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    -- Restauration depuis la corbeille par l'enseignante : on garde l'auteur d'origine
    if public.has_role(auth.uid(), 'admin'::public.app_role) and new.user_id is distinct from auth.uid() and new.auteur is not null then return new; end if;
    new.user_id := auth.uid();
    new.est_admin := public.has_role(auth.uid(), 'admin'::public.app_role);
    select coalesce(nullif(split_part(btrim(full_name), ' ', 1), ''), 'Élève') into new.auteur from public.profiles where user_id = auth.uid();
    if new.est_admin then new.auteur := 'Enseignante'; end if;
  else
    new.user_id := old.user_id; new.auteur := old.auteur; new.est_admin := old.est_admin;
    new.particularite_id := old.particularite_id; new.parent_id := old.parent_id; new.created_at := old.created_at;
    new.updated_at := now();
  end if;
  return new;
end $$;
drop trigger if exists alphabet_commentaires_auteur on public.alphabet_commentaires;
create trigger alphabet_commentaires_auteur before insert or update on public.alphabet_commentaires
  for each row execute function public.alphabet_commentaires_auteur();

alter table public.alphabet_commentaires enable row level security;
drop policy if exists "commentaires_lecture" on public.alphabet_commentaires;
create policy "commentaires_lecture" on public.alphabet_commentaires for select to authenticated using (true);
drop policy if exists "commentaires_ecrire" on public.alphabet_commentaires;
create policy "commentaires_ecrire" on public.alphabet_commentaires for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "commentaires_modifier" on public.alphabet_commentaires;
create policy "commentaires_modifier" on public.alphabet_commentaires for update to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));
drop policy if exists "commentaires_supprimer" on public.alphabet_commentaires;
create policy "commentaires_supprimer" on public.alphabet_commentaires for delete to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'alphabet_commentaires') then
    alter publication supabase_realtime add table public.alphabet_commentaires;
  end if;
end $$;
