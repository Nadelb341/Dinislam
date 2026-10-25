import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';
import type { Programme } from '@/lib/coranPlan';

/**
 * Carte « Coran » (2026-10-25) : progression séparée par onglet, pour ne jamais mélanger.
 *  - lecture / main      → { page, bookmarks }   (lecture libre)
 *  - juz / '1'..'30'     → { done: [sourates] }  (parcours de chaque Juz')
 *  - programme / active  → Programme              (lecture du jour)
 */
export type BookmarkColor = 'rouge' | 'or' | 'vert' | 'bleu';
/** Note d'un marque-page (plusieurs notes datées possibles, 2026-10-25) */
export interface BookmarkNote { id: string; text: string; date: string }
export interface Bookmark {
  index: number; color: BookmarkColor; label: string;
  notes?: BookmarkNote[];
  /** « À réviser » : date (AAAA-MM-JJ) où la page revient comme rappel de révision */
  reviewAt?: string;
}
export interface Lecture { index: number; bookmarks: Bookmark[] }

type Row = { kind: string; key: string; data: Json };

export const CORAN_PROGRESS_KEY = 'coran-progress';

export function useCoranProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const qk = useMemo(() => [CORAN_PROGRESS_KEY, user?.id ?? null], [user?.id]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: qk,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('coran_progress').select('kind, key, data').eq('user_id', user!.id);
      if (error) throw error;
      return (data || []) as Row[];
    },
  });

  const get = useCallback(<T,>(kind: string, key: string): T | null => {
    const r = rows.find((x) => x.kind === kind && x.key === key);
    return r ? (r.data as unknown as T) : null;
  }, [rows]);

  /** Enregistre tout de suite à l'écran, puis en base (retour en arrière si l'écriture échoue) */
  const save = useCallback(async (kind: 'lecture' | 'juz' | 'programme', key: string, data: unknown) => {
    if (!user) return;
    const before = queryClient.getQueryData<Row[]>(qk) || [];
    const next = [...before.filter((x) => !(x.kind === kind && x.key === key)), { kind, key, data: data as Json }];
    queryClient.setQueryData(qk, next);
    const { error } = await supabase.from('coran_progress')
      .upsert({ user_id: user.id, kind, key, data: data as Json, updated_at: new Date().toISOString() }, { onConflict: 'user_id,kind,key' });
    if (error) { queryClient.setQueryData(qk, before); throw error; }
  }, [user, queryClient, qk]);

  /** Retire une progression (ex. arrêter un programme) : copie dans la corbeille d'abord */
  const remove = useCallback(async (kind: 'juz' | 'programme', key: string, label: string) => {
    if (!user) return;
    const { data: row } = await supabase.from('coran_progress').select('*').eq('user_id', user.id).eq('kind', kind).eq('key', key).maybeSingle();
    if (!row) return;
    const { trashThenDelete } = await import('@/lib/trash');
    await trashThenDelete({ userId: user.id, type: 'coran_progress', id: row.id, label, data: row,
      remove: () => supabase.from('coran_progress').delete().eq('id', row.id) });
    queryClient.invalidateQueries({ queryKey: qk });
  }, [user, queryClient, qk]);

  const lecture: Lecture = { index: 1, bookmarks: [], ...(get<Lecture>('lecture', 'main') || {}) };
  const juzDone = useCallback((n: number) => (get<{ done: number[] }>('juz', String(n))?.done) || [], [get]);
  const programme = get<Programme>('programme', 'active');

  return { isLoading, lecture, juzDone, programme, save, remove };
}
