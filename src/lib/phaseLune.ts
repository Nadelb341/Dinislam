/**
 * 🌙 Phase de la lune selon le jour du mois hégirien (Nadia, 2026-11-17) :
 * début du mois = fin croissant éclairé à DROITE (comme sa photo), milieu = pleine lune (vers le 14ᵉ jour),
 * fin du mois = croissant « bombé dans l'autre sens » (éclairé à GAUCHE), avec toutes les étapes entre les deux
 * (premier croissant, premier quartier, gibbeuse, pleine lune, gibbeuse, dernier quartier, dernier croissant).
 * Le mois hégirien commence avec le premier croissant visible : le jour 1 ≈ 1,5 jour après la nouvelle lune.
 */
import type { PeriodeRamadan } from '@/lib/ramadanDates';

const MOIS_LUNAIRE = 29.53;

/** Jour du mois hégirien pendant la saison : Ramadan = son jour ; Aïd el-Fitr = 1ᵉʳ Chawwal ; Aïd el-Adha = 10, 11, 12 Dhou al-Hijja */
export function jourHijriDe(fete: PeriodeRamadan): number {
  if (!fete) return 10;
  if (fete.mode === 'fitr') return 1;
  if (fete.mode === 'adha') return 9 + Math.max(1, fete.jour);
  return Math.max(1, fete.jour);
}

/** Avancement dans le cycle (0 = nouvelle lune, 0,5 = pleine lune, 1 = nouvelle lune suivante), jamais tout à fait invisible */
export function fractionLune(jourHijri: number): number {
  const p = (Math.max(1, Math.min(30, jourHijri)) + 0.8) / MOIS_LUNAIRE;
  // Jamais plus fin qu'un croissant bien visible (comme sur la photo de Nadia), au début comme à la fin du mois
  return Math.min(0.9, Math.max(0.1, p));
}

/** Nom de la phase (pour les lecteurs d'écran et les tests) */
export function nomPhase(p: number): string {
  if (p < 0.2) return 'premier croissant';
  if (p < 0.3) return 'premier quartier';
  if (p < 0.46) return 'gibbeuse croissante';
  if (p <= 0.545) return 'pleine lune';
  if (p < 0.7) return 'gibbeuse décroissante';
  if (p < 0.8) return 'dernier quartier';
  return 'dernier croissant';
}

/**
 * Chemin SVG de la partie ÉCLAIRÉE d'une lune de centre (cx, cy) et de rayon R.
 * Croissante (p < 0,5) : bord éclairé à droite ; décroissante : à gauche. Le terminateur est une demi-ellipse
 * de demi-largeur R·|cos(2πp)|, bombée vers le côté éclairé pour un croissant, vers l'autre côté pour une gibbeuse.
 */
export function cheminPhase(p: number, cx: number, cy: number, R: number): string {
  const k = Math.cos(2 * Math.PI * p);
  const rx = Math.max(0.01, Math.abs(k) * R).toFixed(2);
  const haut = `${cx} ${(cy - R).toFixed(2)}`;
  const bas = `${cx} ${(cy + R).toFixed(2)}`;
  if (p < 0.5) {
    // Bord droit (haut → droite → bas), puis terminateur (bas → haut) : par la droite si croissant, par la gauche si gibbeuse
    return `M${haut}A${R} ${R} 0 0 1 ${bas}A${rx} ${R} 0 0 ${k > 0 ? 0 : 1} ${haut}Z`;
  }
  // Bord gauche (haut → gauche → bas), puis terminateur (bas → haut) : par la gauche si croissant, par la droite si gibbeuse
  return `M${haut}A${R} ${R} 0 0 0 ${bas}A${rx} ${R} 0 0 ${k > 0 ? 1 : 0} ${haut}Z`;
}
