-- 💬 Questions fréquentes de départ sur la chadda, écrites pour Dinislam (2026-11-21), postées au nom de l'enseignante :
-- toute la classe les voit, Nadia peut les modifier ou les retirer. (Les messages du site Tajwid Institut ne sont pas recopiés :
-- page réservée aux membres, copie interdite par leurs CGV, messages écrits par d'autres personnes.)
do $$
declare p uuid; a uuid;
begin
  select id into p from public.alphabet_particularites where titre = 'La chadda' limit 1;
  select user_id into a from public.user_roles where role = 'admin' limit 1;
  if p is null or a is null or exists (select 1 from public.alphabet_commentaires where particularite_id = p and est_admin) then return; end if;
  -- Le déclencheur garde l'auteur fourni quand c'est l'enseignante qui « restaure » : on se place à sa place
  perform set_config('request.jwt.claims', json_build_object('sub', a::text, 'role', 'authenticated')::text, true);
  insert into public.alphabet_commentaires (particularite_id, user_id, auteur, est_admin, texte) values
  (p, a, 'Enseignante', true, '❓ Est-ce que la chadda est une voyelle ?' || chr(10) || '💡 Non. Elle double la lettre, et elle vient toujours avec une voyelle : une fatha, une kasra ou une damma (ou un tanouine).'),
  (p, a, 'Enseignante', true, '❓ La kasra se met où quand il y a une chadda ?' || chr(10) || '💡 Sous la chadda (juste en dessous du petit « w »), ou sous la lettre : les deux façons existent. On lit pareil : بِّ = bbi.'),
  (p, a, 'Enseignante', true, '❓ Comment savoir combien de temps tenir la lettre doublée ?' || chr(10) || '💡 On la prononce deux fois : une fois pour fermer la syllabe d''avant, une fois avec la voyelle. رَبَّ = rab-ba.'),
  (p, a, 'Enseignante', true, '❓ Pourquoi il y a une chadda après « ال » dans certains mots ?' || chr(10) || '💡 Ce sont les lettres solaires : le ل ne se prononce pas et la lettre suivante est doublée. الشَّمْس = ach-chams.'),
  (p, a, 'Enseignante', true, '❓ La chadda sur le ن ou le م, c''est spécial ?' || chr(10) || '💡 Oui : avec la chadda, le ن et le م se lisent avec une petite résonance dans le nez (le ghounna), d''environ 2 temps. Exemple : إِنَّ.');
end $$;
