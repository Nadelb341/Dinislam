import { describe, expect, it } from 'vitest';
import { calqueDessous, calqueDessus, grappes, sansAccolades } from './formeColoree';

describe('forme colorée des Lettres particulières', () => {
  it('voyelle en couleur : retirée du dessus, posée avec sa lettre en dessous', () => {
    const g = grappes('ب{َ} ب');
    expect(calqueDessus(g)).toEqual([{ texte: 'ب ب', couleur: false }]);
    expect(calqueDessous(g)).toEqual([{ texte: 'بَ', couleur: true }, { texte: ' ب', couleur: false }]);
  });
  it('lettre en couleur : en couleur sur le dessus, rien en dessous', () => {
    const g = grappes('بَ{ا}');
    expect(calqueDessus(g)).toEqual([{ texte: 'بَ', couleur: false }, { texte: 'ا', couleur: true }]);
    expect(calqueDessous(g).every((m) => !m.couleur)).toBe(true);
  });
  it('les deux calques ont exactement les mêmes lettres', () => {
    const t = 'ال{شَّ}مْس ا{لْ}قَمَر رَب{ّ}';
    const lettres = (m: { texte: string }[]) => m.map((x) => x.texte).join('').replace(/[ً-ٟ]/g, '');
    expect(lettres(calqueDessus(grappes(t)))).toBe(lettres(calqueDessous(grappes(t))));
    expect(sansAccolades(t)).toBe('الشَّمْس الْقَمَر رَبّ');
  });
});
