import { useEffect } from 'react';

/**
 * 📱↔️ Téléphone tourné (mode paysage) — règle de Nadia du 2026-11-21 pour toutes ses applis : l'appli marche aussi
 * téléphone tourné (pratique sur tablette), et chacun choisit dans Paramètres de l'activer ou pas (réglage de CET appareil).
 * Le manifeste autorise tous les sens ; quand le réglage est coupé, on bloque en portrait là où le téléphone le permet
 * (Android, appli installée). Sur iPhone/iPad, Apple ne laisse pas une appli web se bloquer : c'est le cadenas de rotation
 * du Centre de contrôle qui décide.
 */
const CLE = 'dinislam_ecran_tourne';
export const EVT_ECRAN_TOURNE = 'dinislam:ecran-tourne';

export function ecranTourneActive(): boolean {
  try { return localStorage.getItem(CLE) !== '0'; } catch { return true; }
}
export function choisirEcranTourne(v: boolean) {
  try { localStorage.setItem(CLE, v ? '1' : '0'); } catch { /* stockage indisponible */ }
  try { window.dispatchEvent(new Event(EVT_ECRAN_TOURNE)); } catch { /* hors navigateur */ }
}

type Orient = { lock?: (o: string) => Promise<void>; unlock?: () => void };
function appliquer() {
  const o = (typeof screen !== 'undefined' ? (screen.orientation as unknown as Orient | undefined) : undefined);
  if (!o) return;
  try {
    if (ecranTourneActive()) o.unlock?.();
    else void o.lock?.('portrait').catch(() => { /* pas permis sur cet appareil (iPhone, navigateur) */ });
  } catch { /* pas permis */ }
}

/** À monter une fois (App) : applique le réglage au démarrage et à chaque changement */
export function useEcranTourne() {
  useEffect(() => {
    appliquer();
    window.addEventListener(EVT_ECRAN_TOURNE, appliquer);
    return () => window.removeEventListener(EVT_ECRAN_TOURNE, appliquer);
  }, []);
}

/** Le téléphone peut-il vraiment se bloquer en portrait ? (sinon on l'explique dans Paramètres) */
export const blocageDisponible = () => {
  try { return typeof screen !== 'undefined' && typeof (screen.orientation as unknown as Orient | undefined)?.lock === 'function' && !/iPhone|iPad|iPod/.test(navigator.userAgent); } catch { return false; }
};
