import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PARTIES_FICHE, champsVides, degreValide, explicationDe, nettoyerValeurs, partiesAffichees, requisManquant, tailleArabeTuile,
  valeursPartie, type FicheNom,
} from './ficheNomAllah';

const racine = resolve(__dirname, '../..');
const fiches = JSON.parse(readFileSync(resolve(racine, 'supabase/data/allah_names_fiches_2026-11-27.json'), 'utf8')) as Array<Record<string, unknown>>;
const migration = readFileSync(resolve(racine, 'supabase/migrations/20261127150000_fiches_99_noms.sql'), 'utf8');

const base: FicheNom = { id: 1, display_order: 1, name_arabic: 'الرَّحْمَنُ', transliteration: 'Ar-Rahmân', name_french: 'Le Très Miséricordieux', explanation: 'Ancienne explication.' };

describe('Fiche : les 9 parties, dans l\'ordre demandé par Nadia', () => {
  it('ordre et titres', () => {
    expect(PARTIES_FICHE.map((p) => p.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(PARTIES_FICHE.map((p) => p.cle)).toEqual(['arabe', 'translit', 'signification', 'explication', 'preuve', 'moment', 'invocation', 'reference', 'divergences']);
    expect(PARTIES_FICHE[0].titre).toBe('Nom en arabe');
    expect(PARTIES_FICHE[7].titre).toMatch(/Référence précise et degré d'authenticité/);
    expect(PARTIES_FICHE[8].titre).toMatch(/Divergences/);
  });
  it('élève : seulement les parties remplies, toujours dans l\'ordre ; enseignante : les 9', () => {
    const f = { ...base, fiche_moment: 'Le soir.', fiche_divergences: 'Aucune.' };
    expect(partiesAffichees(f, false).map((p) => p.numero)).toEqual([1, 2, 3, 4, 6, 9]);
    expect(partiesAffichees(f, true)).toHaveLength(9);
  });
  it('une fiche remplie par la migration montre les 9 parties dans l\'ordre', () => {
    const f = fiches[0] as unknown as FicheNom;
    expect(partiesAffichees({ ...base, ...f }, false).map((p) => p.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
  it('l\'explication détaillée reprend l\'ancienne si elle est vide', () => {
    expect(explicationDe(base)).toBe('Ancienne explication.');
    expect(explicationDe({ ...base, fiche_explication: 'Nouvelle.' })).toBe('Nouvelle.');
  });
});

describe('Fiche : ✏️ modifier une partie', () => {
  const preuve = PARTIES_FICHE.find((p) => p.cle === 'reference')!;
  it('nettoyage : texte vide → rien, degré inconnu refusé', () => {
    const v = nettoyerValeurs(preuve, { fiche_preuve_reference: '  ', fiche_preuve_degre: 'tres-sur', fiche_invocation_degre: 'hasan' });
    expect(v.fiche_preuve_reference).toBeNull();
    expect(v.fiche_preuve_degre).toBeNull();
    expect(v.fiche_invocation_degre).toBe('hasan');
  });
  it('une partie vidée est repérée (son ancienne version part à la corbeille)', () => {
    const avant = valeursPartie(PARTIES_FICHE[5], { ...base, fiche_moment: 'Le soir.' });
    expect(champsVides(avant, { fiche_moment: null })).toEqual(['fiche_moment']);
    expect(champsVides(avant, { fiche_moment: 'Le matin.' })).toEqual([]);
  });
  it('le nom en arabe, la translittération et le sens court ne peuvent pas être vidés', () => {
    expect(requisManquant(PARTIES_FICHE[0], { name_arabic: '' })?.col).toBe('name_arabic');
    expect(requisManquant(PARTIES_FICHE[2], { name_french: 'X', fiche_signification: null })).toBeNull();
  });
  it('degrés permis = ceux de la pastille commune', () => {
    expect(['sahih', 'hasan', 'daif', 'mawdou', 'coran'].map(degreValide)).toEqual(['sahih', 'hasan', 'daif', 'mawdou', 'coran']);
    expect(degreValide('autre')).toBeNull();
  });
});

describe('Tuiles : nom en arabe doublé, plus petit seulement pour un mot très long', () => {
  it('tailles', () => {
    expect(tailleArabeTuile('الرَّحْمَنُ')).toBe(48);
    expect(tailleArabeTuile('المُتَكَبِّرُ')).toBeLessThanOrEqual(48);
    expect(tailleArabeTuile('ذُو الجَلَالِ وَالإِكْرَامِ')).toBeGreaterThanOrEqual(36);
  });
});

describe('Contenu des 99 fiches (migration 20261127150000) — règle n°1', () => {
  it('99 fiches, une par nom, toutes « à relire par Nadia »', () => {
    expect(fiches).toHaveLength(99);
    expect(new Set(fiches.map((f) => f.display_order)).size).toBe(99);
    expect(fiches.every((f) => f.fiche_a_relire === true)).toBe(true);
  });
  it('chaque preuve a son texte arabe, sa traduction, sa référence et son degré', () => {
    for (const f of fiches) {
      expect(f.fiche_preuve_arabe, String(f.display_order)).toBeTruthy();
      expect(f.fiche_preuve_francais).toBeTruthy();
      expect(f.fiche_preuve_reference).toBeTruthy();
      expect(degreValide(f.fiche_preuve_degre as string)).not.toBeNull();
      expect(f.fiche_preuve_degre === 'coran').toBe(f.fiche_preuve_type === 'coran');
    }
  });
  it('invocation : authentique avec source et degré, OU personnelle sans degré', () => {
    for (const f of fiches) {
      expect(f.fiche_invocation_francais).toBeTruthy();
      if (f.fiche_invocation_personnelle) {
        expect(f.fiche_invocation_degre, String(f.display_order)).toBeNull();
        expect(f.fiche_invocation_reference).toBeNull();
      } else {
        expect(f.fiche_invocation_arabe, String(f.display_order)).toBeTruthy();
        expect(f.fiche_invocation_reference).toBeTruthy();
        expect(degreValide(f.fiche_invocation_degre as string)).not.toBeNull();
      }
    }
  });
  it('aucun hadith faible ou inventé n\'est utilisé comme preuve ou invocation', () => {
    for (const f of fiches) {
      expect(['daif', 'mawdou']).not.toContain(f.fiche_preuve_degre);
      expect(['daif', 'mawdou']).not.toContain(f.fiche_invocation_degre);
    }
  });
  it('la note générale sur la liste d\'At-Tirmidhî (3507) est dans chaque fiche', () => {
    for (const f of fiches) expect(String(f.fiche_divergences)).toMatch(/Al-Boukhârî 2736, Mouslim 2677.*At-Tirmidhî \(n° 3507\)/s);
  });
  it('Al-Hâdî et An-Noûr : statut de nom discuté, écrit clairement', () => {
    for (const n of [93, 94]) {
      const f = fiches.find((x) => x.display_order === n)!;
      expect(f.fiche_statut_nom).toBe('discute');
      expect(String(f.fiche_divergences)).toMatch(/savants/);
    }
  });
  it('la migration ne fait qu\'ajouter et ne réécrit jamais une fiche déjà remplie', () => {
    expect(migration).not.toMatch(/\bdrop\b|\btruncate\b|\bdelete\s+from\b/i);
    expect(migration.match(/^update public\.allah_names/gm)).toHaveLength(99);
    expect(migration.match(/and fiche_explication is null;/g)).toHaveLength(99);
    for (const f of fiches) expect(migration).toContain(`where id = ${f.id} and display_order = ${f.display_order} and fiche_explication is null`);
  });
});
