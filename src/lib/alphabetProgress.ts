/**
 * Alphabet par paliers.
 * Règles de Nadia du 2026-11-11 (remplacent celles du 2026-10-05) :
 * - AUCUNE lettre n'est ouverte au départ, pas même Alif : l'élève attend que l'enseignante la débloque
 *   (pour lui ou pour son groupe). Exception gardée : 20 ans et plus et admin = tout ouvert (`everythingOpen`).
 * - Une lettre débloquée s'ouvre seule (elle n'ouvre pas la suivante tout de suite, question A = A).
 * - Dès qu'une lettre est VALIDÉE, la suivante s'ouvre toute seule (« à apprendre »), dans l'ordre de l'alphabet.
 *   Ex. Wiam : 1-4 apprises + 10 débloquée (et apprise) → ouvertes : 1 à 5, 10 et 11.
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
  /** Lettre à apprendre en premier (la 1ʳᵉ ouverte et pas encore apprise, dans l'ordre), null s'il n'y en a pas */
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
  const unlocked = new Set<number>();
  orderedIds.forEach((id, i) => {
    if (learned.has(id) || adminUnlocked.has(id) || (i > 0 && learned.has(orderedIds[i - 1]))) unlocked.add(id);
  });
  return { unlocked, currentId: orderedIds.find((id) => unlocked.has(id) && !learned.has(id)) ?? null };
}

export type GameKey = 'ecoute' | 'ballons' | 'formes' | 'sosies' | 'defi' | 'syllabes' | 'defi_jour' | 'lettre';
/** Jeux de lecture (consigne écrite → bonne écriture), gérés par ReadingGameDialog */
export const READING_GAMES: GameKey[] = ['syllabes', 'defi_jour', 'lettre'];

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
  { key: 'syllabes', title: 'Les syllabes', icon: '🔤', tile: 'bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800', description: 'Lis les voyelles, tanouines, soukoune et chadda de tes lettres.' },
  { key: 'defi_jour', title: 'Défi du jour', icon: '⚡', tile: 'bg-indigo-100 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800', description: 'Une minute chrono, chaque jour.' },
  { key: 'lettre', title: 'Jeu de la lettre', icon: '🎮', tile: 'bg-slate-100 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700', description: 'Dans la fiche de chaque lettre.' },
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
    case 'syllabes':
    case 'defi_jour':
    case 'lettre': return n >= 1 ? { open: true, hint: '' } : { open: false, hint: 'Fais valider ta 1ʳᵉ lettre' };
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

// ——— 🔤 Alphabet lettre par lettre (Nadia, 2026-11-11 : maquette B, idées 2-7, 9, 10) ———

/**
 * État d'une lettre pour un élève, avec ses couleurs (mêmes codes côté élève et côté enseignante) :
 * 🟢 apprise (validée) · 🟡 ouverte · 🟡⏳ envoyée, attend la validation · 🔴 rouge clair « à revoir » · ⚪🔒 fermée.
 * « À revoir » : la dernière demande de validation de la lettre a reçu « 🔁 À revoir » (to_review / redo / corrected).
 * Dès que l'élève la renvoie (nouvelle demande « pending »), elle redevient jaune ⏳, puis verte une fois validée.
 */
export type EtatLettre = 'apprise' | 'attente' | 'a_revoir' | 'ouverte' | 'fermee';

/** Dernier statut de la demande « lettre apprise » (kind final) de chaque lettre, à partir d'envois triés du plus récent au plus ancien */
export function dernierStatutFinal(envois: { kind: string; letter_id: number; status: string }[]): Map<number, string> {
  const m = new Map<number, string>();
  for (const s of envois) if (s.kind === 'final' && !m.has(s.letter_id)) m.set(s.letter_id, s.status);
  return m;
}

export function etatLettre(id: number, learned: Set<number>, unlocked: Set<number>, statutFinal: Map<number, string>): EtatLettre {
  if (learned.has(id)) return 'apprise';
  const st = statutFinal.get(id);
  if (st === 'pending') return 'attente';
  if (st === 'to_review' || st === 'redo' || st === 'corrected') return 'a_revoir';
  return unlocked.has(id) ? 'ouverte' : 'fermee';
}

/** Classes Tailwind des couleurs (case de la grille élève, carré de l'enseignante, légende) */
export const COULEUR_LETTRE: Record<EtatLettre, { carte: string; carre: string; label: string; emoji: string }> = {
  apprise: { carte: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700', carre: 'bg-emerald-200 dark:bg-emerald-800', label: 'Apprise', emoji: '✅' },
  attente: { carte: 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700', carre: 'bg-yellow-200 dark:bg-yellow-700', label: 'Attend la validation', emoji: '⏳' },
  a_revoir: { carte: 'bg-red-100 dark:bg-red-950/40 border-red-300 dark:border-red-800', carre: 'bg-red-200 dark:bg-red-900', label: 'À revoir', emoji: '🔁' },
  ouverte: { carte: 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700', carre: 'bg-yellow-200 dark:bg-yellow-700', label: 'Ouverte', emoji: '🟡' },
  fermee: { carte: 'bg-muted/40 border-transparent opacity-60', carre: 'bg-muted', label: 'Pas encore ouverte', emoji: '🔒' },
};

/**
 * Pourquoi une lettre est ouverte pour un élève (fenêtre de l'enseignante) :
 * 'adulte' (20 ans et plus : tout ouvert, choix de Nadia du 11/11 de le garder), 'suivi' (c'est sa prochaine lettre
 * dans l'ordre), 'groupe' (ouverte à un de ses groupes), 'lui' (ouverte pour lui), null = fermée.
 */
export type RaisonLettre = 'adulte' | 'suivi' | 'groupe' | 'lui' | null;
export function raisonLettre(id: number, ordre: number[], learned: Set<number>, perso: Set<number>, parGroupe: Set<number>, adulte: boolean): RaisonLettre {
  if (adulte) return 'adulte';
  if (perso.has(id)) return 'lui';
  if (parGroupe.has(id)) return 'groupe';
  return computeUnlocked(ordre, learned, new Set(), false).unlocked.has(id) ? 'suivi' : null;
}

/** 20 ans et plus à la date du jour (même règle que useIsOver20 : date de naissance, sinon âge saisi) */
export function aVingtAnsOuPlus(dateNaissance: string | null | undefined, age?: number | null, maintenant = new Date()): boolean {
  if (dateNaissance) {
    const d = new Date(dateNaissance);
    let a = maintenant.getFullYear() - d.getFullYear();
    const m = maintenant.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && maintenant.getDate() < d.getDate())) a--;
    return a >= 20;
  }
  return typeof age === 'number' && age >= 20;
}
