import { describe, expect, it } from 'vitest';
import { couverture, traceValide } from './traceLettre';

// Grille 20 × 10 : un « corps » (rangée 2, colonnes 2 à 17) et un « point » (carré 3×3 en bas)
const gw = 20, gh = 10;
const grille = (rempli: (x: number, y: number) => boolean) => { const t = new Uint8Array(gw * gh); for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) t[y * gw + x] = rempli(x, y) ? 1 : 0; return t; };
const corps = (x: number, y: number) => y >= 2 && y <= 3 && x >= 2 && x <= 17;
const pointB = (x: number, y: number) => y >= 6 && y <= 8 && x >= 9 && x <= 11;
const masque = grille((x, y) => corps(x, y) || pointB(x, y));

describe('trace de la lettre', () => {
  it('validé : forme faite + point, même en débordant', () => {
    const encre = grille((x, y) => (y >= 1 && y <= 4) || (y >= 5 && x >= 8 && x <= 12));
    expect(traceValide(couverture(masque, encre, gw, gh))).toBe(true);
  });
  it('pas validé si le point est oublié', () => {
    const encre = grille((_, y) => y >= 1 && y <= 4);
    expect(traceValide(couverture(masque, encre, gw, gh))).toBe(false);
  });
  it('pas validé si seule une petite partie de la forme est faite', () => {
    const encre = grille((x, y) => (y <= 4 && x <= 6) || pointB(x, y));
    expect(traceValide(couverture(masque, encre, gw, gh))).toBe(false);
  });
});
