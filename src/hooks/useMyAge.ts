import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/** Âge de l'utilisateur connecté (date de naissance en priorité, sinon âge saisi) ; null s'il est inconnu. */
export const useMyAge = (): number | null => {
  const { user } = useAuth();
  const { data = null } = useQuery({
    queryKey: ['user-age', user?.id],
    enabled: !!user,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('age, date_of_birth').eq('user_id', user!.id).maybeSingle();
      if (!data) return null;
      if (data.date_of_birth) {
        const dob = new Date(data.date_of_birth);
        const today = new Date();
        return today.getFullYear() - dob.getFullYear() - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
      }
      return data.age ?? null;
    },
  });
  return data;
};
