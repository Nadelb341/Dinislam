import { describe, expect, it } from 'vitest';
import { dateAnniversaire, feteEnCours, FETE_MS, infoAnniversaire, phraseAnniversaire } from './anniversaire';

describe('🎉 Anniversaire', () => {
  it('le jour même', () => {
    const i = infoAnniversaire('2018-04-25', new Date(2027, 3, 25, 9));
    expect(i).toMatchObject({ date: '2027-04-25', age: 9, aujourdhui: true, joursDepuis: 0 });
    expect(phraseAnniversaire(i!)).toBe("Aujourd'hui, tu as un an de plus !");
  });
  it('quelques jours après : encore fêté, au passé', () => {
    const i = infoAnniversaire('2018-04-25', new Date(2027, 3, 28));
    expect(i).toMatchObject({ age: 9, aujourdhui: false, joursDepuis: 3 });
    expect(phraseAnniversaire(i!)).toMatch(/^Le dimanche 25 avril, tu as eu un an de plus !$/);
  });
  it('plus de 30 jours après, ou avant la date : rien', () => {
    expect(infoAnniversaire('2018-04-25', new Date(2027, 4, 30))).toBeNull();
    expect(infoAnniversaire('2018-04-25', new Date(2027, 3, 24))).toBeNull();
  });
  it('fin décembre fêté début janvier (année de la date)', () => {
    expect(infoAnniversaire('2015-12-30', new Date(2027, 0, 2))).toMatchObject({ annee: 2026, age: 11 });
  });
  it('29 février → 28 février les années non bissextiles', () => {
    expect(dateAnniversaire('2016-02-29', 2027).getDate()).toBe(28);
    expect(dateAnniversaire('2016-02-29', 2028).getDate()).toBe(29);
  });
  it('jamais les mots interdits', () => {
    const i = infoAnniversaire('2018-04-25', new Date(2027, 3, 25))!;
    expect(phraseAnniversaire(i).toLowerCase()).not.toContain('joyeux');
  });
  it('la fête dure 24 h', () => {
    expect(feteEnCours(1000, 1000 + FETE_MS - 1)).toBe(true);
    expect(feteEnCours(1000, 1000 + FETE_MS)).toBe(false);
    expect(feteEnCours(null)).toBe(false);
  });
});
