import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * 📈 Carte « Progrès » de l'accueil (2026-11-02) : petits ANNEAUX (proposition B de la maquette — Nadia a dit « C » en comptant la
 * vignette « Aujourd'hui », c'est bien les anneaux qu'elle voulait), en plus fin + idées 1, 5, 8, 10 :
 * un anneau par carte (emoji au centre, l'anneau se remplit) + « 9/17 » à côté, sur une ligne (≈ 44 px).
 * (1) toucher un anneau ouvre la carte ; (5) carte terminée à 100 % = anneau doré avec ⭐ ;
 * (8) mêmes emojis et fonds pastel que les cartes de l'accueil ; (10) placée sous le cahier de texte (Index.tsx).
 * ✨ Animations (choix de Nadia, en continu et en douceur, classes `prog-*` dans index.css) : emojis qui rebondissent à tour de rôle,
 * point lumineux qui fait le tour de l'anneau, halo néon de la couleur de la carte ; carte terminée = étincelles + ⭐ qui fait un tour.
 * « Réduire les animations » du téléphone = tout immobile.
 */
export interface ElementProgression { path: string; label: string; valeur: number; total: number | null }

/** Emoji, fond pastel (= celui de la carte de l'accueil, MODULE_EMOJI_FALLBACK) et couleur franche de l'anneau */
const STYLE: Record<string, { emoji: string; fond: string; couleur: string }> = {
  '/nourania': { emoji: '🌟', fond: '#fefce8', couleur: '#eab308' },
  '/sourates': { emoji: '📿', fond: '#eef2ff', couleur: '#4f46e5' },
  '/alphabet': { emoji: 'أ', fond: '#eff6ff', couleur: '#3b82f6' },
  '/invocations': { emoji: '🤲', fond: '#f5f3ff', couleur: '#8b5cf6' },
  '/priere': { emoji: '🕌', fond: '#ecfeff', couleur: '#06b6d4' },
  '/ramadan': { emoji: '🌙', fond: '#fff7ed', couleur: '#f97316' },
};
const OR = '#d4a017';
const R = 13;
const CIRC = 2 * Math.PI * R;

export function ProgressionCompacte({ elements }: { elements: ElementProgression[] }) {
  const navigate = useNavigate();
  if (!elements.length) return null;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card px-2 py-1.5">
      <div className="flex flex-wrap items-center justify-around gap-x-2 gap-y-1">
        {elements.map((e, i) => {
          const s = STYLE[e.path];
          const fini = !!e.total && e.valeur >= e.total;
          // Prière : pas de total → anneau plein léger (seulement le nombre de prières validées)
          const part = e.total ? Math.min(1, e.valeur / e.total) : e.valeur > 0 ? 1 : 0;
          const couleur = fini ? OR : s?.couleur ?? '#64748b';
          return (
            <button key={e.path} type="button" onClick={() => navigate(e.path)}
              aria-label={`${e.label} : ${e.total !== null ? `${e.valeur} sur ${e.total}` : `${e.valeur} validées`}${fini ? ', terminé' : ''}. Ouvrir la carte`}
              title={e.label}
              className="flex items-center gap-1 rounded-full py-0.5 pl-0.5 pr-1.5 hover:bg-muted/60">
              <span className={cn('relative h-8 w-8 shrink-0', fini && 'prog-fini')}>
                <svg viewBox="0 0 32 32" className="h-8 w-8 -rotate-90 overflow-visible" aria-hidden="true">
                  <circle cx="16" cy="16" r={R} fill={fini ? '#fef3c7' : s?.fond} className="stroke-muted" strokeWidth="3.5" />
                  <circle cx="16" cy="16" r={R} fill="none" stroke={couleur} strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={`${CIRC * part} ${CIRC}`} className={cn('prog-neon', e.total === null && 'opacity-40')}
                    style={{ ['--prog-c' as string]: couleur, animationDelay: `${i * 0.5}s` }} />
                  {/* Point lumineux qui fait le tour, chacun à son rythme */}
                  <circle cx="29" cy="16" r="2" fill="#fff" className="prog-point" style={{ filter: `drop-shadow(0 0 2px ${couleur})`, animationDuration: `${4.5 + i * 0.6}s` }} />
                </svg>
                <span className={cn('absolute inset-0 flex items-center justify-center text-sm leading-none', s?.emoji === 'أ' && !fini && 'font-arabic')}>
                  <span className={fini ? 'prog-etoile' : 'prog-hop'} style={fini ? undefined : { animationDelay: `${i * 0.8}s` }}>{fini ? '⭐' : s?.emoji}</span>
                </span>
              </span>
              <span className="text-xs font-extrabold tabular-nums text-foreground">
                {e.valeur}{e.total !== null && <span className="font-medium text-muted-foreground">/{e.total}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
