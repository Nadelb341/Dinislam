import type { CSSProperties } from 'react';

/**
 * 📐 Cadrage d'une photo DANS son emplacement (règle commune de Nadia du 2026-11-04, appliquée à Dinislam le 2026-11-18) :
 * on déplace la photo (x, y en %) et on zoome, sans jamais toucher au fichier. Un réglage PAR EMPLACEMENT
 * (ex. 99 noms : « carte » et « grande image ») gardé dans la colonne `image_cadrage` (jsonb) à côté de la photo.
 */
export type Cadre = { x: number; y: number; zoom: number };
export type Cadrages = Record<string, Cadre>;
export const CADRE_ORIGINE: Cadre = { x: 50, y: 50, zoom: 1 };

const borne = (v: unknown, min: number, max: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d);

export function lireCadre(cadrages: unknown, emplacement: string): Cadre {
  const c = (cadrages && typeof cadrages === 'object' ? (cadrages as Record<string, Partial<Cadre>>)[emplacement] : null) || {};
  return { x: borne(c.x, 0, 100, 50), y: borne(c.y, 0, 100, 50), zoom: borne(c.zoom, 1, 3, 1) };
}

export const estOrigine = (c: Cadre) => c.x === 50 && c.y === 50 && c.zoom === 1;

/** Style de l'image (object-fit: cover) : position + zoom autour du même point */
export function styleCadre(c: Cadre): CSSProperties {
  return {
    objectPosition: `${c.x}% ${c.y}%`,
    transform: c.zoom !== 1 ? `scale(${c.zoom})` : undefined,
    transformOrigin: `${c.x}% ${c.y}%`,
  };
}

/** Glisser de (dx, dy) pixels dans un cadre de (largeur, hauteur) : la photo suit le doigt */
export function deplacer(c: Cadre, dx: number, dy: number, largeur: number, hauteur: number): Cadre {
  const fx = largeur ? (dx / largeur) * 100 / c.zoom : 0;
  const fy = hauteur ? (dy / hauteur) * 100 / c.zoom : 0;
  return { ...c, x: borne(c.x - fx * 1.5, 0, 100, 50), y: borne(c.y - fy * 1.5, 0, 100, 50) };
}
