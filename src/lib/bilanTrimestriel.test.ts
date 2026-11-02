import { describe, expect, it } from 'vitest';
import { calculerSnapshot, etapesBilan, guideAuto, periodeBilan, titreBilan, titrePeriode, type DonneesBilan } from './bilanTrimestriel';

const holidays = [
  { label: 'Vacances de la Toussaint', start_date: '2026-10-17', end_date: '2026-11-01' },
  { label: 'Vacances de Noël', start_date: '2026-12-19', end_date: '2027-01-03' },
];
const now = new Date(2026, 11, 15, 12, 0);
const periode = periodeBilan(holidays, now);
const sid = 'eleve-1';
const iso = (y: number, m: number, d: number, h = 16) => new Date(y, m, d, h).toISOString();

const data: DonneesBilan = {
  profiles: [{ user_id: sid, full_name: 'Wiam ELB', gender: 'fille', bilan_arabe: null, parent_phone: null, parent_phone_nom: null, parent2_phone: null, parent2_phone_nom: null }],
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
  lessons: [], lessonInfo: [], letters: [], lettersTotal: 28, names: [], reports: [], reads: [], envois: [],
};

describe('bilan trimestriel', () => {
  it('période : du lendemain de la Toussaint à la veille de Noël', () => {
    expect(periode).toMatchObject({ debut: '2026-11-02', fin: '2026-12-18', label: 'Avant les Vacances de Noël 2026' });
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

describe('📅 Étapes de bilan (menu, 2026-11-02)', () => {
  const vac = [
    { label: 'Vacances de la Toussaint', start_date: '2026-10-17', end_date: '2026-11-01' },
    { label: 'Vacances de Noël', start_date: '2026-12-19', end_date: '2027-01-03' },
    { label: "Vacances d'hiver", start_date: '2027-02-06', end_date: '2027-02-21' },
    { label: "Vacances d'été", start_date: '2027-07-03', end_date: '2027-08-31' },
    { label: 'Vacances de la Toussaint', start_date: '2027-10-23', end_date: '2027-11-07' },
  ];
  const e = etapesBilan(vac, [], new Date(2026, 10, 2, 12));

  it("une étape par vacances, avec l'année dans le libellé, rangée par année scolaire", () => {
    expect(e.map((x) => x.label)).toEqual([
      'Avant les Vacances de la Toussaint 2026', 'Avant les Vacances de Noël 2026', "Avant les Vacances d'hiver 2027",
      "Avant les Vacances d'été 2027", 'Avant les Vacances de la Toussaint 2027',
    ]);
    expect(e.map((x) => x.annee)).toEqual(['2026-2027', '2026-2027', '2026-2027', '2026-2027', '2027-2028']);
  });
  it('période : du lendemain des vacances précédentes (ou du 1er septembre) à la veille des vacances', () => {
    expect([e[0].debut, e[0].fin]).toEqual(['2026-09-01', '2026-10-16']);
    expect([e[1].debut, e[1].fin]).toEqual(['2026-11-02', '2026-12-18']);
    expect([e[4].debut, e[4].fin]).toEqual(['2027-09-01', '2027-10-22']);
  });
  it('en cours = Noël 2026 le 2/11 ; étapes futures pas encore commencées', () => {
    expect(e.filter((x) => x.enCours).map((x) => x.label)).toEqual(['Avant les Vacances de Noël 2026']);
    expect(e[1].aVenir).toBe(false);
    expect(e[2].aVenir).toBe(true);
  });
  it("un bilan dont les vacances ont été effacées reste dans le menu", () => {
    const x = etapesBilan(vac, [{ period_label: 'Avant les Vacances de printemps 2026', period_start: '2026-02-23', period_end: '2026-04-03' }], new Date(2026, 10, 2));
    expect(x[0]).toMatchObject({ label: 'Avant les Vacances de printemps 2026', annee: '2025-2026' });
  });
  it("titres : avec ou sans année dans l'ancien libellé", () => {
    expect(titreBilan('Avant les Vacances de Noël 2026', '2026-12-18')).toBe('Bilan avant les vacances de Noël 2026');
    expect(titrePeriode('Avant les Vacances de Noël', '2026-12-18')).toBe('vacances de Noël 2026');
    expect(periodeBilan(vac, new Date(2026, 10, 2)).label).toBe('Avant les Vacances de Noël 2026');
  });
});
