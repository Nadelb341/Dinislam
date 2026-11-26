import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CarteVocab } from '@/lib/coranVocabulaire';

/** Clé react-query (en direct : `coran_vocabulaire` → 'coran-vocabulaire' dans realtimeSync.ts) */
export const CLE_VOCAB = ['coran-vocabulaire'];

/**
 * 📖 Cartes du « Vocabulaire du Coran ». L'élève ne reçoit que ce qu'il a le droit de voir (RLS de la base) ;
 * l'enseignante reçoit tout. Hors ligne : dernière copie gardée par le service worker.
 */
export function useCoranVocabulaire() {
  const { user } = useAuth();
  return useQuery({
    // L'id de la personne dans la clé : en 👻 mode fantôme, on ne voit jamais la liste d'un autre compte
    queryKey: [...CLE_VOCAB, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('coran_vocabulaire')
        .select('id, parent_id, cle, titre, emoji, couleur, pdf_url, page_debut, page_fin, position, mode, group_ids, user_ids')
        .order('position').order('created_at');
      if (error) throw error;
      return (data || []) as CarteVocab[];
    },
  });
}
