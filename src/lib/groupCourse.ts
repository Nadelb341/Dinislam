/**
 * 📓 Cours de chaque groupe (2026-10-26) : jour + heure (table group_schedules), sans cours pendant les vacances
 * scolaires de la zone C (table school_holidays). Utilisé par le déroulé du cours, la date à rendre automatique,
 * « Prêt pour le cours » et le message 2 h avant le cours.
 */
/** Écrans du cahier de texte d'un groupe */
export type CahierVue = 'devoirs' | 'tableau' | 'recap' | 'bilans' | 'niveaux';

export interface GroupSchedule { group_id: string; weekday: number; start_time: string }
export interface Holiday { label: string; start_date: string; end_date: string }

export const WEEKDAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const inHolidays = (day: Date, holidays: Holiday[]) => {
  const k = ymd(day);
  return holidays.some((h) => h.start_date <= k && k <= h.end_date);
};

/** ISO : 1 = lundi … 7 = dimanche */
const isoDay = (d: Date) => ((d.getDay() + 6) % 7) + 1;

/**
 * Prochain cours (date + heure) à partir de `from` : le cours du jour compte tant qu'il n'est pas commencé
 * depuis plus de `graceMinutes`. Les jours de vacances sont sautés.
 */
export function nextCourse(s: GroupSchedule, holidays: Holiday[], from = new Date(), graceMinutes = 120): Date {
  const [h, m] = s.start_time.split(':').map(Number);
  const d = new Date(from);
  d.setHours(h, m || 0, 0, 0);
  for (let i = 0; i < 400; i++) {
    if (isoDay(d) === s.weekday && !inHolidays(d, holidays) && d.getTime() + graceMinutes * 60000 > from.getTime()) return d;
    d.setDate(d.getDate() + 1);
    d.setHours(h, m || 0, 0, 0);
  }
  return d;
}

/** Le cours d'après (pour « Dupliquer la séance à la semaine suivante ») */
export const courseAfter = (s: GroupSchedule, holidays: Holiday[], course: Date) =>
  nextCourse(s, holidays, new Date(course.getTime() + 3 * 3600000), 0);

/** « mercredi 4 novembre à 14 h » */
export const courseLabel = (d: Date) =>
  `${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${d.getHours()} h${d.getMinutes() ? String(d.getMinutes()).padStart(2, '0') : ''}`;

/** « aujourd'hui », « demain », « dans 3 jours » */
export function inDays(d: Date, now = new Date()): string {
  const a = new Date(now); a.setHours(0, 0, 0, 0);
  const b = new Date(d); b.setHours(0, 0, 0, 0);
  const n = Math.round((b.getTime() - a.getTime()) / 86400000);
  return n <= 0 ? "aujourd'hui" : n === 1 ? 'demain' : `dans ${n} jours`;
}

/** Valeur d'un champ datetime-local (« 2026-11-04T14:00 ») */
export const toLocalInput = (d: Date) => `${ymd(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Prochaines vacances (pour les bilans) et la période écoulée depuis les dernières */
export function nextHolidays(holidays: Holiday[], now = new Date()): Holiday | null {
  const k = ymd(now);
  return [...holidays].sort((a, b) => a.start_date.localeCompare(b.start_date)).find((h) => h.end_date >= k) ?? null;
}
export function periodStart(holidays: Holiday[], now = new Date()): string {
  const k = ymd(now);
  const past = [...holidays].filter((h) => h.end_date < k).sort((a, b) => b.end_date.localeCompare(a.end_date))[0];
  if (past) { const d = new Date(`${past.end_date}T12:00:00`); d.setDate(d.getDate() + 1); return ymd(d); }
  return `${now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1}-09-01`;
}
