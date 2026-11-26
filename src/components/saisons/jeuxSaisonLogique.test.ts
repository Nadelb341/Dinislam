import { describe, it, expect } from 'vitest';
import { debutCycleFeu, echelleFeu, messagesCompagnon, motArabeDuJour, niveauFeu, questionDuJour, QUESTIONS_FEU } from './jeuxSaisonLogique';

describe('jeux des décors de saison (2026-11-11)', () => {
  it('il parle de ses devoirs et de grandir', () => {
    const m = messagesCompagnon({ prenom: 'Bilal', grandi: true, niveau: 3, aFaire: 2 });
    expect(m[0]).toContain('j\'ai grandi');
    expect(m[1]).toBe('Il te reste 2 devoirs à faire. On s\'y met ensemble ? 💪');
    expect(m.length).toBeGreaterThanOrEqual(5);
    expect(messagesCompagnon({ prenom: 'Réda', grandi: false, niveau: 0, aFaire: 0 })[1]).toContain('Tous tes devoirs sont faits');
  });
  it('la même question toute la journée, une autre chaque jour, 60 en roulement', () => {
    const a = questionDuJour('2026-11-11'), b = questionDuJour('2026-11-11');
    expect(a).toEqual(b);
    expect(QUESTIONS_FEU).toHaveLength(60);
    const vues = new Set<string>();
    const d = new Date(2026, 10, 1, 12);
    for (let i = 0; i < 60; i++) {
      const q = questionDuJour(d.toLocaleDateString('en-CA'));
      expect(q.options).toContain(q.bonne);
      expect(new Set(q.options).size).toBe(q.options.length);
      vues.add(q.question);
      d.setDate(d.getDate() + 1);
    }
    expect(vues.size).toBe(60);
    expect(questionDuJour(d.toLocaleDateString('en-CA')).question).toBe(questionDuJour('2026-11-01').question);
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
  it('🙈 cache-cache : un mot arabe par jour', () => {
    expect(motArabeDuJour('2026-11-11').arabe.length).toBeGreaterThan(1);
  });
});

