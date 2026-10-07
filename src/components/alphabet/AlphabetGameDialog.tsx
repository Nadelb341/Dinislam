import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useConfetti } from '@/hooks/useConfetti';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  GAMES, readyPairs, shuffle, pickDistractors,
  type AlphabetLetterLite, type GameKey,
} from '@/lib/alphabetProgress';

type Mode = 'ecoute' | 'ballons' | 'formes' | 'sosies';
type Position = 'initial' | 'medial' | 'final';
const POSITION_LABEL: Record<Position, string> = { initial: 'au début d\'un mot', medial: 'au milieu d\'un mot', final: 'à la fin d\'un mot' };

interface Question {
  mode: Mode;
  target: AlphabetLetterLite;
  options: AlphabetLetterLite[];
  position?: Position;
}

interface Props {
  game: GameKey | null;
  letters: AlphabetLetterLite[];
  pool: AlphabetLetterLite[];
  learned: Set<number>;
  onClose: () => void;
}

const formOf = (l: AlphabetLetterLite, p?: Position) => {
  if (!p) return l.letter_arabic;
  const v = p === 'initial' ? l.position_initial : p === 'medial' ? l.position_medial : l.position_final;
  return v || l.letter_arabic;
};

function buildQuestions(game: GameKey, letters: AlphabetLetterLite[], pool: AlphabetLetterLite[], learned: Set<number>): Question[] {
  const count = game === 'defi' ? 20 : 10;
  const source = game === 'defi' ? letters : pool;
  const pairs = readyPairs(letters, learned);
  const out: Question[] = [];
  for (let i = 0; i < count; i++) {
    const mode: Mode = game === 'defi'
      ? (['ecoute', 'formes', 'sosies', 'ecoute'] as Mode[])[i % 4]
      : (['ecoute', 'ballons', 'formes', 'sosies'] as GameKey[]).includes(game) ? (game as Mode) : 'ecoute';
    if (mode === 'sosies' && pairs.length > 0) {
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      const target = pair[Math.floor(Math.random() * 2)];
      out.push({ mode, target, options: shuffle([...pair]) });
      continue;
    }
    const realMode: Mode = mode === 'sosies' ? 'ecoute' : mode;
    // Éviter la même lettre deux fois de suite
    const candidates = source.filter((l) => l.id !== out[out.length - 1]?.target.id);
    const target = candidates[Math.floor(Math.random() * candidates.length)] ?? source[0];
    const position = realMode === 'formes' ? (['initial', 'medial', 'final'] as Position[])[Math.floor(Math.random() * 3)] : undefined;
    const others = pickDistractors(3, [target.id], source, letters)
      // En mode formes, deux lettres avec le même dessin à cette place seraient indiscernables
      .filter((l) => !position || formOf(l, position) !== formOf(target, position));
    out.push({ mode: realMode, target, options: shuffle([target, ...others.slice(0, 3)]), position });
  }
  return out;
}

const BALLOON_COLORS = ['bg-rose-400', 'bg-sky-400', 'bg-amber-400', 'bg-violet-400', 'bg-emerald-400', 'bg-orange-400'];

export function AlphabetGameDialog({ game, letters, pool, learned, onClose }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { fireConfetti } = useConfetti();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<number[]>([]);
  const [wrongIds, setWrongIds] = useState<number[]>([]);
  const [found, setFound] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [round, setRound] = useState(0); // force la relance des ballons
  const savedRef = useRef(false);

  const info = GAMES.find((g) => g.key === game);
  const q = questions[index];

  const play = useCallback((l?: AlphabetLetterLite) => {
    if (!l?.audio_url) return;
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    a.src = l.audio_url;
    a.currentTime = 0;
    a.play().catch(() => {});
  }, []);

  const reset = useCallback(() => {
    if (!game) return;
    setQuestions(buildQuestions(game, letters, pool, learned));
    setIndex(0); setScore(0); setMissed([]); setWrongIds([]); setFound(false);
    setStarted(false); setFinished(false); savedRef.current = false;
  }, [game, letters, pool, learned]);

  useEffect(() => { if (game) reset(); }, [game, reset]);

  const next = useCallback(() => {
    setWrongIds([]); setFound(false);
    if (index + 1 >= questions.length) { setFinished(true); return; }
    setIndex((i) => i + 1);
    setRound((r) => r + 1);
    play(questions[index + 1]?.target);
  }, [index, questions, play]);

  const answer = (l: AlphabetLetterLite) => {
    if (!q || found) return;
    if (l.id === q.target.id) {
      setFound(true);
      if (wrongIds.length === 0) setScore((s) => s + 1);
      setTimeout(next, 900);
    } else {
      setWrongIds((w) => [...w, l.id]);
      if (wrongIds.length === 0) setMissed((m) => [...m, q.target.id]);
      play(q.target);
    }
  };

  // Ballons : s'ils s'envolent sans bonne réponse, la question est ratée
  useEffect(() => {
    if (!started || finished || !q || q.mode !== 'ballons' || found) return;
    const t = setTimeout(() => {
      if (wrongIds.length === 0) setMissed((m) => [...m, q.target.id]);
      toast('🎈 Envolés ! C\'était ' + q.target.name_french);
      next();
    }, 9000);
    return () => clearTimeout(t);
  }, [started, finished, q, found, round, wrongIds.length, next]);

  // Fin de partie : enregistrement + feu d'artifice si parfait
  useEffect(() => {
    if (!finished || savedRef.current || !user || !game || questions.length === 0) return;
    savedRef.current = true;
    if (score === questions.length) fireConfetti();
    supabase.from('alphabet_game_scores')
      .insert({ user_id: user.id, game, score, total: questions.length, missed: [...new Set(missed)] })
      .then(({ error }) => {
        if (error) { toast.error('Partie non enregistrée'); return; }
        queryClient.invalidateQueries({ queryKey: ['alphabet-game-scores', user.id] });
      });
  }, [finished, user, game, score, questions.length, missed, fireConfetti, queryClient]);

  const stars = useMemo(() => {
    const ratio = questions.length ? score / questions.length : 0;
    return ratio >= 1 ? 3 : ratio >= 0.8 ? 2 : ratio >= 0.5 ? 1 : 0;
  }, [score, questions.length]);

  if (!game || !info) return null;

  const prompt = q?.mode === 'formes'
    ? <>Trouve <span className="font-arabic text-2xl">{q.target.letter_arabic}</span> {POSITION_LABEL[q.position ?? 'initial']}</>
    : q?.mode === 'sosies' ? 'Laquelle de ces deux lettres entends-tu ?'
    : q?.mode === 'ballons' ? 'Éclate le ballon de la lettre que tu entends !'
    : 'Touche la lettre que tu entends';

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-lg">
          <span className="text-2xl">{info.icon}</span>
          <span className="[overflow-wrap:anywhere]">{info.title}</span>
        </DialogTitle>

        {!started && !finished && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <p className="text-muted-foreground">{info.description}</p>
            <p className="text-sm text-muted-foreground">{questions.length} questions</p>
            <Button size="lg" className="w-full" onClick={() => { setStarted(true); setRound((r) => r + 1); play(questions[0]?.target); }}>
              ▶ Commencer
            </Button>
          </div>
        )}

        {started && !finished && q && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>Question {index + 1} / {questions.length}</span>
              <span>⭐ {score}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-300" style={{ width: `${(index / questions.length) * 100}%` }} />
            </div>
            <p className="text-center font-semibold">{prompt}</p>
            <Button variant="secondary" size="lg" className="self-center h-20 w-20 rounded-full" onClick={() => play(q.target)} aria-label="Réécouter">
              <Volume2 className="h-9 w-9" />
            </Button>

            {q.mode === 'ballons' ? (
              <div key={round} dir="rtl" className="relative h-72 rounded-2xl bg-sky-50 dark:bg-sky-950/30 overflow-hidden">
                {q.options.map((l, k) => {
                  const wrong = wrongIds.includes(l.id);
                  const ok = found && l.id === q.target.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => answer(l)}
                      disabled={wrong}
                      className={`alphabet-balloon absolute w-16 h-20 rounded-[50%] text-white font-arabic text-3xl shadow-md ${BALLOON_COLORS[(l.id + k) % BALLOON_COLORS.length]} ${ok ? 'alphabet-balloon-pop' : ''} ${wrong ? 'opacity-30' : ''}`}
                      style={{ insetInlineStart: `${4 + k * 24}%`, animationDelay: `${k * 0.6}s` }}
                    >
                      {l.letter_arabic}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div dir="rtl" className={`grid gap-3 ${q.options.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {q.options.map((l) => {
                  const wrong = wrongIds.includes(l.id);
                  const ok = found && l.id === q.target.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => answer(l)}
                      disabled={wrong}
                      className={`min-h-[96px] rounded-2xl border-2 font-arabic text-5xl transition-all active:scale-95 ${
                        ok ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950/40'
                          : wrong ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/30 opacity-50'
                          : 'border-border bg-card hover:shadow-md'
                      }`}
                    >
                      {formOf(l, q.position)}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-center min-h-[1.5rem] font-semibold">
              {found ? `Bravo ! C'était ${q.target.name_french}` : wrongIds.length > 0 ? 'Essaie encore, écoute bien 👂' : ''}
            </p>
          </div>
        )}

        {finished && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-4xl tracking-widest text-amber-500">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</p>
            <p className="text-2xl font-bold">{score} / {questions.length}</p>
            <p className="text-muted-foreground">
              {stars === 3 ? 'Parfait, machaAllah ! 🎉' : stars === 2 ? 'Très bien, continue !' : stars === 1 ? 'Bien joué, encore un effort !' : 'On réessaie ensemble ?'}
            </p>
            {missed.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">À revoir</p>
                <p dir="rtl" className="font-arabic text-3xl">
                  {[...new Set(missed)].map((id) => letters.find((l) => l.id === id)?.letter_arabic).join('  ')}
                </p>
              </div>
            )}
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
