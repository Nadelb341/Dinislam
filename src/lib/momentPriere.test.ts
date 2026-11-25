import { describe, expect, it } from 'vitest';
import { momentDe, positionFrise } from './momentPriere';

const j = (h: number, m = 0) => new Date(2026, 10, 26, h, m);
const horaires = { fajrDate: j(6, 9), sunriseDate: j(7, 51), dhuhrDate: j(12, 32), asrDate: j(14, 52), maghribDate: j(17, 12), ishaDate: j(18, 47) };

describe('moment du ciel des prières', () => {
  it('suit la journée', () => {
    expect(momentDe(horaires, j(3))).toBe('icha');
    expect(momentDe(horaires, j(6, 9))).toBe('sobh');
    expect(momentDe(horaires, j(7, 51))).toBe('chourouk');
    expect(momentDe(horaires, j(9, 20))).toBe('chourouk');
    expect(momentDe(horaires, j(9, 21))).toBe('dhohr');
    expect(momentDe(horaires, j(14, 52))).toBe('asr');
    expect(momentDe(horaires, j(17, 12))).toBe('maghreb');
    expect(momentDe(horaires, j(18, 47))).toBe('icha');
    expect(momentDe(horaires, j(23, 30))).toBe('icha');
  });
  it('place le soleil sur la frise', () => {
    expect(positionFrise(horaires, j(5))).toBe(0);
    expect(positionFrise(horaires, j(20))).toBe(1);
    expect(positionFrise(horaires, j(12, 28))).toBeCloseTo(0.5, 1);
  });
});
