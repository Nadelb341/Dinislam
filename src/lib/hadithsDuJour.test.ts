import { describe, expect, it } from 'vitest';
import { choisirHadithDuJour, HADITHS_SECOURS, jourDeLAnnee, type HadithDuJour } from './hadithsDuJour';

const ligne = (n: number, texte = `Hadith ${n}`): HadithDuJour => ({
  id: `id-${n}`, texte_arabe: n % 2 ? null : 'عربي', texte, source: 'Source', theme: null, position: n * 10,
});

describe('Hadith du jour', () => {
  it('garde les 40 hadiths d\'origine comme filet de secours', () => {
    expect(HADITHS_SECOURS).toHaveLength(40);
    expect(HADITHS_SECOURS[0].text).toBe('Les actions ne valent que par leurs intentions.');
  });

  it('liste vide, absente ou sans texte → liste de secours (jamais de carte vide)', () => {
    const jour = new Date(2026, 10, 21);
    const attendu = HADITHS_SECOURS[jourDeLAnnee(jour) % 40];
    expect(choisirHadithDuJour(undefined, jour)).toEqual(attendu);
    expect(choisirHadithDuJour([], jour)).toEqual(attendu);
    expect(choisirHadithDuJour([ligne(1, '   ')], jour)).toEqual(attendu);
  });

  it('même règle qu\'avant : jour de l\'année modulo le nombre de hadiths de la base', () => {
    const liste = [ligne(1), ligne(2), ligne(3)];
    const jour = new Date(2026, 0, 5); // 5e jour → 5 % 3 = 2
    expect(jourDeLAnnee(jour)).toBe(5);
    const h = choisirHadithDuJour(liste, jour);
    expect(h.text).toBe('Hadith 3');
    expect(h.arabic).toBe('');
    expect(h.theme).toBe('');
  });

  it('avec les 40 hadiths en base, le résultat est le même qu\'avec l\'ancienne liste', () => {
    const base: HadithDuJour[] = HADITHS_SECOURS.map((h, i) => ({
      id: String(i), texte_arabe: h.arabic || null, texte: h.text, source: h.source, theme: h.theme, position: (i + 1) * 10,
    }));
    for (let m = 0; m < 12; m++) {
      const jour = new Date(2026, m, 15);
      expect(choisirHadithDuJour(base, jour)).toEqual(HADITHS_SECOURS[jourDeLAnnee(jour) % 40]);
    }
  });
});
