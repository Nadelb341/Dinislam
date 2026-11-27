import { describe, expect, it } from 'vitest';
import {
  ajouterAuCarnet, avancer, avanceeDuJour, carnetALHeure, cleSemaine, compteurDepart, creneauDe, dhikrDuMoment, encouragement, etatCercle,
  intervalleAuto, joursDeLaSemaine, lundiDe, marquerJournee, momentEnAvant, prochainGeste, reculer, serieDeJours, totalCompte,
  totalSemaine, type EtatCompteur, resumeSemaine, dhikrTries, semainePasseeDe, semaineVide,
} from './dhikr';
import { DHIKR_GESTES_SECOURS, DHIKR_ITEMS_SECOURS, DHIKR_QUIZ_SECOURS } from '@/data/dhikrContenu';

const jusqua = (n: number, etapes: { nombre: number }[], depart: EtatCompteur = compteurDepart()) => {
  let e = depart; const evts: string[] = [];
  for (let i = 0; i < n; i++) { const r = avancer(e, etapes); e = r.etat; evts.push(r.evt); }
  return { e, evts };
};

describe('📿 le compteur du chapelet', () => {
  it('compte jusqu\'à 33 puis dit « fini »', () => {
    const { e, evts } = jusqua(33, [{ nombre: 33 }]);
    expect(e).toEqual({ etape: 0, compte: 33, tour: 1, fini: true });
    expect(evts.filter((x) => x === 'perle')).toHaveLength(32);
    expect(evts.at(-1)).toBe('fini');
  });
  it('une perle de plus après la fin = Tour : 2', () => {
    const { e } = jusqua(34, [{ nombre: 33 }]);
    expect(e).toMatchObject({ etape: 0, compte: 1, tour: 2, fini: false });
  });
  it('après la prière : 33 + 33 + 33 + 1, les étapes s\'enchaînent toutes seules', () => {
    const etapes = [{ nombre: 33 }, { nombre: 33 }, { nombre: 33 }, { nombre: 1 }];
    const { e, evts } = jusqua(100, etapes);
    expect(evts.filter((x) => x === 'etape')).toHaveLength(3);
    expect(evts.at(-1)).toBe('fini');
    expect(e.fini).toBe(true);
    expect(e.etape).toBe(3);
    expect(totalCompte(e, etapes)).toBe(100);
    // 33e perle → on passe à Al-hamdoulillah, compteur à 0
    expect(jusqua(33, etapes).e).toMatchObject({ etape: 1, compte: 0 });
  });
  it('soir : 33 + 33 + 34 = 100', () => {
    const etapes = [{ nombre: 33 }, { nombre: 33 }, { nombre: 34 }];
    expect(jusqua(99, etapes).e.fini).toBe(false);
    expect(jusqua(100, etapes).e.fini).toBe(true);
  });
  it('reculer d\'une perle, même au début d\'une étape', () => {
    const etapes = [{ nombre: 3 }, { nombre: 3 }];
    const { e } = jusqua(3, etapes); // début de l'étape 2
    expect(reculer(e, etapes)).toMatchObject({ etape: 0, compte: 2 });
    expect(reculer(compteurDepart(), etapes)).toEqual(compteurDepart());
  });
  it('un seul geste (1 fois) se termine au 1er toucher', () => {
    expect(jusqua(1, [{ nombre: 1 }]).evts).toEqual(['fini']);
  });
  it('le badge d\'encouragement change en chemin', () => {
    expect(encouragement(0, 33)).toBe('Fais ton dhikr avec moi 🤍');
    expect(encouragement(17, 33)).toBe('À mi-chemin, continue ✨');
    expect(encouragement(22, 33)).toBe('Reste avec moi jusqu\'à 33 🤍');
    expect(encouragement(31, 33)).toBe('Tu y es presque 🌟');
    expect(encouragement(33, 33)).toBe('Qu\'Allah accepte ton dhikr 🤲');
  });
  it('mode automatique : ×0,5 deux fois plus lent que ×1', () => {
    expect(intervalleAuto(0.5)).toBe(2 * intervalleAuto(1));
  });
  it('« Lâ ilâha illa-llâhou wahdahou… · 100 » : 15 s à ×1, 30 s à ×0,5 ; les autres dhikr ne changent pas', () => {
    expect(intervalleAuto(1, 'tahlil_100')).toBe(15000);
    expect(intervalleAuto(0.5, 'tahlil_100')).toBe(30000);
    for (const cle of ['tahlil_10', 'subhanallah_wabihamdihi', null, undefined, 'inconnu']) {
      expect(intervalleAuto(1, cle)).toBe(1600);
      expect(intervalleAuto(0.5, cle)).toBe(3200);
    }
    // Le dhikr existe bien avec cette clé et 100 fois
    const it100 = DHIKR_ITEMS_SECOURS.find((d) => d.cle === 'tahlil_100');
    expect(it100?.nombre).toBe(100);
    // Une voix lente (2 mots par seconde) a le temps de dire la phrase entière avant la perle suivante
    const mots = (it100?.phonetique ?? '').split(/\s+/).filter(Boolean).length;
    expect(mots).toBeGreaterThan(10);
    expect((mots / 2) * 1000).toBeLessThan(intervalleAuto(1, 'tahlil_100'));
  });
});

describe('🗓️ remise à zéro du dimanche soir à minuit', () => {
  it('la semaine commence le lundi à 0 h', () => {
    expect(lundiDe(new Date(2026, 10, 29, 23, 59)).getDate()).toBe(23); // dimanche 29/11 23 h 59 → semaine du lundi 23
    expect(lundiDe(new Date(2026, 10, 30, 0, 0)).getDate()).toBe(30); // lundi 30/11 0 h → nouvelle semaine
  });
  it('dimanche 23 h 59 compte encore dans la semaine ; lundi 0 h 00 repart à zéro et garde la semaine passée', () => {
    let c = ajouterAuCarnet(null, new Date(2026, 10, 25, 9), 'matin', 100); // mercredi
    c = ajouterAuCarnet(c, new Date(2026, 10, 29, 23, 59), 'soir', 33); // dimanche soir
    expect(totalSemaine(c.courante)).toBe(133);
    const lundi = carnetALHeure(c, new Date(2026, 10, 30, 0, 0));
    expect(totalSemaine(lundi.courante)).toBe(0);
    expect(totalSemaine(lundi.precedente)).toBe(133);
  });
  it('on ne garde QUE la semaine passée (la semaine d\'avant disparaît)', () => {
    let c = ajouterAuCarnet(null, new Date(2026, 10, 18, 9), 'matin', 10); // semaine du 16/11
    c = ajouterAuCarnet(c, new Date(2026, 10, 25, 9), 'matin', 20); // semaine du 23/11
    c = ajouterAuCarnet(c, new Date(2026, 11, 2, 9), 'matin', 30); // semaine du 30/11
    expect(c.precedente?.semaine).toBe(cleSemaine(new Date(2026, 10, 25)));
    expect(totalSemaine(c.precedente)).toBe(20);
    expect(totalSemaine(c.courante)).toBe(30);
    expect(JSON.stringify(c)).not.toContain('2026-11-18');
  });
  it('deux semaines sans rien : la semaine passée est vide', () => {
    const c = ajouterAuCarnet(null, new Date(2026, 10, 18, 9), 'matin', 10);
    const plusTard = carnetALHeure(c, new Date(2026, 11, 2, 9));
    expect(totalSemaine(plusTard.precedente)).toBe(0);
    expect(plusTard.precedente?.semaine).toBe(cleSemaine(new Date(2026, 10, 25)));
  });
  it('série de jours d\'affilée et moments faits', () => {
    let c = ajouterAuCarnet(null, new Date(2026, 10, 28, 9), 'matin', 5); // samedi
    c = ajouterAuCarnet(c, new Date(2026, 10, 29, 20), 'soir', 5); // dimanche
    c = ajouterAuCarnet(c, new Date(2026, 10, 30, 8), 'matin', 5); // lundi (nouvelle semaine)
    expect(serieDeJours(c, new Date(2026, 10, 30, 12))).toBe(3);
    expect(serieDeJours(c, new Date(2026, 11, 1, 7))).toBe(3); // mardi matin, rien encore : la série tient
    expect(serieDeJours(c, new Date(2026, 11, 2, 7))).toBe(0);
    const jours = joursDeLaSemaine(c);
    expect(jours).toHaveLength(7);
    expect(jours[0]).toMatchObject({ total: 5, moments: ['matin'] });
  });
});

describe('🏠 petite carte « Dhikr du moment »', () => {
  const j = (h: number, m = 0) => new Date(2026, 10, 27, h, m);
  it('jusqu\'à midi : la série du matin', () => {
    expect(dhikrDuMoment(j(7), null)).toEqual({ creneau: 'matin', serie: 'matin', faite: false });
    expect(creneauDe(j(11, 59))).toBe('matin');
  });
  it('de midi à 19 h : les 3 dhikr du quotidien, qui disparaissent un à un', () => {
    let jr = marquerJournee(null, j(13), 'quotidien:astaghfirullah');
    expect(dhikrDuMoment(j(14), jr)).toEqual({ creneau: 'journee', restants: ['apres_priere', 'subhanallah_wabihamdihi'] });
    jr = marquerJournee(jr, j(15), 'quotidien:apres_priere');
    jr = marquerJournee(jr, j(18, 30), 'quotidien:subhanallah_wabihamdihi');
    expect(dhikrDuMoment(j(18, 59), jr)).toEqual({ creneau: 'journee', restants: [] });
  });
  it('un dhikr fait AVANT midi ne l\'enlève pas de la liste de l\'après-midi', () => {
    const jr = marquerJournee(null, j(9), 'quotidien:astaghfirullah');
    expect(dhikrDuMoment(j(13), jr)).toMatchObject({ restants: ['apres_priere', 'astaghfirullah', 'subhanallah_wabihamdihi'] });
  });
  it('après 19 h : la série du soir (et elle sait si elle est faite)', () => {
    const jr = marquerJournee(null, j(21), 'serie:soir');
    expect(dhikrDuMoment(j(19), null)).toEqual({ creneau: 'soir', serie: 'soir', faite: false });
    expect(dhikrDuMoment(j(22), jr)).toEqual({ creneau: 'soir', serie: 'soir', faite: true });
  });
  it('le lendemain, tout est à refaire', () => {
    const jr = marquerJournee(null, j(8), 'serie:matin');
    expect(dhikrDuMoment(new Date(2026, 10, 28, 8), jr)).toMatchObject({ faite: false });
  });
  it('le moment mis en avant dans la bibliothèque', () => {
    expect(momentEnAvant(j(8))).toBe('matin');
    expect(momentEnAvant(j(5))).toBe('reveil');
    expect(momentEnAvant(j(14))).toBe('apres_priere');
    expect(momentEnAvant(j(22))).toBe('soir');
  });
});

describe('🌅 reprise de la série là où on s\'était arrêté', () => {
  it('garde l\'avancée du jour, repart à zéro le lendemain', () => {
    const a = { jour: '2026-11-27', faits: ['g1', 'g2'], finie: false };
    expect(avanceeDuJour(a, new Date(2026, 10, 27, 22))).toBe(a);
    expect(avanceeDuJour(a, new Date(2026, 10, 28, 1)).faits).toEqual([]);
    expect(prochainGeste(['g1', 'g2', 'g3'], a.faits)).toBe(2);
    expect(prochainGeste(['g1', 'g2'], a.faits)).toBe(-1);
  });
});

describe('🕌 contenu de secours (règle n°1)', () => {
  it('chaque dhikr a son arabe, sa phonétique, son sens, son nombre et sa source', () => {
    for (const it of DHIKR_ITEMS_SECOURS) {
      expect(it.arabe && it.phonetique && it.sens && it.source, it.titre).toBeTruthy();
      expect(it.nombre).toBeGreaterThan(0);
    }
  });
  it('seules les sources de Nadia sont visibles (Coran, Boukhari, Mouslim)', () => {
    const visibles = [...DHIKR_ITEMS_SECOURS, ...DHIKR_GESTES_SECOURS].filter((x) => x.visible);
    for (const x of visibles) if (x.source) expect(x.source, x.titre).toMatch(/^(Coran|Boukhari|Mouslim)/);
    const caches = DHIKR_GESTES_SECOURS.filter((g) => /Dâwoud|Tirmidh/.test(g.source ?? ''));
    expect(caches.length).toBe(2);
    expect(caches.every((g) => !g.visible && g.statut === 'a_confirmer')).toBe(true);
  });
  it('les séries ont 3 à 5 gestes visibles, avec la bonne somme au chapelet', () => {
    const vis = (s: string) => DHIKR_GESTES_SECOURS.filter((g) => g.serie === s && g.genre === 'geste' && g.visible);
    expect(vis('soir')).toHaveLength(5);
    expect(vis('matin').length).toBeGreaterThanOrEqual(3);
    expect(vis('reveil')).toHaveLength(3);
    const soir = DHIKR_GESTES_SECOURS.find((g) => g.cle === 'soir_tasbih')!;
    expect(soir.compteur!.map((c) => c.nombre)).toEqual([33, 33, 34]);
    const apres = DHIKR_GESTES_SECOURS.find((g) => g.cle === 'apres_tasbih')!;
    expect(apres.compteur!.reduce((s, c) => s + c.nombre, 0)).toBe(100);
  });
  it('quiz : une bonne réponse qui existe et une source', () => {
    for (const q of DHIKR_QUIZ_SECOURS) {
      expect(q.choix[q.bonne]).toBeTruthy();
      expect(q.source).toMatch(/Boukhari|Mouslim/);
    }
  });
});

describe('📿 chapelet en cercle de 11 perles (27/11)', () => {
  it('33 = 3 tours de 11, la perle à compter avance', () => {
    expect(etatCercle(0, 33)).toMatchObject({ parTour: 11, tours: 3, tour: 1, position: 0, utiles: 11, fini: false });
    expect(etatCercle(10, 33)).toMatchObject({ tour: 1, position: 10 });
    expect(etatCercle(11, 33)).toMatchObject({ tour: 2, position: 0 });
    expect(etatCercle(32, 33)).toMatchObject({ tour: 3, position: 10 });
    expect(etatCercle(33, 33)).toMatchObject({ tour: 3, position: 11, fini: true });
  });
  it('100 = 10 tours, le dernier n\'a qu\'une perle ; 34 = 4 tours', () => {
    expect(etatCercle(0, 100)).toMatchObject({ tours: 10, tour: 1 });
    expect(etatCercle(99, 100)).toMatchObject({ tour: 10, position: 0, utiles: 1 });
    expect(etatCercle(33, 34)).toMatchObject({ tours: 4, tour: 4, utiles: 1 });
  });
  it('moins de 11 : autant de perles que de fois (3 fois, 1 fois)', () => {
    expect(etatCercle(1, 3)).toMatchObject({ parTour: 3, tours: 1, tour: 1, position: 1 });
    expect(etatCercle(0, 1)).toMatchObject({ parTour: 1, tours: 1, position: 0 });
    expect(etatCercle(0, 0)).toMatchObject({ parTour: 1, tours: 1 });
  });
});

describe('📒 carnet envoyé en base (vu par l\'enseignante)', () => {
  it('totaux par dhikr, par jour, séries matin / soir / réveil', () => {
    const tahlil = { cle: 'tahlil_100', titre: 'Lâ ilâha illa-llâh wahdahou… (100 fois)' };
    let c = ajouterAuCarnet(null, new Date(2026, 10, 23, 8), 'matin', 120, { cle: 'serie:matin', titre: 'Série du matin' }); // lundi
    c = ajouterAuCarnet(c, new Date(2026, 10, 23, 12), 'libre', 100, tahlil);
    c = ajouterAuCarnet(c, new Date(2026, 10, 24, 20), 'soir', 50, { cle: 'serie:soir', titre: 'Série du soir' }); // mardi
    c = ajouterAuCarnet(c, new Date(2026, 10, 25, 13), 'libre', 100, tahlil);
    c = ajouterAuCarnet(c, new Date(2026, 10, 25, 14), 'libre', 33); // sans clé : compte dans le total seulement
    const r = resumeSemaine(c.courante);
    expect(r.semaine).toBe('2026-11-23');
    expect(r.total).toBe(403);
    expect(r.par_dhikr.tahlil_100).toEqual({ titre: tahlil.titre, nombre: 200 });
    expect(r.par_dhikr['serie:matin'].nombre).toBe(120);
    expect(r.par_jour).toEqual({ '2026-11-23': 220, '2026-11-24': 50, '2026-11-25': 133 });
    expect([r.series_matin, r.series_soir, r.series_reveil]).toEqual([1, 1, 0]);
    expect(dhikrTries(r.par_dhikr).map((d) => d.cle)).toEqual(['tahlil_100', 'serie:matin', 'serie:soir']);
  });
  it('anciens jours sans détail par dhikr : seulement le total', () => {
    const r = resumeSemaine({ semaine: '2026-11-23', jours: { '2026-11-24': { total: 33, moments: ['libre'] } } });
    expect(r.total).toBe(33);
    expect(r.par_dhikr).toEqual({});
  });
  it('la semaine passée = le lundi d\'avant ; une semaine vide n\'est pas envoyée', () => {
    expect(semainePasseeDe(new Date(2026, 10, 29, 23, 59))).toBe('2026-11-16');
    expect(semainePasseeDe(new Date(2026, 10, 30, 0, 0))).toBe('2026-11-23');
    expect(semaineVide({ semaine: '2026-11-23', jours: {} })).toBe(true);
    expect(semaineVide(null)).toBe(true);
  });
});
