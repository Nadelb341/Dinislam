-- 📿 Carte Dhikr (Nadia, 28/11 : « 3 : B ») : « Défi du groupe » et « Quiz » retirés. Les 12 questions du quiz partent à la
-- CORBEILLE de Paramètres (restaurables, copie complète de chaque ligne) ; aucun défi n'existait (0 ligne dans dhikr_defis).
-- Les tables restent (la corbeille les utilise pour restaurer). À appliquer avec `supabase db query --linked -f` (JAMAIS `db push`).
insert into public.trash_items (user_id, item_type, original_id, label, item_data)
select '849384ad-e6ec-4ec4-b17a-ec51129ce50e', 'dhikr_question', q.id::text, left('Quiz Dhikr : ' || q.question, 120), to_jsonb(q)
from public.dhikr_quiz q
where not exists (select 1 from public.trash_items t where t.item_type = 'dhikr_question' and t.original_id = q.id::text);
delete from public.dhikr_quiz q
where exists (select 1 from public.trash_items t where t.item_type = 'dhikr_question' and t.original_id = q.id::text);
select (select count(*) from public.dhikr_quiz) as quiz_restant, (select count(*) from public.trash_items where item_type = 'dhikr_question') as dans_corbeille;
