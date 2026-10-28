import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { espaceParentsActif } from '@/lib/espaceParents';

export interface EnfantEspace { child_id: string; full_name: string | null; soiMeme: boolean }

/**
 * 👨‍👩‍👧 Les enfants dont le compte connecté peut ouvrir l'Espace parents :
 *  - lui-même s'il a l'Espace parents (enfant de moins de 18 ans : ses parents utilisent son compte) ;
 *  - ses enfants reliés s'il est un élève adulte parent (triés par prénom).
 */
export function useMesEnfants() {
  const { user, isAdmin } = useAuth();
  return useQuery({
    queryKey: ['espace-parents', 'enfants', user?.id],
    enabled: !!user && !isAdmin,
    queryFn: async () => {
      const [{ data: moi }, { data: liens }] = await Promise.all([
        supabase.from('profiles').select('full_name, date_of_birth, age, espace_parents').eq('user_id', user!.id).maybeSingle(),
        supabase.rpc('parent_children'),
      ]);
      const enfants: EnfantEspace[] = (liens || []).map((l) => ({ child_id: l.child_id, full_name: l.full_name, soiMeme: false }));
      const soi = espaceParentsActif(moi) ? [{ child_id: user!.id, full_name: moi?.full_name ?? null, soiMeme: true }] : [];
      return [...soi, ...enfants];
    },
  });
}
