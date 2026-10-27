import { describe, expect, it } from 'vitest';
import { aRattraper, coursPasses, heureDeRendu, rangement } from './rotationDevoirs';

const mercredi14h = { weekday: 3, start_time: '14:00:00' };
const toussaint = [{ label: 'Toussaint', start_date: '2026-10-17', end_date: '2026-11-01' }];
// Devoir donné le mercredi 4 novembre 2026 à 16 h (après le cours)
const devoir = { id: 'd1', created_at: new Date(2026, 10, 4, 16, 0).toISOString(), date_limite: null };

describe('rotation des devoirs', () => {
  it('le devoir est attendu au cours suivant', () => {
    expect(heureDeRendu(devoir, mercredi14h, []).getTime()).toBe(new Date(2026, 10, 11, 14, 0).getTime());
  });
  it('change d\'onglet pile à l\'heure du cours', () => {
    expect(rangement(devoir, mercredi14h, [], new Date(2026, 10, 11, 13, 59))).toBe('semaine');
    expect(rangement(devoir, mercredi14h, [], new Date(2026, 10, 11, 14, 0))).toBe('passee');
    expect(rangement(devoir, mercredi14h, [], new Date(2026, 10, 18, 13, 59))).toBe('passee');
    expect(rangement(devoir, mercredi14h, [], new Date(2026, 10, 18, 14, 0))).toBe('historique');
  });
  it('pendant les vacances, la semaine dure jusqu\'au premier cours de la rentrée', () => {
    const avant = { id: 'd2', created_at: new Date(2026, 9, 14, 16, 0).toISOString(), date_limite: null };
    expect(heureDeRendu(avant, mercredi14h, toussaint).getTime()).toBe(new Date(2026, 10, 4, 14, 0).getTime());
  });
  it('une date à rendre plus lointaine repousse la rotation', () => {
    const loin = { ...devoir, date_limite: new Date(2026, 10, 18, 14, 0).toISOString() };
    expect(heureDeRendu(loin, mercredi14h, []).getTime()).toBe(new Date(2026, 10, 18, 14, 0).getTime());
  });
  it('à rattraper : pas fait, semaine finie, sauf si rangé dans l\'historique', () => {
    expect(aRattraper(devoir, false, 'passee', undefined)).toBe(true);
    expect(aRattraper(devoir, false, 'passee', 'historique')).toBe(false);
    expect(aRattraper(devoir, true, 'passee', undefined)).toBe(false);
    expect(aRattraper(devoir, false, 'semaine', undefined)).toBe(false);
  });
  it('la bande de semaines liste tous les cours passés', () => {
    const c = coursPasses(mercredi14h, toussaint, new Date(2026, 9, 1), new Date(2026, 10, 12));
    expect(c.map((d) => d.getDate())).toEqual([7, 14, 4, 11]);
  });
});
