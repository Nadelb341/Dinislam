// Contenu authentique des invocations — textes tirés du Coran et des hadiths (domaine public)
// Correspondance par mots-clés sur le titre français de la BD

export interface InvocationEnrichment {
  keywords: string[];
  arabic: string;
  transliteration: string;
  translation: string;
  virtue: string;
  source: string;
  extra?: string; // info complémentaire (ex: si on oublie...)
  videoUrl?: string; // URL YouTube (watch) pour la vidéo d'apprentissage (seulement si pas de vidéo de l'appli)
  /** Vidéo de l'appli (extrait), venue du canal Telegram de Nadia (2026-11-08) — prioritaire sur YouTube, gardée hors ligne */
  video?: string;
  /** Vidéo entière (bouton « Vidéo entière » en haut de la fenêtre) */
  videoEntiere?: string;
}

export const INVOCATIONS_ENRICHMENT: InvocationEnrichment[] = [
  // ── Ajoutées le 2026-11-08 (canal Telegram de Nadia) — placées en tête : leurs mots-clés sont précis ──
  // Oubli de « Bismillah » au début du repas
  {
    keywords: ['oublie de dire bismillah', 'oubli de dire bismillah', 'oublie bismillah', 'oubli bismillah'],
    arabic: 'بِسْمِ اللهِ أَوَّلَهُ وَآخِرَهُ',
    transliteration: 'Bismillâhi awwalahu wa âkhirahu.',
    translation: "Au nom d'Allah, au début et à la fin.",
    virtue: "Si l'on a oublié de dire « Bismillâh » au début du repas, on le dit dès qu'on s'en souvient : le repas reste béni et le shaytan ne profite pas de la nourriture.",
    source: "Rapporté par Abû Dâwûd (n°3767) et At-Tirmidhî (n°1858)",
    video: "/videos/invocations/04-oubli-bismillah.mp4",
  },
  // En sortant de la maison
  {
    keywords: ['sortant de la maison', 'sortir de la maison', 'sortie de la maison'],
    arabic: 'بِسْمِ اللهِ، تَوَكَّلْتُ عَلَى اللهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',
    transliteration: "Bismillâh, tawakkaltu 'alâ Llâh, wa lâ hawla wa lâ quwwata illâ bi-Llâh.",
    translation: "Au nom d'Allah, je m'en remets à Allah, il n'y a de force ni de puissance qu'en Allah.",
    virtue: "Le Prophète ﷺ a dit : à celui qui dit cela en sortant de chez lui, il est répondu : « Tu es guidé, tu es suffi et tu es protégé », et le shaytan s'écarte de lui.",
    source: "Rapporté par Abû Dâwûd (n°5095) et At-Tirmidhî (n°3426)",
    video: "/videos/invocations/06-sortir-maison-extrait.mp4",
    videoEntiere: "/videos/invocations/06-sortir-maison-entiere.mp4",
  },
  // En entrant à la maison
  {
    keywords: ['entrant à la maison', 'entrer à la maison', 'entrant dans la maison', 'rentrant à la maison'],
    arabic: 'بِسْمِ اللهِ وَلَجْنَا، وَبِسْمِ اللهِ خَرَجْنَا، وَعَلَى رَبِّنَا تَوَكَّلْنَا',
    transliteration: "Bismi Llâhi walajnâ, wa bismi Llâhi kharajnâ, wa 'alâ rabbinâ tawakkalnâ.",
    translation: "Au nom d'Allah nous entrons, au nom d'Allah nous sortons, et c'est en notre Seigneur que nous plaçons notre confiance.",
    virtue: "En entrant, on dit « Bismillâh » puis on salue sa famille (« As-salâmu 'alaykum ») : la maison est ainsi protégée et le shaytan n'y trouve pas de place.",
    source: "Rapporté par Abû Dâwûd (n°5096)",
    extra: "Après l'invocation, on salue les personnes de la maison : « As-salâmu 'alaykum ».",
    video: "/videos/invocations/07-entrer-maison-extrait.mp4",
    videoEntiere: "/videos/invocations/07-entrer-maison-entiere.mp4",
  },
  // Lorsque j'ai mal
  {
    keywords: ["j'ai mal", 'j’ai mal', 'douleur'],
    arabic: 'أَعُوذُ بِاللهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ',
    transliteration: "A'ûdhu bi-Llâhi wa qudratihi min sharri mâ ajidu wa uhâdhir.",
    translation: "Je cherche refuge auprès d'Allah et de Sa puissance contre le mal que je ressens et que je redoute.",
    virtue: "Un compagnon se plaignit d'une douleur. Le Prophète ﷺ lui recommanda de poser la main droite à l'endroit qui fait mal, de dire 3 fois « Bismillâh », puis 7 fois cette invocation.",
    source: "Rapporté par Muslim (n°2202)",
    extra: "1. Pose ta main droite là où tu as mal. 2. Dis 3 fois « Bismillâh ». 3. Dis 7 fois l'invocation.",
    video: "/videos/invocations/10-douleur-extrait.mp4",
    videoEntiere: "/videos/invocations/10-douleur-entiere.mp4",
  },
  // Rupture du jeûne
  {
    keywords: ['jeûne', 'jeune', 'rompre', 'rupture', 'iftar'],
    arabic: 'ذَهَبَ الظَّمَأُ، وَابْتَلَّتِ العُرُوقُ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللهُ',
    transliteration: "Dhahaba z-zama', wa btallati l-'urûq, wa thabata l-ajru in shâ'a Llâh.",
    translation: "La soif s'en est allée, les veines sont irriguées et la récompense est assurée, si Allah le veut.",
    virtue: "Le Prophète ﷺ disait cette invocation au moment de rompre le jeûne. Le moment de l'iftar est un moment où les invocations sont exaucées.",
    source: "Rapporté par Abû Dâwûd (n°2357)",
    video: "/videos/invocations/11-rupture-jeune.mp4",
  },
  // Tachahoud — 1re partie
  {
    keywords: ['tachahoud (1', 'tachahhoud (1', 'tachahoud 1', 'tachahoud - 1'],
    arabic: 'التَّحِيَّاتُ لِلَّهِ، الزَّاكِيَاتُ لِلَّهِ، الطَّيِّبَاتُ الصَّلَوَاتُ لِلَّهِ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration: "At-tahiyyâtu li-Llâh, az-zâkiyâtu li-Llâh, at-tayyibâtu s-salawâtu li-Llâh. As-salâmu 'alayka ayyuha n-nabiyyu wa rahmatu Llâhi wa barakâtuh. As-salâmu 'alaynâ wa 'alâ 'ibâdi Llâhi s-sâlihîn. Ash-hadu an lâ ilâha illa Llâh, wa ash-hadu anna Muhammadan 'abduhu wa rasûluh.",
    translation: "Les salutations sont pour Allah, ainsi que les bénédictions et les excellentes prières. Salut à toi, ô Prophète, ainsi que la miséricorde d'Allah et Sa bénédiction. Salut à nous et aux vertueux serviteurs d'Allah. J'atteste qu'il n'y a de divinité qu'Allah et j'atteste que Muhammad est Son serviteur et Son messager.",
    virtue: "Le tachahoud se récite assis pendant la prière, après la 2e unité (rak'a) et à la fin de la prière. C'est la version enseignée par 'Umar ibn al-Khattâb.",
    source: "Rapporté par Mâlik dans Al-Muwatta' (livre de la prière, chapitre du tachahoud)",
    video: "/videos/invocations/12-tachahoud-1.mp4",
  },
  // Tachahoud — 2e partie (salât ibrâhîmiyya)
  {
    keywords: ['tachahoud (2', 'tachahhoud (2', 'tachahoud 2', 'tachahoud - 2'],
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، وَبَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، فِي العَالَمِينَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
    transliteration: "Allâhumma salli 'alâ Muhammadin wa 'alâ âli Muhammad, kamâ sallayta 'alâ Ibrâhîma wa 'alâ âli Ibrâhîm. Wa bârik 'alâ Muhammadin wa 'alâ âli Muhammad, kamâ bârakta 'alâ Ibrâhîma wa 'alâ âli Ibrâhîm. Fi l-'âlamîna innaka hamîdun majîd.",
    translation: "Ô Allah, comble de Ta grâce Muhammad et la famille de Muhammad, comme Tu as comblé de Ta grâce Ibrâhîm et la famille d'Ibrâhîm. Et bénis Muhammad et la famille de Muhammad, comme Tu as béni Ibrâhîm et la famille d'Ibrâhîm, dans les mondes. Tu es certes digne de louange et de gloire.",
    virtue: "Appelée aussi « salât ibrâhîmiyya » (la prière sur le Prophète ﷺ). Elle se récite à la fin de la prière, après la 1re partie du tachahoud.",
    source: "Rapporté par Al-Bukhârî (n°3370) et Muslim (n°405)",
    video: "/videos/invocations/13-tachahoud-2.mp4",
  },
  // 1. Au réveil
  {
    keywords: ['réveille', 'reveille', 'lever', 'levé'],
    arabic: 'الحَمْدُ للهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: "Al-hamdu lillâhi lladhî ahyânâ ba'da mâ amâtanâ, wa ilayhi n-nushûr.",
    translation: "Louange à Allah qui nous a redonné la vie après nous avoir fait mourir, et c'est vers Lui que sera la résurrection.",
    virtue: "Le Prophète ﷺ récitait cette invocation chaque matin en se réveillant. Commencer la journée en remerciant Allah la place sous les meilleurs auspices.",
    source: "Rapporté par Al-Bukhârî (n°6312)",
    videoUrl: "https://www.youtube.com/watch?v=33ZSOL8xZmI",
    video: "/videos/invocations/01-reveil-extrait.mp4",
    videoEntiere: "/videos/invocations/01-reveil-entiere.mp4",
  },
  // 2. En se couchant
  {
    keywords: ['couche', 'coucher', 'dormir', 'sommeil'],
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismika Allâhumma amûtu wa ahyâ.',
    translation: "C'est en prononçant Ton nom, ô Allah, que je meurs et que je vis.",
    virtue: "Le Prophète ﷺ récitait ceci avant de dormir. Le sommeil est comparé à une petite mort ; se confier à Allah avant de s'endormir est une grande Sunna.",
    source: "Rapporté par Al-Bukhârî (n°6324)",
    videoUrl: "https://www.youtube.com/watch?v=zWvbeHqKmS0",
    video: "/videos/invocations/02-dormir-extrait.mp4",
    videoEntiere: "/videos/invocations/02-dormir-entiere.mp4",
  },
  // 3. En entrant à la mosquée
  {
    keywords: ['entrant à la mosquée', 'entrer à la mosquée', 'entrer mosquée'],
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    transliteration: 'Allâhumma ftah lî abwâba rahmatik.',
    translation: "Ô Allah, ouvre-moi les portes de Ta miséricorde.",
    virtue: "On entre dans la mosquée par le pied droit. La mosquée est la maison d'Allah — y entrer est l'occasion de demander Sa miséricorde.",
    source: "Rapporté par Muslim (n°713)",
    videoUrl: "https://www.youtube.com/watch?v=9fxlVTWa6fo",
  },
  // 4. En sortant de la mosquée
  {
    keywords: ['sortant de la mosquée', 'sortir de la mosquée', 'sortir mosquée'],
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    transliteration: 'Allâhumma innî as\'aluka min fadlik.',
    translation: "Ô Allah, je Te demande de Ta grâce.",
    virtue: "On sort de la mosquée par le pied gauche. En quittant la maison d'Allah, on Lui demande d'accompagner notre journée de Sa faveur et de Sa bénédiction.",
    source: "Rapporté par Muslim (n°713)",
    videoUrl: "https://www.youtube.com/watch?v=Rwop5bZAOuE",
  },
  // 5. Avant de manger
  {
    keywords: ['avant de manger', 'avant manger'],
    arabic: 'بِسْمِ اللهِ',
    transliteration: 'Bismillâh.',
    translation: "Au nom d'Allah.",
    virtue: "Dire Bismillâh avant de manger permet à la nourriture d'être une bénédiction et protège des méfaits des shaytanes.",
    source: "Rapporté par Abû Dâwûd (n°3767) et At-Tirmidhî (n°1858)",
    extra: "Si tu oublies de dire Bismillâh au début, dis dès que tu t'en souviens : بِسْمِ اللهِ أَوَّلَهُ وَآخِرَهُ (Bismillâhi awwalahu wa âkhirahu — « Au nom d'Allah au début et à la fin »).",
    videoUrl: "https://www.youtube.com/watch?v=zh0toDrooLw",
    video: "/videos/invocations/03-avant-manger-extrait.mp4",
    videoEntiere: "/videos/invocations/03-avant-manger-entiere.mp4",
  },
  // 6. Après avoir mangé
  {
    keywords: ['après avoir mangé', 'apres avoir mangé', 'après manger', 'apres manger'],
    arabic: 'الحَمْدُ للهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
    transliteration: "Al-hamdu lillâhi lladhî at'amanî hâdhâ, wa razaqanîhi min ghayri hawlin minnî wa lâ quwwa.",
    translation: "Louange à Allah qui m'a nourri de ceci et me l'a accordé sans force ni puissance de ma part.",
    virtue: "Le Prophète ﷺ a dit : « Celui qui mange un repas et dit ensuite cette invocation, ses péchés passés lui seront pardonnés. » Quelle belle récompense pour un simple remerciement !",
    source: "Rapporté par Abû Dâwûd (n°4023) et At-Tirmidhî (n°3458)",
    videoUrl: "https://www.youtube.com/watch?v=GIGijvsu9_Y",
    video: "/videos/invocations/05-apres-manger-extrait.mp4",
    videoEntiere: "/videos/invocations/05-apres-manger-entiere.mp4",
  },
  // 7. En entrant aux toilettes
  {
    keywords: ['entrant aux toilettes', 'entrer aux toilettes', 'entrant toilet', 'wc', 'salle de bain'],
    arabic: 'بِسْمِ اللهِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الخُبُثِ وَالخَبَائِثِ',
    transliteration: "Bismillâh. Allâhumma innî a'ûdhu bika mina l-khubuthi wa l-khabâ'ith.",
    translation: "Au nom d'Allah. Ô Allah, je me réfugie auprès de Toi contre les diables mâles et femelles.",
    virtue: "On entre par le pied gauche. Les toilettes sont un endroit où les djinns résident ; cette invocation crée une barrière de protection divine.",
    source: "Rapporté par Al-Bukhârî (n°142) et Muslim (n°375)",
    videoUrl: "https://www.youtube.com/watch?v=UAV2xnzlwIE",
    video: "/videos/invocations/08-entrer-toilettes-extrait.mp4",
    videoEntiere: "/videos/invocations/08-entrer-toilettes-entiere.mp4",
  },
  // 8. En sortant des toilettes
  {
    keywords: ['sortant des toilettes', 'sortir des toilettes', 'sortant toilet'],
    arabic: 'غُفْرَانَكَ',
    transliteration: 'Ghufrânaka.',
    translation: "Je Te demande Ton pardon.",
    virtue: "On sort par le pied droit. Ce mot, récité par le Prophète ﷺ en sortant des toilettes, est une belle occasion de demander le pardon d'Allah pour nos péchés.",
    source: "Rapporté par Abû Dâwûd (n°30), At-Tirmidhî (n°7) et Ibn Mâjah (n°300)",
    videoUrl: "https://www.youtube.com/watch?v=nZbjTojuYic",
    video: "/videos/invocations/09-sortir-toilettes.mp4",
  },
  // 9. En montant dans la voiture
  {
    keywords: ['voiture', 'transport', 'voyage', 'montant dans', 'véhicule'],
    arabic: 'بِسْمِ اللهِ وَالحَمْدُ للهِ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ',
    transliteration: "Bismillâhi wal-hamdu lillâh. Subhâna lladhî sakhkhara lanâ hâdhâ wa mâ kunnâ lahu muqrinîn, wa innâ ilâ rabbinâ la-munqalibûn.",
    translation: "Au nom d'Allah et louange à Allah ! Gloire à Celui qui nous a soumis cela alors que nous n'aurions pu le maîtriser, et c'est vers notre Seigneur que nous retournerons.",
    virtue: "Cette invocation rappelle que tout véhicule est un don d'Allah. Elle protège le voyageur et lui rappelle que son retour final est vers son Seigneur.",
    source: "Coran (43:13-14) · Abû Dâwûd (n°2602) · At-Tirmidhî (n°3446)",
    videoUrl: "https://www.youtube.com/watch?v=5DBoa9jbU00",
  },
  // 10. La nuit / dhikr du soir
  {
    keywords: ['nuit', 'soir', 'veillée', 'isha', 'nuitée'],
    arabic: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَاغْفِرْ لَهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
    transliteration: "Bismika rabbî wada'tu janbî wa bika arfa'uhu. Fa in amsakta nafsî faghfir lahâ, wa in arsaltahâ fahfazhâ bimâ tahfazu bihi 'ibâdaka s-sâlihîn.",
    translation: "Par Ton nom, mon Seigneur, j'étends mon côté et par Ton nom je le lève. Si Tu prends mon âme, aie pitié d'elle, et si Tu la libères, protège-la comme Tu protèges Tes serviteurs vertueux.",
    virtue: "Le Prophète ﷺ récitait cette invocation chaque soir avant de dormir. Elle exprime une confiance totale en Allah pour la nuit, qui est une petite mort.",
    source: "Rapporté par Al-Bukhârî (n°6320) et Muslim (n°2714)",
    videoUrl: "https://www.youtube.com/watch?v=NbQrV6n3AgI",
  },
];

export function getInvocationEnrichment(titleFrench: string): InvocationEnrichment | null {
  const title = titleFrench.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const titleNorm = titleFrench.toLowerCase();

  for (const inv of INVOCATIONS_ENRICHMENT) {
    for (const keyword of inv.keywords) {
      const kw = keyword.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (title.includes(kw) || titleNorm.includes(keyword.toLowerCase())) {
        return inv;
      }
    }
  }
  return null;
}
