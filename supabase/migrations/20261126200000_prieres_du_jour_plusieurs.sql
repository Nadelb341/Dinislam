-- 🐛 Nadia (2026-11-26) : « Dhohr » refusée (« Erreur lors de la mise à jour ») après « Sobh ».
-- Cause : une ancienne règle n'autorisait qu'UNE ligne par élève et par JOUR. Désormais : une ligne par prière et par jour.
alter table public.user_daily_prayers drop constraint if exists user_daily_prayers_user_id_date_key;
create unique index if not exists user_daily_prayers_user_date_priere_key
  on public.user_daily_prayers (user_id, date, prayer_name);
