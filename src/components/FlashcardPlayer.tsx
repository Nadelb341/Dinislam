import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  useEffect(() => {
    setDeck(cards);
    setIndex(0);
    setFlipped(false);
    setIsShuffled(false);
  }, [cards]);

  const current = deck[index];
  if (!current) return null;

  const goTo = (newIndex: number) => {
    setFlipped(false);
    setIndex(newIndex);
  };

  const shuffle = () => {
    setDeck([...cards].sort(() => Math.random() - 0.5));
    setIndex(0);
    setFlipped(false);
    setIsShuffled(true);
  };

  const reset = () => {
    setDeck(cards);
    setIndex(0);
    setFlipped(false);
    setIsShuffled(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{index + 1} / {deck.length}</span>
        <Button size="sm" variant="ghost" onClick={isShuffled ? reset : shuffle} className="h-8 text-xs">
          {isShuffled
            ? <><RotateCcw className="h-3.5 w-3.5 mr-1" />Réinitialiser</>
            : <><Shuffle className="h-3.5 w-3.5 mr-1" />Mélanger</>
          }
        </Button>
      </div>

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
    </div>
  );
};

export default FlashcardPlayer;
