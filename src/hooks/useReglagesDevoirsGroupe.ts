import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fusionLignes, type ReglagesGroupeDevoirs } from '@/lib/devoirFichiers';

/** Réglages d'un groupe (lignes + maximum), lus partout où on donne un devoir à ce groupe */
export function useReglagesDevoirsGroupe(groupId: string | null | undefined) {
  return useQuery({
    queryKey: ['group-devoir-settings', groupId ?? 'aucun'],
    enabled: !!groupId,
    queryFn: async (): Promise<ReglagesGroupeDevoirs> => {
      const { data } = await supabase.from('group_devoir_settings').select('max_devoirs, lignes').eq('group_id', groupId!).maybeSingle();
      return { max_devoirs: data?.max_devoirs ?? null, lignes: fusionLignes(data?.lignes) };
    },
  });
}

