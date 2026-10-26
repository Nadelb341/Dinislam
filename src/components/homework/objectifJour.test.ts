import { describe, it, expect } from 'vitest';
import { objectifDuJour, serieJours, type DevoirObjectif } from './objectifJour';

const dv = (p: Partial<DevoirObjectif>): DevoirObjectif => ({ id: 'x', titre: 'Leçon 10', rendu: false, statut_rendu: null, etapes: [], etapesFaites: [], ...p });

describe('objectifDuJour', () => {
  it('objectif libre sans devoir à faire', () => {
    expect(objectifDuJour([])).toBe('révise ta dernière leçon 10 minutes');
    expect(objectifDuJour([dv({ rendu: true, statut_rendu: 'rendu' })])).toBe('révise ta dernière leçon 10 minutes');
  });
  it('prend le devoir le plus proche et sa prochaine étape non cochée', () => {
    const r = objectifDuJour([
      dv({ id: 'a', titre: 'Sourate', date_limite: '2026-11-10T18:00:00' }),
      dv({ id: 'b', titre: 'Leçon 10', date_limite: '2026-11-04T18:00:00', etapes: ['ligne 1', 'ligne 2', 'ligne 3'], etapesFaites: [1] }),
    ]);
    expect(r).toBe('10 minutes · Leçon 10 · ligne 2');
  });
  it('un devoir à refaire compte comme à faire', () => {
    expect(objectifDuJour([dv({ titre: 'Récitation', rendu: true, statut_rendu: 'a_refaire' })])).toBe('10 minutes · Récitation');
  });
});

describe('serieJours', () => {
  const now = new Date(2026, 9, 26, 9, 0);
  it("compte jusqu'à aujourd'hui", () => {
    expect(serieJours(new Set(['2026-10-24', '2026-10-25', '2026-10-26']), now)).toBe(3);
  });
  it("compte jusqu'à hier si pas encore fait aujourd'hui", () => {
    expect(serieJours(new Set(['2026-10-24', '2026-10-25']), now)).toBe(2);
  });
  it('0 si la série est cassée', () => {
    expect(serieJours(new Set(['2026-10-23']), now)).toBe(0);
  });
  it('passe le changement de mois', () => {
    expect(serieJours(new Set(['2026-10-31', '2026-11-01']), new Date(2026, 10, 1, 20))).toBe(2);
  });
});
