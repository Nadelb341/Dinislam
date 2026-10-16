/** Prévient les pastilles 📝 et la liste « Mes brouillons » qu'un brouillon a été créé, modifié ou effacé. */
export const DRAFTS_CHANGED_EVENT = 'dinislam:drafts-changed';

function notifyDraftsChanged() {
  try { window.dispatchEvent(new Event(DRAFTS_CHANGED_EVENT)); } catch { /* hors navigateur */ }
}

export function saveDraft<T>(key: string, data: T): void {
  try {
    const raw = JSON.stringify(data);
    // Même contenu : rien ne change (la date du brouillon reste celle de la dernière vraie modification)
    if (localStorage.getItem(`draft_${key}`) === raw) return;
    localStorage.setItem(`draft_${key}`, raw);
    localStorage.setItem(`draftsaved_${key}`, String(Date.now()));
    notifyDraftsChanged();
  } catch { /* stockage indisponible (navigation privée) : brouillon non sauvegardé */ }
}

export function loadDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`draft_${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  try {
    const had = localStorage.getItem(`draft_${key}`) !== null;
    localStorage.removeItem(`draft_${key}`);
    localStorage.removeItem(`draftsaved_${key}`);
    if (had) notifyDraftsChanged();
  } catch { /* stockage indisponible */ }
}

/**
 * Date de la dernière modification du brouillon (millisecondes).
 * Brouillon d'avant le 2026-10-16 (sans date) : la date est posée maintenant, le délai de 30 jours part d'aujourd'hui.
 */
export function draftSavedAt(key: string): number | null {
  try {
    if (localStorage.getItem(`draft_${key}`) === null) return null;
    const raw = localStorage.getItem(`draftsaved_${key}`);
    const t = raw ? Number(raw) : NaN;
    if (Number.isFinite(t) && t > 0) return t;
    const now = Date.now();
    localStorage.setItem(`draftsaved_${key}`, String(now));
    return now;
  } catch {
    return null;
  }
}
