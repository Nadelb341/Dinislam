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

/** Sur iPhone, seul Safari sait installer l'appli (Chrome, Firefox, Instagram… ne le proposent pas) */
export function iphoneHorsSafari(): boolean {
  if (appareil() !== 'iphone') return false;
  const ua = navigator.userAgent;
  return /CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|Instagram|FBAN|FBAV|Snapchat|WhatsApp/i.test(ua) || !/Safari/i.test(ua);
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
