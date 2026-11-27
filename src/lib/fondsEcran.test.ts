import { describe, expect, it } from 'vitest';
import { calques, fondDuJour, FONDS, svgFond } from './fondsEcran';

describe('fonds d\'écran', () => {
  const M = 60000, fajr = 6 * 60 * M, maghrib = 17 * 60 * M;
  it('jour, couchant, nuit, aube', () => {
    expect(calques(12 * 60 * M, fajr, maghrib)).toMatchObject({ nuit: 0, voile: 0, moment: 'jour' });
    const c = calques(maghrib - 15 * M, fajr, maghrib);
    expect(c.moment).toBe('couchant'); expect(c.nuit).toBe(0); expect(c.voile).toBeCloseTo(.3);
    expect(calques(maghrib + 10 * M, fajr, maghrib).nuit).toBeCloseTo(.5);
    expect(calques(maghrib + 30 * M, fajr, maghrib)).toMatchObject({ nuit: 1, moment: 'nuit' });
    expect(calques(2 * 60 * M, fajr, maghrib)).toMatchObject({ nuit: 1, moment: 'nuit' });
    expect(calques(fajr + 15 * M, fajr, maghrib).nuit).toBeCloseTo(.5);
  });
  it('un fond par jour parmi les actifs, aucun si tout est coupé', () => {
    const a = fondDuJour('jp', ['jp1', 'jp3'], new Date(2026, 10, 22));
    const b = fondDuJour('jp', ['jp1', 'jp3'], new Date(2026, 10, 23));
    expect(a && b && a.cle !== b.cle).toBe(true);
    expect(fondDuJour('ng', [])).toBeNull();
  });
  it('le n° 3 des grands (sable et menthe) n\'existe plus ; le vendredi ajoute la petite mosquée', () => {
    expect(FONDS.some((f) => f.cle === 'jg3')).toBe(false);
    const f = FONDS.find((x) => x.cle === 'jp1')!;
    expect(svgFond(f, 'x', true).length).toBeGreaterThan(svgFond(f, 'x', false).length);
  });
});

describe('🚫 plus aucune étoile à 8 branches dans les fonds (Nadia, 27/11)', () => {
  it('aucun fond ne dessine deux carrés croisés (rotate 45)', () => {
    for (const f of FONDS) {
      for (const v of [false, true]) expect(svgFond(f, 't', v)).not.toMatch(/rotate\(45/);
    }
  });
});
