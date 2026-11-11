import { describe, it, expect } from 'vitest';
// carteOuverte : tests dans cartesAcces.test.ts (2026-11-11)
import { rangParcours } from '@/lib/souratesPrecedentes';

// Idée 24 de l'audit (2026-11-09) : une seule règle pour l'accueil et le Classement, une seule pour l'ordre des sourates

describe('ordre du parcours des sourates', () => {
  it('114, 113, 112, Ayat Al-Kursi, 111 … 1', () => {
    const nums = [1, 111, 1000, 112, 114, 113, 110];
    expect([...nums].sort((a, b) => rangParcours(b) - rangParcours(a))).toEqual([114, 113, 112, 1000, 111, 110, 1]);
  });
});
