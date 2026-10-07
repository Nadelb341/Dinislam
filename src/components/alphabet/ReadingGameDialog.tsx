import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useConfetti } from '@/hooks/useConfetti';
import { buildLines, cellPrompt, hasLowHamza, type LetterLine } from '@/lib/alphabetLines';
import { shuffle, type AlphabetLetterLite } from '@/lib/alphabetProgress';

export type ReadingMode = 'lettre' | 'syllabes' | 'defi_jour';

interface Question { prompt: string; answer: string; options: string[]; letterId: number }

const TITLES: Record<ReadingMode, string> = {
  lettre: 'Jouer avec la lettre',
  syllabes: 'Les syllabes',
  defi_jour: 'Défi du jour',
};
const DAILY_SECONDS = 60;

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/** Une question : on lit la consigne (« la voyelle longue « ou » ») et on touche la bonne écriture. */
function makeQuestion(letter: AlphabetLetterLite, others: AlphabetLetterLite[], forcedLine?: LetterLine['key'], withName = false): Question {
  const lines = buildLines(letter);
  const line = (forcedLine && lines.find((l) => l.key === forcedLine)) || pick(lines);
  const ci = Math.floor(Math.random() * line.cells.length);
  const answer = line.cells[ci].text;
  // Pièges : d'abord les autres écritures de la même lettre, puis la même voyelle sur une autre lettre
  const sameLetter = lines.flatMap((l) => l.cells.map((c) => c.text)).filter((t) => t !== answer);
  const otherLetters = others.filter((o) => o.id !== letter.id).map((o) => {
    const ol = buildLines(o).find((l) => l.key === line.key);
    return ol?.cells[Math.min(ci, ol.cells.length - 1)]?.text;
  }).filter((t): t is string => !!t && t !== answer);
  const pool = shuffle([...shuffle(sameLetter).slice(0, withName ? 2 : 3), ...shuffle(otherLetters).slice(0, withName ? 2 : 1)]);
  const options = shuffle([answer, ...[...new Set(pool)].filter((t) => t !== answer).slice(0, 3)]);
  const prompt = `${withName ? `${letter.name_french} : ` : ''}${cellPrompt(line, ci)}`;
  return { prompt, answer, options, letterId: letter.id };
}

interface Props {
  mode: ReadingMode | null;
  /** Lettres utilisées : la lettre du jeu (mode « lettre ») ou les lettres validées (révision) */
  letters: AlphabetLetterLite[];
  /** Toutes les lettres (pour varier les pièges) */
  allLetters: AlphabetLetterLite[];
  onClose: () => void;
}

export function ReadingGameDialog({ mode, letters, allLetters, onClose }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { fireConfetti } = useConfetti();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [missed, setMissed] = useState<number[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [found, setFound] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DAILY_SECONDS);
  const saved = useRef(false);

  const build = useCallback((): Question[] => {
    if (!mode || letters.length === 0) return [];
    if (mode === 'lettre') {
      const order = buildLines(letters[0]).map((l) => l.key);
      return Array.from({ length: 10 }, (_, i) => makeQuestion(letters[0], allLetters, order[i % order.length]));
    }
    const count = mode === 'defi_jour' ? 60 : 10;
    return Array.from({ length: count }, () => makeQuestion(pick(letters), letters.length > 1 ? letters : allLetters, undefined, true));
  }, [mode, letters, allLetters]);

  const reset = useCallback(() => {
    setQuestions(build()); setIndex(0); setScore(0); setAnswered(0); setMissed([]); setWrong([]);
    setFound(false); setStarted(false); setFinished(false); setTimeLeft(DAILY_SECONDS); saved.current = false;
  }, [build]);
  useEffect(() => { if (mode) reset(); }, [mode, reset]);

  // Défi du jour : 1 minute chrono
  useEffect(() => {
    if (mode !== 'defi_jour' || !started || finished) return;
    if (timeLeft <= 0) { setFinished(true); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, started, finished, timeLeft]);

  const q = questions[index];
  const next = () => {
    setWrong([]); setFound(false);
    if (index + 1 >= questions.length) setFinished(true); else setIndex((i) => i + 1);
  };
  const answer = (opt: string) => {
    if (!q || found) return;
    if (opt === q.answer) {
      setFound(true);
      if (wrong.length === 0) setScore((s) => s + 1);
      setAnswered((a) => a + 1);
      setTimeout(next, mode === 'defi_jour' ? 350 : 800);
    } else {
      if (wrong.length === 0) setMissed((m) => [...m, q.letterId]);
      setWrong((w) => [...w, opt]);
    }
  };

  const total = mode === 'defi_jour' ? Math.max(answered, 1) : questions.length;
  useEffect(() => {
    if (!finished || saved.current || !user || !mode) return;
    saved.current = true;
    if (mode !== 'defi_jour' && score === questions.length) fireConfetti();
    if (mode === 'defi_jour' && answered === 0) return;
    supabase.from('alphabet_game_scores')
      .insert({ user_id: user.id, game: mode, score, total, missed: [...new Set(missed)] })
      .then(({ error }) => {
        if (error) { toast.error('Partie non enregistrée'); return; }
        queryClient.invalidateQueries({ queryKey: ['alphabet-game-scores', user.id] });
      });
  }, [finished, user, mode, score, total, answered, questions.length, missed, fireConfetti, queryClient]);

  const stars = useMemo(() => {
    const r = score / total;
    return mode === 'defi_jour' ? (score >= 20 ? 3 : score >= 12 ? 2 : score >= 5 ? 1 : 0) : r >= 1 ? 3 : r >= 0.8 ? 2 : r >= 0.5 ? 1 : 0;
  }, [score, total, mode]);

  if (!mode) return null;
  const title = mode === 'lettre' && letters[0] ? `${TITLES.lettre} ${letters[0].letter_arabic}` : TITLES[mode];

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-lg">
          <span className="text-2xl">{mode === 'defi_jour' ? '⚡' : mode === 'syllabes' ? '🔤' : '🎮'}</span>
          <span className="[overflow-wrap:anywhere]">{title}</span>
        </DialogTitle>

        {!started && !finished && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <p className="text-muted-foreground">
              {mode === 'defi_jour'
                ? 'Une minute pour lire le plus de syllabes possible avec les lettres que tu connais !'
                : 'Lis la consigne et touche la bonne écriture.'}
            </p>
            <Button size="lg" className="w-full" onClick={() => setStarted(true)} disabled={questions.length === 0}>▶ Commencer</Button>
          </div>
        )}

        {started && !finished && q && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{mode === 'defi_jour' ? `⏱️ ${timeLeft} s` : `Question ${index + 1} / ${questions.length}`}</span>
              <span>⭐ {score}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-300"
                style={{ width: `${mode === 'defi_jour' ? (timeLeft / DAILY_SECONDS) * 100 : (index / questions.length) * 100}%` }}
              />
            </div>
            <p className="text-center font-semibold [overflow-wrap:anywhere]">Trouve {q.prompt}</p>
            <div dir="rtl" className="grid grid-cols-2 gap-3">
              {q.options.map((opt) => {
                const isWrong = wrong.includes(opt);
                const ok = found && opt === q.answer;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => answer(opt)}
                    disabled={isWrong}
                    className={`min-h-[88px] rounded-2xl border-2 font-arabic text-4xl ${hasLowHamza(opt) ? 'leading-[2.4] pb-1.5' : 'leading-[1.6]'} transition-all active:scale-95 ${
                      ok ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950/40'
                        : isWrong ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/30 opacity-50'
                        : 'border-border bg-card hover:shadow-md'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            <p className="text-center min-h-[1.5rem] font-semibold">{found ? 'Bravo ! 🎉' : wrong.length ? 'Regarde bien les petits signes 👀' : ''}</p>
          </div>
        )}

        {finished && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-4xl tracking-widest text-amber-500">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</p>
            <p className="text-2xl font-bold">{mode === 'defi_jour' ? `${score} bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''}` : `${score} / ${questions.length}`}</p>
            <p className="text-muted-foreground">{stars === 3 ? 'Parfait, machaAllah ! 🎉' : stars >= 1 ? 'Bien joué, continue !' : 'On réessaie ensemble ?'}</p>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button variant="outline" onClick={onClose}>Fermer</Button>
              <Button onClick={reset}>🔁 Rejouer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
