import { describe, it, expect } from 'vitest';
import { aVingtAnsOuPlus, dernierStatutFinal, etatLettre, raisonLettre } from '@/lib/alphabetProgress';

// 🔤 Alphabet lettre par lettre (2026-11-11)
describe('couleurs des lettres', () => {
  const learned = new Set([1, 2]);
  const unlocked = new Set([1, 2, 3, 10]);
  it('apprise, ouverte, fermée', () => {
    const st = new Map<number, string>();
    expect(etatLettre(1, learned, unlocked, st)).toBe('apprise');
    expect(etatLettre(3, learned, unlocked, st)).toBe('ouverte');
    expect(etatLettre(10, learned, unlocked, st)).toBe('ouverte');
    expect(etatLettre(4, learned, unlocked, st)).toBe('fermee');
  });
  it('« à revoir » = rouge clair, renvoyée = jaune ⏳, puis verte', () => {
    // envois du plus récent au plus ancien
    const aRevoir = dernierStatutFinal([{ kind: 'final', letter_id: 3, status: 'to_review' }, { kind: 'exercise', letter_id: 3, status: 'pending' }]);
    expect(etatLettre(3, learned, unlocked, aRevoir)).toBe('a_revoir');
    const renvoyee = dernierStatutFinal([{ kind: 'final', letter_id: 3, status: 'pending' }, { kind: 'final', letter_id: 3, status: 'to_review' }]);
    expect(etatLettre(3, learned, unlocked, renvoyee)).toBe('attente');
    expect(etatLettre(3, new Set([1, 2, 3]), unlocked, renvoyee)).toBe('apprise');
  });
  it('raison de l\'ouverture', () => {
    const ordre = [1, 2, 3, 4, 5];
    expect(raisonLettre(3, ordre, learned, new Set(), new Set(), false)).toBe('suivi');
    expect(raisonLettre(5, ordre, learned, new Set([5]), new Set([5]), false)).toBe('lui');
    expect(raisonLettre(5, ordre, learned, new Set(), new Set([5]), false)).toBe('groupe');
    expect(raisonLettre(5, ordre, learned, new Set(), new Set(), false)).toBeNull();
    expect(raisonLettre(5, ordre, learned, new Set(), new Set(), true)).toBe('adulte');
  });
  it('20 ans et plus', () => {
    const now = new Date('2026-11-11T12:00:00');
    expect(aVingtAnsOuPlus('1983-02-13', null, now)).toBe(true);
    expect(aVingtAnsOuPlus('2018-04-25', null, now)).toBe(false);
    expect(aVingtAnsOuPlus('2006-11-12', null, now)).toBe(false);
    expect(aVingtAnsOuPlus('2006-11-11', null, now)).toBe(true);
    expect(aVingtAnsOuPlus(null, 25, now)).toBe(true);
    expect(aVingtAnsOuPlus(null, null, now)).toBe(false);
  });
});
