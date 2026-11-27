/**
 * 📿 Carte « Dhikr » (Nadia, 2026-11-27) : toute la logique SANS écran (testée dans dhikr.test.ts).
 * - le compteur du chapelet (plusieurs étapes qui s'enchaînent, tours) et le petit mot d'encouragement ;
 * - le carnet de la semaine (remis à zéro le dimanche soir à minuit, heure de l'appareil ; on garde SEULEMENT la semaine passée) ;
 * - la petite carte « Dhikr du moment » de l'accueil (selon l'heure et ce qui est déjà fait) ;
 * - tout ce qui est gardé sur l'appareil (marche sans réseau).
 */

// ─── Le chapelet ───────────────────────────────────────────────────────────────
export interface EtapeCompte { nombre: number }
export interface EtatCompteur { etape: number; compte: number; tour: number; fini: boolean }
export type Evenement = 'perle' | 'etape' | 'fini' | 'rien';

export const compteurDepart = (): EtatCompteur => ({ etape: 0, compte: 0, tour: 1, fini: false });

/**
 * Une perle de plus. Une étape pleine passe à la suivante toute seule (« etape ») ; la dernière pleine = « fini ».
 * Après « fini », une perle de plus recommence un nouveau tour (Tour : 2…).
 */
export function avancer(e: EtatCompteur, etapes: EtapeCompte[]): { etat: EtatCompteur; evt: Evenement } {
  if (!etapes.length) return { etat: e, evt: 'rien' };
  if (e.fini) return { etat: { etape: 0, compte: 1, tour: e.tour + 1, fini: etapes.length === 1 && etapes[0].nombre <= 1 }, evt: 'perle' };
  const max = Math.max(1, etapes[e.etape]?.nombre ?? 1);
  const compte = e.compte + 1;
  if (compte < max) return { etat: { ...e, compte }, evt: 'perle' };
  if (e.etape < etapes.length - 1) return { etat: { ...e, etape: e.etape + 1, compte: 0 }, evt: 'etape' };
  return { etat: { ...e, compte, fini: true }, evt: 'fini' };
}

/** Une perle en arrière (en cas d'erreur de doigt) */
export function reculer(e: EtatCompteur, etapes: EtapeCompte[]): EtatCompteur {
  if (e.fini) return { ...e, fini: false, compte: Math.max(0, e.compte - 1) };
  if (e.compte > 0) return { ...e, compte: e.compte - 1 };
  if (e.etape > 0) return { ...e, etape: e.etape - 1, compte: Math.max(0, (etapes[e.etape - 1]?.nombre ?? 1) - 1) };
  return e;
}

/** Nombre total de perles déjà comptées (toutes étapes) */
export const totalCompte = (e: EtatCompteur, etapes: EtapeCompte[]) =>
  etapes.slice(0, e.etape).reduce((s, x) => s + x.nombre, 0) + e.compte;

/**
 * 📿 Le chapelet en CERCLE (Nadia, 27/11, 2ᵉ demande) : 11 perles autour du compteur, la perle à compter en doré.
 * 33 = 3 tours de 11 ; 100 = 10 tours (le dernier n'a qu'1 perle) ; 34 = 4 tours ; moins de 11 = autant de perles que de fois.
 */
export const PERLES_PAR_TOUR = 11;

/** Où en est le cercle : nombre de perles du cercle, tour en cours, perle à compter, perles utiles dans ce tour */
export function etatCercle(compte: number, nombre: number) {
  const n = Math.max(1, nombre);
  const parTour = Math.min(PERLES_PAR_TOUR, n);
  const tours = Math.ceil(n / parTour);
  const fini = compte >= n;
  const tour = fini ? tours : Math.floor(compte / parTour) + 1;
  const position = fini ? parTour : compte % parTour;
  const utiles = tour === tours ? n - (tours - 1) * parTour : parTour;
  return { parTour, tours, tour, position, utiles, fini };
}

/** Le petit badge qui change en chemin */
export function encouragement(fait: number, total: number): string {
  if (total <= 1) return fait >= 1 ? 'Qu\'Allah accepte ton dhikr 🤲' : 'Fais ton dhikr avec moi 🤍';
  if (fait <= 0) return 'Fais ton dhikr avec moi 🤍';
  if (fait >= total) return 'Qu\'Allah accepte ton dhikr 🤲';
  const r = fait / total;
  if (r < 0.4) return 'Doucement, avec le cœur 🌿';
  if (r < 0.6) return 'À mi-chemin, continue ✨';
  if (r < 0.85) return `Reste avec moi jusqu'à ${total} 🤍`;
  return 'Tu y es presque 🌟';
}

/** Les chapelets au choix (n° de la page de choix de Nadia ; « Cristal » et « Floral » non retenus) */
export const CHAPELETS = [
  { cle: 'traditionnel', titre: 'Traditionnel' },
  { cle: 'nacre', titre: 'Nacré' },
  { cle: 'emeraude', titre: 'Émeraude' },
  { cle: 'dore', titre: 'Doré' },
  { cle: 'turquoise', titre: 'Turquoise' },
  { cle: 'bois', titre: 'Bois' },
  { cle: 'minimaliste', titre: 'Minimaliste' },
  { cle: 'celeste', titre: 'Céleste' },
] as const;
export type CleChapelet = (typeof CHAPELETS)[number]['cle'];
export const CHAPELET_PAR_DEFAUT: CleChapelet = 'nacre';

/** Mode automatique : temps entre 2 perles (×1 = 1,6 s ; ×0,5 = deux fois plus lent) */
export const intervalleAuto = (vitesse: 0.5 | 1) => (vitesse === 1 ? 1600 : 3200);

// ─── Le temps (heure de l'appareil) ─────────────────────────────────────────────
export const cleJour = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const depuisCle = (k: string) => { const [a, m, j] = k.split('-').map(Number); return new Date(a, m - 1, j); };

/** Lundi 00:00 de la semaine de d (la semaine se termine le dimanche soir à minuit) */
export function lundiDe(d: Date): Date {
  const l = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const ecart = (l.getDay() + 6) % 7; // lundi = 0 … dimanche = 6
  l.setDate(l.getDate() - ecart);
  return l;
}
export const cleSemaine = (d: Date) => cleJour(lundiDe(d));
const semaineSuivante = (k: string) => { const d = depuisCle(k); d.setDate(d.getDate() + 7); return cleJour(d); };

// ─── G · Le carnet ──────────────────────────────────────────────────────────────
export type MomentCarnet = 'matin' | 'soir' | 'reveil' | 'apres_priere' | 'libre' | 'defi';
export interface JourCarnet { total: number; moments: MomentCarnet[] }
export interface SemaineCarnet { semaine: string; jours: Record<string, JourCarnet> }
export interface Carnet { courante: SemaineCarnet; precedente: SemaineCarnet | null }

export const carnetVide = (maintenant: Date): Carnet => ({ courante: { semaine: cleSemaine(maintenant), jours: {} }, precedente: null });

/** Remet le carnet à l'heure : nouvelle semaine → l'ancienne devient « la semaine passée » (seulement si elle est juste avant) */
export function carnetALHeure(c: Carnet | null | undefined, maintenant: Date): Carnet {
  if (!c?.courante?.semaine) return carnetVide(maintenant);
  const s = cleSemaine(maintenant);
  if (c.courante.semaine === s) return c;
  if (c.courante.semaine > s) return carnetVide(maintenant); // horloge de l'appareil revenue en arrière
  if (semaineSuivante(c.courante.semaine) === s) return { courante: { semaine: s, jours: {} }, precedente: c.courante };
  // Plus d'une semaine sans dhikr : la semaine passée était vide
  return { courante: { semaine: s, jours: {} }, precedente: { semaine: cleSemaine(new Date(lundiDe(maintenant).getTime() - 3 * 86400000)), jours: {} } };
}

export function ajouterAuCarnet(c: Carnet | null | undefined, maintenant: Date, moment: MomentCarnet, nombre: number): Carnet {
  const a = carnetALHeure(c, maintenant);
  const k = cleJour(maintenant);
  const j = a.courante.jours[k] ?? { total: 0, moments: [] };
  const moments = j.moments.includes(moment) ? j.moments : [...j.moments, moment];
  return { ...a, courante: { ...a.courante, jours: { ...a.courante.jours, [k]: { total: j.total + Math.max(0, Math.round(nombre)), moments } } } };
}

export const totalSemaine = (s: SemaineCarnet | null) => (s ? Object.values(s.jours).reduce((t, j) => t + j.total, 0) : 0);

/** Jours d'affilée avec au moins un dhikr (jusqu'à aujourd'hui, ou hier si rien encore aujourd'hui) — dans les 2 semaines gardées */
export function serieDeJours(c: Carnet, maintenant: Date): number {
  const jours = { ...(c.precedente?.jours ?? {}), ...c.courante.jours };
  const d = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  if (!(jours[cleJour(d)]?.total > 0)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (jours[cleJour(d)]?.total > 0) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/** Les 7 jours de la semaine courante (lundi → dimanche), pour les petites barres */
export function joursDeLaSemaine(c: Carnet): { cle: string; total: number; moments: MomentCarnet[] }[] {
  const l = depuisCle(c.courante.semaine);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(l); d.setDate(l.getDate() + i);
    const k = cleJour(d);
    return { cle: k, total: c.courante.jours[k]?.total ?? 0, moments: c.courante.jours[k]?.moments ?? [] };
  });
}

// ─── IDÉE 5 · La petite carte « Dhikr du moment » de l'accueil ─────────────────
/** Les 3 dhikr du quotidien proposés de midi à 19 h (clés de la bibliothèque) */
export const QUOTIDIENS = ['apres_priere', 'astaghfirullah', 'subhanallah_wabihamdihi'] as const;
export type CleQuotidien = (typeof QUOTIDIENS)[number];

/** Ce qui est fait AUJOURD'HUI sur cet appareil : clé → heure (ms) */
export interface JourneeDhikr { jour: string; faits: Record<string, number> }

export type Creneau = 'matin' | 'journee' | 'soir';
export const creneauDe = (d: Date): Creneau => (d.getHours() < 12 ? 'matin' : d.getHours() < 19 ? 'journee' : 'soir');

export type CarteDuMoment =
  | { creneau: 'matin' | 'soir'; serie: 'matin' | 'soir'; faite: boolean }
  | { creneau: 'journee'; restants: CleQuotidien[] };

export function dhikrDuMoment(maintenant: Date, journee: JourneeDhikr | null | undefined): CarteDuMoment {
  const j = journee && journee.jour === cleJour(maintenant) ? journee.faits : {};
  const c = creneauDe(maintenant);
  if (c === 'matin') return { creneau: 'matin', serie: 'matin', faite: !!j['serie:matin'] };
  if (c === 'soir') return { creneau: 'soir', serie: 'soir', faite: !!j['serie:soir'] };
  // Un dhikr fait ENTRE midi et 19 h disparaît de la liste
  const midi = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate(), 12).getTime();
  const restants = QUOTIDIENS.filter((k) => { const t = j[`quotidien:${k}`]; return !(t && t >= midi); });
  return { creneau: 'journee', restants };
}

export function marquerJournee(j: JourneeDhikr | null | undefined, maintenant: Date, cle: string): JourneeDhikr {
  const jour = cleJour(maintenant);
  const faits = j && j.jour === jour ? j.faits : {};
  return { jour, faits: { ...faits, [cle]: maintenant.getTime() } };
}

/** Le moment du jour mis en avant dans la bibliothèque (« Matin » brille le matin) */
export function momentEnAvant(d: Date): 'reveil' | 'matin' | 'apres_priere' | 'soir' {
  const h = d.getHours();
  if (h >= 4 && h < 7) return 'reveil';
  if (h >= 7 && h < 12) return 'matin';
  if (h >= 12 && h < 19) return 'apres_priere';
  return 'soir';
}

// ─── C · Où en est la série du jour (gardé sur l'appareil jusqu'à la fin de la journée) ───
export interface AvanceeSerie { jour: string; faits: string[]; finie: boolean }
export function avanceeDuJour(a: AvanceeSerie | null | undefined, maintenant: Date): AvanceeSerie {
  return a && a.jour === cleJour(maintenant) ? a : { jour: cleJour(maintenant), faits: [], finie: false };
}
/** Le 1er geste pas encore fait (dans l'ordre), ou -1 si tous sont faits */
export const prochainGeste = (ids: string[], faits: string[]) => ids.findIndex((id) => !faits.includes(id));

// ─── Gardé sur l'appareil (try/catch : stockage parfois bloqué) ─────────────────
export function lireLocal<T>(cle: string): T | null {
  try { const v = localStorage.getItem(cle); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
export const EVT_DHIKR = 'dinislam:dhikr-local';
export function ecrireLocal(cle: string, v: unknown) {
  try { localStorage.setItem(cle, JSON.stringify(v)); } catch { /* stockage indisponible */ }
  try { window.dispatchEvent(new CustomEvent(EVT_DHIKR, { detail: cle })); } catch { /* hors navigateur */ }
}
export const cleCarnet = (uid: string) => `dinislam_dhikr_carnet_${uid}`;
export const cleJournee = (uid: string) => `dinislam_dhikr_journee_${uid}`;
export const cleAvancee = (uid: string, serie: string) => `dinislam_dhikr_serie_${serie}_${uid}`;
export const CLE_REGLAGES = 'dinislam_dhikr_reglages';
export interface ReglagesChapelet { chapelet: CleChapelet; mode: 'rythme' | 'auto'; vitesse: 0.5 | 1 }
export const REGLAGES_DEFAUT: ReglagesChapelet = { chapelet: CHAPELET_PAR_DEFAUT, mode: 'rythme', vitesse: 1 };
export function lireReglages(): ReglagesChapelet {
  const r = lireLocal<Partial<ReglagesChapelet>>(CLE_REGLAGES) ?? {};
  return {
    chapelet: CHAPELETS.some((c) => c.cle === r.chapelet) ? (r.chapelet as CleChapelet) : REGLAGES_DEFAUT.chapelet,
    mode: r.mode === 'auto' ? 'auto' : 'rythme',
    vitesse: r.vitesse === 0.5 ? 0.5 : 1,
  };
}
