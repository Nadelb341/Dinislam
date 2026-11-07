-- 🔒 Audit TAZ/ZAT du 2026-11-07 — idée 7 : seule l'enseignante valide
-- (sauf les adultes de 20 ans et plus, et une leçon Nourania débloquée par l'enseignante, comme avant)

-- Âge calculé côté serveur (même règle que l'appli : date de naissance, sinon âge saisi)
create or replace function public.est_adulte(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case when date_of_birth is not null
                 then date_part('year', age((now() at time zone 'Europe/Paris')::date, date_of_birth)) >= 20
                 else coalesce(age, 0) >= 20 end
       from profiles where user_id = p_user),
    false)
$$;

create or replace function public.garde_validation()
returns trigger language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role) then return new; end if;
  -- un élève peut toujours enlever une validation, ou ne rien changer
  if not coalesce(new.is_validated, false) then return new; end if;
  if tg_op = 'UPDATE' and coalesce(old.is_validated, false) then return new; end if;
  ok := public.est_adulte(auth.uid());
  if not ok and tg_table_name = 'user_nourania_progress' then
    ok := exists (select 1 from nourania_admin_unlocks u
                  where u.student_id = auth.uid() and u.lesson_id = (to_jsonb(new) ->> 'lesson_id')::int);
  end if;
  if not ok then
    raise exception 'Validation réservée à l''enseignante';
  end if;
  return new;
end $$;

do $$ declare t text; begin
  foreach t in array array['user_sourate_progress','user_nourania_progress','user_prayer_progress',
                           'user_invocation_progress','user_allah_name_progress'] loop
    execute format('drop trigger if exists garde_validation on public.%I', t);
    execute format('create trigger garde_validation before insert or update on public.%I
                    for each row execute function public.garde_validation()', t);
  end loop;
end $$;

-- Profil : l'élève remplit sa date de naissance UNE fois ; ensuite seule l'enseignante la change.
-- (on garde l'ancienne valeur en silence pour ne pas faire échouer l'enregistrement du nom)
create or replace function public.garde_profil_eleve()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.has_role(auth.uid(), 'admin'::app_role) then return new; end if;
  if old.date_of_birth is not null then
    new.date_of_birth := old.date_of_birth;
    new.age := old.age;
  elsif new.date_of_birth is not null then
    new.age := date_part('year', age((now() at time zone 'Europe/Paris')::date, new.date_of_birth))::int;
  else
    new.age := old.age;   -- l'âge seul (sans date) ne se change pas par l'élève
  end if;
  if coalesce(old.dob_set_by_user, false) then new.dob_set_by_user := true; end if;
  new.hors_classement := old.hors_classement;
  new.presence_tous_groupes := old.presence_tous_groupes;
  return new;
end $$;
drop trigger if exists garde_profil_eleve on public.profiles;
create trigger garde_profil_eleve before update on public.profiles
  for each row execute function public.garde_profil_eleve();
