import { describe, expect, it } from 'vitest';
import { cleJour, duJour, jourRamadan, luneDuJour, momentPriere } from './petits';

const h = (hh: number) => new Date(2026, 10, 22, hh, 0);
const horaires = { fajrDate: h(6), dhuhrDate: h(13), asrDate: h(15), maghribDate: h(17), ishaDate: h(19) };

describe('accueil des petits', () => {
  it('moment de la prière', () => {
    expect(momentPriere(h(4), horaires)).toBe(4);
    expect(momentPriere(h(7), horaires)).toBe(0);
    expect(momentPriere(h(14), horaires)).toBe(1);
    expect(momentPriere(h(16), horaires)).toBe(2);
    expect(momentPriere(h(18), horaires)).toBe(3);
    expect(momentPriere(h(22), horaires)).toBe(4);
  });
  it('jour du Ramadan', () => {
    expect(jourRamadan('2027-02-08', new Date(2027, 1, 8, 10))).toBe(1);
    expect(jourRamadan('2027-02-08', new Date(2027, 2, 9, 23))).toBe(30);
    expect(jourRamadan('2027-02-08', new Date(2027, 1, 1))).toBeLessThan(1);
    expect(luneDuJour(15)).toBe('🌕');
  });
  it('phrase du jour : change chaque jour et tourne', () => {
    const l = ['a', 'b', 'c'];
    expect(duJour(l, new Date(2026, 0, 1))).toBe('b');
    expect(duJour(l, new Date(2026, 0, 2))).toBe('c');
    expect(duJour([], new Date())).toBeNull();
    expect(cleJour(new Date(2026, 10, 2))).toBe('2026-11-02');
  });
});
