-- 🤲 Invocations : textes authentiques en PRINCIPAL (demande de Nadia, 2026-11-27, règle n°1).
-- Additif : AUCUNE ligne effacée. Chaque texte retiré de l'affichage est d'abord COPIÉ dans la corbeille de Nadia
-- (trash_items, type « invocation_texte » : restaurable depuis Paramètres › Corbeille).
-- Relancer ce fichier ne fait rien de plus (chaque étape vérifie qu'elle n'a pas déjà été faite).
-- ⚠️ Ne JAMAIS lancer `supabase db push` : appliquer avec `supabase db query --linked -f <ce fichier>`.

-- 1) « Avant de manger » : « Bismillâh » (Al-Boukhârî 5376, Mouslim 2022 = SAHIH) devient le texte PRINCIPAL ;
--    l'ancien principal (Ibn As-Sounnî, DA'IF) passe en « Autre invocation » avec sa pastille DA'IF (rien supprimé).
--    L'ancienne « autre invocation » (« Bismillâh », Abou Dâwoud 3767) est remplacée par le même mot avec de meilleures sources :
--    elle est copiée dans la corbeille avant.
insert into public.trash_items (user_id, item_type, item_data, original_id, label)
select r.user_id, 'invocation_texte',
  jsonb_build_object('invocation_id', i.id, 'bloc', 'autre', 'valeurs', jsonb_build_object(
    'arabe', i.autre_arabe, 'prononciation', i.autre_prononciation, 'traduction', i.autre_traduction,
    'source', i.autre_source, 'degre', i.autre_degre, 'divergence', i.autre_degre_divergence)),
  i.id::text, '« Avant de manger » — ancienne autre invocation (Bismillâh, Abou Dâwoud 3767), remplacée le 27/11'
from public.invocations i
cross join lateral (select user_id from public.user_roles where role = 'admin' order by user_id limit 1) r
where i.title_french = 'Avant de manger' and i.content_source ~* 'Sunn' and i.autre_arabe is not null
  and not exists (select 1 from public.trash_items t where t.item_type = 'invocation_texte' and t.original_id = i.id::text
                  and t.label like '« Avant de manger » — ancienne autre invocation%');

update public.invocations set
  autre_arabe = content_arabic, autre_prononciation = content_prononciation, autre_traduction = content_french,
  autre_source = content_source, autre_degre = coalesce(content_degre, 'daif'), autre_degre_divergence = content_degre_divergence,
  content_arabic = 'بِسْمِ اللهِ', content_prononciation = 'Bismillâh.', content_french = 'Au nom d''Allah.',
  content_source = 'Rapporté par Al-Bukhârî (n°5376) et Muslim (n°2022)', content_degre = 'sahih', content_degre_divergence = null,
  texte_principal_masque = false
where title_french = 'Avant de manger' and content_source ~* 'Sunn';

-- 2) « Après avoir mangé » : le texte HASAN (Abou Dâwoud 4023, At-Tirmidhî 3458) devient le PRINCIPAL ;
--    le texte DA'IF (Abou Dâwoud 3850 / At-Tirmidhî 3457) est RETIRÉ de l'affichage → copié dans la corbeille avant.
insert into public.trash_items (user_id, item_type, item_data, original_id, label)
select r.user_id, 'invocation_texte',
  jsonb_build_object('invocation_id', i.id, 'bloc', 'principal', 'valeurs', jsonb_build_object(
    'arabe', i.content_arabic, 'prononciation', i.content_prononciation, 'traduction', i.content_french,
    'source', i.content_source, 'degre', i.content_degre, 'divergence', i.content_degre_divergence)),
  i.id::text, '« Après avoir mangé » — ancien texte principal (Abou Dâwoud 3850, DA''IF), retiré le 27/11'
from public.invocations i
cross join lateral (select user_id from public.user_roles where role = 'admin' order by user_id limit 1) r
where i.title_french = 'Après avoir mangé' and i.content_source ~* '3850'
  and not exists (select 1 from public.trash_items t where t.item_type = 'invocation_texte' and t.original_id = i.id::text
                  and t.label like '« Après avoir mangé » — ancien texte principal%');

update public.invocations set
  content_arabic = autre_arabe, content_prononciation = autre_prononciation, content_french = autre_traduction,
  content_source = autre_source, content_degre = coalesce(autre_degre, 'hasan'), content_degre_divergence = autre_degre_divergence,
  autre_arabe = null, autre_prononciation = null, autre_traduction = null, autre_source = null, autre_degre = null, autre_degre_divergence = null,
  texte_principal_masque = false
where title_french = 'Après avoir mangé' and content_source ~* '3850' and autre_source ~* '4023';

-- 3) « En entrant à la maison » : le texte DA'IF (Abou Dâwoud 5096) n'était pas en base (il venait de l'appli) ;
--    l'appli affiche maintenant « Bismillâh » (Mouslim 2018, SAHIH). L'ancien texte est copié dans la corbeille
--    (le restaurer le remet en « Autre invocation », avec sa pastille DA'IF).
insert into public.trash_items (user_id, item_type, item_data, original_id, label)
select r.user_id, 'invocation_texte',
  jsonb_build_object('invocation_id', i.id, 'bloc', 'autre', 'valeurs', jsonb_build_object(
    'arabe', 'بِسْمِ اللهِ وَلَجْنَا، وَبِسْمِ اللهِ خَرَجْنَا، وَعَلَى رَبِّنَا تَوَكَّلْنَا',
    'prononciation', 'Bismi Llâhi walajnâ, wa bismi Llâhi kharajnâ, wa ''alâ rabbinâ tawakkalnâ.',
    'traduction', 'Au nom d''Allah nous entrons, au nom d''Allah nous sortons, et c''est en notre Seigneur que nous plaçons notre confiance.',
    'source', 'Rapporté par Abû Dâwûd (n°5096)', 'degre', 'daif', 'divergence', null)),
  i.id::text, '« En entrant à la maison » — ancien texte (Abou Dâwoud 5096, DA''IF), remplacé le 27/11'
from public.invocations i
cross join lateral (select user_id from public.user_roles where role = 'admin' order by user_id limit 1) r
where i.title_french = 'En entrant à la maison'
  and not exists (select 1 from public.trash_items t where t.item_type = 'invocation_texte' and t.original_id = i.id::text
                  and t.label like '« En entrant à la maison » — ancien texte%');
