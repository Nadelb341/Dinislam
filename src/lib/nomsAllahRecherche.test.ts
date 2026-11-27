import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normaliserArabe, normaliserLatin, rechercherNoms, sansArticle, type NomCherchable } from './nomsAllahRecherche';

// Les 99 noms tels qu'ils sont en base (copie de la fiche de données de la migration 20261127150000)
const fiches = JSON.parse(readFileSync(resolve(__dirname, '../../supabase/data/allah_names_fiches_2026-11-27.json'), 'utf8')) as Array<{
  id: number; display_order: number; transliteration: string; fiche_signification: string; fiche_explication: string;
}>;
const ARABE: Record<number, string> = { 1: 'الرَّحْمَنُ', 2: 'الرَّحِيمُ', 3: 'المَلِكُ', 14: 'الغَفَّارُ', 34: 'الغَفُورُ', 63: 'القَيُّومُ', 84: 'مَالِكُ المُلْكِ', 85: 'ذُو الجَلَالِ وَالإِكْرَامِ', 6: 'المُؤْمِنُ', 83: 'الرَّؤُوفُ' };
const FR: Record<number, string> = { 1: 'Le Très Miséricordieux', 2: 'Le Très Compatissant', 3: 'Le Roi Absolu', 14: 'Le Grand Pardonneur', 34: 'Le Pardonneur', 26: 'L\'Omniscient (par l\'ouïe)', 80: 'Celui qui accepte le repentir' };
const NOMS: NomCherchable[] = fiches.map((f) => ({
  id: f.id, display_order: f.display_order, transliteration: f.transliteration,
  name_arabic: ARABE[f.display_order] ?? 'اسم', name_french: FR[f.display_order] ?? `Nom ${f.display_order}`,
  fiche_signification: f.fiche_signification, fiche_explication: f.fiche_explication,
}));
const premier = (q: string) => rechercherNoms(NOMS, q)[0]?.nom.display_order;
const tous = (q: string) => rechercherNoms(NOMS, q).map((r) => r.nom.display_order);

describe('Recherche : phonétique tolérante', () => {
  it('avec ou sans accents, tirets, « Al- » et lettres doublées', () => {
    for (const q of ['Ar-Rahmân', 'ar-rahman', 'Rahmân', 'rahman', 'arrahman', 'Ar Rahman', 'AR-RAHMAAN', 'al rahman']) {
      expect(premier(q), q).toBe(1);
    }
  });
  it('« ou » à la française, « ch » = « sh », « dh » = « z »', () => {
    expect(premier('Qouddous')).toBe(4);
    expect(premier('Al-Quddûs')).toBe(4);
    expect(premier('Chakour')).toBe(35);
    expect(premier('ash-shakur')).toBe(35);
    expect(premier('hafidh')).toBe(38);
    expect(premier('Moumin')).toBe(6);
    expect(premier("Al-Mu'min")).toBe(6);
  });
  it('un nom à article assimilé et un nom à « Al- » ne se confondent pas', () => {
    expect(premier('Aziz')).toBe(8);
    expect(premier('Al-Azîz')).toBe(8);
    expect(premier('Tawwâb')).toBe(80);
    expect(premier('At-Tawwab')).toBe(80);
    expect(premier('Ahad')).toBe(67);
  });
  it('les noms en plusieurs mots', () => {
    expect(premier('Mâlik al-Mulk')).toBe(84);
    expect(premier('dhul jalal')).toBe(85);
  });
  it('fonctions de base', () => {
    expect(normaliserLatin("Al-Mu'akhkhir")).toBe('almuakhkhir');
    expect(sansArticle('arahman')).toBe('rahman');
    expect(sansArticle('aladl')).toBe('adl');
    expect(sansArticle('adl')).toBe('adl');
  });
});

describe('Recherche : arabe avec ou sans voyelles', () => {
  it('avec voyelles, sans voyelles, sans « ال »', () => {
    expect(premier('الرَّحْمَنُ')).toBe(1);
    expect(premier('الرحمن')).toBe(1);
    expect(premier('رحمن')).toBe(1);
    expect(premier('يا رحمن')).toBe(1);
  });
  it('hamza et alif écrits autrement', () => {
    expect(premier('المؤمن')).toBe(6);
    expect(premier('مومن')).toBe(6);
    expect(tous('رءوف')).toContain(83);
  });
  it('« الملك » trouve Al-Malik d\'abord, puis Mâlik al-Mulk', () => {
    const r = tous('الملك');
    expect(r[0]).toBe(3);
    expect(r).toContain(84);
  });
  it('normalisation', () => {
    expect(normaliserArabe('القَيُّومُ')).toBe('قيوم');
  });
});

describe('Recherche : numéro, français, sens', () => {
  it('par numéro', () => {
    expect(tous('12')).toEqual([12]);
    expect(tous('n°99')).toEqual([99]);
    expect(tous('#1')).toEqual([1]);
    expect(tous('150')).toEqual([]);
  });
  it('par le titre en français, sans accents', () => {
    expect(tous('misericordieux')).toContain(1);
    expect(tous('Pardonneur')).toEqual(expect.arrayContaining([14, 34]));
    expect(tous('repentir')[0]).toBe(80);
  });
  it('par le sens (signification ou explication)', () => {
    expect(tous('subsistance')).toContain(17);
    expect(tous('lumière')).toContain(93);
  });
  it('rien trouvé → liste vide (la page affiche un message clair) ; recherche vide → rien', () => {
    expect(tous('zzzzqqq')).toEqual([]);
    expect(tous('zzzz')).toEqual([]);
    expect(tous('   ')).toEqual([]);
  });
});
