import { loadDraft } from '@/hooks/useDraftRecovery';

/**
 * Actions inachevées rappelées DÈS L'OUVERTURE de l'appli (règle globale du 2026-09-26,
 * recopiée de l'Agenda le 2026-09-30 pour les brouillons de CRÉATION).
 *
 * Chaque brouillon est stocké dans localStorage sous `draft_<clé>` (voir useDraftRecovery).
 * ⚠️ Tout nouveau formulaire de création qui enregistre un brouillon DOIT être ajouté ici,
 * sinon il n'apparaîtra pas dans le message d'ouverture.
 * Une clé qui se termine par « _ » est un préfixe (clé suivie de l'identifiant de l'utilisateur).
 */
export interface DraftDef {
  /** Où c'est dans l'appli */
  place: string;
  /** Ce que c'est */
  noun: string;
  /** Page à ouvrir pour continuer */
  route: string;
  /** Réservé à l'admin (ex. création de devoir) */
  adminOnly?: boolean;
  /** Brouillon lié à un compte : la clé se termine par l'id de l'utilisateur connecté */
  perUser?: boolean;
  /** Texte qui résume le brouillon (vide = brouillon vide, ignoré) */
  labelOf: (data: unknown) => string;
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export const DRAFT_DEFS: Record<string, DraftDef> = {
  dinislam_homework: {
    place: 'Admin › Devoirs', noun: 'nouveau devoir', route: '/admin?section=homework', adminOnly: true,
    labelOf: (d) => text((d as { titre?: string } | null)?.titre),
  },
  messaging_student_: {
    place: 'Messagerie', noun: 'message pas encore envoyé', route: '/?open=messages', perUser: true,
    labelOf: (d) => text(d),
  },
};

export interface PendingDraft {
  /** Clé complète (sans le préfixe draft_) */
  key: string;
  label: string;
  def: DraftDef;
}

function findDef(key: string, userId: string): DraftDef | null {
  if (DRAFT_DEFS[key] && !DRAFT_DEFS[key].perUser) return DRAFT_DEFS[key];
  const prefix = Object.keys(DRAFT_DEFS).find(k => k.endsWith('_') && key.startsWith(k));
  if (!prefix) return null;
  const def = DRAFT_DEFS[prefix];
  // Brouillon d'un autre compte sur le même appareil : jamais montré
  if (def.perUser && key !== prefix + userId) return null;
  return def;
}

/** Brouillons présents sur cet appareil pour l'utilisateur connecté. */
export function scanPendingDrafts(userId: string, isAdmin: boolean): PendingDraft[] {
  const out: PendingDraft[] = [];
  let keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('draft_')) keys.push(k.slice(6));
    }
  } catch {
    return out;
  }
  keys = keys.filter(k => !k.startsWith('edit_undo_') && !k.startsWith('editmeta_'));
  for (const key of keys) {
    const def = findDef(key, userId);
    if (!def || (def.adminOnly && !isAdmin)) continue;
    const label = def.labelOf(loadDraft<unknown>(key));
    if (!label) continue;
    out.push({ key, label, def });
  }
  return out;
}

/** « Continuer » : l'écran concerné reprend le brouillon directement, sans reposer la question. */
const RESUME_KEY = 'draft_resume_request';
export function requestDraftResume(key: string) {
  try { sessionStorage.setItem(RESUME_KEY, key); } catch { /* stockage indisponible */ }
}
export function takeDraftResume(key: string): boolean {
  try {
    if (sessionStorage.getItem(RESUME_KEY) === key) { sessionStorage.removeItem(RESUME_KEY); return true; }
  } catch { /* stockage indisponible */ }
  return false;
}
