import { useEffect, useState } from 'react';

/**
 * 🦔 Le personnage qui se promène en bas de l'accueil EST le compagnon (Nadia, 2026-11-11 : le petit personnage fixe est retiré).
 * - On le touche : il s'arrête 10 s et dit un message (JeuxSaison écoute l'événement et affiche la bulle).
 * - Il grandit d'un cran par jour de connexion (1 fois par 24 h, base : compagnon_du_jour), jusqu'à +40 %.
 * Les décors (automne, hiver, printemps/été) n'ont qu'à appeler `toucherCompagnon` et `useTailleCompagnon`.
 */
export const EVT_TOUCHE = 'dinislam:compagnon-touche';
const EVT_NIVEAU = 'dinislam:compagnon-niveau';
export const PAUSE_MS = 10000;

export interface DetailTouche { x: number; y: number; nom: string; ecoute?: boolean }

/** Touché : prévient la bulle. Renvoie false si personne n'écoute (jeu « parle » éteint) → le décor garde son ancien comportement */
export function toucherCompagnon(el: Element, nom: string): boolean {
  const r = el.getBoundingClientRect();
  const detail: DetailTouche = { x: r.left + r.width / 2, y: r.top, nom };
  window.dispatchEvent(new CustomEvent<DetailTouche>(EVT_TOUCHE, { detail }));
  return !!detail.ecoute;
}

let niveauActuel = 0;
/** Appelé par JeuxSaison quand on connaît la taille du jour (0 si « Le compagnon grandit » est éteint) */
export function annoncerNiveau(n: number) {
  niveauActuel = n;
  window.dispatchEvent(new CustomEvent<number>(EVT_NIVEAU, { detail: n }));
}

export const echelleDe = (niveau: number) => 1 + Math.min(Math.max(niveau, 0), 40) * 0.01;

/** Échelle du personnage (1 = taille normale, 1,4 au plus) */
export function useTailleCompagnon(): number {
  const [n, setN] = useState(niveauActuel);
  useEffect(() => {
    const f = (e: Event) => setN((e as CustomEvent<number>).detail);
    window.addEventListener(EVT_NIVEAU, f);
    setN(niveauActuel);
    return () => window.removeEventListener(EVT_NIVEAU, f);
  }, []);
  return echelleDe(n);
}
