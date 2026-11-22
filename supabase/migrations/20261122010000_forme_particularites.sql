-- ✨ Lettres particulières (Nadia, 2026-11-22) : la FORME des lettres de la règle remplace l'emoji des tuiles.
-- Ce qui est entre { } s'affiche dans la couleur de la tuile. L'ancienne colonne emoji reste (plus affichée) :
-- les particularités déjà dans la corbeille la contiennent et doivent pouvoir être restaurées.
alter table public.alphabet_particularites add column if not exists forme text;

update public.alphabet_particularites p set forme = v.forme
from (values
  ('Les voyelles courtes', 'ب{َ}  ب{ُ}  ب{ِ}'),
  ('Le soukoune', 'ب{ْ}  مِن{ْ}'),
  ('La chadda', 'ب{َّ}  رَب{ّ}'),
  ('Le tanouine', 'ب{ً}  ب{ٌ}  ب{ٍ}'),
  ('Les voyelles longues (madd)', 'بَ{ا}  بُ{و}  بِ{ي}'),
  ('La hamza', '{ء  أ  ؤ  ئ}'),
  ('Le tâ marbouta', '{ة}  مَدْرَسَ{ة}'),
  ('L''alif maqsoura', '{ى}  هُدَ{ى}'),
  ('Le lam-alif', '{لا  لأ  لإ}'),
  ('Les lettres solaires', 'ال{شَّ}مْس'),
  ('Les lettres lunaires', 'ا{لْ}قَمَر')
) as v(titre, forme)
where p.titre = v.titre and p.forme is null;
