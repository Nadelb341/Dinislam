/**
 * Alphabet par paliers (règles de Nadia, 2026-10-05).
 * - Les lettres s'ouvrent dans l'ordre : une lettre s'ouvre quand toutes celles d'avant sont apprises.
 * - L'admin peut débloquer à la main une ou plusieurs lettres pour un élève : elles restent ouvertes,
 *   mais n'ouvrent PAS les suivantes. Seul le suivi de l'élève fait avancer l'ordre.
 *   Ex. Wiam : lettres 1-4 apprises + 10 débloquée (et apprise) → ouvertes : 1 à 5 et 10.
 *   Quand elle apprend la 9, la chaîne passe la 10 (déjà apprise) et ouvre la 11.
 */

export interface AlphabetLetterLite {
  id: number;
  letter_arabic: string;
  name_french: string;
  audio_url: string | null;
  position_isolated: string | null;
  position_initial: string | null;
  position_medial: string | null;
  position_final: string | null;
}

export interface UnlockState {
  /** Lettres que l'élève peut ouvrir */
  unlocked: Set<number>;
  /** Lettre en cours dans l'ordre (la première pas encore apprise), null si tout est appris */
  currentId: number | null;
}

export function computeUnlocked(
  orderedIds: number[],
  learned: Set<number>,
  adminUnlocked: Set<number>,
  everythingOpen: boolean,
): UnlockState {
  if (everythingOpen) {
    return { unlocked: new Set(orderedIds), currentId: orderedIds.find((id) => !learned.has(id)) ?? null };
  }
  const unlocked = new Set<number>(adminUnlocked);
  let currentId: number | null = null;
  for (const id of orderedIds) {
    unlocked.add(id);
    if (!learned.has(id)) { currentId = id; break; }
  }
  return { unlocked, currentId };
}

export type GameKey = 'ecoute' | 'ballons' | 'formes' | 'sosies' | 'defi';

/** Paires de lettres qui se ressemblent à l'oreille (emphatiques et gutturales) */
export const SOSIES_PAIRS: [string, string][] = [
  ['س', 'ص'], ['ت', 'ط'], ['د', 'ض'], ['ذ', 'ظ'], ['ه', 'ح'], ['ك', 'ق'], ['ا', 'ع'], ['ح', 'خ'],
];

export interface GameInfo {
  key: GameKey;
  title: string;
  icon: string;
  /** Classes de la tuile (fond pastel) */
  tile: string;
  description: string;
}

export const GAMES: GameInfo[] = [
  { key: 'ecoute', title: 'Écoute et touche', icon: '🃏', tile: 'bg-sky-100 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800', description: 'Écoute la lettre et touche la bonne parmi 4.' },
  { key: 'ballons', title: 'Les ballons', icon: '🎈', tile: 'bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800', description: 'Éclate le ballon de la lettre que tu entends.' },
  { key: 'formes', title: 'Les formes', icon: '✍️', tile: 'bg-violet-100 dark:bg-violet-950/40 border-violet-300 dark:border-violet-800', description: 'Trouve la lettre écrite au début, au milieu ou à la fin d\'un mot.' },
  { key: 'sosies', title: 'Les sosies', icon: '👯', tile: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800', description: 'Deux lettres qui se ressemblent : laquelle entends-tu ?' },
  { key: 'defi', title: 'Grand défi', icon: '🏆', tile: 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800', description: 'Les 28 lettres et tous les jeux mélangés.' },
];

/** Paires de sosies dont les 2 lettres sont apprises */
export function readyPairs(letters: AlphabetLetterLite[], learned: Set<number>): [AlphabetLetterLite, AlphabetLetterLite][] {
  const byArabic = new Map(letters.map((l) => [l.letter_arabic, l]));
  const out: [AlphabetLetterLite, AlphabetLetterLite][] = [];
  for (const [a, b] of SOSIES_PAIRS) {
    const la = byArabic.get(a); const lb = byArabic.get(b);
    if (la && lb && learned.has(la.id) && learned.has(lb.id)) out.push([la, lb]);
  }
  return out;
}

/** Jeu ouvert ou non, avec ce qu'il manque pour l'ouvrir */
export function gameStatus(key: GameKey, letters: AlphabetLetterLite[], learned: Set<number>, everythingOpen: boolean): { open: boolean; hint: string } {
  const n = learned.size;
  if (everythingOpen) return { open: true, hint: '' };
  const missing = (need: number) => `Apprends encore ${need - n} lettre${need - n > 1 ? 's' : ''}`;
  switch (key) {
    case 'ecoute': return n >= 1 ? { open: true, hint: '' } : { open: false, hint: 'Apprends ta 1ʳᵉ lettre' };
    case 'ballons': return n >= 4 ? { open: true, hint: '' } : { open: false, hint: missing(4) };
    case 'formes': return n >= 8 ? { open: true, hint: '' } : { open: false, hint: missing(8) };
    case 'sosies': return readyPairs(letters, learned).length > 0
      ? { open: true, hint: '' }
      : { open: false, hint: 'Apprends 2 lettres sosies (ex. س et ص)' };
    case 'defi': return n >= letters.length && letters.length > 0 ? { open: true, hint: '' } : { open: false, hint: missing(letters.length) };
  }
}

/** Lettres utilisées par les jeux : celles apprises + 1 ou 2 nouvelles (la lettre en cours et la suivante ouverte) */
export function gamePool(letters: AlphabetLetterLite[], learned: Set<number>, unlocked: Set<number>): AlphabetLetterLite[] {
  const learnedLetters = letters.filter((l) => learned.has(l.id));
  const fresh = letters.filter((l) => unlocked.has(l.id) && !learned.has(l.id)).slice(0, 2);
  return [...learnedLetters, ...fresh];
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** `count` lettres différentes de `exclude`, prises d'abord dans `preferred`, complétées avec toutes les lettres */
export function pickDistractors(count: number, exclude: number[], preferred: AlphabetLetterLite[], all: AlphabetLetterLite[]): AlphabetLetterLite[] {
  const out: AlphabetLetterLite[] = [];
  const taken = new Set(exclude);
  for (const source of [shuffle(preferred), shuffle(all)]) {
    for (const l of source) {
      if (out.length >= count) return out;
      if (!taken.has(l.id)) { out.push(l); taken.add(l.id); }
    }
  }
  return out;
}
