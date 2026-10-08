import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { byName } from '@/lib/utils';
import type { Engagement } from '@/lib/engagement';

/** Suivi de chaque élève (dernière validation, chemins de la semaine) — enseignante seulement */
export function useEngagement(enabled = true) {
  return useQuery({
    queryKey: ['student-engagement'],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('student_engagement');
      if (error) throw error;
      return ((data || []) as unknown as Engagement[]).sort(byName((e) => e.full_name));
    },
  });
}

/** Encouragements envoyés ces 8 derniers jours (le plus récent par élève) : « 🤖 relancé jeudi » / « ✉️ encouragé le … » */
export function useRecentEncouragements(enabled = true) {
  return useQuery({
    queryKey: ['recent-encouragements'],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const since = new Date(Date.now() - 8 * 86400000).toISOString();
      const { data, error } = await supabase.from('encouragement_logs').select('student_id, automatic, sent_at').gte('sent_at', since).order('sent_at', { ascending: false });
      if (error) throw error;
      const latest = new Map<string, { automatic: boolean; sent_at: string }>();
      for (const r of data || []) if (!latest.has(r.student_id)) latest.set(r.student_id, r);
      return latest;
    },
  });
}

/** « 🤖 relancé jeu. 09/10 » ou « ✉️ encouragé le 09/10 » */
export function encouragementLabel(e?: { automatic: boolean; sent_at: string }) {
  if (!e) return '';
  const d = new Date(e.sent_at).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  return e.automatic ? `🤖 relancé ${d}` : `✉️ encouragé ${d}`;
}
