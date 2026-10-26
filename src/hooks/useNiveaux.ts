import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Niveau = { id: string; group_id: string; name: string; member_ids: string[]; position: number };

/** Niveaux d'un groupe (idée 1, 2026-10-26) : utilisés pour distribuer un devoir à un niveau en un toucher */
export function useNiveaux(groupId: string | null | undefined) {
  return useQuery({
    queryKey: ['cahier-classe', 'niveaux', groupId ?? null],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase.from('group_levels').select('*').eq('group_id', groupId!).order('position');
      if (error) throw error;
      return (data || []) as Niveau[];
    },
  });
}

