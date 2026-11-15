-- 2026-11-15 — Demandes de Nadia :
-- (1) 📍 VILLE obligatoire à l'inscription (modifiable dans « Paramètres du profil ») ; les horaires de prière suivent SA ville,
--     sans manipulation de l'élève (solution B choisie par Nadia : calcul dans l'appli, gratuit, sans Internet ; Mawaqit refuse
--     les robots et demande une clé). La ville est cherchée (service gratuit Open-Meteo) : nom + coordonnées + pays + fuseau.
--     `city` sans coordonnées = ville introuvable → message à chaque connexion pour corriger l'orthographe.
-- (2) 🐛 Bug trouvé en préparant (1) : le genre et la date de naissance tapés à l'inscription restaient dans les données
--     de connexion et n'arrivaient JAMAIS dans le profil (`handle_new_user` ne copiait que le nom). Corrigé + rattrapage
--     (cases VIDES seulement) : 14 dates de naissance et 9 genres retrouvés.
alter table public.profiles add column if not exists ville_lat double precision;
alter table public.profiles add column if not exists ville_lon double precision;
alter table public.profiles add column if not exists ville_pays text;
alter table public.profiles add column if not exists ville_fuseau text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb); dob date;
begin
  begin
    if (m->>'date_of_birth') ~ '^\d{4}-\d{2}-\d{2}$' then dob := (m->>'date_of_birth')::date; end if;
  exception when others then dob := null; end;
  if dob is not null and (dob > current_date or dob < date '1920-01-01') then dob := null; end if;
  insert into public.profiles (user_id, email, full_name, is_approved, is_admin, gender, date_of_birth, age, dob_set_by_user,
                               city, ville_lat, ville_lon, ville_pays, ville_fuseau)
  values (new.id, new.email, coalesce(m->>'full_name', ''), false, false,
          case when m->>'gender' in ('fille', 'garcon') then m->>'gender' end,
          dob, case when dob is not null then date_part('year', age(current_date, dob))::int end, dob is not null,
          nullif(trim(m->>'ville'), ''),
          case when (m->>'ville_lat') ~ '^-?\d+(\.\d+)?$' then (m->>'ville_lat')::double precision end,
          case when (m->>'ville_lon') ~ '^-?\d+(\.\d+)?$' then (m->>'ville_lon')::double precision end,
          nullif(m->>'ville_pays', ''), nullif(m->>'ville_fuseau', ''))
  on conflict (user_id) do nothing;
  return new;
end $$;

-- Rattrapage : seulement les cases vides du profil, avec ce que l'élève avait lui-même tapé à l'inscription
update public.profiles p set gender = u.raw_user_meta_data->>'gender'
from auth.users u
where u.id = p.user_id and p.gender is null and u.raw_user_meta_data->>'gender' in ('fille', 'garcon');

update public.profiles p set date_of_birth = (u.raw_user_meta_data->>'date_of_birth')::date,
  age = date_part('year', age(current_date, (u.raw_user_meta_data->>'date_of_birth')::date))::int, dob_set_by_user = true
from auth.users u
where u.id = p.user_id and p.date_of_birth is null and (u.raw_user_meta_data->>'date_of_birth') ~ '^\d{4}-\d{2}-\d{2}$'
  and (u.raw_user_meta_data->>'date_of_birth')::date between date '1920-01-01' and current_date;

-- Âge manquant alors que la date de naissance est connue (8 profils) : calculé
update public.profiles set age = date_part('year', age(current_date, date_of_birth))::int where age is null and date_of_birth is not null;
