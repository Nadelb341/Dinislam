import { useEffect, useState } from 'react';
import { DRAFTS_CHANGED_EVENT } from '@/hooks/useDraftRecovery';
import { hasDraft, scanPendingDrafts, type PendingDraft } from '@/lib/pendingDrafts';

/** Relance `read` à chaque changement de brouillon (cette fenêtre ou un autre onglet). */
function useDraftsWatch<T>(read: () => T, deps: unknown[]): T {
  const [value, setValue] = useState(read);
  useEffect(() => {
    const refresh = () => setValue(read());
    refresh();
    window.addEventListener(DRAFTS_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(DRAFTS_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read dépend seulement de deps
  }, deps);
  return value;
}

/** Pastille 📝 : un brouillon existe pour cette clé (ou ce préfixe se terminant par « _ »). */
export function useHasDraft(keyOrPrefix: string | string[] | null | undefined): boolean {
  const keys = (Array.isArray(keyOrPrefix) ? keyOrPrefix : [keyOrPrefix]).filter((k): k is string => !!k);
  const joined = keys.join('|');
  return useDraftsWatch(() => keys.some(hasDraft), [joined]);
}

/** Liste « Mes brouillons » de l'utilisateur connecté, tenue à jour. */
export function usePendingDrafts(userId: string | null | undefined, isAdmin: boolean): PendingDraft[] {
  return useDraftsWatch(
    () => (userId ? scanPendingDrafts(userId, isAdmin).sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0)) : []),
    [userId, isAdmin],
  );
}
