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

export interface Question { question: string; grand?: string; options: string[]; bonne: string }

const BANQUE: Question[] = [
  { question: 'Combien de prières obligatoires fait-on chaque jour ?', options: ['3', '5', '7'], bonne: '5' },
  { question: 'Quelle est la première sourate du Coran ?', options: ['Al-Fâtiha', 'An-Nâs', 'Al-Ikhlâs'], bonne: 'Al-Fâtiha' },
  { question: 'Que dit-on avant de manger ?', options: ['Bismillah', 'Allahou Akbar', 'Amîn'], bonne: 'Bismillah' },
  { question: 'Quelle est la dernière sourate du Coran ?', options: ['Al-Falaq', 'An-Nâs', 'Al-Kawthar'], bonne: 'An-Nâs' },
  { question: 'Quelle prière fait-on au lever du jour ?', options: ['Fajr', 'Maghrib', 'Icha'], bonne: 'Fajr' },
  { question: 'Que dit-on après avoir mangé ?', options: ['Al-hamdoulillah', 'Bismillah', 'Salam'], bonne: 'Al-hamdoulillah' },
  { question: 'Combien de lettres compte l\'alphabet arabe ?', options: ['26', '28', '30'], bonne: '28' },
  { question: 'Quel mois jeûne-t-on ?', options: ['Ramadan', 'Chawwal', 'Rajab'], bonne: 'Ramadan' },
  { question: 'Dans quel sens lit-on l\'arabe ?', options: ['De droite à gauche', 'De gauche à droite', 'De haut en bas'], bonne: 'De droite à gauche' },
  { question: 'Quelle prière fait-on au coucher du soleil ?', options: ['Maghrib', 'Dhohr', 'Asr'], bonne: 'Maghrib' },
  { question: 'Que répond-on à « Assalamou alaykoum » ?', options: ['Wa alaykoum assalam', 'Bismillah', 'In shaa Allah'], bonne: 'Wa alaykoum assalam' },
  { question: 'Combien de sourates compte le Coran ?', options: ['99', '114', '120'], bonne: '114' },
  { question: 'Que dit-on quand on éternue ?', options: ['Al-hamdoulillah', 'Astaghfiroullah', 'Amîn'], bonne: 'Al-hamdoulillah' },
  { question: 'Quelle sourate dit « Qoul houwa Allahou ahad » ?', options: ['Al-Ikhlâs', 'Al-Falaq', 'Al-Kâfiroun'], bonne: 'Al-Ikhlâs' },
];

/** Petit hasard stable : la même question toute la journée, et des réponses mélangées toujours de la même façon */
function graine(t: string) { let h = 7; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); }
function melanger<T>(l: T[], g: number): T[] { const a = [...l]; let s = g || 1; for (let i = a.length - 1; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** ❓ Question du jour : un jour sur deux une de SES lettres apprises (s'il en a au moins 3), sinon une question de la banque */
export function questionDuJour(jour: string, apprises: { letter_arabic: string; name_french: string }[]): Question {
  const g = graine(jour);
  if (apprises.length >= 3 && g % 2 === 0) {
    const l = apprises[g % apprises.length];
    const autres = melanger(apprises.filter((x) => x.name_french !== l.name_french), g).slice(0, 2).map((x) => x.name_french);
    return { question: 'Quelle est cette lettre ?', grand: l.letter_arabic, options: melanger([l.name_french, ...autres], g + 1), bonne: l.name_french };
  }
  const q = BANQUE[g % BANQUE.length];
  return { ...q, options: melanger(q.options, g) };
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
export const cachetteDuJour = (jour: string, userId: string, n: number) => (n > 0 ? graine(`${jour}|${userId}|cache`) % n : -1);

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

export const motArabeDuJour = (jour: string) => MOTS_ARABES[graine(`${jour}|mot`) % MOTS_ARABES.length];
export const motGentilDuJour = (jour: string) => MOTS_GENTILS[graine(`${jour}|gentil`) % MOTS_GENTILS.length];

/** 🧣 Son habit du jour, selon la saison (gardé toute la journée) */
export const HABIT: Record<Saison, { cle: 'echarpe' | 'bonnet' | 'fleur' | 'lunettes'; nom: string }> = {
  automne: { cle: 'echarpe', nom: 'son écharpe' }, hiver: { cle: 'bonnet', nom: 'son bonnet' },
  printemps: { cle: 'fleur', nom: 'sa fleur' }, ete: { cle: 'lunettes', nom: 'ses lunettes de soleil' },
};
