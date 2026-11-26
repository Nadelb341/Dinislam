-- 🖼️ 26/11 (Nadia : « dans mon compte j'ai les bonnes images, les autres utilisateurs ont les anciennes »)
-- Cause 2 : la Prière a 3 exemplaires de chaque carte (petits / jeunes / adultes, `group_key`). Nadia avait changé
-- l'image dans l'onglet « petits » seulement. On recopie ses images dans les 2 autres groupes (déjà appliqué le 26/11).
update prayer_cards t set image_url = s.image_url, image_cadrage = s.image_cadrage
from prayer_cards s where s.group_key='petits' and s.parent_id is null and t.parent_id is null and t.title = s.title
  and t.group_key in ('jeunes','adultes') and s.title in ('LODO','Faire la prière');
