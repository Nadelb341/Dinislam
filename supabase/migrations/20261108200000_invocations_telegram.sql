-- 2026-11-08 — Cartes « Invocations » complétées depuis le canal Telegram de Nadia (choix de Nadia du 08/11) :
--  • « Lorsqu'on se couche » (même invocation que « Avant de dormir ») → corbeille de l'admin (restaurable), 0 donnée d'élève liée
--  • fautes corrigées : réveille, oublie, jeûne
--  • 5 nouvelles cartes (à l'identique des autres : quotidienne, verrouillée) : sortir / entrer à la maison, j'ai mal, tachahoud 1 et 2
--  • ordre = ordre du canal Telegram ; les 3 cartes absentes du canal (mosquée ×2, voiture) passent à la fin, inchangées
-- Écritures bornées par id. À lancer avec : supabase db query --linked -f <ce fichier>   (JAMAIS supabase db push)

-- 1. Corbeille d'abord (copie complète de la ligne), puis retrait
insert into public.trash_items (user_id, item_type, item_data, original_id, label)
select '849384ad-e6ec-4ec4-b17a-ec51129ce50e', 'invocation', to_jsonb(i), i.id::text, 'Invocation « ' || i.title_french || ' »'
from public.invocations i
where i.id = 2 and i.title_french = 'Lorsqu''on se couche';

delete from public.invocations
where id = 2 and title_french = 'Lorsqu''on se couche'
  and exists (select 1 from public.trash_items t where t.item_type = 'invocation' and t.original_id = '2');

-- 2. Fautes d'orthographe
update public.invocations set title_french = 'Lorsqu''on se réveille' where id = 1;
update public.invocations set title_french = 'Lorsqu''on oublie de dire Bismillah' where id = 11;
update public.invocations set title_french = 'Rompre le jeûne (Ramadan)' where id = 12;

-- 3. Nouvelles cartes (pas de doublon si le fichier est relancé)
insert into public.invocations (title_french, title_arabic, category, is_locked, display_order)
select v.t, v.a, 'quotidienne', true, v.o
from (values
  ('En sortant de la maison', 'دعاء الخروج من المنزل', 5),
  ('En entrant à la maison',  'دعاء دخول المنزل',      6),
  ('Lorsque j''ai mal',        'دعاء الألم',            9),
  ('Tachahoud (1re partie)',  'التشهد',                11),
  ('Tachahoud (2e partie)',   'الصلاة الإبراهيمية',     12)
) as v(t, a, o)
where not exists (select 1 from public.invocations i where i.title_french = v.t);

-- 4. Ordre du canal Telegram
update public.invocations set display_order = 0  where id = 1;   -- réveil
update public.invocations set display_order = 1  where id = 10;  -- avant de dormir
update public.invocations set display_order = 2  where id = 5;   -- avant de manger
update public.invocations set display_order = 3  where id = 11;  -- oubli de Bismillah
update public.invocations set display_order = 4  where id = 6;   -- après avoir mangé
update public.invocations set display_order = 7  where id = 7;   -- entrer aux toilettes
update public.invocations set display_order = 8  where id = 8;   -- sortir des toilettes
update public.invocations set display_order = 10 where id = 12;  -- rompre le jeûne
update public.invocations set display_order = 13 where id = 3;   -- entrer à la mosquée
update public.invocations set display_order = 14 where id = 4;   -- sortir de la mosquée
update public.invocations set display_order = 15 where id = 9;   -- monter en voiture
