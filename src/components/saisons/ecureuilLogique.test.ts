import { describe, it, expect } from 'vitest';
import {
  PAGE_SECOURS, PROBA_MAISON, apresTrouve, avancer, choisirPage, dureeMaisonConnexion, dureeRetour, emojiPage, etatDeDepart,
  niveauIndice, ordreAuHasard, positionDansPage, repereCourt, texteIndice,
} from './ecureuilLogique';

const PAGES = [{ chemin: '/priere', nom: 'Prière' }, { chemin: '/sourates', nom: 'Sourates' }, { chemin: '/alphabet', nom: 'Alphabet' }];

describe('🐿️ indices de l\'écureuil : 20 s, 35 s, 45 s', () => {
  it('rien avant 20 s, puis 3 indices de plus en plus précis', () => {
    expect(niveauIndice(0)).toBe(0);
    expect(niveauIndice(19_999)).toBe(0);
    expect(niveauIndice(20_000)).toBe(1);
    expect(niveauIndice(34_999)).toBe(1);
    expect(niveauIndice(35_000)).toBe(2);
    expect(niveauIndice(44_999)).toBe(2);
    expect(niveauIndice(45_000)).toBe(3);
    expect(niveauIndice(600_000)).toBe(3);
  });
  it('textes : la page, puis le repère, puis « je remue »', () => {
    expect(texteIndice(0, { surLaPage: false, nomPage: 'Prière' })).toBeNull();
    expect(texteIndice(1, { surLaPage: false, nomPage: 'Prière' })).toBe('Psst ! Je suis caché dans la page « Prière » 🕌');
    expect(texteIndice(2, { surLaPage: true, nomPage: 'Prière', repere: 'Les ablutions', ou: 'en haut' })).toBe('Je suis tout près de « Les ablutions », en haut 🔍');
    expect(texteIndice(3, { surLaPage: true, nomPage: 'Prière' })).toContain('je remue');
    expect(texteIndice(3, { surLaPage: false, nomPage: 'Prière' })).toContain('Y aller');
  });
});

describe('🏡 maisonnette : connexion, trouvé, retour', () => {
  it('à la connexion : chez lui environ 2 fois sur 5', () => {
    expect(PROBA_MAISON).toBeGreaterThanOrEqual(1 / 3);
    expect(PROBA_MAISON).toBeLessThanOrEqual(1 / 2);
    expect(etatDeDepart(1000, PAGES, 0.1, 0, 0.5).lieu).toBe('maison');
    expect(etatDeDepart(1000, PAGES, 0.9, 0, 0.5)).toEqual({ lieu: 'cache', chemin: '/priere', nomPage: 'Prière', depuis: 1000, graine: 0.5 });
    // tirage de 1000 connexions « au hasard » régulier : environ 40 % à la maison
    let n = 0;
    for (let i = 0; i < 1000; i++) if (etatDeDepart(0, PAGES, (i + 0.5) / 1000, 0.5, 0.5).lieu === 'maison') n++;
    expect(n).toBe(400);
  });
  it('trouvé → il rentre chez lui 1 à 2 minutes maximum, puis repart ailleurs', () => {
    expect(dureeRetour(0)).toBe(60_000);
    expect(dureeRetour(1)).toBe(120_000);
    expect(dureeRetour(5)).toBe(120_000);
    expect(dureeMaisonConnexion(0.5)).toBeLessThanOrEqual(60_000);
    const cache = { lieu: 'cache' as const, chemin: '/priere', nomPage: 'Prière', depuis: 0, graine: 0.3 };
    const maison = apresTrouve(cache, 10_000, 0.5);
    expect(maison).toEqual({ lieu: 'maison', jusqua: 100_000, dernier: '/priere' });
    expect(avancer(maison, 99_999, PAGES, 0, 0.1)).toBe(maison);
    const repart = avancer(maison, 100_000, PAGES, 0, 0.1);
    expect(repart.lieu).toBe('cache');
    expect(repart.lieu === 'cache' && repart.chemin).not.toBe('/priere');
  });
  it('page choisie parmi celles de l\'élève ; l\'accueil si aucune', () => {
    expect(choisirPage([], 0.5)).toEqual(PAGE_SECOURS);
    expect(choisirPage(PAGES, 0.99).chemin).toBe('/alphabet');
    expect(choisirPage([PAGES[0]], 0.5, '/priere').chemin).toBe('/priere');
  });
});

describe('🐿️ petits outils', () => {
  it('mélange toujours pareil pour une même graine, sans doublon', () => {
    const a = ordreAuHasard(10, 0.42);
    expect(a).toEqual(ordreAuHasard(10, 0.42));
    expect([...a].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
  it('emoji, position, repère court sans couper un mot', () => {
    expect(emojiPage('Prière')).toBe('🕌');
    expect(emojiPage('99 Noms d\'Allah')).toBe('🌟');
    expect(emojiPage('Truc')).toBe('📄');
    expect(positionDansPage(100, 3000)).toBe('en haut');
    expect(positionDansPage(1500, 3000)).toBe('au milieu');
    expect(positionDansPage(2900, 3000)).toBe('en bas');
    expect(repereCourt('Les ablutions')).toBe('Les ablutions');
    expect(repereCourt('Apprendre les ablutions avant la prière du matin')).toBe('Apprendre les ablutions…');
  });
});
