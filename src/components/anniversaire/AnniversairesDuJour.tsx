import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/** Élèves qui ont un an de plus AUJOURD'HUI (prénom, groupes ; l'âge seulement pour l'enseignante). Rien sans réseau. */
export type AnnivJour = { user_id: string; prenom: string; age: number | null; group_ids: string[] };
export function useAnniversairesDuJour() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['anniversaires-aujourdhui', new Date().toLocaleDateString('en-CA')],
    enabled: !!user,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('anniversaires_aujourdhui' as never);
      if (error) throw error;
      return (data || []) as AnnivJour[];
    },
  });
}

/** 👥 Idée 7 : sur l'accueil d'un élève, ses camarades de groupe qui ont un an de plus aujourd'hui (jamais « joyeux anniversaire ») */
export function AnniversairesCamarades() {
  const { user } = useAuth();
  const { data: liste = [] } = useAnniversairesDuJour();
  const { data: mesGroupes = [] } = useQuery({
    queryKey: ['my-group-ids', user?.id],
    enabled: !!user && liste.length > 0,
    queryFn: async () => ((await supabase.from('student_group_members').select('group_id').eq('user_id', user!.id)).data || []).map((g) => g.group_id),
  });
  const camarades = liste.filter((a) => a.user_id !== user?.id && a.prenom && a.group_ids.some((g) => mesGroupes.includes(g)));
  if (!camarades.length) return null;
  const noms = camarades.map((a) => a.prenom);
  const qui = noms.length === 1 ? noms[0] : `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`;
  return (
    <p className="rounded-xl border border-violet-200 dark:border-violet-900 bg-violet-50/80 dark:bg-violet-950/30 px-3 py-2 text-sm font-semibold text-violet-900 dark:text-violet-100 [overflow-wrap:anywhere]">
      🎊 Aujourd'hui, {qui} {noms.length > 1 ? 'ont' : 'a'} un an de plus !
    </p>
  );
}
