import { cn } from '@/lib/utils';
import { questionsDe, reponsesDe } from '@/lib/devoirsLibres';

/**
 * 📝 Ce que l'élève a écrit pour un devoir (2026-11-26, devoirs libres) : son texte et ses réponses aux questions,
 * à côté de son audio et de ses photos, là où Nadia corrige déjà (« Rendus à corriger », Tableau de la classe…).
 * Rien n'est affiché si l'élève n'a rien écrit.
 */
export function RenduLibreVue({ rendu, devoir, className }: {
  rendu: { reponse_texte?: string | null; reponses?: unknown } | null | undefined;
  devoir: { questions?: unknown } | null | undefined;
  className?: string;
}) {
  const texte = rendu?.reponse_texte?.trim();
  const questions = questionsDe(devoir?.questions);
  const reponses = reponsesDe(rendu?.reponses);
  if (!texte && !reponses.some((r) => r.trim())) return null;
  return (
    <div className={cn('space-y-1.5', className)}>
      {texte && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-2">
          <p className="text-xs font-bold">✏️ Son texte</p>
          <p className="cahier-main text-base leading-6 whitespace-pre-wrap [overflow-wrap:anywhere]">{texte}</p>
        </div>
      )}
      {reponses.some((r) => r.trim()) && (
        <div className="rounded-xl border border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-2 space-y-1">
          <p className="text-xs font-bold">❓ Ses réponses</p>
          {reponses.map((r, i) => (
            <div key={i} className="text-sm">
              <p className="font-semibold [overflow-wrap:anywhere]">{i + 1}. {questions[i] ?? 'Question'}</p>
              <p className="cahier-main text-base leading-6 ps-4 whitespace-pre-wrap [overflow-wrap:anywhere]">{r.trim() || '—'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
