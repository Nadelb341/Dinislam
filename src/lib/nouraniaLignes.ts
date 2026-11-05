/**
 * 🔢 Numéros de lignes des leçons Nourania (2026-11-05, demande de Nadia : « je suis obligée de compter les lignes sur Zoom »).
 *
 * Chaque PDF de leçon (`nourania_lesson_content.lignes`) garde la liste de ses lignes :
 *   p = page (1, 2…), t / b = haut / bas de la ligne en % de la hauteur de la page,
 *   s = 'lecon'  → ligne de CETTE leçon : numérotée (la numérotation continue d'une page à l'autre)
 *       'autre'  → ligne d'une autre leçon sur la même page : sans numéro, un peu pâle
 *       'aucune' → pas une ligne à lire (petit texte d'explication…) : rien n'est affiché
 * Positions détectées automatiquement sur la grille du livre (copie gardée dans `lignes_auto`),
 * réglables par l'admin avec « 🔢 Régler les lignes ».
 * Affichage choisi par Nadia : piste B (pastille posée sur le cadre bleu à droite), « 4 ٤ »
 * (chiffre français collé aux lignes, chiffre arabe à sa droite), la ligne s'allume au toucher.
 */

export type StatutLigne = 'lecon' | 'autre' | 'aucune';

export interface LigneCours {
  p: number;
  t: number;
  b: number;
  s: StatutLigne;
}

/** Bord droit du tableau dans les pages du livre (% de la largeur) : la pastille commence juste après, sur le cadre bleu */
export const BORD_TABLEAU = 92.6;

const CHIFFRES_ARABES = '٠١٢٣٤٥٦٧٨٩';
export const enChiffresArabes = (n: number) => String(n).replace(/\d/g, (d) => CHIFFRES_ARABES[Number(d)]);

const arrondi = (x: number) => Math.round(x * 10) / 10;

/** Lit la colonne jsonb sans jamais planter (valeur absente ou abîmée → aucune ligne) */
export function lireLignes(valeur: unknown): LigneCours[] {
  if (!Array.isArray(valeur)) return [];
  return valeur
    .filter((x): x is LigneCours =>
      !!x && typeof x === 'object'
      && typeof (x as LigneCours).p === 'number' && typeof (x as LigneCours).t === 'number' && typeof (x as LigneCours).b === 'number'
      && ['lecon', 'autre', 'aucune'].includes((x as LigneCours).s))
    .map((x) => ({ p: x.p, t: x.t, b: x.b, s: x.s }));
}

/** Rangées dans l'ordre de lecture : page, puis de haut en bas */
export function trierLignes(lignes: LigneCours[]): LigneCours[] {
  return [...lignes].sort((a, b) => a.p - b.p || a.t - b.t);
}

/** Numéro de chaque ligne (dans l'ordre trié) : seules les lignes « lecon » sont numérotées, 1, 2, 3… sur toutes les pages */
export function numeroter(lignes: LigneCours[]): (number | null)[] {
  let n = 0;
  return lignes.map((l) => (l.s === 'lecon' ? ++n : null));
}

export const nombreDeLignes = (lignes: LigneCours[]) => lignes.filter((l) => l.s === 'lecon').length;

/** Statut suivant quand l'admin touche le bouton d'une ligne en mode réglage */
export const statutSuivant = (s: StatutLigne): StatutLigne => (s === 'lecon' ? 'autre' : s === 'autre' ? 'aucune' : 'lecon');

/** Déplace le haut ou le bas d'une ligne, sans jamais la retourner (au moins 2 % de hauteur) ni sortir de la page */
export function deplacerBord(l: LigneCours, bord: 't' | 'b', delta: number): LigneCours {
  if (bord === 't') return { ...l, t: arrondi(Math.min(Math.max(0, l.t + delta), l.b - 2)) };
  return { ...l, b: arrondi(Math.max(Math.min(100, l.b + delta), l.t + 2)) };
}

/** Coupe une ligne en deux lignes de même hauteur (même statut) */
export function couperEnDeux(l: LigneCours): [LigneCours, LigneCours] {
  const m = arrondi((l.t + l.b) / 2);
  return [{ ...l, b: m }, { ...l, t: m }];
}

/** Nouvelle ligne juste en dessous, de la même hauteur (bornée au bas de la page) */
export function ligneEnDessous(l: LigneCours): LigneCours {
  const h = l.b - l.t;
  const t = Math.min(l.b, 98);
  return { p: l.p, t, b: arrondi(Math.min(100, t + h)), s: 'lecon' };
}

/** Taille de la pastille selon la largeur de la page affichée (px) */
export function taillePastille(largeurPage: number) {
  const hauteur = Math.round(Math.min(34, Math.max(20, largeurPage * 0.042)));
  const police = Math.round(hauteur * 0.56);
  return { hauteur, police };
}

/**
 * Place à garder à droite de la page pour que la pastille la plus large (« 35 ٣٥ ») ne soit jamais coupée :
 * la pastille commence sur le cadre bleu et peut déborder un peu à droite de la page.
 */
export function margeDroite(largeurDispo: number, maxNumero: number): number {
  if (maxNumero <= 0) return 0;
  const { hauteur, police } = taillePastille(largeurDispo);
  const chiffres = String(maxNumero).length * 2;
  const largeurPastille = chiffres * police * 0.62 + police * 0.35 + hauteur * 0.5 + 4;
  const cadre = largeurDispo * (1 - BORD_TABLEAU / 100);
  return Math.max(0, Math.ceil(largeurPastille - cadre + 6));
}
