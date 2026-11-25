import { useEffect, useState } from 'react';

/**
 * 2026-11-26 (Nadia : téléphone tourné) : vrai quand le téléphone est couché (peu de hauteur).
 * Même règle que l'écran « paysage » de tailwind.config.ts (à changer ENSEMBLE).
 */
export const REQUETE_PAYSAGE = '(orientation: landscape) and (max-height: 500px)';

function lire(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(REQUETE_PAYSAGE).matches;
}

export function usePaysage(): boolean {
  const [paysage, setPaysage] = useState(lire);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(REQUETE_PAYSAGE);
    const f = () => setPaysage(mq.matches);
    f();
    mq.addEventListener?.('change', f);
    return () => mq.removeEventListener?.('change', f);
  }, []);
  return paysage;
}
