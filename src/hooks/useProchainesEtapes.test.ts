import { describe, it, expect } from 'vitest';
import { apresDernierFait } from './useProchainesEtapes';

describe('apresDernierFait (devoir proposé après le dernier élément validé)', () => {
  const liste = [1, 2, 3, 4, 5];
  it('rien de fait → le premier', () => expect(apresDernierFait(liste, () => false)).toBe(1));
  it('pas de rattrapage : 2 sauté, 1 et 3 faits → 4', () => expect(apresDernierFait(liste, (x) => x === 1 || x === 3)).toBe(4));
  it('tout fait → rien', () => expect(apresDernierFait(liste, () => true)).toBeUndefined());
  it('saute les déjà faits après le dernier ? non : le dernier fait est le plus loin', () => expect(apresDernierFait(liste, (x) => x === 2)).toBe(3));
});
