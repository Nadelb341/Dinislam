import { describe, it, expect } from 'vitest';
import { askableCells, buildLines, cellPrompt } from './alphabetLines';

const LETTERS = [
  { letter_arabic: 'ب', name_french: 'Ba', position_isolated: 'ب', position_initial: 'بـ', position_medial: 'ـبـ', position_final: 'ـب' },
  { letter_arabic: 'د', name_french: 'Dal', position_isolated: 'د', position_initial: 'د', position_medial: 'ـد', position_final: 'ـد' },
  { letter_arabic: 'ا', name_french: 'Alif', position_isolated: 'ا', position_initial: 'ا', position_medial: 'ـا', position_final: 'ـا' },
];

describe('Lignes et consignes des jeux de l\'Alphabet', () => {
  it('chaque consigne nomme la lettre', () => {
    for (const l of LETTERS) {
      for (const line of buildLines(l)) {
        for (const ci of askableCells(line)) expect(cellPrompt(line, ci, l)).toContain(`${l.letter_arabic} (${l.name_french})`);
      }
    }
  });

  it('on ne demande jamais une case dont l\'écriture apparaît deux fois dans la ligne', () => {
    const dal = buildLines(LETTERS[1]).find((x) => x.key === 'formes')!;
    expect(askableCells(dal)).toEqual([]); // د : isolée = début, milieu = fin
    const ba = buildLines(LETTERS[0]).find((x) => x.key === 'formes')!;
    expect(askableCells(ba)).toEqual([0, 1, 2, 3]);
  });

  it('le Alif n\'a pas de ligne soukoune ni chadda', () => {
    const keys = buildLines(LETTERS[2]).map((x) => x.key);
    expect(keys).not.toContain('soukoune');
    expect(keys).not.toContain('chadda');
  });

  it('toutes les écritures d\'une lettre sont différentes d\'une ligne à l\'autre (pas de piège identique à la réponse)', () => {
    for (const l of LETTERS) {
      const lines = buildLines(l).filter((x) => x.key !== 'formes');
      const texts = lines.flatMap((x) => x.cells.map((c) => c.text));
      expect(new Set(texts).size).toBe(texts.length);
    }
  });
});
