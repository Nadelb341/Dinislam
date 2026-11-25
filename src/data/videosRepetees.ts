/**
 * 🎬 Vidéos « Apprendre sourate … (Répété 3 fois) » de la chaîne hhdhl4 (Nadia, 2026-11-26 : « plus facile pour les enfants »).
 * Elles REMPLACENT la vidéo commune d'El Houssary dans la fiche de la sourate. Sourate absente de la liste = on garde
 * l'ancienne vidéo (78, 79, 80, 81, 83, Ayat al-Kursi et 2 à 77 : pas de vidéo de ce genre trouvée le 26/11).
 * Vérifiées le 26/11/2026 : toutes s'affichent dans l'appli (oEmbed 200). 84 = « répétée 2 fois » (seule version de la chaîne).
 * 🔄 À revérifier en janvier et en juin (une vidéo YouTube peut disparaître).
 */
const VIDEOS_REPETEES: Record<number, string> = {
  1: 'lLzs5QX9pDE', 82: 'v3vk52vcpp4', 84: 'Cf508eH1vvE', 85: 'Bh4_MamkwYo', 86: 'IZC_6azgd6s', 87: '-3UnG09LmQc',
  88: 'KUxIAyOU3sA', 89: 'TYc8P9EcDgE', 90: 'OaTQ0HlOniI', 91: '7TLCgxsC1Ew', 92: 'hJ7RUf-azfA', 93: 'WCMy3FR8Icc',
  94: 'I5XO6rAqls0', 95: '9ezZjSByt68', 96: 'X_bfyGw7s4w', 97: 'sDbkeHszWBc', 98: '1bSLhqjiN5U', 99: 'cQ4XWJwa5tk',
  100: 'ORzfGVVQ0A4', 101: 'C9gCJzN0Wt0', 102: 'jsGLPb3KSak', 103: 'VuZmqb-cK28', 104: 'BN8sn6CVTJg', 105: 'iOBHQWDpljU',
  106: 'A2g-eTotpMM', 107: 'wsjuo84FEfw', 108: 'cHXxpoHHrM4', 109: 'Ha4-Jx8Y6ig', 110: '0CbMyMcNaXs', 111: 'pawq5YbG8n0',
  112: 'tUzowT9kasE', 113: 'vAxKV6e6sC4', 114: 'Os7FAypD1AY',
};

export function getVideoRepeteeEmbedUrl(sourateNumber: number): string | null {
  const id = VIDEOS_REPETEES[sourateNumber];
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
