import { describe, it, expect } from 'vitest';
import {
  DEVINETTES_ACCUEIL, DEVINETTES_PAGES, DEVINETTES_SECOURS, ENCOURAGEMENTS, INTROS_INDICE, MESSAGES_MAISON, PAGE_SECOURS, PROBA_MAISON,
  TEXTE_ANNONCE, annonceVisible, apresTrouve, avancer, avecPrenom, choisirPage, devinettesLieu, devinettesPage, dureeMaisonConnexion,
  dureeRetour, emojiPage, etatDeDepart, niveauIndice, ordreAuHasard, positionDansPage, repereCourt, texteIndice, tirerSansRepeter,
} from './ecureuilLogique';

const PAGES = [{ chemin: '/priere', nom: 'Prière' }, { chemin: '/sourates', nom: 'Sourates' }, { chemin: '/alphabet', nom: 'Alphabet' }];

describe('🐿️ indices de l\'écureuil : annonce à 10 s, puis 30 s, 45 s, 55 s', () => {
  it('rien avant 30 s, puis 3 indices', () => {
    expect(niveauIndice(0)).toBe(0);
    expect(niveauIndice(29_999)).toBe(0);
    expect(niveauIndice(30_000)).toBe(1);
    expect(niveauIndice(44_999)).toBe(1);
    expect(niveauIndice(45_000)).toBe(2);
    expect(niveauIndice(54_999)).toBe(2);
    expect(niveauIndice(55_000)).toBe(3);
    expect(niveauIndice(600_000)).toBe(3);
  });
  it('la bulle « tu auras des indices » : de 10 s au 1er indice', () => {
    expect(annonceVisible(9_999)).toBe(false);
    expect(annonceVisible(10_000)).toBe(true);
    expect(annonceVisible(29_999)).toBe(true);
    expect(annonceVisible(30_000)).toBe(false);
    expect(TEXTE_ANNONCE).toBe('Si tu ne me trouves pas, tu auras des indices dans quelques secondes 😉');
  });
  it('hors de la page : devinette SANS le nom, puis devinette facile + nom, puis « Y aller »', () => {
    const c = { surLaPage: false, chemin: '/priere', nomPage: 'Prière' };
    expect(texteIndice(0, c)).toBeNull();
    const t1 = texteIndice(1, c)!;
    expect(t1).not.toContain('Prière');
    expect(t1).toContain(DEVINETTES_PAGES['/priere'].difficile[0]);
    const t2 = texteIndice(2, c)!;
    expect(t2).toContain('« Prière » 🕌');
    expect(t2).toContain(DEVINETTES_PAGES['/priere'].facile[0]);
    expect(texteIndice(3, c)).toContain('Y aller');
  });
  it('dans la page : devinette du repère, puis le repère, puis « je remue »', () => {
    const d = DEVINETTES_ACCUEIL.logo;
    expect(texteIndice(1, { surLaPage: true, chemin: '/', nomPage: 'Accueil', devinettes: d })).toContain(d[0]);
    expect(texteIndice(1, { surLaPage: true, nomPage: 'Prière' })).toContain('cette page');
    expect(texteIndice(2, { surLaPage: true, nomPage: 'Prière', repere: 'Les ablutions', ou: 'en haut' })).toContain('Je suis tout près de « Les ablutions », en haut 🔍');
    expect(texteIndice(3, { surLaPage: true, nomPage: 'Prière' })).toContain('je remue');
  });
  it('les numéros tirés changent le texte (intro, devinette, encouragement)', () => {
    const c = { surLaPage: false, chemin: '/alphabet', nomPage: 'Alphabet' };
    expect(texteIndice(1, c, { intro: 0, devinette: 0, encourage: 0 })).not.toBe(texteIndice(1, c, { intro: 1, devinette: 1, encourage: 0 }));
    expect(texteIndice(1, c, { intro: 0, devinette: 0, encourage: 0 })).toContain('le BA et le TA');
  });
});

describe('🧩 devinettes pour toutes les cartes', () => {
  const chemins = ['/alphabet', '/nourania', '/sourates', '/invocations', '/ramadan', '/grammaire', '/priere', '/coran', '/allah-names',
    '/module/vocabulaire', '/module/lecture-coran', '/module/darija', '/module/dictionnaire', '/module/dhikr', '/module/hadiths',
    '/module/histoires-prophetes', '/classement', '/settings', '/attendance', '/'];
  it('chaque page a au moins 2 devinettes difficiles et 1 facile, sans jamais son nom dans la difficile', () => {
    for (const c of chemins) {
      const d = DEVINETTES_PAGES[c];
      expect(d, c).toBeDefined();
      expect(d.difficile.length, c).toBeGreaterThanOrEqual(2);
      expect(d.facile.length, c).toBeGreaterThanOrEqual(1);
    }
    expect(DEVINETTES_PAGES['/priere'].difficile.join(' ')).not.toMatch(/Prière/);
    expect(DEVINETTES_PAGES['/coran'].difficile.join(' ')).toMatch(/Coran/); // la devinette de Nadia (« en pleine lecture du Coran »)
  });
  it('trouve les devinettes par chemin, par alias, par nom, sinon celles de secours', () => {
    expect(devinettesPage('/priere?carte=LODO')).toBe(DEVINETTES_PAGES['/priere']);
    expect(devinettesPage('/module/allah-names')).toBe(DEVINETTES_PAGES['/allah-names']);
    expect(devinettesPage('/module/1234-abcd', 'Les invocations du matin')).toBe(DEVINETTES_PAGES['/invocations']);
    expect(devinettesPage('/module/xyz', 'Truc inconnu')).toBe(DEVINETTES_SECOURS);
  });
  it('repères de l\'accueil : logo, cheminée, tas de feuilles, devoirs, carte', () => {
    expect(devinettesLieu({ cachette: 'Le logo' })).toBe(DEVINETTES_ACCUEIL.logo);
    expect(devinettesLieu({ cachette: 'La cheminée' })).toBe(DEVINETTES_ACCUEIL.cheminee);
    expect(devinettesLieu({ cachette: 'Le tas de feuilles' })).toBe(DEVINETTES_ACCUEIL.tas);
    expect(devinettesLieu({ texte: '📌 DEVOIRS À FAIRE' })).toBe(DEVINETTES_ACCUEIL.devoirs);
    expect(devinettesLieu({ carteChemin: '/priere', carteNom: 'Prière' })).toBe(DEVINETTES_PAGES['/priere'].difficile);
    expect(devinettesLieu({ carteChemin: '/module/xyz', carteNom: 'Ma carte' })).toBe(DEVINETTES_ACCUEIL.carte);
    expect(devinettesLieu({ texte: 'Bonjour' })).toBeNull();
    expect(DEVINETTES_ACCUEIL.logo).toContain('Je suis sur la lune dorée, tu as deviné où je suis ? 🌙');
  });
});

describe('💬 messages joueurs : au moins 20, jamais deux fois de suite', () => {
  it('au moins 20 messages de chaque sorte, tous différents', () => {
    for (const l of [MESSAGES_MAISON, INTROS_INDICE, ENCOURAGEMENTS]) {
      expect(l.length).toBeGreaterThanOrEqual(20);
      expect(new Set(l).size).toBe(l.length);
    }
    expect(MESSAGES_MAISON.filter((m) => m.includes('{prenom}')).length).toBeGreaterThan(MESSAGES_MAISON.length / 2);
  });
  it('bulle de la maisonnette assez courte pour sa place', () => {
    for (const m of MESSAGES_MAISON) expect(avecPrenom(m, '').length, m).toBeLessThanOrEqual(62);
  });
  it('le prénom est mis, ou retiré proprement', () => {
    expect(avecPrenom('Tu ne me trouveras pas, {prenom} ! 😜', 'Wiam')).toBe('Tu ne me trouveras pas, Wiam ! 😜');
    expect(avecPrenom('Tu ne me trouveras pas, {prenom} ! 😜', '')).toBe('Tu ne me trouveras pas ! 😜');
    expect(avecPrenom('Cherche bien, {prenom}… je suis plus malin qu\'un renard 🦊', '')).toBe('Cherche bien… je suis plus malin qu\'un renard 🦊');
    for (const m of MESSAGES_MAISON) {
      const t = avecPrenom(m, '');
      expect(t, m).not.toMatch(/[{}]|, ,|\s,|^\s|\s$/);
    }
  });
  it('tirage : jamais le même que la fois d\'avant', () => {
    for (let d = 0; d < 20; d++) for (let k = 0; k <= 100; k++) {
      const i = tirerSansRepeter(20, d, k / 100);
      expect(i).not.toBe(d);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(20);
    }
    expect(tirerSansRepeter(1, 0, 0.5)).toBe(0);
    expect(tirerSansRepeter(5, null, 0.99)).toBe(4);
  });
});

describe('🏡 maisonnette : connexion, trouvé, retour', () => {
  it('à la connexion : chez lui environ 1 fois sur 2, 45 s à 1 min 30', () => {
    expect(PROBA_MAISON).toBe(0.5);
    expect(etatDeDepart(1000, PAGES, 0.1, 0, 0.5).lieu).toBe('maison');
    expect(etatDeDepart(1000, PAGES, 0.9, 0, 0.5)).toEqual({ lieu: 'cache', chemin: '/priere', nomPage: 'Prière', depuis: 1000, graine: 0.5 });
    let n = 0;
    for (let i = 0; i < 1000; i++) if (etatDeDepart(0, PAGES, (i + 0.5) / 1000, 0.5, 0.5).lieu === 'maison') n++;
    expect(n).toBe(500);
    expect(dureeMaisonConnexion(0)).toBe(45_000);
    expect(dureeMaisonConnexion(1)).toBe(90_000);
  });
  it('trouvé → il rentre chez lui 1 à 2 minutes maximum, puis repart ailleurs', () => {
    expect(dureeRetour(0)).toBe(60_000);
    expect(dureeRetour(1)).toBe(120_000);
    expect(dureeRetour(5)).toBe(120_000);
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

import { copainDe, messageAmi } from './ecureuilLogique';
describe('🦔 l\'écureuil annonce son copain', () => {
  it('copain / copine selon le nom', () => {
    expect(copainDe('Le hérisson')).toBe('mon copain le hérisson');
    expect(copainDe('La biche')).toBe('ma copine la biche');
    expect(copainDe("L'escargot")).toBe("mon copain l'escargot");
  });
  it('avec ou sans prénom', () => {
    expect(messageAmi(0, 'Le hérisson', 'Nadia')).toMatch(/^Mon copain le hérisson se cache aussi .*Nadia/);
    expect(messageAmi(1, 'Le hérisson', '')).toMatch(/^Psst\s!\sMon copain le hérisson/);
    expect(messageAmi(1, 'Le hérisson', '')).not.toContain('{');
  });
});
