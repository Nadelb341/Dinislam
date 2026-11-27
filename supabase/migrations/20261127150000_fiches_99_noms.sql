-- 🌟 99 noms d'Allah : fiche en 9 parties pour chaque nom (demande de Nadia du 27/11/2026)
--   1. Nom en arabe (name_arabic)  2. Translittération (transliteration)  3. Signification (name_french + fiche_signification)
--   4. Explication détaillée  5. Preuve (Coran ou hadith)  6. Moment approprié  7. Exemple d'invocation
--   8. Référence précise et degré d'authenticité  9. Divergences entre les savants
-- 🕌 Règle n°1 (sunnite, malikite) : versets recopiés depuis api.alquran.cloud (texte « quran-simple », traduction Hamidullah) ;
--    hadiths recopiés depuis la copie des recueils de fawazahmed0/hadith-api (numérotation habituelle ; Mouslim = numérotation de Fouâd 'Abd Al-Bâqî),
--    avec le degré donné par les spécialistes (Al-Albânî, Chou'ayb Al-Arna'oût, Ahmad Châkir, Zoubayr 'Alî Zaï…) et leurs divergences.
--    Chaque fiche remplie porte « fiche_a_relire = true » : Nadia la relit et la valide (visible seulement de l'enseignante).
-- ADDITIF : colonnes ajoutées (IF NOT EXISTS), rien d'effacé ; les colonnes existantes (explanation, audio_url, image…) ne changent pas.
-- Relancer ce fichier ne crée aucun doublon et n'écrase jamais une fiche déjà remplie (« fiche_explication is null »).
-- ⚠️ Appliquer avec : supabase db query --linked -f <ce fichier>   (JAMAIS supabase db push)

-- 1) Colonnes
alter table public.allah_names add column if not exists fiche_signification text;
alter table public.allah_names add column if not exists fiche_explication text;
alter table public.allah_names add column if not exists fiche_preuve_type text;
alter table public.allah_names add column if not exists fiche_preuve_arabe text;
alter table public.allah_names add column if not exists fiche_preuve_francais text;
alter table public.allah_names add column if not exists fiche_preuve_reference text;
alter table public.allah_names add column if not exists fiche_preuve_degre text;
alter table public.allah_names add column if not exists fiche_preuve_degre_note text;
alter table public.allah_names add column if not exists fiche_moment text;
alter table public.allah_names add column if not exists fiche_invocation_arabe text;
alter table public.allah_names add column if not exists fiche_invocation_phonetique text;
alter table public.allah_names add column if not exists fiche_invocation_francais text;
alter table public.allah_names add column if not exists fiche_invocation_reference text;
alter table public.allah_names add column if not exists fiche_invocation_degre text;
alter table public.allah_names add column if not exists fiche_invocation_degre_note text;
alter table public.allah_names add column if not exists fiche_invocation_personnelle boolean not null default false;
alter table public.allah_names add column if not exists fiche_autres_references text;
alter table public.allah_names add column if not exists fiche_divergences text;
alter table public.allah_names add column if not exists fiche_statut_nom text;
alter table public.allah_names add column if not exists fiche_a_relire boolean not null default false;
alter table public.allah_names add column if not exists fiche_note_relecture text;
alter table public.allah_names add column if not exists fiche_relue_le timestamptz;

-- Valeurs permises (pastille commune DegreAuthenticite : sahih / hasan / daif / mawdou / coran)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'allah_names_fiche_degres_check') then
    alter table public.allah_names add constraint allah_names_fiche_degres_check check (
      (fiche_preuve_degre is null or fiche_preuve_degre in ('sahih','hasan','daif','mawdou','coran'))
      and (fiche_invocation_degre is null or fiche_invocation_degre in ('sahih','hasan','daif','mawdou','coran'))
      and (fiche_preuve_type is null or fiche_preuve_type in ('coran','hadith'))
      and (fiche_statut_nom is null or fiche_statut_nom in ('coran','sunna','discute')));
  end if;
end $$;

-- 2) Remplissage des 99 fiches (seulement si la fiche est encore vide : jamais d'écrasement d'une fiche déjà modifiée par Nadia)
-- 1. Ar-Rahmân
update public.allah_names set
  fiche_signification = $f$Celui dont la miséricorde est immense et touche toutes les créatures.$f$,
  fiche_explication = $f$Celui dont la miséricorde englobe toutes les créatures en ce monde. Ar-Rahmân est un nom propre à Allah : personne d'autre ne peut le porter. La pluie, la nourriture, la santé, l'amour des parents sont des signes de Sa miséricorde. Allah a mis ce nom dans « Bismillâh ar-Rahmân ar-Rahîm ».$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$قُلِ ادْعُوا اللَّهَ أَوِ ادْعُوا الرَّحْمَٰنَ ۖ أَيًّا مَا تَدْعُوا فَلَهُ الْأَسْمَاءُ الْحُسْنَىٰ$f$,
  fiche_preuve_francais = $f$Dis : « Invoquez Allah, ou invoquez le Tout Miséricordieux (Ar-Rahmân). Quel que soit le nom par lequel vous L'invoquez, Il a les plus beaux noms. »$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Isra (17:110) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout quand on a besoin de Sa miséricorde. Le verset 17:110 nous invite à L'appeler par ce nom.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Rahmân, fais-moi miséricorde, ainsi qu'à mes parents et à tous les musulmans.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 1 and display_order = 1 and fiche_explication is null;

-- 2. Ar-Rahîm
update public.allah_names set
  fiche_signification = $f$Celui qui fait miséricorde, en particulier aux croyants.$f$,
  fiche_explication = $f$Celui dont la miséricorde particulière est réservée aux croyants, surtout dans l'au-delà. Il les guide, leur pardonne et les fait entrer au Paradis. Ar-Rahîm va souvent avec Ar-Rahmân dans le Coran.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$هُوَ الَّذِي يُصَلِّي عَلَيْكُمْ وَمَلَائِكَتُهُ لِيُخْرِجَكُمْ مِنَ الظُّلُمَاتِ إِلَى النُّورِ ۚ وَكَانَ بِالْمُؤْمِنِينَ رَحِيمًا$f$,
  fiche_preuve_francais = $f$C'est Lui qui vous bénit, ainsi que Ses anges, pour vous faire sortir des ténèbres vers la lumière ; et Il est Très Miséricordieux (Rahîm) envers les croyants.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Ahzab (33:43) · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Pendant la prière : Abou Bakr a demandé au Prophète ﷺ une invocation à dire dans sa prière, et il lui a appris celle-ci (Al-Boukhârî 834). On peut aussi la dire à tout moment.$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا وَلاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ، وَارْحَمْنِي إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, je me suis fait beaucoup de tort à moi-même, et personne ne pardonne les péchés sauf Toi. Pardonne-moi d'un pardon venant de Toi, et fais-moi miséricorde. Tu es le Pardonneur (Al-Ghafoûr), le Très Miséricordieux (Ar-Rahîm).$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 834 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$La différence entre Ar-Rahmân (miséricorde pour toutes les créatures) et Ar-Rahîm (miséricorde pour les croyants) est l'explication de beaucoup de savants ; d'autres l'expliquent un peu autrement (Ar-Rahmân : la miséricorde qui est en Lui ; Ar-Rahîm : la miséricorde qu'Il fait arriver aux créatures). Les deux explications sont dans les livres des savants sunnites.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 2 and display_order = 2 and fiche_explication is null;

-- 3. Al-Malik
update public.allah_names set
  fiche_signification = $f$Le Roi : tout Lui appartient et Il fait ce qu'Il veut dans Son royaume.$f$,
  fiche_explication = $f$Le Souverain absolu de toute chose. Les rois de ce monde ont un royaume petit et qui finit ; Allah possède tout, pour toujours, et personne ne peut s'opposer à Lui.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$فَتَعَالَى اللَّهُ الْمَلِكُ الْحَقُّ$f$,
  fiche_preuve_francais = $f$Que soit exalté Allah, le Vrai Roi (Al-Malik) !$f$,
  fiche_preuve_reference = $f$Coran, sourate Ta-Ha (20:114) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Au début de la prière : c'est une des invocations d'ouverture que disait le Prophète ﷺ (Mouslim 771).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ أَنْتَ الْمَلِكُ لاَ إِلَهَ إِلاَّ أَنْتَ ‏.‏ أَنْتَ رَبِّي وَأَنَا عَبْدُكَ ظَلَمْتُ نَفْسِي وَاعْتَرَفْتُ بِذَنْبِي فَاغْفِرْ لِي ذُنُوبِي جَمِيعًا إِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, Tu es le Roi (Al-Malik), il n'y a pas de divinité à part Toi. Tu es mon Seigneur et je suis Ton serviteur. Je me suis fait du tort et je reconnais ma faute : pardonne-moi tous mes péchés, car personne ne pardonne les péchés sauf Toi.$f$,
  fiche_invocation_reference = $f$Mouslim n° 771 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 3 and display_order = 3 and fiche_explication is null;

-- 4. Al-Quddûs
update public.allah_names set
  fiche_signification = $f$Le Très Pur : Il n'a aucun défaut, aucune faiblesse.$f$,
  fiche_explication = $f$Celui qui est exempt de toute imperfection. Rien de mauvais ni de faible ne peut être dit d'Allah. Les anges Le glorifient sans cesse en disant qu'Il est pur de tout défaut.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ يُسَبِّحُ لِلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ الْمَلِكِ الْقُدُّوسِ الْعَزِيزِ الْحَكِيمِ$f$,
  fiche_preuve_francais = $f$Ce qui est dans les cieux et ce qui est sur la terre glorifient Allah, le Souverain, le Pur, le Puissant, le Sage.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Jumu'a (62:1) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Dans l'inclinaison (roukoû') et la prosternation (soujoûd) : le Prophète ﷺ y disait « Soubboûhoun Qouddoûs » (Mouslim 487).$f$,
  fiche_invocation_arabe = $f$سُبُّوحٌ قُدُّوسٌ رَبُّ الْمَلاَئِكَةِ وَالرُّوحِ$f$,
  fiche_invocation_phonetique = $f$Soubboûhoun qouddoûsoun, rabbou-l-malâ'ikati wa-r-roûh$f$,
  fiche_invocation_francais = $f$Très glorifié, Très Pur (Qouddoûs), Seigneur des anges et de l'Esprit (Jibrîl).$f$,
  fiche_invocation_reference = $f$Mouslim n° 487 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 4 and display_order = 4 and fiche_explication is null;

-- 5. As-Salâm
update public.allah_names set
  fiche_signification = $f$La Paix : Il n'a aucun défaut, et c'est de Lui que vient toute paix.$f$,
  fiche_explication = $f$Celui dont la paix est parfaite et absolue. Allah est pur de tout manque, et c'est Lui qui donne la paix et la sécurité à Ses serviteurs. Le Prophète ﷺ a dit : « Allah, c'est Lui As-Salâm » (Al-Boukhârî 831).$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْمَلِكُ الْقُدُّوسُ السَّلَامُ الْمُؤْمِنُ الْمُهَيْمِنُ الْعَزِيزُ الْجَبَّارُ الْمُتَكَبِّرُ ۚ سُبْحَانَ اللَّهِ عَمَّا يُشْرِكُونَ$f$,
  fiche_preuve_francais = $f$C'est Lui, Allah : il n'y a pas de divinité à part Lui. Le Roi (Al-Malik), le Très Pur (Al-Qouddoûs), la Paix (As-Salâm), Celui qui donne la sécurité (Al-Mou'min), Celui qui veille sur tout (Al-Mouhaymin), le Tout-Puissant (Al-'Azîz), Celui qui répare et qui impose Sa volonté (Al-Jabbâr), Celui à qui appartient la grandeur (Al-Moutakabbir). Gloire à Allah, bien au-dessus de ce qu'ils Lui associent !$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hashr (59:23) · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Juste après le salâm de la prière obligatoire : le Prophète ﷺ demandait pardon trois fois (« Astaghfiroullâh »), puis disait cette invocation (Mouslim 591).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ أَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ تَبَارَكْتَ ذَا الْجَلاَلِ وَالإِكْرَامِ$f$,
  fiche_invocation_phonetique = $f$Allâhoumma anta-s-salâm, wa minka-s-salâm, tabârakta yâ dha-l-jalâli wa-l-ikrâm$f$,
  fiche_invocation_francais = $f$Ô Allah, Tu es la Paix (As-Salâm) et de Toi vient la paix. Béni sois-Tu, Ô Possesseur de la Majesté et de la Générosité.$f$,
  fiche_invocation_reference = $f$Mouslim n° 591 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = $f$Al-Boukhârî 831 : « إِنَّ اللَّهَ هُوَ السَّلاَمُ » (Allah, c'est Lui As-Salâm).$f$,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 5 and display_order = 5 and fiche_explication is null;

-- 6. Al-Mu'min
update public.allah_names set
  fiche_signification = $f$Celui qui donne la sécurité, et qui confirme la vérité de Ses messagers.$f$,
  fiche_explication = $f$Celui qui accorde la sécurité et la foi. Al-Mou'min a deux sens chez les savants : Celui qui rassure et protège Ses serviteurs, et Celui qui confirme que Ses prophètes disent vrai, par des miracles et des signes.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْمَلِكُ الْقُدُّوسُ السَّلَامُ الْمُؤْمِنُ الْمُهَيْمِنُ الْعَزِيزُ الْجَبَّارُ الْمُتَكَبِّرُ ۚ سُبْحَانَ اللَّهِ عَمَّا يُشْرِكُونَ$f$,
  fiche_preuve_francais = $f$C'est Lui, Allah : il n'y a pas de divinité à part Lui. Le Roi (Al-Malik), le Très Pur (Al-Qouddoûs), la Paix (As-Salâm), Celui qui donne la sécurité (Al-Mou'min), Celui qui veille sur tout (Al-Mouhaymin), le Tout-Puissant (Al-'Azîz), Celui qui répare et qui impose Sa volonté (Al-Jabbâr), Celui à qui appartient la grandeur (Al-Moutakabbir). Gloire à Allah, bien au-dessus de ce qu'ils Lui associent !$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hashr (59:23) · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout quand on a peur ou qu'on a besoin d'être rassuré.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Mou'min, donne-moi la sécurité, rassure mon cœur et affermis ma foi.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 6 and display_order = 6 and fiche_explication is null;

-- 7. Al-Muhaimin
update public.allah_names set
  fiche_signification = $f$Celui qui veille sur tout : Il voit, Il sait et Il garde toute chose.$f$,
  fiche_explication = $f$Celui qui surveille et protège tout. Rien ne Lui échappe : ni les actions, ni les paroles, ni ce qui est caché dans les cœurs. Il est aussi le gardien de Ses livres : le Coran est protégé par Lui.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْمَلِكُ الْقُدُّوسُ السَّلَامُ الْمُؤْمِنُ الْمُهَيْمِنُ الْعَزِيزُ الْجَبَّارُ الْمُتَكَبِّرُ ۚ سُبْحَانَ اللَّهِ عَمَّا يُشْرِكُونَ$f$,
  fiche_preuve_francais = $f$C'est Lui, Allah : il n'y a pas de divinité à part Lui. Le Roi (Al-Malik), le Très Pur (Al-Qouddoûs), la Paix (As-Salâm), Celui qui donne la sécurité (Al-Mou'min), Celui qui veille sur tout (Al-Mouhaymin), le Tout-Puissant (Al-'Azîz), Celui qui répare et qui impose Sa volonté (Al-Jabbâr), Celui à qui appartient la grandeur (Al-Moutakabbir). Gloire à Allah, bien au-dessus de ce qu'ils Lui associent !$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hashr (59:23) · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout quand on a besoin d'être gardé et protégé.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Mouhaymin, veille sur moi et sur ma famille, et garde-nous de tout mal.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 7 and display_order = 7 and fiche_explication is null;

-- 8. Al-'Azîz
update public.allah_names set
  fiche_signification = $f$Le Tout-Puissant : personne ne peut Le vaincre.$f$,
  fiche_explication = $f$Celui dont la puissance est absolue et incomparable. Personne ne peut Le battre, ni Lui faire du mal, ni L'empêcher de faire ce qu'Il veut. C'est Lui qui donne la force et l'honneur à qui Il veut.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$لَا إِلَٰهَ إِلَّا هُوَ الْعَزِيزُ الْحَكِيمُ$f$,
  fiche_preuve_francais = $f$Il n'y a pas de divinité à part Lui, le Tout-Puissant (Al-'Azîz), le Sage.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Imran (3:6) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout quand on se sent faible ou qu'on a besoin de Sa force.$f$,
  fiche_invocation_arabe = $f$رَبَّنَا لَا تَجْعَلْنَا فِتْنَةً لِلَّذِينَ كَفَرُوا وَاغْفِرْ لَنَا رَبَّنَا ۖ إِنَّكَ أَنْتَ الْعَزِيزُ الْحَكِيمُ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Seigneur, ne fais pas de nous [un sujet] de tentation pour ceux qui ont mécru; et pardonne-nous, Seigneur, car c'est Toi le Puissant, le Sage».$f$,
  fiche_invocation_reference = $f$Coran, sourate Al-Mumtahina (60:5) · traduction de Muhammad Hamidullah$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 8 and display_order = 8 and fiche_explication is null;

-- 9. Al-Jabbâr
update public.allah_names set
  fiche_signification = $f$Celui qui répare ce qui est brisé, qui impose Sa volonté, et qui est au-dessus de tout.$f$,
  fiche_explication = $f$Celui qui répare les cœurs brisés. Les savants donnent trois sens à Al-Jabbâr : Il répare (le cœur triste, le pauvre, le malade) ; Il impose ce qu'Il veut, personne ne peut Lui résister ; et Il est élevé au-dessus de toute chose.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْمَلِكُ الْقُدُّوسُ السَّلَامُ الْمُؤْمِنُ الْمُهَيْمِنُ الْعَزِيزُ الْجَبَّارُ الْمُتَكَبِّرُ ۚ سُبْحَانَ اللَّهِ عَمَّا يُشْرِكُونَ$f$,
  fiche_preuve_francais = $f$C'est Lui, Allah : il n'y a pas de divinité à part Lui. Le Roi (Al-Malik), le Très Pur (Al-Qouddoûs), la Paix (As-Salâm), Celui qui donne la sécurité (Al-Mou'min), Celui qui veille sur tout (Al-Mouhaymin), le Tout-Puissant (Al-'Azîz), Celui qui répare et qui impose Sa volonté (Al-Jabbâr), Celui à qui appartient la grandeur (Al-Moutakabbir). Gloire à Allah, bien au-dessus de ce qu'ils Lui associent !$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hashr (59:23) · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Entre les deux prosternations de la prière : le Prophète ﷺ disait « wa-jbournî » (« et répare-moi ») selon le hadith d'At-Tirmidhî 284.$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاجْبُرْنِي وَاهْدِنِي وَارْزُقْنِي$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, pardonne-moi, fais-moi miséricorde, répare-moi, guide-moi et accorde-moi ma subsistance.$f$,
  fiche_invocation_reference = $f$At-Tirmidhî n° 284 — jugé authentique (sahîh) par Al-Albânî · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = $f$Les spécialistes du hadith ne sont pas d'accord : authentique (sahîh) selon Ahmad Châkir, Al-Albânî ; faible (da'îf) selon Zoubayr 'Alî Zaï.$f$,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 9 and display_order = 9 and fiche_explication is null;

-- 10. Al-Mutakabbir
update public.allah_names set
  fiche_signification = $f$Celui à qui appartient la vraie grandeur.$f$,
  fiche_explication = $f$Celui qui possède la grandeur absolue. L'orgueil est un grave défaut chez l'être humain, car il ne possède rien par lui-même. Mais la grandeur appartient vraiment à Allah : Il est au-dessus de tout défaut et de toute créature.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْمَلِكُ الْقُدُّوسُ السَّلَامُ الْمُؤْمِنُ الْمُهَيْمِنُ الْعَزِيزُ الْجَبَّارُ الْمُتَكَبِّرُ ۚ سُبْحَانَ اللَّهِ عَمَّا يُشْرِكُونَ$f$,
  fiche_preuve_francais = $f$C'est Lui, Allah : il n'y a pas de divinité à part Lui. Le Roi (Al-Malik), le Très Pur (Al-Qouddoûs), la Paix (As-Salâm), Celui qui donne la sécurité (Al-Mou'min), Celui qui veille sur tout (Al-Mouhaymin), le Tout-Puissant (Al-'Azîz), Celui qui répare et qui impose Sa volonté (Al-Jabbâr), Celui à qui appartient la grandeur (Al-Moutakabbir). Gloire à Allah, bien au-dessus de ce qu'ils Lui associent !$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hashr (59:23) · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, par exemple quand on sent l'orgueil entrer dans son cœur.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Allâhou akbar ! Yâ Moutakabbir, éloigne l'orgueil de mon cœur et rends-moi humble.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 10 and display_order = 10 and fiche_explication is null;

-- 11. Al-Khâliq
update public.allah_names set
  fiche_signification = $f$Le Créateur : Il a tout créé, à partir de rien.$f$,
  fiche_explication = $f$Celui qui crée à partir de rien. Allah a décidé de la création de chaque chose avant qu'elle existe, puis Il l'a fait exister. Personne d'autre ne peut créer comme Lui.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ ۖ لَهُ الْأَسْمَاءُ الْحُسْنَىٰ ۚ يُسَبِّحُ لَهُ مَا فِي السَّمَاوَاتِ وَالْأَرْضِ ۖ وَهُوَ الْعَزِيزُ الْحَكِيمُ$f$,
  fiche_preuve_francais = $f$C'est Lui Allah, le Créateur, Celui qui donne un commencement à toute chose, le Formateur. A Lui les plus beaux noms. Tout ce qui est dans les cieux et la terre Le glorifie. Et c'est Lui le Puissant, le Sage.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hashr (59:24) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Quand on regarde le ciel, la nature et les créatures : les croyants du verset 3:191 réfléchissent à la création et disent cette invocation.$f$,
  fiche_invocation_arabe = $f$رَبَّنَا مَا خَلَقْتَ هَٰذَا بَاطِلًا سُبْحَانَكَ فَقِنَا عَذَابَ النَّارِ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Notre Seigneur, Tu n'as pas créé tout cela pour rien. Gloire à Toi ! Protège-nous du châtiment du Feu.$f$,
  fiche_invocation_reference = $f$Coran, sourate Al-Imran (3:191) — extrait du verset · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 11 and display_order = 11 and fiche_explication is null;

-- 12. Al-Bâri'
update public.allah_names set
  fiche_signification = $f$Celui qui fait exister les créatures, sans aucun défaut dans Sa création.$f$,
  fiche_explication = $f$Celui qui crée les êtres dans leur harmonie parfaite. Al-Bâri' fait sortir les créatures du néant et les distingue les unes des autres. Il va avec Al-Khâliq et Al-Mousawwir dans le même verset.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ ۖ لَهُ الْأَسْمَاءُ الْحُسْنَىٰ ۚ يُسَبِّحُ لَهُ مَا فِي السَّمَاوَاتِ وَالْأَرْضِ ۖ وَهُوَ الْعَزِيزُ الْحَكِيمُ$f$,
  fiche_preuve_francais = $f$C'est Lui Allah, le Créateur, Celui qui donne un commencement à toute chose, le Formateur. A Lui les plus beaux noms. Tout ce qui est dans les cieux et la terre Le glorifie. Et c'est Lui le Puissant, le Sage.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hashr (59:24) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, par exemple en admirant la création.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Bâri', Toi qui m'as créé, aide-moi à T'adorer comme Tu l'aimes.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 12 and display_order = 12 and fiche_explication is null;

-- 13. Al-Musawwir
update public.allah_names set
  fiche_signification = $f$Celui qui donne à chaque créature sa forme.$f$,
  fiche_explication = $f$Celui qui donne leur forme à Ses créatures. Chaque visage, chaque animal, chaque fleur a une forme différente : c'est Allah qui les a façonnés, comme Il l'a voulu.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ ۖ لَهُ الْأَسْمَاءُ الْحُسْنَىٰ ۚ يُسَبِّحُ لَهُ مَا فِي السَّمَاوَاتِ وَالْأَرْضِ ۖ وَهُوَ الْعَزِيزُ الْحَكِيمُ$f$,
  fiche_preuve_francais = $f$C'est Lui Allah, le Créateur, Celui qui donne un commencement à toute chose, le Formateur. A Lui les plus beaux noms. Tout ce qui est dans les cieux et la terre Le glorifie. Et c'est Lui le Puissant, le Sage.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hashr (59:24) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Dans la prosternation (soujoûd) : le Prophète ﷺ y disait cette invocation (Mouslim 771).$f$,
  fiche_invocation_arabe = $f$سَجَدَ وَجْهِي لِلَّذِي خَلَقَهُ وَصَوَّرَهُ وَشَقَّ سَمْعَهُ وَبَصَرَهُ تَبَارَكَ اللَّهُ أَحْسَنُ الْخَالِقِينَ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Mon visage se prosterne devant Celui qui l'a créé, lui a donné sa forme, et lui a ouvert l'ouïe et la vue. Béni soit Allah, le meilleur des créateurs.$f$,
  fiche_invocation_reference = $f$Mouslim n° 771 · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 13 and display_order = 13 and fiche_explication is null;

-- 14. Al-Ghaffâr
update public.allah_names set
  fiche_signification = $f$Celui qui pardonne beaucoup, encore et encore.$f$,
  fiche_explication = $f$Celui qui pardonne abondamment les péchés. Même si le serviteur se trompe souvent, Allah lui pardonne chaque fois qu'il revient vers Lui sincèrement.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَإِنِّي لَغَفَّارٌ لِمَنْ تَابَ وَآمَنَ وَعَمِلَ صَالِحًا ثُمَّ اهْتَدَىٰ$f$,
  fiche_preuve_francais = $f$Et je suis Grand Pardonneur à celui qui se repent, croit, fait bonne œuvre, puis se met sur le bon chemin».$f$,
  fiche_preuve_reference = $f$Coran, sourate Ta-Ha (20:82) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$À tout moment, et surtout après une faute. Le Prophète ﷺ disait : « Par Allah, je demande pardon à Allah et je me repens à Lui plus de soixante-dix fois par jour » (Al-Boukhârî 6307).$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Ghaffâr, pardonne-moi mes péchés, les petits et les grands.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 14 and display_order = 14 and fiche_explication is null;

-- 15. Al-Qahhâr
update public.allah_names set
  fiche_signification = $f$Celui qui domine tout : toutes les créatures Lui sont soumises.$f$,
  fiche_explication = $f$Celui qui domine tout sans partage. Les puissants de ce monde, les rois et les orgueilleux sont tous sous Sa domination. Personne ne peut sortir de Son pouvoir.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$سُبْحَانَهُ ۖ هُوَ اللَّهُ الْوَاحِدُ الْقَهَّارُ$f$,
  fiche_preuve_francais = $f$Gloire à Lui ! Il est Allah, l'Unique, le Dominateur suprême (Al-Qahhâr).$f$,
  fiche_preuve_reference = $f$Coran, sourate Az-Zumar (39:4) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, par exemple face à une injustice ou à un ennemi.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Qahhâr, protège-moi du mal de ceux qui veulent me nuire.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 15 and display_order = 15 and fiche_explication is null;

-- 16. Al-Wahhâb
update public.allah_names set
  fiche_signification = $f$Celui qui donne beaucoup, sans rien attendre en retour.$f$,
  fiche_explication = $f$Celui qui accorde Ses dons sans compter. Il donne la vie, la santé, les enfants, la science, la foi… sans que personne ne L'y oblige, et sans avoir besoin de quoi que ce soit.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$أَمْ عِنْدَهُمْ خَزَائِنُ رَحْمَةِ رَبِّكَ الْعَزِيزِ الْوَهَّابِ$f$,
  fiche_preuve_francais = $f$Ou bien détiennent-ils les trésors de la miséricorde de ton Seigneur, le Puissant, le Dispensateur par excellence.$f$,
  fiche_preuve_reference = $f$Coran, sourate Sad (38:9) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment. Cette invocation du Coran est celle des gens de science (« ceux qui sont bien ancrés dans la science »).$f$,
  fiche_invocation_arabe = $f$رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً ۚ إِنَّكَ أَنْتَ الْوَهَّابُ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$«Seigneur! Ne laisse pas dévier nos cœurs après que Tu nous aies guidés; et accorde-nous Ta miséricorde. C'est Toi, certes, le Grand Donateur!$f$,
  fiche_invocation_reference = $f$Coran, sourate Al-Imran (3:8) · traduction de Muhammad Hamidullah$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 16 and display_order = 16 and fiche_explication is null;

-- 17. Ar-Razzâq
update public.allah_names set
  fiche_signification = $f$Celui qui donne à chaque créature sa subsistance.$f$,
  fiche_explication = $f$Celui qui pourvoit à tous les besoins. La nourriture, l'eau, l'argent, mais aussi la science et la foi : tout cela est une subsistance (rizq) qui vient d'Allah. Il n'oublie aucune créature.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ$f$,
  fiche_preuve_francais = $f$En vérité, c'est Allah qui est le Grand Pourvoyeur, Le Détenteur de la force, l'Inébranlable.$f$,
  fiche_preuve_reference = $f$Coran, sourate Adh-Dhariyat (51:58) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout quand on a besoin de nourriture, de travail ou de bien.$f$,
  fiche_invocation_arabe = $f$وَارْزُقْنَا وَأَنْتَ خَيْرُ الرَّازِقِينَ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Accorde-nous Ta subsistance, car Tu es le meilleur des pourvoyeurs.$f$,
  fiche_invocation_reference = $f$Coran, sourate Al-Ma'ida (5:114) — extrait du verset · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 17 and display_order = 17 and fiche_explication is null;

-- 18. Al-Fattâh
update public.allah_names set
  fiche_signification = $f$Celui qui ouvre les portes du bien, et qui juge avec vérité.$f$,
  fiche_explication = $f$Celui qui ouvre les portes de la miséricorde. Al-Fattâh ouvre au serviteur les portes de la subsistance, de la science et de la miséricorde ; Il est aussi Celui qui juge entre les gens avec vérité.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$قُلْ يَجْمَعُ بَيْنَنَا رَبُّنَا ثُمَّ يَفْتَحُ بَيْنَنَا بِالْحَقِّ وَهُوَ الْفَتَّاحُ الْعَلِيمُ$f$,
  fiche_preuve_francais = $f$Dis: «Notre Seigneur nous réunira, puis Il tranchera entre nous, avec la vérité, car c'est Lui le Grand Juge, l'Omniscient».$f$,
  fiche_preuve_reference = $f$Coran, sourate Saba (34:26) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$En entrant à la mosquée : le Prophète ﷺ a appris à dire « Allâhoumma-ftah lî abwâba rahmatik » (Mouslim 713).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ$f$,
  fiche_invocation_phonetique = $f$Allâhoumma-ftah lî abwâba rahmatik$f$,
  fiche_invocation_francais = $f$Ô Allah, ouvre-moi les portes de Ta miséricorde.$f$,
  fiche_invocation_reference = $f$Mouslim n° 713 · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 18 and display_order = 18 and fiche_explication is null;

-- 19. Al-'Alîm
update public.allah_names set
  fiche_signification = $f$Celui qui sait tout : le passé, le présent, l'avenir et ce qui est caché.$f$,
  fiche_explication = $f$Celui dont la connaissance est infinie. Il connaît ce qui est dans les cœurs, le nombre des feuilles qui tombent, et tout ce qui va arriver. Rien n'est caché pour Lui.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَاللَّهُ بِكُلِّ شَيْءٍ عَلِيمٌ$f$,
  fiche_preuve_francais = $f$Et Allah connaît toute chose (Alîm).$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hujurat (49:16) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Après avoir fait une bonne action : Ibrâhîm et Ismâ'îl ont dit cette invocation en construisant la Ka'ba (Coran 2:127).$f$,
  fiche_invocation_arabe = $f$رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Notre Seigneur, accepte cela de notre part. Tu es Celui qui entend tout (As-Samî'), Celui qui sait tout (Al-'Alîm).$f$,
  fiche_invocation_reference = $f$Coran, sourate Al-Baqara (2:127) — extrait du verset · traduction simple du sens$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 19 and display_order = 19 and fiche_explication is null;

-- 20. Al-Qâbid
update public.allah_names set
  fiche_signification = $f$Celui qui resserre (la subsistance, les âmes) selon Sa sagesse.$f$,
  fiche_explication = $f$Celui qui retient et resserre selon Sa sagesse. Allah peut donner moins à quelqu'un pour l'éprouver, ou reprendre les âmes au moment de la mort. Ce qu'Il retient, Il le retient avec justice et sagesse.$f$,
  fiche_preuve_type = $f$hadith$f$,
  fiche_preuve_arabe = $f$إِنَّ اللَّهَ هُوَ الْمُسَعِّرُ الْقَابِضُ الْبَاسِطُ الرَّازِقُ$f$,
  fiche_preuve_francais = $f$C'est Allah qui fixe les prix, Lui qui resserre (Al-Qâbid), qui étend (Al-Bâsit) et qui donne la subsistance.$f$,
  fiche_preuve_reference = $f$Abou Dâwoud n° 3451 — jugé authentique (sahîh) par Al-Albânî · traduction simple du sens$f$,
  fiche_preuve_degre = $f$sahih$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout quand on vit un moment difficile ou qu'on a peu.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Qâbid, Yâ Bâsit, si Tu me donnes peu, donne-moi la patience, et si Tu me donnes beaucoup, aide-moi à être reconnaissant.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = $f$Le verbe est dans le Coran : 2:245.$f$,
  fiche_divergences = $f$Beaucoup de savants disent que ce nom ne doit pas être dit seul : on dit « Al-Qâbid Al-Bâsit » ensemble, pour montrer que la sagesse d'Allah est complète. Le Coran utilise le verbe : « Allah resserre et étend » (2:245).

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$sunna$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 20 and display_order = 20 and fiche_explication is null;

-- 21. Al-Bâsit
update public.allah_names set
  fiche_signification = $f$Celui qui étend (la subsistance, la miséricorde) à qui Il veut.$f$,
  fiche_explication = $f$Celui qui étend et élargit Ses bienfaits. Il donne largement la subsistance, la joie et le bien à qui Il veut. Il étend aussi Sa main la nuit pour pardonner à celui qui a péché le jour.$f$,
  fiche_preuve_type = $f$hadith$f$,
  fiche_preuve_arabe = $f$إِنَّ اللَّهَ هُوَ الْمُسَعِّرُ الْقَابِضُ الْبَاسِطُ الرَّازِقُ$f$,
  fiche_preuve_francais = $f$C'est Allah qui fixe les prix, Lui qui resserre (Al-Qâbid), qui étend (Al-Bâsit) et qui donne la subsistance.$f$,
  fiche_preuve_reference = $f$Abou Dâwoud n° 3451 — jugé authentique (sahîh) par Al-Albânî · traduction simple du sens$f$,
  fiche_preuve_degre = $f$sahih$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout quand on a besoin que sa situation s'élargisse.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Bâsit, élargis ma subsistance et ouvre mon cœur au bien.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = $f$Le verbe est dans le Coran : 2:245.$f$,
  fiche_divergences = $f$Comme pour Al-Qâbid, beaucoup de savants disent qu'on cite les deux noms ensemble. Le Coran utilise le verbe : « Allah resserre et étend » (2:245).

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$sunna$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 21 and display_order = 21 and fiche_explication is null;

-- 22. Al-Khâfid
update public.allah_names set
  fiche_signification = $f$Celui qui abaisse qui Il veut, avec justice.$f$,
  fiche_explication = $f$Celui qui humilie les orgueilleux. Allah abaisse ceux qui se croient supérieurs et ceux qui sont injustes, par justice et par sagesse. Le croyant reste humble pour ne pas être abaissé.$f$,
  fiche_preuve_type = $f$hadith$f$,
  fiche_preuve_arabe = $f$يَخْفِضُ الْقِسْطَ وَيَرْفَعُهُ$f$,
  fiche_preuve_francais = $f$Il abaisse la balance et l'élève.$f$,
  fiche_preuve_reference = $f$Mouslim n° 179 · traduction simple du sens$f$,
  fiche_preuve_degre = $f$sahih$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, par exemple pour demander à être protégé de l'orgueil.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, rends-moi humble, et ne fais pas de moi quelqu'un d'orgueilleux.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Khâfid » n'est ni dans le Coran ni dans un hadith authentique comme nom : seul le verbe « Il abaisse » est dans le hadith de Mouslim 179. Beaucoup de savants disent aussi qu'on ne le cite qu'avec Ar-Râfi' (Celui qui élève).

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 22 and display_order = 22 and fiche_explication is null;

-- 23. Ar-Râfi'
update public.allah_names set
  fiche_signification = $f$Celui qui élève qui Il veut, en rang et en honneur.$f$,
  fiche_explication = $f$Celui qui élève les humbles et les pieux. Allah élève en degrés les croyants et les gens de science, et Il élève le rang de celui qui est humble pour Lui.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنْكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ$f$,
  fiche_preuve_francais = $f$Allah élèvera en degrés ceux d'entre vous qui ont cru et ceux qui ont reçu la science.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Mujadila (58:11) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout avant d'apprendre ou d'étudier.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Râfi', élève-moi en rang par la foi et par la science utile.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = $f$Voir aussi 3:55.$f$,
  fiche_divergences = $f$« Ar-Râfi' » comme nom n'est pas dans un hadith authentique ; le Coran utilise le verbe « Allah élève » (58:11) et dit à 'Îsâ « Je vais t'élever vers Moi » (3:55). Beaucoup de savants le citent avec Al-Khâfid.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 23 and display_order = 23 and fiche_explication is null;

-- 24. Al-Mu'izz
update public.allah_names set
  fiche_signification = $f$Celui qui donne l'honneur et la force à qui Il veut.$f$,
  fiche_explication = $f$Celui qui accorde l'honneur et la dignité. Le vrai honneur vient d'Allah : celui qui Lui obéit est honoré, même s'il est pauvre ou faible aux yeux des gens.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَتُعِزُّ مَنْ تَشَاءُ وَتُذِلُّ مَنْ تَشَاءُ ۖ بِيَدِكَ الْخَيْرُ ۖ إِنَّكَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ$f$,
  fiche_preuve_francais = $f$Tu donnes l'honneur à qui Tu veux et Tu humilies qui Tu veux. Le bien est dans Ta main. Tu es capable de toute chose.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Imran (3:26) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Mou'izz, honore-moi par l'obéissance à Toi, et ne m'humilie pas par la désobéissance.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Mou'izz » comme nom n'est pas dans le Coran ni dans un hadith authentique : le Coran utilise le verbe « Tu donnes l'honneur » (3:26). Beaucoup de savants le citent avec Al-Moudhill.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 24 and display_order = 24 and fiche_explication is null;

-- 25. Al-Mudhill
update public.allah_names set
  fiche_signification = $f$Celui qui humilie qui Il veut, avec justice.$f$,
  fiche_explication = $f$Celui qui humilie selon Sa sagesse. Celui qui s'oppose à Allah et persiste dans l'injustice finit humilié ; et personne ne peut honorer celui qu'Allah a humilié.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَتُعِزُّ مَنْ تَشَاءُ وَتُذِلُّ مَنْ تَشَاءُ ۖ بِيَدِكَ الْخَيْرُ ۖ إِنَّكَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ$f$,
  fiche_preuve_francais = $f$Tu donnes l'honneur à qui Tu veux et Tu humilies qui Tu veux. Le bien est dans Ta main. Tu es capable de toute chose.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Imran (3:26) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Dans l'invocation du qounoût de la prière du witr, que le Prophète ﷺ a apprise à Al-Hasan ibn 'Alî (Abou Dâwoud 1425).$f$,
  fiche_invocation_arabe = $f$إِنَّهُ لاَ يَذِلُّ مَنْ وَالَيْتَ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Celui que Tu protèges n'est jamais humilié.$f$,
  fiche_invocation_reference = $f$Abou Dâwoud n° 1425 — jugé authentique (sahîh) par Al-Albânî · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Moudhill » comme nom n'est pas dans le Coran ni dans un hadith authentique : le Coran utilise le verbe « Tu humilies » (3:26). Beaucoup de savants le citent seulement avec Al-Mou'izz.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 25 and display_order = 25 and fiche_explication is null;

-- 26. As-Samî'
update public.allah_names set
  fiche_signification = $f$Celui qui entend tout : les paroles, les secrets et les invocations.$f$,
  fiche_explication = $f$Celui qui entend tout sans exception. Il entend la voix de chacun, dans toutes les langues, en même temps, même ce qu'on dit tout bas dans son cœur. Il entend et Il répond aux invocations.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$لَيْسَ كَمِثْلِهِ شَيْءٌ ۖ وَهُوَ السَّمِيعُ الْبَصِيرُ$f$,
  fiche_preuve_francais = $f$Rien ne Lui ressemble. Il est Celui qui entend tout (As-Samî'), Celui qui voit tout.$f$,
  fiche_preuve_reference = $f$Coran, sourate Ash-Shura (42:11) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$En se relevant de l'inclinaison (roukoû') dans la prière, on dit « Sami'a-llâhou li-man hamidah » : « Allah entend celui qui Le loue » (Al-Boukhârî 789).$f$,
  fiche_invocation_arabe = $f$سَمِعَ اللَّهُ لَمِنْ حَمِدَهُ‏$f$,
  fiche_invocation_phonetique = $f$Sami'a-llâhou li-man hamidah$f$,
  fiche_invocation_francais = $f$Allah entend celui qui Le loue.$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 789 · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 26 and display_order = 26 and fiche_explication is null;

-- 27. Al-Basîr
update public.allah_names set
  fiche_signification = $f$Celui qui voit tout, même ce qui est caché.$f$,
  fiche_explication = $f$Celui qui voit tout dans les moindres détails. Il voit tout ce que nous faisons, même dans le noir ou en cachette. Savoir qu'Allah nous voit aide à bien se comporter, même seul.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$لَيْسَ كَمِثْلِهِ شَيْءٌ ۖ وَهُوَ السَّمِيعُ الْبَصِيرُ$f$,
  fiche_preuve_francais = $f$Rien ne Lui ressemble. Il est Celui qui entend tout, Celui qui voit tout (Al-Basîr).$f$,
  fiche_preuve_reference = $f$Coran, sourate Ash-Shura (42:11) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout quand on veut bien agir, même quand personne ne nous voit.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Basîr, Tu me vois : aide-moi à faire ce qui Te plaît, même quand je suis seul.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 27 and display_order = 27 and fiche_explication is null;

-- 28. Al-Hakam
update public.allah_names set
  fiche_signification = $f$Le Juge : c'est Lui qui juge entre les gens, avec vérité.$f$,
  fiche_explication = $f$Celui dont le jugement est définitif et parfait. Personne ne peut annuler Son jugement. Le Jour du Jugement, Il jugera entre toutes les créatures avec une justice parfaite.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$أَفَغَيْرَ اللَّهِ أَبْتَغِي حَكَمًا$f$,
  fiche_preuve_francais = $f$Chercherai-je un autre juge qu'Allah ?$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-An'am (6:114) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Au début de la prière de la nuit : le Prophète ﷺ commençait sa prière par cette invocation (Mouslim 770).$f$,
  fiche_invocation_arabe = $f$أَنْتَ تَحْكُمُ بَيْنَ عِبَادِكَ فِيمَا كَانُوا فِيهِ يَخْتَلِفُونَ اهْدِنِي لِمَا اخْتُلِفَ فِيهِ مِنَ الْحَقِّ بِإِذْنِكَ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$C'est Toi qui juges entre Tes serviteurs dans ce sur quoi ils ne sont pas d'accord. Guide-moi, par Ta permission, vers la vérité dans ce sur quoi on n'est pas d'accord.$f$,
  fiche_invocation_reference = $f$Mouslim n° 770 · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = $f$Le nom avec l'article (« Allah est Al-Hakam ») est dans le hadith d'Abou Dâwoud 4955 (jugé authentique par Al-Albânî).$f$,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 28 and display_order = 28 and fiche_explication is null;

-- 29. Al-'Adl
update public.allah_names set
  fiche_signification = $f$Le Juste : Il ne fait jamais d'injustice.$f$,
  fiche_explication = $f$Celui dont la justice est parfaite. Allah ne fait de tort à personne, même du poids d'un atome. Chaque bonne action sera récompensée et rien ne sera oublié.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَتَمَّتْ كَلِمَتُ رَبِّكَ صِدْقًا وَعَدْلًا$f$,
  fiche_preuve_francais = $f$La parole de ton Seigneur s'est accomplie en vérité et en justice.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-An'am (6:115) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout quand on subit une injustice.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, Toi le Juste, aide-moi à être juste avec tout le monde, et protège-moi de l'injustice.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Le sens est sûr : Allah est parfaitement juste. Mais « Al-'Adl » comme nom n'est ni dans le Coran ni dans un hadith authentique ; c'est pourquoi des savants ne le comptent pas parmi les noms, et le citent comme une qualité d'Allah.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 29 and display_order = 29 and fiche_explication is null;

-- 30. Al-Latîf
update public.allah_names set
  fiche_signification = $f$Le Très Doux : Il arrange tout avec finesse, même ce qu'on ne voit pas.$f$,
  fiche_explication = $f$Celui qui est bienveillant et subtil. Il connaît les détails les plus fins, et Il fait arriver le bien à Ses serviteurs par des chemins qu'ils ne voient pas, comme pour le prophète Yoûsouf.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ اللَّطِيفُ الْخَبِيرُ$f$,
  fiche_preuve_francais = $f$Celui qui a créé ne connaîtrait-Il pas (Sa création), alors que c'est Lui le Doux et Subtil (Al-Latîf), Celui qui connaît tout en détail ?$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Mulk (67:14) · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout dans les moments durs, quand on ne voit pas d'issue.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Latîf, sois doux avec moi dans ce que Tu as décidé pour moi.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 30 and display_order = 30 and fiche_explication is null;

-- 31. Al-Khabîr
update public.allah_names set
  fiche_signification = $f$Celui qui connaît le fond et le secret de toute chose.$f$,
  fiche_explication = $f$Celui qui connaît tous les secrets. Al-Khabîr ne connaît pas seulement ce qu'on voit : Il connaît le fond des choses, les intentions et ce qui va en sortir.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$لَا تُدْرِكُهُ الْأَبْصَارُ وَهُوَ يُدْرِكُ الْأَبْصَارَ ۖ وَهُوَ اللَّطِيفُ الْخَبِيرُ$f$,
  fiche_preuve_francais = $f$Les regards ne peuvent l'atteindre, cependant qu'Il saisit tous les regards. Et Il est le Doux, le Parfaitement Connaisseur.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-An'am (6:103) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, par exemple avant une décision.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Khabîr, Tu connais ce qui est bon pour moi : choisis pour moi le meilleur.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 31 and display_order = 31 and fiche_explication is null;

-- 32. Al-Halîm
update public.allah_names set
  fiche_signification = $f$Le Très Patient et Indulgent : Il ne se presse pas de punir.$f$,
  fiche_explication = $f$Celui qui ne Se hâte pas de punir. Allah voit les fautes de Ses serviteurs, et Il leur laisse le temps de se repentir. Ce n'est pas de la faiblesse : Il en a le pouvoir, mais Il est indulgent.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَاعْلَمُوا أَنَّ اللَّهَ غَفُورٌ حَلِيمٌ$f$,
  fiche_preuve_francais = $f$Et sachez qu'Allah est Pardonneur et Indulgent (Halîm).$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Baqara (2:235) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Dans un moment d'angoisse ou de grande peine : le Prophète ﷺ disait cette invocation dans la détresse (Al-Boukhârî 6346).$f$,
  fiche_invocation_arabe = $f$لاَ إِلَهَ إِلاَّ اللَّهُ الْعَظِيمُ الْحَلِيمُ$f$,
  fiche_invocation_phonetique = $f$Lâ ilâha illa-llâhou-l-'azîmou-l-halîm$f$,
  fiche_invocation_francais = $f$Il n'y a pas de divinité à part Allah, l'Immense (Al-'Azîm), l'Indulgent (Al-Halîm).$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 6346 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 32 and display_order = 32 and fiche_explication is null;

-- 33. Al-'Azîm
update public.allah_names set
  fiche_signification = $f$L'Immense : Sa grandeur dépasse tout ce qu'on peut imaginer.$f$,
  fiche_explication = $f$Celui dont la grandeur est infinie. Le ciel, la terre et le Trône sont immenses, mais Allah est plus grand que tout. On ne peut pas imaginer Sa grandeur.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَهُوَ الْعَلِيُّ الْعَظِيمُ$f$,
  fiche_preuve_francais = $f$Il est le Très-Haut, l'Immense (Al-'Azîm).$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Baqara (2:255) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Dans l'inclinaison (roukoû') de la prière : le Prophète ﷺ y disait « Soubhâna rabbiya-l-'azîm » (Mouslim 772).$f$,
  fiche_invocation_arabe = $f$سُبْحَانَ رَبِّيَ الْعَظِيمِ$f$,
  fiche_invocation_phonetique = $f$Soubhâna rabbiya-l-'azîm$f$,
  fiche_invocation_francais = $f$Gloire à mon Seigneur, l'Immense.$f$,
  fiche_invocation_reference = $f$Mouslim n° 772 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 33 and display_order = 33 and fiche_explication is null;

-- 34. Al-Ghafûr
update public.allah_names set
  fiche_signification = $f$Celui qui pardonne et qui cache les fautes.$f$,
  fiche_explication = $f$Celui qui pardonne et recouvre les péchés. Le mot vient de « couvrir » : Allah cache les fautes de Son serviteur et le protège de leurs conséquences. Aucun péché n'est trop grand pour Son pardon, si on se repent.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ$f$,
  fiche_preuve_francais = $f$Allah pardonne tous les péchés. C'est Lui le Pardonneur (Al-Ghafoûr), le Très Miséricordieux.$f$,
  fiche_preuve_reference = $f$Coran, sourate Az-Zumar (39:53) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Pendant la prière : c'est l'invocation que le Prophète ﷺ a apprise à Abou Bakr pour sa prière (Al-Boukhârî 834).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا وَلاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ، وَارْحَمْنِي إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, je me suis fait beaucoup de tort à moi-même, et personne ne pardonne les péchés sauf Toi. Pardonne-moi d'un pardon venant de Toi, et fais-moi miséricorde. Tu es le Pardonneur (Al-Ghafoûr), le Très Miséricordieux.$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 834 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 34 and display_order = 34 and fiche_explication is null;

-- 35. Ash-Shakûr
update public.allah_names set
  fiche_signification = $f$Le Très Reconnaissant : Il récompense beaucoup pour une petite bonne action.$f$,
  fiche_explication = $f$Celui qui récompense généreusement. Allah accepte même une petite bonne action faite sincèrement, et Il la multiplie. Celui qui Le remercie, Il lui donne encore plus.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَقَالُوا الْحَمْدُ لِلَّهِ الَّذِي أَذْهَبَ عَنَّا الْحَزَنَ ۖ إِنَّ رَبَّنَا لَغَفُورٌ شَكُورٌ$f$,
  fiche_preuve_francais = $f$Et ils diront: «Louange à Allah qui a écarté de nous l'affliction. Notre Seigneur est certes Pardonneur et Reconnaissant.$f$,
  fiche_preuve_reference = $f$Coran, sourate Fatir (35:34) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Après chaque prière : le Prophète ﷺ a conseillé à Mou'âdh de dire cette invocation à la fin de chaque prière (Abou Dâwoud 1522).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ$f$,
  fiche_invocation_phonetique = $f$Allâhoumma a'innî 'alâ dhikrika wa choukrika wa housni 'ibâdatik$f$,
  fiche_invocation_francais = $f$Ô Allah, aide-moi à me souvenir de Toi, à Te remercier et à bien T'adorer.$f$,
  fiche_invocation_reference = $f$Abou Dâwoud n° 1522 — jugé authentique (sahîh) par Al-Albânî · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 35 and display_order = 35 and fiche_explication is null;

-- 36. Al-'Alî
update public.allah_names set
  fiche_signification = $f$Le Très-Haut : Il est au-dessus de toute chose.$f$,
  fiche_explication = $f$Celui qui est au-dessus de toute chose. Allah est au-dessus de Son Trône, comme Il l'a dit (20:5), sans qu'on sache comment : l'imam Mâlik a dit « l'istiwâ' est connu, le comment est inconnu ». Il est aussi élevé par Sa valeur et par Sa force. Rien n'est au-dessus de Lui.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۖ وَهُوَ الْعَلِيُّ الْعَظِيمُ$f$,
  fiche_preuve_francais = $f$A Lui appartient ce qui est dans les cieux et ce qui est sur la terre. Et Il est le Sublime, le Très Grand,$f$,
  fiche_preuve_reference = $f$Coran, sourate Ash-Shura (42:4) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Dans la prosternation (soujoûd) : le Prophète ﷺ y disait « Soubhâna rabbiya-l-a'lâ » (Mouslim 772).$f$,
  fiche_invocation_arabe = $f$سُبْحَانَ رَبِّيَ الأَعْلَى$f$,
  fiche_invocation_phonetique = $f$Soubhâna rabbiya-l-a'lâ$f$,
  fiche_invocation_francais = $f$Gloire à mon Seigneur, le Très-Haut.$f$,
  fiche_invocation_reference = $f$Mouslim n° 772 · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 36 and display_order = 36 and fiche_explication is null;

-- 37. Al-Kabîr
update public.allah_names set
  fiche_signification = $f$Le Très Grand : plus grand que tout.$f$,
  fiche_explication = $f$Celui dont la grandeur dépasse toute compréhension. C'est le sens de « Allâhou akbar » : Allah est plus grand que tout ce qui existe et que tout ce qu'on peut imaginer.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَأَنَّ اللَّهَ هُوَ الْعَلِيُّ الْكَبِيرُ$f$,
  fiche_preuve_francais = $f$Et Allah est le Très-Haut, le Très Grand (Al-Kabîr).$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hajj (22:62) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Dans la prière : un compagnon l'a dite pendant la prière avec le Prophète ﷺ, qui a dit : « Je me suis émerveillé : les portes du ciel se sont ouvertes pour elle » (Mouslim 601).$f$,
  fiche_invocation_arabe = $f$اللَّهُ أَكْبَرُ كَبِيرًا وَالْحَمْدُ لِلَّهِ كَثِيرًا وَسُبْحَانَ اللَّهِ بُكْرَةً وَأَصِيلاً$f$,
  fiche_invocation_phonetique = $f$Allâhou akbarou kabîran, wa-l-hamdou lillâhi kathîran, wa soubhâna-llâhi boukratan wa asîlâ$f$,
  fiche_invocation_francais = $f$Allah est le plus Grand, vraiment grand ; louange abondante à Allah ; gloire à Allah matin et soir.$f$,
  fiche_invocation_reference = $f$Mouslim n° 601 · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 37 and display_order = 37 and fiche_explication is null;

-- 38. Al-Hafîz
update public.allah_names set
  fiche_signification = $f$Le Gardien : Il protège et Il garde tout.$f$,
  fiche_explication = $f$Celui qui préserve tout dans Sa garde. Il garde le ciel et la terre, Il garde les actions de Ses serviteurs, et Il protège celui qui respecte Ses limites.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّ رَبِّي عَلَىٰ كُلِّ شَيْءٍ حَفِيظٌ$f$,
  fiche_preuve_francais = $f$Mon Seigneur garde toute chose (Hafîz).$f$,
  fiche_preuve_reference = $f$Coran, sourate Hud (11:57) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Le matin et le soir : le Prophète ﷺ ne laissait pas cette invocation le matin et le soir (Abou Dâwoud 5074).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَىَّ وَمِنْ خَلْفِي وَعَنْ يَمِينِي وَعَنْ شِمَالِي وَمِنْ فَوْقِي$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, protège-moi devant moi, derrière moi, à ma droite, à ma gauche et au-dessus de moi.$f$,
  fiche_invocation_reference = $f$Abou Dâwoud n° 5074 — jugé authentique (sahîh) par Al-Albânî · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 38 and display_order = 38 and fiche_explication is null;

-- 39. Al-Muqît
update public.allah_names set
  fiche_signification = $f$Celui qui donne à chaque créature sa nourriture et sa force, et qui veille sur tout.$f$,
  fiche_explication = $f$Celui qui nourrit et soutient toute créature. Allah donne à chaque être ce qui le fait vivre, au bon moment. Al-Mouqît veut dire aussi Celui qui garde et qui est témoin de toute chose.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَكَانَ اللَّهُ عَلَىٰ كُلِّ شَيْءٍ مُقِيتًا$f$,
  fiche_preuve_francais = $f$Et Allah veille sur toute chose (Mouqît).$f$,
  fiche_preuve_reference = $f$Coran, sourate An-Nisa (4:85) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, par exemple avant de manger.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Mouqît, nourris mon corps de ce qui est permis et mon cœur de la foi.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Les savants donnent deux sens à ce mot dans le verset 4:85 : Celui qui donne la nourriture (al-qoût), ou Celui qui garde et qui est témoin de tout. Les deux sens sont justes pour Allah.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 39 and display_order = 39 and fiche_explication is null;

-- 40. Al-Hasîb
update public.allah_names set
  fiche_signification = $f$Celui qui suffit à Son serviteur, et qui compte tout.$f$,
  fiche_explication = $f$Celui qui tient compte de tout. Al-Hasîb a deux sens : Celui qui suffit (« Allah me suffit ») et Celui qui fera les comptes de chacun le Jour du Jugement.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَكَفَىٰ بِاللَّهِ حَسِيبًا$f$,
  fiche_preuve_francais = $f$Et Allah suffit pour tenir le compte (Hasîb).$f$,
  fiche_preuve_reference = $f$Coran, sourate An-Nisa (4:6) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout dans une difficulté, comme dans ce verset (9:129).$f$,
  fiche_invocation_arabe = $f$حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ ۖ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Allah me suffit. Il n'y a pas de divinité à part Lui. En Lui je place ma confiance, et Il est le Seigneur du Trône immense.$f$,
  fiche_invocation_reference = $f$Coran, sourate At-Tawba (9:129) — extrait du verset · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 40 and display_order = 40 and fiche_explication is null;

-- 41. Al-Jalîl
update public.allah_names set
  fiche_signification = $f$Le Majestueux : Sa majesté et Sa grandeur sont parfaites.$f$,
  fiche_explication = $f$Celui dont la majesté est incomparable. Al-Jalîl réunit toutes les qualités de grandeur et de beauté. Le cœur du croyant Le respecte et L'aime en même temps.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$تَبَارَكَ اسْمُ رَبِّكَ ذِي الْجَلَالِ وَالْإِكْرَامِ$f$,
  fiche_preuve_francais = $f$Béni soit le Nom de ton Seigneur, Plein de Majesté et de Munificence!$f$,
  fiche_preuve_reference = $f$Coran, sourate Ar-Rahman (55:78) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Jalîl, remplis mon cœur de respect et d'amour pour Toi.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Jalîl » n'est pas dans le Coran comme nom : le Coran dit « Dhoul-Jalâl » (Possesseur de la Majesté, 55:78). C'est pourquoi des savants ne le comptent pas dans les 99 noms.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 41 and display_order = 41 and fiche_explication is null;

-- 42. Al-Karîm
update public.allah_names set
  fiche_signification = $f$Le Très Généreux : Il donne beaucoup, même à celui qui ne le mérite pas.$f$,
  fiche_explication = $f$Celui dont la générosité est sans limites. Il donne avant qu'on demande, Il pardonne beaucoup, et Il ne fait pas honte à celui qui revient vers Lui.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$يَا أَيُّهَا الْإِنْسَانُ مَا غَرَّكَ بِرَبِّكَ الْكَرِيمِ$f$,
  fiche_preuve_francais = $f$O homme! Qu'est-ce qui t'a trompé au sujet de ton Seigneur, le Noble,$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Infitar (82:6) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout quand on demande une faveur.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Karîm, sois généreux avec moi, et ne me prive pas de Ton bien à cause de mes fautes.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 42 and display_order = 42 and fiche_explication is null;

-- 43. Ar-Raqîb
update public.allah_names set
  fiche_signification = $f$Le Vigilant : Il nous observe sans jamais s'arrêter.$f$,
  fiche_explication = $f$Celui qui surveille tout en permanence. Il voit nos actions, entend nos paroles et connaît nos pensées, à chaque instant. Le croyant qui sait cela fait attention à ce qu'il fait.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّ اللَّهَ كَانَ عَلَيْكُمْ رَقِيبًا$f$,
  fiche_preuve_francais = $f$Allah vous observe parfaitement (Raqîb).$f$,
  fiche_preuve_reference = $f$Coran, sourate An-Nisa (4:1) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Raqîb, aide-moi à me souvenir que Tu me vois, pour que je fasse le bien.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = $f$Voir aussi 5:117.$f$,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 43 and display_order = 43 and fiche_explication is null;

-- 44. Al-Mujîb
update public.allah_names set
  fiche_signification = $f$Celui qui répond aux invocations.$f$,
  fiche_explication = $f$Celui qui répond aux prières. Allah est proche et Il répond à celui qui L'appelle : soit Il donne ce qu'on a demandé, soit Il éloigne un mal, soit Il garde la récompense pour l'au-delà.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّ رَبِّي قَرِيبٌ مُجِيبٌ$f$,
  fiche_preuve_francais = $f$Mon Seigneur est proche et Il répond (Moujîb).$f$,
  fiche_preuve_reference = $f$Coran, sourate Hud (11:61) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il y a des moments où l'invocation est particulièrement recommandée : le dernier tiers de la nuit, quand Allah dit « Qui M'invoque, que Je lui réponde ? » (Al-Boukhârî 1145), et la prosternation : « Le serviteur n'est jamais aussi proche de son Seigneur que lorsqu'il est prosterné : multipliez-y les invocations » (Mouslim 482).$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Moujîb, réponds à mes invocations, et donne-moi ce qui est bon pour moi dans ce monde et dans l'au-delà.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 44 and display_order = 44 and fiche_explication is null;

-- 45. Al-Wâsi'
update public.allah_names set
  fiche_signification = $f$Le Vaste : Sa miséricorde, Sa science et Sa générosité n'ont pas de limite.$f$,
  fiche_explication = $f$Celui dont la miséricorde est immense. Sa science, Son pouvoir et Sa générosité englobent toute chose. Personne ne peut épuiser ce qu'Il possède.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّ اللَّهَ وَاسِعٌ عَلِيمٌ$f$,
  fiche_preuve_francais = $f$Allah est Vaste (Wâsi') et Il sait tout.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Baqara (2:115) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout quand on se sent à l'étroit ou qu'on a besoin de beaucoup.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Wâsi', élargis pour moi Ta miséricorde et Tes bienfaits.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 45 and display_order = 45 and fiche_explication is null;

-- 46. Al-Hakîm
update public.allah_names set
  fiche_signification = $f$Le Sage : Il fait chaque chose à sa place, pour une bonne raison.$f$,
  fiche_explication = $f$Celui dont la sagesse est parfaite. Tout ce qu'Allah ordonne ou décide a une raison juste, même si on ne la comprend pas toujours. Il est aussi Celui qui juge avec perfection.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$قَالُوا سُبْحَانَكَ لَا عِلْمَ لَنَا إِلَّا مَا عَلَّمْتَنَا ۖ إِنَّكَ أَنْتَ الْعَلِيمُ الْحَكِيمُ$f$,
  fiche_preuve_francais = $f$- Ils dirent: «Gloire à Toi! Nous n'avons de savoir que ce que Tu nous a appris. Certes c'est Toi l'Omniscient, le Sage».$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Baqara (2:32) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = $f$رَبَّنَا لَا تَجْعَلْنَا فِتْنَةً لِلَّذِينَ كَفَرُوا وَاغْفِرْ لَنَا رَبَّنَا ۖ إِنَّكَ أَنْتَ الْعَزِيزُ الْحَكِيمُ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Seigneur, ne fais pas de nous [un sujet] de tentation pour ceux qui ont mécru; et pardonne-nous, Seigneur, car c'est Toi le Puissant, le Sage».$f$,
  fiche_invocation_reference = $f$Coran, sourate Al-Mumtahina (60:5) · traduction de Muhammad Hamidullah$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 46 and display_order = 46 and fiche_explication is null;

-- 47. Al-Wadûd
update public.allah_names set
  fiche_signification = $f$Celui qui aime Ses serviteurs croyants, et qui est aimé d'eux.$f$,
  fiche_explication = $f$Celui qui aime Ses serviteurs. Allah aime ceux qui se repentent, qui font le bien et qui sont patients, et Il met de l'amour pour eux dans les cœurs. Le croyant L'aime plus que tout.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَهُوَ الْغَفُورُ الْوَدُودُ$f$,
  fiche_preuve_francais = $f$Et c'est Lui le Pardonneur, le Tout-Affectueux,$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Buruj (85:14) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout quand on se sent seul ou triste.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Wadoûd, accorde-moi Ton amour, et l'amour de ceux qui T'aiment.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = $f$Voir aussi 11:90.$f$,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 47 and display_order = 47 and fiche_explication is null;

-- 48. Al-Majîd
update public.allah_names set
  fiche_signification = $f$Le Glorieux : Sa gloire et Sa noblesse sont immenses.$f$,
  fiche_explication = $f$Celui dont la gloire est infinie. Al-Majîd réunit la grandeur, la beauté et la générosité. On Le glorifie dans la prière sur le Prophète ﷺ (« innaka hamîdoun majîd »).$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّهُ حَمِيدٌ مَجِيدٌ$f$,
  fiche_preuve_francais = $f$Il est Digne de louange et Glorieux (Majîd).$f$,
  fiche_preuve_reference = $f$Coran, sourate Hud (11:73) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Dans le tachahhoud de la prière, avec la prière sur le Prophète ﷺ (Al-Boukhârî 3370).$f$,
  fiche_invocation_arabe = $f$إِنَّكَ حَمِيدٌ مَجِيدٌ$f$,
  fiche_invocation_phonetique = $f$Innaka hamîdoun majîd$f$,
  fiche_invocation_francais = $f$Tu es Digne de louange (Hamîd) et Glorieux (Majîd).$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 3370 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 48 and display_order = 48 and fiche_explication is null;

-- 49. Al-Bâ'ith
update public.allah_names set
  fiche_signification = $f$Celui qui ressuscite les morts et qui envoie les messagers.$f$,
  fiche_explication = $f$Celui qui ressuscite les morts. Le Jour de la Résurrection, Allah fera revenir à la vie toutes les créatures pour les juger. Il est aussi Celui qui a envoyé les prophètes.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَأَنَّ اللَّهَ يَبْعَثُ مَنْ فِي الْقُبُورِ$f$,
  fiche_preuve_francais = $f$Et Allah ressuscitera ceux qui sont dans les tombes.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hajj (22:7) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, le jour où Tu ressusciteras les gens, fais-moi revenir parmi les croyants.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Bâ'ith » comme nom n'est ni dans le Coran ni dans un hadith authentique : le Coran utilise le verbe « Allah ressuscite » (22:7). Des savants ne le comptent donc pas parmi les noms.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 49 and display_order = 49 and fiche_explication is null;

-- 50. Ash-Shahîd
update public.allah_names set
  fiche_signification = $f$Le Témoin : Il est présent et Il voit tout ce qui se passe.$f$,
  fiche_explication = $f$Celui qui est témoin de tout. Rien ne se passe sans qu'Allah le voie et le sache. Il est témoin de la vérité de Ses prophètes et de ce que font les gens.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّ اللَّهَ عَلَىٰ كُلِّ شَيْءٍ شَهِيدٌ$f$,
  fiche_preuve_francais = $f$Allah est témoin de toute chose (Chahîd).$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hajj (22:17) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Chahîd, Tu sais ce qui est dans mon cœur : rends-le sincère.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 50 and display_order = 50 and fiche_explication is null;

-- 51. Al-Haqq
update public.allah_names set
  fiche_signification = $f$Le Vrai : Il existe vraiment, et tout ce qui vient de Lui est vrai.$f$,
  fiche_explication = $f$Celui dont l'existence est une certitude absolue. Sa parole est vraie, Sa promesse est vraie, le Paradis et l'Enfer sont vrais. Tout ce qu'on adore à côté de Lui est faux.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$ذَٰلِكَ بِأَنَّ اللَّهَ هُوَ الْحَقُّ$f$,
  fiche_preuve_francais = $f$Cela, parce qu'Allah est le Vrai (Al-Haqq).$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hajj (22:6) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Dans la prière de la nuit : le Prophète ﷺ disait cette invocation quand il se levait la nuit pour prier (Al-Boukhârî 1120).$f$,
  fiche_invocation_arabe = $f$أَنْتَ الْحَقُّ، وَوَعْدُكَ الْحَقُّ، وَلِقَاؤُكَ حَقٌّ، وَقَوْلُكَ حَقٌّ، وَالْجَنَّةُ حَقٌّ، وَالنَّارُ حَقٌّ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Tu es le Vrai (Al-Haqq), Ta promesse est vraie, Ta rencontre est vraie, Ta parole est vraie, le Paradis est vrai et l'Enfer est vrai.$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 1120 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 51 and display_order = 51 and fiche_explication is null;

-- 52. Al-Wakîl
update public.allah_names set
  fiche_signification = $f$Celui à qui on confie toutes ses affaires, et qui s'en occupe parfaitement.$f$,
  fiche_explication = $f$Celui en qui l'on peut se confier totalement. Le croyant fait ce qu'il peut, puis il confie le résultat à Allah, qui s'occupe de tout mieux que personne.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ$f$,
  fiche_preuve_francais = $f$Allah nous suffit, et quel excellent Garant (Wakîl) !$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Imran (3:173) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Quand on a peur ou qu'on est en danger : Ibrâhîm l'a dit quand on l'a jeté dans le feu, et le Prophète Mouhammad ﷺ l'a dit quand on lui a annoncé qu'une armée se rassemblait contre lui (Al-Boukhârî 4563).$f$,
  fiche_invocation_arabe = $f$حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ‏$f$,
  fiche_invocation_phonetique = $f$Hasbouna-llâhou wa ni'ma-l-wakîl$f$,
  fiche_invocation_francais = $f$Allah nous suffit, et quel excellent Garant !$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 4563 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 52 and display_order = 52 and fiche_explication is null;

-- 53. Al-Qawî
update public.allah_names set
  fiche_signification = $f$Le Très Fort : Sa force est parfaite, rien ne Le fatigue.$f$,
  fiche_explication = $f$Celui dont la force est parfaite. Allah n'est jamais fatigué ni faible. Toute la force des créatures vient de Lui : c'est le sens de « Lâ hawla wa lâ qouwwata illâ billâh ».$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَهُوَ الْقَوِيُّ الْعَزِيزُ$f$,
  fiche_preuve_francais = $f$Il est le Fort (Al-Qawî), le Tout-Puissant.$f$,
  fiche_preuve_reference = $f$Coran, sourate Ash-Shura (42:19) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$À tout moment, surtout devant une chose difficile. Le Prophète ﷺ a dit de cette parole : « c'est un trésor parmi les trésors du Paradis » (Al-Boukhârî 6384).$f$,
  fiche_invocation_arabe = $f$لاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ‏$f$,
  fiche_invocation_phonetique = $f$Lâ hawla wa lâ qouwwata illâ billâh$f$,
  fiche_invocation_francais = $f$Il n'y a de force et de puissance que par Allah.$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 6384 · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 53 and display_order = 53 and fiche_explication is null;

-- 54. Al-Matîn
update public.allah_names set
  fiche_signification = $f$Le Ferme : Sa force est solide, rien ne peut l'ébranler.$f$,
  fiche_explication = $f$Celui dont la puissance est inébranlable. Sa force ne diminue jamais et ne connaît aucune limite. Il n'a besoin d'aucune aide.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ$f$,
  fiche_preuve_francais = $f$En vérité, c'est Allah qui est le Grand Pourvoyeur, Le Détenteur de la force, l'Inébranlable.$f$,
  fiche_preuve_reference = $f$Coran, sourate Adh-Dhariyat (51:58) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Matîn, rends ma foi solide et affermis-moi sur Ton chemin.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 54 and display_order = 54 and fiche_explication is null;

-- 55. Al-Walî
update public.allah_names set
  fiche_signification = $f$Le Protecteur et l'Allié des croyants.$f$,
  fiche_explication = $f$Celui qui protège et soutient les croyants. Il les aide, les guide et les fait sortir des ténèbres vers la lumière. Celui dont Allah est l'allié n'est jamais perdu.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$اللَّهُ وَلِيُّ الَّذِينَ آمَنُوا يُخْرِجُهُمْ مِنَ الظُّلُمَاتِ إِلَى النُّورِ$f$,
  fiche_preuve_francais = $f$Allah est l'Allié (Walî) de ceux qui ont cru : Il les fait sortir des ténèbres vers la lumière.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Baqara (2:257) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment. C'est l'invocation du prophète Yoûsouf, à la fin de son histoire (Coran 12:101).$f$,
  fiche_invocation_arabe = $f$أَنْتَ وَلِيِّي فِي الدُّنْيَا وَالْآخِرَةِ ۖ تَوَفَّنِي مُسْلِمًا وَأَلْحِقْنِي بِالصَّالِحِينَ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Tu es mon Protecteur (Walî) dans ce monde et dans l'au-delà. Fais-moi mourir musulman et fais-moi rejoindre les vertueux.$f$,
  fiche_invocation_reference = $f$Coran, sourate Yusuf (12:101) — extrait du verset · traduction simple du sens$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 55 and display_order = 55 and fiche_explication is null;

-- 56. Al-Hamîd
update public.allah_names set
  fiche_signification = $f$Celui qui mérite toutes les louanges.$f$,
  fiche_explication = $f$Celui qui mérite toutes les louanges. On Le loue pour ce qu'Il est (Ses noms et Ses qualités) et pour ce qu'Il donne. C'est le sens de « Al-hamdou lillâh ».$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَهُوَ الْوَلِيُّ الْحَمِيدُ$f$,
  fiche_preuve_francais = $f$Il est le Protecteur, le Digne de louange (Al-Hamîd).$f$,
  fiche_preuve_reference = $f$Coran, sourate Ash-Shura (42:28) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Dans le tachahhoud de la prière, avec la prière sur le Prophète ﷺ (Al-Boukhârî 3370).$f$,
  fiche_invocation_arabe = $f$إِنَّكَ حَمِيدٌ مَجِيدٌ$f$,
  fiche_invocation_phonetique = $f$Innaka hamîdoun majîd$f$,
  fiche_invocation_francais = $f$Tu es Digne de louange (Hamîd) et Glorieux.$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 3370 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 56 and display_order = 56 and fiche_explication is null;

-- 57. Al-Muhsî
update public.allah_names set
  fiche_signification = $f$Celui qui compte tout, sans rien oublier.$f$,
  fiche_explication = $f$Celui qui comptabilise tout sans exception. Allah connaît le nombre de chaque chose : les gouttes de pluie, les grains de sable, les actions de chacun.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$لَقَدْ أَحْصَاهُمْ وَعَدَّهُمْ عَدًّا$f$,
  fiche_preuve_francais = $f$Il les a certes dénombrés et bien comptés.$f$,
  fiche_preuve_reference = $f$Coran, sourate Maryam (19:94) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, Toi qui comptes tout, compte mes bonnes actions et efface mes mauvaises.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Mouhsî » comme nom n'est ni dans le Coran ni dans un hadith authentique : le Coran utilise le verbe « Il les a comptés » (19:94). Des savants ne le comptent donc pas parmi les noms.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 57 and display_order = 57 and fiche_explication is null;

-- 58. Al-Mubdi'
update public.allah_names set
  fiche_signification = $f$Celui qui a commencé la création une première fois.$f$,
  fiche_explication = $f$Celui qui crée pour la première fois. Allah a créé les choses sans modèle, alors qu'elles n'existaient pas.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّهُ هُوَ يُبْدِئُ وَيُعِيدُ$f$,
  fiche_preuve_francais = $f$C'est Lui, certes, qui commence (la création) et la refait.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Buruj (85:13) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, Toi qui as commencé la création, fais que mon commencement et ma fin soient bons.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Moubdi' » comme nom n'est ni dans le Coran ni dans un hadith authentique : le Coran utilise le verbe « Il commence » (85:13). Des savants ne le comptent donc pas parmi les noms.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 58 and display_order = 58 and fiche_explication is null;

-- 59. Al-Mu'îd
update public.allah_names set
  fiche_signification = $f$Celui qui recréera les créatures après leur mort.$f$,
  fiche_explication = $f$Celui qui recréera après la mort. Celui qui a créé une première fois peut recréer encore plus facilement : c'est une preuve de la résurrection.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّهُ هُوَ يُبْدِئُ وَيُعِيدُ$f$,
  fiche_preuve_francais = $f$C'est Lui, certes, qui commence (la création) et la refait.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Buruj (85:13) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, quand Tu nous ramèneras à la vie, fais-moi revenir parmi ceux que Tu aimes.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Mou'îd » comme nom n'est ni dans le Coran ni dans un hadith authentique : le Coran utilise le verbe « Il recommence » (85:13). Des savants ne le comptent donc pas parmi les noms.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 59 and display_order = 59 and fiche_explication is null;

-- 60. Al-Muhyî
update public.allah_names set
  fiche_signification = $f$Celui qui donne la vie.$f$,
  fiche_explication = $f$Celui qui insuffle la vie. Il donne la vie aux êtres, à la terre morte quand la pluie tombe, et Il redonnera la vie aux morts le Jour de la Résurrection.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّ ذَٰلِكَ لَمُحْيِي الْمَوْتَىٰ ۖ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ$f$,
  fiche_preuve_francais = $f$Celui-là est vraiment Celui qui redonne la vie aux morts (Mouhyî), et Il est capable de toute chose.$f$,
  fiche_preuve_reference = $f$Coran, sourate Ar-Rum (30:50) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Au réveil : le Prophète ﷺ disait cette invocation en se réveillant (Al-Boukhârî 6312).$f$,
  fiche_invocation_arabe = $f$الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ$f$,
  fiche_invocation_phonetique = $f$Al-hamdou lillâhi-lladhî ahyânâ ba'da mâ amâtanâ wa ilayhi-n-nouchoûr$f$,
  fiche_invocation_francais = $f$Louange à Allah qui nous a redonné la vie après nous avoir fait mourir (le sommeil), et c'est vers Lui que sera la résurrection.$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 6312 · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 60 and display_order = 60 and fiche_explication is null;

-- 61. Al-Mumît
update public.allah_names set
  fiche_signification = $f$Celui qui fait mourir, au moment qu'Il a fixé.$f$,
  fiche_explication = $f$Celui qui fait mourir selon Sa sagesse. Chaque être a un temps de vie fixé par Allah ; personne ne meurt avant ou après ce moment.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَإِنَّا لَنَحْنُ نُحْيِي وَنُمِيتُ وَنَحْنُ الْوَارِثُونَ$f$,
  fiche_preuve_francais = $f$Et c'est bien Nous qui donnons la vie et donnons la mort, et c'est Nous qui sommes l'héritier [de tout].$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hijr (15:23) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Avant de dormir et au réveil : le Prophète ﷺ disait « Bismika amoûtou wa ahyâ » en se couchant, et cette invocation en se réveillant (Al-Boukhârî 6312).$f$,
  fiche_invocation_arabe = $f$الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ$f$,
  fiche_invocation_phonetique = $f$Al-hamdou lillâhi-lladhî ahyânâ ba'da mâ amâtanâ wa ilayhi-n-nouchoûr$f$,
  fiche_invocation_francais = $f$Louange à Allah qui nous a redonné la vie après nous avoir fait mourir (le sommeil), et c'est vers Lui que sera la résurrection.$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 6312 · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Moumît » comme nom n'est pas dans le Coran sous cette forme : le Coran utilise le verbe « Nous faisons mourir » (15:23). Des savants ne le comptent donc pas parmi les noms.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 61 and display_order = 61 and fiche_explication is null;

-- 62. Al-Hayy
update public.allah_names set
  fiche_signification = $f$Le Vivant : Sa vie est parfaite, sans début et sans fin.$f$,
  fiche_explication = $f$Celui dont la vie est éternelle et parfaite. Il ne dort pas, ne se fatigue pas et ne meurt pas. Toute vie vient de Lui.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ$f$,
  fiche_preuve_francais = $f$Allah ! Il n'y a pas de divinité à part Lui, le Vivant (Al-Hayy), Celui qui subsiste par Lui-même.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Baqara (2:255) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Quand une chose nous inquiète beaucoup : le Prophète ﷺ disait alors cette invocation (At-Tirmidhî 3524).$f$,
  fiche_invocation_arabe = $f$يَا حَىُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ$f$,
  fiche_invocation_phonetique = $f$Yâ Hayyou yâ Qayyoûm, bi-rahmatika astaghîth$f$,
  fiche_invocation_francais = $f$Ô Vivant, Ô Celui qui subsiste par Lui-même, c'est Ta miséricorde que j'appelle au secours.$f$,
  fiche_invocation_reference = $f$At-Tirmidhî n° 3524 — jugé bon (hasan) par Al-Albânî · traduction simple du sens$f$,
  fiche_invocation_degre = $f$hasan$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 62 and display_order = 62 and fiche_explication is null;

-- 63. Al-Qayyûm
update public.allah_names set
  fiche_signification = $f$Celui qui subsiste par Lui-même et qui fait tenir toute chose.$f$,
  fiche_explication = $f$Celui qui se suffit à Lui-même et soutient tout. Il n'a besoin de personne, et rien ne peut exister ni tenir sans Lui : le ciel, la terre et chaque créature dépendent de Lui.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ$f$,
  fiche_preuve_francais = $f$Allah ! Il n'y a pas de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même (Al-Qayyoûm).$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Baqara (2:255) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Quand une chose nous inquiète beaucoup : le Prophète ﷺ disait alors cette invocation (At-Tirmidhî 3524).$f$,
  fiche_invocation_arabe = $f$يَا حَىُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ$f$,
  fiche_invocation_phonetique = $f$Yâ Hayyou yâ Qayyoûm, bi-rahmatika astaghîth$f$,
  fiche_invocation_francais = $f$Ô Vivant, Ô Celui qui subsiste par Lui-même, c'est Ta miséricorde que j'appelle au secours.$f$,
  fiche_invocation_reference = $f$At-Tirmidhî n° 3524 — jugé bon (hasan) par Al-Albânî · traduction simple du sens$f$,
  fiche_invocation_degre = $f$hasan$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 63 and display_order = 63 and fiche_explication is null;

-- 64. Al-Wâjid
update public.allah_names set
  fiche_signification = $f$Celui qui ne manque de rien et qui trouve tout ce qu'Il veut.$f$,
  fiche_explication = $f$Celui qui trouve tout ce qu'Il veut. Rien ne Lui manque et rien ne Lui échappe : tout ce qu'Il veut, Il l'a. Donner à toutes les créatures ne diminue en rien ce qu'Il possède.$f$,
  fiche_preuve_type = $f$hadith$f$,
  fiche_preuve_arabe = $f$فَسَأَلُونِي فَأَعْطَيْتُ كُلَّ إِنْسَانٍ مَسْأَلَتَهُ مَا نَقَصَ ذَلِكَ مِمَّا عِنْدِي$f$,
  fiche_preuve_francais = $f$(Allah dit :) « … s'ils Me demandaient, et que Je donnais à chacun ce qu'il demande, cela ne diminuerait rien de ce que Je possède. »$f$,
  fiche_preuve_reference = $f$Mouslim n° 2577 · traduction simple du sens$f$,
  fiche_preuve_degre = $f$sahih$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, Toi qui ne manques de rien, ne me laisse manquer de rien de ce qui est bon pour moi.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Wâjid » n'est ni dans le Coran ni dans un hadith authentique. Il vient seulement de la liste d'At-Tirmidhî ; beaucoup de savants ne le comptent pas parmi les noms. Le hadith ci-dessus montre seulement le sens (Allah ne manque de rien), pas le nom lui-même.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = $f$Nom sans preuve directe : la preuve affichée montre seulement le sens. À décider : garder la fiche telle quelle ou ajouter une phrase.$f$
where id = 64 and display_order = 64 and fiche_explication is null;

-- 65. Al-Mâjid
update public.allah_names set
  fiche_signification = $f$Le Noble : Sa noblesse et Sa générosité sont parfaites.$f$,
  fiche_explication = $f$Celui dont la noblesse est parfaite. Al-Mâjid a le même sens qu'Al-Majîd : la gloire, la grandeur et la générosité.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّهُ حَمِيدٌ مَجِيدٌ$f$,
  fiche_preuve_francais = $f$Il est Digne de louange et Glorieux (Majîd).$f$,
  fiche_preuve_reference = $f$Coran, sourate Hud (11:73) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Mâjid, sois généreux avec moi par Ta noblesse.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Mâjid » n'est pas dans le Coran sous cette forme (le Coran dit « Majîd », de la même racine, 11:73). Il vient de la liste d'At-Tirmidhî ; des savants ne le comptent pas comme un nom à part.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 65 and display_order = 65 and fiche_explication is null;

-- 66. Al-Wâhid
update public.allah_names set
  fiche_signification = $f$L'Unique : Il est seul, sans associé, sans égal.$f$,
  fiche_explication = $f$Celui qui est absolument unique. Il n'y a qu'un seul Dieu : Allah. Il n'a pas d'associé dans Sa seigneurie, ni dans l'adoration, ni dans Ses noms et Ses qualités.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَإِلَٰهُكُمْ إِلَٰهٌ وَاحِدٌ ۖ لَا إِلَٰهَ إِلَّا هُوَ الرَّحْمَٰنُ الرَّحِيمُ$f$,
  fiche_preuve_francais = $f$Et votre Divinité est une divinité unique. Pas de divinité à part Lui, le Tout Miséricordieux, le Très Miséricordieux.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Baqara (2:163) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Après chaque prière obligatoire : le Prophète ﷺ disait « Lâ ilâha illa-llâhou wahdahou lâ charîka lah… » (Al-Boukhârî 844).$f$,
  fiche_invocation_arabe = $f$لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ، وَلَهُ الْحَمْدُ، وَهْوَ عَلَى كُلِّ شَىْءٍ قَدِيرٌ$f$,
  fiche_invocation_phonetique = $f$Lâ ilâha illa-llâhou wahdahou lâ charîka lah, lahou-l-moulkou wa lahou-l-hamd, wa houwa 'alâ koulli chay'in qadîr$f$,
  fiche_invocation_francais = $f$Il n'y a pas de divinité à part Allah, Seul, sans associé. À Lui la royauté, à Lui la louange, et Il est capable de toute chose.$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 844 · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 66 and display_order = 66 and fiche_explication is null;

-- 67. Al-Ahad
update public.allah_names set
  fiche_signification = $f$L'Un : Il est unique, rien ne Lui ressemble.$f$,
  fiche_explication = $f$Celui qui est seul en son genre. Al-Ahad veut dire qu'Allah est Un, qu'Il ne peut pas être divisé et que rien ne Lui ressemble. C'est le premier verset de la sourate Al-Ikhlâs.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ قُلْ هُوَ اللَّهُ أَحَدٌ$f$,
  fiche_preuve_francais = $f$Dis: «Il est Allah, Unique.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Ikhlas (112:1) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Avant de demander quelque chose à Allah : le Prophète ﷺ a entendu un homme invoquer ainsi et a dit qu'il avait invoqué Allah par Son plus grand nom (Abou Dâwoud 1493).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ إِنِّي أَسْأَلُكَ أَنِّي أَشْهَدُ أَنَّكَ أَنْتَ اللَّهُ لاَ إِلَهَ إِلاَّ أَنْتَ الأَحَدُ الصَّمَدُ الَّذِي لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, je Te demande, car je témoigne que Tu es Allah, il n'y a pas de divinité à part Toi, l'Un (Al-Ahad), le Seul à être imploré (As-Samad), qui n'a pas engendré et n'a pas été engendré, et que nul n'égale.$f$,
  fiche_invocation_reference = $f$Abou Dâwoud n° 1493 — jugé authentique (sahîh) par Al-Albânî · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Dans la liste d'At-Tirmidhî (3507) de notre recueil, « Al-Ahad » n'apparaît pas (la liste commence par le nom « Allah ») ; il se trouve dans d'autres listes. Mais il est sûr que c'est un nom d'Allah : il est dans le Coran (112:1).

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 67 and display_order = 67 and fiche_explication is null;

-- 68. As-Samad
update public.allah_names set
  fiche_signification = $f$Celui vers qui tout le monde se tourne dans le besoin, et qui n'a besoin de personne.$f$,
  fiche_explication = $f$Celui dont tout le monde a besoin, alors que Lui n'a besoin de personne. On se tourne vers Lui pour chaque besoin, petit ou grand, et Il est parfait en toutes Ses qualités.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$اللَّهُ الصَّمَدُ$f$,
  fiche_preuve_francais = $f$Allah, Le Seul à être imploré pour ce que nous désirons.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Ikhlas (112:2) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Avant de demander quelque chose à Allah : le Prophète ﷺ a entendu un homme invoquer ainsi et a dit qu'il avait invoqué Allah par Son plus grand nom (Abou Dâwoud 1493).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ إِنِّي أَسْأَلُكَ أَنِّي أَشْهَدُ أَنَّكَ أَنْتَ اللَّهُ لاَ إِلَهَ إِلاَّ أَنْتَ الأَحَدُ الصَّمَدُ الَّذِي لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, je Te demande, car je témoigne que Tu es Allah, il n'y a pas de divinité à part Toi, l'Un, le Seul à être imploré (As-Samad), qui n'a pas engendré et n'a pas été engendré, et que nul n'égale.$f$,
  fiche_invocation_reference = $f$Abou Dâwoud n° 1493 — jugé authentique (sahîh) par Al-Albânî · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 68 and display_order = 68 and fiche_explication is null;

-- 69. Al-Qâdir
update public.allah_names set
  fiche_signification = $f$Le Capable : rien ne Lui est impossible.$f$,
  fiche_explication = $f$Celui qui a le pouvoir absolu. Allah peut faire tout ce qu'Il veut : créer, redonner la vie, changer une situation en un instant.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$أَلَيْسَ ذَٰلِكَ بِقَادِرٍ عَلَىٰ أَنْ يُحْيِيَ الْمَوْتَىٰ$f$,
  fiche_preuve_francais = $f$Celui-là [Allah] n'est-Il pas capable de faire revivre les morts?$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Qiyama (75:40) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Avant une décision importante : c'est l'invocation de l'istikhâra, que l'on dit après deux unités de prière surérogatoire (Al-Boukhârî 1166).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلاَ أَقْدِرُ وَتَعْلَمُ وَلاَ أَعْلَمُ وَأَنْتَ عَلاَّمُ الْغُيُوبِ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, je Te demande de choisir pour moi par Ta science, je Te demande la capacité par Ton pouvoir, et je Te demande de Ta grâce immense. Car Toi Tu peux et moi je ne peux pas, Tu sais et je ne sais pas, et Tu connais parfaitement ce qui est caché.$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 1166 · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 69 and display_order = 69 and fiche_explication is null;

-- 70. Al-Muqtadir
update public.allah_names set
  fiche_signification = $f$Le Tout-Puissant : Son pouvoir est total et parfait.$f$,
  fiche_explication = $f$Celui dont la puissance est parfaite. Al-Mouqtadir est encore plus fort qu'Al-Qâdir : Son pouvoir est complet, Il exécute tout ce qu'Il décide.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَكَانَ اللَّهُ عَلَىٰ كُلِّ شَيْءٍ مُقْتَدِرًا$f$,
  fiche_preuve_francais = $f$Et Allah est capable de toute chose (Mouqtadir).$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Kahf (18:45) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Mouqtadir, Tu peux tout : facilite-moi ce qui est difficile.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = $f$Voir aussi 54:55.$f$,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 70 and display_order = 70 and fiche_explication is null;

-- 71. Al-Muqaddim
update public.allah_names set
  fiche_signification = $f$Celui qui fait avancer ce qu'Il veut.$f$,
  fiche_explication = $f$Celui qui avance ce qu'Il veut. Il met en avant qui Il veut (par la foi, la science, le rang) et fait arriver chaque chose au moment qu'Il a choisi.$f$,
  fiche_preuve_type = $f$hadith$f$,
  fiche_preuve_arabe = $f$أَنْتَ الْمُقَدِّمُ وَأَنْتَ الْمُؤَخِّرُ$f$,
  fiche_preuve_francais = $f$Tu es Celui qui fait avancer (Al-Mouqaddim) et Celui qui fait reculer (Al-Mou'akhkhir).$f$,
  fiche_preuve_reference = $f$Al-Boukhârî n° 1120 · traduction simple du sens$f$,
  fiche_preuve_degre = $f$sahih$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$À la fin de l'invocation du Prophète ﷺ dans sa prière de la nuit (Al-Boukhârî 1120), et dans une autre invocation qu'il faisait (Al-Boukhârî 6398).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ اغْفِرْ لِي مَا قَدَّمْتُ وَمَا أَخَّرْتُ وَمَا أَسْرَرْتُ وَمَا أَعْلَنْتُ، أَنْتَ الْمُقَدِّمُ، وَأَنْتَ الْمُؤَخِّرُ، وَأَنْتَ عَلَى كُلِّ شَىْءٍ قَدِيرٌ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, pardonne-moi ce que j'ai fait avant et ce que je ferai après, ce que j'ai caché et ce que j'ai montré. Tu es Celui qui fait avancer et Celui qui fait reculer, et Tu es capable de toute chose.$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 6398 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Beaucoup de savants disent que ce nom se cite avec Al-Mou'akhkhir, comme dans le hadith.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$sunna$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 71 and display_order = 71 and fiche_explication is null;

-- 72. Al-Mu'akhkhir
update public.allah_names set
  fiche_signification = $f$Celui qui fait reculer ce qu'Il veut.$f$,
  fiche_explication = $f$Celui qui reporte selon Sa sagesse. Il retarde ce qu'Il veut, et Il laisse du temps aux gens pour se repentir.$f$,
  fiche_preuve_type = $f$hadith$f$,
  fiche_preuve_arabe = $f$أَنْتَ الْمُقَدِّمُ وَأَنْتَ الْمُؤَخِّرُ$f$,
  fiche_preuve_francais = $f$Tu es Celui qui fait avancer (Al-Mouqaddim) et Celui qui fait reculer (Al-Mou'akhkhir).$f$,
  fiche_preuve_reference = $f$Al-Boukhârî n° 1120 · traduction simple du sens$f$,
  fiche_preuve_degre = $f$sahih$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$À la fin de l'invocation du Prophète ﷺ dans sa prière de la nuit (Al-Boukhârî 1120), et dans une autre invocation qu'il faisait (Al-Boukhârî 6398).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ اغْفِرْ لِي مَا قَدَّمْتُ وَمَا أَخَّرْتُ وَمَا أَسْرَرْتُ وَمَا أَعْلَنْتُ، أَنْتَ الْمُقَدِّمُ، وَأَنْتَ الْمُؤَخِّرُ، وَأَنْتَ عَلَى كُلِّ شَىْءٍ قَدِيرٌ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, pardonne-moi ce que j'ai fait avant et ce que je ferai après, ce que j'ai caché et ce que j'ai montré. Tu es Celui qui fait avancer et Celui qui fait reculer, et Tu es capable de toute chose.$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 6398 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Beaucoup de savants disent que ce nom se cite avec Al-Mouqaddim, comme dans le hadith.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$sunna$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 72 and display_order = 72 and fiche_explication is null;

-- 73. Al-Awwal
update public.allah_names set
  fiche_signification = $f$Le Premier : rien n'existait avant Lui.$f$,
  fiche_explication = $f$Celui qui existe avant toute chose. Le Prophète ﷺ l'a expliqué : « Tu es le Premier, il n'y a rien avant Toi » (Mouslim 2713).$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$هُوَ الْأَوَّلُ وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ ۖ وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ$f$,
  fiche_preuve_francais = $f$C'est Lui le Premier et le Dernier, l'Apparent et le Caché et Il est Omniscient.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hadid (57:3) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Avant de dormir, couché sur le côté droit : le Prophète ﷺ a appris cette invocation à dire au coucher (Mouslim 2713).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ أَنْتَ الأَوَّلُ فَلَيْسَ قَبْلَكَ شَىْءٌ وَأَنْتَ الآخِرُ فَلَيْسَ بَعْدَكَ شَىْءٌ وَأَنْتَ الظَّاهِرُ فَلَيْسَ فَوْقَكَ شَىْءٌ وَأَنْتَ الْبَاطِنُ فَلَيْسَ دُونَكَ شَىْءٌ اقْضِ عَنَّا الدَّيْنَ وَأَغْنِنَا مِنَ الْفَقْرِ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, Tu es le Premier : il n'y a rien avant Toi ; Tu es le Dernier : il n'y a rien après Toi ; Tu es l'Apparent : il n'y a rien au-dessus de Toi ; Tu es le Caché (Al-Bâtin) : rien n'est plus proche que Toi. Acquitte nos dettes et préserve-nous de la pauvreté.$f$,
  fiche_invocation_reference = $f$Mouslim n° 2713 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 73 and display_order = 73 and fiche_explication is null;

-- 74. Al-Âkhir
update public.allah_names set
  fiche_signification = $f$Le Dernier : Il reste après toute chose.$f$,
  fiche_explication = $f$Celui qui subsistera après toute chose. Tout ce qui existe finira, sauf Allah. Le Prophète ﷺ l'a expliqué : « Tu es le Dernier, il n'y a rien après Toi » (Mouslim 2713).$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$هُوَ الْأَوَّلُ وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ ۖ وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ$f$,
  fiche_preuve_francais = $f$C'est Lui le Premier et le Dernier, l'Apparent et le Caché et Il est Omniscient.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hadid (57:3) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Avant de dormir, couché sur le côté droit : le Prophète ﷺ a appris cette invocation à dire au coucher (Mouslim 2713).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ أَنْتَ الأَوَّلُ فَلَيْسَ قَبْلَكَ شَىْءٌ وَأَنْتَ الآخِرُ فَلَيْسَ بَعْدَكَ شَىْءٌ وَأَنْتَ الظَّاهِرُ فَلَيْسَ فَوْقَكَ شَىْءٌ وَأَنْتَ الْبَاطِنُ فَلَيْسَ دُونَكَ شَىْءٌ اقْضِ عَنَّا الدَّيْنَ وَأَغْنِنَا مِنَ الْفَقْرِ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, Tu es le Premier : il n'y a rien avant Toi ; Tu es le Dernier : il n'y a rien après Toi ; Tu es l'Apparent : il n'y a rien au-dessus de Toi ; Tu es le Caché (Al-Bâtin) : rien n'est plus proche que Toi. Acquitte nos dettes et préserve-nous de la pauvreté.$f$,
  fiche_invocation_reference = $f$Mouslim n° 2713 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 74 and display_order = 74 and fiche_explication is null;

-- 75. Az-Zâhir
update public.allah_names set
  fiche_signification = $f$L'Apparent : Il est au-dessus de tout, et Ses signes sont partout.$f$,
  fiche_explication = $f$Celui dont les signes sont évidents. Le Prophète ﷺ l'a expliqué : « Tu es l'Apparent, il n'y a rien au-dessus de Toi » (Mouslim 2713). Sa grandeur se voit dans toute la création.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$هُوَ الْأَوَّلُ وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ ۖ وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ$f$,
  fiche_preuve_francais = $f$C'est Lui le Premier et le Dernier, l'Apparent et le Caché et Il est Omniscient.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hadid (57:3) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Avant de dormir, couché sur le côté droit : le Prophète ﷺ a appris cette invocation à dire au coucher (Mouslim 2713).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ أَنْتَ الأَوَّلُ فَلَيْسَ قَبْلَكَ شَىْءٌ وَأَنْتَ الآخِرُ فَلَيْسَ بَعْدَكَ شَىْءٌ وَأَنْتَ الظَّاهِرُ فَلَيْسَ فَوْقَكَ شَىْءٌ وَأَنْتَ الْبَاطِنُ فَلَيْسَ دُونَكَ شَىْءٌ اقْضِ عَنَّا الدَّيْنَ وَأَغْنِنَا مِنَ الْفَقْرِ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, Tu es le Premier : il n'y a rien avant Toi ; Tu es le Dernier : il n'y a rien après Toi ; Tu es l'Apparent : il n'y a rien au-dessus de Toi ; Tu es le Caché (Al-Bâtin) : rien n'est plus proche que Toi. Acquitte nos dettes et préserve-nous de la pauvreté.$f$,
  fiche_invocation_reference = $f$Mouslim n° 2713 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 75 and display_order = 75 and fiche_explication is null;

-- 76. Al-Bâtin
update public.allah_names set
  fiche_signification = $f$Le Caché : on ne Le voit pas en ce monde, mais Il connaît tout, même le plus caché.$f$,
  fiche_explication = $f$Celui dont l'essence est imperceptible. On ne voit pas Allah en ce monde, mais Il est proche de nous par Sa science : rien ne Lui est caché. Le Prophète ﷺ a dit : « Tu es le Caché, rien n'est plus proche que Toi » (Mouslim 2713).$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$هُوَ الْأَوَّلُ وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ ۖ وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ$f$,
  fiche_preuve_francais = $f$C'est Lui le Premier et le Dernier, l'Apparent et le Caché et Il est Omniscient.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hadid (57:3) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Avant de dormir, couché sur le côté droit : le Prophète ﷺ a appris cette invocation à dire au coucher (Mouslim 2713).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ أَنْتَ الأَوَّلُ فَلَيْسَ قَبْلَكَ شَىْءٌ وَأَنْتَ الآخِرُ فَلَيْسَ بَعْدَكَ شَىْءٌ وَأَنْتَ الظَّاهِرُ فَلَيْسَ فَوْقَكَ شَىْءٌ وَأَنْتَ الْبَاطِنُ فَلَيْسَ دُونَكَ شَىْءٌ اقْضِ عَنَّا الدَّيْنَ وَأَغْنِنَا مِنَ الْفَقْرِ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, Tu es le Premier : il n'y a rien avant Toi ; Tu es le Dernier : il n'y a rien après Toi ; Tu es l'Apparent : il n'y a rien au-dessus de Toi ; Tu es le Caché (Al-Bâtin) : rien n'est plus proche que Toi. Acquitte nos dettes et préserve-nous de la pauvreté.$f$,
  fiche_invocation_reference = $f$Mouslim n° 2713 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = $f$« فليس دونك شيء » est traduit « rien n'est plus proche que Toi » (traduction habituelle) ; mot à mot : « il n'y a rien en dessous de Toi ». À relire.$f$
where id = 76 and display_order = 76 and fiche_explication is null;

-- 77. Al-Wâlî
update public.allah_names set
  fiche_signification = $f$Celui qui gouverne et dirige toute chose.$f$,
  fiche_explication = $f$Celui qui gouverne toute chose. Il dirige les affaires de toutes les créatures ; personne d'autre ne peut les protéger ou les diriger à Sa place.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَمَا لَهُمْ مِنْ دُونِهِ مِنْ وَالٍ$f$,
  fiche_preuve_francais = $f$Et ils n'ont, en dehors de Lui, aucun protecteur (wâl).$f$,
  fiche_preuve_reference = $f$Coran, sourate Ar-Ra'd (13:11) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, occupe-Toi de toutes mes affaires, et ne me laisse pas à moi-même.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Dans le verset 13:11, le mot « wâl » n'a pas l'article : des savants le comptent quand même comme nom, d'autres non.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 77 and display_order = 77 and fiche_explication is null;

-- 78. Al-Muta'âlî
update public.allah_names set
  fiche_signification = $f$Le Très Élevé : Il est au-dessus de tout, et loin de tout défaut.$f$,
  fiche_explication = $f$Celui qui est au-dessus de tout. Al-Mouta'âlî est élevé au-dessus de Ses créatures et au-dessus de tout ce que les gens disent de faux sur Lui.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$عَالِمُ الْغَيْبِ وَالشَّهَادَةِ الْكَبِيرُ الْمُتَعَالِ$f$,
  fiche_preuve_francais = $f$Le Connaisseur de ce qui est caché et de ce qui est apparent, Le Grand, Le Sublime.$f$,
  fiche_preuve_reference = $f$Coran, sourate Ar-Ra'd (13:9) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Mouta'âlî, élève mon cœur au-dessus des choses basses de ce monde.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 78 and display_order = 78 and fiche_explication is null;

-- 79. Al-Barr
update public.allah_names set
  fiche_signification = $f$Le Bienfaisant : Il est bon et doux avec Ses serviteurs.$f$,
  fiche_explication = $f$Celui dont la bonté est infinie. Allah fait du bien à Ses serviteurs, tient Ses promesses et pardonne beaucoup. Dans le verset, ce sont les gens du Paradis qui disent : « Nous L'invoquions avant ».$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّا كُنَّا مِنْ قَبْلُ نَدْعُوهُ ۖ إِنَّهُ هُوَ الْبَرُّ الرَّحِيمُ$f$,
  fiche_preuve_francais = $f$Antérieurement, nous L'invoquions. C'est Lui certes, le Charitable, le Très Miséricordieux».$f$,
  fiche_preuve_reference = $f$Coran, sourate At-Tur (52:28) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Barr, sois bon avec moi, et aide-moi à être bon avec mes parents et avec les gens.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 79 and display_order = 79 and fiche_explication is null;

-- 80. At-Tawwâb
update public.allah_names set
  fiche_signification = $f$Celui qui accepte le repentir, encore et encore.$f$,
  fiche_explication = $f$Celui qui accepte le repentir. Allah aide Son serviteur à se repentir, puis Il accepte son repentir, chaque fois qu'il revient sincèrement vers Lui.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$فَتَلَقَّىٰ آدَمُ مِنْ رَبِّهِ كَلِمَاتٍ فَتَابَ عَلَيْهِ ۚ إِنَّهُ هُوَ التَّوَّابُ الرَّحِيمُ$f$,
  fiche_preuve_francais = $f$Puis Adam reçut de son Seigneur des paroles, et Allah accepta son repentir : c'est Lui Celui qui accepte le repentir (At-Tawwâb), le Très Miséricordieux.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Baqara (2:37) · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$À tout moment, surtout après une faute. C'est l'invocation d'Ibrâhîm et d'Ismâ'îl (Coran 2:128). Ibn 'Oumar a compté que le Prophète ﷺ disait « Rabbi-ghfir lî wa toub 'alayya, innaka anta-t-tawwâbou-r-rahîm » cent fois dans une même assemblée (Abou Dâwoud 1516).$f$,
  fiche_invocation_arabe = $f$وَتُبْ عَلَيْنَا ۖ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Et accepte notre repentir : c'est Toi Celui qui accepte le repentir (At-Tawwâb), le Très Miséricordieux.$f$,
  fiche_invocation_reference = $f$Coran, sourate Al-Baqara (2:128) — extrait du verset · traduction simple du sens$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = $f$Abou Dâwoud 1516 (jugé authentique par Al-Albânî).$f$,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 80 and display_order = 80 and fiche_explication is null;

-- 81. Al-Muntaqim
update public.allah_names set
  fiche_signification = $f$Celui qui punit, avec justice, ceux qui persistent dans le crime.$f$,
  fiche_explication = $f$Celui qui punit les injustes. Allah laisse du temps aux gens ; mais celui qui persiste dans l'injustice et le crime sans se repentir sera puni, avec une justice parfaite. Le croyant a confiance en la justice d'Allah.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَمَنْ أَظْلَمُ مِمَّنْ ذُكِّرَ بِآيَاتِ رَبِّهِ ثُمَّ أَعْرَضَ عَنْهَا ۚ إِنَّا مِنَ الْمُجْرِمِينَ مُنْتَقِمُونَ$f$,
  fiche_preuve_francais = $f$Qui est plus injuste que celui à qui on rappelle les versets de son Seigneur, et qui s'en détourne ensuite ? Nous punirons certes les criminels.$f$,
  fiche_preuve_reference = $f$Coran, sourate As-Sajda (32:22) · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment. On ne l'utilise jamais pour souhaiter du mal à un musulman.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, protège-moi de l'injustice : que je ne sois jamais injuste envers quelqu'un.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$Beaucoup de savants disent qu'« Al-Mountaqim » ne se dit pas seul comme nom : le Coran dit « Dhou-ntiqâm » (« Il a le pouvoir de punir », 3:4) et « Nous punirons les criminels » (32:22). Il vient de la liste d'At-Tirmidhî.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = $f$Nom sensible pour des enfants : le sens « Le Vengeur » (titre actuel) peut être mal compris. Proposition : « Celui qui punit les criminels ».$f$
where id = 81 and display_order = 81 and fiche_explication is null;

-- 82. Al-'Afuww
update public.allah_names set
  fiche_signification = $f$Celui qui efface les péchés, comme s'ils n'avaient jamais existé.$f$,
  fiche_explication = $f$Celui qui efface les péchés. Al-'Afouww est plus encore que pardonner : Il efface la faute complètement, elle ne reste même plus écrite.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$فَإِنَّ اللَّهَ كَانَ عَفُوًّا قَدِيرًا$f$,
  fiche_preuve_francais = $f$Allah est Celui qui efface les fautes ('Afouww) et Il est capable de tout.$f$,
  fiche_preuve_reference = $f$Coran, sourate An-Nisa (4:149) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Pendant les nuits du Ramadan, surtout la Nuit du Destin (Laylat al-Qadr) : c'est l'invocation que le Prophète ﷺ a apprise à 'Âïcha pour cette nuit (At-Tirmidhî 3513).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي$f$,
  fiche_invocation_phonetique = $f$Allâhoumma innaka 'afouwwoun karîmoun touhibbou-l-'afwa fa'fou 'annî$f$,
  fiche_invocation_francais = $f$Ô Allah, Tu es Celui qui efface les fautes, le Généreux ; Tu aimes effacer les fautes, alors efface les miennes.$f$,
  fiche_invocation_reference = $f$At-Tirmidhî n° 3513 — jugé authentique (sahîh) par Al-Albânî · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = $f$Les spécialistes du hadith ne sont pas d'accord : authentique (sahîh) selon Ahmad Châkir, Al-Albânî, Bachâr 'Awwâd ; faible (da'îf) selon Zoubayr 'Alî Zaï.$f$,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Pour l'invocation : le mot « karîm » (Généreux) se trouve dans la version d'At-Tirmidhî de notre recueil, mais pas dans d'autres versions du même hadith ; des savants disent qu'il a été ajouté. La version sans « karîm » est la plus sûre.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 82 and display_order = 82 and fiche_explication is null;

-- 83. Ar-Ra'ûf
update public.allah_names set
  fiche_signification = $f$Le Très Doux : Sa douceur et Sa bonté sont immenses.$f$,
  fiche_explication = $f$Celui dont la douceur est infinie. Ar-Ra'oûf est une miséricorde très tendre : Il ne demande pas aux gens ce qui est trop dur pour eux, et Il les protège de ce qui leur fait du mal.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$إِنَّ اللَّهَ بِالنَّاسِ لَرَءُوفٌ رَحِيمٌ$f$,
  fiche_preuve_francais = $f$Allah est, envers les gens, Très Doux (Ra'oûf) et Très Miséricordieux.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Baqara (2:143) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment. C'est l'invocation des croyants venus après les compagnons, pour leurs frères (Coran 59:10).$f$,
  fiche_invocation_arabe = $f$رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ وَلَا تَجْعَلْ فِي قُلُوبِنَا غِلًّا لِلَّذِينَ آمَنُوا رَبَّنَا إِنَّكَ رَءُوفٌ رَحِيمٌ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Notre Seigneur, pardonne-nous, ainsi qu'à nos frères qui nous ont précédés dans la foi, et ne mets pas dans nos cœurs de rancune envers ceux qui ont cru. Notre Seigneur, Tu es Très Doux et Très Miséricordieux.$f$,
  fiche_invocation_reference = $f$Coran, sourate Al-Hashr (59:10) — extrait du verset · traduction simple du sens$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 83 and display_order = 83 and fiche_explication is null;

-- 84. Mâlik Al-Mulk
update public.allah_names set
  fiche_signification = $f$Le Possesseur de toute royauté.$f$,
  fiche_explication = $f$Celui qui possède tout le royaume. Il donne le pouvoir à qui Il veut et le retire à qui Il veut ; tous les royaumes de ce monde Lui appartiennent.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$قُلِ اللَّهُمَّ مَالِكَ الْمُلْكِ$f$,
  fiche_preuve_francais = $f$Dis : « Ô Allah, Possesseur de la royauté (Mâlik al-Moulk) ! »$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Imran (3:26) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment. Le verset commence par un ordre : « Dis : Ô Allah… », c'est donc une invocation du Coran.$f$,
  fiche_invocation_arabe = $f$قُلِ اللَّهُمَّ مَالِكَ الْمُلْكِ تُؤْتِي الْمُلْكَ مَنْ تَشَاءُ وَتَنْزِعُ الْمُلْكَ مِمَّنْ تَشَاءُ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Dis : « Ô Allah, Possesseur de la royauté ! Tu donnes la royauté à qui Tu veux et Tu la retires à qui Tu veux. »$f$,
  fiche_invocation_reference = $f$Coran, sourate Al-Imran (3:26) — extrait du verset · traduction simple du sens$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 84 and display_order = 84 and fiche_explication is null;

-- 85. Dhul-Jalâl wal-Ikrâm
update public.allah_names set
  fiche_signification = $f$Le Possesseur de la Majesté et de la Générosité.$f$,
  fiche_explication = $f$Celui qui possède la majesté et la générosité. On Le respecte pour Sa grandeur, et on L'aime pour Sa générosité envers Ses serviteurs.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَيَبْقَىٰ وَجْهُ رَبِّكَ ذُو الْجَلَالِ وَالْإِكْرَامِ$f$,
  fiche_preuve_francais = $f$[Seule] subsistera La Face [Wajh] de ton Seigneur, plein de majesté et de noblesse.$f$,
  fiche_preuve_reference = $f$Coran, sourate Ar-Rahman (55:27) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Juste après le salâm de la prière obligatoire, après avoir demandé pardon trois fois (Mouslim 591).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ أَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ تَبَارَكْتَ ذَا الْجَلاَلِ وَالإِكْرَامِ$f$,
  fiche_invocation_phonetique = $f$Allâhoumma anta-s-salâm, wa minka-s-salâm, tabârakta yâ dha-l-jalâli wa-l-ikrâm$f$,
  fiche_invocation_francais = $f$Ô Allah, Tu es la Paix et de Toi vient la paix. Béni sois-Tu, Ô Possesseur de la Majesté et de la Générosité.$f$,
  fiche_invocation_reference = $f$Mouslim n° 591 · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 85 and display_order = 85 and fiche_explication is null;

-- 86. Al-Muqsit
update public.allah_names set
  fiche_signification = $f$L'Équitable : Il juge avec une parfaite justice.$f$,
  fiche_explication = $f$Celui qui agit avec équité. Il établit la justice, rend à chacun son droit, et défend l'opprimé contre l'injuste.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$شَهِدَ اللَّهُ أَنَّهُ لَا إِلَٰهَ إِلَّا هُوَ وَالْمَلَائِكَةُ وَأُولُو الْعِلْمِ قَائِمًا بِالْقِسْطِ$f$,
  fiche_preuve_francais = $f$Allah atteste qu'il n'y a pas de divinité à part Lui ; les anges et les gens de science l'attestent aussi ; Il maintient la justice.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Imran (3:18) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, Toi qui maintiens la justice, rends-moi juste dans mes paroles et dans mes actes.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Mouqsit » comme nom n'est ni dans le Coran ni dans un hadith authentique : le Coran dit qu'Allah « maintient la justice » (3:18). Des savants ne le comptent donc pas parmi les noms.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 86 and display_order = 86 and fiche_explication is null;

-- 87. Al-Jâmi'
update public.allah_names set
  fiche_signification = $f$Celui qui rassemblera tous les gens le Jour du Jugement.$f$,
  fiche_explication = $f$Celui qui rassemble tout le monde. Allah réunira toutes les créatures, les premières et les dernières, en un seul jour. Il rassemble aussi ce qui est dispersé et les cœurs qui s'aiment pour Lui.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$رَبَّنَا إِنَّكَ جَامِعُ النَّاسِ لِيَوْمٍ لَا رَيْبَ فِيهِ ۚ إِنَّ اللَّهَ لَا يُخْلِفُ الْمِيعَادَ$f$,
  fiche_preuve_francais = $f$Seigneur! C'est Toi qui rassembleras les gens, un jour - en quoi il n'y a point de doute - Allah, vraiment, ne manque jamais à Sa promesse.»$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Imran (3:9) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment. C'est l'invocation des gens de science (Coran 3:7-9).$f$,
  fiche_invocation_arabe = $f$رَبَّنَا إِنَّكَ جَامِعُ النَّاسِ لِيَوْمٍ لَا رَيْبَ فِيهِ ۚ إِنَّ اللَّهَ لَا يُخْلِفُ الْمِيعَادَ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Seigneur! C'est Toi qui rassembleras les gens, un jour - en quoi il n'y a point de doute - Allah, vraiment, ne manque jamais à Sa promesse.»$f$,
  fiche_invocation_reference = $f$Coran, sourate Al-Imran (3:9) · traduction de Muhammad Hamidullah$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 87 and display_order = 87 and fiche_explication is null;

-- 88. Al-Ghanî
update public.allah_names set
  fiche_signification = $f$Le Riche : Il n'a besoin de rien ni de personne.$f$,
  fiche_explication = $f$Celui qui n'a besoin de rien. Tous les êtres ont besoin d'Allah, et Lui n'a besoin de personne. Nos prières et nos bonnes actions ne Lui apportent rien : c'est nous qui en profitons.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$۞ يَا أَيُّهَا النَّاسُ أَنْتُمُ الْفُقَرَاءُ إِلَى اللَّهِ ۖ وَاللَّهُ هُوَ الْغَنِيُّ الْحَمِيدُ$f$,
  fiche_preuve_francais = $f$O hommes, vous êtes les indigents ayant besoin d'Allah, et c'est Allah, Lui qui se dispense de tout et Il est Le Digne de louange.$f$,
  fiche_preuve_reference = $f$Coran, sourate Fatir (35:15) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Pendant la prière pour demander la pluie (istisqâ') : le Prophète ﷺ a dit cette invocation (Abou Dâwoud 1173).$f$,
  fiche_invocation_arabe = $f$أَنْتَ اللَّهُ لاَ إِلَهَ إِلاَّ أَنْتَ الْغَنِيُّ وَنَحْنُ الْفُقَرَاءُ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Tu es Allah, il n'y a pas de divinité à part Toi, le Riche (Al-Ghanî), et nous sommes les pauvres.$f$,
  fiche_invocation_reference = $f$Abou Dâwoud n° 1173 — jugé bon (hasan) par Al-Albânî · traduction simple du sens$f$,
  fiche_invocation_degre = $f$hasan$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 88 and display_order = 88 and fiche_explication is null;

-- 89. Al-Mughnî
update public.allah_names set
  fiche_signification = $f$Celui qui enrichit qui Il veut.$f$,
  fiche_explication = $f$Celui qui comble de richesses. La vraie richesse, c'est celle du cœur : Allah enrichit qui Il veut d'argent, mais aussi de satisfaction et de foi.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَأَنَّهُ هُوَ أَغْنَىٰ وَأَقْنَىٰ$f$,
  fiche_preuve_francais = $f$et c'est Lui qui a enrichi et qui a fait acquérir.$f$,
  fiche_preuve_reference = $f$Coran, sourate An-Najm (53:48) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Quand on a des dettes ou des soucis d'argent : 'Alî a appris cette invocation du Prophète ﷺ et l'a apprise à un homme endetté (At-Tirmidhî 3563).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ اكْفِنِي بِحَلاَلِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, suffis-moi avec ce que Tu as permis, pour que je n'aie pas besoin de ce que Tu as interdit, et enrichis-moi par Ta grâce, pour que je n'aie besoin de personne d'autre que Toi.$f$,
  fiche_invocation_reference = $f$At-Tirmidhî n° 3563 — jugé bon (hasan) par Al-Albânî · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$hasan$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Moughnî » comme nom n'est pas dans le Coran : le Coran dit « C'est Lui qui enrichit » (53:48), avec un verbe. Il vient de la liste d'At-Tirmidhî.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 89 and display_order = 89 and fiche_explication is null;

-- 90. Al-Mâni'
update public.allah_names set
  fiche_signification = $f$Celui qui empêche (de donner, ou d'arriver) ce qu'Il veut, avec sagesse.$f$,
  fiche_explication = $f$Celui qui empêche le mal. Ce qu'Allah empêche, personne ne peut le donner ; et ce qu'Il donne, personne ne peut l'empêcher. Parfois Il nous empêche d'avoir une chose pour nous protéger.$f$,
  fiche_preuve_type = $f$hadith$f$,
  fiche_preuve_arabe = $f$اللَّهُمَّ لاَ مَانِعَ لِمَا أَعْطَيْتَ، وَلاَ مُعْطِيَ لِمَا مَنَعْتَ$f$,
  fiche_preuve_francais = $f$Ô Allah, personne ne peut empêcher ce que Tu donnes, et personne ne peut donner ce que Tu empêches.$f$,
  fiche_preuve_reference = $f$Al-Boukhârî n° 844 · traduction simple du sens$f$,
  fiche_preuve_degre = $f$sahih$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Après chaque prière obligatoire : le Prophète ﷺ disait cette invocation après chaque prière (Al-Boukhârî 844).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ لاَ مَانِعَ لِمَا أَعْطَيْتَ، وَلاَ مُعْطِيَ لِمَا مَنَعْتَ، وَلاَ يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, personne ne peut empêcher ce que Tu donnes, personne ne peut donner ce que Tu empêches, et la richesse du riche ne lui sert à rien devant Toi.$f$,
  fiche_invocation_reference = $f$Al-Boukhârî n° 844 · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Mâni' » comme nom n'est ni dans le Coran ni dans un hadith authentique : le hadith utilise le verbe (« ce que Tu empêches »). Beaucoup de savants ne le citent qu'avec « Al-Mou'tî » (Celui qui donne).

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 90 and display_order = 90 and fiche_explication is null;

-- 91. Ad-Dârr
update public.allah_names set
  fiche_signification = $f$Celui qui fait arriver l'épreuve ou le tort à qui Il veut, avec justice et sagesse.$f$,
  fiche_explication = $f$Rien ne peut nous faire du tort sans la permission d'Allah, et Lui seul peut l'enlever. Quand Il fait arriver une épreuve, c'est avec justice et sagesse : pour éprouver, pour effacer des péchés ou pour élever en degré. On ne Lui attribue jamais le mal comme un défaut.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَإِنْ يَمْسَسْكَ اللَّهُ بِضُرٍّ فَلَا كَاشِفَ لَهُ إِلَّا هُوَ ۖ وَإِنْ يُرِدْكَ بِخَيْرٍ فَلَا رَادَّ لِفَضْلِهِ ۚ يُصِيبُ بِهِ مَنْ يَشَاءُ مِنْ عِبَادِهِ ۚ وَهُوَ الْغَفُورُ الرَّحِيمُ$f$,
  fiche_preuve_francais = $f$Et si Allah fait qu'un mal te touche, nul ne peut l'écarter en dehors de Lui. Et s'Il te veut un bien, nul ne peut repousser Sa grâce. Il en gratifie qui Il veut parmi Ses serviteurs. Et c'est Lui le Pardonneur, le Miséricordieux.$f$,
  fiche_preuve_reference = $f$Coran, sourate Yunus (10:107) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Le matin et le soir, trois fois : le Prophète ﷺ a appris cette invocation (Abou Dâwoud 5088).$f$,
  fiche_invocation_arabe = $f$بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَىْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ$f$,
  fiche_invocation_phonetique = $f$Bismi-llâhi-lladhî lâ yadourrou ma'a-smihi chay'oun fi-l-ardi wa lâ fi-s-samâ', wa houwa-s-samî'ou-l-'alîm$f$,
  fiche_invocation_francais = $f$Au nom d'Allah : avec Son nom, rien ne peut nuire, ni sur la terre ni dans le ciel, et Il est Celui qui entend tout, Celui qui sait tout.$f$,
  fiche_invocation_reference = $f$Abou Dâwoud n° 5088 — jugé authentique (sahîh) par Al-Albânî · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$« Ad-Dârr » n'est ni dans le Coran ni dans un hadith authentique comme nom : le Coran dit « si Allah te touche d'un mal » (10:107). Beaucoup de savants disent qu'on ne le cite jamais seul, mais toujours avec « An-Nâfi' » (Celui qui accorde le bien).

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = $f$Ancienne explication en base : « Celui qui crée le mal selon Sa sagesse » → remplacée ici par une formulation plus prudente. Titre actuel « Celui qui nuit » : à garder ou à changer ?$f$
where id = 91 and display_order = 91 and fiche_explication is null;

-- 92. An-Nâfi'
update public.allah_names set
  fiche_signification = $f$Celui qui accorde le bien et ce qui est utile.$f$,
  fiche_explication = $f$Celui qui accorde les bienfaits. Tout ce qui nous est utile (la santé, la science, la nourriture, la foi) vient d'Allah. Personne ne peut repousser le bien qu'Il veut nous donner.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَإِنْ يَمْسَسْكَ اللَّهُ بِضُرٍّ فَلَا كَاشِفَ لَهُ إِلَّا هُوَ ۖ وَإِنْ يُرِدْكَ بِخَيْرٍ فَلَا رَادَّ لِفَضْلِهِ ۚ يُصِيبُ بِهِ مَنْ يَشَاءُ مِنْ عِبَادِهِ ۚ وَهُوَ الْغَفُورُ الرَّحِيمُ$f$,
  fiche_preuve_francais = $f$Et si Allah fait qu'un mal te touche, nul ne peut l'écarter en dehors de Lui. Et s'Il te veut un bien, nul ne peut repousser Sa grâce. Il en gratifie qui Il veut parmi Ses serviteurs. Et c'est Lui le Pardonneur, le Miséricordieux.$f$,
  fiche_preuve_reference = $f$Coran, sourate Yunus (10:107) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Après la prière du Soubh, en faisant le salâm : le Prophète ﷺ disait cette invocation (Ibn Mâjah 925).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلاً مُتَقَبَّلاً$f$,
  fiche_invocation_phonetique = $f$Allâhoumma innî as'alouka 'ilman nâfi'an, wa rizqan tayyiban, wa 'amalan moutaqabbalâ$f$,
  fiche_invocation_francais = $f$Ô Allah, je Te demande une science utile, une subsistance pure et des actions acceptées.$f$,
  fiche_invocation_reference = $f$Ibn Mâjah n° 925 — jugé authentique (sahîh) par Al-Albânî · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = $f$Les spécialistes du hadith ne sont pas d'accord : authentique (sahîh) selon Al-Albânî, Fouâd 'Abd Al-Bâqî ; faible (da'îf) selon Zoubayr 'Alî Zaï.$f$,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$« An-Nâfi' » n'est ni dans le Coran ni dans un hadith authentique comme nom. Beaucoup de savants disent qu'on le cite avec « Ad-Dârr ».

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 92 and display_order = 92 and fiche_explication is null;

-- 93. An-Nûr
update public.allah_names set
  fiche_signification = $f$La Lumière : Il illumine les cieux, la terre et les cœurs.$f$,
  fiche_explication = $f$Celui qui illumine les cœurs et le monde. Allah a dit qu'Il est « la Lumière des cieux et de la terre » ; Il éclaire les cœurs des croyants par la foi et par le Coran.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ$f$,
  fiche_preuve_francais = $f$Allah est la Lumière des cieux et de la terre.$f$,
  fiche_preuve_reference = $f$Coran, sourate An-Nur (24:35) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment. Le Prophète ﷺ faisait cette invocation la nuit, au moment de la prière du Soubh (Mouslim 763).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا وَفِي بَصَرِي نُورًا وَفِي سَمْعِي نُورًا$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, mets de la lumière dans mon cœur, de la lumière dans ma vue et de la lumière dans mon ouïe.$f$,
  fiche_invocation_reference = $f$Mouslim n° 763 · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Les savants ne sont pas tous d'accord : pour beaucoup, An-Noûr est un nom d'Allah et la lumière une de Ses qualités (comme dans 24:35 et Al-Boukhârî 1120 : « Tu es la Lumière des cieux et de la terre ») ; d'autres expliquent le verset par « Celui qui illumine / qui guide ». On affirme ce qu'Allah dit de Lui, sans Le comparer à une lumière créée.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = $f$Statut de nom discuté (signalé dans la demande). Vérifier que la formulation des divergences convient à Nadia.$f$
where id = 93 and display_order = 93 and fiche_explication is null;

-- 94. Al-Hâdî
update public.allah_names set
  fiche_signification = $f$Le Guide : Il guide vers la vérité et vers ce qui est utile.$f$,
  fiche_explication = $f$Celui qui guide vers la vérité. Allah montre le bon chemin par Ses prophètes et Son Livre, et Il guide le cœur de qui Il veut vers la foi. Il guide aussi chaque créature vers ce qui la fait vivre.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَكَفَىٰ بِرَبِّكَ هَادِيًا وَنَصِيرًا$f$,
  fiche_preuve_francais = $f$Ton Seigneur suffit comme Guide (Hâdî) et comme Soutien.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Furqan (25:31) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment. Le Prophète ﷺ faisait cette invocation (Mouslim 2721).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى$f$,
  fiche_invocation_phonetique = $f$Allâhoumma innî as'aloka-l-houdâ wa-t-touqâ wa-l-'afâfa wa-l-ghinâ$f$,
  fiche_invocation_francais = $f$Ô Allah, je Te demande la bonne direction, la piété, la retenue et la richesse (du cœur).$f$,
  fiche_invocation_reference = $f$Mouslim n° 2721 · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Dans le Coran, le mot est « hâdiyan » (comme guide), sans article (25:31). Des savants le comptent comme nom, d'autres le voient comme une qualité d'Allah ; tous sont d'accord qu'Allah est Celui qui guide.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = $f$Statut de nom discuté (signalé dans la demande). Titre actuel « Le Directeur » : proposition « Le Guide ».$f$
where id = 94 and display_order = 94 and fiche_explication is null;

-- 95. Al-Badî'
update public.allah_names set
  fiche_signification = $f$Celui qui a créé les cieux et la terre sans modèle.$f$,
  fiche_explication = $f$Celui dont la création est unique. Allah a inventé les cieux et la terre sans modèle avant eux : il n'y avait rien à copier.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$بَدِيعُ السَّمَاوَاتِ وَالْأَرْضِ ۖ وَإِذَا قَضَىٰ أَمْرًا فَإِنَّمَا يَقُولُ لَهُ كُنْ فَيَكُونُ$f$,
  fiche_preuve_francais = $f$Il est le Créateur des cieux et de la terre à partir du néant. Lorsqu'Il décide une chose, Il dit seulement: «Sois», et elle est aussitôt.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Baqara (2:117) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Avant de demander quelque chose à Allah : le Prophète ﷺ a entendu un homme invoquer ainsi et a dit qu'il avait invoqué Allah par Son plus grand nom (Abou Dâwoud 1495).$f$,
  fiche_invocation_arabe = $f$اللَّهُمَّ إِنِّي أَسْأَلُكَ بِأَنَّ لَكَ الْحَمْدَ لاَ إِلَهَ إِلاَّ أَنْتَ الْمَنَّانُ بَدِيعُ السَّمَوَاتِ وَالأَرْضِ يَا ذَا الْجَلاَلِ وَالإِكْرَامِ يَا حَىُّ يَا قَيُّومُ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Ô Allah, je Te demande, car à Toi la louange, il n'y a pas de divinité à part Toi, le Bienfaiteur, le Créateur des cieux et de la terre sans modèle (Badî'), Ô Possesseur de la Majesté et de la Générosité, Ô Vivant, Ô Celui qui subsiste par Lui-même.$f$,
  fiche_invocation_reference = $f$Abou Dâwoud n° 1495 — jugé authentique (sahîh) par Al-Albânî · traduction simple du sens$f$,
  fiche_invocation_degre = $f$sahih$f$,
  fiche_invocation_degre_note = $f$Les spécialistes du hadith ne sont pas d'accord : authentique (sahîh) selon Al-Albânî, Mouhyî Ad-Dîn 'Abd Al-Hamîd, Chou'ayb Al-Arna'oût ; bon (hasan) selon Zoubayr 'Alî Zaï.$f$,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 95 and display_order = 95 and fiche_explication is null;

-- 96. Al-Bâqî
update public.allah_names set
  fiche_signification = $f$Celui qui reste pour toujours, alors que tout finit.$f$,
  fiche_explication = $f$Celui qui subsiste éternellement. Tout ce qui est sur la terre disparaîtra ; seule restera la Face d'Allah.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَيَبْقَىٰ وَجْهُ رَبِّكَ ذُو الْجَلَالِ وَالْإِكْرَامِ$f$,
  fiche_preuve_francais = $f$[Seule] subsistera La Face [Wajh] de ton Seigneur, plein de majesté et de noblesse.$f$,
  fiche_preuve_reference = $f$Coran, sourate Ar-Rahman (55:27) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment.$f$,
  fiche_invocation_arabe = null,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Yâ Bâqî, fais que mes bonnes actions restent auprès de Toi.$f$,
  fiche_invocation_reference = null,
  fiche_invocation_degre = null,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = true,
  fiche_autres_references = null,
  fiche_divergences = $f$« Al-Bâqî » comme nom n'est ni dans le Coran ni dans un hadith authentique : le Coran dit « Seule subsistera la Face de ton Seigneur » (55:27), avec un verbe. Des savants ne le comptent donc pas parmi les noms.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 96 and display_order = 96 and fiche_explication is null;

-- 97. Al-Wârith
update public.allah_names set
  fiche_signification = $f$L'Héritier : tout Lui reviendra quand toutes les créatures auront disparu.$f$,
  fiche_explication = $f$Celui à qui tout reviendra. Les gens laissent leurs biens en mourant, mais tout appartient à Allah pour toujours.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$وَإِنَّا لَنَحْنُ نُحْيِي وَنُمِيتُ وَنَحْنُ الْوَارِثُونَ$f$,
  fiche_preuve_francais = $f$Et c'est bien Nous qui donnons la vie et donnons la mort, et c'est Nous qui sommes l'héritier [de tout].$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Hijr (15:23) · traduction de Muhammad Hamidullah$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Quand on demande à Allah un enfant : c'est l'invocation du prophète Zakariyyâ (Coran 21:89).$f$,
  fiche_invocation_arabe = $f$رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنْتَ خَيْرُ الْوَارِثِينَ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Mon Seigneur, ne me laisse pas seul (sans enfant), et Tu es le meilleur des héritiers.$f$,
  fiche_invocation_reference = $f$Coran, sourate Al-Anbiya (21:89) — extrait du verset · traduction simple du sens$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$coran$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 97 and display_order = 97 and fiche_explication is null;

-- 98. Ar-Rashîd
update public.allah_names set
  fiche_signification = $f$Celui qui dirige avec sagesse vers ce qui est juste.$f$,
  fiche_explication = $f$Celui qui mène toute chose vers ce qui est juste, avec une sagesse parfaite. Personne ne Le guide : c'est Lui qui guide.$f$,
  fiche_preuve_type = $f$coran$f$,
  fiche_preuve_arabe = $f$مَنْ يَهْدِ اللَّهُ فَهُوَ الْمُهْتَدِ ۖ وَمَنْ يُضْلِلْ فَلَنْ تَجِدَ لَهُ وَلِيًّا مُرْشِدًا$f$,
  fiche_preuve_francais = $f$Celui qu'Allah guide, c'est lui qui est bien guidé ; et celui qu'Il égare, tu ne lui trouveras aucun allié pour le guider.$f$,
  fiche_preuve_reference = $f$Coran, sourate Al-Kahf (18:17) — extrait du verset · traduction simple du sens$f$,
  fiche_preuve_degre = $f$coran$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Dans une situation difficile, quand on ne sait pas quoi faire : c'est l'invocation des jeunes de la caverne (Coran 18:10).$f$,
  fiche_invocation_arabe = $f$رَبَّنَا آتِنَا مِنْ لَدُنْكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Notre Seigneur, donne-nous une miséricorde venant de Toi, et prépare-nous la bonne direction dans notre affaire.$f$,
  fiche_invocation_reference = $f$Coran, sourate Al-Kahf (18:10) — extrait du verset · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$« Ar-Rachîd » n'est ni dans le Coran ni dans un hadith authentique comme nom d'Allah. Il vient de la liste d'At-Tirmidhî ; beaucoup de savants ne le comptent pas parmi les noms. Le verset ci-dessus montre qu'Allah est Celui qui guide.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 98 and display_order = 98 and fiche_explication is null;

-- 99. As-Sabûr
update public.allah_names set
  fiche_signification = $f$Le Très Patient : Il ne se presse pas de punir ceux qui Lui désobéissent.$f$,
  fiche_explication = $f$Celui dont la patience est infinie. Les gens disent du mal d'Allah et Lui désobéissent, et pourtant Il continue à leur donner la santé et la nourriture, et Il leur laisse le temps de revenir.$f$,
  fiche_preuve_type = $f$hadith$f$,
  fiche_preuve_arabe = $f$لَيْسَ أَحَدٌ ـ أَوْ لَيْسَ شَىْءٌ ـ أَصْبَرَ عَلَى أَذًى سَمِعَهُ مِنَ اللَّهِ، إِنَّهُمْ لَيَدْعُونَ لَهُ وَلَدًا، وَإِنَّهُ لَيُعَافِيهِمْ وَيَرْزُقُهُمْ$f$,
  fiche_preuve_francais = $f$Personne (ou : rien) n'est plus patient qu'Allah face aux paroles blessantes qu'Il entend : ils Lui attribuent un enfant, et pourtant Il leur donne la santé et la subsistance.$f$,
  fiche_preuve_reference = $f$Al-Boukhârî n° 6099 · traduction simple du sens$f$,
  fiche_preuve_degre = $f$sahih$f$,
  fiche_preuve_degre_note = null,
  fiche_moment = $f$Il n'y a pas de moment particulier fixé par la Sunna pour ce nom : on peut l'invoquer à tout moment, surtout quand on a besoin de patience. C'est l'invocation des magiciens devenus croyants (Coran 7:126).$f$,
  fiche_invocation_arabe = $f$رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَتَوَفَّنَا مُسْلِمِينَ$f$,
  fiche_invocation_phonetique = null,
  fiche_invocation_francais = $f$Notre Seigneur, répands sur nous la patience et fais-nous mourir musulmans.$f$,
  fiche_invocation_reference = $f$Coran, sourate Al-A'raf (7:126) — extrait du verset · traduction simple du sens — ce texte contient un mot de la même racine que le nom, pas le nom lui-même$f$,
  fiche_invocation_degre = $f$coran$f$,
  fiche_invocation_degre_note = null,
  fiche_invocation_personnelle = false,
  fiche_autres_references = null,
  fiche_divergences = $f$« As-Sabour » n'est ni dans le Coran ni dans un hadith authentique comme nom : le hadith d'Al-Boukhârî (6099) dit « personne n'est plus patient qu'Allah ». Il vient de la liste d'At-Tirmidhî ; beaucoup de savants ne le comptent pas parmi les noms.

Note générale : le hadith « Allah a quatre-vingt-dix-neuf noms, cent moins un ; celui qui les retient (ahsâhâ) entrera au Paradis » est authentique (Al-Boukhârî 2736, Mouslim 2677). Mais la LISTE des 99 noms vient d'un hadith d'At-Tirmidhî (n° 3507), qu'At-Tirmidhî lui-même a jugé « gharîb » ; beaucoup de savants (comme Ibn Taymiyya, Ibn Kathîr et Ibn Hajar) disent que l'énumération a été ajoutée par un rapporteur et n'est pas une parole du Prophète ﷺ. C'est pourquoi les listes des savants ne sont pas toutes pareilles.$f$,
  fiche_statut_nom = $f$discute$f$,
  fiche_a_relire = true,
  fiche_note_relecture = null
where id = 99 and display_order = 99 and fiche_explication is null;

