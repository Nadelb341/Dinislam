/**
 * 👨‍👩‍👧 Espace parents (2026-10-28, choix de Nadia) :
 *  - sur le compte d'un enfant (moins de 18 ans, ou allumé par Nadia) : ses parents l'ouvrent avec LEUR code à 6 chiffres
 *    (jusqu'à 2 codes, ex. Maman et Papa), indépendant du mot de passe de l'appli ;
 *  - sur le compte d'un élève adulte relié à ses enfants : ses enfants, triés par prénom, avec le même code que chez l'enfant.
 * Le code n'est jamais lu par l'appli : il est vérifié par la base (fonctions parent_*). Une fois entré, il reste ouvert
 * 15 minutes sur l'appareil (gardé en mémoire seulement, jamais enregistré).
 */
import { childAge } from '@/hooks/useParentLock';

const OUVERT_MINUTES = 15;
const ouverts = new Map<string, { code: string; label: string; until: number }>();

export function memoriserCode(childId: string, code: string, label: string) {
  ouverts.set(childId, { code, label, until: Date.now() + OUVERT_MINUTES * 60000 });
}
export function codeOuvert(childId: string): { code: string; label: string } | null {
  const o = ouverts.get(childId);
  if (!o || o.until < Date.now()) { ouverts.delete(childId); return null; }
  return { code: o.code, label: o.label };
}
export const oublierCodes = () => ouverts.clear();

export type ModeEspace = 'auto' | 'on' | 'off';

/** L'Espace parents existe sur ce compte : moins de 18 ans (mode auto) ou allumé par Nadia */
export function espaceParentsActif(profile: { date_of_birth?: string | null; age?: number | null; espace_parents?: string | null } | null): boolean {
  if (!profile) return false;
  if (profile.espace_parents === 'on') return true;
  if (profile.espace_parents === 'off') return false;
  const a = childAge(profile);
  return a !== null && a < 18;
}

/** Élève adulte à qui on demande s'il a des enfants élèves (plus de 20 ans) */
export function estAdulteParentPossible(profile: { date_of_birth?: string | null; age?: number | null } | null): boolean {
  const a = childAge(profile);
  return a !== null && a >= 20;
}

export const prenomDe = (full: string | null | undefined) => (full || '').trim().split(/\s+/)[0] || 'Élève';

/** Libellés proposés pour un code */
export const LABELS_CODE = ['Maman', 'Papa'];
