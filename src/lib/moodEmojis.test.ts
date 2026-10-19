import { describe, it, expect } from 'vitest';
import { seasonEmojis, withMoodEmojis, addMoodEmojis, toneOf } from './moodEmojis';

describe('émojis selon le ton et la saison', () => {
  it('automne en octobre, hiver en janvier', () => {
    expect(seasonEmojis(new Date(2026, 9, 19))).toContain('🍂');
    expect(seasonEmojis(new Date(2027, 0, 5))).toContain('❄️');
  });
  it('message joyeux : étincelle + visage content ; triste : visage triste, jamais content', () => {
    const joy = withMoodEmojis('Bravo', 'joie', new Date(2026, 9, 19), () => 0);
    expect(joy).toBe('✨ Bravo ☺️🍁');
    const sad = withMoodEmojis('Encore un effort', 'triste', new Date(2026, 9, 19), () => 0);
    expect(sad).toBe('Encore un effort 🥺🍁');
  });
});

describe('addMoodEmojis (toute l\'appli)', () => {
  const oct = new Date('2026-10-19');
  const first = () => 0;
  it('ne touche jamais un message qui a déjà un émoji', () => {
    expect(addMoodEmojis('Flashcard modifiée ✅', 'joie', oct, first)).toBe('Flashcard modifiée ✅');
  });
  it('message joyeux : sujet + visage + saison', () => {
    expect(addMoodEmojis('Groupe créé', 'joie', oct, first)).toBe('Groupe créé 👥☺️🍁');
  });
  it('erreur : visage triste, jamais joyeux', () => {
    expect(addMoodEmojis('Erreur lors de la suppression', undefined, oct, first)).toBe('Erreur lors de la suppression 🥺🗑️');
  });
  it('devine le ton même avec des accents', () => {
    expect(toneOf('Échec de l\'envoi')).toBe('triste');
    expect(toneOf('Récitation envoyée')).toBe('joie');
    expect(toneOf('Chargement')).toBe('neutre');
  });
});
