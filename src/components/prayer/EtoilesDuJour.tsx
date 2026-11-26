import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { CINQ_PRIERES, type Horaires } from '@/lib/momentPriere';
import { useConfetti } from '@/hooks/useConfetti';
import { cn } from '@/lib/utils';
import { SemaineAnneaux } from '@/components/prayer/SemaineAnneaux';

const Etoile = ({ pleine }: { pleine: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-11 w-11 sm:h-12 sm:w-12" aria-hidden
    fill={pleine ? '#f5c542' : 'rgba(255,255,255,.55)'} stroke={pleine ? '#c99a2e' : '#9aa3c7'} strokeWidth="1.4">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

/**
 * ⭐ Mes 5 étoiles du jour (Nadia, 2026-11-26, présentation 3) : une grosse étoile par prière, à allumer quand elle est faite.
 * Les 5 allumées : confettis + « +10 points » (idée d, compté par la base : `journee_5_prieres`).
 */
export function EtoilesDuJour({ horaires, cochees, onToggle, texte, nuit = false, semaine }: {
  horaires: Horaires; cochees: string[]; onToggle: (cle: string) => void; texte: string; nuit?: boolean;
  /** 26/11 (Nadia, D placée comme E) : la semaine en anneaux juste sous les étoiles — date → nombre de prières */
  semaine?: Record<string, number>;
}) {
  const { fireConfetti } = useConfetti();
  const nb = CINQ_PRIERES.filter((p) => cochees.includes(p.cle)).length;
  const avant = useRef<number | null>(null);
  useEffect(() => {
    // Fête seulement quand on PASSE à 5 (pas à l'ouverture d'une journée déjà complète)
    if (avant.current !== null && avant.current < 5 && nb === 5) {
      fireConfetti();
      toast.success('🌟 Les 5 prières de la journée sont faites ! +10 points, bravo 🤲');
    }
    avant.current = nb;
  }, [nb, fireConfetti]);
  const hm = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return (
    <section className={cn('rounded-3xl p-3 shadow-sm backdrop-blur-sm', nuit ? 'bg-[#0d1240]/55' : 'bg-white/70 dark:bg-black/25')} aria-label="Mes 5 étoiles du jour">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-base font-extrabold" style={{ color: texte }}>⭐ Mes 5 étoiles du jour</h2>
        <span className="text-xs font-bold tabular-nums" style={{ color: texte }}>{nb}/5{nb === 5 ? ' 🎉' : ''}</span>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {CINQ_PRIERES.map((p) => {
          const faite = cochees.includes(p.cle);
          return (
            <button key={p.cle} type="button" onClick={() => onToggle(p.cle)} aria-pressed={faite}
              aria-label={`${p.nom} ${hm(p.heure(horaires))}${faite ? ', faite' : ''}`}
              className={cn('flex min-w-0 flex-col items-center gap-0.5 rounded-2xl py-1.5 transition-transform active:scale-95', faite && (nuit ? 'bg-amber-300/25' : 'bg-amber-100/80 dark:bg-amber-900/30'))}>
              <Etoile pleine={faite} />
              <span className="text-[11px] font-extrabold leading-tight sm:text-xs" style={{ color: texte }}>{p.nom}</span>
              <span className="font-mono text-[10px] leading-tight opacity-80 sm:text-[11px]" style={{ color: texte }}>{hm(p.heure(horaires))}</span>
              {/* Idée c (Nadia, 26/11) : le nombre de rak'ât en petits carrés verts */}
              <span className="flex flex-wrap justify-center gap-[2px]" aria-label={`${p.rakat} rak'ât`}>
                {Array.from({ length: p.rakat }, (_, i) => <i key={i} className="h-2 w-2 rounded-[3px] bg-gradient-to-b from-emerald-300 to-emerald-600" />)}
              </span>
              <span className="text-[9px] font-bold leading-none sm:text-[10px]" style={{ color: texte, opacity: 0.85 }}>{p.rakat} rak'ât</span>
            </button>
          );
        })}
      </div>
      {semaine && <SemaineAnneaux dates={semaine} texte={texte} nuit={nuit} />}
    </section>
  );
}
