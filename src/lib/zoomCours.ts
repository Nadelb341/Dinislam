import { useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * 🎥 Le cours Zoom DANS Dinislam (Nadia, 2026-11-27, choix A + D) : l'élève rejoint la salle de Nadia sans quitter l'appli,
 * avec le bouton 🎤 à côté du logo Zoom (vert = micro ouvert, rouge = micro coupé). Kit officiel « Meeting SDK » (vue composant),
 * chargé SEULEMENT au premier appui (≈ 3,5 Mo, jamais pré-chargé hors ligne : 📡 nécessite Internet de toute façon).
 * L'état vit ici (hors React) pour survivre aux changements de page.
 */
// 🔗 Le lien de la salle (pour « ouvrir dans l'appli Zoom ») et la place où le kit Zoom dessine le cours
export const ZOOM_URL = 'https://us06web.zoom.us/j/4080361371?pwd=UHVDc1o0RDE3WFBmNTBNTENaMDJnUT09';
export const ZOOM_RACINE_ID = 'zoom-cours-racine';

export type EtatZoom = 'ferme' | 'connexion' | 'en-cours' | 'erreur';
export interface ZoomState { etat: EtatZoom; micro: 'ouvert' | 'coupe' | 'sans-audio' | null; erreur: string | null; reduit: boolean }

let state: ZoomState = { etat: 'ferme', micro: null, erreur: null, reduit: false };
const abonnes = new Set<() => void>();
const changer = (p: Partial<ZoomState>) => { state = { ...state, ...p }; abonnes.forEach((f) => f()); };
export const useZoomCours = () => useSyncExternalStore((f) => { abonnes.add(f); return () => abonnes.delete(f); }, () => state, () => state);

// Le client du kit Zoom (type minimal de ce qu'on utilise)
interface Participant { userId: number; muted?: boolean; audio?: string }
interface ClientZoom {
  init(o: Record<string, unknown>): Promise<unknown>;
  join(o: Record<string, unknown>): Promise<unknown>;
  getCurrentUser(): Participant | null;
  mute(m: boolean, userId?: number): Promise<unknown> | unknown;
  leaveMeeting(): Promise<unknown>;
  on(e: string, cb: (p: unknown) => void): void;
}
let client: ClientZoom | null = null;
let module: { destroyClient?: () => void } | null = null;

/** Le micro de l'élève d'après le kit Zoom */
function lireMicro() {
  const u = client?.getCurrentUser();
  if (!u) return;
  // 🎤 27/11 (Nadia : « simplifier un max pour les petits ») : dès que le son est rejoint, le micro s'ouvre tout seul (une fois)
  if (u.audio && u.muted && !microOuvertAuto && client) {
    microOuvertAuto = true;
    void Promise.resolve(client.mute(false)).catch(() => { /* l'enseignante a peut-être bloqué les micros */ }).then(() => setTimeout(lireMicro, 400));
  }
  changer({ micro: !u.audio ? 'sans-audio' : u.muted ? 'coupe' : 'ouvert' });
}
let microOuvertAuto = false;

/**
 * 🎧 Rejoindre le son de l'ordinateur / du téléphone : le kit Zoom n'a pas de commande pour ça, on appuie donc nous-mêmes
 * sur SON bouton « Rejoindre l'audio » (icône `icon-join-audio`) dans la fenêtre du cours.
 */
export function rejoindreAudio(): boolean {
  const icone = document.getElementById(ZOOM_RACINE_ID)?.querySelector('.icon-join-audio');
  const bouton = icone?.closest('button') as HTMLButtonElement | null;
  if (!bouton) return false;
  bouton.click();
  setTimeout(lireMicro, 800);
  return true;
}
/** Juste après l'entrée : essaie plusieurs fois (le bouton du kit apparaît un peu après) */
function rejoindreAudioAuto() {
  let essais = 0;
  const t = window.setInterval(() => {
    essais += 1;
    const u = client?.getCurrentUser();
    if (!client || (u && u.audio) || essais > 20) { window.clearInterval(t); lireMicro(); return; }
    rejoindreAudio();
  }, 700);
}

/** Message clair pour les erreurs connues du kit Zoom */
export function messageErreurZoom(e: unknown): string {
  const t = typeof e === 'object' && e && 'reason' in e ? String((e as { reason: unknown }).reason) : e instanceof Error ? e.message : String(e ?? '');
  if (/not started|not start|waiting/i.test(t)) return 'Le cours n\'a pas encore commencé. Réessaie quand ton professeur a ouvert la salle 🙂';
  if (/password|passcode/i.test(t)) return 'Le code de la salle Zoom a changé : préviens ton professeur.';
  if (/signature|token|expired/i.test(t)) return 'Zoom a refusé l\'autorisation. Réessaie dans un instant.';
  return t ? `Zoom n'a pas pu s'ouvrir (${t}).` : 'Zoom n\'a pas pu s\'ouvrir.';
}

export async function rejoindreCours(racine: HTMLElement, nom: string) {
  if (state.etat === 'connexion' || state.etat === 'en-cours') { changer({ reduit: false }); return; }
  if (typeof navigator !== 'undefined' && !navigator.onLine) { changer({ etat: 'erreur', erreur: '📡 Nécessite Internet : le cours en direct a besoin du réseau.' }); return; }
  changer({ etat: 'connexion', erreur: null, reduit: false, micro: null });
  try {
    const { data, error } = await supabase.functions.invoke('zoom-signature', { body: {} });
    if (error || !data?.signature) throw new Error(data?.error || error?.message || 'autorisation refusée');
    const mod = await import('@zoom/meetingsdk/embedded');
    const ZoomMtgEmbedded = (mod as unknown as { default: { createClient(): ClientZoom; destroyClient?: () => void } }).default;
    module = ZoomMtgEmbedded;
    client = ZoomMtgEmbedded.createClient();
    await client.init({
      zoomAppRoot: racine, language: 'fr-FR', patchJsMedia: true, leaveOnPageUnload: true,
      customize: { video: { isResizable: true, viewSizes: { default: { width: Math.min(320, window.innerWidth - 32), height: 200 } } } },
    });
    client.on('user-updated', () => lireMicro());
    client.on('connection-change', (p) => {
      const s = (p as { state?: string })?.state;
      if (s === 'Closed' || s === 'Fail') { client = null; changer({ etat: 'ferme', micro: null }); }
    });
    await client.join({ signature: data.signature, meetingNumber: String(data.meetingNumber), password: data.passcode || '', userName: nom || 'Élève' });
    changer({ etat: 'en-cours' });
    microOuvertAuto = false;
    lireMicro();
    rejoindreAudioAuto();
  } catch (e) {
    client = null;
    changer({ etat: 'erreur', erreur: messageErreurZoom(e) });
  }
}

/** 🎤 Ouvrir / couper SON micro (l'élève) */
export async function basculerMicro(): Promise<string | null> {
  const u = client?.getCurrentUser();
  if (!client || !u) return 'Le cours n\'est pas ouvert.';
  if (!u.audio) {
    // le toucher de l'élève sur notre bouton suffit au téléphone pour autoriser le son
    if (rejoindreAudio()) return null;
    changer({ reduit: false });
    return '🎧 Touche le casque (en bas à gauche de la fenêtre du cours) pour rejoindre l\'audio.';
  }
  try { await client.mute(!u.muted); } catch (e) { return messageErreurZoom(e); }
  setTimeout(lireMicro, 300);
  return null;
}

export async function quitterCours() {
  try { await client?.leaveMeeting(); } catch { /* déjà parti */ }
  try { module?.destroyClient?.(); } catch { /* rien */ }
  client = null;
  changer({ etat: 'ferme', micro: null, erreur: null, reduit: false });
}

export const reduireCours = (reduit: boolean) => changer({ reduit });
export const fermerErreur = () => changer({ etat: 'ferme', erreur: null });
