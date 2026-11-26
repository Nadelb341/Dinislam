import { useSyncExternalStore } from 'react';
import { apresTrouve, avancer, etatDeDepart, type EtatEcureuil, type PageEcureuil } from './ecureuilLogique';

/**
 * 🐿️ L'état de l'écureuil, UNE seule fois pour toute l'appli (il survit aux changements de page).
 * Gardé aussi dans la mémoire de l'onglet (sessionStorage) pour survivre à un rechargement ; une nouvelle ouverture
 * de l'appli = une nouvelle « connexion » (il peut alors être chez lui). Rien ne passe par Internet.
 */
const CLE_ETAT = 'dinislam_ecureuil_etat';
const CLE_PAGES = 'dinislam_ecureuil_pages';

type Store = { etat: EtatEcureuil | null; bravo: number; prenom: string };
let store: Store = { etat: null, bravo: 0, prenom: '' };
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((f) => f());

function changer(s: Partial<Store>) {
  store = { ...store, ...s };
  if (s.etat !== undefined) {
    try { sessionStorage.setItem(CLE_ETAT, JSON.stringify(store.etat)); } catch { /* stockage indisponible */ }
  }
  prevenir();
}

export function lirePages(): PageEcureuil[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_PAGES) || '[]') as PageEcureuil[];
    return Array.isArray(v) ? v.filter((p) => p && typeof p.chemin === 'string' && p.chemin.startsWith('/')) : [];
  } catch { return []; }
}
/** Les pages que l'élève voit sur son accueil (lues sur les cartes), gardées pour la prochaine fois */
export function enregistrerPages(pages: PageEcureuil[]) {
  try { localStorage.setItem(CLE_PAGES, JSON.stringify(pages.slice(0, 40))); } catch { /* stockage indisponible */ }
}

/** Au premier affichage : reprend l'état de l'onglet, sinon tire l'état de la connexion */
export function demarrerEcureuil() {
  if (store.etat) return;
  let e: EtatEcureuil | null = null;
  try { e = JSON.parse(sessionStorage.getItem(CLE_ETAT) || 'null') as EtatEcureuil | null; } catch { e = null; }
  if (!e || (e.lieu !== 'maison' && e.lieu !== 'cache')) e = etatDeDepart(Date.now(), lirePages(), Math.random(), Math.random(), Math.random());
  changer({ etat: e });
}

export function faireAvancer() {
  if (!store.etat) return;
  const e = avancer(store.etat, Date.now(), lirePages(), Math.random(), Math.random());
  if (e !== store.etat) changer({ etat: e });
}

export function ecureuilTrouve() {
  if (!store.etat || store.etat.lieu !== 'cache') return;
  changer({ etat: apresTrouve(store.etat, Date.now(), Math.random()), bravo: Date.now() });
}
export const fermerBravo = () => changer({ bravo: 0 });
export const donnerPrenom = (prenom: string) => { if (prenom && prenom !== store.prenom) changer({ prenom }); };

const abonner = (f: () => void) => { abonnes.add(f); return () => { abonnes.delete(f); }; };
export const useEcureuil = () => useSyncExternalStore(abonner, () => store, () => store);
