import { describe, it, expect } from 'vitest';
import { depuisJour } from './depuisJour';

describe('depuisJour', () => {
  it('même adresse toute la journée (copie hors ligne retrouvée)', () => {
    expect(depuisJour(7, new Date(2026, 10, 12, 9, 1))).toBe(depuisJour(7, new Date(2026, 10, 12, 23, 59)));
    expect(new Date(depuisJour(7, new Date(2026, 10, 12, 9))).getDate()).toBe(5);
  });
});
