import { describe, it, expect } from 'vitest';
import { computeUnlocked } from './alphabetProgress';

const ids = Array.from({ length: 28 }, (_, i) => i + 1);

// Règles de Nadia du 2026-11-11 : Alif fermée au départ, la validation d'une lettre ouvre la suivante
describe('Alphabet par paliers', () => {
  it('nouvel élève : AUCUNE lettre ouverte, pas même Alif', () => {
    const s = computeUnlocked(ids, new Set(), new Set(), false);
    expect(s.unlocked.size).toBe(0);
    expect(s.currentId).toBeNull();
  });

  it('Alif débloquée par le professeur : seule Alif s\'ouvre (pas Ba)', () => {
    const s = computeUnlocked(ids, new Set(), new Set([1]), false);
    expect([...s.unlocked]).toEqual([1]);
    expect(s.currentId).toBe(1);
  });

  it('Alif validée : Ba passe toute seule à « à apprendre »', () => {
    const s = computeUnlocked(ids, new Set([1]), new Set([1]), false);
    expect([...s.unlocked].sort((a, b) => a - b)).toEqual([1, 2]);
    expect(s.currentId).toBe(2);
  });

  it('exemple de Wiam : 1-4 apprises + 10 débloquée et apprise → 1 à 5, 10 et 11', () => {
    const s = computeUnlocked(ids, new Set([1, 2, 3, 4, 10]), new Set([10]), false);
    expect([...s.unlocked].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 10, 11]);
    expect(s.currentId).toBe(5);
  });

  it('une lettre débloquée mais pas encore apprise n\'ouvre pas la suivante', () => {
    const s = computeUnlocked(ids, new Set([1, 2, 3]), new Set([10]), false);
    expect(s.unlocked.has(10)).toBe(true);
    expect(s.unlocked.has(11)).toBe(false);
    expect(s.currentId).toBe(4);
  });

  it('accès complet (20 ans et plus) : tout est ouvert', () => {
    expect(computeUnlocked(ids, new Set(), new Set(), true).unlocked.size).toBe(28);
  });
});
