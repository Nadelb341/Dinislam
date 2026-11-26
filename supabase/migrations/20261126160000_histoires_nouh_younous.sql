-- 📖 Nadia (2026-11-26 : « oui ») : Nouh et l'arche → sourate 71 (Nouh), Younous et la baleine → sourate 10 (Younous). Seulement si vide.
update public.petits_fiches set sourate_liee = 71 where titre = 'Nouh et l''arche' and sourate_liee is null;
update public.petits_fiches set sourate_liee = 10 where titre = 'Younous et la baleine' and sourate_liee is null;
