import { loadDraft, clearDraft, draftSavedAt } from '@/hooks/useDraftRecovery';

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
  dinislam_admin_task_: {
    place: 'Accueil › À FAIRE', noun: 'tâche pas encore ajoutée', route: '/', adminOnly: true,
    labelOf: (d) => text(d),
  },
  messaging_student_: {
    place: 'Messagerie', noun: 'message pas encore envoyé', route: '/?open=messages', perUser: true,
    labelOf: (d) => text(d),
  },
  // Formulaires de création de l'enseignante (outil commun useCreationDraft, 2026-10-13)
  dinislam_sched_notif: {
    place: 'Monitoring › Notifications programmées', noun: 'notification programmée', route: '/monitoring', adminOnly: true,
    labelOf: (d) => text((d as { message?: string } | null)?.message),
  },
  dinislam_school_holiday: {
    place: 'Monitoring › Vacances scolaires', noun: 'période de vacances', route: '/monitoring', adminOnly: true,
    labelOf: (d) => text((d as { label?: string } | null)?.label),
  },
  dinislam_version: {
    place: 'Monitoring › Version', noun: 'nouvelle version', route: '/monitoring?tab=version', adminOnly: true,
    labelOf: (d) => { const v = d as { version_number?: string; label?: string } | null; return text(v?.label) || text(v?.version_number); },
  },
  dinislam_admin_new_msg: {
    place: 'Messagerie › Nouveau message', noun: 'message pas encore envoyé', route: '/?open=messages', adminOnly: true,
    labelOf: (d) => text((d as { text?: string } | null)?.text),
  },
  dinislam_admin_group_msg: {
    place: 'Messagerie › Message à plusieurs élèves', noun: 'message pas encore envoyé', route: '/?open=messages', adminOnly: true,
    labelOf: (d) => text((d as { text?: string } | null)?.text),
  },
  dinislam_admin_reply_: {
    place: 'Messagerie › Réponse à un élève', noun: 'réponse pas encore envoyée', route: '/?open=messages', adminOnly: true,
    labelOf: (d) => text(d),
  },
  dinislam_student_group: {
    place: 'Bouclier › Élèves › Groupes', noun: 'nouveau groupe', route: '/?admin=eleves', adminOnly: true,
    labelOf: (d) => text((d as { name?: string } | null)?.name),
  },
  dinislam_allah_name: {
    place: 'Tableau de bord › 99 Noms d\'Allah', noun: 'nouveau nom', route: '/admin?section=allah-names-manage', adminOnly: true,
    labelOf: (d) => { const v = d as { nameFr?: string; nameAr?: string } | null; return text(v?.nameFr) || text(v?.nameAr); },
  },
  dinislam_invocation: {
    place: 'Tableau de bord › Invocations', noun: 'nouvelle invocation', route: '/admin?section=invocations-manage', adminOnly: true,
    labelOf: (d) => { const v = d as { title?: string; titleAr?: string } | null; return text(v?.title) || text(v?.titleAr); },
  },
  dinislam_module_card_: {
    place: 'Tableau de bord › carte d\'un module', noun: 'nouvelle carte', route: '/admin', adminOnly: true,
    labelOf: (d) => {
      const v = d as { title?: string; titleAr?: string; module?: string } | null;
      const t = text(v?.title) || text(v?.titleAr);
      return t && text(v?.module) ? `${t} (module ${text(v?.module)})` : t;
    },
  },
  dinislam_flashcard_: {
    place: 'Tableau de bord › carte d\'un module › Flashcards', noun: 'flashcard pas encore ajoutée', route: '/admin', adminOnly: true,
    labelOf: (d) => {
      const v = d as { front?: string; arabic?: string; card?: string } | null;
      const t = text(v?.front) || text(v?.arabic);
      return t && text(v?.card) ? `${t} (carte ${text(v?.card)})` : t;
    },
  },
  dinislam_dynamic_card: {
    place: 'Tableau de bord', noun: 'nouvelle carte', route: '/admin', adminOnly: true,
    labelOf: (d) => text((d as { title?: string } | null)?.title),
  },
  dinislam_ramadan_quiz_: {
    place: 'Tableau de bord › Ramadan › quiz d\'un jour', noun: 'questions de quiz', route: '/admin?section=ramadan-manage', adminOnly: true,
    labelOf: (d) => {
      const qs = (d as { questions?: { question?: string }[] } | null)?.questions ?? [];
      return qs.map((q) => text(q.question)).filter(Boolean).join(' · ');
    },
  },
  dinislam_moon_assistant: {
    place: 'Assistant 🌙 de l\'enseignante', noun: 'question pas encore envoyée', route: '/', adminOnly: true,
    labelOf: (d) => text(d),
  },
};

export interface PendingDraft {
  /** Clé complète (sans le préfixe draft_) */
  key: string;
  label: string;
  def: DraftDef;
  /** Dernière modification (millisecondes), null si inconnue */
  savedAt: number | null;
}

/** Définition d'une clé de brouillon (clé exacte ou préfixe se terminant par « _ »). */
export function draftDefFor(key: string): DraftDef | null {
  if (DRAFT_DEFS[key]) return DRAFT_DEFS[key];
  const prefix = Object.keys(DRAFT_DEFS).find(k => k.endsWith('_') && key.startsWith(k));
  return prefix ? DRAFT_DEFS[prefix] : null;
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
    out.push({ key, label, def, savedAt: draftSavedAt(key) });
  }
  return out;
}

/** Un brouillon de cet appareil existe pour cette clé (clé exacte, ou toute clé qui commence par un préfixe se terminant par « _ »). */
export function hasDraft(keyOrPrefix: string): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('draft_')) continue;
      const key = k.slice(6);
      const match = keyOrPrefix.endsWith('_') ? key.startsWith(keyOrPrefix) : key === keyOrPrefix;
      if (!match) continue;
      const def = draftDefFor(key);
      if (def ? !!def.labelOf(loadDraft<unknown>(key)) : true) return true;
    }
  } catch { /* stockage indisponible */ }
  return false;
}

/** « Effacer » un brouillon : il part dans la corbeille (Paramètres), jamais supprimé directement. */
export async function trashDraft(userId: string, d: PendingDraft): Promise<boolean> {
  // Chargé à la demande : la corbeille a besoin de la base, le reste de ce fichier non
  const { moveToTrash } = await import('@/lib/trash');
  const ok = await moveToTrash(userId, 'draft', d.key, `Brouillon — ${d.def.noun} « ${d.label.slice(0, 120)} »`, { key: d.key, data: loadDraft(d.key) });
  if (ok) clearDraft(d.key);
  return ok;
}

/** Brouillon plus vieux que ça : rangé tout seul dans la corbeille à l'ouverture de l'appli (idée C, 2026-10-16). */
export const DRAFT_MAX_AGE_DAYS = 30;
const inTrashing = new Set<string>();

/** Range dans la corbeille les brouillons de l'utilisateur non modifiés depuis 30 jours. Rend le nombre rangé. */
export async function trashOldDrafts(userId: string, isAdmin: boolean): Promise<number> {
  const limit = Date.now() - DRAFT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const old = scanPendingDrafts(userId, isAdmin).filter(d => d.savedAt !== null && d.savedAt < limit && !inTrashing.has(d.key));
  let n = 0;
  for (const d of old) {
    inTrashing.add(d.key);
    try { if (await trashDraft(userId, d)) n++; } finally { inTrashing.delete(d.key); }
  }
  return n;
}

/** « Continuer » : l'écran concerné reprend le brouillon directement, sans reposer la question. */
const RESUME_KEY = 'draft_resume_request';
/** Prévient un écran déjà ouvert (même page) qu'il doit reprendre son brouillon. */
export const DRAFT_RESUME_EVENT = 'dinislam:draft-resume';
export function requestDraftResume(key: string) {
  try { sessionStorage.setItem(RESUME_KEY, key); } catch { /* stockage indisponible */ }
  window.dispatchEvent(new Event(DRAFT_RESUME_EVENT));
}
/** Comme takeDraftResume, pour une famille de clés (ex. « dinislam_admin_reply_ » + id de l'élève) : rend la clé complète. */
export function takeDraftResumePrefix(prefix: string): string | null {
  try {
    const k = sessionStorage.getItem(RESUME_KEY);
    if (k && k.startsWith(prefix)) { sessionStorage.removeItem(RESUME_KEY); return k; }
  } catch { /* stockage indisponible */ }
  return null;
}
export function takeDraftResume(key: string): boolean {
  try {
    if (sessionStorage.getItem(RESUME_KEY) === key) { sessionStorage.removeItem(RESUME_KEY); return true; }
  } catch { /* stockage indisponible */ }
  return false;
}
