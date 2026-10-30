import { describe, expect, it } from 'vitest';
import { trierGroupesParNumero } from './studentGroups';

describe('groupes triés par numéro', () => {
  it('Groupe 0, 1, 2… puis les groupes sans numéro', () => {
    const noms = ['Groupe 2 - Garçons', 'Filles ELB', 'TEST', 'Groupe 10', 'Groupe 0 : Petits', 'Garçons ELB', 'Groupe 1 - Filles', 'Groupe 3 - Avancées', 'Groupe 4 - Paulhan'];
    expect(trierGroupesParNumero(noms.map((name) => ({ name }))).map((g) => g.name)).toEqual([
      'Groupe 0 : Petits', 'Groupe 1 - Filles', 'Groupe 2 - Garçons', 'Groupe 3 - Avancées', 'Groupe 4 - Paulhan', 'Groupe 10', 'Filles ELB', 'Garçons ELB', 'TEST',
    ]);
  });
});
