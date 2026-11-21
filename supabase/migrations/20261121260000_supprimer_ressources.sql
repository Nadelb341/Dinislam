-- 🧹 Page « Ressources » supprimée (Nadia, 2026-11-21 : « ok ») : aucun bouton n'y menait, ses 2 tables étaient vides
-- (vérifié : 0 ligne, rien d'autre ne s'y rattache, rien dans la corbeille).
do $$ begin
  if (select count(*) from public.dashboard_cards) = 0 and (select count(*) from public.dashboard_card_visibility) = 0 then
    drop table public.dashboard_card_visibility;
    drop table public.dashboard_cards;
  else
    raise notice 'Tables non vides : rien supprimé';
  end if;
end $$;
