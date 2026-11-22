-- 📚 Histoires des Prophètes (Nadia, 22/11) : les vidéos à la place du texte → le texte des 8 histoires des grands est retiré.
-- Rien ne disparaît sans la corbeille : chaque texte part dans la corbeille de Nadia comme « zone de contenu » texte de la fiche
-- (la restaurer le remet dans la fiche). Copie aussi dans _archives/histoires_prophetes_textes_2026-11-22.json.
insert into public.trash_items (user_id, item_type, original_id, label, item_data)
select r.user_id, 'zone_contenu', z.id::text, 'Texte de « ' || f.titre || ' » (Histoires des Prophètes)',
  jsonb_build_object('id', z.id, 'cible', 'petits:' || f.id, 'kind', 'texte', 'texte', f.texte, 'url', null, 'nom', null, 'position', 0)
from public.petits_fiches f
cross join lateral (select gen_random_uuid() as id) z
cross join lateral (select user_id from public.user_roles where role = 'admin'::app_role order by user_id limit 1) r
where f.rubrique = 'prophetes' and f.texte is not null;
update public.petits_fiches set texte = null, updated_at = now() where rubrique = 'prophetes' and texte is not null;
