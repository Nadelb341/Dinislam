-- 🧸 Accueil du Groupe 0 (Nadia, 2026-11-22 : les 15 idées gardées). Tout le contenu des petits est en base, modifiable
-- avec le ✏️ (titre, arabe, petite phrase, emoji, image, son de sa voix, zones de contenu) ; supprimer = corbeille.
-- Rubriques : phrases (phrase du jour), prieres5 (soleil et 5 prières), douas, coran, histoires, cree (Allah a créé),
-- piliers, ablutions, priere (ma prière en images), manieres (bonnes manières), ramadan (une case par jour), aid.
-- Le texte des 4 sourates vient de la même source que l'appli (api.alquran.cloud, édition quran-uthmani), copié en base pour le hors-ligne.
create table if not exists public.petits_fiches (
  id uuid primary key default gen_random_uuid(),
  rubrique text not null,
  titre text not null,
  arabe text,
  texte text,
  emoji text,
  image_url text,
  audio_url text,
  versets text[],
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists petits_fiches_rubrique on public.petits_fiches (rubrique, position);
alter table public.petits_fiches enable row level security;
drop policy if exists "petits_fiches_lecture" on public.petits_fiches;
create policy "petits_fiches_lecture" on public.petits_fiches for select to authenticated using (true);
drop policy if exists "petits_fiches_admin" on public.petits_fiches;
create policy "petits_fiches_admin" on public.petits_fiches for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ⭐ Mes étoiles : une étoile par dou'a dite, bonne action faite, case du Ramadan ouverte, jeu d'étapes réussi (une fois par jour)
create table if not exists public.petits_etoiles (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source text not null,
  ref text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, source, ref)
);
alter table public.petits_etoiles enable row level security;
drop policy if exists "petits_etoiles_lecture" on public.petits_etoiles;
create policy "petits_etoiles_lecture" on public.petits_etoiles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));
drop policy if exists "petits_etoiles_ajout" on public.petits_etoiles;
create policy "petits_etoiles_ajout" on public.petits_etoiles for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "petits_etoiles_maj" on public.petits_etoiles;
create policy "petits_etoiles_maj" on public.petits_etoiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'petits_fiches') then
    alter publication supabase_realtime add table public.petits_fiches;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'petits_etoiles') then
    alter publication supabase_realtime add table public.petits_etoiles;
  end if;
end $$;

-- Réglages : le mot pour les parents (vide au départ) et le 1er jour du Ramadan (modifiable dans le calendrier)
insert into public.reglages_appli (cle, valeur) values ('mot_parents_g0', '""'::jsonb), ('ramadan_debut', '"2027-02-08"'::jsonb)
on conflict (cle) do nothing;

-- Contenu de départ (seulement si la rubrique est encore vide)

insert into public.petits_fiches (rubrique, titre, arabe, texte, emoji, versets, position)
select v.* from (values
  ('phrases', 'Bismillah', 'بِسْمِ اللَّهِ', '« Au nom d''Allah » : on le dit avant de commencer quelque chose.', '🌟', null, 10),
  ('phrases', 'Alhamdoulillah', 'الْحَمْدُ لِلَّهِ', '« Merci Allah » : on le dit quand on est content.', '💚', null, 20),
  ('phrases', 'SoubhanAllah', 'سُبْحَانَ اللَّهِ', '« Gloire à Allah » : on le dit quand on voit une belle chose.', '🌸', null, 30),
  ('phrases', 'Allahou Akbar', 'اللَّهُ أَكْبَرُ', '« Allah est le plus grand ».', '🕌', null, 40),
  ('phrases', 'Salam aleykoum', 'السَّلَامُ عَلَيْكُمْ', '« La paix sur vous » : on le dit pour dire bonjour.', '👋', null, 50),
  ('phrases', 'InchaAllah', 'إِنْ شَاءَ اللَّهُ', '« Si Allah le veut » : on le dit pour demain.', '🤲', null, 60),
  ('phrases', 'MachaAllah', 'مَا شَاءَ اللَّهُ', '« C''est ce qu''Allah a voulu » : on le dit quand c''est beau.', '✨', null, 70),
  ('phrases', 'JazakAllahou khayran', 'جَزَاكَ اللَّهُ خَيْرًا', '« Qu''Allah te récompense » : on le dit pour dire merci.', '🙏', null, 80),
  ('phrases', 'Astaghfiroullah', 'أَسْتَغْفِرُ اللَّهَ', '« Pardon Allah » : on le dit quand on a fait une bêtise.', '💧', null, 90),
  ('phrases', 'La ilaha illa Allah', 'لَا إِلَٰهَ إِلَّا اللَّهُ', '« Il n''y a de dieu qu''Allah ».', '☝️', null, 100),
  ('prieres5', 'Fajr', 'الفَجْر', 'La prière de l''aube, quand le soleil se lève.', '🌅', null, 10),
  ('prieres5', 'Dohr', 'الظُّهْر', 'La prière de midi, quand le soleil est tout en haut.', '☀️', null, 20),
  ('prieres5', 'Asr', 'العَصْر', 'La prière de l''après-midi.', '🍃', null, 30),
  ('prieres5', 'Maghrib', 'المَغْرِب', 'La prière du soir, quand le soleil se couche.', '🌇', null, 40),
  ('prieres5', 'Icha', 'العِشَاء', 'La prière de la nuit, quand il fait noir.', '🌙', null, 50),
  ('douas', 'Avant de manger', 'بِسْمِ اللَّهِ', '« Au nom d''Allah. »', '🍽️', null, 10),
  ('douas', 'Après avoir mangé', 'الْحَمْدُ لِلَّهِ', '« Merci Allah. »', '😋', null, 20),
  ('douas', 'Quand je me réveille', 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', '« Merci Allah, qui nous a réveillés après nous avoir endormis, et c''est vers Lui le retour. »', '🌞', null, 30),
  ('douas', 'Avant de dormir', 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', '« En Ton nom, ô Allah, je m''endors et je me réveille. »', '🛏️', null, 40),
  ('douas', 'En sortant de la maison', 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ', '« Au nom d''Allah, je compte sur Allah. »', '🚪', null, 50),
  ('douas', 'Quand j''éternue', 'الْحَمْدُ لِلَّهِ', 'Je dis : « Alhamdoulillah ». On me répond : « Yarhamouka Allah » (qu''Allah te fasse miséricorde).', '🤧', null, 60),
  ('coran', 'Al-Fatiha', 'سُورَةُ ٱلْفَاتِحَةِ', 'Écoute, puis répète. Touche chaque mot quand tu le dis : il s''allume !', '📖', array['بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ','ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ','ٱلرَّحْمَٰنِ ٱلرَّحِيمِ','مَٰلِكِ يَوْمِ ٱلدِّينِ','إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ','ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ','صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ']::text[], 10),
  ('coran', 'Al-Ikhlas', 'سُورَةُ الإِخۡلَاصِ', 'Écoute, puis répète. Touche chaque mot quand tu le dis : il s''allume !', '💛', array['قُلْ هُوَ ٱللَّهُ أَحَدٌ','ٱللَّهُ ٱلصَّمَدُ','لَمْ يَلِدْ وَلَمْ يُولَدْ','وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ']::text[], 20),
  ('coran', 'Al-Falaq', 'سُورَةُ الفَلَقِ', 'Écoute, puis répète. Touche chaque mot quand tu le dis : il s''allume !', '🌅', array['قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ','مِن شَرِّ مَا خَلَقَ','وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ','وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ','وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ']::text[], 30),
  ('coran', 'An-Nas', 'سُورَةُ النَّاسِ', 'Écoute, puis répète. Touche chaque mot quand tu le dis : il s''allume !', '👨‍👩‍👧', array['قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ','مَلِكِ ٱلنَّاسِ','إِلَٰهِ ٱلنَّاسِ','مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ','ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ','مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ']::text[], 40),
  ('histoires', 'Nouh et l''arche', 'نُوح', 'Il y a très longtemps, le prophète Nouh (que la paix soit sur lui) demandait aux gens d''adorer Allah seul. Il leur a parlé avec douceur pendant très, très longtemps, mais presque personne ne l''écoutait.
Allah lui a demandé de construire un grand bateau : l''arche. Les gens se moquaient de lui, mais Nouh continuait, avec patience.
Puis la pluie est tombée, et l''eau est montée partout. Nouh, les croyants et des animaux, un couple de chaque sorte, étaient à l''abri dans l''arche.
Quand l''eau est redescendue, l''arche s''est posée sur une montagne.
Retiens : on obéit à Allah, et on reste patient, même quand c''est long.', '🚢', null, 10),
  ('histoires', 'Younous et la baleine', 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', 'Le prophète Younous (que la paix soit sur lui) est parti, fâché, loin de son peuple qui ne l''écoutait pas. Il est monté sur un bateau.
Une grande tempête est arrivée, et Younous est tombé dans la mer. Une énorme baleine l''a avalé, sans lui faire de mal.
Dans le ventre de la baleine, dans le noir, Younous a demandé pardon à Allah avec cette dou''a (écrite en arabe en haut).
Allah l''a entendu : la baleine l''a déposé sur une plage, et une plante a poussé pour le protéger.
Retiens : quand on fait une erreur, on demande pardon à Allah. Il nous entend toujours.', '🐋', null, 20),
  ('histoires', 'Ibrahim et le feu', 'يَا نَارُ كُونِي بَرْدًا وَسَلَامًا عَلَىٰ إِبْرَاهِيمَ', 'Le prophète Ibrahim (que la paix soit sur lui) regardait le ciel : les étoiles, la lune, le soleil… « Tout ça disparaît, se disait-il. C''est Allah qui a tout créé, c''est Lui qu''on adore. »
Son peuple adorait des statues qui ne parlent pas et n''entendent pas. Ibrahim les a invités à réfléchir.
Fâchés, ils l''ont jeté dans un grand feu. Mais Allah a dit au feu : « Ô feu, sois fraîcheur et paix pour Ibrahim ! » (écrit en arabe en haut).
Et Ibrahim est sorti du feu sans une seule brûlure !
Retiens : Allah protège ceux qui ont confiance en Lui.', '🔥', null, 30),
  ('histoires', 'Moussa et la mer', 'مُوسَى', 'Quand le prophète Moussa (que la paix soit sur lui) était un bébé, sa maman, inspirée par Allah, l''a posé dans un panier sur le fleuve, pour le protéger.
Le panier est arrivé au palais de Pharaon. La femme de Pharaon a aimé ce bébé et l''a gardé. Et Allah a ramené Moussa près de sa maman, pour qu''elle le nourrisse.
Plus tard, Allah a choisi Moussa comme prophète. Pharaon était méchant avec le peuple de Moussa. Moussa est parti avec eux, et ils sont arrivés devant la mer… Pharaon et son armée les suivaient !
Allah a dit à Moussa de frapper la mer avec son bâton : la mer s''est ouverte en deux, et ils ont traversé à pied sec.
Retiens : Allah trouve toujours une solution pour ceux qui ont confiance en Lui.', '🌊', null, 40),
  ('cree', 'Le soleil', 'الشَّمْس', 'Le soleil nous chauffe et nous éclaire. SoubhanAllah !', '☀️', null, 10),
  ('cree', 'La lune', 'القَمَر', 'La lune brille dans la nuit. SoubhanAllah !', '🌙', null, 20),
  ('cree', 'Les étoiles', 'النُّجُوم', 'Des milliers d''étoiles dans le ciel. SoubhanAllah !', '✨', null, 30),
  ('cree', 'La mer', 'البَحْر', 'La mer, ses vagues et ses poissons. SoubhanAllah !', '🌊', null, 40),
  ('cree', 'La pluie', 'المَطَر', 'La pluie fait pousser les plantes. SoubhanAllah !', '🌧️', null, 50),
  ('cree', 'Les arbres', 'الشَّجَر', 'Les arbres nous donnent des fruits et de l''ombre. SoubhanAllah !', '🌳', null, 60),
  ('cree', 'Les fleurs', 'الزُّهُور', 'Les fleurs, de toutes les couleurs. SoubhanAllah !', '🌸', null, 70),
  ('cree', 'Les animaux', 'الحَيَوَانَات', 'Le chameau, le chat, l''oiseau, l''abeille… SoubhanAllah !', '🐪', null, 80),
  ('cree', 'Les montagnes', 'الجِبَال', 'Les montagnes, si hautes. SoubhanAllah !', '⛰️', null, 90),
  ('cree', 'Et toi !', 'أَنْتَ', 'Allah t''a créé, toi aussi : tes yeux, tes mains, ton sourire. SoubhanAllah !', '👶', null, 100),
  ('piliers', 'La chahada', 'الشَّهَادَة', 'Dire : « Il n''y a de dieu qu''Allah, et Mouhammad est Son messager. »', '☝️', null, 10),
  ('piliers', 'La prière', 'الصَّلَاة', 'Prier Allah 5 fois par jour.', '🕌', null, 20),
  ('piliers', 'L''aumône', 'الزَّكَاة', 'Donner aux pauvres une part de ce qu''on a.', '💝', null, 30),
  ('piliers', 'Le jeûne', 'الصَّوْم', 'Jeûner pendant le mois de Ramadan.', '🌙', null, 40),
  ('piliers', 'Le pèlerinage', 'الحَجّ', 'Aller à La Mecque, une fois dans sa vie, si on peut.', '🕋', null, 50),
  ('ablutions', 'Je dis Bismillah', 'بِسْمِ اللَّهِ', 'Avant de commencer, je dis « Bismillah ».', '🤲', null, 10),
  ('ablutions', 'Les mains', null, 'Je lave mes mains, 3 fois.', '🧼', null, 20),
  ('ablutions', 'La bouche', null, 'Je rince ma bouche, 3 fois.', '👄', null, 30),
  ('ablutions', 'Le nez', null, 'Je rince mon nez, 3 fois.', '👃', null, 40),
  ('ablutions', 'Le visage', null, 'Je lave mon visage, 3 fois.', '😊', null, 50),
  ('ablutions', 'Les bras', null, 'Je lave mes bras jusqu''aux coudes : le droit, puis le gauche, 3 fois.', '💪', null, 60),
  ('ablutions', 'La tête', null, 'Je passe mes mains mouillées sur ma tête.', '💆', null, 70),
  ('ablutions', 'Les oreilles', null, 'J''essuie mes oreilles.', '👂', null, 80),
  ('ablutions', 'Les pieds', null, 'Je lave mes pieds jusqu''aux chevilles : le droit, puis le gauche, 3 fois.', '🦶', null, 90),
  ('priere', 'Debout', null, 'Je me tiens debout, tourné vers la Qibla.', '🧍', null, 10),
  ('priere', 'Allahou Akbar', 'اللَّهُ أَكْبَرُ', 'Je lève les mains et je dis « Allahou Akbar ».', '🙌', null, 20),
  ('priere', 'Al-Fatiha', 'الفَاتِحَة', 'Je récite la sourate Al-Fatiha.', '📖', null, 30),
  ('priere', 'Le roukou''', 'الرُّكُوع', 'Je m''incline, les mains sur les genoux.', '🙇', null, 40),
  ('priere', 'Je me relève', null, 'Je me relève, bien droit.', '🧍', null, 50),
  ('priere', 'Le soujoud', 'السُّجُود', 'Je me prosterne : le front et le nez sur le sol.', '🛐', null, 60),
  ('priere', 'Assis', null, 'Je m''assois, puis je me prosterne encore une fois.', '🧎', null, 70),
  ('priere', 'Le salam', 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ', 'À la fin, je tourne la tête à droite, puis à gauche.', '👋', null, 80),
  ('manieres', 'Je dis Salam', 'السَّلَامُ عَلَيْكُمْ', 'Je dis « Salam aleykoum » quand j''arrive.', '👋', null, 10),
  ('manieres', 'Je dis merci', 'جَزَاكَ اللَّهُ خَيْرًا', 'Je dis « JazakAllahou khayran » pour dire merci.', '🙏', null, 20),
  ('manieres', 'La main droite', null, 'Je mange et je bois avec la main droite.', '✋', null, 30),
  ('manieres', 'Je partage', null, 'Je partage mes jouets et mon goûter.', '🍪', null, 40),
  ('manieres', 'J''aide mes parents', null, 'J''aide papa et maman à la maison.', '🧺', null, 50),
  ('manieres', 'Je souris', null, 'Le sourire est une aumône : je souris aux autres.', '😊', null, 60),
  ('manieres', 'Je parle doucement', null, 'Je parle doucement, sans crier.', '🤫', null, 70),
  ('ramadan', 'Je dis Bismillah avant de manger', null, 'Aujourd''hui : je dis Bismillah avant de manger !', '🍽️', null, 10),
  ('ramadan', 'J''aide à mettre la table du ftour', null, 'Aujourd''hui : j''aide à mettre la table du ftour !', '🥣', null, 20),
  ('ramadan', 'Je donne une datte à quelqu''un', null, 'Aujourd''hui : je donne une datte à quelqu''un !', '🌴', null, 30),
  ('ramadan', 'Je fais un dessin pour un ami', null, 'Aujourd''hui : je fais un dessin pour un ami !', '🎨', null, 40),
  ('ramadan', 'Je dis merci à maman et papa', null, 'Aujourd''hui : je dis merci à maman et papa !', '💐', null, 50),
  ('ramadan', 'Je range mes jouets', null, 'Aujourd''hui : je range mes jouets !', '🧸', null, 60),
  ('ramadan', 'J''écoute une sourate', null, 'Aujourd''hui : j''écoute une sourate !', '📖', null, 70),
  ('ramadan', 'Je fais une dou''a pour ma famille', null, 'Aujourd''hui : je fais une dou''a pour ma famille !', '🤲', null, 80),
  ('ramadan', 'Je donne un jouet ou un habit', null, 'Aujourd''hui : je donne un jouet ou un habit !', '🎁', null, 90),
  ('ramadan', 'Je souris à tout le monde', null, 'Aujourd''hui : je souris à tout le monde !', '😊', null, 100),
  ('aid', 'L''Aïd, c''est la fête !', 'عِيد مُبَارَك', 'On met de beaux habits, on va prier, on dit « Aïd moubarak » et on partage avec tout le monde.', '🎉', null, 10)
) as v(rubrique, titre, arabe, texte, emoji, versets, position)
where not exists (select 1 from public.petits_fiches f where f.rubrique = v.rubrique);
