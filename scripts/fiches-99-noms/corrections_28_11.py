"""
🌟 99 noms — CONTRÔLE FINAL du 28/11/2026 : corrections validées par Nadia après l'audit des preuves (points a à k).
Lit la copie de référence v4, applique les corrections, écrit :
  - supabase/data/allah_names_fiches_adultes_v5_2026-11-28.json
  - supabase/migrations/20261128010000_fiches_99_noms_controle_final.sql
Sécurité : une fiche adulte n'est remplacée que si elle est ENCORE identique à la v4 (pas retouchée au crayon ✏️ depuis) ;
sinon elle est laissée telle quelle et la requête de contrôle finale la signale.

Ce que fait le script :
  a. 82 Al-'Afuww : le texte arabe est la fin de 4:43 (et non 4:99) → réf. 4:43 + texte uthmani exact.
  b. 92 An-Nâfi' : arabe mélangé remplacé par l'extrait exact de 10:107 (« s'Il te veut un bien… », Hamidullah).
  c. 58 Al-Mubdi' et 59 Al-Mu'îd : la phrase « cela Lui est facile » n'est pas dans 10:4 → preuve principale 85:13 ;
     10:4 gardé en « Autre preuve » avec sa vraie traduction (Hamidullah).
  d. 66 Al-Wâhid : preuve 13:16 (« وَهُوَ ٱلْوَٰحِدُ ٱلْقَهَّٰرُ ») ; 112:1 retiré (c'est la preuve d'Al-Ahad, fiche 67) ;
     2:163 gardé seulement pour le sens, présenté honnêtement (adjectif, sans « Al- »).
  e. 21 Al-Bâsit : ajout d'At-Tirmidhî 1314 (le même hadith que la fiche 20 Al-Qâbid) → statut établi, Sunna.
  f. 34 Al-Ghafûr : At-Tirmidhî 3513 (qui dit 'Afuww) remplacé par l'invocation enseignée à Abû Bakr
     (Al-Boukhârî 834 et Mouslim 2705), qui contient vraiment « الْغَفُورُ ».
  g. 28 Al-Hakam : avis de Zubair 'Alî Zaï sur Abû Dâwûd 4955 ajouté (champ « divergence » + texte).
  h. 71 et 72 : la réf. précise que ce sont deux hadiths (Ibn 'Abbâs chez Al-Boukhârî, 'Alî chez Mouslim).
  i. Preuves coraniques sans arabe : texte uthmani exact ajouté (extrait du verset qui correspond à la traduction).
  j. Arabe coranique écrit en écriture courante : remplacé par le texte uthmani exact du même passage.
  k. Numérotation de Hafs gardée (rien à changer).

Sources (vérifiées le 28/11/2026, rien n'est écrit de mémoire) :
  - Coran : édition « quran-uthmani » (Tanzil) via https://api.alquran.cloud/v1/ayah/<s>:<v>/quran-uthmani, la même que
    le lecteur de sourates de l'appli ; traductions : fr.hamidullah. Chaque extrait = morceau continu exact du verset.
    (Les textes déjà en uthmani dans la v4 ne changent pas : ils sont identiques à la source, seul l'ordre interne
    shadda/voyelle diffère, ce qui est la même écriture selon Unicode — forme normalisée NFC.)
  - Hadiths : hadith-api (fawazahmed0) https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/<ara|eng>-<livre>/<n>.json
      At-Tirmidhî 1314 : Ahmad Châkir sahih, Al-Albânî sahih, Bashâr 'Awwâd Ma'rûf hasan sahih, Zubair 'Alî Zaï
        « chaîne sahih » ; At-Tirmidhî lui-même : « hasan sahih » (fin du texte arabe).
      Abû Dâwûd 4955 : Al-Albânî sahih, Muhammad Muhyî Ad-Dîn 'Abd Al-Hamîd sahih, Shu'ayb Al-Arna'ût sahih,
        Zubair 'Alî Zaï « chaîne hasan ».
      Al-Boukhârî 834 : d'après Abû Bakr. Dans cette édition, UNE lettre est abîmée (2 caractères « � ») juste avant
        « لاَ يَغْفِرُ » : elle est reprise du même mot chez Mouslim (« وَلاَ »), et le script vérifie que le reste du mot
        est identique. Mouslim : n° 6869 de l'API = n° arabe « 2705.01 » (numérotation Fu'âd 'Abd Al-Bâqî) → Mouslim 2705.
      Al-Boukhârî 1120 : d'après Ibn 'Abbâs. Mouslim 771 : n° 1812 de l'API = n° arabe « 771.01 », d'après 'Alî ;
        les deux contiennent « أَنْتَ الْمُقَدِّمُ وَأَنْتَ الْمُؤَخِّرُ ».
  Les textes sources sont recopiés plus bas (bloc CORAN / HADITHS, généré automatiquement depuis les API).

Lancer : python3 scripts/fiches-99-noms/corrections_28_11.py              (depuis la racine du projet)
         python3 scripts/fiches-99-noms/corrections_28_11.py --verifier   (revérifie aussi chaque texte source sur les API)
"""
import copy, json, os, re, sys, unicodedata

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.abspath(os.path.join(ICI, "..", ".."))
V4 = os.path.join(RACINE, "supabase/data/allah_names_fiches_adultes_v4_2026-11-27.json")
V5 = os.path.join(RACINE, "supabase/data/allah_names_fiches_adultes_v5_2026-11-28.json")
MIGRATION = os.path.join(RACINE, "supabase/migrations/20261128010000_fiches_99_noms_controle_final.sql")

# --- Textes sources, recopiés automatiquement des API le 28/11/2026 (ne pas retaper à la main) ---
# Coran : api.alquran.cloud, édition quran-uthmani (texte complet de chaque verset cité)
CORAN = {
    (1, 3): 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    (2, 29): 'هُوَ ٱلَّذِى خَلَقَ لَكُم مَّا فِى ٱلْأَرْضِ جَمِيعًۭا ثُمَّ ٱسْتَوَىٰٓ إِلَى ٱلسَّمَآءِ فَسَوَّىٰهُنَّ سَبْعَ سَمَٰوَٰتٍۢ ۚ وَهُوَ بِكُلِّ شَىْءٍ عَلِيمٌۭ',
    (2, 32): 'قَالُوا۟ سُبْحَٰنَكَ لَا عِلْمَ لَنَآ إِلَّا مَا عَلَّمْتَنَآ ۖ إِنَّكَ أَنتَ ٱلْعَلِيمُ ٱلْحَكِيمُ',
    (2, 37): 'فَتَلَقَّىٰٓ ءَادَمُ مِن رَّبِّهِۦ كَلِمَٰتٍۢ فَتَابَ عَلَيْهِ ۚ إِنَّهُۥ هُوَ ٱلتَّوَّابُ ٱلرَّحِيمُ',
    (2, 115): 'وَلِلَّهِ ٱلْمَشْرِقُ وَٱلْمَغْرِبُ ۚ فَأَيْنَمَا تُوَلُّوا۟ فَثَمَّ وَجْهُ ٱللَّهِ ۚ إِنَّ ٱللَّهَ وَٰسِعٌ عَلِيمٌۭ',
    (2, 117): 'بَدِيعُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ ۖ وَإِذَا قَضَىٰٓ أَمْرًۭا فَإِنَّمَا يَقُولُ لَهُۥ كُن فَيَكُونُ',
    (2, 143): 'وَكَذَٰلِكَ جَعَلْنَٰكُمْ أُمَّةًۭ وَسَطًۭا لِّتَكُونُوا۟ شُهَدَآءَ عَلَى ٱلنَّاسِ وَيَكُونَ ٱلرَّسُولُ عَلَيْكُمْ شَهِيدًۭا ۗ وَمَا جَعَلْنَا ٱلْقِبْلَةَ ٱلَّتِى كُنتَ عَلَيْهَآ إِلَّا لِنَعْلَمَ مَن يَتَّبِعُ ٱلرَّسُولَ مِمَّن يَنقَلِبُ عَلَىٰ عَقِبَيْهِ ۚ وَإِن كَانَتْ لَكَبِيرَةً إِلَّا عَلَى ٱلَّذِينَ هَدَى ٱللَّهُ ۗ وَمَا كَانَ ٱللَّهُ لِيُضِيعَ إِيمَٰنَكُمْ ۚ إِنَّ ٱللَّهَ بِٱلنَّاسِ لَرَءُوفٌۭ رَّحِيمٌۭ',
    (2, 163): 'وَإِلَٰهُكُمْ إِلَٰهٌۭ وَٰحِدٌۭ ۖ لَّآ إِلَٰهَ إِلَّا هُوَ ٱلرَّحْمَٰنُ ٱلرَّحِيمُ',
    (2, 225): 'لَّا يُؤَاخِذُكُمُ ٱللَّهُ بِٱللَّغْوِ فِىٓ أَيْمَٰنِكُمْ وَلَٰكِن يُؤَاخِذُكُم بِمَا كَسَبَتْ قُلُوبُكُمْ ۗ وَٱللَّهُ غَفُورٌ حَلِيمٌۭ',
    (2, 245): 'مَّن ذَا ٱلَّذِى يُقْرِضُ ٱللَّهَ قَرْضًا حَسَنًۭا فَيُضَٰعِفَهُۥ لَهُۥٓ أَضْعَافًۭا كَثِيرَةًۭ ۚ وَٱللَّهُ يَقْبِضُ وَيَبْصُۜطُ وَإِلَيْهِ تُرْجَعُونَ',
    (2, 255): 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌۭ وَلَا نَوْمٌۭ ۚ لَّهُۥ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍۢ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ',
    (2, 257): 'ٱللَّهُ وَلِىُّ ٱلَّذِينَ ءَامَنُوا۟ يُخْرِجُهُم مِّنَ ٱلظُّلُمَٰتِ إِلَى ٱلنُّورِ ۖ وَٱلَّذِينَ كَفَرُوٓا۟ أَوْلِيَآؤُهُمُ ٱلطَّٰغُوتُ يُخْرِجُونَهُم مِّنَ ٱلنُّورِ إِلَى ٱلظُّلُمَٰتِ ۗ أُو۟لَٰٓئِكَ أَصْحَٰبُ ٱلنَّارِ ۖ هُمْ فِيهَا خَٰلِدُونَ',
    (2, 263): '۞ قَوْلٌۭ مَّعْرُوفٌۭ وَمَغْفِرَةٌ خَيْرٌۭ مِّن صَدَقَةٍۢ يَتْبَعُهَآ أَذًۭى ۗ وَٱللَّهُ غَنِىٌّ حَلِيمٌۭ',
    (3, 6): 'هُوَ ٱلَّذِى يُصَوِّرُكُمْ فِى ٱلْأَرْحَامِ كَيْفَ يَشَآءُ ۚ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْعَزِيزُ ٱلْحَكِيمُ',
    (3, 8): 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ ٱلْوَهَّابُ',
    (3, 9): 'رَبَّنَآ إِنَّكَ جَامِعُ ٱلنَّاسِ لِيَوْمٍۢ لَّا رَيْبَ فِيهِ ۚ إِنَّ ٱللَّهَ لَا يُخْلِفُ ٱلْمِيعَادَ',
    (3, 18): 'شَهِدَ ٱللَّهُ أَنَّهُۥ لَآ إِلَٰهَ إِلَّا هُوَ وَٱلْمَلَٰٓئِكَةُ وَأُو۟لُوا۟ ٱلْعِلْمِ قَآئِمًۢا بِٱلْقِسْطِ ۚ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْعَزِيزُ ٱلْحَكِيمُ',
    (3, 26): 'قُلِ ٱللَّهُمَّ مَٰلِكَ ٱلْمُلْكِ تُؤْتِى ٱلْمُلْكَ مَن تَشَآءُ وَتَنزِعُ ٱلْمُلْكَ مِمَّن تَشَآءُ وَتُعِزُّ مَن تَشَآءُ وَتُذِلُّ مَن تَشَآءُ ۖ بِيَدِكَ ٱلْخَيْرُ ۖ إِنَّكَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌۭ',
    (3, 173): 'ٱلَّذِينَ قَالَ لَهُمُ ٱلنَّاسُ إِنَّ ٱلنَّاسَ قَدْ جَمَعُوا۟ لَكُمْ فَٱخْشَوْهُمْ فَزَادَهُمْ إِيمَٰنًۭا وَقَالُوا۟ حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ',
    (4, 1): 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ يَٰٓأَيُّهَا ٱلنَّاسُ ٱتَّقُوا۟ رَبَّكُمُ ٱلَّذِى خَلَقَكُم مِّن نَّفْسٍۢ وَٰحِدَةٍۢ وَخَلَقَ مِنْهَا زَوْجَهَا وَبَثَّ مِنْهُمَا رِجَالًۭا كَثِيرًۭا وَنِسَآءًۭ ۚ وَٱتَّقُوا۟ ٱللَّهَ ٱلَّذِى تَسَآءَلُونَ بِهِۦ وَٱلْأَرْحَامَ ۚ إِنَّ ٱللَّهَ كَانَ عَلَيْكُمْ رَقِيبًۭا',
    (4, 6): 'وَٱبْتَلُوا۟ ٱلْيَتَٰمَىٰ حَتَّىٰٓ إِذَا بَلَغُوا۟ ٱلنِّكَاحَ فَإِنْ ءَانَسْتُم مِّنْهُمْ رُشْدًۭا فَٱدْفَعُوٓا۟ إِلَيْهِمْ أَمْوَٰلَهُمْ ۖ وَلَا تَأْكُلُوهَآ إِسْرَافًۭا وَبِدَارًا أَن يَكْبَرُوا۟ ۚ وَمَن كَانَ غَنِيًّۭا فَلْيَسْتَعْفِفْ ۖ وَمَن كَانَ فَقِيرًۭا فَلْيَأْكُلْ بِٱلْمَعْرُوفِ ۚ فَإِذَا دَفَعْتُمْ إِلَيْهِمْ أَمْوَٰلَهُمْ فَأَشْهِدُوا۟ عَلَيْهِمْ ۚ وَكَفَىٰ بِٱللَّهِ حَسِيبًۭا',
    (4, 40): 'إِنَّ ٱللَّهَ لَا يَظْلِمُ مِثْقَالَ ذَرَّةٍۢ ۖ وَإِن تَكُ حَسَنَةًۭ يُضَٰعِفْهَا وَيُؤْتِ مِن لَّدُنْهُ أَجْرًا عَظِيمًۭا',
    (4, 43): 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ لَا تَقْرَبُوا۟ ٱلصَّلَوٰةَ وَأَنتُمْ سُكَٰرَىٰ حَتَّىٰ تَعْلَمُوا۟ مَا تَقُولُونَ وَلَا جُنُبًا إِلَّا عَابِرِى سَبِيلٍ حَتَّىٰ تَغْتَسِلُوا۟ ۚ وَإِن كُنتُم مَّرْضَىٰٓ أَوْ عَلَىٰ سَفَرٍ أَوْ جَآءَ أَحَدٌۭ مِّنكُم مِّنَ ٱلْغَآئِطِ أَوْ لَٰمَسْتُمُ ٱلنِّسَآءَ فَلَمْ تَجِدُوا۟ مَآءًۭ فَتَيَمَّمُوا۟ صَعِيدًۭا طَيِّبًۭا فَٱمْسَحُوا۟ بِوُجُوهِكُمْ وَأَيْدِيكُمْ ۗ إِنَّ ٱللَّهَ كَانَ عَفُوًّا غَفُورًا',
    (4, 79): 'مَّآ أَصَابَكَ مِنْ حَسَنَةٍۢ فَمِنَ ٱللَّهِ ۖ وَمَآ أَصَابَكَ مِن سَيِّئَةٍۢ فَمِن نَّفْسِكَ ۚ وَأَرْسَلْنَٰكَ لِلنَّاسِ رَسُولًۭا ۚ وَكَفَىٰ بِٱللَّهِ شَهِيدًۭا',
    (4, 85): 'مَّن يَشْفَعْ شَفَٰعَةً حَسَنَةًۭ يَكُن لَّهُۥ نَصِيبٌۭ مِّنْهَا ۖ وَمَن يَشْفَعْ شَفَٰعَةًۭ سَيِّئَةًۭ يَكُن لَّهُۥ كِفْلٌۭ مِّنْهَا ۗ وَكَانَ ٱللَّهُ عَلَىٰ كُلِّ شَىْءٍۢ مُّقِيتًۭا',
    (4, 99): 'فَأُو۟لَٰٓئِكَ عَسَى ٱللَّهُ أَن يَعْفُوَ عَنْهُمْ ۚ وَكَانَ ٱللَّهُ عَفُوًّا غَفُورًۭا',
    (6, 17): 'وَإِن يَمْسَسْكَ ٱللَّهُ بِضُرٍّۢ فَلَا كَاشِفَ لَهُۥٓ إِلَّا هُوَ ۖ وَإِن يَمْسَسْكَ بِخَيْرٍۢ فَهُوَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌۭ',
    (6, 37): 'وَقَالُوا۟ لَوْلَا نُزِّلَ عَلَيْهِ ءَايَةٌۭ مِّن رَّبِّهِۦ ۚ قُلْ إِنَّ ٱللَّهَ قَادِرٌ عَلَىٰٓ أَن يُنَزِّلَ ءَايَةًۭ وَلَٰكِنَّ أَكْثَرَهُمْ لَا يَعْلَمُونَ',
    (6, 65): 'قُلْ هُوَ ٱلْقَادِرُ عَلَىٰٓ أَن يَبْعَثَ عَلَيْكُمْ عَذَابًۭا مِّن فَوْقِكُمْ أَوْ مِن تَحْتِ أَرْجُلِكُمْ أَوْ يَلْبِسَكُمْ شِيَعًۭا وَيُذِيقَ بَعْضَكُم بَأْسَ بَعْضٍ ۗ ٱنظُرْ كَيْفَ نُصَرِّفُ ٱلْءَايَٰتِ لَعَلَّهُمْ يَفْقَهُونَ',
    (6, 103): 'لَّا تُدْرِكُهُ ٱلْأَبْصَٰرُ وَهُوَ يُدْرِكُ ٱلْأَبْصَٰرَ ۖ وَهُوَ ٱللَّطِيفُ ٱلْخَبِيرُ',
    (6, 114): 'أَفَغَيْرَ ٱللَّهِ أَبْتَغِى حَكَمًۭا وَهُوَ ٱلَّذِىٓ أَنزَلَ إِلَيْكُمُ ٱلْكِتَٰبَ مُفَصَّلًۭا ۚ وَٱلَّذِينَ ءَاتَيْنَٰهُمُ ٱلْكِتَٰبَ يَعْلَمُونَ أَنَّهُۥ مُنَزَّلٌۭ مِّن رَّبِّكَ بِٱلْحَقِّ ۖ فَلَا تَكُونَنَّ مِنَ ٱلْمُمْتَرِينَ',
    (9, 28): 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ إِنَّمَا ٱلْمُشْرِكُونَ نَجَسٌۭ فَلَا يَقْرَبُوا۟ ٱلْمَسْجِدَ ٱلْحَرَامَ بَعْدَ عَامِهِمْ هَٰذَا ۚ وَإِنْ خِفْتُمْ عَيْلَةًۭ فَسَوْفَ يُغْنِيكُمُ ٱللَّهُ مِن فَضْلِهِۦٓ إِن شَآءَ ۚ إِنَّ ٱللَّهَ عَلِيمٌ حَكِيمٌۭ',
    (10, 4): 'إِلَيْهِ مَرْجِعُكُمْ جَمِيعًۭا ۖ وَعْدَ ٱللَّهِ حَقًّا ۚ إِنَّهُۥ يَبْدَؤُا۟ ٱلْخَلْقَ ثُمَّ يُعِيدُهُۥ لِيَجْزِىَ ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ بِٱلْقِسْطِ ۚ وَٱلَّذِينَ كَفَرُوا۟ لَهُمْ شَرَابٌۭ مِّنْ حَمِيمٍۢ وَعَذَابٌ أَلِيمٌۢ بِمَا كَانُوا۟ يَكْفُرُونَ',
    (10, 107): 'وَإِن يَمْسَسْكَ ٱللَّهُ بِضُرٍّۢ فَلَا كَاشِفَ لَهُۥٓ إِلَّا هُوَ ۖ وَإِن يُرِدْكَ بِخَيْرٍۢ فَلَا رَآدَّ لِفَضْلِهِۦ ۚ يُصِيبُ بِهِۦ مَن يَشَآءُ مِنْ عِبَادِهِۦ ۚ وَهُوَ ٱلْغَفُورُ ٱلرَّحِيمُ',
    (11, 61): '۞ وَإِلَىٰ ثَمُودَ أَخَاهُمْ صَٰلِحًۭا ۚ قَالَ يَٰقَوْمِ ٱعْبُدُوا۟ ٱللَّهَ مَا لَكُم مِّنْ إِلَٰهٍ غَيْرُهُۥ ۖ هُوَ أَنشَأَكُم مِّنَ ٱلْأَرْضِ وَٱسْتَعْمَرَكُمْ فِيهَا فَٱسْتَغْفِرُوهُ ثُمَّ تُوبُوٓا۟ إِلَيْهِ ۚ إِنَّ رَبِّى قَرِيبٌۭ مُّجِيبٌۭ',
    (11, 73): 'قَالُوٓا۟ أَتَعْجَبِينَ مِنْ أَمْرِ ٱللَّهِ ۖ رَحْمَتُ ٱللَّهِ وَبَرَكَٰتُهُۥ عَلَيْكُمْ أَهْلَ ٱلْبَيْتِ ۚ إِنَّهُۥ حَمِيدٌۭ مَّجِيدٌۭ',
    (11, 88): 'قَالَ يَٰقَوْمِ أَرَءَيْتُمْ إِن كُنتُ عَلَىٰ بَيِّنَةٍۢ مِّن رَّبِّى وَرَزَقَنِى مِنْهُ رِزْقًا حَسَنًۭا ۚ وَمَآ أُرِيدُ أَنْ أُخَالِفَكُمْ إِلَىٰ مَآ أَنْهَىٰكُمْ عَنْهُ ۚ إِنْ أُرِيدُ إِلَّا ٱلْإِصْلَٰحَ مَا ٱسْتَطَعْتُ ۚ وَمَا تَوْفِيقِىٓ إِلَّا بِٱللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ',
    (11, 90): 'وَٱسْتَغْفِرُوا۟ رَبَّكُمْ ثُمَّ تُوبُوٓا۟ إِلَيْهِ ۚ إِنَّ رَبِّى رَحِيمٌۭ وَدُودٌۭ',
    (12, 64): 'قَالَ هَلْ ءَامَنُكُمْ عَلَيْهِ إِلَّا كَمَآ أَمِنتُكُمْ عَلَىٰٓ أَخِيهِ مِن قَبْلُ ۖ فَٱللَّهُ خَيْرٌ حَٰفِظًۭا ۖ وَهُوَ أَرْحَمُ ٱلرَّٰحِمِينَ',
    (13, 9): 'عَٰلِمُ ٱلْغَيْبِ وَٱلشَّهَٰدَةِ ٱلْكَبِيرُ ٱلْمُتَعَالِ',
    (13, 11): 'لَهُۥ مُعَقِّبَٰتٌۭ مِّنۢ بَيْنِ يَدَيْهِ وَمِنْ خَلْفِهِۦ يَحْفَظُونَهُۥ مِنْ أَمْرِ ٱللَّهِ ۗ إِنَّ ٱللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا۟ مَا بِأَنفُسِهِمْ ۗ وَإِذَآ أَرَادَ ٱللَّهُ بِقَوْمٍۢ سُوٓءًۭا فَلَا مَرَدَّ لَهُۥ ۚ وَمَا لَهُم مِّن دُونِهِۦ مِن وَالٍ',
    (13, 16): 'قُلْ مَن رَّبُّ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ قُلِ ٱللَّهُ ۚ قُلْ أَفَٱتَّخَذْتُم مِّن دُونِهِۦٓ أَوْلِيَآءَ لَا يَمْلِكُونَ لِأَنفُسِهِمْ نَفْعًۭا وَلَا ضَرًّۭا ۚ قُلْ هَلْ يَسْتَوِى ٱلْأَعْمَىٰ وَٱلْبَصِيرُ أَمْ هَلْ تَسْتَوِى ٱلظُّلُمَٰتُ وَٱلنُّورُ ۗ أَمْ جَعَلُوا۟ لِلَّهِ شُرَكَآءَ خَلَقُوا۟ كَخَلْقِهِۦ فَتَشَٰبَهَ ٱلْخَلْقُ عَلَيْهِمْ ۚ قُلِ ٱللَّهُ خَٰلِقُ كُلِّ شَىْءٍۢ وَهُوَ ٱلْوَٰحِدُ ٱلْقَهَّٰرُ',
    (14, 8): 'وَقَالَ مُوسَىٰٓ إِن تَكْفُرُوٓا۟ أَنتُمْ وَمَن فِى ٱلْأَرْضِ جَمِيعًۭا فَإِنَّ ٱللَّهَ لَغَنِىٌّ حَمِيدٌ',
    (15, 23): 'وَإِنَّا لَنَحْنُ نُحْىِۦ وَنُمِيتُ وَنَحْنُ ٱلْوَٰرِثُونَ',
    (15, 49): '۞ نَبِّئْ عِبَادِىٓ أَنِّىٓ أَنَا ٱلْغَفُورُ ٱلرَّحِيمُ',
    (20, 82): 'وَإِنِّى لَغَفَّارٌۭ لِّمَن تَابَ وَءَامَنَ وَعَمِلَ صَٰلِحًۭا ثُمَّ ٱهْتَدَىٰ',
    (22, 7): 'وَأَنَّ ٱلسَّاعَةَ ءَاتِيَةٌۭ لَّا رَيْبَ فِيهَا وَأَنَّ ٱللَّهَ يَبْعَثُ مَن فِى ٱلْقُبُورِ',
    (22, 40): 'ٱلَّذِينَ أُخْرِجُوا۟ مِن دِيَٰرِهِم بِغَيْرِ حَقٍّ إِلَّآ أَن يَقُولُوا۟ رَبُّنَا ٱللَّهُ ۗ وَلَوْلَا دَفْعُ ٱللَّهِ ٱلنَّاسَ بَعْضَهُم بِبَعْضٍۢ لَّهُدِّمَتْ صَوَٰمِعُ وَبِيَعٌۭ وَصَلَوَٰتٌۭ وَمَسَٰجِدُ يُذْكَرُ فِيهَا ٱسْمُ ٱللَّهِ كَثِيرًۭا ۗ وَلَيَنصُرَنَّ ٱللَّهُ مَن يَنصُرُهُۥٓ ۗ إِنَّ ٱللَّهَ لَقَوِىٌّ عَزِيزٌ',
    (22, 54): 'وَلِيَعْلَمَ ٱلَّذِينَ أُوتُوا۟ ٱلْعِلْمَ أَنَّهُ ٱلْحَقُّ مِن رَّبِّكَ فَيُؤْمِنُوا۟ بِهِۦ فَتُخْبِتَ لَهُۥ قُلُوبُهُمْ ۗ وَإِنَّ ٱللَّهَ لَهَادِ ٱلَّذِينَ ءَامَنُوٓا۟ إِلَىٰ صِرَٰطٍۢ مُّسْتَقِيمٍۢ',
    (22, 62): 'ذَٰلِكَ بِأَنَّ ٱللَّهَ هُوَ ٱلْحَقُّ وَأَنَّ مَا يَدْعُونَ مِن دُونِهِۦ هُوَ ٱلْبَٰطِلُ وَأَنَّ ٱللَّهَ هُوَ ٱلْعَلِىُّ ٱلْكَبِيرُ',
    (23, 80): 'وَهُوَ ٱلَّذِى يُحْىِۦ وَيُمِيتُ وَلَهُ ٱخْتِلَٰفُ ٱلَّيْلِ وَٱلنَّهَارِ ۚ أَفَلَا تَعْقِلُونَ',
    (24, 35): '۞ ٱللَّهُ نُورُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ ۚ مَثَلُ نُورِهِۦ كَمِشْكَوٰةٍۢ فِيهَا مِصْبَاحٌ ۖ ٱلْمِصْبَاحُ فِى زُجَاجَةٍ ۖ ٱلزُّجَاجَةُ كَأَنَّهَا كَوْكَبٌۭ دُرِّىٌّۭ يُوقَدُ مِن شَجَرَةٍۢ مُّبَٰرَكَةٍۢ زَيْتُونَةٍۢ لَّا شَرْقِيَّةٍۢ وَلَا غَرْبِيَّةٍۢ يَكَادُ زَيْتُهَا يُضِىٓءُ وَلَوْ لَمْ تَمْسَسْهُ نَارٌۭ ۚ نُّورٌ عَلَىٰ نُورٍۢ ۗ يَهْدِى ٱللَّهُ لِنُورِهِۦ مَن يَشَآءُ ۚ وَيَضْرِبُ ٱللَّهُ ٱلْأَمْثَٰلَ لِلنَّاسِ ۗ وَٱللَّهُ بِكُلِّ شَىْءٍ عَلِيمٌۭ',
    (30, 50): 'فَٱنظُرْ إِلَىٰٓ ءَاثَٰرِ رَحْمَتِ ٱللَّهِ كَيْفَ يُحْىِ ٱلْأَرْضَ بَعْدَ مَوْتِهَآ ۚ إِنَّ ذَٰلِكَ لَمُحْىِ ٱلْمَوْتَىٰ ۖ وَهُوَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌۭ',
    (32, 22): 'وَمَنْ أَظْلَمُ مِمَّن ذُكِّرَ بِـَٔايَٰتِ رَبِّهِۦ ثُمَّ أَعْرَضَ عَنْهَآ ۚ إِنَّا مِنَ ٱلْمُجْرِمِينَ مُنتَقِمُونَ',
    (34, 26): 'قُلْ يَجْمَعُ بَيْنَنَا رَبُّنَا ثُمَّ يَفْتَحُ بَيْنَنَا بِٱلْحَقِّ وَهُوَ ٱلْفَتَّاحُ ٱلْعَلِيمُ',
    (35, 15): '۞ يَٰٓأَيُّهَا ٱلنَّاسُ أَنتُمُ ٱلْفُقَرَآءُ إِلَى ٱللَّهِ ۖ وَٱللَّهُ هُوَ ٱلْغَنِىُّ ٱلْحَمِيدُ',
    (35, 30): 'لِيُوَفِّيَهُمْ أُجُورَهُمْ وَيَزِيدَهُم مِّن فَضْلِهِۦٓ ۚ إِنَّهُۥ غَفُورٌۭ شَكُورٌۭ',
    (39, 62): 'ٱللَّهُ خَٰلِقُ كُلِّ شَىْءٍۢ ۖ وَهُوَ عَلَىٰ كُلِّ شَىْءٍۢ وَكِيلٌۭ',
    (41, 39): 'وَمِنْ ءَايَٰتِهِۦٓ أَنَّكَ تَرَى ٱلْأَرْضَ خَٰشِعَةًۭ فَإِذَآ أَنزَلْنَا عَلَيْهَا ٱلْمَآءَ ٱهْتَزَّتْ وَرَبَتْ ۚ إِنَّ ٱلَّذِىٓ أَحْيَاهَا لَمُحْىِ ٱلْمَوْتَىٰٓ ۚ إِنَّهُۥ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌ',
    (42, 11): 'فَاطِرُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ ۚ جَعَلَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًۭا وَمِنَ ٱلْأَنْعَٰمِ أَزْوَٰجًۭا ۖ يَذْرَؤُكُمْ فِيهِ ۚ لَيْسَ كَمِثْلِهِۦ شَىْءٌۭ ۖ وَهُوَ ٱلسَّمِيعُ ٱلْبَصِيرُ',
    (51, 58): 'إِنَّ ٱللَّهَ هُوَ ٱلرَّزَّاقُ ذُو ٱلْقُوَّةِ ٱلْمَتِينُ',
    (52, 28): 'إِنَّا كُنَّا مِن قَبْلُ نَدْعُوهُ ۖ إِنَّهُۥ هُوَ ٱلْبَرُّ ٱلرَّحِيمُ',
    (54, 55): 'فِى مَقْعَدِ صِدْقٍ عِندَ مَلِيكٍۢ مُّقْتَدِرٍۭ',
    (55, 27): 'وَيَبْقَىٰ وَجْهُ رَبِّكَ ذُو ٱلْجَلَٰلِ وَٱلْإِكْرَامِ',
    (57, 3): 'هُوَ ٱلْأَوَّلُ وَٱلْءَاخِرُ وَٱلظَّٰهِرُ وَٱلْبَاطِنُ ۖ وَهُوَ بِكُلِّ شَىْءٍ عَلِيمٌ',
    (58, 11): 'يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ إِذَا قِيلَ لَكُمْ تَفَسَّحُوا۟ فِى ٱلْمَجَٰلِسِ فَٱفْسَحُوا۟ يَفْسَحِ ٱللَّهُ لَكُمْ ۖ وَإِذَا قِيلَ ٱنشُزُوا۟ فَٱنشُزُوا۟ يَرْفَعِ ٱللَّهُ ٱلَّذِينَ ءَامَنُوا۟ مِنكُمْ وَٱلَّذِينَ أُوتُوا۟ ٱلْعِلْمَ دَرَجَٰتٍۢ ۚ وَٱللَّهُ بِمَا تَعْمَلُونَ خَبِيرٌۭ',
    (59, 23): 'هُوَ ٱللَّهُ ٱلَّذِى لَآ إِلَٰهَ إِلَّا هُوَ ٱلْمَلِكُ ٱلْقُدُّوسُ ٱلسَّلَٰمُ ٱلْمُؤْمِنُ ٱلْمُهَيْمِنُ ٱلْعَزِيزُ ٱلْجَبَّارُ ٱلْمُتَكَبِّرُ ۚ سُبْحَٰنَ ٱللَّهِ عَمَّا يُشْرِكُونَ',
    (59, 24): 'هُوَ ٱللَّهُ ٱلْخَٰلِقُ ٱلْبَارِئُ ٱلْمُصَوِّرُ ۖ لَهُ ٱلْأَسْمَآءُ ٱلْحُسْنَىٰ ۚ يُسَبِّحُ لَهُۥ مَا فِى ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ ۖ وَهُوَ ٱلْعَزِيزُ ٱلْحَكِيمُ',
    (72, 28): 'لِّيَعْلَمَ أَن قَدْ أَبْلَغُوا۟ رِسَٰلَٰتِ رَبِّهِمْ وَأَحَاطَ بِمَا لَدَيْهِمْ وَأَحْصَىٰ كُلَّ شَىْءٍ عَدَدًۢا',
    (75, 40): 'أَلَيْسَ ذَٰلِكَ بِقَٰدِرٍ عَلَىٰٓ أَن يُحْۦِىَ ٱلْمَوْتَىٰ',
    (82, 6): 'يَٰٓأَيُّهَا ٱلْإِنسَٰنُ مَا غَرَّكَ بِرَبِّكَ ٱلْكَرِيمِ',
    (85, 13): 'إِنَّهُۥ هُوَ يُبْدِئُ وَيُعِيدُ',
    (85, 15): 'ذُو ٱلْعَرْشِ ٱلْمَجِيدُ',
    (112, 1): 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ هُوَ ٱللَّهُ أَحَدٌ',
    (112, 2): 'ٱللَّهُ ٱلصَّمَدُ',
}
# Hadiths : hadith-api (fawazahmed0), éditions arabes (texte complet)
HADITHS = {
    'tirmidhi/1314': 'حَدَّثَنَا مُحَمَّدُ بْنُ بَشَّارٍ، حَدَّثَنَا الْحَجَّاجُ بْنُ مِنْهَالٍ، حَدَّثَنَا حَمَّادُ بْنُ سَلَمَةَ، عَنْ قَتَادَةَ، وَثَابِتٍ، وَحُمَيْدٍ، عَنْ أَنَسٍ، قَالَ غَلاَ السِّعْرُ عَلَى عَهْدِ رَسُولِ اللَّهِ صلى الله عليه وسلم فَقَالُوا يَا رَسُولَ اللَّهِ سَعِّرْ لَنَا \u200f.\u200f فَقَالَ \u200f "\u200f إِنَّ اللَّهَ هُوَ الْمُسَعِّرُ الْقَابِضُ الْبَاسِطُ الرَّزَّاقُ وَإِنِّي لأَرْجُو أَنْ أَلْقَى رَبِّي وَلَيْسَ أَحَدٌ مِنْكُمْ يَطْلُبُنِي بِمَظْلَمَةٍ فِي دَمٍ وَلاَ مَالٍ \u200f"\u200f \u200f.\u200f قَالَ أَبُو عِيسَى هَذَا حَدِيثٌ حَسَنٌ صَحِيحٌ \u200f.\u200f',
    'bukhari/834': 'حَدَّثَنَا قُتَيْبَةُ بْنُ سَعِيدٍ، قَالَ حَدَّثَنَا اللَّيْثُ، عَنْ يَزِيدَ بْنِ أَبِي حَبِيبٍ، عَنْ أَبِي الْخَيْرِ، عَنْ عَبْدِ اللَّهِ بْنِ عَمْرٍو، عَنْ أَبِي بَكْرٍ الصِّدِّيقِ ـ رضى الله عنه ـ\u200f.\u200f أَنَّهُ قَالَ لِرَسُولِ اللَّهِ صلى الله عليه وسلم عَلِّمْنِي دُعَاءً أَدْعُو بِهِ فِي صَلاَتِي\u200f.\u200f قَالَ \u200f "\u200f قُلِ اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا ��َلاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ، فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ، وَارْحَمْنِي إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ \u200f"\u200f\u200f.\u200f',
    'muslim/6869': 'حَدَّثَنَا قُتَيْبَةُ بْنُ سَعِيدٍ، حَدَّثَنَا لَيْثٌ، ح وَحَدَّثَنَا مُحَمَّدُ بْنُ رُمْحٍ، أَخْبَرَنَا اللَّيْثُ، عَنْ يَزِيدَ بْنِ أَبِي حَبِيبٍ، عَنْ أَبِي الْخَيْرِ، عَنْ عَبْدِ اللَّهِ بْنِ عَمْرٍو، عَنْ أَبِي بَكْرٍ، أَنَّهُ قَالَ لِرَسُولِ اللَّهِ صلى الله عليه وسلم عَلِّمْنِي دُعَاءً أَدْعُو بِهِ فِي صَلاَتِي قَالَ \u200f "\u200f قُلِ اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَبِيرًا - وَقَالَ قُتَيْبَةُ كَثِيرًا - وَلاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ وَارْحَمْنِي إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ \u200f"\u200f \u200f.\u200f',
}

NFC = lambda t: unicodedata.normalize("NFC", t)


def mots(s, v):
    return CORAN[(s, v)].split(" ")


def extrait(s, v, debut, fin):
    """Morceau continu exact du verset s:v (mots debut à fin-1). Refuse de commencer/finir sur un signe de pause."""
    m = mots(s, v)
    assert 0 <= debut < fin <= len(m), (s, v, debut, fin)
    assert squel(m[debut]) and squel(m[fin - 1]), ("extrait qui commence ou finit par un signe", s, v)
    t = " ".join(m[debut:fin])
    assert t in CORAN[(s, v)]
    return t


def hadith(cle, debut, fin):
    t = " ".join(HADITHS[cle].split(" ")[debut:fin])
    assert t in HADITHS[cle]
    return t


# --- Squelette des lettres (sans voyelles, signes ni lettres longues) : sert à vérifier qu'un ancien texte arabe
#     et l'extrait uthmani qui le remplace ont bien les mêmes lettres, mot pour mot. ---
FAIBLES = set("اىيوءئؤأإآٱ")


def squel(mot):
    r = []
    for c in mot:
        if unicodedata.category(c) == "Mn" or c in FAIBLES or not ("ء" <= c <= "ي" or c == "ٱ"):
            continue
        r.append("ت" if c == "ة" else c)
    return "".join(r)


def aligner(ancien, s, v):
    """Toutes les plages de mots du verset dont les lettres sont exactement celles de l'ancien texte."""
    m, cible, res = mots(s, v), "".join(squel(x) for x in ancien.split()), []
    for i in range(len(m)):
        if not squel(m[i]):
            continue
        acc = ""
        for j in range(i, len(m)):
            acc += squel(m[j])
            if acc == cible and squel(m[j]):
                res.append((i, j + 1))
            if len(acc) > len(cible):
                break
    return res


REF1 = re.compile(r"sourate [^,()]+\((\d+)\), verset (\d+)")
REF2 = re.compile(r"(\d+):(\d+)")


def verset_de(ref):
    m = REF1.search(ref) or REF2.search(ref)
    return int(m[1]), int(m[2])


def P(titre, arabe, traduction, ref, degre="coran", texte=None):
    return {"type": "preuve", "titre": titre, "arabe": arabe, "traduction": traduction, "ref": ref, "degre": degre, "texte": texte}


def section(f, titre=None, type_=None):
    r = [s for s in f["sections"] if (titre is None or s["titre"] == titre) and (type_ is None or s["type"] == type_)]
    assert len(r) == 1, (f["translit"], titre, type_, len(r))
    return r[0]


# --- Point i : preuves coraniques SANS arabe → (fiche, n° de section) : (sourate, verset, 1er mot, fin) ---
#     L'extrait correspond à ce que dit la traduction française de la fiche (verset entier quand elle le traduit en entier).
SANS_ARABE = {
    (32, 2): (2, 225, 12, 15), (33, 2): (2, 255, 55, 58), (34, 2): (15, 49, 1, 7), (35, 2): (35, 30, 0, 9),
    (36, 2): (2, 255, 55, 58), (37, 2): (13, 9, 0, 5), (38, 2): (12, 64, 12, 19), (40, 2): (4, 6, 39, 42),
    (41, 2): (55, 27, 0, 6), (42, 2): (82, 6, 0, 6), (43, 2): (4, 1, 29, 34), (44, 2): (11, 61, 27, 31),
    (45, 2): (2, 115, 0, 14), (46, 2): (2, 32, 1, 13), (47, 2): (11, 90, 6, 10), (48, 2): (85, 15, 0, 3),
    (49, 2): (22, 7, 0, 12), (50, 2): (4, 79, 18, 21), (51, 2): (22, 62, 0, 12), (52, 2): (3, 173, 13, 17),
    (52, 5): (3, 173, 13, 17), (53, 2): (22, 40, 34, 38), (54, 2): (51, 58, 0, 7), (55, 2): (2, 257, 0, 9),
    (57, 2): (72, 28, 9, 13), (61, 2): (23, 80, 0, 4), (62, 2): (2, 255, 0, 7), (63, 2): (2, 255, 0, 7),
    (65, 2): (85, 15, 0, 3), (68, 2): (112, 2, 0, 2), (70, 2): (54, 55, 0, 6),
}  # + 58, 59 (point c) et 66 (point d) = 34 preuves

# --- Point j : arabe en écriture courante → plage de mots du verset uthmani qui a exactement les mêmes lettres ---
ECRITURE_COURANTE = {
    (1, 2): (1, 3, 0, 2), (11, 2): (39, 62, 0, 4), (11, 3): (59, 24, 0, 5), (12, 2): (59, 24, 0, 5),
    (13, 2): (59, 24, 0, 5), (13, 3): (3, 6, 2, 7), (14, 2): (20, 82, 0, 9), (15, 2): (13, 16, 41, 49),
    (16, 2): (3, 8, 13, 16), (16, 3): (3, 8, 0, 16), (17, 2): (51, 58, 0, 7), (18, 2): (34, 26, 0, 11),
    (19, 2): (2, 29, 16, 20), (23, 2): (58, 11, 18, 27), (24, 2): (3, 26, 12, 15), (25, 2): (3, 26, 15, 18),
    (26, 2): (42, 11, 20, 23), (27, 2): (42, 11, 20, 23), (28, 2): (6, 114, 0, 4), (29, 2): (4, 40, 0, 6),
    (30, 2): (6, 103, 7, 10), (73, 2): (57, 3, 0, 5), (74, 2): (57, 3, 0, 5), (75, 2): (57, 3, 0, 5),
    (76, 2): (57, 3, 0, 5), (77, 2): (13, 11, 32, 38), (78, 2): (13, 9, 0, 5), (79, 2): (52, 28, 0, 10),
    (80, 2): (2, 37, 8, 12), (81, 2): (32, 22, 10, 14), (83, 2): (2, 143, 44, 49), (84, 2): (3, 26, 0, 12),
    (85, 2): (55, 27, 0, 6), (86, 2): (3, 18, 0, 12), (87, 2): (3, 9, 0, 8), (88, 2): (2, 263, 10, 13),
    (88, 3): (35, 15, 1, 12), (89, 2): (9, 28, 17, 24), (91, 3): (6, 17, 0, 9), (93, 2): (24, 35, 1, 5),
    (94, 2): (22, 54, 14, 22), (95, 2): (2, 117, 0, 3), (96, 2): (55, 27, 0, 6), (97, 2): (15, 23, 0, 6),
    (98, 2): (11, 88, 30, 39),
}  # 41 fiches (+ 82 et 92 traitées aux points a et b)

DIV_1314 = ("At-Tirmidhî : hasan sahih. Al-Albânî : sahih. Ahmad Châkir : sahih. Bashâr 'Awwâd Ma'rûf : hasan sahih. "
            "Zubair 'Alî Zaï : chaîne sahih.")
DIV_4955 = ("Al-Albânî : sahih. Shu'ayb Al-Arna'ût : sahih. Muhammad Muhyî Ad-Dîn 'Abd Al-Hamîd : sahih. "
            "Zubair 'Alî Zaï : chaîne hasan.")
REF_71_72 = "Sahîh Al-Boukhârî 1120 (d'après Ibn 'Abbâs) et Sahîh Mouslim 771 (d'après 'Alî)."


def doua_abou_bakr():
    """Al-Boukhârî 834, de « اللَّهُمَّ » à « الرَّحِيمُ » ; la lettre abîmée du mot 53 est reprise de Mouslim (n° API 6869)."""
    b, m = HADITHS["bukhari/834"].split(" "), HADITHS["muslim/6869"].split(" ")
    assert b[53][:2] == "��" and m[58][0] == "و" and b[53][2:] == m[58][1:], "Al-Boukhârî 834 : mot 53 inattendu"
    assert b[54:58] == [m[59], m[60], m[61], m[62] + "،"], "Al-Boukhârî 834 et Mouslim 2705 ne concordent plus"
    b[53] = m[58][0] + b[53][2:]
    t = " ".join(b[47:68])
    assert "�" not in t
    return t


def corriger(d):
    """d : {numero_appli: fiche}. Modifie sur place. Renvoie {numero: changements de la version enfant}."""
    enfants = {}

    # ---- a. 82 Al-'Afuww : 4:43 ----
    s = section(d[82], "Preuves dans le Coran")
    assert s["ref"] == "Coran, sourate An-Nisâ' (4), verset 99." and aligner(s["arabe"], 4, 99) == []
    assert aligner(s["arabe"], 4, 43) == [(45, 50)]
    s["arabe"] = extrait(4, 43, 45, 50)
    s["ref"] = "Coran, sourate An-Nisâ' (4), verset 43 (fin du verset)."

    # ---- b. 92 An-Nâfi' : 10:107 ----
    s = section(d[92], "Preuve liée au sens dans le Coran")
    assert s["ref"] == "Coran, sourate Yûnus (10), verset 107." and aligner(s["arabe"], 10, 107) == []
    s["arabe"] = extrait(10, 107, 10, 16)
    s["traduction"] = "« Et s'Il te veut un bien, nul ne peut repousser Sa grâce. »"   # Hamidullah, mot pour mot

    # ---- c. 58 Al-Mubdi' et 59 Al-Mu'îd : 85:13 en preuve principale, 10:4 avec sa vraie traduction ----
    for o in (58, 59):
        f = d[o]
        s = section(f, "Preuve dans le Coran liée à son sens")
        assert s["ref"] == "Sourate Yûnus, 10:4." and s["arabe"] is None and "cela Lui est facile" in s["traduction"]
        s.update({"arabe": extrait(85, 13, 0, 4), "ref": "Sourate Al-Burûj, 85:13.",
                  "traduction": "« C'est Lui, certes, qui commence (la création) et la refait. »"})  # Hamidullah
        i = f["sections"].index(s)
        f["sections"].insert(i + 1, P(
            "Autre preuve dans le Coran", extrait(10, 4, 8, 13),
            "« … C'est Lui qui fait la création une première fois puis la refait (en la ressuscitant)… »",  # Hamidullah
            "Sourate Yûnus, 10:4 (extrait)."))

    # ---- d. 66 Al-Wâhid : 13:16 ; 112:1 retiré ; 2:163 pour le sens seulement ----
    f = d[66]
    s = section(f, "Preuve dans le Coran")
    assert s["ref"] == "Sourate Al-Ikhlâs, 112:1." and s["texte"] == "Autre référence : Sourate Al-Baqara, 2:163."
    trad_15 = section(d[15], "Preuves dans le Coran")["traduction"]
    assert trad_15 == "« Dis : Allah est le Créateur de toute chose, et Il est l'Unique, le Dominateur suprême. »"
    w = mots(13, 16)[47]
    s.update({"arabe": extrait(13, 16, 41, 49), "traduction": trad_15, "ref": "Sourate Ar-Ra'd, 13:16 (fin du verset).",
              "texte": f"Ce verset contient le nom Al-Wâhid (« {w} »), avec l'article « Al- »."})
    w = mots(2, 163)[2]
    f["sections"].insert(f["sections"].index(s) + 1, P(
        "Autre verset, pour le sens", extrait(2, 163, 0, 3), "« Et votre Divinité est une divinité unique. »",
        "Sourate Al-Baqara, 2:163 (début du verset).",
        texte=f"Ici, le mot « {w} » qualifie la divinité (« une divinité unique ») : ce n'est pas le nom « Al-Wâhid » "
              "avec l'article, mais le verset confirme son sens."))

    # ---- e. 21 Al-Bâsit : At-Tirmidhî 1314, comme la fiche 20 Al-Qâbid ----
    f, p20 = d[21], section(d[20], "Preuve dans la Sunna")
    assert f["statut"] == "divergence" and p20["ref"] == "Jâmi' At-Tirmidhî, hadith 1314."
    ar = hadith("tirmidhi/1314", 39, 46)
    assert NFC(ar) == NFC(p20["arabe"]), "le hadith de la fiche 20 a changé"
    f["statut"], f["classement"] = "etabli", "sunna"
    f["provenance"] = "Sunna — hadith qualifié de « hasan sahih » par At-Tirmidhî ; l'action d'étendre est aussi dans le Coran (2:245)."
    i = f["sections"].index(section(f, "Preuve dans le Coran"))
    f["sections"].insert(i + 1, {
        "type": "prophetique", "titre": "Preuve dans la Sunna", "arabe": ar, "phonetique": p20["phonetique"],
        "traduction": p20["traduction"], "ref": p20["ref"], "degre": "sahih",
        "texte": "Le hadith rapporte qu'à une période où les prix avaient augmenté, des personnes demandèrent au Prophète ﷺ "
                 "de fixer les prix. Il répondit :",
        "note": "Avis sur son authenticité : " + DIV_1314 + "\n\nPrécision importante : ce hadith cite explicitement le nom "
                "Al-Bâsit. C'est le même hadith que pour Al-Qâbid (fiche 20).",
        "divergence": DIV_1314})
    s = section(f, "Quand invoquer Allah par ce nom ?")
    debut = "En raison de la divergence sur son établissement comme nom indépendant, privilégier les noms divins établis sans divergence pour les invocations.\n\n"
    assert s["texte"].startswith(debut)
    s["texte"] = s["texte"][len(debut):]
    a = section(f, type_="authenticite")
    a["badge"] = "SUNNA"
    a["texte"] = ("Attesté dans un hadith qualifié de « hasan sahih » par At-Tirmidhî (Jâmi' At-Tirmidhî 1314, le même hadith "
                  "que pour Al-Qâbid). Le terme apparaît explicitement dans la parole prophétique rapportée.\n\n"
                  "Le Coran mentionne aussi l'action d'étendre : Coran 2:245.")
    enfants[21] = {"statut": "etabli", "prudence": None}

    # ---- f. 34 Al-Ghafûr : invocation enseignée à Abû Bakr ----
    s = section(d[34], type_="prophetique")
    assert s["ref"].startswith("Jâmi' At-Tirmidhî, 3513") and s["arabe"] is None
    s.update({
        "titre": "Invocation prophétique authentique", "arabe": doua_abou_bakr(), "phonetique": None,
        "traduction": "Abû Bakr demanda au Prophète ﷺ une invocation à dire dans sa prière. Il lui dit de dire :\n\n"
                      "« Ô Allah, je me suis fait beaucoup de tort à moi-même, et nul ne pardonne les péchés en dehors de Toi. "
                      "Accorde-moi donc un pardon venant de Toi et fais-moi miséricorde. C'est Toi, certes, le Pardonneur, "
                      "le Très Miséricordieux. »",
        "ref": "Sahîh Al-Boukhârî 834 et Sahîh Mouslim 2705, d'après Abû Bakr (qu'Allah l'agrée).",
        "degre": "sahih", "texte": "Authenticité : hadith authentique, rapporté par Al-Boukhârî et Mouslim.", "note": None})
    del s["divergence"]

    # ---- g. 28 Al-Hakam : tous les avis sur Abû Dâwûd 4955 ----
    s = section(d[28], "Preuve dans la Sunna")
    assert s["ref"] == "Sunan Abî Dâwûd, hadith 4955." and "divergence" not in s
    s["divergence"] = DIV_4955
    s["texte"] += "\n\nAvis sur son authenticité : " + DIV_4955

    # ---- h. 71 et 72 : deux hadiths distincts ----
    for o in (71, 72):
        s = section(d[o], "Preuve authentique")
        assert s["ref"] == "Sahîh Al-Boukhârî 1120 et Sahîh Mouslim 771."
        s["ref"] = REF_71_72

    # ---- i. preuves coraniques sans arabe ----
    for (o, i), (sv, vv, a_, b_) in SANS_ARABE.items():
        s = d[o]["sections"][i]
        assert s["degre"] == "coran" and s["arabe"] is None and verset_de(s["ref"]) == (sv, vv), (o, i)
        s["arabe"] = extrait(sv, vv, a_, b_)

    # ---- j. écriture courante → uthmani ----
    for (o, i), (sv, vv, a_, b_) in ECRITURE_COURANTE.items():
        s = d[o]["sections"][i]
        assert s["degre"] == "coran" and verset_de(s["ref"]) == (sv, vv), (o, i)
        assert NFC(s["arabe"]) not in NFC(CORAN[(sv, vv)]) and aligner(s["arabe"], sv, vv) == [(a_, b_)], (o, i)
        t = extrait(sv, vv, a_, b_)
        if (o, i) == (24, 2):  # « تُعِزُّ » : l'ancien texte ne reprend pas le « وَ » collé au mot dans le Mushaf
            assert t[:2] == "وَ" and s["arabe"][0] != "و"
            t = t[2:]
        s["arabe"] = t
    return enfants


def controle_final(d):
    """Chaque preuve coranique (sauf la fiche 22, vide exprès) : arabe présent et morceau exact du verset cité."""
    n = 0
    for o, f in d.items():
        for s in f["sections"]:
            if s.get("degre") == "coran" and s.get("ref"):
                sv = verset_de(s["ref"])
                assert s["arabe"] and NFC(s["arabe"]) in NFC(CORAN[sv]), (o, s["titre"], sv)
                n += 1
    return n


def verifier_sources():
    import urllib.request
    lire = lambda u: json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "verif-fiches"}), timeout=60))
    for (s, v), t in CORAN.items():
        assert lire(f"https://api.alquran.cloud/v1/ayah/{s}:{v}/quran-uthmani")["data"]["text"] == t, (s, v)
    for cle, t in HADITHS.items():
        assert lire(f"https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-{cle}.json")["hadiths"][0]["text"] == t, cle
    print(f"✅ sources revérifiées sur les API : {len(CORAN)} versets, {len(HADITHS)} hadiths")


def main():
    if "--verifier" in sys.argv:
        verifier_sources()
    v4 = json.load(open(V4, encoding="utf-8"))
    avant = {f["numero_appli"]: f for f in v4}
    assert len(avant) == 99
    apres = copy.deepcopy(avant)
    enfants = corriger(apres)
    n_coran = controle_final(apres)
    changees = [o for o in sorted(apres) if apres[o] != avant[o]]
    for o in (22, 60, 67):
        assert apres[o] == avant[o], o
    assert [(apres[o]["statut"], apres[o]["classement"]) for o in (71, 72)] == [(avant[o]["statut"], avant[o]["classement"]) for o in (71, 72)]
    json.dump([apres[o] for o in sorted(apres)], open(V5, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    j = lambda f: json.dumps({k: v for k, v in f.items() if k != "numero_appli"}, ensure_ascii=False)
    lignes = [
        "-- 🌟 99 noms : contrôle final du 28/11/2026 (points a à k validés par Nadia) — GÉNÉRÉ par scripts/fiches-99-noms/corrections_28_11.py.",
        "-- Arabe du Coran : édition quran-uthmani (api.alquran.cloud), hadiths : hadith-api (fawazahmed0). Rien de mémoire.",
        "-- Une fiche adulte n'est remplacée que si elle est encore identique à la v4 (pas retouchée au ✏️).",
        "-- Version enfant : seule la fiche 21 change (statut, prudence).",
        "-- À appliquer avec `supabase db query --linked -f` (JAMAIS `db push`). Relancer = sans effet.",
        "",
    ]
    for o in changees:
        a, b = j(avant[o]), j(apres[o])
        assert "$v$" not in a + b
        lignes.append(f"update public.allah_names set fiche_adulte = $v${b}$v$::jsonb where display_order = {o} and fiche_adulte = $v${a}$v$::jsonb;")
    lignes.append("")
    for o, ch in sorted(enfants.items()):
        lignes.append(f"update public.allah_names set fiche_enfant = fiche_enfant || $v${json.dumps(ch, ensure_ascii=False)}$v$::jsonb "
                      f"where display_order = {o} and fiche_enfant is not null;")
    lignes.append("")
    lignes.append("-- Contrôle : fiches qui n'ont PAS reçu la correction (retouchées au ✏️ entre-temps) → à corriger à la main (0 ligne attendue)")
    lignes.append("select display_order, transliteration from public.allah_names where display_order in ("
                  + ", ".join(map(str, changees)) + ") and fiche_adulte not in ("
                  + ", ".join(f"$v${j(apres[o])}$v$::jsonb" for o in changees) + ") order by 1;")
    open(MIGRATION, "w", encoding="utf-8").write("\n".join(lignes) + "\n")
    print(f"✅ {len(changees)} fiches adultes corrigées : {changees} ; enfants : {sorted(enfants)} ; "
          f"{len(SANS_ARABE) + 3} arabes ajoutés (i), {len(ECRITURE_COURANTE)} passés en uthmani (j) ; "
          f"{n_coran} preuves coraniques contrôlées")


if __name__ == "__main__":
    main()
