import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FeuArtificeDore } from '@/components/saisons/FeuArtificeDore';

/**
 * 🎉 Bravo en LETTRES DORÉES (Nadia, 2026-11-21) : le même feu d'artifice que la feuille dorée (poussière d'or,
 * étoiles scintillantes, rubans qui tournoient), mais avec de grandes lettres arabes dorées à la place des feuilles,
 * et « Bravo ! » écrit en grand. Dessiné par l'appli : marche hors ligne, rien à télécharger.
 * Respecte « réduire les animations » du téléphone (rien ne s'affiche alors).
 */
let racine: Root | null = null;
let hote: HTMLDivElement | null = null;
let tour = 0;

const sansAnimation = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

export function confettiLettres(lettresEnPlus: string[] = [], duree = 3.5) {
  if (sansAnimation()) return;
  try {
    if (!hote) { hote = document.createElement('div'); document.body.appendChild(hote); racine = createRoot(hote); }
    const n = ++tour;
    racine?.render(createElement(FeuArtificeDore, {
      key: n, duree, theme: 'lettres', lettres: lettresEnPlus.filter(Boolean), bravo: 'Bravo !', auDessus: true,
      onFin: () => { if (n === tour) racine?.render(null); },
    }));
  } catch { /* canvas indisponible : pas de bravo animé, rien ne casse */ }
}
