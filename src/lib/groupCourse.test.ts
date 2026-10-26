import { describe, it, expect } from 'vitest';
import { nextCourse, courseAfter, inDays, periodStart, nextHolidays, type Holiday } from './groupCourse';

const toussaint: Holiday = { label: 'Vacances de la Toussaint', start_date: '2026-10-17', end_date: '2026-11-01' };
const noel: Holiday = { label: 'Vacances de Noël', start_date: '2026-12-19', end_date: '2027-01-03' };
const s = { group_id: 'g', weekday: 3, start_time: '14:00' }; // mercredi 14 h

describe('groupCourse', () => {
  it('saute les vacances de la Toussaint', () => {
    const d = nextCourse(s, [toussaint], new Date('2026-10-26T10:00:00'));
    expect(d.getDate()).toBe(4); // mercredi 4 novembre
    expect(d.getMonth()).toBe(10);
    expect(d.getHours()).toBe(14);
  });
  it("le cours du jour compte jusqu'à 2 h après son début", () => {
    expect(nextCourse(s, [], new Date('2026-11-04T15:30:00')).getDate()).toBe(4);
    expect(nextCourse(s, [], new Date('2026-11-04T16:30:00')).getDate()).toBe(11);
  });
  it('cours suivant', () => {
    expect(courseAfter(s, [], new Date('2026-11-04T14:00:00')).getDate()).toBe(11);
  });
  it('jours restants', () => {
    expect(inDays(new Date('2026-11-04T14:00:00'), new Date('2026-11-04T08:00:00'))).toBe("aujourd'hui");
    expect(inDays(new Date('2026-11-05T14:00:00'), new Date('2026-11-04T08:00:00'))).toBe('demain');
  });
  it('période des bilans', () => {
    expect(periodStart([toussaint, noel], new Date('2026-12-10T10:00:00'))).toBe('2026-11-02');
    expect(nextHolidays([toussaint, noel], new Date('2026-12-10T10:00:00'))?.label).toBe('Vacances de Noël');
  });
});
