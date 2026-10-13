import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCreationDraft } from './useCreationDraft';
import { loadDraft, saveDraft } from './useDraftRecovery';
import { requestDraftResume } from '@/lib/pendingDrafts';

type Form = { text: string };
const KEY = 'dinislam_test_form';

/** Petit formulaire simulé : ouvert/fermé + un champ texte */
function setup(initial: { active: boolean; text: string }) {
  const state = { ...initial };
  const hook = renderHook(
    ({ active, text }) =>
      useCreationDraft<Form>(KEY, {
        active,
        value: { text },
        isEmpty: (v) => !v.text.trim(),
        restore: (v) => { state.text = v.text; state.active = true; },
      }),
    { initialProps: initial },
  );
  const set = (p: Partial<{ active: boolean; text: string }>) => {
    Object.assign(state, p);
    hook.rerender({ ...state });
  };
  return { hook, state, set };
}

/** Stockage du navigateur simulé (celui de l'environnement de test n'est pas complet) */
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => { m.delete(k); },
    setItem: (k, v) => { m.set(k, String(v)); },
  };
}

describe('useCreationDraft', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
    vi.stubGlobal('sessionStorage', memoryStorage());
  });

  it('garde ce qui est tapé, et le garde quand on ferme sans valider', () => {
    const { set } = setup({ active: true, text: '' });
    set({ text: 'Bonjour' });
    expect(loadDraft<Form>(KEY)).toEqual({ text: 'Bonjour' });
    set({ active: false });
    expect(loadDraft<Form>(KEY)).toEqual({ text: 'Bonjour' });
  });

  it('remet le brouillon en rouvrant le formulaire vide', () => {
    saveDraft(KEY, { text: 'Brouillon' });
    const { hook, state, set } = setup({ active: false, text: '' });
    set({ active: true });
    expect(state.text).toBe('Brouillon');
    set({ text: state.text });
    expect(hook.result.current.restored).toBe(true);
    expect(loadDraft<Form>(KEY)).toEqual({ text: 'Brouillon' });
  });

  it('« Continuer » depuis le message d\'ouverture rouvre le formulaire avec le brouillon', () => {
    saveDraft(KEY, { text: 'À reprendre' });
    const { state } = setup({ active: false, text: '' });
    act(() => requestDraftResume(KEY));
    expect(state.active).toBe(true);
    expect(state.text).toBe('À reprendre');
  });

  it('création réussie : brouillon effacé et pas réécrit avant une nouvelle saisie', () => {
    const { hook, set } = setup({ active: true, text: '' });
    set({ text: 'Envoyé' });
    act(() => hook.result.current.done());
    set({ text: 'Envoyé' });
    expect(loadDraft<Form>(KEY)).toBeNull();
    set({ text: '' });
    set({ text: 'Deuxième' });
    expect(loadDraft<Form>(KEY)).toEqual({ text: 'Deuxième' });
  });

  it('formulaire vidé à la main : plus de brouillon', () => {
    const { set } = setup({ active: true, text: '' });
    set({ text: 'abc' });
    set({ text: '' });
    expect(loadDraft<Form>(KEY)).toBeNull();
  });
});
