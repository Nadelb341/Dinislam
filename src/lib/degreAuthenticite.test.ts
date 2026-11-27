import { describe, expect, it } from 'vitest';
import { degreAffiche, degreDeSource, divergenceDansSource, estCoran, normaliserDegre, texteDegre } from './degreAuthenticite';

describe('degreDeSource', () => {
  it('Al-Boukhârî et Mouslim = SAHIH, quelle que soit l\'écriture', () => {
    for (const s of ['Sahih Boukhari', 'Sahih Muslim', 'Boukhari 6405 ; Mouslim 2691', 'Rapporté par Al-Bukhârî (n°6312)',
      'Al-Boukhârî n° 4937 et Mouslim n° 798', 'Sahih Boukhari & Muslim', 'Mouslim 8 (le hadith de Jibrîl)']) {
      expect(degreDeSource(s)).toBe('sahih');
    }
  });
  it('Coran seul = CORAN', () => {
    expect(degreDeSource('Coran 2:255')).toBe('coran');
    expect(degreDeSource('Sourate Al-Baqara, verset 185')).toBe('coran');
    expect(degreDeSource("Sourate An-Nisâ', verset 86")).toBe('coran');
  });
  it('Coran + Al-Boukhârî = le hadith compte (SAHIH), et le Coran est signalé à côté', () => {
    expect(degreDeSource('Coran 3:173 ; Boukhari 4563')).toBe('sahih');
    expect(degreAffiche('Coran 3:173 ; Boukhari 4563')).toEqual({ degre: 'sahih', coranAussi: true, divergenceSource: false });
  });
  it('autre recueil SANS degré écrit → rien (on n\'invente pas)', () => {
    expect(degreDeSource('Abou Dâwoud 5082 ; At-Tirmidhî 3575')).toBeNull();
    expect(degreDeSource('Ibn Hibbane')).toBeNull();
    expect(degreDeSource('Tabarani')).toBeNull();
    expect(degreDeSource('')).toBeNull();
    expect(degreDeSource(null)).toBeNull();
  });
  it('degré écrit en toutes lettres dans la source', () => {
    expect(degreDeSource('At-Tirmidhî n° 3297 (jugé authentique par Al-Albânî)')).toBe('sahih');
    expect(degreDeSource('At-Tirmidhî n° 2891 (jugé hasan par Al-Albânî)')).toBe('hasan');
    expect(degreDeSource('Abû Dâwûd n° 805 (jugé hasan sahîh par Al-Albânî)')).toBe('sahih');
    expect(degreDeSource('Ibn As-Sunnî (jugé faible)')).toBe('daif');
    expect(degreDeSource('As-Saghânî : inventé')).toBe('mawdou');
  });
  it('plusieurs degrés écrits = avis divergents, le 1er cité est gardé', () => {
    const s = "At-Tirmidhî n° 3317 (jugé hasan par Al-Albânî et hasan sahîh selon At-Tirmidhî ; mais jugé faible dans l'édition Darussalam)";
    expect(degreDeSource(s)).toBe('hasan');
    expect(divergenceDansSource(s)).toBe(true);
    expect(divergenceDansSource('At-Tirmidhî n° 3297 (jugé authentique par Al-Albânî)')).toBe(false);
    expect(divergenceDansSource('Sahih Boukhari')).toBe(false);
  });
});

describe('degré donné en base', () => {
  it('le degré de la base passe avant celui de la source', () => {
    expect(degreAffiche('Abou Dâwoud 2357', 'hasan').degre).toBe('hasan');
    expect(degreAffiche('Sahih Boukhari', 'daif').degre).toBe('daif');
  });
  it('valeur inconnue → ignorée', () => {
    expect(normaliserDegre('SAHIH')).toBeNull();
    expect(normaliserDegre('sahih')).toBe('sahih');
    expect(normaliserDegre(undefined)).toBeNull();
    expect(degreAffiche('Tabarani', 'nimporte').degre).toBeNull();
  });
  it('texte court', () => {
    expect(texteDegre('daif')).toBe("DA'IF · Faible");
    expect(texteDegre(null)).toBe('');
    expect(estCoran('Boukhari 1')).toBe(false);
  });
});
