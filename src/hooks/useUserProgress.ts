import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserProgress {
  sourates: { validated: number; total: number; percentage: number };
  nourania: { validated: number; total: number; percentage: number };
  ramadan: { completed: number; total: number; percentage: number };
  alphabet: { validated: number; total: number; percentage: number };
  invocations: { memorized: number; total: number; percentage: number };
  prayer: { validated: number; total: number; percentage: number };
}

export const useUserProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: async (): Promise<UserProgress> => {
      if (!user) throw new Error('No user');

      const [
        { data: sourateProgress },
        { data: nouraniaProgress },
        { data: ramadanProgress },
        { data: alphabetProgress },
        { data: invocationProgress },
        { data: prayerProgress },
        { count: totalSourates },
        { count: totalNourania },
        { count: totalRamadan },
        { count: totalAlphabet },
        { count: totalInvocations },
        { count: totalPrayer },
      ] = await Promise.all([
        supabase.from('user_sourate_progress').select('is_validated').eq('user_id', user.id),
        supabase.from('user_nourania_progress').select('is_validated').eq('user_id', user.id),
        supabase.from('user_ramadan_progress').select('video_watched, quiz_completed, pdf_read').eq('user_id', user.id),
        supabase.from('user_alphabet_progress').select('is_validated').eq('user_id', user.id),
        supabase.from('user_invocation_progress').select('is_memorized').eq('user_id', user.id),
        supabase.from('user_prayer_progress').select('is_validated').eq('user_id', user.id),
        supabase.from('sourates').select('*', { count: 'exact', head: true }),
        supabase.from('nourania_lessons').select('*', { count: 'exact', head: true }),
        supabase.from('ramadan_days').select('*', { count: 'exact', head: true }),
        supabase.from('alphabet_letters').select('*', { count: 'exact', head: true }),
        supabase.from('invocations').select('*', { count: 'exact', head: true }),
        supabase.from('prayer_categories').select('*', { count: 'exact', head: true }),
      ]);

      const sourateValidated = sourateProgress?.filter(p => p.is_validated).length || 0;
      const nouraniaValidated = nouraniaProgress?.filter(p => p.is_validated).length || 0;
      const ramadanCompleted = ramadanProgress?.filter(p => p.video_watched && p.quiz_completed).length || 0;
      const alphabetValidated = alphabetProgress?.filter(p => p.is_validated).length || 0;
      const invocationsMemorized = invocationProgress?.filter(p => p.is_memorized).length || 0;
      const prayerValidated = prayerProgress?.filter(p => p.is_validated).length || 0;

      const calcPercentage = (value: number, total: number) => 
        total > 0 ? Math.round((value / total) * 100) : 0;

      return {
        sourates: {
          validated: sourateValidated,
          total: totalSourates || 0,
          percentage: calcPercentage(sourateValidated, totalSourates || 0),
        },
        nourania: {
          validated: nouraniaValidated,
          total: totalNourania || 0,
          percentage: calcPercentage(nouraniaValidated, totalNourania || 0),
        },
        ramadan: {
          completed: ramadanCompleted,
          total: totalRamadan || 0,
          percentage: calcPercentage(ramadanCompleted, totalRamadan || 0),
        },
        alphabet: {
          validated: alphabetValidated,
          total: totalAlphabet || 0,
          percentage: calcPercentage(alphabetValidated, totalAlphabet || 0),
        },
        invocations: {
          memorized: invocationsMemorized,
          total: totalInvocations || 0,
          percentage: calcPercentage(invocationsMemorized, totalInvocations || 0),
        },
        prayer: {
          validated: prayerValidated,
          total: totalPrayer || 0,
          percentage: calcPercentage(prayerValidated, totalPrayer || 0),
        },
      };
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });
};
