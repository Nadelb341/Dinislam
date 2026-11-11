import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LectureCarnet, MessageCarnet } from '@/lib/carnet';

/**
 * 📒 Données du carnet de liaison. Élève / parent : la base ne lui donne QUE ses messages (déjà envoyés).
 * Enseignante : tout (y compris les messages programmés) + toutes les lectures + les modèles.
 * En direct (realtimeSync › clé 'carnet') ; lisible hors ligne (dernière copie gardée par l'appli).
 */
export function useCarnet(userId: string | null, isAdmin: boolean) {
  return useQuery({
    queryKey: ['carnet', isAdmin ? 'admin' : userId],
    enabled: !!userId,
    queryFn: async () => {
      const [msgs, lects, modeles, enfants] = await Promise.all([
        supabase.from('carnet_messages').select('*').order('envoyer_le', { ascending: false }).limit(isAdmin ? 300 : 120),
        isAdmin ? supabase.from('carnet_lectures').select('id, message_id, user_id, role, lu_le, reponse')
          : supabase.from('carnet_lectures').select('id, message_id, user_id, role, lu_le, reponse').eq('user_id', userId!),
        isAdmin ? supabase.from('carnet_modeles').select('*').order('position').order('created_at') : Promise.resolve({ data: [], error: null }),
        // Compte d'un parent relié : il signe directement depuis son compte
        isAdmin ? Promise.resolve({ data: [], error: null }) : supabase.from('parent_links').select('child_id').eq('parent_id', userId!),
      ]);
      const err = [msgs, lects, modeles, enfants].find((r) => r.error)?.error;
      if (err) throw err;
      return {
        messages: (msgs.data || []) as MessageCarnet[],
        lectures: (lects.data || []) as LectureCarnet[],
        modeles: (modeles.data || []) as { id: string; emoji: string; titre: string; texte: string; position: number }[],
        estParent: (enfants.data || []).length > 0,
      };
    },
  });
}
export type DonneesCarnet = NonNullable<ReturnType<typeof useCarnet>['data']>;
