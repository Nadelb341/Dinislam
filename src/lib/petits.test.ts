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

import { aAccueilPetits, carteOuvertePetit, libelleAccesPetit } from './petits';

describe('accès des tout-petits', () => {
  const g0 = 'g0', g3 = 'g3';
  it('accueil : moins de 6 ans et/ou groupes choisis', () => {
    expect(aAccueilPetits({ moins6: false, groupes: [g0] }, { age: 9, groupes: [g0] })).toBe(true);
    expect(aAccueilPetits({ moins6: false, groupes: [g0] }, { age: 4, groupes: [g3] })).toBe(false);
    expect(aAccueilPetits({ moins6: true, groupes: [] }, { age: 4, groupes: [] })).toBe(true);
    expect(aAccueilPetits({ moins6: true, groupes: [] }, { age: null, groupes: [] })).toBe(false);
    expect(aAccueilPetits({ moins6: true, groupes: [] }, { age: 6, groupes: [] })).toBe(false);
  });
  it('carte fermée au départ, puis ouverte à tous ou à certains', () => {
    const e = { age: 5, groupes: [g0] };
    expect(carteOuvertePetit({}, 'douas', e)).toBe(false);
    expect(carteOuvertePetit({ douas: { mode: 'tous' } }, 'douas', e)).toBe(true);
    expect(carteOuvertePetit({ douas: { mode: 'certains', groupes: [g3] } }, 'douas', e)).toBe(false);
    expect(carteOuvertePetit({ douas: { mode: 'certains', moins6: true } }, 'douas', e)).toBe(true);
    expect(carteOuvertePetit({ douas: { mode: 'certains', groupes: [g0] } }, 'douas', { age: 8, groupes: [g0] })).toBe(true);
  });
  it('libellés', () => {
    expect(libelleAccesPetit(undefined)).toBe('🔒 Fermée');
    expect(libelleAccesPetit({ mode: 'tous' })).toBe('🌍 Tous les tout-petits');
    expect(libelleAccesPetit({ mode: 'certains', moins6: true, groupes: [g0] }, { g0: 'Groupe 0' })).toBe('🎯 moins de 6 ans, Groupe 0');
    expect(libelleAccesPetit({ mode: 'certains' })).toBe('🔒 Fermée');
  });
});

import { meilleureVoix } from './petits';
describe('voix la plus douce', () => {
  it('préfère une voix améliorée de la bonne langue', () => {
    const v = [
      { lang: 'ar-SA', name: 'Maged', localService: true },
      { lang: 'ar-SA', name: 'Laila (Enhanced)', localService: true },
      { lang: 'fr-FR', name: 'Thomas', localService: true },
    ];
    expect(meilleureVoix(v, 'ar')?.name).toBe('Laila (Enhanced)');
    expect(meilleureVoix(v, 'fr')?.name).toBe('Thomas');
    expect(meilleureVoix([], 'ar')).toBeNull();
  });
});
