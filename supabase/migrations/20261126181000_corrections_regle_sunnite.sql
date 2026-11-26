-- 🕌 26/11 : corrections choisies par Nadia après la relecture de toute l'appli (règle n°1)
-- 1. Tout-petits › 5 prières › Fajr : le Fajr se prie AVANT le lever du soleil
update petits_fiches set texte = 'La prière de l''aube, avant le lever du soleil.', updated_at = now() where id = '367c03ae-e986-4abb-bee6-71f4cc822f3d';
-- 2. Ramadan des petits : le jeûne est le 4e pilier
update histoires_videos set titre = 'Le Ramadan, 4e pilier (quiz)' where id = '56f08bdf-a61f-4b2a-a6fc-a85df2aae8cc';
-- 12. Catégories de la Prière : arabe corrigé
update prayer_categories set name_arabic = 'الغُسْل' where id = '40711035-b68c-482c-8351-1c39eaccf81c';
update prayer_categories set name_arabic = 'صلاة الشفع والوتر' where id = '863b8721-34e5-42c5-b5c8-bb327f8ba9cd';
-- 10. 99 Noms d'Allah
update allah_names set name_french = 'Celui qui dirige avec sagesse', explanation = 'Celui qui mène toute chose vers ce qui est juste, avec une sagesse parfaite. Personne ne Le guide : c''est Lui qui guide.' where id = 98;
update allah_names set name_french = 'Le Soutien absolu', explanation = 'Celui dont tout le monde a besoin, alors que Lui n''a besoin de personne.' where id = 68;
-- 11. Fiche de la sourate 83 : sourate classée mecquoise, révélée selon Ibn ʿAbbâs à l'arrivée à Médine
update sourate_stories set texte = texte || ' Dans le Mushaf de Médine, la sourate est classée mecquoise : beaucoup de savants disent qu''elle est la dernière révélée à La Mecque, ou la toute première révélée à l''arrivée à Médine, ce qui correspond à ce récit d''Ibn ʿAbbâs.', updated_at = now() where sourate_number = 83;
-- 13. LODO : on PASSE les mains mouillées sur les cheveux (masḥ), on ne les lave pas (3 groupes d'âge)
update prayer_cards set title = '8 - PASSER LES MAINS SUR LES CHEVEUX ET LES OREILLES' where title = '8 - LAVER LES CHEVEUX ET LES OREILLES';
-- 14. Quiz du jour 18 : une seule copie de chaque question (les doublons vont dans la corbeille de Nadia)
with doublons as (
  select q.*, row_number() over (partition by q.day_id, q.question order by q.created_at, q.id) rn
  from ramadan_quizzes q join ramadan_days d on d.id = q.day_id where d.day_number = 18
)
insert into trash_items (user_id, item_type, item_data, original_id, label)
select (select user_id from user_roles where role = 'admin' limit 1), 'ramadan_quiz', to_jsonb(d) - 'rn', d.id::text, 'Question en double (jour 18) : ' || left(d.question, 60)
from doublons d where rn > 1;
delete from ramadan_quizzes where id in (select (original_id)::uuid from trash_items where label like 'Question en double (jour 18)%');
select (select count(*) from ramadan_quizzes q join ramadan_days d on d.id=q.day_id where d.day_number=18) jour18,
       (select count(*) from prayer_cards where title like '8 - PASSER%') cartes8;
