import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveDraft, loadDraft, clearDraft, draftSavedAt, DRAFTS_CHANGED_EVENT } from '@/hooks/useDraftRecovery';
import { hasDraft, trashOldDrafts } from './pendingDrafts';

const moveToTrash = vi.fn(async () => true);
vi.mock('@/lib/trash', () => ({ moveToTrash: (...a: unknown[]) => moveToTrash(...(a as [])) }));

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

const DAY = 24 * 60 * 60 * 1000;

describe('brouillons : date, pastille, rangement après 30 jours', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
    moveToTrash.mockClear();
    moveToTrash.mockResolvedValue(true);
  });

  it('enregistre la date et prévient quand un brouillon change', () => {
    const seen = vi.fn();
    window.addEventListener(DRAFTS_CHANGED_EVENT, seen);
    saveDraft('dinislam_version', { label: 'v2' });
    expect(draftSavedAt('dinislam_version')).toBeGreaterThan(0);
    saveDraft('dinislam_version', { label: 'v2' }); // même contenu : rien ne change
    clearDraft('dinislam_version');
    window.removeEventListener(DRAFTS_CHANGED_EVENT, seen);
    expect(seen).toHaveBeenCalledTimes(2);
    expect(draftSavedAt('dinislam_version')).toBeNull();
  });

  it('pastille : clé exacte, préfixe, et brouillon vide ignoré', () => {
    saveDraft('dinislam_flashcard_abc', { front: 'Bonjour' });
    saveDraft('dinislam_version', { label: '' });
    expect(hasDraft('dinislam_flashcard_abc')).toBe(true);
    expect(hasDraft('dinislam_flashcard_')).toBe(true);
    expect(hasDraft('dinislam_flashcard_xyz')).toBe(false);
    expect(hasDraft('dinislam_version')).toBe(false);
  });

  it('brouillon de plus de 30 jours : mis dans la corbeille puis retiré ; récent : gardé', async () => {
    saveDraft('dinislam_invocation', { title: 'Vieille' });
    localStorage.setItem('draftsaved_dinislam_invocation', String(Date.now() - 31 * DAY));
    saveDraft('dinislam_allah_name', { nameFr: 'Récent' });
    expect(await trashOldDrafts('u1', true)).toBe(1);
    expect(moveToTrash).toHaveBeenCalledTimes(1);
    expect(loadDraft('dinislam_invocation')).toBeNull();
    expect(loadDraft('dinislam_allah_name')).toEqual({ nameFr: 'Récent' });
  });

  it('corbeille impossible : le brouillon est conservé', async () => {
    moveToTrash.mockResolvedValue(false);
    saveDraft('dinislam_invocation', { title: 'Vieille' });
    localStorage.setItem('draftsaved_dinislam_invocation', String(Date.now() - 40 * DAY));
    expect(await trashOldDrafts('u1', true)).toBe(0);
    expect(loadDraft('dinislam_invocation')).toEqual({ title: 'Vieille' });
  });

  it('ancien brouillon sans date : le délai part d\'aujourd\'hui, rien n\'est rangé', async () => {
    localStorage.setItem('draft_dinislam_invocation', JSON.stringify({ title: 'Ancien' }));
    expect(await trashOldDrafts('u1', true)).toBe(0);
    expect(draftSavedAt('dinislam_invocation')).toBeGreaterThan(Date.now() - 1000);
  });

  it('un élève ne range jamais les brouillons de l\'enseignante', async () => {
    saveDraft('dinislam_invocation', { title: 'Vieille' });
    localStorage.setItem('draftsaved_dinislam_invocation', String(Date.now() - 31 * DAY));
    expect(await trashOldDrafts('eleve', false)).toBe(0);
    expect(loadDraft('dinislam_invocation')).not.toBeNull();
  });
});
