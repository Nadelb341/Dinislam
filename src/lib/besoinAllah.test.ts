import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { BESOINS_ALLAH } from '@/data/besoinsAllah';
import {
  assemblerBesoins, avancee, basculerFavori, besoinsDeSecours, compteARebours, couleurAvancee, dureeEcran, ecransHistoire, facteurPolice,
  lireFavoris, texteSur, texteVoix, tiretsRemplis, trierAvecFavoris, type LigneBesoin, type LigneNomBesoin,
} from './besoinAllah';

describe('Histoire : ordre des écrans', () => {
  const b = besoinsDeSecours().find((x) => x.cle === 'culpabilite')!;
  it('accueil, puis chaque nom dans l\'ordre, puis la fin', () => {
    const e = ecransHistoire(b);
    expect(e).toHaveLength(b.noms.length + 2);
    expect(e[0].type).toBe('accueil');
    expect(e[e.length - 1].type).toBe('fin');
    const noms = e.filter((x) => x.type === 'nom');
    expect(noms.map((x) => (x.type === 'nom' ? x.nom.phonetique : ''))).toEqual(
      ['At-Tawwâb', 'Al-Ghaffâr', 'Al-Ghafoûr', 'Al-\'Afouww', 'Ar-Raoûf', 'Al-Halîm', 'Ar-Rahmân']);
    expect(noms.map((x) => (x.type === 'nom' ? `${x.numero}/${x.total}` : ''))[4]).toBe('5/7');
  });
  it('une émotion sans nom = accueil puis fin', () => {
    expect(ecransHistoire({ noms: [] }).map((x) => x.type)).toEqual(['accueil', 'fin']);
  });
  it('la fin reste plus longtemps en lecture automatique', () => {
    expect(dureeEcran({ type: 'fin' })).toBeGreaterThan(dureeEcran({ type: 'accueil' }));
  });
  it('la voix ne lit que le français (jamais le Coran en arabe)', () => {
    expect(texteVoix({ type: 'fin' }, b)).toBe(b.fin_traduction);
    expect(texteVoix({ type: 'fin' }, b)).not.toMatch(/[؀-ۿ]/);
  });
});

describe('Compte à rebours 99 → 0 et tirets', () => {
  it('99 à l\'accueil, 0 à la fin, toujours en descendant', () => {
    const n = 9;
    const l = Array.from({ length: n }, (_, i) => compteARebours(i, n));
    expect(l[0]).toBe(99);
    expect(l[n - 1]).toBe(0);
    for (let i = 1; i < n; i++) expect(l[i]).toBeLessThan(l[i - 1]);
  });
  it('un seul écran = 0 (rien ne plante)', () => {
    expect(compteARebours(0, 1)).toBe(0);
    expect(avancee(5, 3)).toBe(1);
  });
  it('les tirets se remplissent jusqu\'à l\'écran en cours', () => {
    expect(tiretsRemplis(2, 5)).toEqual([true, true, true, false, false]);
  });
});

describe('Couleur selon l\'avancée', () => {
  it('orange-rouge au début, vert-jaune au milieu, bleu-vert à la fin', () => {
    expect(couleurAvancee(0)).toBe('#f25c3b');
    expect(couleurAvancee(0.5)).toBe('#bedc46');
    expect(couleurAvancee(1)).toBe('#2dd4bf');
  });
  it('glisse sans à-coup et reste dans les bornes', () => {
    const rouge = (c: string) => parseInt(c.slice(1, 3), 16);
    expect(rouge(couleurAvancee(0.25))).toBeLessThan(242);
    expect(rouge(couleurAvancee(0.25))).toBeGreaterThan(190);
    expect(couleurAvancee(-3)).toBe('#f25c3b');
    expect(couleurAvancee(8)).toBe('#2dd4bf');
    expect(couleurAvancee(Number.NaN)).toBe('#f25c3b');
  });
  it('nom arabe : plus le mot est long, plus il est petit (voyelles non comptées), jamais au-delà du maximum', () => {
    expect(facteurPolice('الحَقُّ')).toBe(0.24);
    expect(facteurPolice('الغَفُورُ')).toBeLessThan(facteurPolice('الحَقُّ'));
    expect(facteurPolice('الغَفُورُ')).toBe(facteurPolice('الغفور'));
    expect(facteurPolice('ذُو الجَلَالِ وَالإِكْرَامِ')).toBe(facteurPolice('والإكرام'));
  });
  it('texte lisible sur la couleur d\'une émotion', () => {
    expect(texteSur('#1e3a8a')).toBe('#ffffff');
    expect(texteSur('#fde68a')).toBe('#1f2937');
  });
});

describe('❤️ Favoris sur l\'appareil', () => {
  beforeEach(() => localStorage.clear());
  it('ajoute puis retire, et les favoris passent en premier', () => {
    expect(lireFavoris()).toEqual([]);
    expect(basculerFavori('peur')).toEqual(['peur']);
    expect(lireFavoris()).toEqual(['peur']);
    const l = trierAvecFavoris(besoinsDeSecours(), lireFavoris());
    expect(l[0].cle).toBe('peur');
    expect(basculerFavori('peur')).toEqual([]);
  });
  it('mémoire abîmée → aucun favori (pas d\'erreur)', () => {
    localStorage.setItem('dinislam_besoin_allah_favoris', '{oups');
    expect(lireFavoris()).toEqual([]);
  });
});

describe('Base ou copie de secours', () => {
  it('rien en base → les 12 émotions de départ, liens vers les 99 noms par leur transcription', () => {
    const l = assemblerBesoins([], [], [{ id: 80, transliteration: 'At-Tawwâb' }]);
    expect(l).toHaveLength(12);
    const c = l.find((x) => x.cle === 'culpabilite')!;
    expect(c.noms[0].nom_id).toBe(80);
    expect(c.noms[1].nom_id).toBeNull();
  });
  it('lignes de la base : rangées par position, noms rattachés à leur émotion', () => {
    const lignes: LigneBesoin[] = [
      { id: 'b', cle: 'b', emoji: '😊', titre: 'B', couleur: '#000000', accroche: '', accroche_doree: '', conseil: null, fin_arabe: null,
        fin_phonetique: null, fin_traduction: null, fin_source: null, a_verifier: null, note: null, position: 20 },
      { id: 'a', cle: 'a', emoji: '😢', titre: 'A', couleur: '#000000', accroche: '', accroche_doree: '', conseil: null, fin_arabe: null,
        fin_phonetique: null, fin_traduction: null, fin_source: null, a_verifier: true, note: 'x', position: 10 },
    ];
    const noms: LigneNomBesoin[] = [
      { id: 'n2', besoin_id: 'a', nom_id: 2, arabe: 'ب', phonetique: '2', sens: 's', attestation: null, a_verifier: null, note: null, position: 20 },
      { id: 'n1', besoin_id: 'a', nom_id: null, arabe: 'ا', phonetique: '1', sens: 's', attestation: 'Coran 1:1', a_verifier: null, note: null, position: 10 },
    ];
    const l = assemblerBesoins(lignes, noms);
    expect(l.map((x) => x.cle)).toEqual(['a', 'b']);
    expect(l[0].noms.map((x) => x.phonetique)).toEqual(['1', '2']);
    expect(l[1].noms).toEqual([]);
    expect(l[0].a_verifier).toBe(true);
  });
});

describe('🕌 Contenu de départ (règle n°1)', () => {
  it('12 émotions, clés uniques, 5 à 7 noms chacune', () => {
    expect(BESOINS_ALLAH).toHaveLength(12);
    expect(new Set(BESOINS_ALLAH.map((b) => b.cle)).size).toBe(12);
    for (const b of BESOINS_ALLAH) {
      expect(b.noms.length, b.cle).toBeGreaterThanOrEqual(5);
      expect(b.noms.length, b.cle).toBeLessThanOrEqual(7);
    }
  });
  it('chaque nom et chaque fin ont une source : Coran, Al-Boukhârî ou Mouslim', () => {
    const ok = /^(Coran \d+:\d+|Al-Boukhârî \d+|Mouslim \d+)/;
    for (const b of BESOINS_ALLAH) {
      expect(b.fin_source, b.cle).toMatch(ok);
      expect(b.fin_arabe.trim(), b.cle).not.toBe('');
      for (const n of b.noms) expect(n.attestation, `${b.cle} ${n.phonetique}`).toMatch(ok);
    }
  });
  it('aucun nom non attesté dans le Coran / Al-Boukhârî / Mouslim (liste d\'At-Tirmidhî seulement)', () => {
    const interdits = ['As-Sabûr', 'Ar-Rashîd', 'Al-\'Adl', 'Al-Muqsit', 'Ad-Dârr', 'An-Nâfi\'', 'Al-Mâni\'', 'Al-Muntaqim', 'Al-Mudhill'];
    for (const b of BESOINS_ALLAH) for (const n of b.noms) expect(interdits, `${b.cle} ${n.base}`).not.toContain(n.base);
  });
  it('les listes données par Nadia sont respectées (culpabilité et rizq)', () => {
    const f = (cle: string) => BESOINS_ALLAH.find((b) => b.cle === cle)!;
    expect(f('culpabilite').fin_source).toBe('Coran 39:53');
    expect(f('rizq').fin_source).toBe('Coran 51:22');
    expect(f('rizq').noms.map((n) => n.phonetique)).toEqual(['Ar-Razzâq', 'Al-Fattâh', 'Al-Wahhâb', 'Al-Karîm', 'Al-Ghanî', 'Al-Moujîb', 'Al-Wakîl']);
  });
  it('la migration contient exactement le même contenu que la copie de secours', () => {
    const sql = readFileSync(resolve(__dirname, '../../supabase/migrations/20261127120000_besoin_allah.sql'), 'utf8');
    const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
    for (const b of BESOINS_ALLAH) {
      for (const champ of [b.titre, b.accroche, b.conseil, b.fin_arabe, b.fin_phonetique, b.fin_traduction, b.fin_source]) {
        expect(sql.includes(q(champ)), `${b.cle} : ${champ.slice(0, 40)}`).toBe(true);
      }
      for (const n of b.noms) {
        expect(sql.includes(`(${q(b.cle)}, ${n.base ? q(n.base) : 'null'}, ${q(n.arabe)}, ${q(n.phonetique)}, ${q(n.sens)}, ${q(n.attestation)}`), `${b.cle} ${n.phonetique}`).toBe(true);
      }
    }
  });
});
