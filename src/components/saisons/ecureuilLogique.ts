/**
 * 🐿️ Logique de l'écureuil qui se cache dans TOUTE l'appli (Nadia, 2026-11-26) — pure, testée dans ecureuilLogique.test.ts.
 * - À la connexion, environ 1 fois sur 2 il est dans sa maisonnette de l'accueil (45 s à 1 min 30), puis il repart se cacher.
 * - Il se cache dans une page de l'appli (une de celles que l'élève voit sur l'accueil), posé au bord d'un élément.
 * - 10 s : il prévient que des indices vont arriver. Indices : 30 s → une devinette ; 45 s → une devinette plus facile
 *   (+ le nom de la page) ; 55 s → l'endroit exact (il remue, une flèche le montre, bouton « Y aller »).
 * - Trouvé → il rentre dans sa maisonnette et repart se cacher au bout de 1 à 2 minutes (au hasard).
 * Rien ne passe par Internet : tout se décide sur l'appareil.
 * Les devinettes restent des jeux : aucune règle de religion n'y est affirmée (règle n° 1 de Nadia).
 */

export type PageEcureuil = { chemin: string; nom: string };
export type EtatEcureuil =
  | { lieu: 'maison'; jusqua: number; dernier?: string }
  | { lieu: 'cache'; chemin: string; nomPage: string; depuis: number; graine: number };

/** Environ 1 fois sur 2 il est chez lui à la connexion (Nadia, 26/11 : « souvent ») */
export const PROBA_MAISON = 0.5;
/** Délais des indices, comptés depuis le moment où il s'est caché (Nadia, 26/11 : 30 s, puis +15 s, puis +10 s) */
export const DELAIS_INDICES = [30_000, 45_000, 55_000] as const;
/** Au bout de 10 s de recherche, il prévient que des indices vont arriver */
export const DELAI_ANNONCE = 10_000;
export const TEXTE_ANNONCE = 'Si tu ne me trouves pas, tu auras des indices dans quelques secondes 😉';
/** Si l'élève n'a encore vu aucune carte de l'accueil : il se cache sur l'accueil */
export const PAGE_SECOURS: PageEcureuil = { chemin: '/', nom: 'Accueil' };

export function niveauIndice(ecoule: number): 0 | 1 | 2 | 3 {
  if (ecoule >= DELAIS_INDICES[2]) return 3;
  if (ecoule >= DELAIS_INDICES[1]) return 2;
  if (ecoule >= DELAIS_INDICES[0]) return 1;
  return 0;
}
/** La petite bulle « tu auras des indices dans quelques secondes » : de 10 s jusqu'au 1er indice */
export const annonceVisible = (ecoule: number) => ecoule >= DELAI_ANNONCE && ecoule < DELAIS_INDICES[0];

/** Après l'avoir trouvé : il reste chez lui 1 à 2 minutes (jamais plus) */
export const dureeRetour = (h: number) => 60_000 + Math.round(Math.min(1, Math.max(0, h)) * 60_000);
/** À la connexion, quand il est chez lui : 45 s à 1 min 30 avant de repartir */
export const dureeMaisonConnexion = (h: number) => 45_000 + Math.round(Math.min(1, Math.max(0, h)) * 45_000);

/** Choisit la page de sa cachette, jamais la même que la fois d'avant (s'il y a le choix) */
export function choisirPage(pages: PageEcureuil[], h: number, eviter?: string): PageEcureuil {
  const liste = pages.length ? pages : [PAGE_SECOURS];
  const autres = liste.length > 1 && eviter ? liste.filter((p) => p.chemin !== eviter) : liste;
  const choix = autres.length ? autres : liste;
  return choix[Math.min(choix.length - 1, Math.floor(Math.max(0, h) * choix.length))];
}

export function partirSeCacher(maintenant: number, pages: PageEcureuil[], h: number, graine: number, eviter?: string): EtatEcureuil {
  const p = choisirPage(pages, h, eviter);
  return { lieu: 'cache', chemin: p.chemin, nomPage: p.nom, depuis: maintenant, graine };
}

/** L'état au moment de la connexion */
export function etatDeDepart(maintenant: number, pages: PageEcureuil[], h1: number, h2: number, h3: number): EtatEcureuil {
  if (h1 < PROBA_MAISON) return { lieu: 'maison', jusqua: maintenant + dureeMaisonConnexion(h2) };
  return partirSeCacher(maintenant, pages, h2, h3);
}

/** Le temps passe : chez lui et c'est l'heure → il repart se cacher ailleurs */
export function avancer(e: EtatEcureuil, maintenant: number, pages: PageEcureuil[], h: number, graine: number): EtatEcureuil {
  if (e.lieu === 'maison' && maintenant >= e.jusqua) return partirSeCacher(maintenant, pages, h, graine, e.dernier);
  return e;
}

/** Trouvé : il rentre dans sa maisonnette */
export function apresTrouve(e: EtatEcureuil, maintenant: number, h: number): EtatEcureuil {
  return { lieu: 'maison', jusqua: maintenant + dureeRetour(h), dernier: e.lieu === 'cache' ? e.chemin : undefined };
}

/** Tire un numéro 0 … n-1 au hasard, jamais le même que `dernier` (s'il y a le choix) */
export function tirerSansRepeter(n: number, dernier: number | null | undefined, h: number): number {
  if (n <= 1) return 0;
  const x = Math.min(0.999999, Math.max(0, h));
  if (dernier == null || dernier < 0 || dernier >= n) return Math.floor(x * n);
  const i = Math.floor(x * (n - 1));
  return i >= dernier ? i + 1 : i;
}

/** Remplace {prenom} ; sans prénom, la tournure reste correcte (« Cherche bien, {prenom}… » → « Cherche bien… ») */
export function avecPrenom(texte: string, prenom: string): string {
  const p = prenom.trim();
  if (p) return texte.replace(/\{prenom\}/g, p);
  return texte.replace(/,?\s*\{prenom\}/g, '').replace(/\s+([!?…])/g, ' $1').replace(/\s{2,}/g, ' ').trim();
}

/* ---------- 🏡 Bulle à côté de la maisonnette, quand il n'y est pas (Nadia : au moins 20, joueuses) ---------- */
export const MESSAGES_MAISON: readonly string[] = [
  'Tu ne me trouveras pas, {prenom} ! 😜',
  'Cherche bien, {prenom}… je suis plus malin qu\'un renard 🦊',
  'Hihi, même avec une loupe tu ne me trouveras pas ! 🔍',
  'Je suis parti me cacher, {prenom} ! Viens me chercher 🐿️',
  'Coucou {prenom} ! Je ne suis pas à la maison 🙈',
  'Je suis caché quelque part dans l\'appli… 🤫',
  'Toc toc ? Personne ! Je joue à cache-cache, {prenom} 😄',
  'Attrape-moi si tu peux, {prenom} ! 🏃',
  'Je suis petit, mais je me cache très bien ! 😎',
  'Un, deux, trois… tu me cherches, {prenom} ? 🙈',
  'Psst, {prenom} ! Je suis dans une des cartes 🤭',
  'Ma maison est vide : je suis parti jouer ! 🍂',
  'Même les hiboux ne m\'ont pas trouvé ! 🦉',
  'Je parie que tu ne me trouves pas, {prenom} ! 😏',
  'Chut… je suis bien caché, {prenom} 🤫',
  'J\'ai pris mes noisettes et je suis parti me cacher ! 🌰',
  'Ouvre grand tes yeux, {prenom} ! 👀',
  'Je suis le roi du cache-cache ! 👑',
  'Tu me cherches ? Moi, je te vois, {prenom} ! 😜',
  'Va voir dans les cartes… si tu oses ! 😄',
  'Je me suis faufilé dans l\'appli, {prenom} ! 🐿️',
  'Hihi, je suis invisible ! Enfin… presque 😏',
];

/* ---------- 💡 Bulle des indices : début de phrase et encouragements (Nadia : au moins 20) ---------- */
export const INTROS_INDICE: readonly string[] = [
  'Psst !', 'Hihi !', 'Petit indice :', 'Écoute bien…', 'Allez, je t\'aide :', 'Chut, c\'est un secret :',
  'Devinette !', 'Tu sèches ? Voilà :', 'Hé, par ici !', 'Je te souffle un indice :', 'Ouvre bien tes oreilles :',
  'Coucou, c\'est moi !', 'Bon, d\'accord…', 'Indice de l\'écureuil :', 'Tu donnes ta langue au chat ? Non ?',
  'Je suis gentil, alors voilà :', 'Approche…', 'Prêt ? Écoute :', 'Hop, un indice !', 'Tiens, un petit coup de main :',
  'Je vais te mettre sur la piste :',
];
export const ENCOURAGEMENTS: readonly string[] = [
  'Tu chauffes ! 🔥', 'Ouvre grand tes yeux 👀', 'Tu y es presque ! 💪', 'Cherche bien partout 🔍', 'Allez, tu peux le faire ! ⭐',
  'Je crois en toi ! 🌟', 'Regarde bien les bords des cartes 🧐', 'Ne lâche rien ! 🚀', 'Tu es un vrai détective ! 🕵️',
  'Encore un petit effort ! 🌈', 'Je suis tout près… 🤫', 'Fais travailler ta tête ! 🧠', 'Tu vas y arriver ! 🎯',
  'Chut, ne fais pas de bruit… 🐾', 'Regarde en haut, regarde en bas ! ↕️', 'Prends ton temps 😊', 'Hihi, ça devient chaud ! 🌶️',
  'Tu es plus malin que moi ? 😄', 'Courage, petit chercheur ! 🐿️', 'Les noisettes sont pour toi si tu me trouves ! 🌰',
  'Je t\'attends ! ⏳',
];

/* ---------- 🧩 Devinettes par page (d'abord difficile, sans le nom ; puis plus facile) ---------- */
export type Devinettes = { difficile: readonly string[]; facile: readonly string[] };

export const DEVINETTES_PAGES: Record<string, Devinettes> = {
  '/priere': {
    difficile: [
      'Je suis en train de faire ma prière, alors tu te doutes de l\'endroit où je suis ? 😜',
      'Je regarde les étoiles du ciel pour savoir quand vient la prochaine prière ✨',
      'Je cherche la direction de la Kaaba… tu vois où je suis ? 🧭',
    ],
    facile: ['Je suis là où on apprend les ablutions et la prière 💧', 'Je suis là où on voit les heures des 5 prières 🕰️'],
  },
  '/alphabet': {
    difficile: [
      'Je suis bloqué entre deux lettres, le BA et le TA, dans l\'alphabet ! 🔤',
      'Alif, Ba, Ta… je récite mes lettres ! Tu devines où je suis ? ✏️',
      'Je m\'entraîne à bien écrire mes lettres arabes 🖊️',
    ],
    facile: ['Je suis au milieu des 28 lettres arabes 🔤', 'Je suis là où chaque lettre a sa petite carte ✏️'],
  },
  '/nourania': {
    difficile: [
      'Je lis mes lignes, leçon après leçon, avec plein de couleurs 🌈',
      'Je suis sur le chemin des leçons pour apprendre à bien lire l\'arabe 🛤️',
      'Je coche mes lignes une par une… où suis-je ? ☑️',
    ],
    facile: ['Je suis dans les leçons de lecture avec les lignes à cocher ☑️', 'Je suis là où on apprend à lire, leçon par leçon 📗'],
  },
  '/sourates': {
    difficile: [
      'J\'apprends une sourate par cœur… à ton avis, où suis-je ? 🎙️',
      'Je suis sur le chemin des étoiles, de sourate en sourate ⭐',
      'Je m\'enregistre pour réciter à mon professeur 🎤',
    ],
    facile: ['Je suis là où on apprend les sourates une par une 📖', 'Je suis là où on envoie sa récitation 🎙️'],
  },
  '/invocations': {
    difficile: [
      'Je dis « Bismillah » avant de manger… tu vois où je suis ? 🍽️',
      'Je lève mes petites mains pour faire une invocation 🤲',
      'J\'apprends quoi dire avant de dormir 😴',
    ],
    facile: ['Je suis au milieu des invocations de tous les jours 🤲', 'Je suis là où on apprend les dou\'as 🤲'],
  },
  '/ramadan': {
    difficile: [
      'Je compte les jours avec les lanternes du mois béni 🏮',
      'J\'attends le coucher du soleil pour l\'iftar… où suis-je ? 🌙',
      'Je regarde le croissant de lune du mois de jeûne 🌙',
    ],
    facile: ['Je suis là où on parle du mois du jeûne 🌙', 'Je suis dans le calendrier du mois de Ramadan 🏮'],
  },
  '/grammaire': {
    difficile: [
      'Je conjugue des verbes en arabe, ça me chatouille la tête ! 🧠',
      'Je range les mots : masculin, féminin… tu devines où je suis ? 📝',
      'Je joue avec les règles de la langue arabe 🧩',
    ],
    facile: ['Je suis là où on apprend la grammaire et la conjugaison 📝', 'Je suis au milieu des verbes et des règles 📝'],
  },
  '/coran': {
    difficile: [
      'Je suis en pleine lecture du Coran, à ton avis où suis-je ? 📖',
      'Je tourne les pages du grand livre, une par une 📖',
      'Je pose mon marque-page pour ne pas perdre ma place 🔖',
    ],
    facile: ['Je suis là où on lit les pages du Coran 📖', 'Je suis là où on choisit un juz\' 📖'],
  },
  '/allah-names': {
    difficile: [
      'Je suis au milieu de très beaux noms… il y en a 99 ! 🌟',
      'Je me suis caché au milieu des plus beaux noms ✨',
      'J\'apprends un beau nom chaque jour… tu vois où je suis ? 🌟',
    ],
    facile: ['Je suis dans la carte des 99 noms 🌟', 'Je suis là où chaque nom a sa petite fiche 🌟'],
  },
  '/module/vocabulaire': {
    difficile: [
      'J\'apprends plein de nouveaux mots arabes, un par un 🗣️',
      'Je range des mots dans ma tête comme des noisettes 🌰',
    ],
    facile: ['Je suis là où on apprend des mots nouveaux 🗣️', 'Je suis dans la carte des mots arabes 🗣️'],
  },
  '/module/lecture-coran': {
    difficile: [
      'Je lis doucement, en prenant bien mon temps… où suis-je ? 📗',
      'Je m\'entraîne à bien lire, lettre après lettre 📗',
    ],
    facile: ['Je suis là où on s\'entraîne à lire le Coran 📗', 'Je suis dans la carte de lecture 📗'],
  },
  '/module/darija': {
    difficile: [
      'Labas ? Je parle comme au Maroc ! Tu devines où je suis ? 🇲🇦',
      'J\'apprends à dire bonjour en arabe marocain 👋',
    ],
    facile: ['Je suis là où on parle darija 🇲🇦', 'Je suis dans la carte de l\'arabe marocain 🇲🇦'],
  },
  '/module/dictionnaire': {
    difficile: [
      'Je cherche un mot difficile… dans un très gros livre de mots ! 📚',
      'Je tourne les pages pour trouver ce que veut dire un mot 🔎',
    ],
    facile: ['Je suis là où on cherche le sens des mots 📚', 'Je suis dans le dictionnaire 📚'],
  },
  '/module/dhikr': {
    difficile: [
      'Je répète « Soubhan Allah » tout doucement… où suis-je ? 📿',
      'Je compte sur mes doigts en me souvenant d\'Allah 📿',
    ],
    facile: ['Je suis là où on fait le dhikr 📿', 'Je suis dans la carte du rappel d\'Allah 📿'],
  },
  '/module/hadiths': {
    difficile: [
      'J\'écoute les belles paroles du Prophète ﷺ… tu vois où je suis ? 📜',
      'Je lis une parole du Prophète ﷺ chaque jour 📜',
    ],
    facile: ['Je suis là où on lit les hadiths 📜', 'Je suis dans la carte des paroles du Prophète ﷺ 📜'],
  },
  '/module/histoires-prophetes': {
    difficile: [
      'J\'écoute l\'histoire de Nouh et de son grand bateau ⛵',
      'J\'écoute l\'histoire de Younous et du gros poisson 🐟',
      'J\'adore les histoires qu\'on raconte avant de dormir… surtout celles-là ! 📚',
    ],
    facile: ['Je suis là où on raconte les histoires des prophètes 📚', 'Je suis dans la carte des histoires 📚'],
  },
  '/classement': {
    difficile: [
      'Je regarde qui a le plus de points… 🏆',
      'Je monte sur le podium avec les champions ! 🥇',
    ],
    facile: ['Je suis là où on voit les points de chacun 🏆', 'Je suis dans le classement 🏆'],
  },
  '/settings': {
    difficile: [
      'Je joue avec les boutons et les réglages… où suis-je ? ⚙️',
      'Je suis caché derrière la roue dentée ⚙️',
    ],
    facile: ['Je suis dans les paramètres ⚙️', 'Je suis là où on règle l\'appli ⚙️'],
  },
  '/attendance': {
    difficile: [
      'Présent ! Je fais l\'appel comme en classe ✋',
      'Je compte les jours où tu es venu au cours 📅',
    ],
    facile: ['Je suis là où on voit qui est venu au cours 📋', 'Je suis dans la présence en classe 📋'],
  },
  '/': {
    difficile: [
      'De là où je suis, je vois toute l\'application ! Tu m\'as trouvé ? 🏡',
      'Je suis tout près de ma maisonnette… 🏡',
    ],
    facile: ['Je suis sur l\'accueil, la toute première page 🏡', 'Je suis sur la page où il y a toutes les cartes 🏡'],
  },
};
const ALIAS_PAGES: Record<string, string> = { '/module/allah-names': '/allah-names', '/cahier': '/', '/index': '/' };

/** Devinette de secours, pour un endroit que l'écureuil ne connaît pas */
export const DEVINETTES_SECOURS: Devinettes = {
  difficile: [
    'Je suis dans une des cartes que tu vois sur l\'accueil… laquelle ? 🤔',
    'Je me suis faufilé dans une page où tu apprends plein de choses 📚',
  ],
  facile: ['Je suis dans une carte de l\'accueil : ouvre-les une par une ! 🔍'],
};

const sansAccents = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Les devinettes d'une page : par son chemin, sinon d'après son nom, sinon celles de secours */
export function devinettesPage(chemin: string, nomPage = ''): Devinettes {
  const c = (chemin.split('?')[0].split('#')[0] || '/').replace(/\/+$/, '') || '/';
  const cle = ALIAS_PAGES[c] ?? c;
  if (DEVINETTES_PAGES[cle]) return DEVINETTES_PAGES[cle];
  const n = sansAccents(nomPage);
  const table: [RegExp, string][] = [
    [/priere|ablution|lodo/, '/priere'], [/alphabet|lettre/, '/alphabet'], [/nourania/, '/nourania'], [/sourate/, '/sourates'],
    [/invocation|doua/, '/invocations'], [/ramadan/, '/ramadan'], [/grammaire|conjugaison/, '/grammaire'],
    [/lecture/, '/module/lecture-coran'], [/coran/, '/coran'], [/allah|noms/, '/allah-names'], [/vocabulaire/, '/module/vocabulaire'],
    [/darija/, '/module/darija'], [/dictionnaire/, '/module/dictionnaire'], [/dhikr/, '/module/dhikr'], [/hadith/, '/module/hadiths'],
    [/prophete|histoire/, '/module/histoires-prophetes'], [/classement/, '/classement'], [/parametre/, '/settings'],
    [/presence/, '/attendance'], [/accueil/, '/'],
  ];
  const trouve = table.find(([r]) => r.test(n));
  return trouve ? DEVINETTES_PAGES[trouve[1]] : DEVINETTES_SECOURS;
}

/* ---------- 🏡 Devinettes des repères de l'accueil (logo, titre, arbre, cheminée, tas de feuilles, devoirs…) ---------- */
export const DEVINETTES_ACCUEIL: Record<string, readonly string[]> = {
  logo: ['Je suis sur la lune dorée, tu as deviné où je suis ? 🌙', 'De là où je suis, je vois toute l\'application ! Tu m\'as trouvé ? 👀'],
  titre: ['Je suis assis sur le plus grand mot de la page ✍️', 'Je me suis posé sur le nom de l\'appli 🔤'],
  arbre: ['Je grimpe dans mon arbre préféré, là où poussent les fruits 🌳', 'Je suis tout en haut, au milieu des feuilles 🍃'],
  cheminee: ['J\'ai un peu froid, alors je me réchauffe près du feu 🔥', 'Je suis tout près du chat qui dort devant le feu 🐈'],
  tas: ['Je me suis roulé en boule dans les feuilles qui craquent 🍂', 'Je suis caché sous un gros tas, tout doux 🍂'],
  neige: ['Brrr… je me cache dans le froid tout blanc ❄️', 'Je suis à côté de quelqu\'un qui a une carotte à la place du nez ⛄'],
  chalet: ['Je suis devant une petite maison en bois toute enneigée 🏠'],
  ciel: ['Je regarde le ciel, tout là-haut ☀️', 'Je suis à côté de ce qui brille le plus dans le ciel ✨'],
  papillon: ['Je joue avec quelqu\'un qui a de grandes ailes colorées 🦋'],
  plage: ['Je construis quelque chose avec du sable 🏖️', 'Je me repose à l\'ombre des grandes feuilles 🌴'],
  kaaba: ['Je regarde la maison carrée, tout là-haut 🕋'],
  mosquee: ['Je suis tout près d\'une jolie coupole bleue 🕌'],
  dromadaire: ['Je fais une balade sur le dos de quelqu\'un qui marche dans le désert 🐪'],
  devoirs: ['Je suis en train de faire mes devoirs, alors ne me dérange pas ! 📌', 'Je regarde ce qu\'il y a à faire pour la semaine 📌'],
  carnet: ['Je lis le carnet de liaison, chut ! 📒'],
  carte: ['Je me suis glissé au bord d\'une carte de l\'accueil 🃏', 'Je suis assis sur une des cartes de la page 🃏'],
};

/**
 * Quel repère de l'accueil est près de lui : nom du décor (`data-cachette`), carte de l'accueil, ou texte du titre voisin.
 * Rend la liste de devinettes, ou null si on ne sait pas.
 */
export function devinettesLieu(l: { cachette?: string; carteChemin?: string; carteNom?: string; texte?: string }): readonly string[] | null {
  const c = sansAccents(l.cachette || '');
  const t = sansAccents(l.texte || '');
  const regles: [RegExp, string][] = [
    [/logo/, 'logo'], [/titre/, 'titre'], [/cheminee/, 'cheminee'], [/tas de feuilles/, 'tas'], [/bonhomme|tas de neige/, 'neige'],
    [/chalet/, 'chalet'], [/arbre/, 'arbre'], [/soleil|lune/, 'ciel'], [/papillon/, 'papillon'], [/chateau|palmier/, 'plage'],
    [/kaaba/, 'kaaba'], [/mosquee/, 'mosquee'], [/dromadaire/, 'dromadaire'],
  ];
  const deco = c && regles.find(([r]) => r.test(c));
  if (deco) return DEVINETTES_ACCUEIL[deco[1]];
  if (l.carteChemin || l.carteNom) {
    const d = devinettesPage(l.carteChemin || '', l.carteNom || '');
    return d === DEVINETTES_SECOURS ? DEVINETTES_ACCUEIL.carte : d.difficile;
  }
  if (/devoir/.test(t)) return DEVINETTES_ACCUEIL.devoirs;
  if (/carnet/.test(t)) return DEVINETTES_ACCUEIL.carnet;
  return null;
}

/** Une petite image pour le nom de la page */
export function emojiPage(nom: string): string {
  const n = sansAccents(nom);
  const table: [RegExp, string][] = [
    [/priere|lodo|ablution/, '🕌'], [/sourate|coran|lecture/, '📖'], [/invocation|dou|dhikr/, '🤲'], [/nourania/, '🔤'],
    [/alphabet|lettre/, '✏️'], [/ramadan/, '🌙'], [/allah|noms/, '🌟'], [/hadith/, '📜'], [/prophete|histoire/, '📚'],
    [/grammaire|conjugaison|vocabulaire|dictionnaire|darija/, '📝'], [/classement/, '🏆'], [/presence/, '📋'], [/parametre/, '⚙️'], [/accueil/, '🏡'],
  ];
  return table.find(([r]) => r.test(n))?.[1] ?? '📄';
}

/** En haut / au milieu / en bas de la page */
export function positionDansPage(haut: number, hauteurPage: number): 'en haut' | 'au milieu' | 'en bas' {
  const r = hauteurPage > 0 ? haut / hauteurPage : 0;
  return r < 0.34 ? 'en haut' : r < 0.67 ? 'au milieu' : 'en bas';
}

/** Les numéros tirés au hasard pour un indice (gardés tant que l'indice ne change pas) */
export type ChoixIndice = { intro: number; devinette: number; encourage: number };
const prendre = <T,>(liste: readonly T[], i: number): T => liste[((i % liste.length) + liste.length) % liste.length];

/**
 * 💡 Le texte de l'indice.
 * - Pas dans la bonne page : 1 = devinette (sans le nom de la page) ; 2 = devinette plus facile + nom de la page ;
 *   3 = le nom de la page + « Y aller ».
 * - Dans la bonne page : 1 = devinette du repère près de lui (`devinettes`), sinon « je suis dans cette page » ;
 *   2 = le titre / la carte près de lui ; 3 = « je remue et je brille ».
 */
export function texteIndice(
  niveau: number,
  c: { surLaPage: boolean; chemin?: string; nomPage: string; repere?: string; ou?: string; devinettes?: readonly string[] | null },
  choix: ChoixIndice = { intro: 0, devinette: 0, encourage: 0 },
): string | null {
  if (niveau <= 0) return null;
  const intro = prendre(INTROS_INDICE, choix.intro);
  const encourage = prendre(ENCOURAGEMENTS, choix.encourage);
  const page = `« ${c.nomPage} » ${emojiPage(c.nomPage)}`;
  if (!c.surLaPage) {
    const d = devinettesPage(c.chemin ?? '', c.nomPage);
    if (niveau === 1) return `${intro} ${prendre(d.difficile, choix.devinette)}`;
    if (niveau === 2) return `${prendre(d.facile, choix.devinette)} C'est la page ${page}. ${encourage}`;
    return `Je suis dans la page ${page} ! Touche « Y aller » 👇`;
  }
  if (niveau === 1) {
    return c.devinettes?.length
      ? `${intro} ${prendre(c.devinettes, choix.devinette)}`
      : `${intro} Je suis caché dans cette page ! ${encourage}`;
  }
  if (niveau === 2) {
    return c.repere
      ? `Je suis tout près de « ${c.repere} », ${c.ou ?? 'dans la page'} 🔍 ${encourage}`
      : `Je suis ${c.ou ?? 'dans la page'}, au bord d'une carte 🔍 ${encourage}`;
  }
  return 'Regarde : je remue et je brille ! Suis la flèche ✨';
}

/** Mélange les numéros 0 … n-1 de façon toujours pareille pour une même graine (pour choisir sa cachette dans la page) */
export function ordreAuHasard(n: number, graine: number): number[] {
  const t = Array.from({ length: n }, (_, i) => i);
  let s = Math.floor(Math.abs(graine) * 2147483647) || 1;
  const r = () => { s = (s * 48271) % 2147483647; return s / 2147483647; };
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; }
  return t;
}

/** Un repère lisible pour l'indice n° 2 : le début du texte, sans couper un mot */
export function repereCourt(texte: string, max = 28): string {
  const t = texte.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const coupe = t.slice(0, max);
  const i = coupe.lastIndexOf(' ');
  return `${(i > 10 ? coupe.slice(0, i) : coupe).trim()}…`;
}
