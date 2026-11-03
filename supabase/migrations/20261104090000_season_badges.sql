-- 🏆 Badge de la saison (choix de Nadia, 2026-11-03/04) : « Élève de l'automne 2026 », « Élève de l'hiver 2026-2027 »…
-- Un jour d'activité = un jour où l'élève a ouvert au moins une carte de l'accueil (table module_visits).
-- Le badge est gagné quand le nombre de jours atteint le seuil réglé par Nadia (bouclier › Apparence appli ›
-- Décorations saisons, app_appearance.saisons.badgeJours). Il est GARDÉ dans la collection même si le seuil change ensuite.
-- Seule la fonction claim_season_badge (qui recompte elle-même) peut écrire : un élève ne peut pas se l'attribuer.

create table if not exists public.season_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  season_key text not null,          -- ex. automne-2026, hiver-2026 (décembre 2026 → février 2027)
  saison text not null check (saison in ('hiver','printemps','ete','automne')),
  days int not null,
  required int not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, season_key)
);
alter table public.season_badges enable row level security;
create policy "own_read_season_badges" on public.season_badges
  for select to authenticated using (user_id = auth.uid());
create policy "admin_read_season_badges" on public.season_badges
  for select to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));
alter publication supabase_realtime add table public.season_badges;

-- Bornes de la saison d'une date (heure de Paris)
create or replace function public.season_bounds(p_day date)
returns table (season_key text, saison text, start_day date, end_day date)
language sql immutable as $$
  select
    case when m = 12 then 'hiver-' || y when m <= 2 then 'hiver-' || (y - 1)
         when m <= 5 then 'printemps-' || y when m <= 8 then 'ete-' || y else 'automne-' || y end,
    case when m = 12 or m <= 2 then 'hiver' when m <= 5 then 'printemps' when m <= 8 then 'ete' else 'automne' end,
    case when m = 12 then make_date(y, 12, 1) when m <= 2 then make_date(y - 1, 12, 1)
         when m <= 5 then make_date(y, 3, 1) when m <= 8 then make_date(y, 6, 1) else make_date(y, 9, 1) end,
    case when m = 12 then (make_date(y + 1, 3, 1) - 1) when m <= 2 then (make_date(y, 3, 1) - 1)
         when m <= 5 then make_date(y, 5, 31) when m <= 8 then make_date(y, 8, 31) else make_date(y, 11, 30) end
  from (select extract(month from p_day)::int m, extract(year from p_day)::int y) t
$$;

-- Où en est l'élève connecté pour la saison en cours ? Donne le badge s'il a atteint le seuil.
create or replace function public.claim_season_badge()
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'Europe/Paris')::date;
  b record;
  v_required int;
  v_days int;
  v_earned public.season_badges;
begin
  if v_uid is null then return null; end if;
  select * into b from public.season_bounds(v_today);
  select coalesce(nullif(value->>'badgeJours', '')::int, 15) into v_required from public.app_appearance where key = 'saisons';
  v_required := greatest(1, coalesce(v_required, 15));
  select count(distinct day) into v_days from public.module_visits
    where user_id = v_uid and day between b.start_day and b.end_day;
  if v_days >= v_required then
    insert into public.season_badges (user_id, season_key, saison, days, required)
      values (v_uid, b.season_key, b.saison, v_days, v_required)
      on conflict (user_id, season_key) do nothing;
  end if;
  select * into v_earned from public.season_badges where user_id = v_uid and season_key = b.season_key;
  return json_build_object('season_key', b.season_key, 'saison', b.saison, 'start_day', b.start_day, 'end_day', b.end_day,
    'days', v_days, 'required', v_required, 'earned_at', v_earned.earned_at);
end $$;
revoke all on function public.claim_season_badge() from public, anon;
grant execute on function public.claim_season_badge() to authenticated;
