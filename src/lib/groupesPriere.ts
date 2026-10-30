/**
 * 👶 Statut de l'élève pour la Prière (Petits / Jeunes / Adultes), réglé dans la fenêtre « Date de naissance »
 * de sa fiche (bouclier › Élèves › ⋮), déplacé depuis le Monitoring le 2026-10-30.
 * Sans choix de l'enseignante, il se déduit de l'âge.
 */
export const GROUPES_PRIERE = [
  { key: 'petits', label: '👶 Petits', actif: 'bg-blue-200 text-blue-800 border-blue-400 dark:bg-blue-900 dark:text-blue-100' },
  { key: 'jeunes', label: '🧒 Jeunes', actif: 'bg-green-200 text-green-800 border-green-400 dark:bg-green-900 dark:text-green-100' },
  { key: 'adultes', label: '🧑 Adultes', actif: 'bg-purple-200 text-purple-800 border-purple-400 dark:bg-purple-900 dark:text-purple-100' },
] as const;

export function ageDepuis(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

/** Même règle qu'avant : jusqu'à 6 ans Petits, jusqu'à 10 ans Jeunes, ensuite Adultes */
export const groupeAuto = (age: number | null): string | null => (age === null ? null : age <= 6 ? 'petits' : age <= 10 ? 'jeunes' : 'adultes');
