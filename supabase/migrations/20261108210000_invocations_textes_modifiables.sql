-- 2026-11-08 — Textes des invocations modifiables / supprimables par l'enseignante (choix de Nadia : « les 2 textes,
-- avec le choix de les modifier ou supprimer »). Champ vide (null) = texte par défaut de l'appli (invocationsData.ts).
alter table public.invocations add column if not exists content_prononciation text;
alter table public.invocations add column if not exists content_source text;
alter table public.invocations add column if not exists texte_principal_masque boolean not null default false;
alter table public.invocations add column if not exists autre_arabe text;
alter table public.invocations add column if not exists autre_prononciation text;
alter table public.invocations add column if not exists autre_traduction text;
alter table public.invocations add column if not exists autre_source text;

-- Champs vides enregistrés par l'ancien formulaire (cartes 11 et 12) = « rien de saisi » → texte par défaut
update public.invocations set content_arabic = null where id in (11, 12) and content_arabic = '';
update public.invocations set content_french = null where id in (11, 12) and content_french = '';

-- Avant de manger (id 5) : en premier ce que dit la vidéo Telegram, puis l'autre invocation (Bismillâh)
update public.invocations set
  content_arabic = 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا، وَقِنَا عَذَابَ النَّارِ، بِسْمِ اللهِ',
  content_prononciation = 'Allâhumma bârik lanâ fîmâ razaqtanâ, wa qinâ ''adhâba n-nâr, bismi Llâh.',
  content_french = 'Ô Allah, bénis pour nous ce que Tu nous as accordé et préserve-nous du châtiment du Feu. Au nom d''Allah.',
  content_source = 'Rapporté par Ibn As-Sunnî dans « ''Amal al-yawm wa l-layla »',
  autre_arabe = 'بِسْمِ اللهِ',
  autre_prononciation = 'Bismillâh.',
  autre_traduction = 'Au nom d''Allah.',
  autre_source = 'Rapporté par Abû Dâwûd (n°3767) et At-Tirmidhî (n°1858)'
where id = 5 and title_french = 'Avant de manger';

-- Après avoir mangé (id 6) : en premier ce que dit la vidéo Telegram, puis l'autre invocation authentique
update public.invocations set
  content_arabic = 'الحَمْدُ للهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ',
  content_prononciation = 'Al-hamdu lillâhi lladhî at''amanâ wa saqânâ wa ja''alanâ muslimîn.',
  content_french = 'Louange à Allah qui nous a donné à manger, qui nous a donné à boire et qui a fait de nous des musulmans.',
  content_source = 'Rapporté par Abû Dâwûd (n°3850) et At-Tirmidhî (n°3457)',
  autre_arabe = 'الحَمْدُ للهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
  autre_prononciation = 'Al-hamdu lillâhi lladhî at''amanî hâdhâ, wa razaqanîhi min ghayri hawlin minnî wa lâ quwwa.',
  autre_traduction = 'Louange à Allah qui m''a nourri de ceci et me l''a accordé sans force ni puissance de ma part.',
  autre_source = 'Rapporté par Abû Dâwûd (n°4023) et At-Tirmidhî (n°3458)'
where id = 6 and title_french = 'Après avoir mangé';
