import { describe, expect, it } from 'vitest';
import { LETTER_STROKES } from './letterStrokes';
import { ALPHABET_WORDS } from './alphabetWords';

describe('Tracés des lettres', () => {
  it('chaque lettre a ses 4 formes, chacune avec au moins un trait dans le cadre 300 × 200', () => {
    const letters = Object.keys(ALPHABET_WORDS);
    expect(letters).toHaveLength(28);
    for (const l of letters) {
      expect(LETTER_STROKES[l], l).toHaveLength(4);
      for (const form of LETTER_STROKES[l]) {
        expect(form.some((s) => 'd' in s), l).toBe(true);
        for (const s of form) {
          const nums = 'd' in s ? s.d.replace(/[ML]/g, ' ').trim().split(/\s+/).map(Number) : s.dot;
          expect(nums.length % 2, l).toBe(0);
          nums.forEach((n, i) => { expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThanOrEqual(i % 2 ? 200 : 300); });
        }
      }
    }
  });

  it('les lettres à points ont le bon nombre de points', () => {
    const count: Record<string, number> = { 'ب': 1, 'ت': 2, 'ث': 3, 'ن': 1, 'ق': 2, 'ش': 3 };
    for (const [l, n] of Object.entries(count)) {
      for (const form of LETTER_STROKES[l]) expect(form.filter((s) => 'dot' in s), l).toHaveLength(n);
    }
  });
});
