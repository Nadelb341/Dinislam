/**
 * 🤲 « Besoin d'Allah » (carte 99 noms d'Allah, choix K-L-M de Nadia du 27/11) : copie de SECOURS hors ligne.
 * La vraie liste vit en base (tables `besoins_allah` + `besoins_allah_noms`, modifiable par Nadia ✏️).
 * Cette copie sert quand la base n'a jamais été lue sur l'appareil (1re ouverture sans réseau) ou si la table est vide.
 * ⚠️ Elle a servi à écrire la migration 20261127120000_besoin_allah.sql : les changer ENSEMBLE (un test compare les deux).
 *
 * 🕌 Règle n°1 (sunnite, malikite) : chaque nom est attesté dans le Coran ou dans un hadith d'Al-Boukhârî ;
 * chaque fin est un verset du Coran ou un hadith d'Al-Boukhârî, avec sa référence exacte.
 * Versets relus sur api.alquran.cloud (texte arabe « quran-simple ») le 27/11/2026 ;
 * hadiths relus sur la copie de Sahîh al-Boukhârî de fawazahmed0/hadith-api (numérotation habituelle).
 * Le moindre doute → `a_verifier: true` + `note` (affiché à l'enseignante seulement).
 */

export interface NomBesoin {
  /** Nom tel qu'il est écrit dans la table `allah_names` (colonne transliteration) : sert au lien vers sa fiche. Absent = hors des 99 de l'appli */
  base?: string;
  arabe: string;
  phonetique: string;
  sens: string;
  /** Où le nom est attesté (Coran / Al-Boukhârî) */
  attestation: string;
  a_verifier?: boolean;
  note?: string;
}

export interface BesoinAllah {
  cle: string;
  emoji: string;
  titre: string;
  /** Couleur propre à l'émotion (pastille de la grille, liseré de la fiche) */
  couleur: string;
  /** 1re ligne de l'écran d'accueil de l'histoire */
  accroche: string;
  /** 2e ligne, en doré */
  accroche_doree: string;
  /** Comment utiliser ces noms dans son invocation */
  conseil: string;
  fin_arabe: string;
  fin_phonetique: string;
  fin_traduction: string;
  fin_source: string;
  a_verifier?: boolean;
  note?: string;
  noms: NomBesoin[];
}

const DOREE = 'Lis ces noms jusqu\'au bout.';

export const BESOINS_ALLAH: BesoinAllah[] = [
  {
    cle: 'tristesse', emoji: '😢', titre: 'Tristesse', couleur: '#3b82f6',
    accroche: 'Ton cœur est triste ?', accroche_doree: DOREE,
    conseil: 'Lève les mains et appelle Allah par ces noms : « Yâ Latîf, Yâ Wadoûd… ». Dis-Lui ce qui te rend triste, avec tes mots à toi. Il est tout proche et Il répond.',
    fin_arabe: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    fin_phonetique: 'Alâ bi-dhikri-llâhi tatma\'innou-l-qouloûb',
    fin_traduction: 'C\'est par le rappel d\'Allah que les cœurs s\'apaisent.',
    fin_source: 'Coran 13:28',
    noms: [
      { base: 'Al-Latîf', arabe: 'اللَّطِيفُ', phonetique: 'Al-Latîf', sens: 'Le Très Doux, qui arrange tout avec finesse', attestation: 'Coran 12:100 et 42:19' },
      { base: 'Al-Wadûd', arabe: 'الوَدُودُ', phonetique: 'Al-Wadoûd', sens: 'Celui qui aime Ses serviteurs', attestation: 'Coran 11:90 et 85:14' },
      { base: 'Ar-Rahîm', arabe: 'الرَّحِيمُ', phonetique: 'Ar-Rahîm', sens: 'Le Très Miséricordieux', attestation: 'Coran 1:3 et 2:37' },
      { arabe: 'القَرِيبُ', phonetique: 'Al-Qarîb', sens: 'Le Tout Proche', attestation: 'Coran 2:186 et 11:61' },
      { base: 'Al-Mujîb', arabe: 'المُجِيبُ', phonetique: 'Al-Moujîb', sens: 'Celui qui répond aux invocations', attestation: 'Coran 11:61' },
    ],
  },
  {
    cle: 'culpabilite', emoji: '💔', titre: 'Culpabilité', couleur: '#e11d48',
    accroche: 'Tes erreurs te pèsent ?', accroche_doree: DOREE,
    conseil: 'Regrette sincèrement, demande pardon et décide de ne pas recommencer. Puis invoque : « Yâ Tawwâb, Yâ Ghafoûr, pardonne-moi ». Aucune faute n\'est plus grande que la miséricorde d\'Allah.',
    fin_arabe: 'لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا',
    fin_phonetique: 'Lâ taqnatoû min rahmati-llâh, inna-llâha yaghfirou-dh-dhounoûba jamî\'â',
    fin_traduction: 'Ne désespérez pas de la miséricorde d\'Allah : Allah pardonne tous les péchés.',
    fin_source: 'Coran 39:53',
    noms: [
      { base: 'At-Tawwâb', arabe: 'التَّوَّابُ', phonetique: 'At-Tawwâb', sens: 'Celui qui accepte le repentir', attestation: 'Coran 2:37 et 49:12' },
      { base: 'Al-Ghaffâr', arabe: 'الغَفَّارُ', phonetique: 'Al-Ghaffâr', sens: 'Celui qui pardonne encore et encore', attestation: 'Coran 20:82 et 71:10' },
      { base: 'Al-Ghafûr', arabe: 'الغَفُورُ', phonetique: 'Al-Ghafoûr', sens: 'Le Pardonneur', attestation: 'Coran 39:53' },
      { base: 'Al-\'Afuww', arabe: 'العَفُوُّ', phonetique: 'Al-\'Afouww', sens: 'Celui qui efface les fautes', attestation: 'Coran 4:43 et 4:149' },
      { base: 'Ar-Ra\'ûf', arabe: 'الرَّؤُوفُ', phonetique: 'Ar-Raoûf', sens: 'Le Très Bon, plein de tendresse', attestation: 'Coran 2:143 et 59:10' },
      { base: 'Al-Halîm', arabe: 'الحَلِيمُ', phonetique: 'Al-Halîm', sens: 'Le Patient, qui ne se presse pas de punir', attestation: 'Coran 2:225' },
      { base: 'Ar-Rahmân', arabe: 'الرَّحْمَنُ', phonetique: 'Ar-Rahmân', sens: 'Le Tout Miséricordieux', attestation: 'Coran 1:3 et 55:1' },
    ],
  },
  {
    cle: 'inquietude', emoji: '😟', titre: 'Inquiétude', couleur: '#f97316',
    accroche: 'Ton cœur s\'inquiète ?', accroche_doree: DOREE,
    conseil: 'Fais ce que tu peux, puis confie le reste à Allah. Dis : « Hasbounâ-llâhou wa ni\'ma-l-wakîl » (Allah nous suffit, c\'est le meilleur garant ; Coran 3:173), puis appelle-Le par ces noms.',
    fin_arabe: 'وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    fin_phonetique: 'Wa man yatawakkal \'ala-llâhi fa-houwa hasbouh',
    fin_traduction: 'Celui qui place sa confiance en Allah, Allah lui suffit.',
    fin_source: 'Coran 65:3',
    noms: [
      { base: 'Al-Wakîl', arabe: 'الوَكِيلُ', phonetique: 'Al-Wakîl', sens: 'Celui à qui l\'on confie tout', attestation: 'Coran 3:173 et 33:3' },
      { base: 'Al-Hafîz', arabe: 'الحَفِيظُ', phonetique: 'Al-Hafîz', sens: 'Le Gardien qui protège', attestation: 'Coran 11:57' },
      { base: 'Al-Latîf', arabe: 'اللَّطِيفُ', phonetique: 'Al-Latîf', sens: 'Le Très Doux, qui arrange tout avec finesse', attestation: 'Coran 12:100' },
      { base: 'As-Salâm', arabe: 'السَّلَامُ', phonetique: 'As-Salâm', sens: 'La Paix, source de toute paix', attestation: 'Coran 59:23' },
      { base: 'Al-Mu\'min', arabe: 'المُؤْمِنُ', phonetique: 'Al-Mou\'min', sens: 'Celui qui donne la sécurité', attestation: 'Coran 59:23' },
      { base: 'Al-\'Alîm', arabe: 'العَلِيمُ', phonetique: 'Al-\'Alîm', sens: 'Celui qui sait tout', attestation: 'Coran 2:32' },
    ],
  },
  {
    cle: 'peur', emoji: '😨', titre: 'Peur', couleur: '#7c3aed',
    accroche: 'Tu as peur ?', accroche_doree: DOREE,
    conseil: 'Allah entend et voit tout. Dis : « Yâ Hafîz, protège-moi », et souviens-toi qu\'Il est avec toi.',
    fin_arabe: 'لَا تَخَافَا ۖ إِنَّنِي مَعَكُمَا أَسْمَعُ وَأَرَىٰ',
    fin_phonetique: 'Lâ takhâfâ, innanî ma\'akoumâ asma\'ou wa arâ',
    fin_traduction: 'N\'ayez pas peur : Je suis avec vous, J\'entends et Je vois. (Allah à Moussa et Haroun)',
    fin_source: 'Coran 20:46',
    noms: [
      { base: 'Al-Hafîz', arabe: 'الحَفِيظُ', phonetique: 'Al-Hafîz', sens: 'Le Gardien qui protège', attestation: 'Coran 11:57' },
      { base: 'Al-Mu\'min', arabe: 'المُؤْمِنُ', phonetique: 'Al-Mou\'min', sens: 'Celui qui donne la sécurité', attestation: 'Coran 59:23' },
      { base: 'Al-Muhaimin', arabe: 'المُهَيْمِنُ', phonetique: 'Al-Mouhaymin', sens: 'Celui qui veille sur tout', attestation: 'Coran 59:23' },
      { base: 'Al-Walî', arabe: 'الوَلِيُّ', phonetique: 'Al-Walî', sens: 'Le Protecteur des croyants', attestation: 'Coran 2:257 et 4:45' },
      { base: 'Al-Qawî', arabe: 'القَوِيُّ', phonetique: 'Al-Qawî', sens: 'Le Très Fort', attestation: 'Coran 22:40 et 42:19' },
      { base: 'As-Samî\'', arabe: 'السَّمِيعُ', phonetique: 'As-Samî\'', sens: 'Celui qui entend tout', attestation: 'Coran 42:11' },
      { base: 'Al-Basîr', arabe: 'البَصِيرُ', phonetique: 'Al-Basîr', sens: 'Celui qui voit tout', attestation: 'Coran 42:11' },
    ],
  },
  {
    cle: 'colere', emoji: '😠', titre: 'Colère', couleur: '#dc2626',
    accroche: 'La colère monte en toi ?', accroche_doree: DOREE,
    conseil: 'Dis tout de suite : « A\'oûdhou bi-llâhi mina-ch-chaytâni-r-rajîm » : le Prophète ﷺ a dit que cette parole fait partir la colère (Al-Boukhârî 6115). Puis demande à Allah de te donner la douceur.',
    fin_arabe: 'وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ ۗ وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ',
    fin_phonetique: 'Wa-l-kâzimîna-l-ghayza wa-l-\'âfîna \'ani-n-nâs, wa-llâhou youhibbou-l-mouhsinîn',
    fin_traduction: '… ceux qui retiennent leur colère et pardonnent aux gens. Et Allah aime ceux qui font le bien.',
    fin_source: 'Coran 3:134',
    noms: [
      { base: 'Al-Halîm', arabe: 'الحَلِيمُ', phonetique: 'Al-Halîm', sens: 'Le Patient, qui ne se presse pas de punir', attestation: 'Coran 2:225 et 64:17' },
      { base: 'Al-\'Afuww', arabe: 'العَفُوُّ', phonetique: 'Al-\'Afouww', sens: 'Celui qui efface les fautes', attestation: 'Coran 4:149' },
      { base: 'Al-Ghafûr', arabe: 'الغَفُورُ', phonetique: 'Al-Ghafoûr', sens: 'Le Pardonneur', attestation: 'Coran 24:22' },
      { base: 'As-Salâm', arabe: 'السَّلَامُ', phonetique: 'As-Salâm', sens: 'La Paix, source de toute paix', attestation: 'Coran 59:23' },
      { base: 'Ar-Rahîm', arabe: 'الرَّحِيمُ', phonetique: 'Ar-Rahîm', sens: 'Le Très Miséricordieux', attestation: 'Coran 24:22' },
    ],
  },
  {
    cle: 'solitude', emoji: '🫥', titre: 'Solitude', couleur: '#0d9488',
    accroche: 'Tu te sens seul(e) ?', accroche_doree: DOREE,
    conseil: 'Allah est plus proche de toi que tout. Parle-Lui comme à Quelqu\'un qui t\'écoute : « Yâ Qarîb, Yâ Moujîb ». Tu n\'as besoin de personne entre toi et Lui.',
    fin_arabe: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ',
    fin_phonetique: 'Wa idhâ sa\'alaka \'ibâdî \'annî fa-innî qarîb, oujîbou da\'wata-d-dâ\'i idhâ da\'ân',
    fin_traduction: 'Quand Mes serviteurs t\'interrogent sur Moi : Je suis tout proche, Je réponds à l\'appel de celui qui M\'invoque.',
    fin_source: 'Coran 2:186',
    noms: [
      { arabe: 'القَرِيبُ', phonetique: 'Al-Qarîb', sens: 'Le Tout Proche', attestation: 'Coran 2:186 et 11:61' },
      { base: 'Al-Mujîb', arabe: 'المُجِيبُ', phonetique: 'Al-Moujîb', sens: 'Celui qui répond aux invocations', attestation: 'Coran 11:61' },
      { base: 'Al-Wadûd', arabe: 'الوَدُودُ', phonetique: 'Al-Wadoûd', sens: 'Celui qui aime Ses serviteurs', attestation: 'Coran 85:14' },
      { base: 'Al-Walî', arabe: 'الوَلِيُّ', phonetique: 'Al-Walî', sens: 'Le Protecteur des croyants', attestation: 'Coran 2:257' },
      { base: 'As-Samî\'', arabe: 'السَّمِيعُ', phonetique: 'As-Samî\'', sens: 'Celui qui entend tout', attestation: 'Coran 2:127' },
    ],
  },
  {
    cle: 'maladie', emoji: '🤒', titre: 'Maladie', couleur: '#059669',
    accroche: 'Tu es malade ou tu as mal ?', accroche_doree: DOREE,
    conseil: 'Le Prophète ﷺ disait près d\'un malade : « Adh-hibi-l-ba\'s, rabba-n-nâs, ichfi wa anta-ch-Châfî, lâ chifâ\'a illâ chifâ\'ouk, chifâ\'an lâ youghâdirou saqamâ » (Enlève le mal, Seigneur des gens ; guéris, c\'est Toi qui guéris ; il n\'y a de guérison que la Tienne, une guérison qui ne laisse aucune maladie). Al-Boukhârî 5675.',
    fin_arabe: 'وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ',
    fin_phonetique: 'Wa idhâ maridtou fa-houwa yachfîn',
    fin_traduction: 'Et quand je suis malade, c\'est Lui qui me guérit. (paroles d\'Ibrâhîm)',
    fin_source: 'Coran 26:80',
    noms: [
      { arabe: 'الشَّافِي', phonetique: 'Ach-Châfî', sens: 'Celui qui guérit', attestation: 'Al-Boukhârî 5675 et 5743' },
      { base: 'Ar-Rahîm', arabe: 'الرَّحِيمُ', phonetique: 'Ar-Rahîm', sens: 'Le Très Miséricordieux', attestation: 'Coran 1:3 (et l\'invocation d\'Ayyoûb, 21:83)' },
      { base: 'Al-Mujîb', arabe: 'المُجِيبُ', phonetique: 'Al-Moujîb', sens: 'Celui qui répond aux invocations', attestation: 'Coran 11:61 (et 21:84)' },
      { base: 'Al-Latîf', arabe: 'اللَّطِيفُ', phonetique: 'Al-Latîf', sens: 'Le Très Doux, qui arrange tout avec finesse', attestation: 'Coran 42:19' },
      { base: 'Al-Qawî', arabe: 'القَوِيُّ', phonetique: 'Al-Qawî', sens: 'Le Très Fort', attestation: 'Coran 42:19' },
    ],
  },
  {
    cle: 'injustice', emoji: '⚖️', titre: 'Injustice', couleur: '#4f46e5',
    accroche: 'On a été injuste avec toi ?', accroche_doree: DOREE,
    conseil: 'Ne réponds pas au mal par le mal. Confie ton affaire à Allah : rien ne Lui échappe. L\'invocation de celui qui subit une injustice monte vers Lui sans aucun voile.',
    fin_arabe: 'وَاتَّقِ دَعْوَةَ الْمَظْلُومِ، فَإِنَّهُ لَيْسَ بَيْنَهُ وَبَيْنَ اللَّهِ حِجَابٌ',
    fin_phonetique: 'Wattaqi da\'wata-l-mazloûm, fa-innahoû laysa baynahoû wa bayna-llâhi hijâb',
    fin_traduction: 'Méfie-toi de l\'invocation de celui qui subit une injustice : entre elle et Allah, il n\'y a aucun voile.',
    fin_source: 'Al-Boukhârî 1496',
    noms: [
      { base: 'Al-Haqq', arabe: 'الحَقُّ', phonetique: 'Al-Haqq', sens: 'La Vérité', attestation: 'Coran 24:25' },
      { base: 'Ash-Shahîd', arabe: 'الشَّهِيدُ', phonetique: 'Ach-Chahîd', sens: 'Le Témoin de toute chose', attestation: 'Coran 22:17' },
      { base: 'Al-Hasîb', arabe: 'الحَسِيبُ', phonetique: 'Al-Hasîb', sens: 'Celui qui fait les comptes, et qui suffit', attestation: 'Coran 4:6' },
      { base: 'Al-Basîr', arabe: 'البَصِيرُ', phonetique: 'Al-Basîr', sens: 'Celui qui voit tout', attestation: 'Coran 42:11' },
      { base: 'Al-Wakîl', arabe: 'الوَكِيلُ', phonetique: 'Al-Wakîl', sens: 'Celui à qui l\'on confie tout', attestation: 'Coran 33:3' },
      { base: 'Al-\'Azîz', arabe: 'العَزِيزُ', phonetique: 'Al-\'Azîz', sens: 'Le Tout-Puissant, que rien ne vainc', attestation: 'Coran 22:40 et 59:23' },
    ],
  },
  {
    cle: 'rizq', emoji: '💸', titre: 'Inquiétude pour le rizq', couleur: '#ca8a04',
    accroche: 'Tu t\'inquiètes pour ton rizq ?', accroche_doree: DOREE,
    conseil: 'Le rizq, c\'est tout ce qu\'Allah te donne : nourriture, argent, santé, amis, savoir… Il est déjà écrit. Fais des efforts, puis demande : « Yâ Razzâq, Yâ Fattâh, ouvre-moi les portes de Ta générosité ».',
    fin_arabe: 'وَفِي السَّمَاءِ رِزْقُكُمْ وَمَا تُوعَدُونَ',
    fin_phonetique: 'Wa fi-s-samâ\'i rizqoukoum wa mâ tou\'adoûn',
    fin_traduction: 'Et dans le ciel est votre subsistance, ainsi que ce qui vous est promis.',
    fin_source: 'Coran 51:22',
    noms: [
      { base: 'Ar-Razzâq', arabe: 'الرَّزَّاقُ', phonetique: 'Ar-Razzâq', sens: 'Celui qui donne la subsistance', attestation: 'Coran 51:58' },
      { base: 'Al-Fattâh', arabe: 'الفَتَّاحُ', phonetique: 'Al-Fattâh', sens: 'Celui qui ouvre toutes les portes', attestation: 'Coran 34:26' },
      { base: 'Al-Wahhâb', arabe: 'الوَهَّابُ', phonetique: 'Al-Wahhâb', sens: 'Celui qui donne sans compter', attestation: 'Coran 3:8' },
      { base: 'Al-Karîm', arabe: 'الكَرِيمُ', phonetique: 'Al-Karîm', sens: 'Le Très Généreux', attestation: 'Coran 27:40 et 82:6' },
      { base: 'Al-Ghanî', arabe: 'الغَنِيُّ', phonetique: 'Al-Ghanî', sens: 'Le Riche, qui n\'a besoin de rien', attestation: 'Coran 35:15' },
      { base: 'Al-Mujîb', arabe: 'المُجِيبُ', phonetique: 'Al-Moujîb', sens: 'Celui qui répond aux invocations', attestation: 'Coran 11:61' },
      { base: 'Al-Wakîl', arabe: 'الوَكِيلُ', phonetique: 'Al-Wakîl', sens: 'Celui à qui l\'on confie tout', attestation: 'Coran 33:3' },
    ],
  },
  {
    cle: 'fatigue', emoji: '😮‍💨', titre: 'Fatigue', couleur: '#0284c7',
    accroche: 'Tu es fatigué(e) ?', accroche_doree: DOREE,
    conseil: 'Allah ne te demande jamais plus que ce que tu peux porter. Avant de dormir, dis 33 fois « Soubhâna-llâh », 33 fois « Al-hamdou li-llâh » et 34 fois « Allâhou akbar » : le Prophète ﷺ a dit à Fâtima et \'Alî que c\'est mieux pour eux qu\'un serviteur (Al-Boukhârî 5361).',
    fin_arabe: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    fin_phonetique: 'Lâ youkallifou-llâhou nafsan illâ wous\'ahâ',
    fin_traduction: 'Allah n\'impose à personne plus que ce qu\'il peut porter.',
    fin_source: 'Coran 2:286',
    noms: [
      { base: 'Al-Qawî', arabe: 'القَوِيُّ', phonetique: 'Al-Qawî', sens: 'Le Très Fort', attestation: 'Coran 42:19' },
      { base: 'Al-Matîn', arabe: 'المَتِينُ', phonetique: 'Al-Matîn', sens: 'L\'Inébranlable, dont la force ne faiblit jamais', attestation: 'Coran 51:58' },
      { base: 'Al-Hayy', arabe: 'الحَيُّ', phonetique: 'Al-Hayy', sens: 'Le Vivant', attestation: 'Coran 2:255' },
      { base: 'Al-Qayyûm', arabe: 'القَيُّومُ', phonetique: 'Al-Qayyoûm', sens: 'Celui qui fait tenir toute chose, sans jamais Se fatiguer', attestation: 'Coran 2:255' },
      { base: 'Al-Latîf', arabe: 'اللَّطِيفُ', phonetique: 'Al-Latîf', sens: 'Le Très Doux, qui arrange tout avec finesse', attestation: 'Coran 42:19' },
      { base: 'Ar-Ra\'ûf', arabe: 'الرَّؤُوفُ', phonetique: 'Ar-Raoûf', sens: 'Le Très Bon, plein de tendresse', attestation: 'Coran 2:143' },
    ],
  },
  {
    cle: 'guidance', emoji: '🧭', titre: 'Besoin de guidance', couleur: '#c026d3',
    accroche: 'Tu ne sais pas quel chemin prendre ?', accroche_doree: DOREE,
    conseil: 'Pour un choix important, fais la prière de consultation (istikhâra), que le Prophète ﷺ enseignait comme une sourate du Coran (Al-Boukhârî 1166). Et demande chaque jour, dans la Fâtiha : « Ihdinâ-s-sirâta-l-moustaqîm ».',
    fin_arabe: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
    fin_phonetique: 'Ihdinâ-s-sirâta-l-moustaqîm',
    fin_traduction: 'Guide-nous sur le droit chemin.',
    fin_source: 'Coran 1:6',
    noms: [
      { base: 'Al-Hâdî', arabe: 'الهَادِي', phonetique: 'Al-Hâdî', sens: 'Celui qui guide', attestation: 'Coran 22:54 et 25:31', a_verifier: true,
        note: 'Dans le Coran, le mot est employé pour Allah (« Allah guide ceux qui croient », 22:54 ; « Ton Seigneur suffit comme guide », 25:31). La plupart des savants le comptent parmi Ses noms : à confirmer par Nadia.' },
      { base: 'An-Nûr', arabe: 'النُّورُ', phonetique: 'An-Noûr', sens: 'La Lumière', attestation: 'Coran 24:35', a_verifier: true,
        note: 'Coran 24:35 : « Allah est la Lumière des cieux et de la terre ». Certains savants le comptent parmi Ses noms, d\'autres y voient une description : à confirmer par Nadia.' },
      { base: 'Al-\'Alîm', arabe: 'العَلِيمُ', phonetique: 'Al-\'Alîm', sens: 'Celui qui sait tout', attestation: 'Coran 2:32' },
      { base: 'Al-Hakîm', arabe: 'الحَكِيمُ', phonetique: 'Al-Hakîm', sens: 'Le Sage', attestation: 'Coran 2:32' },
      { base: 'Al-Khabîr', arabe: 'الخَبِيرُ', phonetique: 'Al-Khabîr', sens: 'Celui qui connaît le fond des choses', attestation: 'Coran 6:18 et 67:14' },
      { base: 'Al-Fattâh', arabe: 'الفَتَّاحُ', phonetique: 'Al-Fattâh', sens: 'Celui qui ouvre toutes les portes', attestation: 'Coran 34:26' },
    ],
  },
  {
    cle: 'gratitude', emoji: '😊', titre: 'Gratitude', couleur: '#65a30d',
    accroche: 'Ton cœur est plein de reconnaissance ?', accroche_doree: DOREE,
    conseil: 'Remercie Allah avec ta langue (« Al-hamdou li-llâh »), avec ton cœur, et en utilisant Ses bienfaits pour le bien. Plus tu remercies, plus Il donne.',
    fin_arabe: 'لَئِنْ شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    fin_phonetique: 'La-in chakartoum la-azîdannakoum',
    fin_traduction: 'Si vous êtes reconnaissants, J\'augmenterai Mes bienfaits pour vous.',
    fin_source: 'Coran 14:7',
    noms: [
      { base: 'Ash-Shakûr', arabe: 'الشَّكُورُ', phonetique: 'Ach-Chakoûr', sens: 'Celui qui récompense largement le moindre bien', attestation: 'Coran 35:34 et 64:17' },
      { base: 'Al-Hamîd', arabe: 'الحَمِيدُ', phonetique: 'Al-Hamîd', sens: 'Celui qui mérite toutes les louanges', attestation: 'Coran 31:12 et 35:15' },
      { base: 'Al-Wahhâb', arabe: 'الوَهَّابُ', phonetique: 'Al-Wahhâb', sens: 'Celui qui donne sans compter', attestation: 'Coran 3:8' },
      { base: 'Al-Karîm', arabe: 'الكَرِيمُ', phonetique: 'Al-Karîm', sens: 'Le Très Généreux', attestation: 'Coran 82:6' },
      { base: 'Al-Barr', arabe: 'البَرُّ', phonetique: 'Al-Barr', sens: 'Le Bienfaisant', attestation: 'Coran 52:28' },
      { base: 'Ar-Razzâq', arabe: 'الرَّزَّاقُ', phonetique: 'Ar-Razzâq', sens: 'Celui qui donne la subsistance', attestation: 'Coran 51:58' },
    ],
  },
];
