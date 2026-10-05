import { describe, it, expect } from 'vitest';
import { computeUnlocked } from './alphabetProgress';

const ids = Array.from({ length: 28 }, (_, i) => i + 1);

describe('Alphabet par paliers', () => {
  it("nouvel élève : seule la 1ʳᵉ lettre est ouverte", () => {
    const s = computeUnlocked(ids, new Set(), new Set(), false);
    expect([...s.unlocked]).toEqual([1]);
    expect(s.currentId).toBe(1);
  });

  it("exemple de Wiam : 1-4 apprises + 10 débloquée par l'admin → 1 à 5 et 10, pas la 11", () => {
    const s = computeUnlocked(ids, new Set([1, 2, 3, 4, 10]), new Set([10]), false);
    expect([...s.unlocked].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 10]);
    expect(s.unlocked.has(11)).toBe(false);
    expect(s.currentId).toBe(5);
  });

  it("quand Wiam apprend la 9, la 10 (déjà apprise) est passée et la 11 s'ouvre", () => {
    const s = computeUnlocked(ids, new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), new Set([10]), false);
    expect(s.unlocked.has(11)).toBe(true);
    expect(s.unlocked.has(12)).toBe(false);
    expect(s.currentId).toBe(11);
  });

  it("une lettre débloquée mais pas encore apprise n'ouvre pas la suivante", () => {
    const s = computeUnlocked(ids, new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]), new Set([10]), false);
    expect(s.currentId).toBe(10);
    expect(s.unlocked.has(11)).toBe(false);
  });

  it("accès complet : tout est ouvert", () => {
    expect(computeUnlocked(ids, new Set(), new Set(), true).unlocked.size).toBe(28);
  });
});
