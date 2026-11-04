import { describe, expect, it } from 'vitest';
import { souratesAvant } from './souratesPrecedentes';

describe('sourates d’avant dans le parcours', () => {
  const tous = [114, 113, 112, 1000, 111, 110, 109, 101, 100];
  it('Al-Masad (111) : 114, 113, 112 et Ayat Al-Kursi', () => expect(souratesAvant(111, tous).sort()).toEqual([1000, 112, 113, 114]));
  it('Ayat Al-Kursi : 114, 113, 112', () => expect(souratesAvant(1000, tous).sort()).toEqual([112, 113, 114]));
  it('Al-Fatiha (1) : aucune (apprise à part)', () => expect(souratesAvant(1, [...tous, 1])).toEqual([]));
  it('An-Nas (114) : aucune', () => expect(souratesAvant(114, tous)).toEqual([]));
  it('Al-Qari’a (101) : tout ce qui est au-dessus', () => expect(souratesAvant(101, tous)).toHaveLength(7));
});
