import { describe, expect, it } from 'vitest';
import { fusionLignes, lignesHabituelles, lundiCourant, matiereDe } from './devoirFichiers';

describe('lignes de devoir par groupe', () => {
  it('sans réglage : les matières habituelles, toutes affichées', () => {
    const l = fusionLignes([]);
    expect(l.map((x) => x.key)).toEqual(lignesHabituelles().map((x) => x.key));
    expect(l.every((x) => x.actif)).toBe(true);
  });
  it('une ligne à soi seule : elle passe après les matières', () => {
    const l = fusionLignes([{ key: 'perso_a', type: 'autre', emoji: '🖍️', label: 'Coloriage', actif: true, perso: true }]);
    expect(l[l.length - 1].label).toBe('Coloriage');
    expect(l[0].key).toBe('nourania');
  });
  it('ordre enregistré gardé, matière manquante ajoutée à la fin, ligne cachée gardée cachée', () => {
    const l = fusionLignes([{ key: 'sourate', actif: false }, { key: 'nourania', actif: true }]);
    expect(l[0]).toMatchObject({ key: 'sourate', actif: false, label: 'Sourate' });
    expect(l[1].key).toBe('nourania');
    expect(l).toHaveLength(lignesHabituelles().length);
  });
  it('une ligne à soi garde son nom et son emoji chez l’élève', () => {
    expect(matiereDe({ type: 'autre', matiere_label: 'Coloriage', matiere_emoji: '🖍️' })).toEqual({ emoji: '🖍️', label: 'Coloriage' });
    expect(matiereDe({ type: 'nourania' }).label).toBe('Nourania');
  });
  it('lundi de la semaine', () => {
    expect(lundiCourant(new Date(2026, 10, 4, 15)).getDate()).toBe(2);
    expect(lundiCourant(new Date(2026, 10, 8, 23)).getDate()).toBe(2);
  });
});
