-- 🧪 Compte « Test 3 » de Nadia (support pour ses cours sur Zoom) — demande du 2026-11-04
-- 1. Un élève peut être mis « hors classement » (il n'apparaît plus dans le classement, ni chez Nadia ni chez les élèves)
-- 2. Un élève peut apparaître dans TOUS les groupes du registre de présence (pour faire des essais)
alter table public.profiles add column if not exists hors_classement boolean not null default false;
alter table public.profiles add column if not exists presence_tous_groupes boolean not null default false;

update public.profiles set hors_classement = true, presence_tous_groupes = true
where user_id = (select id from auth.users where email = 'nad341@live.fr');

create or replace function public.est_hors_classement(_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select hors_classement from public.profiles where user_id = _user), false)
$$;
grant execute on function public.est_hors_classement(uuid) to authenticated;

-- Le classement ne montre plus les comptes « hors classement » (les élèves comme l'enseignante)
drop policy if exists "All authenticated can view ranking" on public.student_ranking;
drop policy if exists "Authenticated can view rankings" on public.student_ranking;
create policy "Authenticated can view rankings" on public.student_ranking for select to authenticated
  using (not public.est_hors_classement(user_id));
