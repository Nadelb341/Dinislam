/**
 * 🔄 Nouvelle version mise en ligne pendant que l'appli est ouverte (2026-10-30) : l'ancienne page cherche un morceau
 * de l'appli qui n'existe plus (« 'text/html' is not a valid JavaScript MIME type », « Failed to fetch dynamically
 * imported module », et sur iPhone « undefined is not an object (evaluating 'e._result.default') » : plantage de Wiam
 * le 18/11 sur /invocations pendant une mise en ligne)…). Au lieu du chat qui pleure, l'appli se recharge toute seule sur la nouvelle version (une fois).
 */
const CLE = 'dinislam_rechargement_maj';

export function estErreurMiseAJour(err: unknown): boolean {
  const m = err instanceof Error ? `${err.name} ${err.message}` : String(err ?? '');
  return /not a valid JavaScript MIME type|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk [\w-]+ failed|_result\.default|reading 'default'|Element type is invalid.*lazy/i.test(m);
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

/**
 * 🛠️ Réparer la mémoire de l'appli sur cet appareil (22/11, compte Test 3 bloqué sur « Nouvelle version… ») :
 * on oublie les fichiers de l'appli gardés en mémoire (JAMAIS les pages du Coran, les vidéos, les images ni les données)
 * et le service worker, puis on recharge : tout est retéléchargé proprement. Une fois toutes les 5 minutes au plus.
 */
const CLE_REPARE = 'dinislam_reparation_maj';
export function peutReparer(): boolean {
  try { return Date.now() - Number(localStorage.getItem(CLE_REPARE) || 0) > 5 * 60_000; } catch { return true; }
}
export async function reparerEtRecharger() {
  // Sans réseau : surtout ne rien effacer (l'appli doit rester utilisable hors ligne), on recharge seulement
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { window.location.reload(); return; }
  try { localStorage.setItem(CLE_REPARE, String(Date.now())); } catch { /* stockage indisponible */ }
  try {
    if ('caches' in window) {
      const noms = await caches.keys();
      await Promise.all(noms.filter((n) => /^(dinislam-static-|dinislam-runtime|dini-bismillah-)/.test(n)).map((n) => caches.delete(n)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch { /* on recharge quand même */ }
  window.location.reload();
}
