-- 🕌 Degré d'authenticité PARTOUT (règle n°1 de Nadia, 2026-11-27 : « dans TOUTE l'appli sans exception »).
-- Additif seulement : nouvelles colonnes (vide autorisé) + remplissage + contenu de la carte « 📊 Niveaux d'authenticité ».
-- degre : sahih (Authentique) / hasan (Bon) / daif (Faible) / mawdou (Inventé) / coran ; degre_divergence : phrase courte
-- quand les spécialistes du hadith ne sont pas d'accord. Vide = degré pas encore établi (on n'invente rien).
-- Al-Boukhârî et Mouslim = sahih. Les autres : jugement connu des spécialistes (voir chaque ligne).
-- ⚠️ Ne JAMAIS lancer `supabase db push` : appliquer avec `supabase db query --linked -f <ce fichier>`.

-- 1) Colonnes (même règle partout) ---------------------------------------------------------------------------
alter table public.hadiths_du_jour add column if not exists degre text, add column if not exists degre_divergence text;
alter table public.dhikr_items add column if not exists degre text, add column if not exists degre_divergence text;
alter table public.dhikr_gestes add column if not exists degre text, add column if not exists degre_divergence text;
alter table public.dhikr_quiz add column if not exists degre text, add column if not exists degre_divergence text;
alter table public.ramadan_quizzes add column if not exists source text, add column if not exists degre text, add column if not exists degre_divergence text;
alter table public.invocations
  add column if not exists content_degre text, add column if not exists content_degre_divergence text,
  add column if not exists autre_degre text, add column if not exists autre_degre_divergence text;

do $$
declare t record;
begin
  for t in select * from (values
    ('hadiths_du_jour', 'degre'), ('dhikr_items', 'degre'), ('dhikr_gestes', 'degre'), ('dhikr_quiz', 'degre'),
    ('ramadan_quizzes', 'degre'), ('invocations', 'content_degre'), ('invocations', 'autre_degre')
  ) as v(tab, col) loop
    if not exists (select 1 from pg_constraint where conname = t.tab || '_' || t.col || '_valeur') then
      execute format('alter table public.%I add constraint %I check (%I is null or %I in (''sahih'',''hasan'',''daif'',''mawdou'',''coran''))',
        t.tab, t.tab || '_' || t.col || '_valeur', t.col, t.col);
    end if;
  end loop;
end $$;

-- 2) Hadith du jour (40 lignes) ------------------------------------------------------------------------------
update public.hadiths_du_jour set degre = 'sahih'
  where degre is null and source ~* '(boukh|bukh|mouslim|muslim)';
-- « Le meilleur des gens est celui qui est le plus utile aux autres » (At-Tabarânî)
update public.hadiths_du_jour set degre = 'hasan',
  degre_divergence = 'Jugé hasan (bon) par Al-Albânî (As-Silsila as-Sahîha n° 426) ; d''autres spécialistes ont jugé sa chaîne faible.'
  where degre is null and source ~* 'tabar';
-- « Dis la vérité même si elle est amère » (Ibn Hibbân) : LAISSÉ VIDE, degré à vérifier (voir le rapport du 27/11).

-- 3) Dhikr ----------------------------------------------------------------------------------------------------
update public.dhikr_items set degre = 'sahih' where degre is null and source ~* '(boukh|bukh|mouslim|muslim)';
update public.dhikr_quiz set degre = 'sahih' where degre is null and source ~* '(boukh|bukh|mouslim|muslim)';
update public.dhikr_gestes set degre = 'sahih' where degre is null and source ~* '(boukh|bukh|mouslim|muslim)';
-- Gestes cachés « à confirmer » (hors des sources de Nadia) :
update public.dhikr_gestes set degre = 'hasan',
  degre_divergence = 'At-Tirmidhî l''a jugé hasan sahîh ; Al-Albânî l''a jugé hasan (bon).'
  where degre is null and source ~* 'Abou D.woud 5082';
update public.dhikr_gestes set degre = 'sahih'
  where degre is null and source ~* 'Abou D.woud 5088';   -- At-Tirmidhî : hasan sahîh ; Al-Albânî : sahîh

-- 4) Invocations (seules 2 lignes ont leur source en base ; les autres prennent celle de l'appli, avec son degré) --
-- « Allâhoumma bârik lanâ fîmâ razaqtanâ… » (Ibn As-Sounnî) : jugé faible par les spécialistes du hadith
update public.invocations set content_degre = 'daif'
  where title_french = 'Avant de manger' and content_degre is null and content_source ~* 'Sunn';
update public.invocations set autre_degre = 'sahih'
  where title_french = 'Avant de manger' and autre_degre is null and autre_source ~* '3767';
-- « al-hamdou lillâhi-lladhî at'amanâ wa saqânâ wa ja'alanâ mouslimîn » : jugé faible par Al-Albânî (un transmetteur inconnu)
update public.invocations set content_degre = 'daif'
  where title_french = 'Après avoir mangé' and content_degre is null and content_source ~* '3850';
update public.invocations set autre_degre = 'hasan'
  where title_french = 'Après avoir mangé' and autre_degre is null and autre_source ~* '4023';

-- 5) Fiches des sourates : degré DANS chaque source (clés « degre » / « degre_divergence » du JSON) ------------------
update public.sourate_stories s set sources = (
  select jsonb_agg(
    case
      when e ? 'degre' then e
      when s.sourate_number = 36 and e->>'ref' ~* 'Darussalam' then e || jsonb_build_object('degre', 'sahih',
        'degre_divergence', 'Jugé authentique par Al-Albânî ; jugé faible dans l''édition Darussalam (sunnah.com).')
      when s.sourate_number = 64 and e->>'ref' ~* 'Darussalam' then e || jsonb_build_object('degre', 'hasan',
        'degre_divergence', 'Jugé hasan par Al-Albânî et hasan sahîh par At-Tirmidhî ; jugé faible dans l''édition Darussalam (sunnah.com).')
      when e->>'ref' ~* '(boukh|bukh|mouslim|muslim)' then e || '{"degre":"sahih"}'::jsonb
      when e->>'ref' ~* '(authentique|hasan sah)' then e || '{"degre":"sahih"}'::jsonb
      when e->>'ref' ~* 'hasan' then e || '{"degre":"hasan"}'::jsonb
      else e
    end order by o)
  from jsonb_array_elements(s.sources) with ordinality as x(e, o))
where jsonb_typeof(s.sources) = 'array' and jsonb_array_length(s.sources) > 0;

-- 6) Quiz du Ramadan : la source + le degré des questions qui citent un hadith ou un verset -----------------------
update public.ramadan_quizzes q set source = v.source, degre = v.degre, degre_divergence = v.divergence
from (values
  ('8de1fa1e-44aa-4f8d-aaac-dc57dacf5e41'::uuid, 'Al-Boukhârî 8 et Mouslim 16', 'sahih', null),
  ('0731564b-fa87-458d-a849-d44f0951f5b0'::uuid, 'Mouslim 2588', 'sahih', null),
  ('13327ecd-888a-4dd8-98a4-cb6484234db9'::uuid, 'At-Tirmidhî 807 (hasan sahîh selon At-Tirmidhî, authentique selon Al-Albânî)', 'sahih', null),
  ('76b64dc5-5920-416f-b428-bd3f47f110ef'::uuid, 'Al-Boukhârî 1773 et Mouslim 1349', 'sahih', null),
  ('ee41809a-2115-445a-8105-96e10f7c7a08'::uuid, 'Al-Boukhârî 6412', 'sahih', null),
  ('83c72c8f-9444-42b9-97c6-a2510755da6b'::uuid, 'Al-Boukhârî 2311', 'sahih', null),
  ('01b994fd-4c39-4a6b-ae01-f7e11ab70e2a'::uuid, 'An-Nasâ''î, As-Sounan al-Koubrâ 9928', 'sahih',
     'Jugé authentique par Al-Albânî ; Ibn al-Jawzî l''a classé parmi les hadiths inventés.'),
  ('3369acba-4eeb-4575-bbc4-988c556b5b54'::uuid, 'Al-Boukhârî 349 et Mouslim 162', 'sahih', null),
  ('ef27ef8e-7b84-474e-8ce2-98cf3297d221'::uuid, 'Al-Boukhârî 3 et Mouslim 160', 'sahih', null),
  ('0642deba-d03e-4192-bb21-0fca9e4c05d9'::uuid, 'Sourate Al-Ahzâb, verset 21', 'coran', null),
  ('2383506f-2500-4792-9895-87d31a727c6b'::uuid, 'Sourate Tâ-Hâ, verset 44', 'coran', null)
) as v(id, source, degre, divergence)
where q.id = v.id and q.source is null and q.degre is null;

-- 7) Contenu de la carte « 📊 Niveaux d'authenticité » (✏️ modifiable par Nadia ; même texte que src/data/niveauxAuthenticite.ts)
insert into public.reglages_appli (cle, valeur)
values ('niveaux_authenticite', $json${"intro":"Les paroles attribuées au Prophète ﷺ (les hadiths) n'ont pas toutes la même force. Les savants du hadith ont vérifié, une par une, qui les a transmises. Voici les 4 niveaux : dans l'appli, chaque hadith porte sa pastille de couleur.","niveaux":[{"cle":"sahih","phrase":"Hadith reconnu authentique.","exemple":"« Les actions ne valent que par leurs intentions. »","exemple_source":"Al-Boukhârî n° 1 et Mouslim n° 1907","note":"Tout ce qui est dans Sahîh Al-Boukhârî et Sahîh Mouslim est de ce niveau."},{"cle":"hasan","phrase":"Hadith fiable, mais dont le degré est inférieur au Sahih.","exemple":"L'invocation de la rupture du jeûne : « Dhahaba-dh-dhama'ou wabtallati-l-'ouroûq… » (La soif est partie, les veines sont humidifiées…)","exemple_source":"Abou Dâwoud n° 2357, jugé hasan (bon) par Ad-Dâraqoutnî et Al-Albânî","note":"On peut s'appuyer dessus."},{"cle":"daif","phrase":"Hadith présentant une faiblesse dans sa chaîne de transmission ou sa transmission.","exemple":"« Allâhoumma bârik lanâ fîmâ razaqtanâ wa qinâ 'adhâba-n-nâr » (Ô Allah, bénis ce que Tu nous as donné…), dit avant de manger.","exemple_source":"Ibn As-Sounnî, « 'Amal al-yawm wa-l-layla », jugé faible par les spécialistes du hadith","note":"Ce qui est sûr avant de manger, c'est « Bismillâh » (Al-Boukhârî n° 5376 et Mouslim n° 2022)."},{"cle":"mawdou","phrase":"Hadith fabriqué et faussement attribué au Prophète ﷺ.","exemple":"« Aimer sa patrie fait partie de la foi. »","exemple_source":"Déclaré inventé par As-Saghânî et Al-Albânî : ce n'est PAS une parole du Prophète ﷺ","note":"On ne le dit jamais comme une parole du Prophète ﷺ."}],"divergence":"En cas de divergence entre les spécialistes du hadith, on le précise au lieu de choisir arbitrairement un avis. Dans l'appli : pastille « ⚖️ Avis divergents ».","fadail":"Un hadith faible n'est pas automatiquement présenté comme faux : certains savants l'ont admis sous conditions dans les mérites des œuvres (Fada'il al-A'mal). Mais on ne s'en sert JAMAIS pour présenter une pratique comme une Sunna établie ou une obligation.","ordre_titre":"L'ordre des sources","ordre":["Le Saint Coran","Sahîh Al-Boukhârî","Sahîh Mouslim","Les autres recueils de hadiths authentifiés : Abou Dâwoud, At-Tirmidhî, An-Nasâ'î, Ibn Mâjah, etc.","Les ouvrages de référence des savants sunnites, notamment ceux de l'école malikite"],"ordre_note":"Les hadiths des autres recueils (4) sont toujours accompagnés de leur degré d'authenticité et de leur référence."}$json$::jsonb)
on conflict (cle) do nothing;
