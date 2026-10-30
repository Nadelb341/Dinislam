/**
 * 🔄 Nouvelle version mise en ligne pendant que l'appli est ouverte (2026-10-30) : l'ancienne page cherche un morceau
 * de l'appli qui n'existe plus (« 'text/html' is not a valid JavaScript MIME type », « Failed to fetch dynamically
 * imported module »…). Au lieu du chat qui pleure, l'appli se recharge toute seule sur la nouvelle version (une fois).
 */
const CLE = 'dinislam_rechargement_maj';

export function estErreurMiseAJour(err: unknown): boolean {
  const m = err instanceof Error ? `${err.name} ${err.message}` : String(err ?? '');
  return /not a valid JavaScript MIME type|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk [\w-]+ failed/i.test(m);
}

/** Recharge la page, sauf si on vient déjà de le faire (moins de 30 s) : jamais de boucle */
export function rechargerUneFois(): boolean {
  try {
    const avant = Number(sessionStorage.getItem(CLE) || 0);
    if (Date.now() - avant < 30000) return false;
    sessionStorage.setItem(CLE, String(Date.now()));
  } catch { /* stockage indisponible : on recharge quand même une fois */ }
  window.location.reload();
  return true;
}
