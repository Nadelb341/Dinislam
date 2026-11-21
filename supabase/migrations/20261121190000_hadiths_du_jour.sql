-- 🕊️ Hadiths du jour EN BASE (2026-11-21) : les 40 hadiths écrits jusqu'ici dans le code de l'accueil (Index.tsx)
-- passent dans une table, pour que l'enseignante (admin) puisse les ajouter, modifier, supprimer (corbeille) et ranger
-- directement depuis l'accueil. Les élèves lisent seulement. Additif uniquement : rien n'est supprimé ni modifié ailleurs.
-- La colonne « theme » garde la petite étiquette affichée sur la carte (ex. « Intention »).

create table if not exists public.hadiths_du_jour (
  id uuid primary key default gen_random_uuid(),
  texte_arabe text,
  texte text not null,
  source text,
  theme text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hadiths_du_jour_position_idx on public.hadiths_du_jour (position);

-- updated_at mis à jour tout seul à chaque modification
drop trigger if exists hadiths_du_jour_updated_at on public.hadiths_du_jour;
create trigger hadiths_du_jour_updated_at before update on public.hadiths_du_jour
  for each row execute function public.update_updated_at_column();

-- 🔐 Lecture pour tous les connectés, écriture seulement pour l'admin
alter table public.hadiths_du_jour enable row level security;
drop policy if exists "hadiths_du_jour_lecture" on public.hadiths_du_jour;
create policy "hadiths_du_jour_lecture" on public.hadiths_du_jour for select to authenticated using (true);
drop policy if exists "hadiths_du_jour_admin" on public.hadiths_du_jour;
create policy "hadiths_du_jour_admin" on public.hadiths_du_jour for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ⚡ En direct : un changement de l'enseignante arrive tout de suite chez tout le monde
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hadiths_du_jour') then
    alter publication supabase_realtime add table public.hadiths_du_jour;
  end if;
end $$;

-- 📜 Les 40 hadiths actuels, dans le même ordre que dans le code (positions 10, 20, 30…).
-- Seulement si la table est vide : relancer ce fichier ne crée jamais de doublon et n'écrase rien.
-- (Arabe vide dans le code → null ici : la carte n'affiche l'arabe que s'il existe, même résultat.)
insert into public.hadiths_du_jour (texte_arabe, texte, source, theme, position)
select v.texte_arabe, v.texte, v.source, v.theme, v.position
from (values
  ('إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ', 'Les actions ne valent que par leurs intentions.', 'Sahih Boukhari', 'Intention', 10),
  ('يَسِّرُوا وَلَا تُعَسِّرُوا', 'Facilite les choses et ne les complique pas. Réjouis les gens et ne les fais pas fuir.', 'Sahih Boukhari', 'Douceur', 20),
  (null, 'Le plus aimé parmi vous auprès d''Allah est celui qui a le meilleur caractère.', 'Sahih Boukhari', 'Caractère', 30),
  ('اطلب العلم من المهد إلى اللحد', 'Cherche la science du berceau jusqu''à la tombe.', 'Sagesse islamique', 'Savoir', 40),
  (null, 'Nul d''entre vous n''est croyant tant qu''il n''aime pas pour son frère ce qu''il aime pour lui-même.', 'Sahih Boukhari', 'Fraternité', 50),
  (null, 'Le Musulman est celui dont les autres Musulmans sont préservés de sa langue et de sa main.', 'Sahih Boukhari', 'Bienveillance', 60),
  ('تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ', 'Souriez à votre frère, c''est de la charité.', 'Tirmidhi', 'Générosité', 70),
  ('الجَنَّةُ تَحْتَ أَقْدَامِ الأُمَّهَاتِ', 'Le paradis se trouve sous les pieds des mères.', 'Nasaï', 'Famille', 80),
  (null, 'Soyez bons envers vos parents, et vos enfants seront bons envers vous.', 'Sagesse islamique', 'Parents', 90),
  ('مَنْ لَمْ يَشْكُرِ النَّاسَ لَمْ يَشْكُرِ اللَّه', 'Celui qui ne remercie pas les gens ne remercie pas Allah.', 'Tirmidhi', 'Gratitude', 100),
  ('الطَّهُورُ شَطْرُ الإِيمَانِ', 'La propreté est la moitié de la foi.', 'Sahih Muslim', 'Pureté', 110),
  (null, 'Le fort n''est pas celui qui terrasse les gens, mais celui qui se maîtrise quand il est en colère.', 'Sahih Boukhari', 'Maîtrise de soi', 120),
  ('قُلِ الحَقَّ وَلَوْ كَانَ مُرًّا', 'Dis la vérité même si elle est amère.', 'Ibn Hibbane', 'Honnêteté', 130),
  (null, 'Quiconque croit en Allah et au Jour dernier doit honorer son voisin.', 'Sahih Boukhari', 'Voisinage', 140),
  (null, 'La miséricorde n''est accordée qu''à ceux qui sont miséricordieux.', 'Tirmidhi', 'Miséricorde', 150),
  ('خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ', 'Le meilleur des gens est celui qui est le plus utile aux autres.', 'Tabarani', 'Utilité', 160),
  (null, 'Ne méprise aucune bonne action, même si c''est d''accueillir ton frère avec un visage souriant.', 'Sahih Muslim', 'Bonne action', 170),
  (null, 'Aide ton frère, qu''il soit oppresseur ou opprimé.', 'Sahih Boukhari', 'Fraternité', 180),
  (null, 'Le croyant ne se mord pas deux fois au même endroit.', 'Sahih Boukhari', 'Sagesse', 190),
  ('قُلْ خَيْرًا أَوِ اصْمُتْ', 'Parle bien ou garde le silence.', 'Sahih Boukhari & Muslim', 'Parole', 200),
  (null, 'Respectez vos aînés, soyez bienveillants envers vos cadets, vous entrerez au Paradis.', 'Tirmidhi', 'Respect', 210),
  (null, 'Celui qui se lève le matin sans soucier du bien des musulmans n''est pas des nôtres.', 'Bayhaqi', 'Solidarité', 220),
  (null, 'Il n''y a pas de bien dans celui qui ne fait pas confiance et en qui on ne peut pas avoir confiance.', 'Ahmad', 'Confiance', 230),
  ('اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ', 'Craignez Allah où que vous soyez, et faites suivre la mauvaise action d''une bonne qui l''effacera.', 'Tirmidhi', 'Taqwa', 240),
  (null, 'Le savant dépasse l''adorateur comme la lune dépasse les autres étoiles.', 'Tirmidhi', 'Savoir', 250),
  (null, 'Celui qui suit une voie pour y chercher un savoir, Allah lui facilite une voie vers le Paradis.', 'Sahih Muslim', 'Savoir', 260),
  (null, 'Prenez soin de votre corps, car il vous a été confié.', 'Sagesse islamique', 'Santé', 270),
  (null, 'Ne regardez pas vers ceux qui sont au-dessus de vous, regardez vers ceux qui sont en dessous.', 'Sahih Boukhari', 'Gratitude', 280),
  ('سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', 'Deux paroles légères sur la langue, lourdes dans la balance : Soubhana Allah wa bihamdihi, Soubhana Allah il Adhim.', 'Sahih Boukhari', 'Dhikr', 290),
  ('بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ', 'Commencez tout acte important par Bismillah.', 'Sagesse islamique', 'Basmala', 300),
  (null, 'L''inégalité entre les croyants dans leurs actes de dévotion est comme l''inégalité de la lune et des étoiles.', 'Tirmidhi', 'Dévotion', 310),
  (null, 'Soyez dans ce monde comme un étranger ou un voyageur de passage.', 'Sahih Boukhari', 'Zuhd', 320),
  (null, 'Quiconque construit une mosquée pour Allah, Allah lui construira une maison au Paradis.', 'Sahih Boukhari', 'Mosquée', 330),
  (null, 'Visitez les malades, nourrissez ceux qui ont faim et libérez les captifs.', 'Sahih Boukhari', 'Humanité', 340),
  (null, 'L''Islam est fondé sur cinq piliers : la Shahada, la prière, la zakat, le jeûne et le pèlerinage.', 'Sahih Boukhari', 'Pilliers', 350),
  ('اللَّهُمَّ إِنِّي أَسْأَلُكَ الهُدَى وَالتُّقَى', 'Dis : Allahouma inni as''alouka al-huda wa at-touqa wa al-afafa wa al-ghina.', 'Sahih Muslim', 'Invocation', 360),
  ('خَيْرُكُمْ مَنْ تَعَلَّمَ القُرْآنَ وَعَلَّمَهُ', 'Le meilleur de vous est celui qui apprend le Coran et l''enseigne.', 'Sahih Boukhari', 'Coran', 370),
  ('كُلُّ مَعْرُوفٍ صَدَقَةٌ', 'Toute bonne action est de la charité.', 'Sahih Boukhari', 'Générosité', 380),
  ('تَهَادَوْا تَحَابُّوا', 'Récompensez-vous les uns les autres par des cadeaux, vous vous aimerez.', 'Boukhari al-Adab', 'Générosité', 390),
  (null, 'Invoque Allah avec la certitude d''être exaucé.', 'Tirmidhi', 'Dou''a', 400)
) as v(texte_arabe, texte, source, theme, position)
where not exists (select 1 from public.hadiths_du_jour);
