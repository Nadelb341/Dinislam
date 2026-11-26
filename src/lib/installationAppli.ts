import { useEffect, useState } from 'react';

/**
 * 📲 Installation de l'appli sur l'écran d'accueil (Nadia, 2026-11-18, idées 5 à 9 de la page « Diamants et notifications »).
 * Détection de l'appareil, de l'appli installée et de l'invitation « Installer » d'Android (beforeinstallprompt).
 */
export type Appareil = 'iphone' | 'android' | 'ordinateur';

type InvitationInstallation = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

let invitation: InvitationInstallation | null = null;
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((f) => f());

if (typeof window !== 'undefined') {
  // Android / Chrome : le navigateur propose l'installation → on garde l'invitation pour un vrai bouton « Installer »
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invitation = e as InvitationInstallation; prevenir(); });
  window.addEventListener('appinstalled', () => { invitation = null; prevenir(); });
}

export function appareil(): Appareil {
  if (typeof navigator === 'undefined') return 'ordinateur';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'iphone';
  if (/Android/i.test(ua)) return 'android';
  return 'ordinateur';
}

/**
 * 🔄 2026-11-26 (Nadia : mises à jour de janvier et de juin, M3) : depuis iOS 16.4, Chrome, Edge et Firefox sur iPhone
 * savent AUSSI « Ajouter à l'écran d'accueil » (bouton Partager). Restent obligés de passer par Safari :
 * les applis qui ouvrent les liens à l'intérieur (Instagram, Facebook, Snapchat, WhatsApp, Google…), les navigateurs
 * moins connus, et les iPhone plus anciens qu'iOS 16.4.
 * - 'safari' : Safari ;
 * - 'navigateur' : Chrome / Edge / Firefox avec iOS 16.4 ou plus récent → même pas à pas (Partager › Sur l'écran d'accueil) ;
 * - 'safari-obligatoire' : il faut ouvrir la page dans Safari.
 */
export type NavigateurIphone = 'safari' | 'navigateur' | 'safari-obligatoire';

/** Version d'iOS lue dans l'identité du navigateur (« OS 17_2 » → 17.2), ou null si on ne la trouve pas */
export function versionIos(ua: string): number | null {
  const m = ua.match(/OS (\d+)[_.](\d+)/);
  return m ? Number(m[1]) + Number(m[2]) / 100 : null;
}

export function navigateurIphone(ua: string): NavigateurIphone {
  if (/Instagram|FBAN|FBAV|Snapchat|WhatsApp|GSA\/|Line\//i.test(ua)) return 'safari-obligatoire';
  if (/CriOS|EdgiOS|FxiOS/i.test(ua)) {
    const v = versionIos(ua);
    // Prudence : version inconnue ou plus ancienne que 16.4 → Safari
    return v !== null && v >= 16.04 ? 'navigateur' : 'safari-obligatoire';
  }
  if (/OPiOS/i.test(ua) || !/Safari/i.test(ua)) return 'safari-obligatoire';
  return 'safari';
}

/** iPhone où il FAUT passer par Safari pour installer l'appli (applis qui ouvrent les liens, vieux iOS…) */
export function iphoneHorsSafari(): boolean {
  if (appareil() !== 'iphone') return false;
  return navigateurIphone(navigator.userAgent) === 'safari-obligatoire';
}

/** iPhone avec Chrome / Edge / Firefox récent : il installe lui aussi l'appli par le bouton Partager */
export function iphoneAutreNavigateur(): 'chrome' | 'edge' | 'firefox' | null {
  if (appareil() !== 'iphone') return null;
  const ua = navigator.userAgent;
  if (navigateurIphone(ua) !== 'navigateur') return null;
  return /EdgiOS/i.test(ua) ? 'edge' : /FxiOS/i.test(ua) ? 'firefox' : 'chrome';
}

export function estInstallee(): boolean {
  if (typeof window === 'undefined') return false;
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    || window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.matchMedia('(display-mode: minimal-ui)').matches;
}

/** Invitation « Installer » d'Android disponible ? (se met à jour toute seule) */
export function useInvitationInstallation() {
  const [dispo, setDispo] = useState(!!invitation);
  useEffect(() => {
    const f = () => setDispo(!!invitation);
    abonnes.add(f);
    f();
    return () => { abonnes.delete(f); };
  }, []);
  const installer = async (): Promise<boolean> => {
    if (!invitation) return false;
    const inv = invitation;
    await inv.prompt();
    const { outcome } = await inv.userChoice;
    invitation = null;
    prevenir();
    return outcome === 'accepted';
  };
  return { dispo, installer };
}

/** Appli installée ? (change si l'utilisateur l'installe pendant qu'elle est ouverte) */
export function useEstInstallee() {
  const [ok, setOk] = useState(estInstallee);
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const f = () => setOk(estInstallee());
    mq.addEventListener?.('change', f);
    window.addEventListener('appinstalled', f);
    return () => { mq.removeEventListener?.('change', f); window.removeEventListener('appinstalled', f); };
  }, []);
  return ok;
}
