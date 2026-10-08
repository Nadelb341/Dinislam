import { useState, useEffect, useMemo } from 'react';
import { withName } from '@/lib/encouragements';
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { errorMessage } from '@/lib/utils';

interface Flashcard {
  id: string;
  front_text: string;
  back_arabic: string | null;
  back_transliteration: string | null;
}

const FlashcardPlayer = ({ cards }: { cards: Flashcard[] }) => {
  const [deck, setDeck] = useState<Flashcard[]>(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  // « ✅ Je connais ce mot » (2026-10-08) : compte dans le Classement (ligne « Vocabulaire appris » du barème)
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { askValidation, validationDialog } = useConfirmValidation();
  const { data: learned = new Set<string>() } = useQuery({
    queryKey: ['flashcard-learned', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_flashcard_learned').select('flashcard_id').eq('user_id', user!.id);
      if (error) throw error;
      return new Set((data || []).map((r) => r.flashcard_id));
    },
  });
  // Idée 1 (2026-10-08) : réviser seulement les mots pas encore appris
  const [onlyUnknown, setOnlyUnknown] = useState(false);
  const base = useMemo(() => (onlyUnknown ? cards.filter((c) => !learned.has(c.id)) : cards), [cards, onlyUnknown]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setDeck(base);
    setIndex(0);
    setFlipped(false);
    setIsShuffled(false);
  }, [base]);

  const setLearned = async (id: string, value: boolean) => {
    if (!user) return;
    const { error } = value
      ? await supabase.from('user_flashcard_learned').insert({ user_id: user.id, flashcard_id: id })
      : await supabase.from('user_flashcard_learned').delete().eq('user_id', user.id).eq('flashcard_id', id);
    if (error) { toast.error(errorMessage(error)); return; }
    if (value) toast.success(withName(user, '✅ Mot appris, bravo {prenom} !'));
    queryClient.invalidateQueries({ queryKey: ['flashcard-learned', user.id] });
  };


  const learnedCount = cards.filter((c) => learned.has(c.id)).length;
  const unknownToggle = user && learnedCount > 0 && (
    <Button type="button" size="sm" variant={onlyUnknown ? 'default' : 'outline'} className="w-full h-8 text-xs" onClick={() => setOnlyUnknown((o) => !o)}>
      {onlyUnknown ? `↩️ Revoir tous les mots (${cards.length})` : `🎯 Seulement les mots à apprendre (${cards.length - learnedCount})`}
    </Button>
  );
  const current = deck[index];
  if (!current) {
    return onlyUnknown ? (
      <div className="space-y-3 text-center">
        <p className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-4 font-bold">🎉 Tu connais tous les mots de cette carte, bravo !</p>
        {unknownToggle}
      </div>
    ) : null;
  }
  const knows = learned.has(current.id);

  const goTo = (newIndex: number) => {
    setFlipped(false);
    setIndex(newIndex);
  };

  const shuffle = () => {
    setDeck([...base].sort(() => Math.random() - 0.5));
    setIndex(0);
    setFlipped(false);
    setIsShuffled(true);
  };

  const reset = () => {
    setDeck(base);
    setIndex(0);
    setFlipped(false);
    setIsShuffled(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{index + 1} / {deck.length}{learnedCount > 0 && <span className="ms-2 text-xs text-emerald-600 font-bold">✅ {learnedCount} appris</span>}</span>
        <Button size="sm" variant="ghost" onClick={isShuffled ? reset : shuffle} className="h-8 text-xs">
          {isShuffled
            ? <><RotateCcw className="h-3.5 w-3.5 mr-1" />Réinitialiser</>
            : <><Shuffle className="h-3.5 w-3.5 mr-1" />Mélanger</>
          }
        </Button>
      </div>

      {unknownToggle}

      {/* Barre de progression */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((index + 1) / deck.length) * 100}%` }}
        />
      </div>

      {/* Carte avec flip 3D */}
      <div style={{ perspective: '1000px' }} className="w-full">
        <div
          onClick={() => setFlipped(f => !f)}
          className="relative w-full cursor-pointer"
          style={{
            minHeight: '180px',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Recto — Français */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-6 text-center select-none"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Français</p>
            <p className="text-xl font-bold text-foreground leading-snug">{current.front_text}</p>
            <p className="text-xs text-muted-foreground mt-5 opacity-50">Appuie pour voir la réponse</p>
          </div>

          {/* Verso — Arabe */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-primary bg-primary/5 p-6 text-center select-none"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Arabe</p>
            {current.back_arabic && (
              <p className="font-arabic text-5xl text-foreground mb-3 leading-relaxed">{current.back_arabic}</p>
            )}
            {current.back_transliteration && (
              <p className="text-base text-muted-foreground italic">({current.back_transliteration})</p>
            )}
          </div>
        </div>
      </div>

      {/* Je connais ce mot : confirmation pour valider, aucune pour revenir en arrière */}
      {user && (
        <Button
          type="button"
          variant={knows ? 'default' : 'outline'}
          className={`w-full ${knows ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-emerald-300 text-emerald-700 dark:text-emerald-300'}`}
          onClick={() => knows
            ? setLearned(current.id, false)
            : askValidation('Valider ce mot ?', `« ${current.front_text} » sera compté comme appris.`, () => setLearned(current.id, true))}
        >
          {knows ? '✅ Je connais ce mot' : '☐ Je connais ce mot'}
        </Button>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 rounded-full"
          onClick={() => goTo(Math.max(index - 1, 0))}
          disabled={index === 0}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 rounded-full"
          onClick={() => goTo(Math.min(index + 1, deck.length - 1))}
          disabled={index === deck.length - 1}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      {validationDialog}
    </div>
  );
};

export default FlashcardPlayer;
