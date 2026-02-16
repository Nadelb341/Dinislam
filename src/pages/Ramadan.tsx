import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Play, Moon, Star, Lock, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useConfetti } from '@/hooks/useConfetti';
import UnlockConfirmDialog from '@/components/ramadan/UnlockConfirmDialog';
import RamadanDayDialog from '@/components/ramadan/RamadanDayDialog';

interface RamadanDay {
  id: number;
  day_number: number;
  theme: string | null;
  video_url: string | null;
  pdf_url: string | null;
}

interface Quiz {
  id: string;
  day_id: number;
  question: string;
  options: string[];
  correct_option: number | null;
}

interface UserProgress {
  id: string;
  day_id: number;
  video_watched: boolean;
  quiz_completed: boolean;
  pdf_read: boolean;
}

const Ramadan = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { fireSuccess } = useConfetti();
  const [openDay, setOpenDay] = useState<RamadanDay | null>(null);
  const [pendingDayToOpen, setPendingDayToOpen] = useState<RamadanDay | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: settings } = useQuery({
    queryKey: ['ramadan-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ramadan_settings').select('*').single();
      if (error) throw error;
      return data;
    },
  });

  const { data: days = [] } = useQuery({
    queryKey: ['ramadan-days'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ramadan_days').select('*').order('day_number');
      if (error) throw error;
      return data as RamadanDay[];
    },
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['ramadan-quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ramadan_quizzes').select('*');
      if (error) throw error;
      return data.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)
      })) as Quiz[];
    },
  });

  const { data: userProgress = [] } = useQuery({
    queryKey: ['ramadan-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('user_ramadan_progress').select('*').eq('user_id', user.id);
      if (error) throw error;
      return data as UserProgress[];
    },
    enabled: !!user?.id,
  });

  const { data: quizResponses = [] } = useQuery({
    queryKey: ['ramadan-quiz-responses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('quiz_responses').select('*').eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const completedDays = userProgress.filter(p => p.quiz_completed).length;
  const progressPercentage = Math.round((completedDays / 30) * 100);
  const getDayProgress = (dayId: number) => userProgress.find(p => p.day_id === dayId);
  const getQuizzesForDay = (dayId: number) => quizzes.filter(q => q.day_id === dayId);

  const getDayUnlockTime = (dayNumber: number): Date | null => {
    if (!settings?.started_at) return null;
    const startDate = new Date(settings.started_at);
    if (dayNumber === 1) return startDate;
    const unlockDate = new Date(startDate);
    unlockDate.setDate(unlockDate.getDate() + (dayNumber - 1));
    unlockDate.setHours(16, 0, 0, 0);
    return unlockDate;
  };

  const isDayUnlocked = (dayNumber: number) => {
    if (!settings?.start_enabled) return false;
    if (dayNumber === 1) return true;
    const previousDay = days.find(d => d.day_number === dayNumber - 1);
    if (!previousDay) return false;
    const previousProgress = getDayProgress(previousDay.id);
    if (!previousProgress?.quiz_completed) return false;
    const unlockTime = getDayUnlockTime(dayNumber);
    if (!unlockTime) return false;
    return now >= unlockTime;
  };

  const isWaitingForTime = (dayNumber: number) => {
    if (dayNumber === 1 || !settings?.start_enabled) return false;
    const previousDay = days.find(d => d.day_number === dayNumber - 1);
    if (!previousDay) return false;
    const previousProgress = getDayProgress(previousDay.id);
    if (!previousProgress?.quiz_completed) return false;
    const unlockTime = getDayUnlockTime(dayNumber);
    if (!unlockTime) return false;
    return now < unlockTime;
  };

  const dayHasContent = (day: RamadanDay) => !!day.video_url && getQuizzesForDay(day.id).length > 0;

  const markProgressMutation = useMutation({
    mutationFn: async ({ dayId, field }: { dayId: number; field: 'video_watched' | 'quiz_completed' }) => {
      if (!user?.id) throw new Error('Non connecté');
      const existingProgress = userProgress.find(p => p.day_id === dayId);
      if (existingProgress) {
        const { error } = await supabase.from('user_ramadan_progress')
          .update({ [field]: true, updated_at: new Date().toISOString() })
          .eq('id', existingProgress.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_ramadan_progress')
          .insert({ user_id: user.id, day_id: dayId, [field]: true });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ramadan-progress'] }),
  });

  const saveQuizResponseMutation = useMutation({
    mutationFn: async ({ quizId, selectedOption }: { quizId: string; selectedOption: number }) => {
      if (!user?.id) throw new Error('Non connecté');
      const existing = quizResponses.find(r => r.quiz_id === quizId);
      if (existing) return;
      const { error } = await supabase.from('quiz_responses')
        .insert({ user_id: user.id, quiz_id: quizId, selected_option: selectedOption });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ramadan-quiz-responses'] }),
  });

  const handleDayClick = (day: RamadanDay) => {
    const isUnlocked = isDayUnlocked(day.day_number);
    const hasContent = dayHasContent(day);
    const waiting = isWaitingForTime(day.day_number);

    if (day.day_number === 1 && !settings?.start_enabled) {
      toast.error('Le calendrier n\'est pas encore ouvert. Patience !');
      return;
    }
    if (waiting) {
      const unlockTime = getDayUnlockTime(day.day_number);
      if (unlockTime) {
        const diff = unlockTime.getTime() - now.getTime();
        const hours = Math.ceil(diff / (1000 * 60 * 60));
        toast.info(`Ce jour sera disponible dans ~${hours}h. Bsaha ftourek ! 🌙`);
      }
      return;
    }
    if (!isUnlocked) {
      toast.error('Complétez d\'abord le quiz du jour précédent');
      return;
    }
    if (!hasContent) {
      toast.info('Contenu pas encore disponible pour ce jour');
      return;
    }

    // Day 1 opens directly, other days show confirmation
    if (day.day_number > 1) {
      setPendingDayToOpen(day);
    } else {
      setOpenDay(day);
    }
  };

  const handleConfirmOpen = () => {
    if (pendingDayToOpen) {
      setOpenDay(pendingDayToOpen);
      setPendingDayToOpen(null);
    }
  };

  const handleQuizSubmit = (allCorrect: boolean, wrongCount: number) => {
    if (!openDay) return;
    if (allCorrect) {
      fireSuccess();
      markProgressMutation.mutate({ dayId: openDay.id, field: 'quiz_completed' });
      toast.success('Bravo ! Toutes les réponses sont correctes ! 🎉');
    } else {
      toast.error(`${wrongCount} réponse(s) incorrecte(s). Réessayez !`);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <Moon className="h-6 w-6 text-gold" />
            <h1 className="text-2xl font-bold text-foreground font-arabic">رمضان كريم</h1>
            <Star className="h-5 w-5 text-gold" />
          </div>
          <p className="text-muted-foreground">30 Jours de Spiritualité</p>
        </div>

        {/* Progress Card */}
        <div className="module-card rounded-2xl p-4 space-y-3 animate-fade-in bg-gradient-to-br from-primary/5 to-gold/5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Votre parcours spirituel</span>
            <span className="text-sm font-bold text-gold">{completedDays}/30 jours</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-xs text-center text-muted-foreground">{progressPercentage}% du Ramadan complété</p>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
          {days.map((day) => {
            const progress = getDayProgress(day.id);
            const isCompleted = progress?.quiz_completed;
            const isUnlocked = isDayUnlocked(day.day_number);
            const hasContent = dayHasContent(day);
            const waiting = isWaitingForTime(day.day_number);
            const notStarted = day.day_number === 1 && !settings?.start_enabled;

            return (
              <button
                key={day.id}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all duration-200 relative',
                  isCompleted
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md'
                    : waiting
                    ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white cursor-wait'
                    : notStarted || !isUnlocked
                    ? 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                    : !hasContent
                    ? 'bg-muted/30 text-muted-foreground/50'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : waiting ? (
                  <Clock className="h-4 w-4" />
                ) : notStarted || !isUnlocked ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <span>{day.day_number}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500 to-green-600" />
            <span>Complété</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
              <Clock className="h-2 w-2 text-white" />
            </div>
            <span>En attente</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-muted flex items-center justify-center">
              <Lock className="h-2 w-2" />
            </div>
            <span>Verrouillé</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-muted" />
            <span>Disponible</span>
          </div>
        </div>

        {/* Day Dialog */}
        {openDay && (
          <RamadanDayDialog
            open={!!openDay}
            onOpenChange={(isOpen) => !isOpen && setOpenDay(null)}
            dayNumber={openDay.day_number}
            theme={openDay.theme}
            videoUrl={openDay.video_url}
            quizzes={getQuizzesForDay(openDay.id)}
            quizCompleted={!!getDayProgress(openDay.id)?.quiz_completed}
            videoWatched={!!getDayProgress(openDay.id)?.video_watched}
            onMarkVideoWatched={() => markProgressMutation.mutate({ dayId: openDay.id, field: 'video_watched' })}
            onSubmitQuiz={handleQuizSubmit}
            onSaveQuizResponse={(quizId, selectedOption) => saveQuizResponseMutation.mutate({ quizId, selectedOption })}
          />
        )}

        <UnlockConfirmDialog
          open={!!pendingDayToOpen}
          onOpenChange={(open) => !open && setPendingDayToOpen(null)}
          onConfirm={handleConfirmOpen}
          dayNumber={pendingDayToOpen?.day_number || 0}
        />
      </div>
    </AppLayout>
  );
};

export default Ramadan;
