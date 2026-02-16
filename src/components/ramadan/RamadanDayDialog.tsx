import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Check, ChevronRight, Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Quiz {
  id: string;
  day_id: number;
  question: string;
  options: string[];
  correct_option: number | null;
}

interface RamadanDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayNumber: number;
  theme: string | null;
  videoUrl: string | null;
  quizzes: Quiz[];
  quizCompleted: boolean;
  videoWatched: boolean;
  onMarkVideoWatched: () => void;
  onSubmitQuiz: (allCorrect: boolean, wrongCount: number) => void;
  onSaveQuizResponse: (quizId: string, selectedOption: number) => void;
}

type Step = 'video' | 'quiz';

const RamadanDayDialog = ({
  open,
  onOpenChange,
  dayNumber,
  theme,
  videoUrl,
  quizzes,
  quizCompleted,
  videoWatched,
  onMarkVideoWatched,
  onSubmitQuiz,
  onSaveQuizResponse,
}: RamadanDayDialogProps) => {
  const [step, setStep] = useState<Step>('video');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const currentQuiz = quizzes[currentQuestionIdx];
  const totalQuestions = quizzes.length;

  const resetState = () => {
    setStep('video');
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setAnswerResult(null);
    setCorrectCount(0);
    setWrongCount(0);
    setAnsweredCount(0);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  const handleVideoEnded = () => {
    if (!videoWatched) onMarkVideoWatched();
    setStep('quiz');
  };

  const handleSkipToQuiz = () => {
    if (!videoWatched) onMarkVideoWatched();
    setStep('quiz');
  };

  const handleValidateAnswer = () => {
    if (selectedAnswer === null || !currentQuiz) return;

    const isCorrect = selectedAnswer === currentQuiz.correct_option;
    setAnswerResult(isCorrect);
    onSaveQuizResponse(currentQuiz.id, selectedAnswer);

    const newCorrect = correctCount + (isCorrect ? 1 : 0);
    const newWrong = wrongCount + (isCorrect ? 0 : 1);
    const newAnswered = answeredCount + 1;

    setCorrectCount(newCorrect);
    setWrongCount(newWrong);
    setAnsweredCount(newAnswered);

    setTimeout(() => {
      if (newAnswered >= totalQuestions) {
        // All questions answered
        const allCorrect = newWrong === 0;
        onSubmitQuiz(allCorrect, newWrong);
        if (!allCorrect) {
          // Reset to retry
          setCurrentQuestionIdx(0);
          setSelectedAnswer(null);
          setAnswerResult(null);
          setCorrectCount(0);
          setWrongCount(0);
          setAnsweredCount(0);
        }
      } else {
        // Next question
        setCurrentQuestionIdx(prev => prev + 1);
        setSelectedAnswer(null);
        setAnswerResult(null);
      }
    }, 1500);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-primary to-royal-dark text-primary-foreground rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-primary-foreground">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <span className="font-bold">{dayNumber}</span>
              </div>
              <div>
                <div className="font-bold">Jour {dayNumber}</div>
                {theme && <p className="text-sm opacity-80 font-normal">{theme}</p>}
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-4">
          {/* Quiz already completed */}
          {quizCompleted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h4 className="font-semibold text-foreground">Quiz complété !</h4>
              <p className="text-sm text-muted-foreground">
                Vous avez déjà validé ce jour. Bravo !
              </p>
              {videoUrl && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Revoir la vidéo :</p>
                  <div className="aspect-video rounded-xl overflow-hidden bg-black">
                    <video src={videoUrl} controls className="w-full h-full" />
                  </div>
                </div>
              )}
            </div>
          ) : step === 'video' ? (
            /* Video step */
            <div className="space-y-4">
              {videoUrl ? (
                <>
                  <div className="aspect-video rounded-xl overflow-hidden bg-black">
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full"
                      onEnded={handleVideoEnded}
                    />
                  </div>
                  <Button
                    onClick={handleSkipToQuiz}
                    variant="outline"
                    className="w-full"
                  >
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Passer au quiz
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Pas de vidéo pour ce jour</p>
                  <Button onClick={() => setStep('quiz')} className="mt-4">
                    Passer au quiz
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Quiz step - one question at a time */
            <div className="space-y-4">
              {currentQuiz && (
                <>
                  {/* Progress indicator */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Question {currentQuestionIdx + 1}/{totalQuestions}</span>
                    <div className="flex gap-1">
                      {quizzes.map((_, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'w-2 h-2 rounded-full transition-colors',
                            idx < currentQuestionIdx
                              ? 'bg-green-500'
                              : idx === currentQuestionIdx
                              ? 'bg-gold'
                              : 'bg-muted'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border space-y-3">
                    <h4 className="font-semibold text-foreground text-sm">
                      {currentQuiz.question}
                    </h4>

                    <RadioGroup
                      value={selectedAnswer !== null ? selectedAnswer.toString() : ''}
                      onValueChange={(val) => {
                        if (answerResult === null) {
                          setSelectedAnswer(parseInt(val));
                        }
                      }}
                    >
                      {currentQuiz.options.map((option, optIdx) => (
                        <div
                          key={optIdx}
                          className={cn(
                            'flex items-center space-x-3 p-2.5 rounded-lg border transition-colors',
                            answerResult !== null && optIdx === currentQuiz.correct_option && 'border-green-500 bg-green-50',
                            answerResult === false && selectedAnswer === optIdx && optIdx !== currentQuiz.correct_option && 'border-destructive bg-destructive/10',
                            answerResult === null && 'hover:bg-muted/50'
                          )}
                        >
                          <RadioGroupItem
                            value={optIdx.toString()}
                            id={`current-q-opt${optIdx}`}
                            disabled={answerResult !== null}
                          />
                          <Label
                            htmlFor={`current-q-opt${optIdx}`}
                            className={cn(
                              'flex-1 cursor-pointer text-sm',
                              answerResult !== null && optIdx === currentQuiz.correct_option && 'text-green-700 font-medium',
                              answerResult === false && selectedAnswer === optIdx && optIdx !== currentQuiz.correct_option && 'text-destructive'
                            )}
                          >
                            {option}
                            {answerResult !== null && optIdx === currentQuiz.correct_option && ' ✓'}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {answerResult === null && (
                    <Button
                      onClick={handleValidateAnswer}
                      disabled={selectedAnswer === null}
                      className="w-full bg-gradient-to-r from-primary to-royal-dark"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Valider
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RamadanDayDialog;
