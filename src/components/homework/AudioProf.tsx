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
