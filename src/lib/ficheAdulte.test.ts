import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { blocs, lireFicheAdulte, LISTES_AUTHENTICITE, nomsDeLaListe, numerosSections } from './ficheAdulte';

const racine = path.resolve(__dirname, '../..');
const donnees = JSON.parse(fs.readFileSync(path.join(racine, 'supabase/data/allah_names_fiches_adultes_2026-11-27.json'), 'utf8')) as
  { numero_appli: number; numero_source: number; translit: string; statut: string; classement: string; sections: { type: string; texte?: string; note?: string }[] }[];
const migration = fs.readFileSync(path.join(racine, 'supabase/migrations/20261127200000_fiches_adultes_99_noms.sql'), 'utf8');

describe('🌟 fiches adultes de Nadia (99 noms)', () => {
  it('82 fiches, numéros de l’appli uniques, décalage de ChatGPT à partir de 67 (Al-Ahad)', () => {
    expect(donnees).toHaveLength(82);
    expect(new Set(donnees.map((d) => d.numero_appli)).size).toBe(82);
    const samad = donnees.find((d) => d.translit === 'As-Samad')!;
    expect([samad.numero_appli, samad.numero_source]).toEqual([68, 67]);
    const darr = donnees.find((d) => d.translit === 'Ad-Dârr')!;
    expect([darr.numero_appli, darr.statut]).toEqual([91, 'non_etabli']);
    // Fiches pas encore fournies : rien d'inventé
    for (const n of [13, 14, 15, 16, 17, 18, 19, 20, 67, 92, 93, 94, 95, 96, 97, 98, 99]) {
      expect(donnees.some((d) => d.numero_appli === n)).toBe(false);
    }
  });

  it('chaque fiche se lit, et la migration contient chacune au bon numéro', () => {
    for (const d of donnees) {
      const f = lireFicheAdulte(d);
      expect(f, d.translit).not.toBeNull();
      expect(f!.sections.length).toBeGreaterThan(2);
      expect(migration).toContain(`where display_order = ${d.numero_appli} and fiche_adulte is null;`);
    }
  });

  it('une invocation personnelle n’est jamais présentée sans être une invocation personnelle', () => {
    for (const d of donnees) {
      for (const s of d.sections.filter((x) => x.type === 'invocation')) {
        expect(s.texte, d.translit).toBeTruthy();
      }
    }
  });

  it('les listes du bouton « Authenticité » couvrent chaque fiche une seule fois', () => {
    const noms = donnees.map((d) => ({ display_order: d.numero_appli, fiche_adulte: d }));
    const total = LISTES_AUTHENTICITE.reduce((s, l) => s + nomsDeLaListe(noms, l.classements).length, 0);
    expect(total).toBe(82);
    const sunna = nomsDeLaListe(noms, ['sunna']).map((n) => n.display_order);
    expect(sunna).toEqual([72]);
  });

  it('blocs : paragraphes et puces ; l’encadré de divergence n’est pas numéroté', () => {
    expect(blocs('Un.\n\n- a\n- b\nFin.')).toEqual([
      { type: 'p', texte: 'Un.' }, { type: 'liste', puces: ['a', 'b'] }, { type: 'p', texte: 'Fin.' },
    ]);
    expect(numerosSections([{ type: 'texte', titre: 'a' }, { type: 'divergence', titre: 'b' }, { type: 'texte', titre: 'c' }])).toEqual([1, null, 2]);
    expect(lireFicheAdulte(null)).toBeNull();
    expect(lireFicheAdulte({ translit: 'x' })).toBeNull();
  });
});
