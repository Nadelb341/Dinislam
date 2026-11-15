import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CorrectionsGrille, totalCorrections, type TuileCorrection } from './CorrectionsGrille';

const t = (id: string, compte = 0): TuileCorrection => ({ id, label: id, emoji: '📚', section: id, compte });

describe('✅ Corrections (bouclier)', () => {
  beforeEach(() => localStorage.clear());
  it('tuile rouge avec pastille quand quelque chose attend, verte sinon', () => {
    render(<CorrectionsGrille tuiles={[t('Devoirs', 0), t('Invocations', 2)]} onOuvrir={() => {}} />);
    const inv = screen.getByRole('button', { name: 'Invocations : 2 à corriger' });
    expect(inv.className).toContain('bg-destructive');
    expect(inv.textContent).toContain('2');
    expect(screen.getByRole('button', { name: 'Devoirs' }).className).toContain('bg-emerald-500');
  });
  it("garde l'ordre choisi et range une nouvelle carte après sa voisine d'origine", () => {
    localStorage.setItem('dinislam_corrections_ordre', JSON.stringify(['C', 'A', 'B']));
    render(<CorrectionsGrille tuiles={[t('A'), t('B'), t('Nouvelle'), t('C')]} onOuvrir={() => {}} />);
    const noms = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(noms).toEqual(['C', 'A', 'B', 'Nouvelle']);
  });
  it('le total compte aussi les invocations et les lignes Nourania', () => {
    expect(totalCorrections({ homework: 1, alphabet: 0, nourania: 1, nouraniaLignes: 3, recitations: 0, sourates: 0, invocations: 2, allahNames: 0 })).toBe(7);
  });
});
