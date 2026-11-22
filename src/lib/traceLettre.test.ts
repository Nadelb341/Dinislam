import { describe, expect, it } from 'vitest';
import { couverture, partPresDeLaLettre, traceValide } from './traceLettre';

// Grille 40 × 12 : un « corps » (rangées 2-3, colonnes 2 à 37) et un « point » (carré 3×3 en bas)
const gw = 40, gh = 12;
const grille = (rempli: (x: number, y: number) => boolean) => { const t = new Uint8Array(gw * gh); for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) t[y * gw + x] = rempli(x, y) ? 1 : 0; return t; };
const corps = (x: number, y: number) => y >= 2 && y <= 3 && x >= 2 && x <= 37;
const pointB = (x: number, y: number) => y >= 7 && y <= 9 && x >= 19 && x <= 21;
const masque = grille((x, y) => corps(x, y) || pointB(x, y));

describe('trace de la lettre', () => {
  it('validé : forme faite + point, même en débordant', () => {
    const encre = grille((x, y) => (y >= 1 && y <= 4) || (y >= 6 && x >= 18 && x <= 22));
    expect(traceValide(couverture(masque, encre, gw, gh))).toBe(true);
  });
  it('pas validé si le point est oublié', () => {
    const encre = grille((_, y) => y >= 1 && y <= 4);
    expect(traceValide(couverture(masque, encre, gw, gh))).toBe(false);
  });
  it('pas validé si seule la MOITIÉ de la forme est faite (même avec le point)', () => {
    const encre = grille((x, y) => (y <= 4 && x <= 20) || pointB(x, y));
    expect(traceValide(couverture(masque, encre, gw, gh))).toBe(false);
  });
  it('pas validé s\'il manque un bout de la forme (une tranche oubliée)', () => {
    const encre = grille((x, y) => (y <= 4 && x >= 9) || pointB(x, y));
    expect(traceValide(couverture(masque, encre, gw, gh))).toBe(false);
  });
  it('gribouillage partout : repéré', () => {
    const zone = grille((x, y) => (y >= 1 && y <= 4) || (y >= 6 && y <= 10 && x >= 17 && x <= 23));
    expect(partPresDeLaLettre(grille(() => true), zone)).toBeLessThan(0.55);
    expect(partPresDeLaLettre(grille((_, y) => y >= 2 && y <= 3), zone)).toBe(1);
  });
});
