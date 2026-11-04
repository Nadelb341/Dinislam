import { describe, expect, it } from 'vitest';
import { groupStudents, trierGroupesParNumero } from './studentGroups';

describe('groupes triés par numéro', () => {
  it('Groupe 0, 1, 2… puis les groupes sans numéro', () => {
    const noms = ['Groupe 2 - Garçons', 'Filles ELB', 'TEST', 'Groupe 10', 'Groupe 0 : Petits', 'Garçons ELB', 'Groupe 1 - Filles', 'Groupe 3 - Avancées', 'Groupe 4 - Paulhan'];
    expect(trierGroupesParNumero(noms.map((name) => ({ name }))).map((g) => g.name)).toEqual([
      'Groupe 0 : Petits', 'Groupe 1 - Filles', 'Groupe 2 - Garçons', 'Groupe 3 - Avancées', 'Groupe 4 - Paulhan', 'Groupe 10', 'Filles ELB', 'Garçons ELB', 'TEST',
    ]);
  });
});

describe('compte présent dans tous les groupes (Test 3, 2026-11-04)', () => {
  it('apparaît dans chaque groupe, jamais dans « Sans groupe »', () => {
    const eleves = [{ user_id: 'a', full_name: 'Amine' }, { user_id: 't', full_name: 'Test 3', presence_tous_groupes: true }, { user_id: 'z', full_name: 'Zoé' }];
    const groupes = [{ id: 'g1', name: 'Groupe 1', color: null, position: null }, { id: 'g2', name: 'Groupe 2', color: null, position: null }];
    const r = groupStudents(eleves, groupes, [{ user_id: 'a', group_id: 'g1' }]);
    expect(r.map((g) => [g.groupName, g.members.map((m) => m.full_name)])).toEqual([
      ['Groupe 1', ['Amine', 'Test 3']], ['Groupe 2', ['Test 3']], ['Sans groupe', ['Zoé']],
    ]);
  });
});
