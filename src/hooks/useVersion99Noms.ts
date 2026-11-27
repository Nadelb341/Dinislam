import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ageDe, estChoixVersion, versionPourEleve, type ChoixVersion, type Version99Noms } from '@/lib/ficheEnfant';

/**
 * 🧒🧑 Quelle version des 99 noms voit l'utilisateur connecté (Nadia, 27/11) :
 * enseignante → null (elle voit les 2, avec une bascule) ; élève → petit / enfant / adulte (choix de l'enseignante, sinon l'âge).
 * Hors ligne : dernière copie des 2 lectures (service worker) ; sans rien, « enfant » (règle : âge inconnu = enfant).
 */
export function useVersion99Noms(): { version: Version99Noms | null; pret: boolean } {
  const { user, isAdmin } = useAuth();
  const { data, isFetched } = useQuery({
    queryKey: ['version-99-noms', user?.id],
    enabled: !!user && !isAdmin,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const [profil, choix] = await Promise.all([
        supabase.from('profiles').select('age, date_of_birth').eq('user_id', user!.id).maybeSingle(),
        supabase.from('allah_names_version_eleve').select('version').eq('user_id', user!.id).maybeSingle(),
      ]);
      const c = choix.data?.version;
      return { age: ageDe(profil.data), choix: estChoixVersion(c) ? c : 'auto' as ChoixVersion };
    },
  });
  if (isAdmin) return { version: null, pret: true };
  return { version: versionPourEleve(data?.age ?? null, data?.choix), pret: !user || isFetched };
}
