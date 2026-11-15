import { lecteurSon } from '@/lib/sonSaison';

/**
 * 🔥 Son du feu de la cheminée (Nadia, 2026-11-12 : « avoir le choix entre 2 sons dans les paramètres, un vrai bois qui crépite,
 * propre, pas trop faux » ; téléchargement accepté le 2026-11-15).
 * 2 vrais enregistrements LIBRES (licence CC0, OpenGameArt), rangés dans l'appli (public/sons/) :
 *  - 🪵 « crepite »  : « fire crackling » (fire-1.ogg), 3,5 s, bois qui crépite et qui pète ;
 *  - 🏡 « cheminee » : « fireplace sound loop » (fire.wav), cheminée douce en boucle (on en joue 7 s, en fondu).
 * Convertis en AAC (.m4a, lu par l'iPhone, Android et les ordinateurs), 250 Ko en tout : gardés dans la mémoire hors ligne
 * dès l'installation (liste PRECACHE de vite.config.ts) → le son marche sans Internet.
 * Joué quand on touche le foyer de la cheminée (jamais tout seul : pas de bruit surprise en classe). Choix gardé sur l'appareil.
 */
export type ChoixSonFeu = 'crepite' | 'cheminee' | 'aucun';
const CLE = 'dinislam_son_feu';
export const SONS_FEU: { id: ChoixSonFeu; label: string; detail: string }[] = [
  { id: 'crepite', label: '🪵 Bois qui crépite', detail: 'Le bois qui pète' },
  { id: 'cheminee', label: '🏡 Cheminée douce', detail: 'Un feu calme' },
  { id: 'aucun', label: '🔇 Sans son', detail: '' },
];

export function lireSonFeu(): ChoixSonFeu {
  try { const v = localStorage.getItem(CLE); return v === 'cheminee' || v === 'aucun' ? v : 'crepite'; } catch { return 'crepite'; }
}
export function choisirSonFeu(v: ChoixSonFeu) {
  try { localStorage.setItem(CLE, v); } catch { /* stockage bloqué : le choix vaut pour cette visite */ }
}

const REGLAGE: Record<Exclude<ChoixSonFeu, 'aucun'>, { url: string; volume: number; duree: number | null }> = {
  crepite: { url: '/sons/feu-crepite.m4a', volume: 0.55, duree: null },
  // Enregistrement plus doux (≈ 4 fois moins fort) : remonté pour qu'on l'entende autant que l'autre
  cheminee: { url: '/sons/feu-cheminee.m4a', volume: 1.6, duree: 7 },
};
const tampons = new Map<string, Promise<AudioBuffer>>();
let enCours: { stop: () => void } | null = null;

function charger(c: AudioContext, url: string) {
  let t = tampons.get(url);
  if (!t) {
    t = fetch(url).then((r) => { if (!r.ok) throw new Error('son'); return r.arrayBuffer(); })
      .then((b) => new Promise<AudioBuffer>((ok, ko) => c.decodeAudioData(b, ok, ko)));
    t.catch(() => tampons.delete(url));
    tampons.set(url, t);
  }
  return t;
}

/** Joue le son choisi (ou celui donné). Un seul à la fois : toucher de nouveau relance. Silencieux si impossible. */
export async function jouerSonFeu(choix: ChoixSonFeu = lireSonFeu()) {
  if (choix === 'aucun') return;
  const c = lecteurSon(); if (!c) return;
  const { url, volume, duree } = REGLAGE[choix];
  try {
    const buf = await charger(c, url);
    enCours?.stop();
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = buf;
    const t0 = c.currentTime, d = Math.min(duree ?? buf.duration, buf.duration);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(volume, t0 + 0.25);
    g.gain.setValueAtTime(volume, t0 + Math.max(0.3, d - 1.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    src.connect(g).connect(c.destination);
    src.start(t0); src.stop(t0 + d + 0.05);
    const moi = { stop: () => { try { g.gain.cancelScheduledValues(c.currentTime); g.gain.setTargetAtTime(0.0001, c.currentTime, 0.08); src.stop(c.currentTime + 0.3); } catch { /* déjà fini */ } } };
    enCours = moi;
    src.onended = () => { if (enCours === moi) enCours = null; };
  } catch { /* pas de son possible (appareil, fichier) : rien ne casse */ }
}
