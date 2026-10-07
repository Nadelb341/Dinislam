/**
 * Idée bonus 9 (2026-10-07) : les lettres sosies (même forme, points différents) partagent la même couleur d'en-tête.
 * Les lettres seules ont chacune leur couleur. Dégradés assez foncés pour du texte blanc.
 */
const FAMILIES: [string, string, string][] = [
  ['بتث', '#5b7cfa', '#9b5cf6'],
  ['جحخ', '#0d9488', '#0284c7'],
  ['دذ', '#ea580c', '#e11d48'],
  ['رز', '#db2777', '#9333ea'],
  ['سش', '#16a34a', '#0d9488'],
  ['صض', '#d97706', '#dc2626'],
  ['طظ', '#0284c7', '#4f46e5'],
  ['عغ', '#e11d48', '#ea580c'],
  ['فق', '#65a30d', '#059669'],
  ['ا', '#475569', '#2563eb'],
  ['ك', '#7c3aed', '#c026d3'],
  ['ل', '#0891b2', '#2563eb'],
  ['م', '#c026d3', '#db2777'],
  ['ن', '#6d28d9', '#1d4ed8'],
  ['ه', '#047857', '#0e7490'],
  ['و', '#c2410c', '#a16207'],
  ['ي', '#1d4ed8', '#0891b2'],
];

export function letterGradient(letter: string): string {
  const f = FAMILIES.find(([letters]) => letters.includes(letter));
  const [, a, b] = f ?? ['', '#5b7cfa', '#9b5cf6'];
  return `linear-gradient(160deg, ${a}, ${b})`;
}

