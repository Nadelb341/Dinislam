export function saveDraft<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`draft_${key}`, JSON.stringify(data));
  } catch {}
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
  localStorage.removeItem(`draft_${key}`);
}
