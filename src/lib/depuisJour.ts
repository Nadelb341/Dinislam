/**
 * 📡 Date « depuis » STABLE pour une requête (2026-11-12) : minuit (heure de l'appareil) il y a N jours.
 * Avant, on écrivait `new Date(Date.now() - N jours)` : l'adresse de la requête changeait à chaque milliseconde,
 * donc la copie gardée pour le hors ligne (service worker) n'était JAMAIS retrouvée → écran vide ou bouton manquant
 * dès que le réseau était lent (ex. « 👁️ Lu par » du carnet disparu). Arrondie au jour : même adresse toute la journée.
 */
export function depuisJour(jours: number, maintenant = new Date()): string {
  const d = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  d.setDate(d.getDate() - jours);
  return d.toISOString();
}
