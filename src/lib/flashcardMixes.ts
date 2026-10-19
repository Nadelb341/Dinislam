/**
 * Flashcards : 10 mélanges déjà prêts (demande de Nadia, 2026-10-19).
 * Plus de flèches pour ranger les cartes : l'appli les mélange toute seule.
 * Chaque mélange est toujours le même pour une même série de cartes ; à chaque ouverture, l'élève passe au suivant.
 */
export const MIX_COUNT = 10;

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Petit tirage au sort reproductible : même graine → mêmes nombres */
function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Identifiant d'une série de cartes (ne dépend pas de l'ordre reçu) */
export function deckKey(ids: string[]): string {
  return hash([...ids].sort().join('|')).toString(36);
}

/** Mélange n° `mix` (0 à 9) d'une série de cartes */
export function mixCards<T extends { id: string }>(cards: T[], mix: number): T[] {
  const sorted = [...cards].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const rnd = seededRandom(hash(deckKey(cards.map((c) => c.id)) + ':' + (((mix % MIX_COUNT) + MIX_COUNT) % MIX_COUNT)));
  for (let i = sorted.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  }
  return sorted;
}

/** Mélange à utiliser à cette ouverture (le suivant de la dernière fois, sur cet appareil) */
export function nextMixOnOpen(key: string): number {
  try {
    const raw = localStorage.getItem(`flashmix_${key}`);
    const last = raw === null ? NaN : Number(raw);
    const next = Number.isInteger(last) ? (last + 1) % MIX_COUNT : 0;
    localStorage.setItem(`flashmix_${key}`, String(next));
    return next;
  } catch {
    return Math.floor(Math.random() * MIX_COUNT);
  }
}

export function rememberMix(key: string, mix: number) {
  try { localStorage.setItem(`flashmix_${key}`, String(mix)); } catch { /* stockage indisponible */ }
}
