import { describe, expect, it } from 'vitest';
import { datesAutomatiques, datesRetenues, periodeRamadan } from './ramadanDates';

describe('🌙 Dates du Ramadan et des Aïds', () => {
  it('calcul : Ramadan 1448 = 7 février 2027 (selon le calendrier de l\'appareil), Aïd ≈ 9 mars', () => {
    const d = datesAutomatiques(new Date(2026, 10, 16));
    expect(d.debut).toBe('2027-02-07');
    expect(d.aidFitr).toBe('2027-03-09');
    expect(d.aidAdha >= '2026-11-16').toBe(true);
  });
  it('la date de Nadia passe avant le calcul (lune vue un jour plus tard)', () => {
    const d = datesRetenues({ debut: '2027-02-08', aidFitr: '2027-03-10' }, new Date(2026, 10, 16));
    expect(d.debut).toBe('2027-02-08');
    expect(periodeRamadan(d, new Date(2027, 1, 7, 12))).toBeNull();
    expect(periodeRamadan(d, new Date(2027, 1, 8, 9))).toMatchObject({ mode: 'ramadan', jour: 1 });
    expect(periodeRamadan(d, new Date(2027, 2, 9, 9))).toMatchObject({ mode: 'ramadan', jour: 30 });
    expect(periodeRamadan(d, new Date(2027, 2, 10, 9))).toMatchObject({ mode: 'fitr' });
    expect(periodeRamadan(d, new Date(2027, 2, 11, 9))).toBeNull();
  });
  it('dès la veille au soir, au Maghrib', () => {
    const d = { debut: '2027-02-08', aidFitr: '2027-03-10', aidAdha: '2027-05-17' };
    expect(periodeRamadan(d, new Date(2027, 1, 7, 18, 0), '18:20')).toBeNull();
    expect(periodeRamadan(d, new Date(2027, 1, 7, 18, 25), '18:20')).toMatchObject({ mode: 'ramadan', jour: 0 });
  });
  it('Aïd el-Adha : 3 jours', () => {
    const d = { debut: '2027-02-08', aidFitr: '2027-03-10', aidAdha: '2027-05-17' };
    expect(periodeRamadan(d, new Date(2027, 4, 19, 10))).toMatchObject({ mode: 'adha', jour: 3 });
    expect(periodeRamadan(d, new Date(2027, 4, 20, 10))).toBeNull();
  });
});
