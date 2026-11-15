/**
 * 🎉 Anniversaire de l'élève (choix de Nadia du 15/11, page https://claude.ai/artifact/8423oTGgpm8VcaW5r67wvh).
 * JAMAIS les mots « joyeux anniversaire » (Nadia) : « Aujourd'hui, tu as un an de plus ». Ni gâteau, ni bougies.
 * Même règle que la base (`anniversaire_du_jour`) : fêté à la 1ʳᵉ connexion dans les 30 jours après la date ;
 * 29 février → 28 février les années non bissextiles. La fête dure 24 h à partir de cette 1ʳᵉ connexion.
 */
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const bissextile = (a: number) => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;

export function dateAnniversaire(naissance: string, annee: number): Date {
  const [, m, j] = naissance.slice(0, 10).split('-').map(Number);
  return m === 2 && j === 29 && !bissextile(annee) ? new Date(annee, 1, 28) : new Date(annee, m - 1, j);
}

export type InfoAnniversaire = { date: string; annee: number; age: number; aujourdhui: boolean; joursDepuis: number };

export function infoAnniversaire(naissance: string | null | undefined, maintenant = new Date()): InfoAnniversaire | null {
  if (!naissance || !/^\d{4}-\d{2}-\d{2}/.test(naissance)) return null;
  const auj = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  const ne = Number(naissance.slice(0, 4));
  let a = dateAnniversaire(naissance, auj.getFullYear());
  if (a > auj) a = dateAnniversaire(naissance, auj.getFullYear() - 1);
  const joursDepuis = Math.round((auj.getTime() - a.getTime()) / 86400000);
  if (joursDepuis > 30 || a.getFullYear() <= ne) return null;
  return { date: iso(a), annee: a.getFullYear(), age: a.getFullYear() - ne, aujourdhui: joursDepuis === 0, joursDepuis };
}

export const FETE_MS = 24 * 3600 * 1000;
export const cleFete = (uid: string, annee: number) => `dinislam_anniv_${uid}_${annee}`;
/** Début de la fête (1ʳᵉ fois vue sur cet appareil), ou null */
export function debutFete(uid: string, annee: number): number | null {
  try { const v = Number(localStorage.getItem(cleFete(uid, annee))); return v > 0 ? v : null; } catch { return null; }
}
export function commencerFete(uid: string, annee: number, t = Date.now()) {
  try { if (!debutFete(uid, annee)) localStorage.setItem(cleFete(uid, annee), String(t)); } catch { /* stockage indisponible */ }
}
export const feteEnCours = (debut: number | null, t = Date.now()) => debut !== null && t - debut < FETE_MS;

/** Phrase du message : le jour même, ou quelques jours après */
export function phraseAnniversaire(info: InfoAnniversaire): string {
  if (info.aujourdhui) return 'Aujourd\'hui, tu as un an de plus !';
  const jour = new Date(`${info.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return `Le ${jour}, tu as eu un an de plus !`;
}

// La fête de 24 h est connue des autres morceaux de l'appli (chapeau du compagnon, titre) par une classe sur la page
export const CLASSE_FETE = 'anniv-fete';
export const EVT_FETE = 'dinislam:anniversaire-fete';
export const feteAffichee = () => typeof document !== 'undefined' && document.documentElement.classList.contains(CLASSE_FETE);
