import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * 🔗 2026-11-26 (Nadia : liens entre cartes, L19) : numéros des sourates déjà validées par l'élève
 * (carte Sourates, `user_sourate_progress` context 'sourates') → pastille ✅ dans le sommaire du Coran.
 * Hors ligne : dernière copie gardée par le service worker. En direct : clé 'coran-sourates-validees' (realtimeSync).
 */
export function useSouratesValidees(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['coran-sourates-validees', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<number[]> => {
      const [prog, liste] = await Promise.all([
        supabase.from('user_sourate_progress').select('sourate_id').eq('user_id', userId!).eq('context', 'sourates').eq('is_validated', true),
        supabase.from('sourates').select('id, number'),
      ]);
      if (prog.error) throw prog.error;
      if (liste.error) throw liste.error;
      const numero = new Map((liste.data ?? []).map((s) => [s.id, s.number]));
      return (prog.data ?? []).map((p) => numero.get(p.sourate_id)).filter((n): n is number => typeof n === 'number');
    },
  });
}

/** 🔗 2026-11-26 (Nadia : liens entre cartes, L3) : ouvre la carte Sourates sur cette sourate */
export const lienSourate = (numero: number) => `/sourates?item=${numero}`;
