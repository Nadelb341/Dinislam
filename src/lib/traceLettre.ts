/** ✍️ Jeu « Trace la lettre » (tout-petits) : calcul de la validation automatique. */
/** Morceaux de la lettre (corps, points…) sur une grille, et part de chacun couverte par le trait (élargi) */
export function couverture(masque: Uint8Array, encre: Uint8Array, gw: number, gh: number) {
  const vu = new Uint8Array(masque.length);
  const parts: { taille: number; part: number }[] = [];
  for (let i = 0; i < masque.length; i++) {
    if (!masque[i] || vu[i]) continue;
    let total = 0, couvert = 0;
    const pile = [i]; vu[i] = 1;
    while (pile.length) {
      const k = pile.pop()!;
      total++; if (encre[k]) couvert++;
      const x = k % gw, y = (k - x) / gw;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
        const n = ny * gw + nx;
        if (masque[n] && !vu[n]) { vu[n] = 1; pile.push(n); }
      }
    }
    if (total >= 6) parts.push({ taille: total, part: couvert / total });
  }
  return parts;
}

/** Validé si le corps (plus grand morceau) est couvert à 60 % et chaque point / hamza à 45 % */
export function traceValide(parts: { taille: number; part: number }[]) {
  if (!parts.length) return false;
  const grand = Math.max(...parts.map((p) => p.taille));
  return parts.every((p) => p.part >= (p.taille === grand ? 0.6 : 0.45));
}
