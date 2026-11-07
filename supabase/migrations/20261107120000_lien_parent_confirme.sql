-- 🔒 Audit TAZ du 2026-11-07 — idée 9 : un lien « parent » doit être CONFIRMÉ
-- (par l'enseignante, ou par le parent qui tape le code parents de l'enfant) avant de donner accès à quoi que ce soit.

alter table public.parent_links add column if not exists confirme boolean not null default false;
-- Les liens déjà là (Test 3 → Wiam ELB) restent valables : Nadia a demandé de le garder (05/11).
update public.parent_links set confirme = true where created_at < '2026-11-07 12:00+00';

create or replace function public.is_parent_of(p_parent uuid, p_child uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from parent_links where parent_id = p_parent and child_id = p_child and confirme);
$$;

create or replace function public.parent_children()
returns table(child_id uuid, full_name text) language sql stable security definer set search_path = public as $$
  select l.child_id, p.full_name from parent_links l join profiles p on p.user_id = l.child_id
  where l.parent_id = auth.uid() and l.confirme order by lower(p.full_name);
$$;

-- Enfants demandés mais pas encore confirmés (pour l'Espace parents du parent)
create or replace function public.parent_liens_en_attente()
returns table(child_id uuid, full_name text) language sql stable security definer set search_path = public as $$
  select l.child_id, p.full_name from parent_links l join profiles p on p.user_id = l.child_id
  where l.parent_id = auth.uid() and not l.confirme order by lower(p.full_name);
$$;
grant execute on function public.parent_liens_en_attente() to authenticated;

-- Le parent confirme lui-même avec le code parents de l'enfant
create or replace function public.parent_lien_confirmer(p_child uuid, p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not exists (select 1 from parent_links where parent_id = auth.uid() and child_id = p_child) then
    raise exception 'Accès refusé';
  end if;
  if public.parent_code_label(p_child, p_code) is null then
    perform pg_sleep(0.5); -- freine les essais au hasard
    return false;
  end if;
  update parent_links set confirme = true where parent_id = auth.uid() and child_id = p_child;
  return true;
end $$;
grant execute on function public.parent_lien_confirmer(uuid, text) to authenticated;
