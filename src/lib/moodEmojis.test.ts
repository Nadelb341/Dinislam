import { describe, it, expect } from 'vitest';
import { seasonEmojis, withMoodEmojis } from './moodEmojis';

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
