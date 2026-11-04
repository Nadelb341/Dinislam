-- ❌ Badge de la saison retiré à la demande de Nadia (2026-11-04 : « ça surcharge l'appli »).
-- La table était vide (0 badge gagné) : rien n'est perdu. La table module_visits reste (« Vu par N élèves »).
alter publication supabase_realtime drop table public.season_badges;
drop function if exists public.claim_season_badge();
drop function if exists public.season_bounds(date);
drop table if exists public.season_badges;
