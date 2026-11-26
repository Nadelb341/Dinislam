-- 🖼️ 2026-11-26 (Nadia : « dans mon compte j'ai les nouvelles images de la carte Prière, les autres ont les anciennes »)
-- Cause : une nouvelle image remplaçait l'ancienne SOUS LE MÊME NOM → même adresse → les téléphones qui avaient déjà
-- l'ancienne en mémoire (pour le hors-ligne) continuaient de l'afficher. Le code donne maintenant une adresse nouvelle
-- à chaque envoi ; ici on « rafraîchit » une fois les adresses déjà en base (sans ?v=).
update prayer_cards set image_url = image_url || '?v=' || extract(epoch from now())::bigint
  where image_url like '%/storage/v1/object/public/%' and image_url not like '%?%';
update module_cards set image_url = image_url || '?v=' || extract(epoch from now())::bigint
  where image_url like '%/storage/v1/object/public/%' and image_url not like '%?%';
update allah_names set image_url = image_url || '?v=' || extract(epoch from now())::bigint
  where image_url like '%/storage/v1/object/public/%' and image_url not like '%?%';
select (select count(*) from prayer_cards where image_url like '%?v=%') pc,
       (select count(*) from module_cards where image_url like '%?v=%') mc,
       (select count(*) from allah_names where image_url like '%?v=%') an;
