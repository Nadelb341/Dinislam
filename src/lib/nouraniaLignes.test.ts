import { describe, it, expect } from 'vitest';
import {
  couperEnDeux, deplacerBord, enChiffresArabes, ligneEnDessous, lireLignes, margeDroite, nombreDeLignes,
  numeroter, statutSuivant, trierLignes, type LigneCours,
} from './nouraniaLignes';

// Leçon 6 : la page 1 commence par 3 lignes de la leçon 5, puis 6 lignes ; la page 2 a 3 lignes puis la leçon 7
const lecon6: LigneCours[] = [
  { p: 2, t: 8, b: 16.5, s: 'lecon' },
  { p: 1, t: 8, b: 16.5, s: 'autre' },
  { p: 1, t: 44.5, b: 52.3, s: 'lecon' },
  { p: 1, t: 52.3, b: 60.3, s: 'lecon' },
  { p: 2, t: 41.4, b: 49.7, s: 'autre' },
  { p: 2, t: 16.5, b: 24.8, s: 'lecon' },
  { p: 1, t: 91, b: 95, s: 'aucune' },
];

describe('numéros de lignes Nourania', () => {
  it('numérote seulement les lignes de la leçon, en continuant sur la page suivante', () => {
    const l = trierLignes(lecon6);
    expect(l.map((x) => `${x.p}:${x.t}`)).toEqual(['1:8', '1:44.5', '1:52.3', '1:91', '2:8', '2:16.5', '2:41.4']);
    expect(numeroter(l)).toEqual([null, 1, 2, null, 3, 4, null]);
    expect(nombreDeLignes(l)).toBe(4);
  });

  it('lit la colonne sans planter, même abîmée', () => {
    expect(lireLignes(null)).toEqual([]);
    expect(lireLignes('x')).toEqual([]);
    expect(lireLignes([{ p: 1, t: 2, b: 3, s: 'lecon' }, { p: 1 }, { p: 1, t: 2, b: 3, s: 'bizarre' }])).toEqual([{ p: 1, t: 2, b: 3, s: 'lecon' }]);
  });

  it('écrit les chiffres arabes', () => {
    expect(enChiffresArabes(4)).toBe('٤');
    expect(enChiffresArabes(35)).toBe('٣٥');
  });

  it('change le statut dans l\'ordre leçon → autre → aucune → leçon', () => {
    expect(statutSuivant('lecon')).toBe('autre');
    expect(statutSuivant('autre')).toBe('aucune');
    expect(statutSuivant('aucune')).toBe('lecon');
  });

  it('déplace un bord sans retourner la ligne ni sortir de la page', () => {
    const l: LigneCours = { p: 1, t: 10, b: 13, s: 'lecon' };
    expect(deplacerBord(l, 't', 5).t).toBe(11);
    expect(deplacerBord(l, 'b', -5).b).toBe(12);
    expect(deplacerBord({ ...l, t: 0.2 }, 't', -1).t).toBe(0);
    expect(deplacerBord({ ...l, b: 99.8 }, 'b', 1).b).toBe(100);
  });

  it('coupe en deux et ajoute une ligne en dessous', () => {
    const [a, b] = couperEnDeux({ p: 1, t: 10, b: 20, s: 'autre' });
    expect([a.t, a.b, b.t, b.b, b.s]).toEqual([10, 15, 15, 20, 'autre']);
    expect(ligneEnDessous({ p: 2, t: 90, b: 98, s: 'autre' })).toEqual({ p: 2, t: 98, b: 100, s: 'lecon' });
  });

  it('garde une marge à droite sur téléphone, presque rien sur ordinateur', () => {
    expect(margeDroite(340, 35)).toBeGreaterThan(10);
    expect(margeDroite(800, 9)).toBeLessThan(margeDroite(340, 9));
    expect(margeDroite(340, 0)).toBe(0);
  });
});
