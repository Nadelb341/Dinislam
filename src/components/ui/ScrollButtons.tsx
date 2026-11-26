import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollButtonsProps {
  showTop: boolean;
  showBottom: boolean;
  onScrollTop: () => void;
  onScrollBottom: () => void;
  position?: 'absolute' | 'fixed';
}

export function ScrollButtons({
  showTop,
  showBottom,
  onScrollTop,
  onScrollBottom,
  position = 'absolute',
}: ScrollButtonsProps) {
  if (!showTop && !showBottom) return null;

  const containerClass = position === 'fixed'
    ? 'fixed bottom-[calc(var(--menu-bas,4rem)+2rem)] right-4 z-50 flex flex-col gap-2'
    : 'absolute bottom-4 right-4 z-10 flex flex-col gap-2';

  const btnClass = cn(
    'w-10 h-10 rounded-full shadow-lg flex items-center justify-center',
    'bg-primary text-primary-foreground hover:bg-primary/90',
    'transition-all duration-200 active:scale-95'
  );

  return (
    <div className={containerClass}>
      {showTop && (
        <button onClick={onScrollTop} className={btnClass} aria-label="Retour en haut">
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
      {showBottom && (
        <button onClick={onScrollBottom} className={btnClass} aria-label="Aller en bas">
          <ArrowDown className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
