import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
vi.mock('@/lib/sonSaison', () => ({ sonCristal: vi.fn() }));
vi.mock('@/lib/sonsErreur', () => ({ sonErreur: vi.fn() }));
import { useDeuxChances } from './useDeuxChances';

const opts = { nb: 2, estBonne: (_e: number, i: number) => i === 0, texteBonne: () => 'Un bateau', explication: () => 'Nouh a construit un bateau.' };

describe('quiz : 2 chances', () => {
  it('juste du 1er coup : question suivante toute seule, 1 point', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDeuxChances(opts));
    act(() => result.current.toucher(0));
    expect(result.current.message).toBeNull();
    act(() => { vi.advanceTimersByTime(1200); });
    expect(result.current.etape).toBe(1);
    expect(result.current.score).toBe(1);
    vi.useRealTimers();
  });
  it('faux puis faux : message avec la bonne réponse, puis suivante ; faux puis juste : ½ point', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDeuxChances(opts));
    act(() => result.current.toucher(1));
    expect(result.current.message).toBeNull();
    act(() => result.current.toucher(2));
    expect(result.current.message).toMatchObject({ ok: false, bonne: 'Un bateau' });
    act(() => { vi.advanceTimersByTime(result.current.message!.duree + 10); });
    expect(result.current.etape).toBe(1);
    act(() => result.current.toucher(1));
    act(() => result.current.toucher(0));
    expect(result.current.message).toMatchObject({ ok: true });
    expect(result.current.score).toBe(0.5);
    vi.useRealTimers();
  });
});
