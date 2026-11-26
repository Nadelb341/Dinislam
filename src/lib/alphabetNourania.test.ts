import { describe, expect, it } from 'vitest';
import { alphabetDeLecon, leconDeParticularite, normaliserTitre } from './alphabetNourania';

describe('Alphabet ↔ Nourania (2026-11-26)', () => {
  it('relie les particularités certaines à leur leçon', () => {
    expect(leconDeParticularite('La chadda')).toBe(11);
    expect(leconDeParticularite('Le tanouine')).toBe(5);
    expect(leconDeParticularite('Les voyelles longues (madd)')).toBe(9);
    expect(leconDeParticularite('  LES LETTRES SOLAIRES ')).toBe(13);
  });
  it("ne met pas de lien quand ce n'est pas certain", () => {
    expect(leconDeParticularite('Le tâ marbouta')).toBeNull();
    expect(leconDeParticularite('La hamza')).toBeNull();
    expect(leconDeParticularite('Le lam-alif')).toBeNull();
    expect(alphabetDeLecon(2)).toBeNull();
    expect(alphabetDeLecon(17)).toBeNull();
  });
  it('va dans les deux sens', () => {
    expect(alphabetDeLecon(1)).toEqual({ lettres: true });
    expect(alphabetDeLecon(11)).toEqual({ particularite: 'la chadda' });
    expect(leconDeParticularite('La chadda')).toBe(11);
  });
  it('normalise les titres', () => {
    expect(normaliserTitre('Le tâ  marbouta')).toBe('le ta marbouta');
  });
});
