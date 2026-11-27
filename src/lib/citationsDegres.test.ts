import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { degreAffiche } from './degreAuthenticite';
import { HADITHS_SECOURS } from './hadithsDuJour';
import { TREASURES } from './weeklyProgram';
import { QUESTIONS_FEU, MOTS_GENTILS } from '@/components/saisons/jeuxSaisonLogique';
import { INVOCATIONS_ENRICHMENT } from '@/data/invocationsData';
import { DHIKR_GESTES_SECOURS, DHIKR_ITEMS_SECOURS, DHIKR_QUIZ_SECOURS } from '@/data/dhikrContenu';
import { NIVEAUX_DEPART, contenuNiveaux, quizNiveaux } from '@/data/niveauxAuthenticite';

/**
 * 🕌 Règle n°1 (27/11) : toute citation écrite dans le code a un degré d'authenticité affichable
 * (donné, ou deviné d'après la source). Une nouvelle citation sans degré fait échouer ce test.
 */
const sansDegre = (l: { source?: string | null; degre?: string | null }[]) =>
  l.filter((x) => (x.source ?? '').trim() && !degreAffiche(x.source, x.degre).degre).map((x) => x.source);

describe('toutes les citations ont un degré', () => {
  it('hadith du jour (secours) : seul « Ibn Hibbane » reste à vérifier', () => {
    expect(sansDegre(HADITHS_SECOURS)).toEqual(['Ibn Hibbane']);
  });
  it('trésor de la semaine, coin du feu, cache-cache', () => {
    expect(sansDegre(TREASURES)).toEqual([]);
    expect(sansDegre(QUESTIONS_FEU)).toEqual([]);
    expect(sansDegre(MOTS_GENTILS)).toEqual([]);
  });
  it('invocations de l\'appli', () => {
    expect(sansDegre(INVOCATIONS_ENRICHMENT)).toEqual([]);
  });
  it('dhikr (copie de secours)', () => {
    expect(sansDegre(DHIKR_ITEMS_SECOURS)).toEqual([]);
    expect(sansDegre(DHIKR_GESTES_SECOURS)).toEqual([]);
    expect(sansDegre(DHIKR_QUIZ_SECOURS)).toEqual([]);
  });
  it('chaque parole « Le Prophète ﷺ a dit » du cache-cache a une source avec un numéro', () => {
    for (const m of MOTS_GENTILS.filter((x) => x.texte.includes('Prophète'))) expect(m.source).toMatch(/\d/);
  });
});

describe('carte « Niveaux d\'authenticité »', () => {
  it('4 niveaux, chacun avec sa phrase, un exemple et une référence', () => {
    expect(NIVEAUX_DEPART.niveaux.map((n) => n.cle)).toEqual(['sahih', 'hasan', 'daif', 'mawdou']);
    for (const n of NIVEAUX_DEPART.niveaux) { expect(n.phrase).toBeTruthy(); expect(n.exemple).toBeTruthy(); expect(n.exemple_source).toBeTruthy(); }
    expect(NIVEAUX_DEPART.divergence).toContain('au lieu de choisir arbitrairement un avis');
    expect(NIVEAUX_DEPART.fadail).toContain("Fada'il al-A'mal");
    expect(NIVEAUX_DEPART.ordre).toHaveLength(5);
  });
  it('un réglage abîmé ou incomplet ne casse rien (texte de départ)', () => {
    expect(contenuNiveaux(null)).toEqual(NIVEAUX_DEPART);
    expect(contenuNiveaux({ intro: 'X', niveaux: [{ cle: 'hasan', phrase: 'P' }], ordre: [] })).toMatchObject({ intro: 'X', ordre: NIVEAUX_DEPART.ordre });
    expect(contenuNiveaux({ niveaux: [{ cle: 'hasan', phrase: 'P' }] }).niveaux[1].phrase).toBe('P');
  });
  it('quiz : 4 questions, la bonne réponse existe', () => {
    const q = quizNiveaux(NIVEAUX_DEPART);
    expect(q).toHaveLength(4);
    expect(q.map((x) => x.choix[x.bonne])).toEqual(['Authentique', 'Bon', 'Inventé', 'Non, jamais']);
  });
  it('le texte de départ = celui de la migration', () => {
    const sql = readFileSync('supabase/migrations/20261127180000_degres_authenticite.sql', 'utf-8');
    const json = sql.match(/\$json\$(.*)\$json\$/s)![1];
    expect(JSON.parse(json)).toEqual(NIVEAUX_DEPART);
  });
});
