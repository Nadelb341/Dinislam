-- 💧 Idée b de Nadia (2026-11-26) : rappel en notification 15 min AVANT chaque prière (« fais tes ablutions »), pour tout le monde
-- par défaut (chacun peut le couper dans ⚙️ Paramètres). Les comptes jamais réglés (tout éteint, 0 min) passent à « tout allumé, 15 min ».
alter table public.notification_preferences
  alter column fajr_reminder set default true, alter column dhuhr_reminder set default true,
  alter column asr_reminder set default true, alter column maghrib_reminder set default true,
  alter column isha_reminder set default true, alter column priere_avance set default 15;

update public.notification_preferences set fajr_reminder = true, dhuhr_reminder = true, asr_reminder = true,
  maghrib_reminder = true, isha_reminder = true, priere_avance = 15
where coalesce(fajr_reminder, false) = false and coalesce(dhuhr_reminder, false) = false and coalesce(asr_reminder, false) = false
  and coalesce(maghrib_reminder, false) = false and coalesce(isha_reminder, false) = false and priere_avance = 0;

-- Comptes sans réglages : une ligne (les valeurs par défaut ci-dessus), avec la ville du profil
insert into public.notification_preferences (user_id, priere_ville, priere_pays, priere_lat, priere_lon)
select p.user_id, p.city, p.ville_pays, p.ville_lat, p.ville_lon from public.profiles p
where not exists (select 1 from public.notification_preferences n where n.user_id = p.user_id);

-- Ville du rappel manquante : celle du profil
update public.notification_preferences n set priere_ville = p.city, priere_pays = p.ville_pays, priere_lat = p.ville_lat, priere_lon = p.ville_lon
from public.profiles p where p.user_id = n.user_id and n.priere_ville is null and p.ville_lat is not null;
