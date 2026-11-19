import type { ReactNode } from 'react';
import { Loader2, Mic, RotateCcw, Send, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 🎙️ Le bouton « Enregistrer » des élèves, IDENTIQUE partout (Nadia, 2026-11-19) : sourates, 99 noms, invocations,
 * Alphabet, devoirs. Rectangle rouge vif, un peu plus grand qu'avant, toujours EN HAUT de l'écran concerné
 * (juste sous le titre), comme dans la carte Sourate. Ces composants ne font que l'affichage : chaque écran garde
 * sa propre façon d'enregistrer et d'envoyer (stockage privé, notifications, demandes, hors ligne).
 */
export const ROUGE_ENREGISTRER = 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-md shadow-red-600/25 dark:bg-red-600 dark:hover:bg-red-500';
const GRAND = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-base font-bold transition-colors disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500';

const temps = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Le cadre commun : titre « 🎙️ … » puis le contenu */
export function BlocEnregistrer({ titre, sousTitre, children, className }: { titre: ReactNode; sousTitre?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl border-2 border-red-200 bg-red-50/70 p-4 space-y-3 dark:border-red-900/60 dark:bg-red-950/25', className)}>
      <div className="space-y-0.5">
        <p className="flex flex-wrap items-center gap-2 text-base font-bold text-foreground">🎙️ {titre}</p>
        {sousTitre && <p className="text-xs text-muted-foreground">{sousTitre}</p>}
      </div>
      {children}
    </section>
  );
}

/** « Commencer l'enregistrement » ; pendant l'enregistrement : pastille qui clignote + temps + « Arrêter » */
export function BoutonEnregistrer({ enregistrement, secondes, onCommencer, onArreter, disabled, libelle = "Commencer l'enregistrement", className }: {
  enregistrement: boolean;
  secondes: number;
  onCommencer: () => void;
  onArreter: () => void;
  disabled?: boolean;
  libelle?: string;
  className?: string;
}) {
  if (enregistrement) {
    return (
      <div className={cn('flex flex-wrap items-center gap-3', className)} role="status" aria-live="polite">
        <span className="flex items-center gap-2 text-base font-bold text-red-700 dark:text-red-300">
          <span aria-hidden className="h-3.5 w-3.5 rounded-full bg-red-600 animate-pulse" />
          <span className="font-mono tabular-nums">{temps(secondes)}</span>
          <span className="sr-only">Enregistrement en cours</span>
        </span>
        <button type="button" onClick={onArreter} className={cn(GRAND, 'border-2 border-red-600 bg-background text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40')}>
          <Square className="h-5 w-5" fill="currentColor" /> Arrêter
        </button>
      </div>
    );
  }
  return (
    <button type="button" onClick={onCommencer} disabled={disabled} className={cn(GRAND, ROUGE_ENREGISTRER, 'w-full sm:w-auto', className)}>
      <Mic className="h-5 w-5 shrink-0" /> {libelle}
    </button>
  );
}

/** Après l'enregistrement : réécouter (fourni par l'écran), puis « Envoyer » et « Refaire », pareils partout */
export function ActionsEnregistrement({ apercu, children, onEnvoyer, onRefaire, envoi, desactive, libelleEnvoyer = 'Envoyer à mon professeur' }: {
  /** Le lecteur pour réécouter */
  apercu: ReactNode;
  /** En plus, entre l'écoute et les boutons (ex. commentaire) */
  children?: ReactNode;
  /** Absent : pas de bouton « Envoyer » ici (l'envoi se fait avec le reste de l'écran) */
  onEnvoyer?: () => void;
  onRefaire: () => void;
  envoi?: boolean;
  desactive?: boolean;
  libelleEnvoyer?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="min-w-0">{apercu}</div>
      {children}
      <div className="flex flex-wrap gap-2">
        {onEnvoyer && (
          <button type="button" onClick={onEnvoyer} disabled={envoi || desactive} className={cn(GRAND, ROUGE_ENREGISTRER, 'flex-1 min-w-[11rem]')}>
            {envoi ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {envoi ? 'Envoi…' : libelleEnvoyer}
          </button>
        )}
        <button type="button" onClick={onRefaire} disabled={envoi} className={cn(GRAND, 'border-2 border-red-300 bg-background text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40', !onEnvoyer && 'flex-1')}>
          <RotateCcw className="h-5 w-5" /> Refaire
        </button>
      </div>
    </div>
  );
}
