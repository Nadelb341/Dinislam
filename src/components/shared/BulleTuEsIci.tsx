import { cn } from '@/lib/utils';

/**
 * ✦ « Tu es ici » (Nadia, 2026-11-18, modèle E) : petite bulle dorée posée au-dessus de l'élément en cours
 * (étoile de la sourate en cours, leçon Nourania en cours). Dégradé or pâle, pointe vers l'étoile ;
 * en mode sombre, fond bleu nuit et texte or. Toucher la bulle = toucher l'étoile.
 * À placer dans un parent `relative` centré sur l'étoile ; `haut` = distance au-dessus du haut de l'étoile.
 */
export function BulleTuEsIci({ onClick, haut = 34, className }: { onClick?: () => void; haut?: number; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Tu es ici : ouvrir"
      className={cn(
        'bulle-tu-es-ici absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-[10px] border px-2.5 py-[5px] text-[12px] font-bold leading-none shadow-sm',
        'border-[#e2bb57] bg-gradient-to-br from-[#fff4d6] to-[#ffe1a1] text-[#8a5a00]',
        'dark:border-[#c9a04a] dark:from-[#1d2858] dark:to-[#131b3f] dark:text-[#f3c86a]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c99a2e]',
        className,
      )}
      style={{ top: -haut }}
    >
      <span aria-hidden className="text-[#d99a1f] dark:text-[#f3c86a]">✦ </span>Tu es ici
      {/* Petite pointe vers l'étoile */}
      <span
        aria-hidden
        className="absolute left-1/2 top-full -mt-[4px] h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-[#e2bb57] bg-[#ffe5a8] dark:border-[#c9a04a] dark:bg-[#131b3f]"
      />
    </button>
  );
}
