/**
 * ✨ « Forme » d'une leçon des Lettres particulières (Nadia, 2026-11-22) : les lettres de la règle, avec en COULEUR ce qui compte
 * (ex. « ب{َ} ب{ُ} ب{ِ} » : les voyelles en couleur, « بَ{ا} » : le alif en couleur). Ce qui est entre { } est en couleur.
 * Chrome ne sait pas colorer un petit signe (fatha, chadda…) seul : il prend la couleur de sa lettre. D'où 2 calques superposés :
 * - le calque du DESSUS : toutes les lettres, SANS les signes à colorer ;
 * - le calque du DESSOUS : seulement les lettres qui portent un signe à colorer, avec ce signe, tout en couleur.
 */
export interface Grappe { base: string; marques: { c: string; couleur: boolean }[]; couleur: boolean }

const MARQUE = /[ً-ٰٟۖ-ۭ]/;

/** Découpe « ب{َ} بَ{ا} » en lettres (grappes) avec leurs signes, chacun marqué « en couleur » ou non */
export function grappes(texte: string): Grappe[] {
  const res: Grappe[] = [];
  let enCouleur = false;
  for (const c of texte) {
    if (c === '{') { enCouleur = true; continue; }
    if (c === '}') { enCouleur = false; continue; }
    const der = res.at(-1);
    if (MARQUE.test(c) && der) der.marques.push({ c, couleur: enCouleur });
    else res.push({ base: c, marques: [], couleur: enCouleur });
  }
  return res;
}

export type Morceau = { texte: string; couleur: boolean };

/** Regroupe des morceaux voisins de même couleur (moins de coupures dans le mot) */
function fusionner(m: Morceau[]): Morceau[] {
  const r: Morceau[] = [];
  for (const x of m) { const d = r.at(-1); if (d && d.couleur === x.couleur) d.texte += x.texte; else r.push({ ...x }); }
  return r;
}

/** Calque du dessus : lettres normales + lettres en couleur ; les signes « en couleur » posés sur une lettre normale sont retirés */
export function calqueDessus(g: Grappe[]): Morceau[] {
  return fusionner(g.map((x) => x.couleur
    ? { texte: x.base + x.marques.map((m) => m.c).join(''), couleur: true }
    : { texte: x.base + x.marques.filter((m) => !m.couleur).map((m) => m.c).join(''), couleur: false }));
}

/** Calque du dessous : seules les lettres normales qui portent un signe en couleur sont visibles (lettre + signe, en couleur) */
export function calqueDessous(g: Grappe[]): Morceau[] {
  return fusionner(g.map((x) => {
    const signe = !x.couleur && x.marques.some((m) => m.couleur);
    return { texte: x.base + x.marques.map((m) => m.c).join(''), couleur: signe };
  }));
}

export const sansAccolades = (t: string) => t.replace(/[{}]/g, '');
