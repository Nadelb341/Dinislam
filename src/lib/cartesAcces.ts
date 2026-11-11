/**
 * 🗂️ « Qui voit quoi » (Nadia, 2026-11-11 : maquette A + ses 10 idées).
 * LA règle unique « cette carte est-elle ouverte à cet élève ? » + les changements possibles (ouvrir/fermer
 * à un groupe, à un élève, à tout le monde) + le texte du journal. Fonctions pures, testées (cartesAcces.test.ts).
 * Même règle côté base : `carte_visible_pour` (migration 20261111120000_qui_voit_quoi.sql) — à changer ENSEMBLE.
 *
 * Modèle (inchangé en base, compatible avec les anciennes versions de l'appli) :
 * - 🌍 tout le monde : learning_modules.is_active = true et (pas de ligne module_visibility OU type 'all') ;
 * - 🔒 personne     : is_active = false et (pas de ligne OU type 'all') ;
 * - 🎯 certains     : type 'users' | 'groups' | 'mixed' → ouverte si l'élève est dans user_ids OU dans un groupe de group_ids.
 * - ⏰ en plus, la carte n'est ouverte qu'entre ouverte_du et ouverte_jusquau (si remplis). L'admin voit toujours tout.
 */

export interface CarteBase {
  is_active: boolean | null;
  ouverte_du?: string | null;
  ouverte_jusquau?: string | null;
}
export interface Visibilite { visibility_type: string; user_ids: string[] | null; group_ids: string[] | null }
export type Mode = 'tous' | 'certains' | 'personne';

/** État simple d'une carte, celui que l'enseignante règle */
export interface Acces { mode: Mode; groupes: string[]; eleves: string[] }

export function accesDe(m: CarteBase, v: Visibilite | undefined | null): Acces {
  if (v && v.visibility_type !== 'all') {
    const groupes = [...(v.group_ids || [])], eleves = [...(v.user_ids || [])];
    return { mode: groupes.length || eleves.length ? 'certains' : 'personne', groupes, eleves };
  }
  return { mode: m.is_active ? 'tous' : 'personne', groupes: [], eleves: [] };
}

/** La carte est-elle dans sa période d'ouverture ? (pas de date = toujours) */
export function dansLaPeriode(m: CarteBase, maintenant = Date.now()): boolean {
  if (m.ouverte_du && Date.parse(m.ouverte_du) > maintenant) return false;
  if (m.ouverte_jusquau && Date.parse(m.ouverte_jusquau) <= maintenant) return false;
  return true;
}

export type Raison = 'tous' | 'groupe' | 'lui';
/** Pourquoi cet élève voit la carte (null = il ne la voit pas) — sans tenir compte des dates */
export function raisonAcces(a: Acces, eleveId: string, groupesDeLEleve: string[]): Raison | null {
  if (a.mode === 'tous') return 'tous';
  if (a.mode === 'personne') return null;
  if (a.eleves.includes(eleveId)) return 'lui';
  if (groupesDeLEleve.some((g) => a.groupes.includes(g))) return 'groupe';
  return null;
}

export function carteOuverte(m: CarteBase, v: Visibilite | undefined | null, userId: string | undefined, mesGroupes: string[], isAdmin: boolean, maintenant = Date.now()): boolean {
  if (isAdmin) return true;
  if (!dansLaPeriode(m, maintenant)) return false;
  return raisonAcces(accesDe(m, v), userId ?? '', mesGroupes) !== null;
}

export interface Eleve { id: string; nom: string; groupes: string[] }
/** Élèves qui voient la carte (dates comprises) */
export function elevesQuiVoient(m: CarteBase, a: Acces, eleves: Eleve[], maintenant = Date.now()): Set<string> {
  if (!dansLaPeriode(m, maintenant)) return new Set();
  return new Set(eleves.filter((e) => raisonAcces(a, e.id, e.groupes) !== null).map((e) => e.id));
}

// ——— Changements ———
const sans = (l: string[], x: string) => l.filter((y) => y !== x);
const avec = (l: string[], x: string) => (l.includes(x) ? l : [...l, x]);
const normaliser = (a: Acces): Acces => (a.mode === 'certains' && !a.groupes.length && !a.eleves.length ? { mode: 'personne', groupes: [], eleves: [] } : a);

export const ouvrirATous = (): Acces => ({ mode: 'tous', groupes: [], eleves: [] });
export const fermerATous = (): Acces => ({ mode: 'personne', groupes: [], eleves: [] });
export function ouvrirAGroupe(a: Acces, g: string): Acces {
  if (a.mode === 'tous') return a;
  return { mode: 'certains', groupes: avec(a.groupes, g), eleves: a.mode === 'certains' ? a.eleves : [] };
}
export function fermerAGroupe(a: Acces, g: string): Acces {
  if (a.mode !== 'certains') return a;
  return normaliser({ ...a, groupes: sans(a.groupes, g) });
}
export function ouvrirAEleve(a: Acces, e: string): Acces {
  if (a.mode === 'tous') return a;
  return { mode: 'certains', groupes: a.mode === 'certains' ? a.groupes : [], eleves: avec(a.eleves, e) };
}
export function fermerAEleve(a: Acces, e: string): Acces {
  if (a.mode !== 'certains') return a;
  return normaliser({ ...a, eleves: sans(a.eleves, e) });
}
/** Carte ouverte à tous → réservée à tous les groupes SAUF un (les élèves sans groupe la perdent aussi) */
export function reserverSauf(tousLesGroupes: string[], g: string): Acces {
  return normaliser({ mode: 'certains', groupes: tousLesGroupes.filter((x) => x !== g), eleves: [] });
}

/** Ce qu'il faut écrire en base pour un état donné */
export function versBase(a: Acces): { is_active: boolean; visibility_type: 'all' | 'users' | 'groups' | 'mixed'; user_ids: string[]; group_ids: string[] } {
  if (a.mode !== 'certains') return { is_active: a.mode === 'tous', visibility_type: 'all', user_ids: [], group_ids: [] };
  const type = a.groupes.length && a.eleves.length ? 'mixed' : a.groupes.length ? 'groups' : 'users';
  return { is_active: false, visibility_type: type, user_ids: a.eleves, group_ids: a.groupes };
}

export const memeAcces = (a: Acces, b: Acces) =>
  a.mode === b.mode && [...a.groupes].sort().join() === [...b.groupes].sort().join() && [...a.eleves].sort().join() === [...b.eleves].sort().join();

/** Ligne du journal (« 🌍 Ouverte à tout le monde », « ➕ Groupe 2 · ➖ Wiam »…) ; '' si rien n'a changé */
export function texteChangement(avant: Acces, apres: Acces, nomGroupe: (id: string) => string, nomEleve: (id: string) => string): string {
  if (memeAcces(avant, apres)) return '';
  if (apres.mode === 'tous') return '🌍 Ouverte à tout le monde';
  if (apres.mode === 'personne') return '🔒 Fermée à tout le monde';
  const bout: string[] = [];
  const gAvant = avant.mode === 'certains' ? avant.groupes : [], eAvant = avant.mode === 'certains' ? avant.eleves : [];
  const plus = [...apres.groupes.filter((g) => !gAvant.includes(g)).map(nomGroupe), ...apres.eleves.filter((e) => !eAvant.includes(e)).map(nomEleve)];
  const moins = [...gAvant.filter((g) => !apres.groupes.includes(g)).map(nomGroupe), ...eAvant.filter((e) => !apres.eleves.includes(e)).map(nomEleve)];
  if (avant.mode === 'tous') bout.push('🎯 Plus ouverte à tout le monde');
  if (plus.length) bout.push(`➕ ${plus.join(', ')}`);
  if (moins.length) bout.push(`➖ ${moins.join(', ')}`);
  return bout.join(' · ');
}

/** Libellé court de la période (« du 18 févr. au 20 mars ») ; '' sans date */
export function textePeriode(m: CarteBase): string {
  const f = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  if (m.ouverte_du && m.ouverte_jusquau) return `du ${f(m.ouverte_du)} au ${f(new Date(Date.parse(m.ouverte_jusquau) - 1).toISOString())}`;
  if (m.ouverte_du) return `à partir du ${f(m.ouverte_du)}`;
  if (m.ouverte_jusquau) return `jusqu'au ${f(new Date(Date.parse(m.ouverte_jusquau) - 1).toISOString())}`;
  return '';
}
