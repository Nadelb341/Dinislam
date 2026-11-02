import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * 📈 Carte « Ta progression » de l'accueil (2026-11-02, proposition C choisie par Nadia, en plus fine) + idées 1, 5, 8, 10 :
 * fermée = une seule ligne (≈ 36 px) avec emoji + chiffre de chaque carte ; touchée = le détail (barre de chaque carte).
 * (1) toucher une ligne du détail ouvre la carte ; (5) carte terminée à 100 % = dorée avec ⭐ ;
 * (8) mêmes emojis et couleurs que les cartes de l'accueil ; (10) placée sous le cahier de texte (Index.tsx).
 */
export interface ElementProgression { path: string; label: string; valeur: number; total: number | null }

/** Emoji, fond pastel (= celui de la carte de l'accueil, MODULE_EMOJI_FALLBACK) et couleur franche pour la barre */
const STYLE: Record<string, { emoji: string; fond: string; barre: string }> = {
  '/nourania': { emoji: '🌟', fond: '#fefce8', barre: '#eab308' },
  '/sourates': { emoji: '📿', fond: '#eef2ff', barre: '#4f46e5' },
  '/alphabet': { emoji: 'أ', fond: '#eff6ff', barre: '#3b82f6' },
  '/invocations': { emoji: '🤲', fond: '#f5f3ff', barre: '#8b5cf6' },
  '/priere': { emoji: '🕌', fond: '#ecfeff', barre: '#06b6d4' },
  '/ramadan': { emoji: '🌙', fond: '#fff7ed', barre: '#f97316' },
};
const ORO = '#d4a017';

export function ProgressionCompacte({ elements }: { elements: ElementProgression[] }) {
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  if (!elements.length) return null;
  const fini = (e: ElementProgression) => !!e.total && e.valeur >= e.total;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      <button type="button" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left">
        <span className="shrink-0 text-sm font-extrabold text-foreground">📈 Progrès</span>
        <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {elements.map((e) => {
            const s = STYLE[e.path];
            return (
              <span key={e.path} className={cn('flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-extrabold tabular-nums text-slate-800', fini(e) && 'ring-1 ring-amber-400')}
                style={{ backgroundColor: fini(e) ? '#fef3c7' : s?.fond }}>
                <span className={s?.emoji === 'أ' ? 'font-arabic text-sm leading-none' : 'leading-none'}>{fini(e) ? '⭐' : s?.emoji}</span>
                {e.valeur}{e.total !== null && <span className="font-medium text-slate-500">/{e.total}</span>}
              </span>
            );
          })}
        </span>
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300', ouvert && 'rotate-90')} />
      </button>

      {ouvert && (
        <div className="grid gap-1 px-3 pb-2.5 animate-fade-in">
          {elements.map((e) => {
            const s = STYLE[e.path];
            const pct = e.total ? Math.min(100, Math.round((e.valeur / e.total) * 100)) : null;
            return (
              <button key={e.path} type="button" onClick={() => navigate(e.path)}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 rounded-lg px-1 py-1 text-left hover:bg-muted/60">
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-sm" style={{ backgroundColor: fini(e) ? '#fef3c7' : s?.fond }}>
                  <span className={s?.emoji === 'أ' ? 'font-arabic' : ''}>{fini(e) ? '⭐' : s?.emoji}</span>
                </span>
                <span className="min-w-0 text-xs font-bold text-foreground [overflow-wrap:anywhere]">
                  {e.label}{fini(e) && <span className="ml-1 text-amber-600 dark:text-amber-400">· terminé !</span>}
                </span>
                <span className="text-xs font-bold tabular-nums text-muted-foreground">{e.total !== null ? `${e.valeur} / ${e.total}` : `${e.valeur} validées`}</span>
                {pct !== null && (
                  <span className="col-span-3 col-start-2 mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, backgroundColor: fini(e) ? ORO : s?.barre }} />
                  </span>
                )}
              </button>
            );
          })}
          <p className="px-1 text-[10px] text-muted-foreground">Touche une ligne pour ouvrir la carte.</p>
        </div>
      )}
    </div>
  );
}
