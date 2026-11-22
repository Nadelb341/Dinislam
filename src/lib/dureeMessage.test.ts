import { describe, expect, it } from 'vitest';
import { dureeMessage } from './dureeMessage';

describe('durée du message éphémère', () => {
  it('5 s pour 3-4 mots, plus pour un texte long, jamais plus de 12 s', () => {
    expect(dureeMessage('Un bateau')).toBe(5000);
    expect(dureeMessage('Le tâ marbouta est toujours à la fin du mot.')).toBe(7100);
    expect(dureeMessage('mot '.repeat(60))).toBe(12000);
  });
});
