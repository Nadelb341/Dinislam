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

// ——— 🧣 Habit du jour (cache-cache, idée 4) : trouvé → il le porte toute la journée ———
export type Habit = 'echarpe' | 'bonnet' | 'fleur' | 'lunettes';
const EVT_HABIT = 'dinislam:compagnon-habit';
const cleHabit = (userId: string | null) => `dinislam_habit_${userId ?? 'invite'}`;
const aujourdhui = () => new Date().toLocaleDateString('en-CA');

export function porterHabit(userId: string | null, habit: Habit) {
  try { localStorage.setItem(cleHabit(userId), JSON.stringify({ jour: aujourdhui(), habit })); } catch { /* stockage indisponible */ }
  window.dispatchEvent(new Event(EVT_HABIT));
}
function lireHabit(userId: string | null): Habit | null {
  try {
    const v = JSON.parse(localStorage.getItem(cleHabit(userId)) || 'null') as { jour: string; habit: Habit } | null;
    return v && v.jour === aujourdhui() ? v.habit : null;
  } catch { return null; }
}
export function useHabitDuJour(userId: string | null): Habit | null {
  const [h, setH] = useState(() => lireHabit(userId));
  useEffect(() => {
    const f = () => setH(lireHabit(userId));
    f();
    window.addEventListener(EVT_HABIT, f);
    return () => window.removeEventListener(EVT_HABIT, f);
  }, [userId]);
  return h;
}

/** Le dessin de l'habit, à ajouter DANS le dessin du personnage (mêmes coordonnées que son viewBox) */
export function habitSvg(habit: Habit | null, w: number, h: number, perso?: string): string {
  if (!habit) return '';
  // Le hérisson a la tête en bas à gauche : son écharpe y descend
  if (habit === 'echarpe' && perso === 'herisson') return `<g transform="translate(${(w * 0.1).toFixed(1)} ${(h * 0.66).toFixed(1)}) scale(${(w * 0.34 / 20).toFixed(3)}) rotate(-12 10 5)"><path d="M1 2Q10 7 19 2L19 5.5Q10 10.5 1 5.5Z" fill="#2563eb" stroke="#1e3a8a" stroke-width=".8"/></g>`;
  const pose = (x: number, y: number, larg: number, unite: number, dessin: string) => {
    const s = larg / unite;
    return `<g transform="translate(${(x - larg / 2).toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})">${dessin}</g>`;
  };
  if (habit === 'bonnet') return pose(w * 0.5, -h * 0.1, w * 0.62, 20, '<path d="M2 11Q10-5 18 11Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="1"/><rect x="1" y="9.5" width="18" height="3.6" rx="1.8" fill="#fff" stroke="#94a3b8" stroke-width=".6"/><circle cx="10" cy="1" r="2.3" fill="#fff" stroke="#94a3b8" stroke-width=".6"/>');
  if (habit === 'echarpe') return pose(w * 0.42, h * 0.47, w * 0.5, 20, '<path d="M1 2Q10 7 19 2L19 5.5Q10 10.5 1 5.5Z" fill="#2563eb" stroke="#1e3a8a" stroke-width=".8"/><rect x="12" y="5.5" width="4" height="8" rx="1.5" fill="#2563eb" stroke="#1e3a8a" stroke-width=".8"/><path d="M13 12.5v1.5M15 12.5v1.5" stroke="#fde047" stroke-width=".8"/>');
  if (habit === 'lunettes') return pose(w * 0.5, h * 0.22, w * 0.55, 20, '<circle cx="5" cy="4" r="3.8" fill="#111827"/><circle cx="15" cy="4" r="3.8" fill="#111827"/><path d="M8.6 3.4h2.8" stroke="#111827" stroke-width="1.2"/><circle cx="4" cy="3" r="1" fill="#fff" opacity=".6"/><circle cx="14" cy="3" r="1" fill="#fff" opacity=".6"/>');
  return `<text x="${(w * 0.5).toFixed(1)}" y="${(h * 0.12).toFixed(1)}" font-size="${(h * 0.3).toFixed(1)}" text-anchor="middle">🌼</text>`;
}
