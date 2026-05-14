export interface FlashcardTemplate {
  front_text: string;
  back_arabic: string;
  back_transliteration: string;
}

interface TemplateSet {
  keywords: string[];
  cards: FlashcardTemplate[];
}

const TEMPLATES: TemplateSet[] = [
  {
    keywords: ['pronom', 'pronoms', 'personnel', 'personnels'],
    cards: [
      { front_text: 'Je / Moi', back_arabic: 'أنا', back_transliteration: 'ana' },
      { front_text: 'Tu (masculin)', back_arabic: 'أنتَ', back_transliteration: 'anta' },
      { front_text: 'Tu (féminin)', back_arabic: 'أنتِ', back_transliteration: 'anti' },
      { front_text: 'Il / Lui', back_arabic: 'هو', back_transliteration: 'huwa' },
      { front_text: 'Elle', back_arabic: 'هي', back_transliteration: 'hiya' },
      { front_text: 'Nous', back_arabic: 'نحن', back_transliteration: 'nahnu' },
      { front_text: 'Vous (masc.)', back_arabic: 'أنتم', back_transliteration: 'antum' },
      { front_text: 'Vous (fém.)', back_arabic: 'أنتن', back_transliteration: 'antunna' },
      { front_text: 'Ils / Eux', back_arabic: 'هم', back_transliteration: 'hum' },
      { front_text: 'Elles', back_arabic: 'هن', back_transliteration: 'hunna' },
    ],
  },
  {
    keywords: ['alphabet', 'lettre', 'lettres', 'haraka', 'harakat', 'حرف'],
    cards: [
      { front_text: 'Alif', back_arabic: 'أ', back_transliteration: 'alif' },
      { front_text: 'Ba', back_arabic: 'ب', back_transliteration: 'ba' },
      { front_text: 'Ta', back_arabic: 'ت', back_transliteration: 'ta' },
      { front_text: 'Tha', back_arabic: 'ث', back_transliteration: 'tha' },
      { front_text: 'Jim', back_arabic: 'ج', back_transliteration: 'jim' },
      { front_text: 'Ha', back_arabic: 'ح', back_transliteration: 'ḥa' },
      { front_text: 'Kha', back_arabic: 'خ', back_transliteration: 'kha' },
      { front_text: 'Dal', back_arabic: 'د', back_transliteration: 'dal' },
      { front_text: 'Ra', back_arabic: 'ر', back_transliteration: 'ra' },
      { front_text: 'Sin', back_arabic: 'س', back_transliteration: 'sin' },
    ],
  },
  {
    keywords: ['chiffre', 'chiffres', 'nombre', 'nombres', 'numéro', 'comptage'],
    cards: [
      { front_text: '1 — Un', back_arabic: 'وَاحِد', back_transliteration: 'wahid' },
      { front_text: '2 — Deux', back_arabic: 'اثْنَان', back_transliteration: 'ithnan' },
      { front_text: '3 — Trois', back_arabic: 'ثَلَاثَة', back_transliteration: 'thalatha' },
      { front_text: '4 — Quatre', back_arabic: 'أرْبَعَة', back_transliteration: 'arba\'a' },
      { front_text: '5 — Cinq', back_arabic: 'خَمْسَة', back_transliteration: 'khamsa' },
      { front_text: '6 — Six', back_arabic: 'سِتَّة', back_transliteration: 'sitta' },
      { front_text: '7 — Sept', back_arabic: 'سَبْعَة', back_transliteration: 'sab\'a' },
      { front_text: '8 — Huit', back_arabic: 'ثَمَانِيَة', back_transliteration: 'thamania' },
      { front_text: '9 — Neuf', back_arabic: 'تِسْعَة', back_transliteration: 'tis\'a' },
      { front_text: '10 — Dix', back_arabic: 'عَشَرَة', back_transliteration: '\'ashara' },
    ],
  },
  {
    keywords: ['salut', 'salutation', 'salutations', 'bonjour', 'salam', 'formule', 'formules'],
    cards: [
      { front_text: 'Bonjour / Paix sur toi', back_arabic: 'السَّلامُ عَلَيْكُم', back_transliteration: 'assalamu alaykum' },
      { front_text: 'Et sur toi la paix', back_arabic: 'وَعَلَيْكُمُ السَّلام', back_transliteration: 'wa alaykum assalam' },
      { front_text: 'Au nom d\'Allah', back_arabic: 'بِسْمِ الله', back_transliteration: 'bismillah' },
      { front_text: 'Si Allah le veut', back_arabic: 'إِن شَاءَ الله', back_transliteration: 'inch\'allah' },
      { front_text: 'Louange à Allah', back_arabic: 'الْحَمْدُ لِله', back_transliteration: 'alhamdulillah' },
      { front_text: 'Allah est grand', back_arabic: 'الله أكبر', back_transliteration: 'allahu akbar' },
      { front_text: 'Gloire à Allah', back_arabic: 'سُبْحَانَ الله', back_transliteration: 'subhanallah' },
      { front_text: 'Qu\'Allah te bénisse', back_arabic: 'بَارَكَ الله فِيك', back_transliteration: 'barakallahu fik' },
      { front_text: 'Bienvenue', back_arabic: 'أهْلاً وَسَهْلاً', back_transliteration: 'ahlan wa sahlan' },
      { front_text: 'Bonne chance / Succès', back_arabic: 'بِالتَّوْفِيق', back_transliteration: 'bittawfiq' },
    ],
  },
  {
    keywords: ['prière', 'priere', 'salat', 'namaz', 'صلاة', 'rak', 'rakat'],
    cards: [
      { front_text: 'La prière', back_arabic: 'الصَّلاة', back_transliteration: 'as-salat' },
      { front_text: 'Prière du matin', back_arabic: 'الفَجْر', back_transliteration: 'al-fajr' },
      { front_text: 'Prière de midi', back_arabic: 'الظُّهر', back_transliteration: 'adh-dhuhr' },
      { front_text: 'Prière de l\'après-midi', back_arabic: 'العَصْر', back_transliteration: 'al-\'asr' },
      { front_text: 'Prière du coucher du soleil', back_arabic: 'المَغْرِب', back_transliteration: 'al-maghrib' },
      { front_text: 'Prière du soir', back_arabic: 'العِشَاء', back_transliteration: 'al-\'icha' },
      { front_text: 'Prosternation', back_arabic: 'السُّجُود', back_transliteration: 'as-sujud' },
      { front_text: 'Inclinaison', back_arabic: 'الرُّكُوع', back_transliteration: 'ar-ruku' },
      { front_text: 'L\'appel à la prière', back_arabic: 'الأَذَان', back_transliteration: 'al-adhan' },
      { front_text: 'Direction de la Mecque', back_arabic: 'القِبْلَة', back_transliteration: 'al-qibla' },
    ],
  },
  {
    keywords: ['wudu', 'ablution', 'ablutions', 'purification', 'وضوء'],
    cards: [
      { front_text: 'Ablution rituelle', back_arabic: 'الوُضُوء', back_transliteration: 'al-wudu' },
      { front_text: 'Se laver les mains', back_arabic: 'غَسْلُ الْيَدَيْن', back_transliteration: 'ghaslu al-yadayn' },
      { front_text: 'Se rincer la bouche', back_arabic: 'الْمَضْمَضَة', back_transliteration: 'al-madmada' },
      { front_text: 'Se laver le visage', back_arabic: 'غَسْلُ الْوَجْه', back_transliteration: 'ghaslu al-wajh' },
      { front_text: 'Se laver les bras', back_arabic: 'غَسْلُ الْيَدَيْن وَالذِّرَاعَيْن', back_transliteration: 'ghaslu al-dhira\'ayn' },
      { front_text: 'Se passer la main sur la tête', back_arabic: 'مَسْحُ الرَّأْس', back_transliteration: 'mashu ar-ra\'s' },
      { front_text: 'Se laver les oreilles', back_arabic: 'مَسْحُ الأُذُنَيْن', back_transliteration: 'mashu al-udhnayn' },
      { front_text: 'Se laver les pieds', back_arabic: 'غَسْلُ الْقَدَمَيْن', back_transliteration: 'ghaslu al-qadamayn' },
      { front_text: 'Intention', back_arabic: 'النِّيَّة', back_transliteration: 'an-niyya' },
      { front_text: 'Ce qui annule l\'ablution', back_arabic: 'نَوَاقِضُ الْوُضُوء', back_transliteration: 'nawaqidh al-wudu' },
    ],
  },
  {
    keywords: ['pilier', 'piliers', 'islam', 'rukn', 'arkane'],
    cards: [
      { front_text: 'Les 5 piliers de l\'Islam', back_arabic: 'أَرْكَانُ الإِسْلَام', back_transliteration: 'arkan al-islam' },
      { front_text: '1er pilier : La profession de foi', back_arabic: 'الشَّهَادَة', back_transliteration: 'ash-shahada' },
      { front_text: '2e pilier : La prière', back_arabic: 'الصَّلاة', back_transliteration: 'as-salat' },
      { front_text: '3e pilier : L\'aumône légale', back_arabic: 'الزَّكَاة', back_transliteration: 'az-zakat' },
      { front_text: '4e pilier : Le jeûne', back_arabic: 'الصِّيَام', back_transliteration: 'as-siyam' },
      { front_text: '5e pilier : Le pèlerinage', back_arabic: 'الحَجّ', back_transliteration: 'al-hajj' },
      { front_text: 'Croyance en Allah', back_arabic: 'الإِيمَانُ بِالله', back_transliteration: 'al-iman billah' },
      { front_text: 'Prophète Muhammad ﷺ', back_arabic: 'مُحَمَّد رَسُولُ الله', back_transliteration: 'muhammad rasulullah' },
      { front_text: 'Le Paradis', back_arabic: 'الجَنَّة', back_transliteration: 'al-janna' },
      { front_text: 'Qu\'Allah nous pardonne', back_arabic: 'أَسْتَغْفِرُ الله', back_transliteration: 'astaghfirullah' },
    ],
  },
  {
    keywords: ['ramadan', 'jeûne', 'jeune', 'siyam', 'iftar', 'suhur'],
    cards: [
      { front_text: 'Le jeûne / Ramadan', back_arabic: 'رَمَضَان', back_transliteration: 'ramadan' },
      { front_text: 'Repas de rupture du jeûne', back_arabic: 'الإِفْطَار', back_transliteration: 'al-iftar' },
      { front_text: 'Repas avant l\'aube', back_arabic: 'السُّحُور', back_transliteration: 'as-suhur' },
      { front_text: 'Bon Ramadan !', back_arabic: 'رَمَضَان كَرِيم', back_transliteration: 'ramadan karim' },
      { front_text: 'Rupture du jeûne avec une datte', back_arabic: 'التَّمْر', back_transliteration: 'at-tamr' },
      { front_text: 'Nuit du destin', back_arabic: 'لَيْلَةُ الْقَدْر', back_transliteration: 'laylatu l-qadr' },
      { front_text: 'Prière de nuit', back_arabic: 'صَلاةُ التَّرَاوِيح', back_transliteration: 'salat at-tarawih' },
      { front_text: 'Aumône de rupture du jeûne', back_arabic: 'زَكَاةُ الْفِطْر', back_transliteration: 'zakat al-fitr' },
      { front_text: 'Fête de fin du Ramadan', back_arabic: 'عِيدُ الْفِطْر', back_transliteration: 'eid al-fitr' },
      { front_text: 'Que ton jeûne soit accepté', back_arabic: 'تَقَبَّلَ الله صِيَامَك', back_transliteration: 'taqabbalallahu siyamak' },
    ],
  },
  {
    keywords: ['famille', 'familial', 'parent', 'parents', 'frère', 'sœur', 'famille'],
    cards: [
      { front_text: 'Le père', back_arabic: 'الأَب', back_transliteration: 'al-ab' },
      { front_text: 'La mère', back_arabic: 'الأُم', back_transliteration: 'al-umm' },
      { front_text: 'Le fils', back_arabic: 'الإِبْن', back_transliteration: 'al-ibn' },
      { front_text: 'La fille', back_arabic: 'البِنْت', back_transliteration: 'al-bint' },
      { front_text: 'Le frère', back_arabic: 'الأَخ', back_transliteration: 'al-akh' },
      { front_text: 'La sœur', back_arabic: 'الأُخْت', back_transliteration: 'al-ukht' },
      { front_text: 'Le grand-père', back_arabic: 'الجَد', back_transliteration: 'al-jadd' },
      { front_text: 'La grand-mère', back_arabic: 'الجَدَّة', back_transliteration: 'al-jadda' },
      { front_text: 'L\'oncle', back_arabic: 'العَم / الخَال', back_transliteration: 'al-\'amm / al-khal' },
      { front_text: 'La tante', back_arabic: 'العَمَّة / الخَالَة', back_transliteration: 'al-\'amma / al-khala' },
    ],
  },
  {
    keywords: ['couleur', 'couleurs', 'teinte', 'ton'],
    cards: [
      { front_text: 'Rouge', back_arabic: 'أَحْمَر', back_transliteration: 'ahmar' },
      { front_text: 'Bleu', back_arabic: 'أَزْرَق', back_transliteration: 'azraq' },
      { front_text: 'Vert', back_arabic: 'أَخْضَر', back_transliteration: 'akhdar' },
      { front_text: 'Jaune', back_arabic: 'أَصْفَر', back_transliteration: 'asfar' },
      { front_text: 'Blanc', back_arabic: 'أَبْيَض', back_transliteration: 'abyad' },
      { front_text: 'Noir', back_arabic: 'أَسْوَد', back_transliteration: 'aswad' },
      { front_text: 'Orange', back_arabic: 'بُرْتُقَالِي', back_transliteration: 'burtuqali' },
      { front_text: 'Violet', back_arabic: 'بَنَفْسَجِي', back_transliteration: 'banafsaji' },
      { front_text: 'Rose', back_arabic: 'وَرْدِي', back_transliteration: 'wardi' },
      { front_text: 'Marron / Brun', back_arabic: 'بُنِّي', back_transliteration: 'bunni' },
    ],
  },
  {
    keywords: ['dhikr', 'invocation', 'invocations', 'dua', 'doua', 'supplication', 'zikr'],
    cards: [
      { front_text: 'Gloire à Allah', back_arabic: 'سُبْحَانَ الله', back_transliteration: 'subhanallah' },
      { front_text: 'Louange à Allah', back_arabic: 'الحَمْدُ لِله', back_transliteration: 'alhamdulillah' },
      { front_text: 'Pas de dieu sauf Allah', back_arabic: 'لَا إِلَهَ إِلَّا الله', back_transliteration: 'la ilaha illallah' },
      { front_text: 'Allah est grand', back_arabic: 'الله أَكْبَر', back_transliteration: 'allahu akbar' },
      { front_text: 'Je cherche pardon à Allah', back_arabic: 'أَسْتَغْفِرُ الله', back_transliteration: 'astaghfirullah' },
      { front_text: 'Il n\'y a de force que par Allah', back_arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِالله', back_transliteration: 'la hawla wa la quwwata illa billah' },
      { front_text: 'Paix et bénédictions sur le Prophète', back_arabic: 'صَلَّى الله عَلَيْهِ وَسَلَّم', back_transliteration: 'salla allahu alayhi wa sallam' },
      { front_text: 'Nous appartenons à Allah', back_arabic: 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُون', back_transliteration: 'inna lillahi wa inna ilayhi raji\'un' },
      { front_text: 'Si Allah le veut', back_arabic: 'إِن شَاءَ الله', back_transliteration: 'inch\'allah' },
      { front_text: 'Au nom d\'Allah, le Clément, le Miséricordieux', back_arabic: 'بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيم', back_transliteration: 'bismillah ir-rahman ir-rahim' },
    ],
  },
  {
    keywords: ['prophète', 'prophètes', 'nabi', 'anbiya', 'messager', 'histoire'],
    cards: [
      { front_text: 'Adam (le premier homme)', back_arabic: 'آدَم عليه السلام', back_transliteration: 'Adam alayhissalam' },
      { front_text: 'Ibrahim (Abraham)', back_arabic: 'إِبْرَاهِيم عليه السلام', back_transliteration: 'Ibrahim alayhissalam' },
      { front_text: 'Moussa (Moïse)', back_arabic: 'مُوسَى عليه السلام', back_transliteration: 'Musa alayhissalam' },
      { front_text: 'Issa (Jésus)', back_arabic: 'عِيسَى عليه السلام', back_transliteration: 'Isa alayhissalam' },
      { front_text: 'Muhammad ﷺ', back_arabic: 'مُحَمَّد صلى الله عليه وسلم', back_transliteration: 'Muhammad sallallahu alayhi wa sallam' },
      { front_text: 'Nouh (Noé)', back_arabic: 'نُوح عليه السلام', back_transliteration: 'Nuh alayhissalam' },
      { front_text: 'Youssouf (Joseph)', back_arabic: 'يُوسُف عليه السلام', back_transliteration: 'Yusuf alayhissalam' },
      { front_text: 'Dawoud (David)', back_arabic: 'دَاوُود عليه السلام', back_transliteration: 'Dawud alayhissalam' },
      { front_text: 'Souleymane (Salomon)', back_arabic: 'سُلَيْمَان عليه السلام', back_transliteration: 'Sulayman alayhissalam' },
      { front_text: 'Que la paix soit sur lui', back_arabic: 'عَلَيْهِ السَّلَام', back_transliteration: 'alayhissalam' },
    ],
  },
  {
    keywords: ['vocabulaire', 'quotidien', 'vie', 'mot', 'mots', 'darija', 'dialecte'],
    cards: [
      { front_text: 'Oui', back_arabic: 'نَعَم', back_transliteration: 'na\'am' },
      { front_text: 'Non', back_arabic: 'لَا', back_transliteration: 'la' },
      { front_text: 'S\'il te plaît', back_arabic: 'مِن فَضْلِك', back_transliteration: 'min fadlik' },
      { front_text: 'Merci', back_arabic: 'شُكْرًا', back_transliteration: 'shukran' },
      { front_text: 'Excuse-moi', back_arabic: 'عَفْوًا / آسِف', back_transliteration: '\'afwan / asif' },
      { front_text: 'Je ne comprends pas', back_arabic: 'لَا أَفْهَم', back_transliteration: 'la afham' },
      { front_text: 'Je comprends', back_arabic: 'أَفْهَم', back_transliteration: 'afham' },
      { front_text: 'Répète s\'il te plaît', back_arabic: 'أَعِد مِن فَضْلِك', back_transliteration: 'a\'id min fadlik' },
      { front_text: 'Comment tu t\'appelles ?', back_arabic: 'مَا اسْمُك ؟', back_transliteration: 'ma ismuk?' },
      { front_text: 'Mon nom est…', back_arabic: 'اسْمِي…', back_transliteration: 'ismi...' },
    ],
  },
  {
    keywords: ['grammaire', 'conjugaison', 'verbe', 'verbes', 'nom', 'noms', 'genre', 'masculin', 'féminin'],
    cards: [
      { front_text: 'Masculin', back_arabic: 'مُذَكَّر', back_transliteration: 'mudhakar' },
      { front_text: 'Féminin', back_arabic: 'مُؤَنَّث', back_transliteration: 'mu\'annath' },
      { front_text: 'Singulier', back_arabic: 'مُفْرَد', back_transliteration: 'mufrad' },
      { front_text: 'Duel', back_arabic: 'مُثَنَّى', back_transliteration: 'muthanna' },
      { front_text: 'Pluriel', back_arabic: 'جَمْع', back_transliteration: 'jam\'a' },
      { front_text: 'Le verbe', back_arabic: 'الفِعْل', back_transliteration: 'al-fi\'l' },
      { front_text: 'Le nom', back_arabic: 'الاسْم', back_transliteration: 'al-ism' },
      { front_text: 'Le sujet', back_arabic: 'الْمُبْتَدَأ', back_transliteration: 'al-mubtada' },
      { front_text: 'Le passé', back_arabic: 'الْمَاضِي', back_transliteration: 'al-madi' },
      { front_text: 'Le présent', back_arabic: 'الْمُضَارِع', back_transliteration: 'al-mudhari\'' },
    ],
  },
  {
    keywords: ['nourania', 'tajwid', 'tajweed', 'lecture', 'coran', 'quran', 'récitation', 'recitation'],
    cards: [
      { front_text: 'La Fatiha (Ouverture)', back_arabic: 'الفَاتِحَة', back_transliteration: 'al-fatiha' },
      { front_text: 'L\'ikhlas (Sincérité)', back_arabic: 'الإِخْلَاص', back_transliteration: 'al-ikhlas' },
      { front_text: 'Al-Falaq (L\'Aube)', back_arabic: 'الفَلَق', back_transliteration: 'al-falaq' },
      { front_text: 'An-Nas (Les Hommes)', back_arabic: 'النَّاس', back_transliteration: 'an-nas' },
      { front_text: 'Verset du Trône', back_arabic: 'آيَةُ الْكُرْسِي', back_transliteration: 'ayat al-kursi' },
      { front_text: 'La sourate', back_arabic: 'السُّورَة', back_transliteration: 'as-sura' },
      { front_text: 'Le verset', back_arabic: 'الآيَة', back_transliteration: 'al-aya' },
      { front_text: 'Le Coran', back_arabic: 'الْقُرْآن', back_transliteration: 'al-quran' },
      { front_text: 'Tajwid (règles de récitation)', back_arabic: 'التَّجْوِيد', back_transliteration: 'at-tajwid' },
      { front_text: 'Basmala', back_arabic: 'بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيم', back_transliteration: 'bismillah ir-rahman ir-rahim' },
    ],
  },
];

export function generateFromTemplate(
  cardTitle: string,
  moduleTitle: string,
): FlashcardTemplate[] | null {
  const search = `${cardTitle} ${moduleTitle}`.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

  let bestMatch: TemplateSet | null = null;
  let bestScore = 0;

  for (const tpl of TEMPLATES) {
    let score = 0;
    for (const kw of tpl.keywords) {
      const normalizedKw = kw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (search.includes(normalizedKw)) score += normalizedKw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = tpl;
    }
  }

  return bestMatch && bestScore > 0 ? bestMatch.cards : null;
}
