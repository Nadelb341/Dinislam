/**
 * ✍️ Jeu « Trace la lettre » (tout-petits) : calcul de la validation automatique.
 * Version plus exigeante (Nadia, 2026-11-22 : « j'ai fait la moitié de la lettre et ça me l'a validé ! ») :
 * - le corps de la lettre est découpé en 6 tranches (dans le sens de sa longueur) : CHAQUE tranche doit être tracée ;
 * - le corps doit être couvert à 65 %, chaque point / hamza à moitié (réglé sur un vrai ب : décalé de 15-20 px = validé, 30 px = non) ;
 * - gribouiller tout l'écran ne marche plus : la plus grande partie du trait doit rester près de la lettre.
 */
export const NB_TRANCHES = 6;

export interface Morceau { taille: number; part: number; tranches: number[] }

/** Morceaux de la lettre (corps, points…) sur une grille, part couverte par le trait (élargi), et couverture de chaque tranche */
export function couverture(masque: Uint8Array, encre: Uint8Array, gw: number, gh: number): Morceau[] {
  const vu = new Uint8Array(masque.length);
  const parts: Morceau[] = [];
  for (let i = 0; i < masque.length; i++) {
    if (!masque[i] || vu[i]) continue;
    const cases: number[] = [];
    const pile = [i]; vu[i] = 1;
    while (pile.length) {
      const k = pile.pop()!;
      cases.push(k);
      const x = k % gw, y = (k - x) / gw;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
        const n = ny * gw + nx;
        if (masque[n] && !vu[n]) { vu[n] = 1; pile.push(n); }
      }
    }
    if (cases.length < 6) continue;
    // Tranches dans le sens le plus long du morceau
    let x0 = gw, x1 = 0, y0 = gh, y1 = 0;
    for (const k of cases) { const x = k % gw, y = (k - x) / gw; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const enLargeur = x1 - x0 >= y1 - y0;
    const debut = enLargeur ? x0 : y0, long = (enLargeur ? x1 - x0 : y1 - y0) + 1;
    const total = new Array(NB_TRANCHES).fill(0), couv = new Array(NB_TRANCHES).fill(0);
    let couvert = 0;
    for (const k of cases) {
      const x = k % gw, y = (k - x) / gw;
      const t = Math.min(NB_TRANCHES - 1, Math.floor((((enLargeur ? x : y) - debut) / long) * NB_TRANCHES));
      total[t]++;
      if (encre[k]) { couvert++; couv[t]++; }
    }
    // Une tranche presque vide (bord arrondi) ne compte pas
    const tranches = total.map((n, t) => (n >= cases.length * 0.04 ? couv[t] / n : 1));
    parts.push({ taille: cases.length, part: couvert / cases.length, tranches });
  }
  return parts;
}

/** Validé si le corps est couvert à 65 % avec chaque tranche tracée (≥ 50 %), et chaque point / hamza à moitié */
export function traceValide(parts: Morceau[]) {
  if (!parts.length) return false;
  const grand = Math.max(...parts.map((p) => p.taille));
  return parts.every((p) => (p.taille === grand
    ? p.part >= 0.65 && p.tranches.every((t) => t >= 0.5)
    : p.part >= 0.5));
}

/** Part du trait (non élargi) qui reste dans la zone autour de la lettre : sous 55 %, c'est du gribouillage */
export function partPresDeLaLettre(trait: Uint8Array, zone: Uint8Array) {
  let n = 0, dedans = 0;
  for (let i = 0; i < trait.length; i++) if (trait[i]) { n++; if (zone[i]) dedans++; }
  return n ? dedans / n : 0;
}
