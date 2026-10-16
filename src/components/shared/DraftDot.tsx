import { useHasDraft } from '@/hooks/useDrafts';

/**
 * Pastille « 📝 » à côté d'un bouton ou d'une carte qui contient un brouillon pas encore enregistré (idée A, 2026-10-16).
 * `draftKey` : clé exacte du brouillon, ou préfixe se terminant par « _ » (ex. toutes les réponses aux élèves), ou une liste de clés.
 */
export function DraftDot({ draftKey, className = '', tiny = false }: { draftKey: string | string[] | null | undefined; className?: string; /** Très petite case (ex. jours du Ramadan) */ tiny?: boolean }) {
  const has = useHasDraft(draftKey);
  if (!has) return null;
  if (tiny) {
    return <span role="img" aria-label="Brouillon en cours" title="Brouillon pas encore enregistré" className={`leading-none ${className.includes('text-[') ? '' : 'text-[7px]'} ${className}`}>📝</span>;
  }
  return (
    <span
      role="img"
      aria-label="Brouillon en cours"
      title="Brouillon pas encore enregistré"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs leading-5 dark:bg-amber-900/50 ${className}`}
    >
      📝
    </span>
  );
}
