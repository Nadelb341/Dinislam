-- 📑 Coran › « Vocabulaire du Coran » : SOUS-SOMMAIRE des parties (Nadia, 2026-11-26).
-- Toucher une partie qui a des chapitres ouvre la liste de ses chapitres (A, B, C…) ; toucher un chapitre
-- ouvre le PDF de la partie directement à la bonne page.
--
-- Un chapitre = une ligne ENFANT de sa partie dans `coran_vocabulaire` :
--   parent_id = la partie (retrouvée par sa `cle`), titre, page_debut = page DANS LE FICHIER DE LA PARTIE
--   (1 = première page du fichier), position, pdf_url = null (on ouvre le PDF de la partie), cle = '<cle-partie>/ch-<n>'.
-- Visibilité : rien à changer. `mode` reste 'tous' et la fonction `coran_vocabulaire_visible` remonte déjà TOUTE
-- la chaîne des parents (chapitre → partie → sous-carte) : un chapitre se voit seulement si sa partie et sa
-- sous-carte se voient. Les règles RLS existantes (lecture / admin) s'appliquent telles quelles.
--
-- Titres relevés dans les PDF de public/pdf/coran/vocabulaire/ (titres seulement, aucun texte de cours).
-- La lettre (A, B, C…) n'est pas dans le titre : l'écran l'affiche d'après l'ordre.
-- Parties SANS chapitres (elles s'ouvrent comme avant) :
--   • Calligraphie du Coran : aucune partie n'a de titres intérieurs (une page = des exemples commentés).
--   • Lecture facile du Coran : les cours sont faits d'« étapes » d'exercices (1ʳᵉ étape, 2ᵉ étape…), pas de
--     chapitres ; seuls les cours 2, 15, 17 et 18 ont de vrais titres intérieurs (endroits de prononciation,
--     « situations » des lettres muettes).
--
-- ADDITIF et IDEMPOTENT (on conflict (cle) do nothing) ; si une partie a été supprimée, ses chapitres ne sont
-- simplement pas ajoutés. À appliquer avec `supabase db query --linked -f` (JAMAIS `db push`).

insert into public.coran_vocabulaire (parent_id, cle, titre, page_debut, position)
select p.id, v.cle_partie || '/ch-' || v.n, v.titre, v.page, v.n * 10
from (values
  -- 80 % des mots du Coran › INTRODUCTION (01-introduction.pdf, 19 pages)
  ('80-mots/introduction', 1, 'Présentation', 2),
  ('80-mots/introduction', 2, 'Comment utiliser le document ?', 6),
  ('80-mots/introduction', 3, 'Mémoriser le Qour’ân', 7),
  ('80-mots/introduction', 4, 'Les 10 consignes commençant par la lettre « ت » pour la mémorisation du Qour’ân', 11),
  ('80-mots/introduction', 5, 'Les 10 stratégies pour mémoriser le Qour’ân', 13),
  ('80-mots/introduction', 6, 'Apprendre l’arabe', 15),
  -- 80 % › 40 % DES MOTS DU QOUR’ÂN (02-40-des-mots.pdf, 13 pages)
  ('80-mots/40-des-mots', 1, 'Pronoms', 2),
  ('80-mots/40-des-mots', 2, 'Forme négative, affirmative et d’exclusion', 3),
  ('80-mots/40-des-mots', 3, 'À qui ? Les pronoms connectés', 4),
  ('80-mots/40-des-mots', 4, 'Qui ? Les pronoms déconnectés', 5),
  ('80-mots/40-des-mots', 5, 'Où ?', 6),
  ('80-mots/40-des-mots', 6, 'Question / affirmation', 7),
  ('80-mots/40-des-mots', 7, 'Question / affirmation', 8),
  ('80-mots/40-des-mots', 8, 'Quand ?', 9),
  ('80-mots/40-des-mots', 9, 'Préposition + ما', 10),
  ('80-mots/40-des-mots', 10, 'Prépositions / particules', 11),
  ('80-mots/40-des-mots', 11, 'Préfixes verbaux et particules', 12),
  ('80-mots/40-des-mots', 12, 'Préfixes et particules', 13),
  -- 80 % › NOMS DIVINS ET AUTRES QUALIFICATIFS (03-noms-divins.pdf, 5 pages)
  ('80-mots/noms-divins', 1, 'Quelques noms d’Allah', 2),
  ('80-mots/noms-divins', 2, 'Autres noms d’Allah et adjectifs (1/2)', 3),
  ('80-mots/noms-divins', 3, 'Autres noms d’Allah et adjectifs (2/2)', 4),
  ('80-mots/noms-divins', 4, 'Superlatifs', 5),
  -- 80 % › CRÉATION D’ALLAH (04-creation.pdf, 4 pages)
  ('80-mots/creation', 1, 'Signes d’Allah', 2),
  ('80-mots/creation', 2, 'Bénédictions, abondance, grâces et autorité', 3),
  ('80-mots/creation', 3, 'Univers, monde(s), demeure et ici-bas', 4),
  -- 80 % › RELIGION, FOI ET ACTES (05-religion-foi-actes.pdf, 6 pages)
  ('80-mots/religion-foi-actes', 1, 'Le Jour de la Résurrection', 2),
  ('80-mots/religion-foi-actes', 2, 'Le Jour de la Résurrection (2/2)', 3),
  ('80-mots/religion-foi-actes', 3, 'Religion', 4),
  ('80-mots/religion-foi-actes', 4, 'Foi', 5),
  ('80-mots/religion-foi-actes', 5, 'Actes', 6),
  -- 80 % › PERSONNES (06-personnes.pdf, 5 pages)
  ('80-mots/personnes', 1, 'Personnages', 2),
  ('80-mots/personnes', 2, 'Parents, famille', 3),
  ('80-mots/personnes', 3, 'Parties du corps, âmes', 4),
  ('80-mots/personnes', 4, 'Gens, individus', 5),
  -- 80 % › LES VERBES ET DÉRIVÉS (07-verbes-et-derives.pdf, 21 pages)
  ('80-mots/verbes-et-derives', 1, 'Les verbes simples', 2),
  ('80-mots/verbes-et-derives', 2, 'Les verbes augmentés', 12),
  -- Lecture facile › COURS N°2 : la prononciation des lettres (03-cours-02.pdf, 10 pages)
  ('lecture-facile/cours-02', 1, 'Le creux de la bouche (الجَوْف)', 2),
  ('lecture-facile/cours-02', 2, 'La gorge (الحَلْق)', 2),
  ('lecture-facile/cours-02', 3, 'La langue (اللِّسَان)', 3),
  ('lecture-facile/cours-02', 4, 'Les lèvres (الشَّفَتَان)', 7),
  ('lecture-facile/cours-02', 5, 'Le nez (الخَيْشُوم)', 8),
  -- Lecture facile › COURS N°15 : les lettres muettes (1) (16-cours-15.pdf, 6 pages)
  ('lecture-facile/cours-15', 1, 'Première situation : le alif accompagné d’un tanwine fat-hà', 1),
  ('lecture-facile/cours-15', 2, 'Deuxième situation : le yà accompagné d’un tanwine fat-hà', 1),
  ('lecture-facile/cours-15', 3, 'Troisième situation : les lettres faisant office de base du alif maddi', 2),
  -- Lecture facile › COURS N°17 : les lettres muettes (3) (18-cours-17.pdf, 8 pages)
  ('lecture-facile/cours-17', 1, 'Cinquième situation : le alif al-wassl entre deux mots', 1),
  ('lecture-facile/cours-17', 2, 'Sixième situation : les lettres muettes', 3),
  -- Lecture facile › COURS N°18 : les lettres muettes (4) (19-cours-18.pdf, 10 pages)
  ('lecture-facile/cours-18', 1, 'Septième situation : la lettre làme auprès des lettres solaires', 1),
  ('lecture-facile/cours-18', 2, 'Huitième situation : la voyelle longue précédant un alif al-wassl', 4)
) as v(cle_partie, n, titre, page)
join public.coran_vocabulaire p on p.cle = v.cle_partie
on conflict (cle) do nothing;

-- Vérification : nombre de chapitres par partie
select p.cle, count(c.id) as chapitres
from public.coran_vocabulaire p
join public.coran_vocabulaire c on c.parent_id = p.id
where p.parent_id is not null
group by p.cle
order by p.cle;
