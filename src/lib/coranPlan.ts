/**
 * Carte « Coran » › Programme (2026-10-25) : calcul des pages à lire chaque jour.
 * Les jours sont des dates locales AAAA-MM-JJ ; le jour 1 est la date de départ.
 */
import { JUZ, MANZIL_PAGE, QURAN_PAGES } from '@/data/coranMeta';

export type PlanKind = 'ramadan' | 'annee' | 'semaine' | 'rythme';

export interface Programme {
  plan: PlanKind;
  start: string;
  totalDays: number;
  pagesPerDay?: number;
  doneDays: number[];
  reminder: boolean;
  finished?: boolean;
  finishedOn?: string;
}

export const PLAN_LABELS: Record<PlanKind, { emoji: string; title: string; hint: string }> = {
  ramadan: { emoji: '🌙', title: 'Ramadan', hint: "Tout le Coran en 30 jours · 1 Juz' par jour" },
  annee: { emoji: '📅', title: "Toute l'année", hint: '2 pages par jour' },
  semaine: { emoji: '⚡', title: 'En 7 jours', hint: '1 manzil par jour' },
  rythme: { emoji: '✏️', title: 'À mon rythme', hint: 'Je choisis combien de pages par jour' },
};

export function totalDaysFor(plan: PlanKind, pagesPerDay = 2): number {
  if (plan === 'ramadan') return 30;
  if (plan === 'semaine') return 7;
  const n = plan === 'annee' ? 2 : Math.max(1, Math.min(QURAN_PAGES, Math.round(pagesPerDay)));
  return Math.ceil(QURAN_PAGES / n);
}

/** Pages du Coran (1 à 604) à lire le jour `day` (1 = premier jour) */
export function pagesForDay(p: Pick<Programme, 'plan' | 'pagesPerDay' | 'totalDays'>, day: number): { from: number; to: number } {
  const d = Math.max(1, Math.min(day, p.totalDays));
  if (p.plan === 'ramadan') return { from: JUZ[d - 1].page, to: JUZ[d - 1].endPage };
  if (p.plan === 'semaine') return { from: MANZIL_PAGE[d - 1], to: d < 7 ? MANZIL_PAGE[d] - 1 : QURAN_PAGES };
  const n = p.plan === 'annee' ? 2 : Math.max(1, Math.round(p.pagesPerDay || 2));
  const from = (d - 1) * n + 1;
  return { from, to: Math.min(QURAN_PAGES, from + n - 1) };
}

export function localDay(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Numéro du jour du programme pour une date (1 = jour de départ) */
export function dayNumber(start: string, today = localDay()): number {
  const ms = Date.parse(today + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z');
  return Math.floor(ms / 86400000) + 1;
}

/** Date (AAAA-MM-JJ) du jour `day` d'un programme */
export function dateOfDay(start: string, day: number): string {
  const t = new Date(Date.parse(start + 'T00:00:00Z') + (day - 1) * 86400000);
  return t.toISOString().slice(0, 10);
}

/** Jours passés pas encore cochés (à rattraper), sans compter aujourd'hui */
export function lateDays(p: Programme, today = localDay()): number[] {
  const cur = Math.min(dayNumber(p.start, today), p.totalDays + 1);
  const out: number[] = [];
  for (let d = 1; d < cur; d++) if (!p.doneDays.includes(d)) out.push(d);
  return out;
}

/** Part du Coran lue (0 à 100), d'après les pages des jours cochés */
export function percentRead(p: Programme): number {
  const pages = p.doneDays.reduce((sum, d) => {
    const { from, to } = pagesForDay(p, d);
    return sum + (to - from + 1);
  }, 0);
  return Math.min(100, Math.round((pages / QURAN_PAGES) * 100));
}

export const isFinished = (p: Programme) => p.doneDays.length >= p.totalDays;
