import { describe, it, expect, beforeEach } from 'vitest';
import { brouillonDe, enregistrerBrouillon, formVide, itemsDuFormulaire, lireBrouillons } from '@/lib/devoirsEleve';
import { lignesHabituelles } from '@/lib/devoirFichiers';

// 📚 Devoirs élève par élève (2026-11-11)
describe('itemsDuFormulaire', () => {
  const lignes = lignesHabituelles();
  it('une ligne remplie = un devoir', () => {
    const f = { ...formVide(), lignes: { nourania: 'revoir la leçon 7' } };
    const it = itemsDuFormulaire(f, lignes);
    expect(it).toHaveLength(1);
    expect(it[0]).toMatchObject({ titre: 'revoir la leçon 7', type: 'nourania', cible: '' });
  });
  it('3 invocations cochées = 1 devoir « Invocations » en 3 étapes (un seul 💎)', () => {
    const f = { ...formVide(), lignes: { invocations: 'apprendre' }, cibles: { invocations: [{ v: '1', l: 'Réveil' }, { v: '2', l: 'Dormir' }, { v: '3', l: 'Manger' }] } };
    const it = itemsDuFormulaire(f, lignes);
    expect(it).toHaveLength(1);
    expect(it[0].etapes).toEqual(['apprendre : Réveil', 'apprendre : Dormir', 'apprendre : Manger']);
    expect(it[0].cible).toBe('1');
  });
  it('plusieurs lignes dans « Sourate » = 1 devoir en étapes (Yacine)', () => {
    const f = { ...formVide(), lignes: { sourate: 'réciter Al-Fatiha', nourania: 'leçon 7' }, plus: { sourate: [{ texte: 'apprendre Al-Ikhlas', cibles: [] }, { texte: '  ', cibles: [] }] } };
    const it = itemsDuFormulaire(f, lignes);
    expect(it).toHaveLength(2);
    const s = it.find((x) => x.type === 'sourate')!;
    expect(s.etapes).toEqual(['réciter Al-Fatiha', 'apprendre Al-Ikhlas']);
    expect(s.titre).toBe('réciter Al-Fatiha · apprendre Al-Ikhlas');
    expect(it.find((x) => x.type === 'nourania')!.etapes).toEqual([]);
  });
  it('un seul élément choisi : le titre reste la consigne', () => {
    const f = { ...formVide(), lignes: { sourate: 'apprendre Al-Falaq' }, cibles: { sourate: [{ v: '113', l: '113 · Al-Falaq' }] } };
    expect(itemsDuFormulaire(f, lignes)[0]).toMatchObject({ titre: 'apprendre Al-Falaq', cible: '113' });
  });
  it('lignes vides ignorées ; devoir détaillé', () => {
    expect(itemsDuFormulaire({ ...formVide(), lignes: { nourania: '   ' } }, lignes)).toHaveLength(0);
    const d = { ...formVide(), parMatiere: false, titre: 'Fiche', type: 'autre', etapes: 'Ligne 1\n\nLigne 2' };
    expect(itemsDuFormulaire(d, lignes)[0]).toMatchObject({ titre: 'Fiche', type: 'autre', etapes: ['Ligne 1', 'Ligne 2'] });
  });
});

describe('brouillon par élève', () => {
  beforeEach(() => localStorage.clear());
  it('chaque élève garde le sien, un formulaire vide efface le brouillon', () => {
    enregistrerBrouillon('bilal', 'Bilal', { ...formVide(), lignes: { nourania: 'leçon 7' } });
    enregistrerBrouillon('reda', 'Réda', { ...formVide(), lignes: { sourate: 'Al-Ikhlas' } });
    expect(brouillonDe('bilal').lignes.nourania).toBe('leçon 7');
    expect(brouillonDe('reda').lignes.sourate).toBe('Al-Ikhlas');
    enregistrerBrouillon('bilal', 'Bilal', formVide());
    expect(Object.keys(lireBrouillons().parEleve)).toEqual(['reda']);
    expect(brouillonDe('inconnu')).toEqual(formVide());
  });
});
