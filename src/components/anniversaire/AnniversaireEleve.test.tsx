import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn(async () => ({ data: { nouveau: true }, error: null })) } }));
import { AnniversaireEleve } from './AnniversaireEleve';

const rendre = (naissance: string | null) => render(
  <QueryClientProvider client={new QueryClient()}><AnniversaireEleve userId="u1" naissance={naissance} /></QueryClientProvider>,
);

describe('🎉 Message « un an de plus »', () => {
  beforeEach(() => { localStorage.clear(); document.documentElement.className = ''; });
  it("le jour même : message, +20 points, fête de 24 h, jamais « joyeux anniversaire »", () => {
    const d = new Date(); const n = `${d.getFullYear() - 9}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    rendre(n);
    expect(screen.getByText("Aujourd'hui, tu as un an de plus !")).toBeTruthy();
    expect(screen.getByText('9 ans')).toBeTruthy();
    expect(document.body.textContent).toContain('+20 points');
    expect(document.body.textContent?.toLowerCase()).not.toContain('joyeux');
    expect(document.body.textContent).not.toMatch(/gâteau|bougie/i);
    expect(document.documentElement.classList.contains('anniv-fete')).toBe(true);
  });
  it('déjà vu sur cet appareil : plus de message (la fête continue jusqu\'à 24 h)', () => {
    const d = new Date(); const n = `${d.getFullYear() - 9}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    localStorage.setItem(`dinislam_anniv_u1_${d.getFullYear()}`, String(Date.now() - 3600_000));
    rendre(n);
    expect(screen.queryByText("Aujourd'hui, tu as un an de plus !")).toBeNull();
    expect(document.documentElement.classList.contains('anniv-fete')).toBe(true);
  });
  it('pas de date de naissance : rien', () => {
    const { container } = rendre(null);
    expect(container.textContent).toBe('');
  });
});
