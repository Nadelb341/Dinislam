import { describe, expect, it } from 'vitest';
import { calculerHoraires } from './horairesCalcul';

describe('🕌 Horaires calculés sans Internet', () => {
  it('Clermont-l\'Hérault, 15/11/2026, MWL : comme le service en ligne d\'avant (± 2 min)', () => {
    const h = calculerHoraires(43.62756, 3.4318, 3, new Date(2026, 10, 15, 12), 'Europe/Paris');
    expect(h).toEqual({ fajr: '06:01', sunrise: '07:40', dhuhr: '12:32', asr: '14:59', maghrib: '17:21', isha: '18:55' });
  });
  it('en été à Lille le Fajr existe toujours (règle des hautes latitudes)', () => {
    const h = calculerHoraires(50.63, 3.07, 3, new Date(2026, 5, 21, 12), 'Europe/Paris');
    expect(h.fajr).toMatch(/^0[1-4]:\d\d$/);
  });
  it('Tanger, fuseau du Maroc', () => {
    const h = calculerHoraires(35.767, -5.8, 3, new Date(2026, 10, 15, 12), 'Africa/Casablanca');
    expect(h.maghrib).toMatch(/^1[78]:\d\d$/);
  });
  it('AMCES : la règle redonne son calendrier 2026 (ex. 15/11 : 06:17 · 12:31 · 15:01 · 17:21 · 18:41)', () => {
    const h = calculerHoraires(43.62756, 3.4318, 99, new Date(2026, 10, 15, 12), 'Europe/Paris');
    expect([h.fajr, h.dhuhr, h.maghrib, h.isha]).toEqual(['06:17', '12:31', '17:21', '18:41']);
    expect(['14:59', '15:00', '15:01', '15:02', '15:03']).toContain(h.asr);
  });
});
