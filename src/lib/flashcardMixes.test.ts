import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MIX_COUNT, mixCards, nextMixOnOpen } from './flashcardMixes';

const cards = Array.from({ length: 12 }, (_, i) => ({ id: `c${i}` }));

describe('flashcardMixes', () => {
  beforeEach(() => {
    const m = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, String(v)); } });
  });

  it('un mélange est toujours le même et garde toutes les cartes', () => {
    const a = mixCards(cards, 3).map((c) => c.id);
    expect(mixCards([...cards].reverse(), 3).map((c) => c.id)).toEqual(a);
    expect([...a].sort()).toEqual(cards.map((c) => c.id).sort());
  });

  it('les 10 mélanges sont différents', () => {
    const all = new Set(Array.from({ length: MIX_COUNT }, (_, m) => mixCards(cards, m).map((c) => c.id).join()));
    expect(all.size).toBe(MIX_COUNT);
  });

  it('chaque ouverture passe au mélange suivant, puis recommence', () => {
    const seen = Array.from({ length: MIX_COUNT + 1 }, () => nextMixOnOpen('k'));
    expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  });
});
