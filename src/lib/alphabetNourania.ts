/**
 * 🔗 2026-11-26 (Nadia : liens entre cartes, L15) — Alphabet ↔ Nourania.
 * Table construite à partir des VRAIS titres (lus en base le 26/11) :
 * - Nourania : « Leçon 1 - Les lettres isolées », 4 « Les lettres avec voyelles », 5 « Le Tanwin », 6 « Exercices sur le Tanwin »,
 *   9 « L'allongement (Madd) », 10 « Le Soukoun », 11 « La Chadda », 12 « Chadda et Tanwin », 13 « Lam solaire et lunaire »…
 * - Alphabet › Lettres particulières : « Les voyelles courtes », « Le soukoune », « Les voyelles longues (madd) », « Le tanouine »,
 *   « La chadda », « Le tâ marbouta », « La hamza », « L'alif maqsoura », « Le lam-alif », « Les lettres solaires », « Les lettres lunaires ».
 * On relie par le NUMÉRO de la leçon (stable) et par le titre de la particularité (sans accents ni majuscules).
 * Seulement les correspondances CERTAINES : pas de lien pour tâ marbouta, hamza, alif maqsoura, lam-alif,
 * ni pour les leçons 2, 3, 7, 8, 14, 15, 16, 17.
 */

/** Chaque lettre de l'alphabet est travaillée seule dans la leçon 1 (« Les lettres isolées ») */
export const LECON_DES_LETTRES = 1;

/** Particularité (titre normalisé) → numéro de la leçon Nourania qui la travaille */
const PARTICULARITE_VERS_LECON: Record<string, number> = {
  'les voyelles courtes': 4,
  'le soukoune': 10,
  'les voyelles longues (madd)': 9,
  'le tanouine': 5,
  'la chadda': 11,
  'les lettres solaires': 13,
  'les lettres lunaires': 13,
};

/** Leçon Nourania → particularité de l'Alphabet (titre normalisé) ; la leçon 1 renvoie à la grille des lettres */
const LECON_VERS_PARTICULARITE: Record<number, string> = {
  4: 'les voyelles courtes',
  5: 'le tanouine',
  6: 'le tanouine',
  9: 'les voyelles longues (madd)',
  10: 'le soukoune',
  11: 'la chadda',
  12: 'la chadda',
  13: 'les lettres solaires',
};

export const normaliserTitre = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’ʼ]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();

/** Numéro de la leçon Nourania qui travaille cette particularité, ou null si la correspondance n'est pas certaine */
export function leconDeParticularite(titre: string): number | null {
  return PARTICULARITE_VERS_LECON[normaliserTitre(titre)] ?? null;
}

/**
 * Où continuer dans l'Alphabet depuis une leçon Nourania :
 * `{ lettres: true }` = la grille des lettres ; `{ particularite }` = titre normalisé à retrouver ; null = pas de lien.
 */
export function alphabetDeLecon(numero: number): { lettres: true } | { particularite: string } | null {
  if (numero === LECON_DES_LETTRES) return { lettres: true };
  const p = LECON_VERS_PARTICULARITE[numero];
  return p ? { particularite: p } : null;
}
