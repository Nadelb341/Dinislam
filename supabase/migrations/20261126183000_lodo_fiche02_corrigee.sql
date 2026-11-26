-- ✍️ 26/11 : fiche « Dire Bismilah » corrigée (« si tu le dis », « Ça ») → nouveau nom de fichier (pas d'ancienne image gardée en mémoire)
update zones_contenu set url = '/images/priere/lodo/fiche-02-bismillah-v2.jpg' where url = '/images/priere/lodo/fiche-02-bismillah.jpg';
update prayer_cards set image_url = '/images/priere/lodo/fiche-02-bismillah-v2.jpg' where image_url = '/images/priere/lodo/fiche-02-bismillah.jpg';
select count(*) from zones_contenu where url like '%fiche-02-bismillah-v2%';
