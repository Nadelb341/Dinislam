/**
 * ⏱️ Durée d'un message éphémère selon sa longueur (Nadia, 22/11) : 3-4 mots → 5 s ; plus long → un peu plus,
 * jusqu'à 12 s environ pour une explication d'une ou deux phrases.
 */
export function dureeMessage(texte: string): number {
  const mots = texte.trim().split(/\s+/).filter(Boolean).length;
  if (mots <= 4) return 5000;
  return Math.min(12000, 5000 + (mots - 4) * 350);
}
