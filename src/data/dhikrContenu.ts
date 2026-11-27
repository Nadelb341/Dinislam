/**
 * 📿 Contenu de la carte « Dhikr » (Nadia, 2026-11-27) — COPIE DE SECOURS hors ligne.
 * Le vrai contenu vit EN BASE (tables dhikr_items, dhikr_gestes, dhikr_quiz) et se modifie avec le ✏️.
 * Ce fichier sert seulement : (1) à remplir la base la 1re fois (migration 20261127120000, générée depuis ce fichier),
 * (2) à afficher quelque chose si la base n'a jamais pu être lue sur l'appareil.
 *
 * 🕌 RÈGLE N°1 : uniquement le Coran, Al-Boukhârî et Mouslim. Chaque texte a sa source exacte.
 * statut : 'ok' | 'a_verifier' (un doute à faire relire par Nadia) | 'a_confirmer' (hors de ses sources : caché)
 *        | 'proposition' (remplacement proposé, caché tant que Nadia ne l'allume pas).
 * ⚠️ Fichier SANS import (lu aussi par le script qui écrit la migration).
 */

export type MomentDhikr = 'reveil' | 'matin' | 'soir' | 'apres_priere' | 'pardon' | 'force' | 'repas';
export type StatutContenu = 'ok' | 'a_verifier' | 'a_confirmer' | 'proposition';
export type SerieDhikr = 'matin' | 'soir' | 'reveil' | 'apres_priere';
export type GenreGeste = 'intro' | 'geste' | 'final' | 'bonus';

export interface DhikrItem {
  id: string; cle: string | null; titre: string;
  arabe: string | null; phonetique: string | null; sens: string | null;
  nombre: number; nombre_texte: string | null;
  merite: string | null; source: string | null;
  /** 🕌 27/11 : degré d'authenticité (vide = deviné d'après la source) + phrase « avis divergents » */
  degre?: string | null; degre_divergence?: string | null;
  moments: string[]; statut: StatutContenu; visible: boolean; position: number;
}

/** Une étape comptée au chapelet (ex. 33 fois « Soubhâna-llâh ») */
export interface EtapeCompteur { titre: string; arabe: string; phonetique: string; sens: string; nombre: number }

export interface DhikrGeste {
  id: string; cle: string | null; serie: SerieDhikr; genre: GenreGeste;
  titre: string; consigne: string | null;
  arabe: string | null; phonetique: string | null; sens: string | null;
  /** null = un geste qu'on coche (« C'est fait ») ; sinon le chapelet compte chaque étape */
  compteur: EtapeCompteur[] | null;
  merite: string | null; source: string | null;
  degre?: string | null; degre_divergence?: string | null;
  /** Lien interne (ex. « /coran?item=42 ») */
  lien: string | null;
  statut: StatutContenu; visible: boolean; position: number;
}

export interface DhikrQuestion {
  id: string; question: string; choix: string[]; bonne: number;
  explication: string | null; source: string | null; visible: boolean; position: number;
  degre?: string | null; degre_divergence?: string | null;
}

// ─── Textes communs ────────────────────────────────────────────────────────────
const T = {
  subhanallah: { ar: 'سُبْحَانَ اللَّهِ', ph: 'Soubhâna-llâh', fr: 'Gloire à Allah' },
  alhamdulillah: { ar: 'الْحَمْدُ لِلَّهِ', ph: 'Al-hamdou lillâh', fr: 'Louange à Allah' },
  allahuakbar: { ar: 'اللَّهُ أَكْبَرُ', ph: 'Allâhou akbar', fr: 'Allah est le plus Grand' },
  tahlil: {
    ar: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    ph: 'Lâ ilâha illa-llâhou wahdahou lâ charîka lah, lahou-l-moulkou wa lahou-l-hamd, wa houwa \'alâ koulli chay\'in qadîr',
    fr: 'Il n\'y a de divinité qu\'Allah, Seul, sans associé. À Lui la royauté, à Lui la louange, et Il est capable de toute chose.',
  },
  wabihamdihi: { ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', ph: 'Soubhâna-llâhi wa bihamdihi', fr: 'Gloire et louange à Allah' },
  sayyid: {
    ar: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    ph: 'Allâhoumma anta rabbî, lâ ilâha illâ ant, khalaqtanî wa ana \'abdouk, wa ana \'alâ \'ahdika wa wa\'dika mastata\'t, a\'oûdhou bika min charri mâ sana\'t, aboû\'ou laka bi ni\'matika \'alayya, wa aboû\'ou laka bi dhanbî, faghfir lî, fa innahou lâ yaghfirou-dh-dhounoûba illâ ant',
    fr: 'Ô Allah, Tu es mon Seigneur, il n\'y a de divinité que Toi. Tu m\'as créé et je suis Ton serviteur. Je reste fidèle à mon engagement envers Toi et à Ta promesse, autant que je le peux. Je cherche refuge auprès de Toi contre le mal que j\'ai fait. Je reconnais Tes bienfaits envers moi et je reconnais mon péché. Pardonne-moi, car nul ne pardonne les péchés à part Toi.',
    merite: 'Celui qui le dit le jour avec conviction et meurt ce jour-là avant le soir fait partie des gens du Paradis ; et pareil s\'il le dit la nuit et meurt avant le matin.',
  },
  reveil: {
    ar: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    ph: 'Al-hamdou lillâhi-lladhî ahyânâ ba\'da mâ amâtanâ wa ilayhi-n-nouchoûr',
    fr: 'Louange à Allah qui nous a rendu la vie après nous avoir fait mourir (le sommeil), et c\'est vers Lui que se fera la résurrection.',
  },
  bismika: { ar: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', ph: 'Bismika-llâhoumma amoûtou wa ahyâ', fr: 'C\'est en Ton nom, ô Allah, que je meurs et que je vis.' },
  juwayriya: {
    ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ',
    ph: 'Soubhâna-llâhi wa bihamdihi, \'adada khalqihi, wa ridâ nafsihi, wa zinata \'archihi, wa midâda kalimâtihi',
    fr: 'Gloire et louange à Allah, autant que le nombre de Ses créatures, autant qu\'il Lui plaît, autant que le poids de Son Trône et autant que l\'encre de Ses paroles.',
  },
  troisQoul: {
    ar: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ\n'
      + 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ\n'
      + 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ',
    ph: 'Qoul houwa-llâhou ahad. Allâhou-s-samad. Lam yalid wa lam yoûlad. Wa lam yakoun lahoû koufouwan ahad.\n'
      + 'Qoul a\'oûdhou bi rabbi-l-falaq. Min charri mâ khalaq. Wa min charri ghâsiqin idhâ waqab. Wa min charri-n-naffâthâti fi-l-\'ouqad. Wa min charri hâsidin idhâ hasad.\n'
      + 'Qoul a\'oûdhou bi rabbi-n-nâs. Maliki-n-nâs. Ilâhi-n-nâs. Min charri-l-waswâsi-l-khannâs. Alladhî youwaswisou fî soudoûri-n-nâs. Mina-l-jinnati wa-n-nâs.',
    fr: 'Al-Ikhlâs : « Dis : Il est Allah, l\'Unique… » · Al-Falaq : « Dis : je cherche refuge auprès du Seigneur de l\'aube naissante… » · An-Nâs : « Dis : je cherche refuge auprès du Seigneur des hommes… »',
    court: { ar: 'قُلْ هُوَ اللَّهُ أَحَدٌ · قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ · قُلْ أَعُوذُ بِرَبِّ النَّاسِ', ph: 'Qoul houwa-llâhou ahad · Qoul a\'oûdhou bi rabbi-l-falaq · Qoul a\'oûdhou bi rabbi-n-nâs' },
  },
};

const e = (titre: string, t: { ar: string; ph: string; fr: string }, nombre: number): EtapeCompteur => ({ titre, arabe: t.ar, phonetique: t.ph, sens: t.fr, nombre });

// ─── E · La bibliothèque ──────────────────────────────────────────────────────
type ItemSansId = Omit<DhikrItem, 'id' | 'position' | 'visible' | 'statut'> & { statut?: StatutContenu; visible?: boolean };
const ITEMS: ItemSansId[] = [
  { cle: 'reveil', titre: 'Au réveil', arabe: T.reveil.ar, phonetique: T.reveil.ph, sens: T.reveil.fr, nombre: 1, nombre_texte: '1 fois en se réveillant',
    merite: 'C\'est ce que disait le Prophète ﷺ en se réveillant.', source: 'Boukhari 6312', moments: ['reveil'] },
  { cle: 'sayyid_istighfar', titre: 'Sayyid al-istighfâr (le maître de la demande de pardon)', arabe: T.sayyid.ar, phonetique: T.sayyid.ph, sens: T.sayyid.fr,
    nombre: 1, nombre_texte: '1 fois le matin, 1 fois le soir', merite: T.sayyid.merite, source: 'Boukhari 6306', moments: ['matin', 'soir', 'pardon'] },
  { cle: 'subhanallah_wabihamdihi', titre: 'Soubhâna-llâhi wa bihamdihi', arabe: T.wabihamdihi.ar, phonetique: T.wabihamdihi.ph, sens: T.wabihamdihi.fr,
    nombre: 100, nombre_texte: '100 fois dans la journée', merite: 'Ses péchés sont effacés, même s\'ils sont aussi nombreux que l\'écume de la mer.',
    source: 'Boukhari 6405 ; Mouslim 2691', moments: ['matin', 'soir', 'pardon'] },
  { cle: 'tahlil_100', titre: 'Lâ ilâha illa-llâh wahdahou… (100 fois)', arabe: T.tahlil.ar, phonetique: T.tahlil.ph, sens: T.tahlil.fr,
    nombre: 100, nombre_texte: '100 fois dans la journée',
    merite: 'C\'est comme affranchir 10 esclaves ; 100 bonnes actions lui sont écrites, 100 péchés lui sont effacés, et il est protégé du Diable ce jour-là jusqu\'au soir.',
    source: 'Boukhari 3293 ; Mouslim 2691', moments: ['matin'] },
  { cle: 'tahlil_10', titre: 'Lâ ilâha illa-llâh wahdahou… (10 fois)', arabe: T.tahlil.ar, phonetique: T.tahlil.ph, sens: T.tahlil.fr,
    nombre: 10, nombre_texte: '10 fois', merite: 'C\'est comme avoir affranchi quatre personnes parmi les descendants d\'Ismâ\'îl.',
    source: 'Boukhari 6404 ; Mouslim 2693', moments: ['matin', 'soir'] },
  { cle: 'juwayriya', titre: 'Les 4 paroles de Jouwayriya', arabe: T.juwayriya.ar, phonetique: T.juwayriya.ph, sens: T.juwayriya.fr,
    nombre: 3, nombre_texte: '3 fois, le matin',
    merite: 'Le Prophète ﷺ a dit à Jouwayriya, qui faisait le dhikr depuis la prière de l\'aube : « J\'ai dit après toi quatre paroles, trois fois ; si on les pesait avec tout ce que tu as dit depuis ce matin, elles l\'emporteraient. »',
    source: 'Mouslim 2726', moments: ['matin'] },
  { cle: 'apres_priere', titre: 'Le tasbih d\'après la prière', arabe: `${T.subhanallah.ar} · ${T.alhamdulillah.ar} · ${T.allahuakbar.ar}`,
    phonetique: `${T.subhanallah.ph} · ${T.alhamdulillah.ph} · ${T.allahuakbar.ph}`, sens: `${T.subhanallah.fr} · ${T.alhamdulillah.fr} · ${T.allahuakbar.fr}`,
    nombre: 100, nombre_texte: '33 + 33 + 33, puis 1 fois « Lâ ilâha illa-llâh wahdahou… »',
    merite: 'Celui qui le fait après chaque prière : ses péchés sont pardonnés, même s\'ils étaient aussi nombreux que l\'écume de la mer.',
    source: 'Mouslim 597', moments: ['apres_priere'] },
  { cle: 'istighfar_apres_priere', titre: 'Juste après le salâm', arabe: 'أَسْتَغْفِرُ اللَّهَ (٣) ۝ اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    phonetique: 'Astaghfirou-llâh (3 fois), puis : Allâhoumma anta-s-salâm wa minka-s-salâm, tabârakta yâ dhâ-l-jalâli wa-l-ikrâm',
    sens: 'Je demande pardon à Allah. Ô Allah, Tu es la Paix et la paix vient de Toi. Béni sois-Tu, ô Toi le Majestueux et le Généreux.',
    nombre: 3, nombre_texte: '3 fois, puis l\'invocation', merite: 'Quand le Prophète ﷺ finissait sa prière, il demandait pardon 3 fois, puis disait cette invocation.',
    source: 'Mouslim 591', moments: ['apres_priere', 'pardon'] },
  { cle: 'astaghfirullah', titre: 'Astaghfirou-llâh', arabe: 'أَسْتَغْفِرُ اللَّهَ', phonetique: 'Astaghfirou-llâh', sens: 'Je demande pardon à Allah',
    nombre: 100, nombre_texte: '100 fois dans la journée',
    merite: 'Le Prophète ﷺ a dit : « Repentez-vous à Allah, car moi je me repens à Lui cent fois par jour. » Et aussi : « Je demande pardon à Allah et je me repens à Lui plus de soixante-dix fois par jour. »',
    source: 'Mouslim 2702 ; Boukhari 6307', moments: ['pardon'] },
  { cle: 'subhanallah', titre: 'Soubhâna-llâh', arabe: T.subhanallah.ar, phonetique: T.subhanallah.ph, sens: `${T.subhanallah.fr} (Il est au-dessus de tout défaut)`,
    nombre: 33, nombre_texte: '33 fois, ou autant que tu veux',
    merite: 'Les quatre paroles les plus aimées d\'Allah : Soubhâna-llâh, Al-hamdou lillâh, Lâ ilâha illa-llâh et Allâhou akbar.', source: 'Mouslim 2137', moments: [] },
  { cle: 'alhamdulillah', titre: 'Al-hamdou lillâh', arabe: T.alhamdulillah.ar, phonetique: T.alhamdulillah.ph, sens: T.alhamdulillah.fr,
    nombre: 33, nombre_texte: '33 fois, ou autant que tu veux', merite: '« Al-hamdou lillâh » remplit la balance.', source: 'Mouslim 223', moments: [] },
  { cle: 'allahuakbar', titre: 'Allâhou akbar', arabe: T.allahuakbar.ar, phonetique: T.allahuakbar.ph, sens: T.allahuakbar.fr,
    nombre: 33, nombre_texte: '33 fois, ou autant que tu veux',
    merite: 'Les quatre paroles les plus aimées d\'Allah : Soubhâna-llâh, Al-hamdou lillâh, Lâ ilâha illa-llâh et Allâhou akbar.', source: 'Mouslim 2137', moments: [] },
  { cle: 'deux_paroles', titre: 'Les deux paroles légères', arabe: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    phonetique: 'Soubhâna-llâhi wa bihamdihi, Soubhâna-llâhi-l-\'adhîm', sens: 'Gloire et louange à Allah, gloire à Allah le Très-Grand',
    nombre: 33, nombre_texte: 'Autant que tu veux', merite: 'Deux paroles légères sur la langue, lourdes dans la balance, aimées du Tout Miséricordieux.',
    source: 'Boukhari 6406 ; Mouslim 2694', moments: [] },
  { cle: 'hawqala', titre: 'Lâ hawla wa lâ qouwwata illâ billâh', arabe: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', phonetique: 'Lâ hawla wa lâ qouwwata illâ billâh',
    sens: 'Il n\'y a de force ni de puissance qu\'en Allah', nombre: 33, nombre_texte: 'Autant que tu veux',
    merite: 'C\'est un trésor parmi les trésors du Paradis.', source: 'Boukhari 6384 ; Mouslim 2704', moments: ['force'] },
  { cle: 'hasbunallah', titre: 'Hasbouna-llâhou wa ni\'ma-l-wakîl', arabe: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', phonetique: 'Hasbouna-llâhou wa ni\'ma-l-wakîl',
    sens: 'Allah nous suffit, et quel excellent Protecteur !', nombre: 7, nombre_texte: 'Quand tu as peur ou quand c\'est difficile',
    merite: 'C\'est ce qu\'a dit Ibrâhîm quand on l\'a jeté dans le feu, et ce qu\'a dit Mouhammad ﷺ quand on lui a annoncé que des gens s\'étaient rassemblés contre eux.',
    source: 'Coran 3:173 ; Boukhari 4563', moments: ['force'] },
  { cle: 'doua_karb', titre: 'Dans les moments difficiles', arabe: 'لَا إِلَٰهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ',
    phonetique: 'Lâ ilâha illa-llâhou-l-\'adhîmou-l-halîm, lâ ilâha illa-llâhou rabbou-l-\'archi-l-\'adhîm, lâ ilâha illa-llâhou rabbou-s-samâwâti wa rabbou-l-ardi wa rabbou-l-\'archi-l-karîm',
    sens: 'Il n\'y a de divinité qu\'Allah, le Très-Grand, le Longanime. Il n\'y a de divinité qu\'Allah, le Seigneur du Trône immense. Il n\'y a de divinité qu\'Allah, le Seigneur des cieux, le Seigneur de la terre et le Seigneur du Trône généreux.',
    nombre: 1, nombre_texte: 'Quand tu es triste ou inquiet', merite: 'C\'est ce que disait le Prophète ﷺ dans les moments difficiles.',
    source: 'Boukhari 6346 ; Mouslim 2730', moments: ['force'] },
  { cle: 'bismika', titre: 'En se couchant', arabe: T.bismika.ar, phonetique: T.bismika.ph, sens: T.bismika.fr, nombre: 1, nombre_texte: '1 fois en se couchant',
    merite: 'C\'est ce que disait le Prophète ﷺ en se couchant.', source: 'Boukhari 6324', moments: ['soir'] },
  { cle: 'bismillah_repas', titre: 'Avant de manger', arabe: 'بِسْمِ اللَّهِ', phonetique: 'Bismi-llâh', sens: 'Au nom d\'Allah', nombre: 1, nombre_texte: 'Avant de manger',
    merite: 'Le Prophète ﷺ a dit à un enfant : « Dis Bismi-llâh, mange de ta main droite et mange de ce qui est devant toi. »',
    source: 'Boukhari 5376 ; Mouslim 2022', moments: ['repas'] },
  { cle: 'hamdulillah_repas', titre: 'Après avoir mangé', arabe: T.alhamdulillah.ar, phonetique: T.alhamdulillah.ph, sens: T.alhamdulillah.fr, nombre: 1, nombre_texte: 'Après avoir mangé ou bu',
    merite: 'Allah est satisfait du serviteur qui mange un repas et Le loue pour cela, ou qui boit une boisson et Le loue pour cela.',
    source: 'Mouslim 2734', moments: ['repas'], statut: 'a_verifier' },
];

export const DHIKR_ITEMS_SECOURS: DhikrItem[] = ITEMS.map((it, i) => ({
  ...it, id: `secours-${it.cle}`, statut: it.statut ?? 'ok', visible: it.visible ?? true, position: (i + 1) * 10,
}));

// ─── C · Les séries (matin, soir), F · le réveil, D · après la prière ─────────
type GesteSansId = Omit<DhikrGeste, 'id' | 'position' | 'visible' | 'statut' | 'compteur' | 'lien' | 'consigne' | 'arabe' | 'phonetique' | 'sens' | 'merite' | 'source'>
  & Partial<Pick<DhikrGeste, 'compteur' | 'lien' | 'consigne' | 'arabe' | 'phonetique' | 'sens' | 'merite' | 'source' | 'statut' | 'visible'>>;
const GESTES: GesteSansId[] = [
  // 🌙 Série du soir
  { cle: 'soir_intro', serie: 'soir', genre: 'intro', titre: 'La série du soir', consigne: 'Avant de dormir, 5 gestes' },
  { cle: 'soir_cote_droit', serie: 'soir', genre: 'geste', titre: 'Les ablutions et le côté droit',
    consigne: 'Fais tes ablutions comme pour la prière, couche-toi sur le côté droit, puis dis :',
    arabe: 'اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ',
    phonetique: 'Allâhoumma aslamtou nafsî ilayk, wa wajjahtou wajhî ilayk, wa fawwadtou amrî ilayk, wa alja\'tou dhahrî ilayk, raghbatan wa rahbatan ilayk, lâ malja\'a wa lâ manjâ minka illâ ilayk, âmantou bi kitâbika-lladhî anzalt, wa bi nabiyyika-lladhî arsalt',
    sens: 'Ô Allah, je me soumets à Toi, je tourne mon visage vers Toi, je Te confie mes affaires et je m\'appuie sur Toi, par amour et par crainte de Toi. Il n\'y a de refuge et de salut contre Toi qu\'auprès de Toi. Je crois en Ton Livre que Tu as descendu et en Ton Prophète que Tu as envoyé.',
    merite: 'Si tu meurs cette nuit, tu meurs dans la fitra (la pureté de la foi). Fais-en les dernières paroles que tu dis.',
    source: 'Boukhari 247 et 6313 ; Mouslim 2710', statut: 'a_verifier' },
  { cle: 'soir_ayat_kursi', serie: 'soir', genre: 'geste', titre: 'Ayat al-Kursi', consigne: 'Récite le Verset du Trône.',
    arabe: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    phonetique: 'Allâhou lâ ilâha illâ houwa-l-hayyou-l-qayyoûm, lâ ta\'khoudhouhoû sinatoun wa lâ nawm, lahoû mâ fi-s-samâwâti wa mâ fi-l-ard, man dha-lladhî yachfa\'ou \'indahoû illâ bi idhnih, ya\'lamou mâ bayna aydîhim wa mâ khalfahoum, wa lâ youhîtoûna bi chay\'in min \'ilmihî illâ bimâ châ\', wasi\'a koursiyyouhou-s-samâwâti wa-l-ard, wa lâ ya\'oûdouhoû hifdhouhoumâ, wa houwa-l-\'aliyyou-l-\'adhîm',
    sens: 'Allah ! Il n\'y a de divinité que Lui, le Vivant, Celui qui subsiste par Lui-même. Ni somnolence ni sommeil ne Le saisissent. À Lui ce qui est dans les cieux et sur la terre. Qui peut intercéder auprès de Lui sans Sa permission ? Il sait ce qui est devant eux et derrière eux, et ils n\'embrassent de Sa science que ce qu\'Il veut. Son Kursî s\'étend sur les cieux et la terre, dont la garde ne Lui coûte aucune peine. Il est le Très-Haut, le Très-Grand.',
    merite: 'Celui qui le récite en se couchant : un gardien envoyé par Allah reste avec lui, et le Diable ne s\'approche pas de lui jusqu\'au matin.',
    source: 'Coran 2:255 ; Boukhari 2311', lien: '/coran?item=42' },
  { cle: 'soir_baqara', serie: 'soir', genre: 'geste', titre: 'Les 2 derniers versets d\'Al-Baqara', consigne: 'Récite les versets 285 et 286 de la sourate Al-Baqara.',
    arabe: 'آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ ﴿٢٨٥﴾ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنْتَ مَوْلَانَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ ﴿٢٨٦﴾',
    phonetique: 'Âmana-r-rasoûlou bimâ ounzila ilayhi min rabbihî wa-l-mou\'minoûn, koullun âmana billâhi wa malâ\'ikatihî wa koutoubihî wa rousoulih, lâ noufarriqou bayna ahadin min rousoulih, wa qâloû sami\'nâ wa ata\'nâ, ghoufrânaka rabbanâ wa ilayka-l-masîr. Lâ youkallifou-llâhou nafsan illâ wous\'ahâ, lahâ mâ kasabat wa \'alayhâ ma-ktasabat, rabbanâ lâ tou\'âkhidhnâ in nasînâ aw akhta\'nâ, rabbanâ wa lâ tahmil \'alaynâ isran kamâ hamaltahoû \'ala-lladhîna min qablinâ, rabbanâ wa lâ touhammilnâ mâ lâ tâqata lanâ bih, wa-\'fou \'annâ wa-ghfir lanâ wa-rhamnâ, anta mawlânâ fa-nsournâ \'ala-l-qawmi-l-kâfirîn',
    sens: 'Le Messager a cru en ce qu\'on a fait descendre vers lui de la part de son Seigneur, et les croyants aussi… Allah n\'impose à aucune âme plus qu\'elle ne peut porter… Notre Seigneur, ne nous punis pas si nous oublions ou si nous nous trompons… Efface nos fautes, pardonne-nous et fais-nous miséricorde. Tu es notre Maître : donne-nous la victoire sur les gens mécréants.',
    merite: 'Celui qui récite les deux derniers versets de la sourate Al-Baqara la nuit, ils lui suffisent.',
    source: 'Coran 2:285-286 ; Boukhari 5009 ; Mouslim 807', lien: '/coran?item=49' },
  { cle: 'soir_trois_qoul', serie: 'soir', genre: 'geste', titre: 'Les 3 dernières sourates, soufflées dans les mains',
    consigne: 'Joins tes mains, souffle dedans en récitant Al-Ikhlâs, Al-Falaq et An-Nâs, puis passe tes mains sur tout ce que tu peux de ton corps, en commençant par la tête, le visage et le devant du corps. Fais-le 3 fois (le chapelet compte avec toi).',
    arabe: T.troisQoul.ar, phonetique: T.troisQoul.ph, sens: T.troisQoul.fr,
    compteur: [{ titre: 'Les 3 sourates + les mains', arabe: T.troisQoul.court.ar, phonetique: T.troisQoul.court.ph, sens: 'Souffle dans tes mains, puis passe-les sur ton corps', nombre: 3 }],
    merite: 'Chaque soir, en se couchant, le Prophète ﷺ faisait ainsi, trois fois.', source: 'Boukhari 5017' },
  { cle: 'soir_tasbih', serie: 'soir', genre: 'geste', titre: 'Le tasbih avant de dormir',
    consigne: 'Avec le chapelet : 33 fois Soubhâna-llâh, 33 fois Al-hamdou lillâh, 34 fois Allâhou akbar.',
    compteur: [e('Soubhâna-llâh', T.subhanallah, 33), e('Al-hamdou lillâh', T.alhamdulillah, 33), e('Allâhou akbar', T.allahuakbar, 34)],
    merite: 'Le Prophète ﷺ l\'a appris à \'Alî et Fâtima : « C\'est mieux pour vous qu\'un serviteur. »', source: 'Boukhari 3113 ; Mouslim 2727' },
  { cle: 'soir_final', serie: 'soir', genre: 'final', titre: 'Et pour finir, en fermant les yeux', arabe: T.bismika.ar, phonetique: T.bismika.ph, sens: T.bismika.fr,
    merite: 'C\'est ce que disait le Prophète ﷺ en se couchant.', source: 'Boukhari 6324' },

  // 🌅 Série du matin
  { cle: 'matin_intro', serie: 'matin', genre: 'intro', titre: 'La série du matin', consigne: 'Pour bien commencer la journée' },
  { cle: 'matin_sayyid', serie: 'matin', genre: 'geste', titre: 'Sayyid al-istighfâr', consigne: 'Le maître de la demande de pardon : dis-le avec conviction.',
    arabe: T.sayyid.ar, phonetique: T.sayyid.ph, sens: T.sayyid.fr, merite: T.sayyid.merite, source: 'Boukhari 6306' },
  { cle: 'matin_wabihamdihi', serie: 'matin', genre: 'geste', titre: 'Soubhâna-llâhi wa bihamdihi, 100 fois', consigne: 'Avec le chapelet.',
    compteur: [e('Soubhâna-llâhi wa bihamdihi', T.wabihamdihi, 100)],
    merite: 'Celui qui le dit 100 fois le matin et le soir : personne n\'apportera au Jour de la Résurrection mieux que lui, sauf quelqu\'un qui en a dit autant ou plus.',
    source: 'Mouslim 2692' },
  // ⚠️ Gestes 3 et 4 de Nadia : Abou Dâwoud / At-Tirmidhî (pas dans ses sources) → CACHÉS, « à confirmer par Nadia »
  { cle: 'matin_trois_qoul', serie: 'matin', genre: 'geste', titre: 'Al-Ikhlâs et les deux sourates de protection, 3 fois', consigne: 'Récite Al-Ikhlâs, Al-Falaq et An-Nâs, 3 fois.',
    arabe: T.troisQoul.ar, phonetique: T.troisQoul.ph, sens: T.troisQoul.fr,
    compteur: [{ titre: 'Les 3 sourates', arabe: T.troisQoul.court.ar, phonetique: T.troisQoul.court.ph, sens: 'Al-Ikhlâs, Al-Falaq, An-Nâs', nombre: 3 }],
    merite: 'Elles te suffisent contre toute chose.', source: 'Abou Dâwoud 5082 ; At-Tirmidhî 3575', statut: 'a_confirmer', visible: false,
    degre: 'hasan', degre_divergence: 'At-Tirmidhî l\'a jugé hasan sahîh ; Al-Albânî l\'a jugé hasan (bon).' },
  { cle: 'matin_bismillah_ladhi', serie: 'matin', genre: 'geste', titre: 'Bismi-llâhi-lladhî lâ yadourrou…, 3 fois', consigne: 'Dis-le 3 fois.',
    arabe: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    phonetique: 'Bismi-llâhi-lladhî lâ yadourrou ma\'a-smihî chay\'oun fi-l-ardi wa lâ fi-s-samâ\', wa houwa-s-samî\'ou-l-\'alîm',
    sens: 'Au nom d\'Allah, avec le nom de qui rien ne peut nuire, ni sur la terre ni dans le ciel, et Il est Celui qui entend tout, Celui qui sait tout.',
    compteur: [{ titre: 'Bismi-llâhi-lladhî…', arabe: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ…', phonetique: 'Bismi-llâhi-lladhî lâ yadourrou ma\'a-smihî chay\'oun…', sens: 'Au nom d\'Allah, avec le nom de qui rien ne peut nuire…', nombre: 3 }],
    merite: 'Rien ne lui nuira.', source: 'Abou Dâwoud 5088 ; At-Tirmidhî 3388', statut: 'a_confirmer', visible: false,
    degre: 'sahih' }, // At-Tirmidhî : hasan sahîh ; Al-Albânî : sahîh
  // 💡 Remplacements proposés (Al-Boukhârî / Mouslim) : cachés tant que Nadia ne les allume pas
  { cle: 'matin_juwayriya', serie: 'matin', genre: 'geste', titre: 'Les 4 paroles de Jouwayriya, 3 fois', consigne: 'Avec le chapelet, après la prière de l\'aube.',
    arabe: T.juwayriya.ar, phonetique: T.juwayriya.ph, sens: T.juwayriya.fr,
    compteur: [e('Soubhâna-llâhi wa bihamdihi, \'adada khalqihi…', T.juwayriya, 3)],
    merite: 'Le Prophète ﷺ a dit à Jouwayriya : « J\'ai dit après toi quatre paroles, trois fois ; si on les pesait avec tout ce que tu as dit depuis ce matin, elles l\'emporteraient. »',
    source: 'Mouslim 2726', statut: 'proposition', visible: false },
  { cle: 'matin_tahlil_10', serie: 'matin', genre: 'geste', titre: 'Lâ ilâha illa-llâh wahdahou…, 10 fois', consigne: 'Avec le chapelet.',
    compteur: [e('Lâ ilâha illa-llâh wahdahou…', T.tahlil, 10)],
    merite: 'C\'est comme avoir affranchi quatre personnes parmi les descendants d\'Ismâ\'îl.', source: 'Boukhari 6404 ; Mouslim 2693', statut: 'proposition', visible: false },
  { cle: 'matin_radi', serie: 'matin', genre: 'geste', titre: 'Radîtou billâhi rabban…', consigne: 'Dis-le avec ton cœur.',
    arabe: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ رَسُولًا', phonetique: 'Radîtou billâhi rabban, wa bil-islâmi dînan, wa bi Mouhammadin rasoûlan',
    sens: 'J\'agrée Allah comme Seigneur, l\'Islam comme religion et Mouhammad comme Messager.',
    merite: 'Celui qui agrée Allah comme Seigneur, l\'Islam comme religion et Mouhammad comme Messager, le Paradis lui devient obligatoire.',
    source: 'Mouslim 1884', statut: 'a_verifier' },
  { cle: 'matin_final', serie: 'matin', genre: 'final', titre: 'Et pour finir, l\'invocation du matin',
    arabe: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
    phonetique: 'Asbahnâ wa asbaha-l-moulkou lillâh, wa-l-hamdou lillâh, lâ ilâha illa-llâhou wahdahou lâ charîka lah, lahou-l-moulkou wa lahou-l-hamdou wa houwa \'alâ koulli chay\'in qadîr. Rabbi as\'alouka khayra mâ fî hâdha-l-yawmi wa khayra mâ ba\'dah, wa a\'oûdhou bika min charri mâ fî hâdha-l-yawmi wa charri mâ ba\'dah. Rabbi a\'oûdhou bika mina-l-kasali wa soû\'i-l-kibar. Rabbi a\'oûdhou bika min \'adhâbin fi-n-nâri wa \'adhâbin fi-l-qabr.',
    sens: 'Nous voici au matin, et le royaume appartient à Allah. Louange à Allah. Il n\'y a de divinité qu\'Allah, Seul, sans associé ; à Lui la royauté, à Lui la louange, et Il est capable de toute chose. Seigneur, je Te demande le bien de ce jour et de ce qui le suit, et je cherche refuge auprès de Toi contre le mal de ce jour et de ce qui le suit. Seigneur, je cherche refuge auprès de Toi contre la paresse et les maux de la vieillesse. Seigneur, je cherche refuge auprès de Toi contre un châtiment dans le Feu et un châtiment dans la tombe.',
    merite: 'Le Prophète ﷺ disait ces paroles chaque matin (et le soir : « Amsaynâ wa amsa-l-moulkou lillâh… »).', source: 'Mouslim 2723', statut: 'a_verifier' },

  // ☀️ Chaque matin, 3 gestes du réveil
  { cle: 'reveil_intro', serie: 'reveil', genre: 'intro', titre: 'Chaque matin, 3 gestes du réveil',
    consigne: 'Le Diable fait trois nœuds pendant que tu dors. En te réveillant : mentionne Allah, un nœud se défait ; fais tes ablutions, un 2e nœud se défait ; prie, et tous les nœuds se défont : tu commences la journée plein d\'entrain, l\'âme bonne.',
    source: 'Boukhari 1142 ; Mouslim 776' },
  { cle: 'reveil_dhikr', serie: 'reveil', genre: 'geste', titre: 'Mentionner Allah', consigne: 'Dès que tu ouvres les yeux, dis :',
    arabe: T.reveil.ar, phonetique: T.reveil.ph, sens: T.reveil.fr, merite: 'Un nœud se défait.', source: 'Boukhari 6312 ; Boukhari 1142' },
  { cle: 'reveil_ablutions', serie: 'reveil', genre: 'geste', titre: 'Faire les ablutions', consigne: 'Lève-toi et fais tes ablutions.',
    merite: 'Un 2e nœud se défait.', source: 'Boukhari 1142 ; Mouslim 776', lien: '/priere?carte=LODO' },
  { cle: 'reveil_priere', serie: 'reveil', genre: 'geste', titre: 'Prier', consigne: 'Fais ta prière du Sobh (Fajr).',
    merite: 'Tous les nœuds se défont : tu commences la journée plein d\'entrain, l\'âme bonne.', source: 'Boukhari 1142 ; Mouslim 776', lien: '/priere' },
  { cle: 'reveil_al_imran', serie: 'reveil', genre: 'bonus', titre: 'Bonus : les 10 derniers versets d\'Âl \'Imrân',
    consigne: 'Lis la fin de la sourate Âl \'Imrân, du verset 190 jusqu\'au verset 200. Elle commence ainsi :',
    arabe: 'إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ لِأُولِي الْأَلْبَابِ',
    phonetique: 'Inna fî khalqi-s-samâwâti wa-l-ardi wa-khtilâfi-l-layli wa-n-nahâri la âyâtin li oulî-l-albâb',
    sens: 'Dans la création des cieux et de la terre, et dans l\'alternance de la nuit et du jour, il y a des signes pour ceux qui réfléchissent.',
    merite: 'En se réveillant la nuit, le Prophète ﷺ essuyait le sommeil de son visage, puis récitait les dix derniers versets de la sourate Âl \'Imrân.',
    source: 'Coran 3:190-200 ; Boukhari 183', lien: '/coran?item=75' },

  // 🕌 D · Après la prière
  { cle: 'apres_intro', serie: 'apres_priere', genre: 'intro', titre: 'Après la prière', consigne: '33 + 33 + 33, puis 1 fois pour parfaire la centaine',
    merite: 'Celui qui le fait après chaque prière : ses péchés sont pardonnés, même s\'ils étaient aussi nombreux que l\'écume de la mer.', source: 'Mouslim 597' },
  { cle: 'apres_tasbih', serie: 'apres_priere', genre: 'geste', titre: 'Le tasbih d\'après la prière', consigne: 'Les étapes s\'enchaînent toutes seules.',
    compteur: [e('Soubhâna-llâh', T.subhanallah, 33), e('Al-hamdou lillâh', T.alhamdulillah, 33), e('Allâhou akbar', T.allahuakbar, 33), e('Lâ ilâha illa-llâh wahdahou…', T.tahlil, 1)],
    merite: 'Ses péchés sont pardonnés, même s\'ils étaient aussi nombreux que l\'écume de la mer.', source: 'Mouslim 597' },
];

export const DHIKR_GESTES_SECOURS: DhikrGeste[] = GESTES.map((g, i) => ({
  consigne: null, arabe: null, phonetique: null, sens: null, compteur: null, merite: null, source: null, lien: null,
  ...g, id: `secours-${g.cle}`, statut: g.statut ?? 'ok', visible: g.visible ?? true, position: (i + 1) * 10,
}));

// ─── IDÉE 6 · Le quiz du mérite ───────────────────────────────────────────────
type QuestionSansId = Omit<DhikrQuestion, 'id' | 'position' | 'visible'>;
const QUESTIONS: QuestionSansId[] = [
  { question: 'Quel dhikr est « un trésor parmi les trésors du Paradis » ?', choix: ['Lâ hawla wa lâ qouwwata illâ billâh', 'Astaghfirou-llâh', 'Allâhou akbar'], bonne: 0,
    explication: 'Le Prophète ﷺ l\'a appelé « un trésor parmi les trésors du Paradis ».', source: 'Boukhari 6384 ; Mouslim 2704' },
  { question: 'Quelles sont « les deux paroles légères sur la langue, lourdes dans la balance » ?', choix: ['Bismi-llâh et Al-hamdou lillâh', 'Soubhâna-llâhi wa bihamdihi, Soubhâna-llâhi-l-\'adhîm', 'Allâhou akbar et Lâ ilâha illa-llâh'], bonne: 1,
    explication: 'Elles sont aussi aimées du Tout Miséricordieux.', source: 'Boukhari 6406 ; Mouslim 2694' },
  { question: 'Combien de fois par jour le Prophète ﷺ se repentait-il à Allah ?', choix: ['10 fois', '33 fois', '100 fois'], bonne: 2,
    explication: '« Repentez-vous à Allah, car moi je me repens à Lui cent fois par jour. »', source: 'Mouslim 2702' },
  { question: 'Après la prière, que dit-on pour parfaire la centaine, après 33 + 33 + 33 ?', choix: ['Lâ ilâha illa-llâh wahdahou lâ charîka lah…', 'Astaghfirou-llâh', 'Bismi-llâh'], bonne: 0,
    explication: 'Ses péchés sont alors pardonnés, même s\'ils étaient comme l\'écume de la mer.', source: 'Mouslim 597' },
  { question: 'Avant de dormir, combien de fois dit-on « Allâhou akbar » dans le tasbih appris à \'Alî et Fâtima ?', choix: ['33 fois', '34 fois', '10 fois'], bonne: 1,
    explication: '33 Soubhâna-llâh, 33 Al-hamdou lillâh et 34 Allâhou akbar : « c\'est mieux pour vous qu\'un serviteur ».', source: 'Boukhari 3113 ; Mouslim 2727' },
  { question: 'Quel verset, lu en se couchant, protège du Diable jusqu\'au matin ?', choix: ['La sourate Al-Fâtiha', 'Ayat al-Kursi', 'Le dernier verset d\'An-Nâs'], bonne: 1,
    explication: 'Un gardien envoyé par Allah reste avec lui jusqu\'au matin.', source: 'Boukhari 2311' },
  { question: 'Celui qui dit 100 fois « Soubhâna-llâhi wa bihamdihi » dans la journée…', choix: ['…gagne une maison au Paradis', '…a ses péchés effacés, même comme l\'écume de la mer', '…n\'a plus besoin de prier'], bonne: 1,
    explication: 'Ses péchés sont effacés, même s\'ils sont aussi nombreux que l\'écume de la mer.', source: 'Boukhari 6405 ; Mouslim 2691' },
  { question: 'Comment appelle-t-on « Allâhoumma anta rabbî, lâ ilâha illâ ant… » ?', choix: ['Sayyid al-istighfâr', 'Ayat al-Kursi', 'Le tasbih'], bonne: 0,
    explication: 'Le maître de la demande de pardon : dit avec conviction, le jour ou la nuit, il mène au Paradis.', source: 'Boukhari 6306' },
  { question: 'Que se passe-t-il quand on mentionne Allah en se réveillant ?', choix: ['Un des 3 nœuds du Diable se défait', 'On gagne 10 points', 'Rien de spécial'], bonne: 0,
    explication: 'Puis les ablutions défont le 2e nœud, et la prière les défait tous.', source: 'Boukhari 1142 ; Mouslim 776' },
  { question: 'Quelles sont les quatre paroles les plus aimées d\'Allah ?', choix: ['Bismi-llâh, Âmîn, In châ\' Allah, Mâ châ\' Allah', 'Soubhâna-llâh, Al-hamdou lillâh, Lâ ilâha illa-llâh, Allâhou akbar', 'Astaghfirou-llâh, Bismi-llâh, Al-hamdou lillâh, Âmîn'], bonne: 1,
    explication: 'Peu importe par laquelle tu commences.', source: 'Mouslim 2137' },
  { question: '« Lâ ilâha illa-llâh wahdahou lâ charîka lah… » dit 100 fois dans la journée, c\'est comme…', choix: ['…affranchir 10 esclaves', '…jeûner un mois', '…lire tout le Coran'], bonne: 0,
    explication: 'En plus, 100 bonnes actions écrites, 100 péchés effacés, et une protection contre le Diable jusqu\'au soir.', source: 'Boukhari 3293 ; Mouslim 2691' },
  { question: 'Que disait le Prophète ﷺ en se couchant ?', choix: ['Bismika-llâhoumma amoûtou wa ahyâ', 'Allâhou akbar', 'As-salâmou \'alaykoum'], bonne: 0,
    explication: '« C\'est en Ton nom, ô Allah, que je meurs et que je vis. »', source: 'Boukhari 6324' },
];

export const DHIKR_QUIZ_SECOURS: DhikrQuestion[] = QUESTIONS.map((q, i) => ({ ...q, id: `secours-q${i + 1}`, visible: true, position: (i + 1) * 10 }));
