import { describe, expect, it } from 'vitest';
import { calculerSnapshot, guideAuto, periodeBilan, type DonneesBilan } from './bilanTrimestriel';

const holidays = [
  { label: 'Vacances de la Toussaint', start_date: '2026-10-17', end_date: '2026-11-01' },
  { label: 'Vacances de Noël', start_date: '2026-12-19', end_date: '2027-01-03' },
];
const now = new Date(2026, 11, 15, 12, 0);
const periode = periodeBilan(holidays, now);
const sid = 'eleve-1';
const iso = (y: number, m: number, d: number, h = 16) => new Date(y, m, d, h).toISOString();

const data: DonneesBilan = {
  profiles: [{ user_id: sid, full_name: 'Wiam ELB', gender: 'fille', bilan_arabe: null }],
  memberships: [{ user_id: sid, group_id: 'g1' }],
  groups: [{ id: 'g1', name: 'Groupe 3' }],
  horaires: [{ group_id: 'g1', weekday: 3, start_time: '14:00:00' }],
  devoirs: [
    { id: 'd1', created_at: iso(2026, 10, 4), visible_a: null, date_limite: null, assigned_to: 'group', group_id: 'g1', student_id: null, type: 'sourate' },
    { id: 'd2', created_at: iso(2026, 10, 11), visible_a: null, date_limite: null, assigned_to: 'group', group_id: 'g1', student_id: null, type: 'nourania' },
    { id: 'd3', created_at: iso(2026, 10, 18), visible_a: null, date_limite: null, assigned_to: 'group', group_id: 'g1', student_id: null, type: 'allah_names' },
  ],
  rendus: [
    { devoir_id: 'd1', student_id: sid, statut: 'corrige', rendu_at: iso(2026, 10, 8), a_ete_refait: false },
    { devoir_id: 'd2', student_id: sid, statut: 'corrige', rendu_at: iso(2026, 10, 20), a_ete_refait: true },
  ],
  attendance: [
    { user_id: sid, date: '2026-11-04', status: 'present' },
    { user_id: sid, date: '2026-11-11', status: 'absent' },
    { user_id: sid, date: '2026-11-18', status: 'present' },
  ],
  justifs: [{ student_id: sid, course_date: '2026-11-11' }],
  behavior: [{ student_id: sid, course_date: '2026-11-18', kind: 'participe' }],
  goals: ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-20'].map((day) => ({ student_id: sid, day })),
  sourates: [{ user_id: sid, sourate_id: 's105', validated_at: iso(2026, 10, 10), created_at: null }],
  sourateInfo: [{ id: 's105', number: 105, name_french: 'Al-Fil' }, { id: 's104', number: 104, name_french: 'Al-Humaza' }],
  lessons: [], lessonInfo: [], letters: [], lettersTotal: 28, names: [], reports: [], reads: [],
};

describe('bilan trimestriel', () => {
  it('période : du lendemain de la Toussaint à la veille de Noël', () => {
    expect(periode).toMatchObject({ debut: '2026-11-02', fin: '2026-12-18', label: 'Avant les Vacances de Noël' });
  });
  it('calcule les chiffres avec les vraies règles', () => {
    const s = calculerSnapshot(sid, data, holidays, periode, now);
    expect(s.prenom).toBe('Wiam');
    expect(s.fille).toBe(true);
    expect(s.presence).toMatchObject({ cours: 3, presents: 2, absents: 1, justifiees: 1, pct: 67 });
    expect(s.devoirs).toMatchObject({ donnes: 3, faits: 2, premierCoup: 1, refaits: 1, pasFaits: 1, retard: 1 });
    expect(s.serie).toBe(3);
    expect(s.appris.sourates).toEqual(['Al-Fil']);
    expect(s.frise.find((f) => f.date === '2026-11-11')?.statut).toBe('justifie');
    expect(s.precedents).toHaveLength(1);
  });
  it('guide pré-rempli avec la prochaine sourate', () => {
    const s = calculerSnapshot(sid, data, holidays, periode, now);
    const g = guideAuto(s, true, 'Al-Humaza');
    expect(g.objectif[0]).toBe('Apprendre la sourate Al-Humaza');
    expect(g.forts.length).toBeGreaterThan(0);
  });
});
