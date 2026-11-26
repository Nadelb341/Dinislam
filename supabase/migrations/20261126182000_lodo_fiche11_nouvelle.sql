update zones_contenu set url = '/images/priere/lodo/fiche-11-invocation-fin-v2.jpg' where url = '/images/priere/lodo/fiche-11-invocation-fin.jpg';
update prayer_cards set image_url = '/images/priere/lodo/fiche-11-invocation-fin-v2.jpg' where image_url = '/images/priere/lodo/fiche-11-invocation-fin.jpg';
select (select count(*) from zones_contenu where url like '%fiche-11-invocation-fin-v2%') z, (select count(*) from prayer_cards where image_url like '%fiche-11-invocation-fin-v2%') c;
