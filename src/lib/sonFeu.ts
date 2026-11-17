import { lecteurSon } from '@/lib/sonSaison';

/**
 * 🔥 Son du feu de la cheminée.
 * - 2026-11-12 (Nadia) : « un vrai bois qui crépite, propre, pas trop faux » ; téléchargement accepté le 2026-11-15.
 * - 2026-11-17 (Nadia, après avoir écouté 10 sons sur https://claude.ai/artifact/Rw1Gcs28KdWj6sjN2Vk6mW) : elle ne garde QUE le n° 7,
 *   « Feu qui pète beaucoup » (TonyW, radio aporee, domaine public) → `public/sons/feu-bois.m4a` (30 s, AAC, 375 Ko), gardé dans la
 *   mémoire hors ligne dès l'installation (plugin offlinePrecache de vite.config.ts) → marche sans Internet. Les 2 anciens sons sont retirés.
 * Joué quand on touche le foyer de la cheminée (jamais tout seul : pas de bruit surprise en classe), en BOUCLE.
 * Choix gardé sur l'appareil : 🔥 Feu de bois / 🔇 Sans son (un ancien choix « crepite » ou « cheminee » devient « feu »).
 * ⏱️ 2026-11-16 (Nadia) : 20 s au 1ᵉʳ toucher, 1 min à partir du 2ᵉ toucher dans la même visite.
 */
export type ChoixSonFeu = 'feu' | 'aucun';
const CLE = 'dinislam_son_feu';
export const SONS_FEU: { id: ChoixSonFeu; label: string; detail: string }[] = [
  { id: 'feu', label: '🔥 Feu de bois', detail: 'Le bois qui crépite et qui pète' },
  { id: 'aucun', label: '🔇 Sans son', detail: '' },
];

export function lireSonFeu(): ChoixSonFeu {
  try { return localStorage.getItem(CLE) === 'aucun' ? 'aucun' : 'feu'; } catch { return 'feu'; }
}
export function choisirSonFeu(v: ChoixSonFeu) {
  try { localStorage.setItem(CLE, v); } catch { /* stockage bloqué : le choix vaut pour cette visite */ }
}

const REGLAGE: Record<Exclude<ChoixSonFeu, 'aucun'>, { url: string; volume: number }> = {
  feu: { url: '/sons/feu-bois.m4a', volume: 1 },
};
export const DUREE_PREMIER = 20;
export const DUREE_SUIVANT = 60;
const CLE_TOUCHERS = 'dinislam_feu_touchers';
/** Durée du son quand on touche la cheminée : 20 s la 1ʳᵉ fois de la visite, 1 min ensuite */
export function dureeDuToucher(): number {
  let n = 0;
  try { n = Number(sessionStorage.getItem(CLE_TOUCHERS) || 0) + 1; sessionStorage.setItem(CLE_TOUCHERS, String(n)); } catch { n = 1; }
  return n <= 1 ? DUREE_PREMIER : DUREE_SUIVANT;
}
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

/** Joue le son choisi (ou celui donné) pendant `duree` secondes, en boucle. Un seul à la fois : toucher de nouveau relance. */
export async function jouerSonFeu(choix: ChoixSonFeu = lireSonFeu(), duree = 5) {
  if (choix === 'aucun') return;
  const c = lecteurSon(); if (!c) return;
  const { url, volume } = REGLAGE[choix];
  try {
    const buf = await charger(c, url);
    enCours?.stop();
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = buf; src.loop = true;
    const t0 = c.currentTime, d = duree;
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
