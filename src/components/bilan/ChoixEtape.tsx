import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { titreBilan, titrePeriode, type EtapeBilan } from '@/lib/bilanTrimestriel';

/** « Avant les Vacances de Noël 2026 » → « Noël 2026 » (bouton) */
const nomCourt = (e: EtapeBilan) =>
  titrePeriode(e.label, e.fin).replace(/^vacances (de la |de l'|d'|de )?/i, '').replace(/^./, (c) => c.toUpperCase());

/**
 * 📅 Choix de l'étape de bilan (2026-11-02, choix A de Nadia) : menu rangé par année scolaire, de la plus ancienne à la plus récente
 * (les années passées restent). Étape dont tous les bilans du groupe sont envoyés = grisée mais toujours choisissable (rééditer, renvoyer) ;
 * étape pas encore commencée = non choisissable ; étape en cours mise en avant ; compteur « envoyés / élèves » du groupe affiché.
 */
export function ChoixEtape({ etapes, actuelle, compteurs, onChoisir, className }: {
  etapes: EtapeBilan[];
  actuelle: EtapeBilan;
  /** label → { envoyés, total } pour le groupe affiché */
  compteurs: Record<string, { envoyes: number; total: number }>;
  onChoisir: (label: string) => void;
  className?: string;
}) {
  const annees = [...new Set(etapes.map((e) => e.annee))];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Choisir le bilan à compléter"
          className={cn('inline-flex max-w-full items-center gap-1 rounded-full border-2 border-violet-300 bg-violet-50 px-3 py-1.5 text-sm font-extrabold text-violet-900 dark:border-violet-700 dark:bg-violet-950/50 dark:text-violet-100', className)}>
          <span className="min-w-0 [overflow-wrap:anywhere]">📅 {nomCourt(actuelle)}</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[600] w-[min(22rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto">
        {annees.map((a, i) => (
          <div key={a}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs font-extrabold text-violet-700 dark:text-violet-300">🎒 Année {a}</DropdownMenuLabel>
            {etapes.filter((e) => e.annee === a).map((e) => {
              const c = compteurs[e.label];
              const toutEnvoye = !!c && c.total > 0 && c.envoyes >= c.total;
              const choisie = e.label === actuelle.label;
              return (
                <DropdownMenuItem key={e.label} disabled={e.aVenir} onSelect={() => onChoisir(e.label)}
                  className={cn('flex items-start gap-2 py-2', choisie && 'bg-violet-100 dark:bg-violet-900/50', toutEnvoye && !choisie && 'opacity-60')}>
                  <span className="flex-1 min-w-0">
                    <span className={cn('block text-sm [overflow-wrap:anywhere]', choisie ? 'font-extrabold' : 'font-semibold', toutEnvoye && 'text-muted-foreground')}>
                      {choisie ? '● ' : ''}{titreBilan(e.label, e.fin)}
                    </span>
                    {e.aVenir && <span className="block text-[11px] text-muted-foreground">⏳ pas encore commencée</span>}
                  </span>
                  {e.enCours && <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">en cours</span>}
                  {c && c.total > 0 && !e.aVenir && (
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold', toutEnvoye ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' : 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200')}>
                      {toutEnvoye ? '✅' : '✏️'} {c.envoyes}/{c.total}
                    </span>
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
