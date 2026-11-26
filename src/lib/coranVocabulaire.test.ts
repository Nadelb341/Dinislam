import { describe, expect, it } from 'vitest';
import { accesVocab, badgeVisibilite, enfantsDe, lettreChapitre, pageDeLAdresse, textePages, type CarteVocab } from './coranVocabulaire';

const carte = (o: Partial<CarteVocab>): CarteVocab => ({
  id: 'x', parent_id: null, cle: null, titre: 'T', emoji: null, couleur: null, pdf_url: null,
  page_debut: null, page_fin: null, position: 0, mode: 'tous', group_ids: [], user_ids: [], ...o,
});

describe('vocabulaire du Coran', () => {
  const cachee = carte({ id: 'a', mode: 'personne' });
  const ouverte = carte({ id: 'b', mode: 'tous' });
  const groupe = carte({ id: 'c', mode: 'certains', group_ids: ['g1'], user_ids: ['e9'] });
  const toutes = [cachee, ouverte, groupe,
    carte({ id: 'a1', parent_id: 'a', position: 20 }), carte({ id: 'a2', parent_id: 'a', position: 10 }),
    carte({ id: 'b1', parent_id: 'b' }), carte({ id: 'c1', parent_id: 'c' })];

  it("les parties sont rangées dans l'ordre choisi", () => {
    expect(enfantsDe(toutes, 'a').map((c) => c.id)).toEqual(['a2', 'a1']);
    expect(enfantsDe(toutes, null).map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });
  it('accès au format « Qui voit »', () => {
    expect(accesVocab(groupe)).toEqual({ mode: 'certains', groupes: ['g1'], eleves: ['e9'] });
  });
  it('badge et pages', () => {
    expect(badgeVisibilite(cachee)?.texte).toBe('🔒 caché aux élèves');
    expect(badgeVisibilite(ouverte)).toBeNull();
    expect(badgeVisibilite(groupe)?.texte).toBe('🎯 certains (2)');
    expect(textePages({ page_debut: 3, page_fin: 21 })).toBe('p. 3 à 21');
    expect(textePages({ page_debut: 1, page_fin: 1 })).toBe('p. 1');
    expect(textePages({ page_debut: null, page_fin: null })).toBe('');
  });
  it('chapitres : lettre et page de l’adresse', () => {
    expect([0, 1, 11, 25, 26].map(lettreChapitre)).toEqual(['A', 'B', 'L', 'Z', '27']);
    expect(pageDeLAdresse('12')).toBe(12);
    expect(pageDeLAdresse('0')).toBeNull();
    expect(pageDeLAdresse('-3')).toBeNull();
    expect(pageDeLAdresse('abc')).toBeNull();
    expect(pageDeLAdresse(null)).toBeNull();
  });
  it('les chapitres d’une partie ne se mélangent pas aux parties', () => {
    const avecChapitres = [...toutes, carte({ id: 'a2-ch1', parent_id: 'a2', position: 10 })];
    expect(enfantsDe(avecChapitres, 'a').map((c) => c.id)).toEqual(['a2', 'a1']);
    expect(enfantsDe(avecChapitres, 'a2').map((c) => c.id)).toEqual(['a2-ch1']);
  });
});
