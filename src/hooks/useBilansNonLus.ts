import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMesEnfants } from '@/hooks/useMesEnfants';
import { prenomDe } from '@/lib/espaceParents';

export interface BilanNonLu { child_id: string; prenom: string; n: number; soiMeme: boolean }

/**
 * 📊 Bilans du trimestre envoyés par le professeur et pas encore ouverts par un parent (2026-11-02, demande de Nadia).
 * Sert au message jaune de l'accueil et à la pastille rouge de la roue dentée ⚙️.
 * Les élèves ne lisent pas la table des bilans (contenu protégé par le code parents) : le nombre vient de la
 * fonction parent_unread_count, relue toutes les minutes et à chaque retour sur l'appli (pas de direct possible ici).
 * Même début de clé que l'Espace parents (['espace-parents', 'non-lus']) : fermer un bilan lu met tout à jour.
 */
export function useBilansNonLus() {
  const { data: enfants = [] } = useMesEnfants();
  const { data = [] } = useQuery({
    queryKey: ['espace-parents', 'non-lus', 'total', enfants.map((e) => e.child_id).join(',')],
    enabled: enfants.length > 0,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<BilanNonLu[]> => {
      const out = await Promise.all(enfants.map(async (e) => {
        const { data: n } = await supabase.rpc('parent_unread_count', { p_child: e.child_id });
        return { child_id: e.child_id, prenom: prenomDe(e.full_name), n: n ?? 0, soiMeme: e.soiMeme };
      }));
      return out.filter((b) => b.n > 0);
    },
  });
  return { bilans: data, total: data.reduce((t, b) => t + b.n, 0) };
}
