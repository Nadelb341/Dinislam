import { describe, it, expect } from 'vitest';
import { carteOuverte } from '@/hooks/useCartesVisibles';
import { rangParcours } from '@/lib/souratesPrecedentes';

// Idée 24 de l'audit (2026-11-09) : une seule règle pour l'accueil et le Classement, une seule pour l'ordre des sourates
describe('carteOuverte', () => {
  const actif = { is_active: true }, masque = { is_active: false };
  it("l'admin voit tout", () => expect(carteOuverte(masque, undefined, 'u', [], true)).toBe(true));
  it('carte active sans ciblage : ouverte, masquée : fermée', () => {
    expect(carteOuverte(actif, undefined, 'u', [], false)).toBe(true);
    expect(carteOuverte(masque, undefined, 'u', [], false)).toBe(false);
  });
  it('ciblage personnes prioritaire sur « masquée »', () => {
    const v = { visibility_type: 'users', user_ids: ['u'], group_ids: null };
    expect(carteOuverte(masque, v, 'u', [], false)).toBe(true);
    expect(carteOuverte(actif, v, 'autre', [], false)).toBe(false);
  });
  it('ciblage groupes', () => {
    const v = { visibility_type: 'groups', user_ids: null, group_ids: ['g1'] };
    expect(carteOuverte(masque, v, 'u', ['g1'], false)).toBe(true);
    expect(carteOuverte(actif, v, 'u', ['g2'], false)).toBe(false);
  });
});

describe('ordre du parcours des sourates', () => {
  it('114, 113, 112, Ayat Al-Kursi, 111 … 1', () => {
    const nums = [1, 111, 1000, 112, 114, 113, 110];
    expect([...nums].sort((a, b) => rangParcours(b) - rangParcours(a))).toEqual([114, 113, 112, 1000, 111, 110, 1]);
  });
});
