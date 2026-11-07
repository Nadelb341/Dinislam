-- 📈 Audit ZAT du 2026-11-07 — idée 15 : « Connexions par jour » compté côté serveur, à l'heure de Paris, sur 30 vrais jours
-- (avant : 2 000 lignes demandées mais 1 000 rendues → ≈ 13 jours seulement, et jours comptés à l'heure anglaise)
create or replace function public.stats_connexions_30j()
returns table(jour date, connexions int, eleves int)
language sql stable security definer set search_path = public as $$
  with j as (
    select generate_series((now() at time zone 'Europe/Paris')::date - 29, (now() at time zone 'Europe/Paris')::date, interval '1 day')::date as jour
  )
  select j.jour, count(c.*)::int, count(distinct c.user_id)::int
  from j left join connexion_logs c on (c.login_at at time zone 'Europe/Paris')::date = j.jour
  where public.has_role(auth.uid(), 'admin'::app_role)
  group by j.jour order by j.jour;
$$;
-- Élèves qui se sont connectés ces 30 derniers jours (pour « actifs / inactifs »)
create or replace function public.eleves_connectes_30j()
returns setof uuid language sql stable security definer set search_path = public as $$
  select distinct user_id from connexion_logs
  where login_at > now() - interval '30 days' and public.has_role(auth.uid(), 'admin'::app_role);
$$;
grant execute on function public.stats_connexions_30j() to authenticated;
grant execute on function public.eleves_connectes_30j() to authenticated;
