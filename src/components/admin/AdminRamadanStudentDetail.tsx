import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle2, XCircle, Video, LogIn, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  studentId: string;
  studentName: string;
  onBack: () => void;
}

const AdminRamadanStudentDetail = ({ studentId, studentName, onBack }: Props) => {
  const [showErrors, setShowErrors] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ramadan-student-detail', studentId],
    queryFn: async () => {
      const [daysRes, progressRes, responsesRes, quizzesRes, logsRes] = await Promise.all([
        (supabase as any).from('ramadan_days').select('*').order('day_number'),
        (supabase as any).from('user_ramadan_progress').select('*').eq('user_id', studentId),
        (supabase as any).from('quiz_responses').select('quiz_id, is_correct, attempt_number, selected_option, created_at').eq('user_id', studentId),
        (supabase as any).from('ramadan_quizzes').select('id, day_id, question, correct_option, options'),
        (supabase as any).from('connexion_logs').select('login_at').eq('user_id', studentId),
      ]);

      const days = daysRes.data || [];
      const progress = progressRes.data || [];
      const responses = responsesRes.data || [];
      const quizzes = quizzesRes.data || [];
      const logs = logsRes.data || [];

      // Build quiz maps
      const quizToDayMap: Record<string, number> = {};
      const quizMap: Record<string, any> = {};
      quizzes.forEach((q: any) => {
        quizToDayMap[q.id] = q.day_id;
        quizMap[q.id] = q;
      });

      // Group responses by day_id
      const responsesByDay: Record<number, any[]> = {};
      responses.forEach((r: any) => {
        const dayId = quizToDayMap[r.quiz_id];
        if (dayId != null) {
          if (!responsesByDay[dayId]) responsesByDay[dayId] = [];
          responsesByDay[dayId].push(r);
        }
      });

      // Build progress map by day_id
      const progressByDay: Record<number, any> = {};
      progress.forEach((p: any) => { progressByDay[p.day_id] = p; });

      // Stats
      const totalQuizCompleted = progress.filter((p: any) => p.quiz_completed).length;
      const totalVideoWatched = progress.filter((p: any) => p.video_watched).length;
      const totalConnections = logs.length;

      // Errors
      const errorResponses = responses.filter((r: any) => !r.is_correct);
      const totalErrors = errorResponses.length;

      // Build error details with day info
      const dayById: Record<number, any> = {};
      days.forEach((d: any) => { dayById[d.id] = d; });

      const errorDetails = errorResponses.map((r: any) => {
        const quiz = quizMap[r.quiz_id];
        const dayId = quizToDayMap[r.quiz_id];
        const day = dayId != null ? dayById[dayId] : null;
        const options = quiz?.options || [];
        return {
          dayNumber: day?.day_number || '?',
          question: quiz?.question || '—',
          selectedOption: typeof r.selected_option === 'number' && options[r.selected_option] ? options[r.selected_option] : `Option ${r.selected_option}`,
          correctOption: typeof quiz?.correct_option === 'number' && options[quiz.correct_option] ? options[quiz.correct_option] : '—',
        };
      });

      // Build rows
      const rows = days.map((day: any) => {
        const p = progressByDay[day.id];
        const dayResponses = responsesByDay[day.id] || [];
        const attempts = dayResponses.length;
        const correctCount = dayResponses.filter((r: any) => r.is_correct).length;
        const successRate = attempts > 0 ? Math.round((correctCount / attempts) * 100) : null;

        return {
          dayNumber: day.day_number,
          theme: day.theme || '',
          quizCompleted: p?.quiz_completed || false,
          videoWatched: p?.video_watched || false,
          pdfRead: p?.pdf_read || false,
          attempts,
          successRate,
          hasData: !!p,
          allDone: p?.quiz_completed && p?.video_watched && p?.pdf_read,
        };
      });

      return { rows, totalQuizCompleted, totalVideoWatched, totalConnections, totalErrors, errorDetails, totalDays: days.length };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const { rows = [], totalQuizCompleted = 0, totalVideoWatched = 0, totalConnections = 0, totalErrors = 0, errorDetails = [] } = data || {};

  const stats = [
    { label: 'Quiz complétés', value: totalQuizCompleted, icon: CheckCircle2, color: 'text-green-600', clickable: false },
    { label: 'Vidéos vues', value: totalVideoWatched, icon: Video, color: 'text-blue-600', clickable: false },
    { label: "Nb d'erreurs", value: totalErrors, icon: AlertTriangle, color: 'text-red-600', clickable: true },
    { label: 'Connexions', value: totalConnections, icon: LogIn, color: 'text-purple-600', clickable: false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">{studentName || 'Élève'}</h2>
          <p className="text-sm text-muted-foreground">Détail Ramadan</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <Card
            key={s.label}
            className={s.clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
            onClick={s.clickable ? () => setShowErrors(!showErrors) : undefined}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-6 w-6 ${s.color}`} />
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              {s.clickable && (
                showErrors
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error details panel */}
      {showErrors && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Détail des erreurs</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowErrors(false)}>Masquer</Button>
            </div>
            {errorDetails.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Aucune erreur 🎉</p>
            ) : (
              <div className="space-y-2">
                {errorDetails.map((err: any, i: number) => (
                  <div key={i} className="rounded-lg border p-3 space-y-1 text-sm">
                    <p className="font-medium text-foreground">Jour {err.dayNumber}</p>
                    <p className="text-muted-foreground">{err.question}</p>
                    <p className="text-red-600">Réponse choisie : {err.selectedOption}</p>
                    <p className="text-green-600">Bonne réponse : {err.correctOption}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Day-by-day cards */}
      <div className="space-y-3">
        {rows.map((row: any) => (
          <Card
            key={row.dayNumber}
            className={
              row.allDone
                ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                : !row.hasData
                ? 'bg-muted/30'
                : ''
            }
          >
            <CardContent className="p-4 space-y-2">
              <div>
                <p className="font-semibold text-foreground">Jour {row.dayNumber}</p>
                {row.theme && (
                  <p className="text-sm text-muted-foreground break-words">{row.theme}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted-foreground">Quiz</span>
                  {row.quizCompleted ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-muted-foreground/40" />}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted-foreground">Vidéo</span>
                  {row.videoWatched ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-muted-foreground/40" />}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted-foreground">PDF</span>
                  {row.pdfRead ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-muted-foreground/40" />}
                </div>
              </div>
              {row.attempts > 0 && (
                <p className="text-xs text-muted-foreground">
                  {row.attempts} tentative{row.attempts > 1 ? 's' : ''} — {row.successRate}% de réussite
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminRamadanStudentDetail;
