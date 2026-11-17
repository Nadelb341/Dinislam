import { describe, expect, it } from 'vitest';
import { cheminPhase, fractionLune, jourHijriDe, nomPhase } from './phaseLune';

const arcs = (d: string) => [...d.matchAll(/A([\d.]+) ([\d.]+) 0 0 (\d) /g)].map((m) => ({ rx: Number(m[1]), sweep: Number(m[3]) }));

describe('phase de la lune selon le jour du mois hégirien', () => {
  it('début du mois : fin croissant éclairé à droite', () => {
    const p = fractionLune(1);
    expect(nomPhase(p)).toBe('premier croissant');
    const [bord, term] = arcs(cheminPhase(p, 40, 40, 20));
    expect(bord.sweep).toBe(1); // bord par la droite
    expect(term.sweep).toBe(0); // terminateur bombé à droite → croissant fin
    expect(term.rx).toBeGreaterThan(15); // fin, mais bien visible
  });
  it('milieu du mois : pleine lune (14ᵉ-15ᵉ jour)', () => {
    expect(nomPhase(fractionLune(14))).toBe('pleine lune');
    expect(nomPhase(fractionLune(15))).toBe('pleine lune');
  });
  it('les étapes intermédiaires dans le bon ordre', () => {
    expect(nomPhase(fractionLune(7))).toBe('premier quartier');
    expect(nomPhase(fractionLune(10))).toBe('gibbeuse croissante');
    expect(nomPhase(fractionLune(19))).toBe('gibbeuse décroissante');
    expect(nomPhase(fractionLune(22))).toBe('dernier quartier');
  });
  it('fin du mois : croissant éclairé à gauche (« bombé dans l\'autre sens »)', () => {
    const p = fractionLune(28);
    expect(nomPhase(p)).toBe('dernier croissant');
    const [bord, term] = arcs(cheminPhase(p, 40, 40, 20));
    expect(bord.sweep).toBe(0); // bord par la gauche
    expect(term.sweep).toBe(1);
  });
  it('jamais invisible, même le 30', () => {
    expect(fractionLune(30)).toBeLessThanOrEqual(0.9);
    expect(fractionLune(0)).toBeGreaterThanOrEqual(0.1);
  });
  it('jour hégirien pendant les fêtes', () => {
    expect(jourHijriDe({ mode: 'ramadan', jour: 10, debut: '', aidFitr: '', aidAdha: '' })).toBe(10);
    expect(jourHijriDe({ mode: 'ramadan', jour: 0, debut: '', aidFitr: '', aidAdha: '' })).toBe(1);
    expect(jourHijriDe({ mode: 'fitr', jour: 1, debut: '', aidFitr: '', aidAdha: '' })).toBe(1);
    expect(jourHijriDe({ mode: 'adha', jour: 2, debut: '', aidFitr: '', aidAdha: '' })).toBe(11);
  });
});
