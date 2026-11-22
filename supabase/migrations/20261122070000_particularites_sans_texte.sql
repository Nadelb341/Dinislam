-- 🔤 Lettres particulières (Nadia, 22/11) : on enlève les textes de TOUTES les leçons (même disposition partout :
-- vidéo, « Teste-toi », PDF mis en valeur, commentaires). Chaque texte part dans la corbeille (restaurable à sa place).
insert into public.trash_items (user_id, item_type, original_id, label, item_data)
select r.user_id, 'alphabet_particularite_bloc', b.id::text, 'Texte (' || p.titre || ')', to_jsonb(b)
from public.alphabet_particularite_blocs b
join public.alphabet_particularites p on p.id = b.particularite_id
cross join lateral (select user_id from public.user_roles where role = 'admin'::app_role order by user_id limit 1) r
where b.kind = 'texte';
delete from public.alphabet_particularite_blocs where kind = 'texte';
