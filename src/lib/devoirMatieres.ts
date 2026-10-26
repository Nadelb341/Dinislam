/**
 * Matières des devoirs (2026-10-26) : prêtes à compléter pour l'enseignante (« Nourania : revoir les 3 premières lignes »)
 * et reconnues côté élève (emoji du devoir et de son diamant). La valeur `type` est celle de la table `devoirs`.
 */
export const MATIERES: { type: string; emoji: string; label: string; exemple: string }[] = [
  { type: 'nourania', emoji: '✨', label: 'Nourania', exemple: 'revoir les 3 premières lignes de la leçon 10' },
  { type: 'sourate', emoji: '📖', label: 'Sourate', exemple: 'apprendre Al-Masad versets 1 à 3' },
  { type: 'recitation', emoji: '🎙️', label: 'Récitation', exemple: "m'envoyer l'audio d'Al-Kawthar" },
  { type: 'allah_names', emoji: '🌟', label: "99 noms d'Allah", exemple: 'réviser les noms 1 à 5' },
  { type: 'alphabet', emoji: '🔤', label: 'Alphabet', exemple: 'écrire 5 fois la lettre ج' },
  { type: 'invocations', emoji: '🤲', label: 'Invocations', exemple: "apprendre l'invocation du réveil" },
  { type: 'priere', emoji: '🕌', label: 'Prière', exemple: 'réviser les positions de la prière' },
  { type: 'coran', emoji: '📗', label: 'Coran', exemple: 'lire la page 582' },
  { type: 'autre', emoji: '✏️', label: 'Autre', exemple: 'fiche à colorier' },
];

export const matiereOf = (type: string) =>
  MATIERES.find((m) => m.type === type) ?? (type === 'exercice_pdf' ? { type, emoji: '📄', label: 'Exercice', exemple: '' } : MATIERES[MATIERES.length - 1]);
