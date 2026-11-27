/**
 * 🤲 « Besoin d'Allah » (carte 99 noms d'Allah, 27/11) : logique sans écran, testée (`besoinAllah.test.ts`).
 * - Les émotions et leurs noms viennent de la base (`besoins_allah` + `besoins_allah_noms`), sinon de la copie
 *   de secours `src/data/besoinsAllah.ts` (hors ligne, 1re ouverture).
 * - L'histoire animée = accueil → les noms un par un → fin (verset ou hadith).
 * - En haut de l'histoire : un chiffre qui descend de 99 à 0 et une couleur qui glisse de l'orange-rouge (inquiet)
 *   au vert-jaune puis au bleu-vert (apaisé).
 */
import { BESOINS_ALLAH, type BesoinAllah, type NomBesoin } from '@/data/besoinsAllah';

/** Une émotion telle que l'écran l'utilise (base ou copie de secours) */
export interface Besoin extends Omit<BesoinAllah, 'noms'> {
  id: string;
  position: number;
  noms: NomBesoinVu[];
}
export interface NomBesoinVu extends NomBesoin {
  id: string;
  position: number;
  /** id dans `allah_names` (lien vers la fiche du nom) ; null = hors des 99 de l'appli */
  nom_id: number | null;
}

/** Lignes brutes de la base */
export interface LigneBesoin {
  id: string; cle: string; emoji: string; titre: string; couleur: string; accroche: string; accroche_doree: string;
  conseil: string | null; fin_arabe: string | null; fin_phonetique: string | null; fin_traduction: string | null; fin_source: string | null;
  a_verifier: boolean | null; note: string | null; position: number;
}
export interface LigneNomBesoin {
  id: string; besoin_id: string; nom_id: number | null; arabe: string; phonetique: string; sens: string; attestation: string | null;
  a_verifier: boolean | null; note: string | null; position: number;
}
export interface NomBase { id: number; transliteration: string | null; name_arabic?: string; name_french?: string; display_order?: number | null }

/** Copie de secours mise au même format que la base (ids stables « secours:<clé> ») */
export function besoinsDeSecours(nomsBase: NomBase[] = []): Besoin[] {
  return BESOINS_ALLAH.map((b, i) => ({
    ...b,
    id: `secours:${b.cle}`,
    position: (i + 1) * 10,
    noms: b.noms.map((n, j) => ({
      ...n,
      id: `secours:${b.cle}:${j}`,
      position: (j + 1) * 10,
      nom_id: n.base ? (nomsBase.find((x) => x.transliteration === n.base)?.id ?? null) : null,
    })),
  }));
}

/** Assemble les lignes de la base ; aucune émotion en base → copie de secours (jamais une grille vide) */
export function assemblerBesoins(lignes: LigneBesoin[] | undefined, noms: LigneNomBesoin[] | undefined, nomsBase: NomBase[] = []): Besoin[] {
  if (!lignes || lignes.length === 0) return besoinsDeSecours(nomsBase);
  return [...lignes].sort((a, b) => a.position - b.position).map((l) => ({
    id: l.id, cle: l.cle, emoji: l.emoji, titre: l.titre, couleur: l.couleur, position: l.position,
    accroche: l.accroche, accroche_doree: l.accroche_doree, conseil: l.conseil ?? '',
    fin_arabe: l.fin_arabe ?? '', fin_phonetique: l.fin_phonetique ?? '', fin_traduction: l.fin_traduction ?? '', fin_source: l.fin_source ?? '',
    a_verifier: !!l.a_verifier, note: l.note ?? undefined,
    noms: (noms || []).filter((n) => n.besoin_id === l.id).sort((a, b) => a.position - b.position).map((n) => ({
      id: n.id, position: n.position, nom_id: n.nom_id, arabe: n.arabe, phonetique: n.phonetique, sens: n.sens,
      attestation: n.attestation ?? '', a_verifier: !!n.a_verifier, note: n.note ?? undefined,
    })),
  }));
}

/** Une émotion ou un de ses noms est « à vérifier » (pastille ⚠️ côté enseignante) */
export const besoinAVerifier = (b: Besoin) => !!b.a_verifier || b.noms.some((n) => n.a_verifier);

// ───────────── Histoire animée ─────────────

export type Ecran =
  | { type: 'accueil' }
  | { type: 'nom'; nom: NomBesoinVu; numero: number; total: number }
  | { type: 'fin' };

/** Ordre des écrans : accueil, puis chaque nom (numéro « 5/7 »), puis la fin */
export function ecransHistoire(b: Pick<Besoin, 'noms'>): Ecran[] {
  const total = b.noms.length;
  return [
    { type: 'accueil' },
    ...b.noms.map((nom, i): Ecran => ({ type: 'nom', nom, numero: i + 1, total })),
    { type: 'fin' },
  ];
}

/** Avancée de 0 (accueil) à 1 (fin) */
export function avancee(index: number, nbEcrans: number): number {
  if (nbEcrans <= 1) return 1;
  return Math.min(1, Math.max(0, index / (nbEcrans - 1)));
}

/** Chiffre du haut : 99 à l'accueil, 0 à la fin, il descend régulièrement entre les deux */
export function compteARebours(index: number, nbEcrans: number): number {
  return Math.round(99 * (1 - avancee(index, nbEcrans)));
}

/** Tirets de la barre : un par écran, remplis jusqu'à l'écran en cours (compris) */
export function tiretsRemplis(index: number, nbEcrans: number): boolean[] {
  return Array.from({ length: nbEcrans }, (_, i) => i <= index);
}

type Rgb = [number, number, number];
/** Couleurs de l'histoire : orange-rouge (inquiet) → vert-jaune → bleu-vert (apaisé) */
export const PALIERS_COULEUR: { t: number; rgb: Rgb }[] = [
  { t: 0, rgb: [242, 92, 59] },     // #f25c3b orange-rouge
  { t: 0.5, rgb: [190, 220, 70] },  // #bedc46 vert-jaune
  { t: 1, rgb: [45, 212, 191] },    // #2dd4bf bleu-vert
];

const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

/** Couleur (#rrggbb) pour une avancée de 0 à 1, glissement doux entre les paliers */
export function couleurAvancee(t: number): string {
  const x = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0));
  let i = 0;
  while (i < PALIERS_COULEUR.length - 2 && x > PALIERS_COULEUR[i + 1].t) i++;
  const a = PALIERS_COULEUR[i], b = PALIERS_COULEUR[i + 1];
  const k = (x - a.t) / (b.t - a.t || 1);
  const c = a.rgb.map((v, j) => v + (b.rgb[j] - v) * k);
  return `#${hex(c[0])}${hex(c[1])}${hex(c[2])}`;
}

/** Durée d'un écran en lecture automatique (ms) : plus long pour la fin (verset à lire) */
export function dureeEcran(e: Ecran): number {
  if (e.type === 'accueil') return 5000;
  if (e.type === 'fin') return 10000;
  return 6000;
}

/** Ce que dit la voix (option) : en français seulement, jamais le Coran lu par une voix de synthèse */
export function texteVoix(e: Ecran, b: Pick<Besoin, 'accroche' | 'accroche_doree' | 'fin_traduction'>): string {
  if (e.type === 'accueil') return `${b.accroche} ${b.accroche_doree}`;
  if (e.type === 'nom') return `${e.nom.phonetique}. ${e.nom.sens}.`;
  return b.fin_traduction;
}

/**
 * Taille du nom arabe dans le cercle (part de la largeur du cercle) : plus le mot le plus long a de lettres, plus c'est petit,
 * pour qu'un mot ne soit JAMAIS coupé en deux (les signes de voyelles ne comptent pas).
 */
export function facteurPolice(arabe: string): number {
  const lettres = arabe.replace(/[\u064B-\u065F\u0670\u0640]/g, '').split(/\s+/).reduce((m, mot) => Math.max(m, [...mot].length), 1);
  return Math.round(Math.min(0.24, 1.1 / lettres) * 1000) / 1000;
}

/** Petites capitales du haut de l'histoire (« CULPABILITÉ ») */
export const enCapitales = (s: string) => s.toLocaleUpperCase('fr-FR');

// ───────────── ❤️ Favoris (gardés sur l'appareil) ─────────────

const CLE_FAVORIS = 'dinislam_besoin_allah_favoris';

export function lireFavoris(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_FAVORIS) || '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}

export function basculerFavori(cle: string): string[] {
  const l = lireFavoris();
  const n = l.includes(cle) ? l.filter((x) => x !== cle) : [...l, cle];
  try { localStorage.setItem(CLE_FAVORIS, JSON.stringify(n)); } catch { /* stockage indisponible : le cœur reste pour cette visite */ }
  return n;
}

/** Les favoris d'abord (dans l'ordre choisi par l'enseignante), puis les autres */
export function trierAvecFavoris<T extends { cle: string }>(l: T[], favoris: string[]): T[] {
  return [...l.filter((b) => favoris.includes(b.cle)), ...l.filter((b) => !favoris.includes(b.cle))];
}

/** Une couleur claire pour le texte posé sur la couleur de l'émotion (lisible de jour comme de nuit) */
export function texteSur(couleur: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(couleur.trim());
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? '#1f2937' : '#ffffff';
}
