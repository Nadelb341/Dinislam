-- 🤲 « Besoin d'Allah » dans la carte 99 noms d'Allah (Nadia, 27/11, choix K-L-M) — ADDITIF uniquement.
-- Une grille d'émotions (tristesse, culpabilité…) ; chaque émotion a ses noms d'Allah à invoquer, un conseil,
-- et un verset du Coran ou un hadith d'Al-Boukhârî pour finir (référence exacte). Modifiable par l'enseignante (✏️),
-- suppression → corbeille (côté appli). Les élèves lisent seulement. Copie de secours hors ligne : src/data/besoinsAllah.ts
-- (même contenu : les changer ENSEMBLE, un test le vérifie).
-- 🕌 Contenu relu (règle n°1) : versets vérifiés sur api.alquran.cloud, hadiths sur Sahîh al-Boukhârî.
-- « a_verifier » = doute signalé à Nadia (affiché seulement à l'enseignante).

create table if not exists public.besoins_allah (
  id uuid primary key default gen_random_uuid(),
  cle text not null unique,
  emoji text not null default '🤲',
  titre text not null,
  couleur text not null default '#d97706',
  accroche text not null default '',
  accroche_doree text not null default 'Lis ces noms jusqu''au bout.',
  conseil text,
  fin_arabe text,
  fin_phonetique text,
  fin_traduction text,
  fin_source text,
  a_verifier boolean not null default false,
  note text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.besoins_allah_noms (
  id uuid primary key default gen_random_uuid(),
  besoin_id uuid not null references public.besoins_allah(id) on delete cascade,
  -- lien vers la fiche du nom dans les 99 noms (null = nom attesté mais absent de la liste de l'appli, ex. Al-Qarîb)
  nom_id int references public.allah_names(id) on delete set null,
  arabe text not null,
  phonetique text not null,
  sens text not null,
  attestation text,
  a_verifier boolean not null default false,
  note text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists besoins_allah_position_idx on public.besoins_allah (position);
create index if not exists besoins_allah_noms_besoin_idx on public.besoins_allah_noms (besoin_id, position);

drop trigger if exists besoins_allah_updated_at on public.besoins_allah;
create trigger besoins_allah_updated_at before update on public.besoins_allah
  for each row execute function public.update_updated_at_column();
drop trigger if exists besoins_allah_noms_updated_at on public.besoins_allah_noms;
create trigger besoins_allah_noms_updated_at before update on public.besoins_allah_noms
  for each row execute function public.update_updated_at_column();

-- 🔐 Lecture pour tous les connectés, écriture seulement pour l'admin
alter table public.besoins_allah enable row level security;
alter table public.besoins_allah_noms enable row level security;
drop policy if exists "besoins_allah_lecture" on public.besoins_allah;
create policy "besoins_allah_lecture" on public.besoins_allah for select to authenticated using (true);
drop policy if exists "besoins_allah_admin" on public.besoins_allah;
create policy "besoins_allah_admin" on public.besoins_allah for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));
drop policy if exists "besoins_allah_noms_lecture" on public.besoins_allah_noms;
create policy "besoins_allah_noms_lecture" on public.besoins_allah_noms for select to authenticated using (true);
drop policy if exists "besoins_allah_noms_admin" on public.besoins_allah_noms;
create policy "besoins_allah_noms_admin" on public.besoins_allah_noms for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ⚡ En direct : un changement de l'enseignante arrive tout de suite chez tout le monde
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'besoins_allah') then
    alter publication supabase_realtime add table public.besoins_allah;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'besoins_allah_noms') then
    alter publication supabase_realtime add table public.besoins_allah_noms;
  end if;
end $$;

-- 📜 Les 12 émotions de départ — seulement si la table est vide (relancer ce fichier ne crée jamais de doublon)
insert into public.besoins_allah (cle, emoji, titre, couleur, accroche, accroche_doree, conseil,
  fin_arabe, fin_phonetique, fin_traduction, fin_source, a_verifier, note, position)
select * from (values
  ('tristesse', '😢', 'Tristesse', '#3b82f6', 'Ton cœur est triste ?', 'Lis ces noms jusqu''au bout.', 'Lève les mains et appelle Allah par ces noms : « Yâ Latîf, Yâ Wadoûd… ». Dis-Lui ce qui te rend triste, avec tes mots à toi. Il est tout proche et Il répond.',
   'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', 'Alâ bi-dhikri-llâhi tatma''innou-l-qouloûb', 'C''est par le rappel d''Allah que les cœurs s''apaisent.', 'Coran 13:28', false, null, 10),
  ('culpabilite', '💔', 'Culpabilité', '#e11d48', 'Tes erreurs te pèsent ?', 'Lis ces noms jusqu''au bout.', 'Regrette sincèrement, demande pardon et décide de ne pas recommencer. Puis invoque : « Yâ Tawwâb, Yâ Ghafoûr, pardonne-moi ». Aucune faute n''est plus grande que la miséricorde d''Allah.',
   'لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا', 'Lâ taqnatoû min rahmati-llâh, inna-llâha yaghfirou-dh-dhounoûba jamî''â', 'Ne désespérez pas de la miséricorde d''Allah : Allah pardonne tous les péchés.', 'Coran 39:53', false, null, 20),
  ('inquietude', '😟', 'Inquiétude', '#f97316', 'Ton cœur s''inquiète ?', 'Lis ces noms jusqu''au bout.', 'Fais ce que tu peux, puis confie le reste à Allah. Dis : « Hasbounâ-llâhou wa ni''ma-l-wakîl » (Allah nous suffit, c''est le meilleur garant ; Coran 3:173), puis appelle-Le par ces noms.',
   'وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', 'Wa man yatawakkal ''ala-llâhi fa-houwa hasbouh', 'Celui qui place sa confiance en Allah, Allah lui suffit.', 'Coran 65:3', false, null, 30),
  ('peur', '😨', 'Peur', '#7c3aed', 'Tu as peur ?', 'Lis ces noms jusqu''au bout.', 'Allah entend et voit tout. Dis : « Yâ Hafîz, protège-moi », et souviens-toi qu''Il est avec toi.',
   'لَا تَخَافَا ۖ إِنَّنِي مَعَكُمَا أَسْمَعُ وَأَرَىٰ', 'Lâ takhâfâ, innanî ma''akoumâ asma''ou wa arâ', 'N''ayez pas peur : Je suis avec vous, J''entends et Je vois. (Allah à Moussa et Haroun)', 'Coran 20:46', false, null, 40),
  ('colere', '😠', 'Colère', '#dc2626', 'La colère monte en toi ?', 'Lis ces noms jusqu''au bout.', 'Dis tout de suite : « A''oûdhou bi-llâhi mina-ch-chaytâni-r-rajîm » : le Prophète ﷺ a dit que cette parole fait partir la colère (Al-Boukhârî 6115). Puis demande à Allah de te donner la douceur.',
   'وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ ۗ وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ', 'Wa-l-kâzimîna-l-ghayza wa-l-''âfîna ''ani-n-nâs, wa-llâhou youhibbou-l-mouhsinîn', '… ceux qui retiennent leur colère et pardonnent aux gens. Et Allah aime ceux qui font le bien.', 'Coran 3:134', false, null, 50),
  ('solitude', '🫥', 'Solitude', '#0d9488', 'Tu te sens seul(e) ?', 'Lis ces noms jusqu''au bout.', 'Allah est plus proche de toi que tout. Parle-Lui comme à Quelqu''un qui t''écoute : « Yâ Qarîb, Yâ Moujîb ». Tu n''as besoin de personne entre toi et Lui.',
   'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ', 'Wa idhâ sa''alaka ''ibâdî ''annî fa-innî qarîb, oujîbou da''wata-d-dâ''i idhâ da''ân', 'Quand Mes serviteurs t''interrogent sur Moi : Je suis tout proche, Je réponds à l''appel de celui qui M''invoque.', 'Coran 2:186', false, null, 60),
  ('maladie', '🤒', 'Maladie', '#059669', 'Tu es malade ou tu as mal ?', 'Lis ces noms jusqu''au bout.', 'Le Prophète ﷺ disait près d''un malade : « Adh-hibi-l-ba''s, rabba-n-nâs, ichfi wa anta-ch-Châfî, lâ chifâ''a illâ chifâ''ouk, chifâ''an lâ youghâdirou saqamâ » (Enlève le mal, Seigneur des gens ; guéris, c''est Toi qui guéris ; il n''y a de guérison que la Tienne, une guérison qui ne laisse aucune maladie). Al-Boukhârî 5675.',
   'وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ', 'Wa idhâ maridtou fa-houwa yachfîn', 'Et quand je suis malade, c''est Lui qui me guérit. (paroles d''Ibrâhîm)', 'Coran 26:80', false, null, 70),
  ('injustice', '⚖️', 'Injustice', '#4f46e5', 'On a été injuste avec toi ?', 'Lis ces noms jusqu''au bout.', 'Ne réponds pas au mal par le mal. Confie ton affaire à Allah : rien ne Lui échappe. L''invocation de celui qui subit une injustice monte vers Lui sans aucun voile.',
   'وَاتَّقِ دَعْوَةَ الْمَظْلُومِ، فَإِنَّهُ لَيْسَ بَيْنَهُ وَبَيْنَ اللَّهِ حِجَابٌ', 'Wattaqi da''wata-l-mazloûm, fa-innahoû laysa baynahoû wa bayna-llâhi hijâb', 'Méfie-toi de l''invocation de celui qui subit une injustice : entre elle et Allah, il n''y a aucun voile.', 'Al-Boukhârî 1496', false, null, 80),
  ('rizq', '💸', 'Inquiétude pour le rizq', '#ca8a04', 'Tu t''inquiètes pour ton rizq ?', 'Lis ces noms jusqu''au bout.', 'Le rizq, c''est tout ce qu''Allah te donne : nourriture, argent, santé, amis, savoir… Il est déjà écrit. Fais des efforts, puis demande : « Yâ Razzâq, Yâ Fattâh, ouvre-moi les portes de Ta générosité ».',
   'وَفِي السَّمَاءِ رِزْقُكُمْ وَمَا تُوعَدُونَ', 'Wa fi-s-samâ''i rizqoukoum wa mâ tou''adoûn', 'Et dans le ciel est votre subsistance, ainsi que ce qui vous est promis.', 'Coran 51:22', false, null, 90),
  ('fatigue', '😮‍💨', 'Fatigue', '#0284c7', 'Tu es fatigué(e) ?', 'Lis ces noms jusqu''au bout.', 'Allah ne te demande jamais plus que ce que tu peux porter. Avant de dormir, dis 33 fois « Soubhâna-llâh », 33 fois « Al-hamdou li-llâh » et 34 fois « Allâhou akbar » : le Prophète ﷺ a dit à Fâtima et ''Alî que c''est mieux pour eux qu''un serviteur (Al-Boukhârî 5361).',
   'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', 'Lâ youkallifou-llâhou nafsan illâ wous''ahâ', 'Allah n''impose à personne plus que ce qu''il peut porter.', 'Coran 2:286', false, null, 100),
  ('guidance', '🧭', 'Besoin de guidance', '#c026d3', 'Tu ne sais pas quel chemin prendre ?', 'Lis ces noms jusqu''au bout.', 'Pour un choix important, fais la prière de consultation (istikhâra), que le Prophète ﷺ enseignait comme une sourate du Coran (Al-Boukhârî 1166). Et demande chaque jour, dans la Fâtiha : « Ihdinâ-s-sirâta-l-moustaqîm ».',
   'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'Ihdinâ-s-sirâta-l-moustaqîm', 'Guide-nous sur le droit chemin.', 'Coran 1:6', false, null, 110),
  ('gratitude', '😊', 'Gratitude', '#65a30d', 'Ton cœur est plein de reconnaissance ?', 'Lis ces noms jusqu''au bout.', 'Remercie Allah avec ta langue (« Al-hamdou li-llâh »), avec ton cœur, et en utilisant Ses bienfaits pour le bien. Plus tu remercies, plus Il donne.',
   'لَئِنْ شَكَرْتُمْ لَأَزِيدَنَّكُمْ', 'La-in chakartoum la-azîdannakoum', 'Si vous êtes reconnaissants, J''augmenterai Mes bienfaits pour vous.', 'Coran 14:7', false, null, 120)
) as v(cle, emoji, titre, couleur, accroche, accroche_doree, conseil, fin_arabe, fin_phonetique, fin_traduction, fin_source, a_verifier, note, position)
where not exists (select 1 from public.besoins_allah);

-- Les noms de chaque émotion (relié à la fiche du nom par sa transcription dans allah_names) — seulement s'il n'y en a aucun
insert into public.besoins_allah_noms (besoin_id, nom_id, arabe, phonetique, sens, attestation, a_verifier, note, position)
select b.id, (select a.id from public.allah_names a where a.transliteration = v.base order by a.display_order limit 1),
  v.arabe, v.phonetique, v.sens, v.attestation, v.a_verifier, v.note, v.position
from (values
  ('tristesse', 'Al-Latîf', 'اللَّطِيفُ', 'Al-Latîf', 'Le Très Doux, qui arrange tout avec finesse', 'Coran 12:100 et 42:19', false, null, 10),
  ('tristesse', 'Al-Wadûd', 'الوَدُودُ', 'Al-Wadoûd', 'Celui qui aime Ses serviteurs', 'Coran 11:90 et 85:14', false, null, 20),
  ('tristesse', 'Ar-Rahîm', 'الرَّحِيمُ', 'Ar-Rahîm', 'Le Très Miséricordieux', 'Coran 1:3 et 2:37', false, null, 30),
  ('tristesse', null, 'القَرِيبُ', 'Al-Qarîb', 'Le Tout Proche', 'Coran 2:186 et 11:61', false, null, 40),
  ('tristesse', 'Al-Mujîb', 'المُجِيبُ', 'Al-Moujîb', 'Celui qui répond aux invocations', 'Coran 11:61', false, null, 50),
  ('culpabilite', 'At-Tawwâb', 'التَّوَّابُ', 'At-Tawwâb', 'Celui qui accepte le repentir', 'Coran 2:37 et 49:12', false, null, 10),
  ('culpabilite', 'Al-Ghaffâr', 'الغَفَّارُ', 'Al-Ghaffâr', 'Celui qui pardonne encore et encore', 'Coran 20:82 et 71:10', false, null, 20),
  ('culpabilite', 'Al-Ghafûr', 'الغَفُورُ', 'Al-Ghafoûr', 'Le Pardonneur', 'Coran 39:53', false, null, 30),
  ('culpabilite', 'Al-''Afuww', 'العَفُوُّ', 'Al-''Afouww', 'Celui qui efface les fautes', 'Coran 4:43 et 4:149', false, null, 40),
  ('culpabilite', 'Ar-Ra''ûf', 'الرَّؤُوفُ', 'Ar-Raoûf', 'Le Très Bon, plein de tendresse', 'Coran 2:143 et 59:10', false, null, 50),
  ('culpabilite', 'Al-Halîm', 'الحَلِيمُ', 'Al-Halîm', 'Le Patient, qui ne se presse pas de punir', 'Coran 2:225', false, null, 60),
  ('culpabilite', 'Ar-Rahmân', 'الرَّحْمَنُ', 'Ar-Rahmân', 'Le Tout Miséricordieux', 'Coran 1:3 et 55:1', false, null, 70),
  ('inquietude', 'Al-Wakîl', 'الوَكِيلُ', 'Al-Wakîl', 'Celui à qui l''on confie tout', 'Coran 3:173 et 33:3', false, null, 10),
  ('inquietude', 'Al-Hafîz', 'الحَفِيظُ', 'Al-Hafîz', 'Le Gardien qui protège', 'Coran 11:57', false, null, 20),
  ('inquietude', 'Al-Latîf', 'اللَّطِيفُ', 'Al-Latîf', 'Le Très Doux, qui arrange tout avec finesse', 'Coran 12:100', false, null, 30),
  ('inquietude', 'As-Salâm', 'السَّلَامُ', 'As-Salâm', 'La Paix, source de toute paix', 'Coran 59:23', false, null, 40),
  ('inquietude', 'Al-Mu''min', 'المُؤْمِنُ', 'Al-Mou''min', 'Celui qui donne la sécurité', 'Coran 59:23', false, null, 50),
  ('inquietude', 'Al-''Alîm', 'العَلِيمُ', 'Al-''Alîm', 'Celui qui sait tout', 'Coran 2:32', false, null, 60),
  ('peur', 'Al-Hafîz', 'الحَفِيظُ', 'Al-Hafîz', 'Le Gardien qui protège', 'Coran 11:57', false, null, 10),
  ('peur', 'Al-Mu''min', 'المُؤْمِنُ', 'Al-Mou''min', 'Celui qui donne la sécurité', 'Coran 59:23', false, null, 20),
  ('peur', 'Al-Muhaimin', 'المُهَيْمِنُ', 'Al-Mouhaymin', 'Celui qui veille sur tout', 'Coran 59:23', false, null, 30),
  ('peur', 'Al-Walî', 'الوَلِيُّ', 'Al-Walî', 'Le Protecteur des croyants', 'Coran 2:257 et 4:45', false, null, 40),
  ('peur', 'Al-Qawî', 'القَوِيُّ', 'Al-Qawî', 'Le Très Fort', 'Coran 22:40 et 42:19', false, null, 50),
  ('peur', 'As-Samî''', 'السَّمِيعُ', 'As-Samî''', 'Celui qui entend tout', 'Coran 42:11', false, null, 60),
  ('peur', 'Al-Basîr', 'البَصِيرُ', 'Al-Basîr', 'Celui qui voit tout', 'Coran 42:11', false, null, 70),
  ('colere', 'Al-Halîm', 'الحَلِيمُ', 'Al-Halîm', 'Le Patient, qui ne se presse pas de punir', 'Coran 2:225 et 64:17', false, null, 10),
  ('colere', 'Al-''Afuww', 'العَفُوُّ', 'Al-''Afouww', 'Celui qui efface les fautes', 'Coran 4:149', false, null, 20),
  ('colere', 'Al-Ghafûr', 'الغَفُورُ', 'Al-Ghafoûr', 'Le Pardonneur', 'Coran 24:22', false, null, 30),
  ('colere', 'As-Salâm', 'السَّلَامُ', 'As-Salâm', 'La Paix, source de toute paix', 'Coran 59:23', false, null, 40),
  ('colere', 'Ar-Rahîm', 'الرَّحِيمُ', 'Ar-Rahîm', 'Le Très Miséricordieux', 'Coran 24:22', false, null, 50),
  ('solitude', null, 'القَرِيبُ', 'Al-Qarîb', 'Le Tout Proche', 'Coran 2:186 et 11:61', false, null, 10),
  ('solitude', 'Al-Mujîb', 'المُجِيبُ', 'Al-Moujîb', 'Celui qui répond aux invocations', 'Coran 11:61', false, null, 20),
  ('solitude', 'Al-Wadûd', 'الوَدُودُ', 'Al-Wadoûd', 'Celui qui aime Ses serviteurs', 'Coran 85:14', false, null, 30),
  ('solitude', 'Al-Walî', 'الوَلِيُّ', 'Al-Walî', 'Le Protecteur des croyants', 'Coran 2:257', false, null, 40),
  ('solitude', 'As-Samî''', 'السَّمِيعُ', 'As-Samî''', 'Celui qui entend tout', 'Coran 2:127', false, null, 50),
  ('maladie', null, 'الشَّافِي', 'Ach-Châfî', 'Celui qui guérit', 'Al-Boukhârî 5675 et 5743', false, null, 10),
  ('maladie', 'Ar-Rahîm', 'الرَّحِيمُ', 'Ar-Rahîm', 'Le Très Miséricordieux', 'Coran 1:3 (et l''invocation d''Ayyoûb, 21:83)', false, null, 20),
  ('maladie', 'Al-Mujîb', 'المُجِيبُ', 'Al-Moujîb', 'Celui qui répond aux invocations', 'Coran 11:61 (et 21:84)', false, null, 30),
  ('maladie', 'Al-Latîf', 'اللَّطِيفُ', 'Al-Latîf', 'Le Très Doux, qui arrange tout avec finesse', 'Coran 42:19', false, null, 40),
  ('maladie', 'Al-Qawî', 'القَوِيُّ', 'Al-Qawî', 'Le Très Fort', 'Coran 42:19', false, null, 50),
  ('injustice', 'Al-Haqq', 'الحَقُّ', 'Al-Haqq', 'La Vérité', 'Coran 24:25', false, null, 10),
  ('injustice', 'Ash-Shahîd', 'الشَّهِيدُ', 'Ach-Chahîd', 'Le Témoin de toute chose', 'Coran 22:17', false, null, 20),
  ('injustice', 'Al-Hasîb', 'الحَسِيبُ', 'Al-Hasîb', 'Celui qui fait les comptes, et qui suffit', 'Coran 4:6', false, null, 30),
  ('injustice', 'Al-Basîr', 'البَصِيرُ', 'Al-Basîr', 'Celui qui voit tout', 'Coran 42:11', false, null, 40),
  ('injustice', 'Al-Wakîl', 'الوَكِيلُ', 'Al-Wakîl', 'Celui à qui l''on confie tout', 'Coran 33:3', false, null, 50),
  ('injustice', 'Al-''Azîz', 'العَزِيزُ', 'Al-''Azîz', 'Le Tout-Puissant, que rien ne vainc', 'Coran 22:40 et 59:23', false, null, 60),
  ('rizq', 'Ar-Razzâq', 'الرَّزَّاقُ', 'Ar-Razzâq', 'Celui qui donne la subsistance', 'Coran 51:58', false, null, 10),
  ('rizq', 'Al-Fattâh', 'الفَتَّاحُ', 'Al-Fattâh', 'Celui qui ouvre toutes les portes', 'Coran 34:26', false, null, 20),
  ('rizq', 'Al-Wahhâb', 'الوَهَّابُ', 'Al-Wahhâb', 'Celui qui donne sans compter', 'Coran 3:8', false, null, 30),
  ('rizq', 'Al-Karîm', 'الكَرِيمُ', 'Al-Karîm', 'Le Très Généreux', 'Coran 27:40 et 82:6', false, null, 40),
  ('rizq', 'Al-Ghanî', 'الغَنِيُّ', 'Al-Ghanî', 'Le Riche, qui n''a besoin de rien', 'Coran 35:15', false, null, 50),
  ('rizq', 'Al-Mujîb', 'المُجِيبُ', 'Al-Moujîb', 'Celui qui répond aux invocations', 'Coran 11:61', false, null, 60),
  ('rizq', 'Al-Wakîl', 'الوَكِيلُ', 'Al-Wakîl', 'Celui à qui l''on confie tout', 'Coran 33:3', false, null, 70),
  ('fatigue', 'Al-Qawî', 'القَوِيُّ', 'Al-Qawî', 'Le Très Fort', 'Coran 42:19', false, null, 10),
  ('fatigue', 'Al-Matîn', 'المَتِينُ', 'Al-Matîn', 'L''Inébranlable, dont la force ne faiblit jamais', 'Coran 51:58', false, null, 20),
  ('fatigue', 'Al-Hayy', 'الحَيُّ', 'Al-Hayy', 'Le Vivant', 'Coran 2:255', false, null, 30),
  ('fatigue', 'Al-Qayyûm', 'القَيُّومُ', 'Al-Qayyoûm', 'Celui qui fait tenir toute chose, sans jamais Se fatiguer', 'Coran 2:255', false, null, 40),
  ('fatigue', 'Al-Latîf', 'اللَّطِيفُ', 'Al-Latîf', 'Le Très Doux, qui arrange tout avec finesse', 'Coran 42:19', false, null, 50),
  ('fatigue', 'Ar-Ra''ûf', 'الرَّؤُوفُ', 'Ar-Raoûf', 'Le Très Bon, plein de tendresse', 'Coran 2:143', false, null, 60),
  ('guidance', 'Al-Hâdî', 'الهَادِي', 'Al-Hâdî', 'Celui qui guide', 'Coran 22:54 et 25:31', true, 'Dans le Coran, le mot est employé pour Allah (« Allah guide ceux qui croient », 22:54 ; « Ton Seigneur suffit comme guide », 25:31). La plupart des savants le comptent parmi Ses noms : à confirmer par Nadia.', 10),
  ('guidance', 'An-Nûr', 'النُّورُ', 'An-Noûr', 'La Lumière', 'Coran 24:35', true, 'Coran 24:35 : « Allah est la Lumière des cieux et de la terre ». Certains savants le comptent parmi Ses noms, d''autres y voient une description : à confirmer par Nadia.', 20),
  ('guidance', 'Al-''Alîm', 'العَلِيمُ', 'Al-''Alîm', 'Celui qui sait tout', 'Coran 2:32', false, null, 30),
  ('guidance', 'Al-Hakîm', 'الحَكِيمُ', 'Al-Hakîm', 'Le Sage', 'Coran 2:32', false, null, 40),
  ('guidance', 'Al-Khabîr', 'الخَبِيرُ', 'Al-Khabîr', 'Celui qui connaît le fond des choses', 'Coran 6:18 et 67:14', false, null, 50),
  ('guidance', 'Al-Fattâh', 'الفَتَّاحُ', 'Al-Fattâh', 'Celui qui ouvre toutes les portes', 'Coran 34:26', false, null, 60),
  ('gratitude', 'Ash-Shakûr', 'الشَّكُورُ', 'Ach-Chakoûr', 'Celui qui récompense largement le moindre bien', 'Coran 35:34 et 64:17', false, null, 10),
  ('gratitude', 'Al-Hamîd', 'الحَمِيدُ', 'Al-Hamîd', 'Celui qui mérite toutes les louanges', 'Coran 31:12 et 35:15', false, null, 20),
  ('gratitude', 'Al-Wahhâb', 'الوَهَّابُ', 'Al-Wahhâb', 'Celui qui donne sans compter', 'Coran 3:8', false, null, 30),
  ('gratitude', 'Al-Karîm', 'الكَرِيمُ', 'Al-Karîm', 'Le Très Généreux', 'Coran 82:6', false, null, 40),
  ('gratitude', 'Al-Barr', 'البَرُّ', 'Al-Barr', 'Le Bienfaisant', 'Coran 52:28', false, null, 50),
  ('gratitude', 'Ar-Razzâq', 'الرَّزَّاقُ', 'Ar-Razzâq', 'Celui qui donne la subsistance', 'Coran 51:58', false, null, 60)
) as v(cle, base, arabe, phonetique, sens, attestation, a_verifier, note, position)
join public.besoins_allah b on b.cle = v.cle
where not exists (select 1 from public.besoins_allah_noms);
