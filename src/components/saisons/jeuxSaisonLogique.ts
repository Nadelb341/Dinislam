import type { Saison } from '@/lib/saisons';

/** 🎠 Logique des petits jeux de saison (pure, testée dans jeuxSaisonLogique.test.ts) */

/** 💬 Ce que dit le compagnon : il encourage à travailler, à faire valider ses devoirs, et à revenir pour qu'il grandisse */
export function messagesCompagnon(c: { prenom: string; grandi: boolean; niveau: number; aFaire: number }): string[] {
  const p = c.prenom || 'toi';
  const premier = c.grandi
    ? `Salam ${p} ! Merci d'être venu aujourd'hui : j'ai grandi 🌱 Reviens demain pour que je grandisse encore !`
    : `Salam ${p} ! Je suis content de te revoir 😊 Je grandis un peu chaque jour où tu viens me voir.`;
  const devoirs = c.aFaire > 0
    ? `Il te reste ${c.aFaire} devoir${c.aFaire > 1 ? 's' : ''} à faire. On s'y met ensemble ? 💪`
    : `Tous tes devoirs sont faits, ma shā' Allah ! 🌟`;
  return [
    premier,
    devoirs,
    'Quand tu as fini un devoir, envoie-le à ton professeur pour qu\'il le valide : ton diamant va briller 💎',
    'Un petit peu chaque jour, c\'est ce qu\'Allah aime le plus 💚',
    `Si tu reviens demain, je serai encore plus grand ! ${c.niveau >= 10 ? 'Regarde comme j\'ai déjà poussé 😄' : 'Je compte sur toi 🤞'}`,
    'As-tu révisé ta sourate aujourd\'hui ? Récite-la-moi dans ta tête 📖',
    'Dis « Bismillah » avant de commencer ton travail, et ça ira tout seul 🤲',
    'Une lettre de plus, et tu liras encore mieux l\'arabe ! 🔤',
  ];
}

export interface Question { question: string; options: string[]; bonne: string; source?: string }

/**
 * ❓ Les 60 questions du coin du feu (Nadia, 2026-11-26) : une par jour, à tour de rôle (60 jours avant de revoir la même).
 * Uniquement la religion, d'après le Coran et les hadiths authentiques (Al-Boukhârî, Mouslim), école sunnite malikite.
 */
export const QUESTIONS_FEU: Question[] = [
  { question: 'Combien de prières obligatoires fait-on chaque jour ?', options: ['3', '5', '7'], bonne: '5', source: 'Al-Boukhârî 349 et Mouslim 162' },
  { question: 'Quelle est la première sourate du Coran ?', options: ['Al-Fâtiha', 'An-Nâs', 'Al-Ikhlâs'], bonne: 'Al-Fâtiha' },
  { question: 'Quelle est la dernière sourate du Coran ?', options: ['Al-Falaq', 'An-Nâs', 'Al-Kawthar'], bonne: 'An-Nâs' },
  { question: 'Combien de sourates compte le Coran ?', options: ['99', '114', '120'], bonne: '114' },
  { question: 'Quelle sourate récite-t-on dans chaque rak\'a de la prière ?', options: ['Al-Fâtiha', 'Al-Kahf', 'Yâ-Sîn'], bonne: 'Al-Fâtiha', source: 'Al-Boukhârî 756 et Mouslim 394' },
  { question: 'Que dit-on avant de manger ?', options: ['Bismillah', 'Allahou Akbar', 'Amîn'], bonne: 'Bismillah', source: 'Al-Boukhârî 5376 et Mouslim 2022' },
  { question: 'Avec quelle main mange-t-on ?', options: ['La main droite', 'La main gauche', 'Les deux mains'], bonne: 'La main droite', source: 'Al-Boukhârî 5376 et Mouslim 2022' },
  { question: 'Que dit-on quand on éternue ?', options: ['Al-hamdoulillah', 'Astaghfiroullah', 'Amîn'], bonne: 'Al-hamdoulillah', source: 'Al-Boukhârî 6224' },
  { question: 'Que dit-on à celui qui éternue et dit « Al-hamdoulillah » ?', options: ['Yarhamouka Allah', 'Bismillah', 'Allahou Akbar'], bonne: 'Yarhamouka Allah', source: 'Al-Boukhârî 6224' },
  { question: 'Que répond-on à « Assalamou alaykoum » ?', options: ['Wa alaykoum assalam', 'Bismillah', 'In shâ\' Allah'], bonne: 'Wa alaykoum assalam', source: 'Sourate An-Nisâ\', verset 86' },
  { question: 'Combien y a-t-il de piliers de l\'islam ?', options: ['3', '5', '6'], bonne: '5', source: 'Al-Boukhârî 8 et Mouslim 16' },
  { question: 'Quel est le premier pilier de l\'islam ?', options: ['La chahâda', 'Le jeûne', 'Le pèlerinage'], bonne: 'La chahâda', source: 'Al-Boukhârî 8 et Mouslim 16' },
  { question: 'Combien y a-t-il de piliers de la foi (al-îmân) ?', options: ['4', '5', '6'], bonne: '6', source: 'Mouslim 8 (le hadith de Jibrîl)' },
  { question: 'Quel mois jeûne-t-on ?', options: ['Ramadan', 'Chawwâl', 'Rajab'], bonne: 'Ramadan', source: 'Sourate Al-Baqara, verset 185' },
  { question: 'Pendant le Ramadan, on jeûne de quand à quand ?', options: ['De l\'aube au coucher du soleil', 'De midi à minuit', 'Du matin à midi'], bonne: 'De l\'aube au coucher du soleil', source: 'Sourate Al-Baqara, verset 187' },
  { question: 'Comment s\'appelle le repas qu\'on prend avant l\'aube pendant le Ramadan ?', options: ['Le souhoûr', 'L\'iftâr', 'Le dîner'], bonne: 'Le souhoûr', source: 'Al-Boukhârî 1923 et Mouslim 1095' },
  { question: 'Combien de jours dure le mois de Ramadan ?', options: ['29 ou 30 jours', '20 jours', '40 jours'], bonne: '29 ou 30 jours', source: 'Al-Boukhârî 1907 et Mouslim 1080' },
  { question: 'Quelle nuit est meilleure que mille mois ?', options: ['Laylat al-Qadr', 'La nuit de l\'Aïd', 'La nuit du vendredi'], bonne: 'Laylat al-Qadr', source: 'Sourate Al-Qadr, verset 3' },
  { question: 'Quelle fête célèbre-t-on à la fin du Ramadan ?', options: ['L\'Aïd al-Fitr', 'L\'Aïd al-Adha', 'Le Mawlid'], bonne: 'L\'Aïd al-Fitr' },
  { question: 'Quelle fête célèbre-t-on au moment du pèlerinage ?', options: ['L\'Aïd al-Adha', 'L\'Aïd al-Fitr', 'Achoura'], bonne: 'L\'Aïd al-Adha' },
  { question: 'Comment s\'appelle le grand pèlerinage à La Mecque ?', options: ['Le Hajj', 'La Zakât', 'La Joumou\'a'], bonne: 'Le Hajj' },
  { question: 'Combien de fois tourne-t-on autour de la Kaaba pendant le tawâf ?', options: ['3 fois', '7 fois', '10 fois'], bonne: '7 fois' },
  { question: 'Comment s\'appelle l\'aumône obligatoire ?', options: ['La zakât', 'La sadaqa', 'Le hajj'], bonne: 'La zakât' },
  { question: 'Dans quelle ville se trouve la Kaaba ?', options: ['La Mecque', 'Médine', 'Jérusalem'], bonne: 'La Mecque' },
  { question: 'Vers où se tourne-t-on pour prier ?', options: ['Vers la Kaaba', 'Vers le soleil', 'Vers le nord'], bonne: 'Vers la Kaaba', source: 'Sourate Al-Baqara, verset 144' },
  { question: 'Que fait-on avant la prière pour se purifier ?', options: ['Les ablutions (woudoû\')', 'Une sieste', 'Un repas'], bonne: 'Les ablutions (woudoû\')', source: 'Sourate Al-Mâ\'ida, verset 6' },
  { question: 'Combien de rak\'ât compte la prière du Sobh ?', options: ['2', '3', '4'], bonne: '2' },
  { question: 'Combien de rak\'ât compte la prière du Maghreb ?', options: ['2', '3', '4'], bonne: '3' },
  { question: 'Combien de rak\'ât compte la prière du Dhohr ?', options: ['2', '3', '4'], bonne: '4' },
  { question: 'Quelle prière fait-on au coucher du soleil ?', options: ['Le Maghreb', 'Le Dhohr', 'L\'Asr'], bonne: 'Le Maghreb' },
  { question: 'Comment s\'appelle la grande prière en groupe du vendredi ?', options: ['La Joumou\'a', 'Le Witr', 'Le Tarâwîh'], bonne: 'La Joumou\'a', source: 'Sourate Al-Joumou\'a, verset 9' },
  { question: 'Qui était le premier muezzin de l\'islam ?', options: ['Bilâl', 'Abou Bakr', '\'Omar'], bonne: 'Bilâl', source: 'Al-Boukhârî 604 et Mouslim 377' },
  { question: 'Quel ange a apporté le Coran au Prophète ﷺ ?', options: ['Jibrîl', 'Mîkâ\'îl', 'Isrâfîl'], bonne: 'Jibrîl', source: 'Sourate Al-Baqara, verset 97' },
  { question: 'Dans quelle grotte le Prophète ﷺ a-t-il reçu la première révélation ?', options: ['La grotte de Hirâ\'', 'La grotte de Thawr', 'La grotte des gens de la caverne'], bonne: 'La grotte de Hirâ\'', source: 'Al-Boukhârî 3 et Mouslim 160' },
  { question: 'Quel est le premier mot révélé du Coran ?', options: ['Iqra\' (Lis)', 'Qoul (Dis)', 'Bismillah'], bonne: 'Iqra\' (Lis)', source: 'Al-Boukhârî 3 et Mouslim 160' },
  { question: 'Dans quelle ville est né le Prophète ﷺ ?', options: ['La Mecque', 'Médine', 'Damas'], bonne: 'La Mecque' },
  { question: 'Comment s\'appelait la maman du Prophète ﷺ ?', options: ['Âmina', 'Khadîja', 'Fâtima'], bonne: 'Âmina' },
  { question: 'Comment s\'appelle le voyage du Prophète ﷺ de La Mecque à Médine ?', options: ['L\'Hégire (al-hijra)', 'Le Hajj', 'L\'Isrâ\''], bonne: 'L\'Hégire (al-hijra)' },
  { question: 'Quel compagnon accompagnait le Prophète ﷺ dans la grotte pendant l\'Hégire ?', options: ['Abou Bakr', '\'Ali', 'Bilâl'], bonne: 'Abou Bakr', source: 'Sourate At-Tawba, verset 40 ; Al-Boukhârî 3653' },
  { question: 'Qui est le premier homme créé par Allah ?', options: ['Âdam', 'Nouh', 'Ibrâhîm'], bonne: 'Âdam', source: 'Sourate Al-Baqara, versets 30 à 37' },
  { question: 'Quel prophète a construit l\'arche ?', options: ['Nouh', 'Moussa', 'Younous'], bonne: 'Nouh', source: 'Sourate Hoûd, verset 37' },
  { question: 'Quel prophète a été avalé par un grand poisson ?', options: ['Younous', 'Yousouf', 'Ayyoub'], bonne: 'Younous', source: 'Sourate As-Sâffât, versets 139 à 144' },
  { question: 'Quel prophète a construit la Kaaba avec son fils Ismâ\'îl ?', options: ['Ibrâhîm', 'Moussa', 'Dâwoud'], bonne: 'Ibrâhîm', source: 'Sourate Al-Baqara, verset 127' },
  { question: 'À quel prophète la Torah a-t-elle été donnée ?', options: ['Moussa', '\'Îsâ', 'Soulaymân'], bonne: 'Moussa', source: 'Sourate Al-Mâ\'ida, verset 44' },
  { question: 'À quel prophète les Psaumes (Az-Zabour) ont-ils été donnés ?', options: ['Dâwoud', 'Ibrâhîm', 'Nouh'], bonne: 'Dâwoud', source: 'Sourate An-Nisâ\', verset 163' },
  { question: 'Quel prophète a entendu une fourmi parler ?', options: ['Soulaymân', 'Younous', 'Hoûd'], bonne: 'Soulaymân', source: 'Sourate An-Naml, versets 18 et 19' },
  { question: 'Quel prophète a été jeté dans un puits par ses frères ?', options: ['Yousouf', 'Ya\'qoub', 'Ismâ\'îl'], bonne: 'Yousouf', source: 'Sourate Yousouf, versets 10 à 15' },
  { question: 'Comment s\'appelle la maman du prophète \'Îsâ ?', options: ['Maryam', 'Âsiya', 'Hâjar'], bonne: 'Maryam', source: 'Sourate Maryam' },
  { question: 'Dans quelle sourate trouve-t-on l\'histoire des gens de la caverne ?', options: ['Al-Kahf', 'Al-Fîl', 'Yâ-Sîn'], bonne: 'Al-Kahf', source: 'Sourate Al-Kahf, versets 9 à 26' },
  { question: 'Quelle sourate vaut le tiers du Coran ?', options: ['Al-Ikhlâs', 'Al-Falaq', 'Al-Fâtiha'], bonne: 'Al-Ikhlâs', source: 'Al-Boukhârî 5013 et Mouslim 811' },
  { question: 'Quel est le plus grand verset du Coran ?', options: ['Âyat al-Koursî', 'Le dernier verset d\'An-Nâs', 'Bismillah'], bonne: 'Âyat al-Koursî', source: 'Mouslim 810' },
  { question: 'Quelle sourate commence par « Qoul houwa Allâhou ahad » ?', options: ['Al-Ikhlâs', 'Al-Falaq', 'Al-Kâfiroûn'], bonne: 'Al-Ikhlâs' },
  { question: 'Combien de noms d\'Allah cite le hadith « Allah a … noms » ?', options: ['50', '99', '114'], bonne: '99', source: 'Al-Boukhârî 2736 et Mouslim 2677' },
  { question: 'Que dit-on quand on prévoit de faire quelque chose plus tard ?', options: ['In shâ\' Allah', 'Al-hamdoulillah', 'Amîn'], bonne: 'In shâ\' Allah', source: 'Sourate Al-Kahf, versets 23 et 24' },
  { question: 'Le Prophète ﷺ a dit : « Les actes ne valent que par… »', options: ['les intentions', 'la fatigue', 'l\'argent'], bonne: 'les intentions', source: 'Al-Boukhârî 1 et Mouslim 1907' },
  { question: 'Le Prophète ﷺ a dit : « Le meilleur d\'entre vous est celui qui apprend le Coran et… »', options: ['l\'enseigne', 'le range', 'le vend'], bonne: 'l\'enseigne', source: 'Al-Boukhârî 5027' },
  { question: 'Le Prophète ﷺ a dit : « Une bonne parole est… »', options: ['une aumône', 'un jeu', 'inutile'], bonne: 'une aumône', source: 'Al-Boukhârî 2989 et Mouslim 1009' },
  { question: 'Le Prophète ﷺ a dit : « Que celui qui croit en Allah et au Jour dernier dise du bien ou… »', options: ['qu\'il se taise', 'qu\'il crie', 'qu\'il parte'], bonne: 'qu\'il se taise', source: 'Al-Boukhârî 6018 et Mouslim 47' },
  { question: 'Selon le Prophète ﷺ, qui est vraiment fort ?', options: ['Celui qui se maîtrise quand il est en colère', 'Celui qui gagne à la bagarre', 'Celui qui crie le plus fort'], bonne: 'Celui qui se maîtrise quand il est en colère', source: 'Al-Boukhârî 6114 et Mouslim 2609' },
  { question: 'Le Prophète ﷺ a dit : « Aucun de vous n\'est vraiment croyant tant qu\'il n\'aime pas pour son frère… »', options: ['ce qu\'il aime pour lui-même', 'rien du tout', 'seulement les jouets'], bonne: 'ce qu\'il aime pour lui-même', source: 'Al-Boukhârî 13 et Mouslim 45' },
];

/** Petit hasard stable : des réponses mélangées toujours de la même façon pour un jour donné */
function graine(t: string) { let h = 7; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); }
function melanger<T>(l: T[], g: number): T[] { const a = [...l]; let s = g || 1; for (let i = a.length - 1; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** Numéro du jour (AAAA-MM-JJ) depuis le 1er janvier 1970, en heure locale du calendrier */
const numeroJour = (jour: string) => { const [a, m, j] = jour.split('-').map(Number); return Math.floor(Date.UTC(a, m - 1, j) / 86_400_000); };

/** ❓ Question du jour : la même toute la journée, la suivante le lendemain (roulement de 60) */
export function questionDuJour(jour: string): Question {
  const q = QUESTIONS_FEU[((numeroJour(jour) % QUESTIONS_FEU.length) + QUESTIONS_FEU.length) % QUESTIONS_FEU.length];
  return { ...q, options: melanger(q.options, graine(jour)) };
}

// ——— 🔥 La flamme de la cheminée (Nadia, 2026-11-11 : idées 1, 2, 4, 5 gardées) ———
export const FEU_MAX = 6;
const jourDe = (d: Date) => d.toLocaleDateString('en-CA');

/** Début de la semaine du feu : le dernier mercredi 18 h (le feu y est au maximum) */
export function debutCycleFeu(maintenant: Date): Date {
  const d = new Date(maintenant);
  d.setHours(18, 0, 0, 0);
  while (d.getDay() !== 3 || d > maintenant) d.setDate(d.getDate() - 1);
  return d;
}

/**
 * Règle de Nadia : mercredi à partir de 18 h, flamme au maximum (6). Chaque jour SANS connexion depuis, un cran de moins ;
 * au 7ᵉ jour sans connexion, il ne reste que des braises (0). La connexion du jour la ravive d'un cran.
 * `visites` = jours (AAAA-MM-JJ) où l'élève est venu, sans compter aujourd'hui.
 */
export function niveauFeu(maintenant: Date, visites: string[]): { avant: number; apres: number } {
  const debut = debutCycleFeu(maintenant);
  const aujourdhui = jourDe(maintenant);
  const vus = new Set(visites);
  let absents = 0;
  const d = new Date(debut);
  d.setDate(d.getDate() + 1);
  d.setHours(12, 0, 0, 0);
  while (jourDe(d) < aujourdhui) { if (!vus.has(jourDe(d))) absents += 1; d.setDate(d.getDate() + 1); }
  const avant = Math.max(0, FEU_MAX - absents);
  // Mercredi soir (le cycle commence aujourd'hui) : maximum
  if (jourDe(debut) === aujourdhui) return { avant: FEU_MAX, apres: FEU_MAX };
  return { avant, apres: Math.min(FEU_MAX, avant + 1) };
}

/** Taille de la flamme : 0 = braises (flammes cachées), puis de plus en plus grande ; tous les devoirs faits = grand feu */
export const echelleFeu = (niveau: number, grandFeu: boolean) => (grandFeu && niveau > 0 ? 1.3 : niveau <= 0 ? 0 : 0.3 + (niveau / FEU_MAX) * 0.7);

// ——— 🙈 Cache-cache (Nadia, 2026-11-11 : les 5 idées gardées) ———
/** La carte derrière laquelle l'animal se cache aujourd'hui (la même toute la journée, différente d'un élève à l'autre) */

export interface MotArabe { arabe: string; translit: string; sens: string; image: string }
export const MOTS_ARABES: MotArabe[] = [
  { arabe: 'كِتَاب', translit: 'kitâb', sens: 'livre', image: '📖' },
  { arabe: 'قَلَم', translit: 'qalam', sens: 'stylo', image: '✏️' },
  { arabe: 'شَمْس', translit: 'chams', sens: 'soleil', image: '☀️' },
  { arabe: 'قَمَر', translit: 'qamar', sens: 'lune', image: '🌙' },
  { arabe: 'نَجْمَة', translit: 'najma', sens: 'étoile', image: '⭐' },
  { arabe: 'بَيْت', translit: 'bayt', sens: 'maison', image: '🏠' },
  { arabe: 'مَاء', translit: 'mâ\'', sens: 'eau', image: '💧' },
  { arabe: 'شَجَرَة', translit: 'chajara', sens: 'arbre', image: '🌳' },
  { arabe: 'وَرْدَة', translit: 'warda', sens: 'rose', image: '🌹' },
  { arabe: 'قِطّ', translit: 'qitt', sens: 'chat', image: '🐈' },
  { arabe: 'بَاب', translit: 'bâb', sens: 'porte', image: '🚪' },
  { arabe: 'تُفَّاحَة', translit: 'touffâha', sens: 'pomme', image: '🍎' },
  { arabe: 'حَلِيب', translit: 'halîb', sens: 'lait', image: '🥛' },
  { arabe: 'خُبْز', translit: 'khoubz', sens: 'pain', image: '🍞' },
  { arabe: 'مَسْجِد', translit: 'masjid', sens: 'mosquée', image: '🕌' },
  { arabe: 'ثَلْج', translit: 'thalj', sens: 'neige', image: '❄️' },
  { arabe: 'مَطَر', translit: 'matar', sens: 'pluie', image: '🌧️' },
  { arabe: 'بَحْر', translit: 'bahr', sens: 'mer', image: '🌊' },
  { arabe: 'سَمَكَة', translit: 'samaka', sens: 'poisson', image: '🐟' },
  { arabe: 'عُصْفُور', translit: '\'ousfour', sens: 'oiseau', image: '🐦' },
];

/** 💬 Un mot gentil, ou une parole du Prophète ﷺ adaptée aux enfants (hadiths authentiques, source indiquée) */
export const MOTS_GENTILS: { texte: string; source?: string }[] = [
  { texte: 'Tu m\'as trouvé ! Tu as l\'œil d\'un vrai détective 🔎' },
  { texte: 'Le Prophète ﷺ a dit : « Ton sourire pour ton frère est une aumône. »', source: 'At-Tirmidhî' },
  { texte: 'Le Prophète ﷺ a dit : « Les actes les plus aimés d\'Allah sont ceux qu\'on fait régulièrement, même s\'ils sont petits. »', source: 'Al-Bukhârî et Muslim' },
  { texte: 'Le Prophète ﷺ a dit : « Le meilleur d\'entre vous est celui qui apprend le Coran et l\'enseigne. »', source: 'Al-Bukhârî' },
  { texte: 'Le Prophète ﷺ a dit : « Facilitez et ne compliquez pas, annoncez de bonnes nouvelles et ne faites pas fuir. »', source: 'Al-Bukhârî' },
  { texte: 'Bravo ! Chaque jour où tu viens apprendre, c\'est un pas de plus 💚' },
  { texte: 'Tu es patient et attentif : ce sont de belles qualités, ma shā\' Allah 🌟' },
];

/** 🌙 Mots du Ramadan (Nadia, 2026-11-15, idée 18) */
export const MOTS_RAMADAN: MotArabe[] = [
  { arabe: 'صِيَام', translit: 'siyâm', sens: 'le jeûne', image: '🌙' },
  { arabe: 'سُحُور', translit: 'souhoûr', sens: 'le repas avant l\'aube', image: '🌅' },
  { arabe: 'إِفْطَار', translit: 'iftâr', sens: 'la rupture du jeûne', image: '🍲' },
  { arabe: 'تَرَاوِيح', translit: 'tarâwîh', sens: 'les prières des nuits du Ramadan', image: '🕌' },
  { arabe: 'هِلَال', translit: 'hilâl', sens: 'le croissant de lune', image: '🌙' },
  { arabe: 'فَانُوس', translit: 'fânoûs', sens: 'la lanterne', image: '🏮' },
  { arabe: 'تَمْر', translit: 'tamr', sens: 'les dattes', image: '🌴' },
  { arabe: 'دُعَاء', translit: 'dou\'â\'', sens: 'l\'invocation', image: '🤲' },
  { arabe: 'صَدَقَة', translit: 'sadaqa', sens: 'le don, l\'aumône', image: '💝' },
  { arabe: 'عِيد', translit: '\'îd', sens: 'la fête', image: '🎉' },
  { arabe: 'قُرْآن', translit: 'qour\'ân', sens: 'le Coran', image: '📖' },
  { arabe: 'صَبْر', translit: 'sabr', sens: 'la patience', image: '🌿' },
];
export const motArabeDuJour = (jour: string, ramadan = false) => {
  const liste = ramadan ? MOTS_RAMADAN : MOTS_ARABES;
  return liste[graine(`${jour}|mot`) % liste.length];
};
export const motGentilDuJour = (jour: string) => MOTS_GENTILS[graine(`${jour}|gentil`) % MOTS_GENTILS.length];

/** 🧣 Son habit du jour, selon la saison (gardé toute la journée) */
export const HABIT: Record<Saison, { cle: 'echarpe' | 'bonnet' | 'fleur' | 'lunettes'; nom: string }> = {
  automne: { cle: 'echarpe', nom: 'son écharpe' }, hiver: { cle: 'bonnet', nom: 'son bonnet' },
  printemps: { cle: 'fleur', nom: 'sa fleur' }, ete: { cle: 'lunettes', nom: 'ses lunettes de soleil' },
  ramadan: { cle: 'echarpe', nom: 'son foulard' },
};
