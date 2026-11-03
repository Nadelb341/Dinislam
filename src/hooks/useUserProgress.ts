import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { JUZ } from '@/data/coranMeta';

interface ModuleProgress {
  validated: number;
  total: number;
}

interface UserProgress {
  sourates: ModuleProgress;
  nourania: ModuleProgress;
  ramadan: { completed: number; total: number };
  alphabet: ModuleProgress;
  invocations: { memorized: number; total: number };
  prayer: { validated: number };
  /** 99 Noms d'Allah validés */
  allahNames: ModuleProgress;
  /** Coran : Juz' terminés (toutes leurs sourates cochées dans l'onglet Juz') sur 30 */
  coran: ModuleProgress;
  /** Grammaire : leçons faites = exercices ouverts + toutes leurs flashcards « Je connais ce mot » (choix de Nadia 2026-11-03, gardé dans la base) */
  grammaire: ModuleProgress;
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
        { data: dailyPrayers },
        { count: totalSourates },
        { count: totalNourania },
        { count: totalRamadan },
        { count: totalAlphabet },
        { count: totalInvocations },
        { data: allahProgress },
        { count: totalAllah },
        { data: coranJuz },
        { data: grammaireCards },
        { data: grammaireRows },
        { data: learnedCards },
      ] = await Promise.all([
        supabase.from('user_sourate_progress').select('is_validated').eq('user_id', user.id),
        supabase.from('user_nourania_progress').select('is_validated').eq('user_id', user.id),
        supabase.from('user_ramadan_progress').select('video_watched, quiz_completed').eq('user_id', user.id),
        supabase.from('user_alphabet_progress').select('is_validated').eq('user_id', user.id),
        supabase.from('user_invocation_progress').select('is_memorized').eq('user_id', user.id),
        supabase.from('user_daily_prayers').select('is_checked').eq('user_id', user.id).eq('is_checked', true),
        supabase.from('sourates').select('*', { count: 'exact', head: true }),
        supabase.from('nourania_lessons').select('*', { count: 'exact', head: true }),
        supabase.from('ramadan_days').select('*', { count: 'exact', head: true }),
        supabase.from('alphabet_letters').select('*', { count: 'exact', head: true }),
        supabase.from('invocations').select('*', { count: 'exact', head: true }),
        supabase.from('user_allah_name_progress').select('is_validated').eq('user_id', user.id),
        supabase.from('allah_names').select('*', { count: 'exact', head: true }),
        supabase.from('coran_progress').select('key, data').eq('user_id', user.id).eq('kind', 'juz'),
        supabase.from('module_cards').select('id, learning_modules!inner(builtin_path), module_flashcards(id)').eq('learning_modules.builtin_path', '/grammaire'),
        supabase.from('user_grammaire_progress').select('card_id, exercices_at').eq('user_id', user.id),
        supabase.from('user_flashcard_learned').select('flashcard_id').eq('user_id', user.id),
      ]);

      // Coran : un Juz' est terminé quand toutes ses sourates sont cochées (même règle que les confettis de la page Coran)
      const juzTermines = (coranJuz || []).filter((r) => {
        const j = JUZ[Number(r.key) - 1];
        const done = ((r.data as { done?: number[] } | null)?.done) || [];
        return !!j && j.sourates.every((s) => done.includes(s.n));
      }).length;
      // Grammaire : exercices ouverts (base, ou copie du téléphone si pas encore recopiée) + toutes les flashcards connues
      const appris = new Set((learnedCards || []).map((r) => r.flashcard_id));
      const exosFaits = (id: string) => {
        if ((grammaireRows || []).some((r) => r.card_id === id && r.exercices_at)) return true;
        try { return localStorage.getItem(`grammaire_exercices_${user.id}_${id}`) === 'true'; } catch { return false; }
      };
      const leconFaite = (c: { id: string; module_flashcards: { id: string }[] | null }) =>
        exosFaits(c.id) && (c.module_flashcards || []).every((f) => appris.has(f.id));

      return {
        sourates: {
          validated: sourateProgress?.filter(p => p.is_validated).length || 0,
          total: totalSourates || 0,
        },
        nourania: {
          validated: nouraniaProgress?.filter(p => p.is_validated).length || 0,
          total: totalNourania || 0,
        },
        ramadan: {
          completed: ramadanProgress?.filter(p => p.video_watched && p.quiz_completed).length || 0,
          total: totalRamadan || 0,
        },
        alphabet: {
          validated: alphabetProgress?.filter(p => p.is_validated).length || 0,
          total: totalAlphabet || 0,
        },
        invocations: {
          memorized: invocationProgress?.filter(p => p.is_memorized).length || 0,
          total: totalInvocations || 0,
        },
        prayer: {
          validated: dailyPrayers?.length || 0,
        },
        allahNames: {
          validated: allahProgress?.filter(p => p.is_validated).length || 0,
          total: totalAllah || 0,
        },
        coran: { validated: juzTermines, total: JUZ.length },
        grammaire: {
          validated: (grammaireCards || []).filter(leconFaite).length,
          total: grammaireCards?.length || 0,
        },
      };
    },
    enabled: !!user,
    staleTime: 30000,
  });
};
