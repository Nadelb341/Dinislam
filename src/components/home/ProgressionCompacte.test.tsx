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

describe('📈 Progrès en anneaux', () => {
  it('un anneau par carte avec son chiffre', () => {
    render(<ProgressionCompacte elements={elements} />);
    expect(screen.getByRole('button', { name: /Nourania : 0 sur 17/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Prière : 3 validées/ })).toBeTruthy();
    expect(screen.getByText('/17')).toBeTruthy();
  });
  it('100 % = ⭐ terminé ; toucher un anneau ouvre la carte', () => {
    render(<ProgressionCompacte elements={elements} />);
    expect(screen.getByRole('button', { name: /Alphabet : 28 sur 28, terminé/ }).textContent).toContain('⭐');
    fireEvent.click(screen.getByRole('button', { name: /Nourania/ }));
    expect(navigate).toHaveBeenCalledWith('/nourania');
  });
  it('aucune carte active : rien affiché', () => {
    const { container } = render(<ProgressionCompacte elements={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
