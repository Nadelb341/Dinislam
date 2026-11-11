-- 2026-11-11 — 🦔 Le compagnon des décors de saison (idée 2 de Nadia) : il grandit à la 1ʳᵉ connexion du jour,
-- UNE seule fois par 24 h (jour de Paris), jamais à chaque connexion. Rien à gagner : juste une animation.
create table if not exists public.compagnons (
  user_id uuid primary key references auth.users(id) on delete cascade,
  niveau int not null default 0,
  derniere_croissance date,
  updated_at timestamptz not null default now()
);
alter table public.compagnons enable row level security;
drop policy if exists compagnons_lecture on public.compagnons;
create policy compagnons_lecture on public.compagnons for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));

-- Appelée à l'ouverture de l'accueil : grandit si ce n'est pas déjà fait aujourd'hui ; renvoie la taille et « a grandi »
create or replace function public.compagnon_du_jour()
returns table (niveau int, a_grandi boolean) language plpgsql security definer set search_path = public as $$
declare jour date := (now() at time zone 'Europe/Paris')::date; c record;
begin
  if auth.uid() is null then raise exception 'non connecté'; end if;
  insert into compagnons (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  update compagnons set niveau = least(compagnons.niveau + 1, 40), derniere_croissance = jour, updated_at = now()
    where user_id = auth.uid() and (derniere_croissance is null or derniere_croissance < jour)
    returning compagnons.niveau into c;
  if found then return query select c.niveau, true; return; end if;
  return query select compagnons.niveau, false from compagnons where user_id = auth.uid();
end $$;
revoke execute on function public.compagnon_du_jour() from public, anon;
grant execute on function public.compagnon_du_jour() to authenticated;
