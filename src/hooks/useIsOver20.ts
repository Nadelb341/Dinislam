import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Retourne true si l'utilisateur connecté a 20 ans ou plus.
 * Utilisé pour l'auto-validation (sans attente de l'admin).
 * Priorité : date_of_birth (plus précis) → age (stocké manuellement).
 */
const useAgeCheckQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-age-check', user?.id],
    enabled: !!user,
    staleTime: 60 * 60 * 1000, // 1h de cache
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('age, date_of_birth')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!data) return false;

      if (data.date_of_birth) {
        const dob = new Date(data.date_of_birth);
        const today = new Date();
        const age =
          today.getFullYear() -
          dob.getFullYear() -
          (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
        return age >= 20;
      }

      if (data.age !== null && data.age !== undefined) {
        return data.age >= 20;
      }

      return false;
    },
  });
};

export const useIsOver20 = (): boolean => {
  const { data: isOver20 = false } = useAgeCheckQuery();
  return isOver20;
};

/** Vrai quand l'âge est connu (réponse reçue, même en erreur) : évite de juger « verrouillé » trop tôt. */
export const useIsOver20Ready = (): boolean => {
  const { user } = useAuth();
  const { isFetched } = useAgeCheckQuery();
  return !user || isFetched;
};
