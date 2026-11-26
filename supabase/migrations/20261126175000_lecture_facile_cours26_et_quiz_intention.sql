-- 🕌 26/11 (règle n°1) : le COURS N°26 de « Lecture facile » contient aussi du droit chiite (4 prosternations obligatoires,
-- « Istifta Sayyid Sistani », se prosterner sur de la terre) → retiré, comme l'introduction et l'appendice.
delete from zones_contenu where cible = 'coran-vocab:f23166dc-7cb1-4073-891a-07c3e4f52983';
delete from coran_vocabulaire where id = 'f23166dc-7cb1-4073-891a-07c3e4f52983';
-- Quiz « 1 - Avoir l'intention » : retirer « toucher le Coran avec un gant » (malikite : interdit sans ablutions, même avec un gant)
-- et « Allah te protège du mal » (sans source) → 2 questions sûres à la place.
update quiz_videos set questions = (
  select jsonb_agg(x) from jsonb_array_elements(questions) x
  where x->>'question' not like '%gant propre%' and x->>'question' not like '%que fait Allah pour toi%'
) || '[{"question":"L''intention est-elle obligatoire pour que les ablutions soient valables ?","choix":["Oui, c''est obligatoire","Non, on peut s''en passer","Seulement le vendredi"],"bonne":0,"explication":"Sans intention, les ablutions ne comptent pas : c''est la première étape.","emoji":"✅","arabe":"النِّيَّة"},{"question":"Quelle est la toute première étape des ablutions ?","choix":["Avoir l''intention","Laver les pieds","Dire l''invocation de la fin"],"bonne":0,"explication":"1 : l''intention, 2 : Bismillah, 3 : les mains…","emoji":"1️⃣","arabe":null}]'::jsonb
where cible = 'zone:b28afebe-22d2-4366-a4bb-fd55bc76b2b8';
select jsonb_array_length(questions) n from quiz_videos where cible = 'zone:b28afebe-22d2-4366-a4bb-fd55bc76b2b8';
