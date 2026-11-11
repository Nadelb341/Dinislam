import { describe, it, expect } from 'vitest';
import { cachetteDuJour, debutCycleFeu, echelleFeu, messagesCompagnon, motArabeDuJour, niveauFeu, questionDuJour } from './jeuxSaisonLogique';

describe('jeux des décors de saison (2026-11-11)', () => {
  it('il parle de ses devoirs et de grandir', () => {
    const m = messagesCompagnon({ prenom: 'Bilal', grandi: true, niveau: 3, aFaire: 2 });
    expect(m[0]).toContain('j\'ai grandi');
    expect(m[1]).toBe('Il te reste 2 devoirs à faire. On s\'y met ensemble ? 💪');
    expect(m.length).toBeGreaterThanOrEqual(5);
    expect(messagesCompagnon({ prenom: 'Réda', grandi: false, niveau: 0, aFaire: 0 })[1]).toContain('Tous tes devoirs sont faits');
  });
  it('la même question toute la journée, la bonne réponse parmi les choix', () => {
    const a = questionDuJour('2026-11-11', []), b = questionDuJour('2026-11-11', []);
    expect(a).toEqual(b);
    expect(a.options).toContain(a.bonne);
    const lettres = [{ letter_arabic: 'ا', name_french: 'Alif' }, { letter_arabic: 'ب', name_french: 'Ba' }, { letter_arabic: 'ت', name_french: 'Ta' }];
    for (const j of ['2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15']) {
      const q = questionDuJour(j, lettres);
      expect(q.options).toContain(q.bonne);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
  it('🔥 feu : maximum le mercredi dès 18 h, un cran de moins par jour sans connexion, braises au 7ᵉ jour', () => {
    const mer18 = new Date(2026, 10, 11, 18, 30); // mercredi 11/11/2026
    expect(debutCycleFeu(mer18).getDate()).toBe(11);
    expect(debutCycleFeu(new Date(2026, 10, 11, 17, 0)).getDate()).toBe(4);
    expect(niveauFeu(mer18, [])).toEqual({ avant: 6, apres: 6 });
    // jeudi : rien de manqué
    expect(niveauFeu(new Date(2026, 10, 12, 10), [])).toEqual({ avant: 6, apres: 6 });
    // samedi sans être venu jeudi ni vendredi : 2 crans de moins, la visite ravive d'un cran
    expect(niveauFeu(new Date(2026, 10, 14, 10), [])).toEqual({ avant: 4, apres: 5 });
    expect(niveauFeu(new Date(2026, 10, 14, 10), ['2026-11-12', '2026-11-13'])).toEqual({ avant: 6, apres: 6 });
    // mercredi suivant avant 18 h, jamais venu : braises
    expect(niveauFeu(new Date(2026, 10, 18, 9), [])).toEqual({ avant: 0, apres: 1 });
    expect(echelleFeu(0, false)).toBe(0);
    expect(echelleFeu(6, false)).toBe(1);
    expect(echelleFeu(6, true)).toBe(1.3);
  });
  it('🙈 cache-cache : la même cachette toute la journée, un mot arabe par jour', () => {
    expect(cachetteDuJour('2026-11-11', 'u1', 8)).toBe(cachetteDuJour('2026-11-11', 'u1', 8));
    expect(cachetteDuJour('2026-11-11', 'u1', 8)).toBeGreaterThanOrEqual(0);
    expect(cachetteDuJour('2026-11-11', 'u1', 0)).toBe(-1);
    expect(motArabeDuJour('2026-11-11').arabe.length).toBeGreaterThan(1);
  });
});

describe('cache-cache : 3 façons de jouer', () => {
  it('change de façon chaque jour, puis recommence', async () => {
    const { modeCacheDuJour, coinDecorDuJour } = await import('./jeuxSaisonLogique');
    const m = ['2026-11-11', '2026-11-12', '2026-11-13'].map(modeCacheDuJour);
    expect(new Set(m).size).toBe(3);
    expect(modeCacheDuJour('2026-11-14')).toBe(m[0]);
    const c = coinDecorDuJour('2026-11-11', 'u1');
    expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThan(4);
  });
});
