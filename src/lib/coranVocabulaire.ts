import type { Acces, Mode } from '@/lib/cartesAcces';

/**
 * 📖 Coran › « Vocabulaire du Coran » (Nadia, 2026-11-26) : sous-cartes (une par PDF de Nadia) et sous-sous-cartes
 * (une par partie du sommaire, chacune avec son PDF). Table `coran_vocabulaire` (migration 20261126150000).
 * « Afficher à » d'une sous-carte : mêmes 3 choix que « Qui voit » des cartes (tous / certains / personne),
 * mêmes colonnes que les onglets de l'Alphabet (mode + group_ids + user_ids), même fenêtre `ChoixQuiVoit`.
 * Ce que voit un élève est filtré par la base (fonction `coran_vocabulaire_visible` + RLS) : une partie se voit
 * seulement si sa sous-carte se voit. L'enseignante voit tout.
 */
export interface CarteVocab {
  id: string;
  parent_id: string | null;
  cle: string | null;
  titre: string;
  emoji: string | null;
  couleur: string | null;
  pdf_url: string | null;
  page_debut: number | null;
  page_fin: number | null;
  position: number;
  mode: Mode;
  group_ids: string[];
  user_ids: string[];
}

export const accesVocab = (c: Pick<CarteVocab, 'mode' | 'group_ids' | 'user_ids'>): Acces =>
  ({ mode: c.mode || 'tous', groupes: c.group_ids || [], eleves: c.user_ids || [] });

/** Enfants d'une carte (null = les sous-cartes du haut), dans l'ordre choisi par l'enseignante */
export const enfantsDe = (toutes: CarteVocab[], parentId: string | null) =>
  toutes.filter((c) => (c.parent_id ?? null) === parentId).sort((a, b) => a.position - b.position || a.titre.localeCompare(b.titre, 'fr'));

/** Badge de l'enseignante : ce que voient les élèves */
export function badgeVisibilite(c: Pick<CarteVocab, 'mode' | 'group_ids' | 'user_ids'>): { texte: string; classe: string } | null {
  if (c.mode === 'personne') return { texte: '🔒 caché aux élèves', classe: 'bg-slate-800 text-white' };
  if (c.mode === 'certains') {
    const n = (c.group_ids?.length || 0) + (c.user_ids?.length || 0);
    return { texte: `🎯 certains (${n})`, classe: 'bg-amber-500 text-white' };
  }
  return null;
}

/** « p. 3 à 21 » ou « p. 7 » (pages du PDF entier) */
export function textePages(c: Pick<CarteVocab, 'page_debut' | 'page_fin'>): string {
  const a = c.page_debut, b = c.page_fin;
  if (!a) return '';
  if (!b || b === a) return `p. ${a}`;
  return `p. ${a} à ${b}`;
}

export const cibleZones = (id: string) => `coran-vocab:${id}`;

/**
 * 📑 Sous-sommaire (2026-11-26) : les chapitres d'une partie sont ses enfants. Leur `page_debut` = la page
 * DANS LE FICHIER DE LA PARTIE (1 = première page du fichier), pas dans le livre entier.
 * Lettre affichée devant un chapitre : A, B, C… d'après son rang (puis 27, 28… au-delà de Z).
 */
export const lettreChapitre = (rang: number) => (rang >= 0 && rang < 26 ? String.fromCharCode(65 + rang) : String(rang + 1));

/** Page de départ lue dans l'adresse (`vpg`) : un entier ≥ 1, sinon rien */
export function pageDeLAdresse(v: string | null): number | null {
  if (!v || !/^\d{1,4}$/.test(v)) return null;
  const n = Number(v);
  return n >= 1 ? n : null;
}
