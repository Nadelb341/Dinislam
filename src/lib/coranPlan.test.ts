import { describe, it, expect } from 'vitest';
import { pagesForDay, totalDaysFor, dayNumber, dateOfDay, lateDays, percentRead, isFinished, type Programme } from './coranPlan';
import { JUZ, SURA_PAGE, indexOfPage, pageOfIndex, juzOfPage, suraOfPage } from '@/data/coranMeta';

describe('coranMeta', () => {
  it('pages connues du Coran de Médine', () => {
    expect(SURA_PAGE[0]).toBe(1);
    expect(SURA_PAGE[17]).toBe(293); // Al-Kahf
    expect(SURA_PAGE[113]).toBe(604); // An-Nas
    expect(JUZ[11].page).toBe(222);
    expect(JUZ[29].page).toBe(582);
    expect(JUZ[29].endPage).toBe(604);
  });
  it('index du lecteur ↔ page du Coran', () => {
    expect(indexOfPage(1)).toBe(4);
    expect(pageOfIndex(4)).toBe(1);
    expect(pageOfIndex(607)).toBe(604);
    expect(pageOfIndex(1)).toBeNull();
    expect(pageOfIndex(608)).toBeNull();
  });
  it('Juz et sourate d\'une page', () => {
    expect(juzOfPage(293)).toBe(15);
    expect(suraOfPage(293)).toBe(18);
    expect(suraOfPage(604)).toBe(114);
  });
  it('les 30 Juz couvrent les 604 pages sans trou', () => {
    for (let i = 1; i < 30; i++) expect(JUZ[i].page).toBe(JUZ[i - 1].endPage + 1);
  });
});

describe('coranPlan', () => {
  it('Ramadan : 1 Juz par jour', () => {
    const p = { plan: 'ramadan' as const, totalDays: 30 };
    expect(pagesForDay(p, 1)).toEqual({ from: 1, to: 21 });
    expect(pagesForDay(p, 12)).toEqual({ from: 222, to: 241 });
    expect(pagesForDay(p, 30)).toEqual({ from: 582, to: 604 });
  });
  it("Toute l'année : 2 pages par jour, 302 jours", () => {
    expect(totalDaysFor('annee')).toBe(302);
    const p = { plan: 'annee' as const, totalDays: 302 };
    expect(pagesForDay(p, 96)).toEqual({ from: 191, to: 192 });
    expect(pagesForDay(p, 302)).toEqual({ from: 603, to: 604 });
  });
  it('7 jours : un manzil par jour', () => {
    const p = { plan: 'semaine' as const, totalDays: 7 };
    expect(pagesForDay(p, 1)).toEqual({ from: 1, to: 105 });
    expect(pagesForDay(p, 7)).toEqual({ from: 518, to: 604 });
  });
  it('À mon rythme : dernière journée raccourcie', () => {
    expect(totalDaysFor('rythme', 10)).toBe(61);
    expect(pagesForDay({ plan: 'rythme', pagesPerDay: 10, totalDays: 61 }, 61)).toEqual({ from: 601, to: 604 });
  });
  it('jours, retards et pourcentage', () => {
    expect(dayNumber('2026-03-01', '2026-03-01')).toBe(1);
    expect(dayNumber('2026-03-01', '2026-03-12')).toBe(12);
    expect(dateOfDay('2026-03-01', 12)).toBe('2026-03-12');
    const p: Programme = { plan: 'ramadan', start: '2026-03-01', totalDays: 30, doneDays: [1, 2, 4], reminder: true };
    expect(lateDays(p, '2026-03-05')).toEqual([3]);
    expect(percentRead(p)).toBe(10);
    expect(isFinished(p)).toBe(false);
  });
});

describe('À mon rythme par date de fin', () => {
  it('répartit les 604 pages sans trou jusqu\'à la date choisie', async () => {
    const { daysBetween } = await import('./coranPlan');
    const total = daysBetween('2026-01-01', '2026-04-30');
    expect(total).toBe(120);
    const p = { plan: 'rythme' as const, totalDays: total, endDate: '2026-04-30' };
    expect(pagesForDay(p, 1).from).toBe(1);
    expect(pagesForDay(p, total).to).toBe(604);
    for (let d = 2; d <= total; d++) expect(pagesForDay(p, d).from).toBe(pagesForDay(p, d - 1).to + 1);
  });
});
