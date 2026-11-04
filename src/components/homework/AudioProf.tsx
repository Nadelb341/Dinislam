import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

/**
 * 🎧 Audio du professeur (2026-10-26, idées 3 et 4) : consigne d'un devoir (`devoirs.consigne_audio_url`)
 * ou correction (`devoirs_rendus.correction_audio_url`). Le lien peut être complet (https://…)
 * ou un chemin dans le bucket public `devoirs-audios`.
 */
function audioProfUrl(url: string): string {
  if (/^(https?:|blob:|data:)/.test(url)) return url;
  return supabase.storage.from('devoirs-audios').getPublicUrl(url.replace(/^\/+/, '')).data.publicUrl;
}

export function AudioProf({ url, kind, className }: { url: string | null | undefined; kind: 'consigne' | 'correction'; className?: string }) {
  if (!url) return null;
  const consigne = kind === 'consigne';
  return (
    <div className={cn(
      'rounded-xl border-2 px-3 py-2 space-y-1.5',
      consigne ? 'border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30' : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
      className,
    )}>
      <p className={cn('text-sm font-extrabold', consigne ? 'text-sky-800 dark:text-sky-200' : 'text-amber-800 dark:text-amber-200')}>
        {consigne ? '🎧 Écoute la consigne de ton professeur' : '🎧 La correction de ton professeur'}
      </p>
      <audio src={audioProfUrl(url)} controls preload="none" className="w-full h-10" />
    </div>
  );
}

/**
 * 🎧 « L'audio d'abord » (2026-11-04, choix de Nadia : comme la proposition C, pour TOUS les élèves) :
 * quand un devoir a une consigne audio, elle passe en premier, en gros bouton rond ▶ facile à toucher
 * (les petits ne savent pas tous lire). `onEcoute` : le professeur voit qui l'a écoutée (idée 3).
 */
export function ConsigneAudioGrande({ url, onEcoute, compact = false }: { url: string | null | undefined; onEcoute?: () => void; compact?: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [joue, setJoue] = useState(false);
  const [p, setP] = useState(0);
  const dejaSignale = useRef(false);
  if (!url) return null;
  const basculer = () => {
    const a = ref.current; if (!a) return;
    if (a.paused) { void a.play().catch(() => { /* lecture refusée */ }); } else a.pause();
  };
  return (
    <button type="button" onClick={basculer} aria-label={joue ? 'Mettre la consigne en pause' : 'Écouter la consigne de ton professeur'}
      className={cn('relative w-full overflow-hidden flex items-center gap-3 rounded-2xl bg-[#2457a5] text-white text-left font-extrabold shadow-md active:scale-[0.99] transition-transform',
        compact ? 'px-2.5 py-2 text-sm' : 'px-3 py-3 text-base')}>
      <span className={cn('grid shrink-0 place-items-center rounded-full bg-white text-[#2457a5]', compact ? 'h-10 w-10 text-lg' : 'h-14 w-14 text-2xl', !joue && 'consigne-pouls')}>{joue ? '❚❚' : '▶'}</span>
      <span className="min-w-0 flex-1">🎧 Écoute ce que ton professeur te demande</span>
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-white/25"><span className="block h-full bg-amber-300 transition-[width]" style={{ width: `${p * 100}%` }} /></span>
      <audio ref={ref} src={audioProfUrl(url)} preload="none"
        onPlay={() => { setJoue(true); if (!dejaSignale.current) { dejaSignale.current = true; onEcoute?.(); } }}
        onPause={() => setJoue(false)} onEnded={() => { setJoue(false); setP(0); }}
        onTimeUpdate={(e) => { const a = e.currentTarget; if (a.duration) setP(a.currentTime / a.duration); }} />
    </button>
  );
}
