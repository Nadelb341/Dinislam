import { describe, it, expect } from 'vitest';
import { messagesCompagnon, questionDuJour } from './jeuxSaisonLogique';

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
});
