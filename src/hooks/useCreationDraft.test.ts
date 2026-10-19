import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCreationDraft, useEditDraft } from './useCreationDraft';
import { loadDraft, saveDraft } from './useDraftRecovery';
import { requestDraftResume, editDraftKey, scanPendingDrafts } from '@/lib/pendingDrafts';

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

describe('useEditDraft (modification pas enregistrée)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
    vi.stubGlobal('sessionStorage', memoryStorage());
  });
  const BASE = 'dinislam_allah_name';
  const EKEY = editDraftKey(BASE, 7);

  function setupEdit(initial: { active: boolean; text: string; id: number | null }) {
    const state = { ...initial };
    const original = { text: 'Original' };
    const hook = renderHook(
      ({ active, text, id }) => useEditDraft<Form>(BASE, id, {
        active, value: { text }, original: id == null ? null : original,
        restore: (v) => { state.text = v.text; },
      }),
      { initialProps: initial },
    );
    const set = (p: Partial<typeof initial>) => { Object.assign(state, p); hook.rerender({ ...state }); };
    return { hook, state, set };
  }

  it('rien n\'est gardé tant que rien ne change, la modification est gardée, revenir à l\'original l\'efface', () => {
    const { set } = setupEdit({ active: true, text: 'Original', id: 7 });
    expect(loadDraft(EKEY)).toBeNull();
    set({ text: 'Changé' });
    expect(loadDraft<Form>(EKEY)).toEqual({ text: 'Changé' });
    set({ text: 'Original' });
    expect(loadDraft(EKEY)).toBeNull();
  });

  it('la modification revient en rouvrant la fiche, et apparaît dans « Mes brouillons »', () => {
    saveDraft(EKEY, { text: 'Changé' });
    const { state, set } = setupEdit({ active: false, text: 'Original', id: 7 });
    set({ active: true });
    expect(state.text).toBe('Changé');
    saveDraft(editDraftKey(BASE, 3), { nameFr: 'Le Roi' });
    const found = scanPendingDrafts('u1', true).find((d) => d.key === editDraftKey(BASE, 3));
    expect(found?.label).toBe('Le Roi');
    expect(found?.def.noun).toBe('modification pas enregistrée');
    expect(found?.def.place).toContain('99 Noms');
  });
});
