import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
import { ProgressionCompacte } from './ProgressionCompacte';

const elements = [
  { path: '/nourania', label: 'Nourania', valeur: 0, total: 17 },
  { path: '/alphabet', label: 'Alphabet', valeur: 28, total: 28 },
  { path: '/priere', label: 'Prière', valeur: 3, total: null },
];

describe('📈 Progrès (proposition C)', () => {
  it('fermée : une ligne avec les chiffres, pas le détail', () => {
    render(<ProgressionCompacte elements={elements} />);
    expect(screen.getByText('📈 Progrès')).toBeTruthy();
    expect(screen.getByText('/17')).toBeTruthy();
    expect(screen.queryByText('Touche une ligne pour ouvrir la carte.')).toBeNull();
  });
  it('touchée : détail ; une ligne ouvre sa carte ; 100 % = ⭐ terminé', () => {
    render(<ProgressionCompacte elements={elements} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('0 / 17')).toBeTruthy();
    expect(screen.getByText('3 validées')).toBeTruthy();
    expect(screen.getByText('· terminé !')).toBeTruthy();
    expect(screen.getAllByText('⭐').length).toBe(2);
    fireEvent.click(screen.getByText('Nourania'));
    expect(navigate).toHaveBeenCalledWith('/nourania');
  });
  it('aucune carte active : rien affiché', () => {
    const { container } = render(<ProgressionCompacte elements={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
