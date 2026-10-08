import { describe, expect, it } from 'vitest';
import { ENCOURAGEMENTS, personalize } from './encouragements';

describe('Messages personnalisés', () => {
  it('met le prénom et accorde au féminin', () => {
    expect(personalize('🦁 Sois {courageux|courageuse}, {prenom}, bravo !', 'Hafeda Benali', 'fille')).toBe('🦁 Sois courageuse, Hafeda, bravo !');
    expect(personalize('🦁 Sois {courageux|courageuse}, {prenom}, venu{e} !', 'Mahdi', 'garcon')).toBe('🦁 Sois courageux, Mahdi, venu !');
  });
  it('reste propre sans prénom', () => {
    expect(personalize('💪 {prenom}, chaque effort compte !', null)).toBe('💪 chaque effort compte !');
    expect(personalize('🌟 Bravo, {prenom}, continue !', '')).toBe('🌟 Bravo, continue !');
  });
  it('24 messages, tous avec le prénom', () => {
    expect(ENCOURAGEMENTS).toHaveLength(24);
    ENCOURAGEMENTS.forEach((m) => expect(m).toContain('{prenom}'));
  });
});
