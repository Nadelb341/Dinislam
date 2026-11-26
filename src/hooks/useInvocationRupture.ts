import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getInvocationEnrichment } from '@/data/invocationsData';

/**
 * 🔗 2026-11-26 (Nadia : liens entre cartes, L10) : lien vers l'invocation de la rupture du jeûne
 * (« ذَهَبَ الظَّمَأُ… », Abou Dawoud 2357) dans la carte Invocations.
 * L'invocation est retrouvée par son titre (mêmes mots-clés que `invocationsData.ts`). Hors ligne : dernière copie
 * de la liste ; si elle est introuvable, le lien ouvre la carte Invocations.
 */
export function useLienInvocationRupture(): string {
  const { data } = useQuery({
    queryKey: ['invocation-rupture-jeune'],
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data: liste, error } = await supabase.from('invocations').select('id, title_french');
      if (error) throw error;
      const trouvee = (liste ?? []).find((i) => getInvocationEnrichment(i.title_french ?? '')?.keywords.includes('iftar'));
      return trouvee?.id ?? null;
    },
  });
  return data ? `/invocations?item=${data}` : '/invocations';
}
