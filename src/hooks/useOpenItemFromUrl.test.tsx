import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useOpenItemFromUrl, lockedItemMessage } from './useOpenItemFromUrl';

const wrap = (url: string) => ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;

describe('useOpenItemFromUrl', () => {
  it("n'ouvre rien tant que la page n'est pas prête, puis une seule fois", () => {
    const open = vi.fn();
    const { rerender } = renderHook(({ ready }) => useOpenItemFromUrl(ready, open), {
      initialProps: { ready: false },
      wrapper: wrap('/sourates?item=112&devoir=abc'),
    });
    expect(open).not.toHaveBeenCalled();
    rerender({ ready: true });
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith('112');
    rerender({ ready: true });
    rerender({ ready: false });
    rerender({ ready: true });
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('ne fait rien sans « item »', () => {
    const open = vi.fn();
    renderHook(() => useOpenItemFromUrl(true, open), { wrapper: wrap('/sourates?devoir=abc') });
    expect(open).not.toHaveBeenCalled();
  });

  it('accorde le message de verrou', () => {
    expect(lockedItemMessage('Ce nom', false)).toBe("Ce nom n'est pas encore ouvert pour toi : demande à ton professeur 🙂");
    expect(lockedItemMessage()).toBe("Cette leçon n'est pas encore ouverte pour toi : demande à ton professeur 🙂");
  });
});
