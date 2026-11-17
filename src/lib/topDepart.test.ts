import { describe, expect, it } from 'vitest';
import { jourDuTopDepart } from './saisons';

describe('🚀 Top Départ du Ramadan → décor', () => {
  const now = new Date(2027, 1, 10, 15, 0);
  it('éteint ou jamais lancé : pas de décor', () => {
    expect(jourDuTopDepart(null, now)).toBeNull();
    expect(jourDuTopDepart({ start_enabled: false, started_at: '2027-02-08T10:00:00Z' }, now)).toBeNull();
    expect(jourDuTopDepart({ start_enabled: true, started_at: null }, now)).toBeNull();
  });
  it('lancé : jour 1 le jour même, puis compte les jours', () => {
    expect(jourDuTopDepart({ start_enabled: true, started_at: new Date(2027, 1, 10, 9).toISOString() }, now)).toBe(1);
    expect(jourDuTopDepart({ start_enabled: true, started_at: new Date(2027, 1, 1, 9).toISOString() }, now)).toBe(10);
  });
  it('resté allumé depuis un ancien Ramadan : ne compte pas', () => {
    expect(jourDuTopDepart({ start_enabled: true, started_at: '2026-03-12T12:27:46Z' }, now)).toBeNull();
  });
});
