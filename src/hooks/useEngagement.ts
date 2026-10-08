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
