/**
 * 🙈 Logique du cache-cache de l'accueil (pure, testée dans cacheCacheLogique.test.ts) — 2026-11-26.
 * - Le personnage se cache PARTOUT dans l'accueil : derrière une carte, le logo, le titre, l'arbre, la cheminée, dans le tas
 *   de feuilles… (éléments marqués `data-cachette` dans le décor). Un bout de lui dépasse toujours.
 * - Les traces de pas 🐾 vont TOUJOURS vers le vrai personnage visible (position réelle à l'écran, recalculée sans arrêt) ;
 *   s'il est hors de l'écran, elles vont jusqu'au bord de l'écran, dans sa direction.
 */

export type Point = { x: number; y: number };
export type Boite = { left: number; top: number; width: number; height: number };
/** Côté par où il dépasse : par le haut de l'élément (la tête) ou par un côté */
export type Cote = 'haut' | 'gauche' | 'droite';
export type Trace = { x: number; y: number; r: number };
/** Zone de l'écran où l'on dessine les traces (bords exclus) */
export type Zone = { x0: number; y0: number; x1: number; y1: number };

/** Taille de la « fenêtre » d'où il dépasse (le reste de lui est caché derrière l'élément) */
export const FENETRE: Record<Cote, { l: number; h: number }> = { haut: { l: 48, h: 44 }, gauche: { l: 44, h: 48 }, droite: { l: 44, h: 48 } };

const borne = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * La fenêtre de sa cachette : collée au bord de l'élément (`bord` = de combien on rentre dans l'élément, 0 à 1),
 * placée le long de ce bord selon `place` (0 = début, 1 = fin). Le personnage est dans la fenêtre, le reste est caché.
 */
export function fenetreCachette(el: Boite, cote: Cote, place: number, bord = 0): Boite {
  const { l, h } = FENETRE[cote];
  const p = borne(place, 0, 1);
  if (cote === 'haut') {
    const y = el.top + borne(bord, 0, 0.95) * el.height;
    return { left: el.left + p * Math.max(0, el.width - l), top: y - h, width: l, height: h };
  }
  const top = el.top + p * Math.max(0, el.height - h);
  if (cote === 'gauche') return { left: el.left + borne(bord, 0, 0.95) * el.width - l, top, width: l, height: h };
  return { left: el.left + el.width - borne(bord, 0, 0.95) * el.width, top, width: l, height: h };
}

/** Le point visé par les traces : le bout de lui qui dépasse (pas le milieu de la carte) */
export function pointVisible(f: Boite, cote: Cote): Point {
  if (cote === 'haut') return { x: f.left + f.width / 2, y: f.top + f.height - 10 };
  if (cote === 'gauche') return { x: f.left + f.width - 10, y: f.top + f.height / 2 };
  return { x: f.left + 10, y: f.top + f.height / 2 };
}

const dedans = (p: Point, z: Zone) => p.x >= z.x0 && p.x <= z.x1 && p.y >= z.y0 && p.y <= z.y1;

/** Le morceau du segment a→b qui est dans la zone (méthode de Liang-Barsky), ou null */
export function couperSegment(a: Point, b: Point, z: Zone): [Point, Point] | null {
  const dx = b.x - a.x, dy = b.y - a.y;
  let t0 = 0, t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [a.x - z.x0, z.x1 - a.x, a.y - z.y0, z.y1 - a.y];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return null; continue; }
    const t = q[i] / p[i];
    if (p[i] < 0) { if (t > t1) return null; if (t > t0) t0 = t; } else { if (t < t0) return null; if (t < t1) t1 = t; }
  }
  return [{ x: a.x + dx * t0, y: a.y + dy * t0 }, { x: a.x + dx * t1, y: a.y + dy * t1 }];
}

/** Le point du bord de la zone, en partant de `o` (dans la zone) vers `cible` (dehors) */
export function bordVers(o: Point, cible: Point, z: Zone): Point {
  const s = couperSegment(o, cible, z);
  return s ? s[1] : { x: borne(cible.x, z.x0, z.x1), y: borne(cible.y, z.y0, z.y1) };
}

/**
 * 🐾 Les traces de pas, de `depart` (la bulle « Essaie de me trouver ! ») jusqu'à `arrivee` (le bout visible du personnage),
 * en coordonnées de l'écran. Personnage visible : la dernière trace s'arrête juste avant lui, exactement dans sa direction.
 * Personnage hors de l'écran : les traces vont jusqu'au bord de l'écran, dans sa direction.
 */
export function cheminTraces(depart: Point, arrivee: Point, z: Zone, pas = 46): Trace[] {
  let a: Point, b: Point;
  const coupe = couperSegment(depart, arrivee, z);
  if (coupe && Math.hypot(coupe[1].x - coupe[0].x, coupe[1].y - coupe[0].y) >= 40) {
    [a, b] = coupe;
  } else {
    // La bulle et lui sont tous les deux hors de l'écran (du même côté) : du milieu de l'écran vers le bord, dans sa direction
    a = { x: (z.x0 + z.x1) / 2, y: (z.y0 + z.y1) / 2 };
    b = bordVers(a, arrivee, z);
  }
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  if (L < 1) return [];
  const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L;
  // Il est visible : on s'arrête à 26 px de lui (la trace ne le cache pas) ; sinon on va jusqu'au bord
  const fin = dedans(arrivee, z) ? Math.max(0, L - 26) : L;
  const n = Math.max(2, Math.min(14, Math.round(fin / pas)));
  const r = Math.atan2(uy, ux) * 180 / Math.PI + 90;
  return Array.from({ length: n }, (_, i) => {
    const d = fin * (i + 1) / n, cote = i % 2 ? 7 : -7;
    // Pied gauche, pied droit : un petit écart de chaque côté du chemin (perpendiculaire à la direction)
    return { x: a.x + ux * d - uy * cote, y: a.y + uy * d + ux * cote, r };
  });
}

/** Choisit la cachette : une fois sur deux dans le décor (s'il y en a), sinon derrière une carte */
export function choisirCachette(nbDecor: number, nbCartes: number, h1: number, h2: number): { type: 'decor' | 'carte'; i: number } | null {
  if (!nbDecor && !nbCartes) return null;
  const decor = nbDecor > 0 && (nbCartes === 0 || h1 < 0.5);
  const n = decor ? nbDecor : nbCartes;
  return { type: decor ? 'decor' : 'carte', i: Math.min(n - 1, Math.floor(h2 * n)) };
}

/** La boîte touche-t-elle un bouton / lien (on n'en cache jamais un) ? Les très grandes cibles (cartes) ne comptent pas. */
export function gene(b: Boite, obstacles: Boite[], aireMax: number): boolean {
  return obstacles.some((o) => o.width * o.height <= aireMax
    && b.left < o.left + o.width && o.left < b.left + b.width && b.top < o.top + o.height && o.top < b.top + b.height);
}
