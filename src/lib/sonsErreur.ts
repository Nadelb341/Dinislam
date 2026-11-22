import { lecteurSon } from '@/lib/sonSaison';

/**
 * 🔈 Sons DOUX joués quand un tout-petit se trompe dans un jeu (Nadia, 2026-11-22 : « pas agressif, plutôt doux »).
 * 10 sons fabriqués par l'appli (aucun fichier, marchent sans Internet). L'enseignante choisit le sien
 * (réglage « son_erreur_petits », table reglages_appli) ; on le garde aussi sur l'appareil pour le hors-ligne.
 */
export const SONS_ERREUR: { n: number; emoji: string; nom: string }[] = [
  { n: 1, emoji: '🫧', nom: 'Bulle douce' },
  { n: 2, emoji: '🎐', nom: 'Carillon qui descend' },
  { n: 3, emoji: '🦉', nom: 'Petit hibou « hou-hou »' },
  { n: 4, emoji: '💧', nom: 'Goutte d\'eau' },
  { n: 5, emoji: '🎵', nom: '« Oh-oh » chanté' },
  { n: 6, emoji: '🧸', nom: 'Boing tout doux' },
  { n: 7, emoji: '🌬️', nom: 'Petit souffle' },
  { n: 8, emoji: '🎹', nom: 'Note de piano grave' },
  { n: 9, emoji: '🔔', nom: 'Clochette lointaine' },
  { n: 10, emoji: '🐦', nom: 'Petit oiseau « hmm ? »' },
];

const CLE = 'dinislam_son_erreur_petits';
let choisi = (() => { try { return Number(localStorage.getItem(CLE)) || 1; } catch { return 1; } })();

export function retenirSonErreur(n: number) {
  if (!SONS_ERREUR.some((s) => s.n === n)) return;
  choisi = n;
  try { localStorage.setItem(CLE, String(n)); } catch { /* stockage indisponible */ }
}
export const sonErreurChoisi = () => choisi;

/** Une note douce : fréquence de départ → d'arrivée, montée rapide, descente lente */
function note(c: AudioContext, t: number, f1: number, f2: number, duree: number, volume: number, forme: OscillatorType = 'sine', vibrato = 0) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = forme;
  o.frequency.setValueAtTime(f1, t);
  o.frequency.exponentialRampToValueAtTime(f2, t + duree * 0.8);
  if (vibrato) {
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 6; lg.gain.value = vibrato;
    lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + duree + 0.05);
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + duree + 0.05);
}

/** Joue le son n (par défaut celui choisi par l'enseignante) */
export function sonErreur(n = choisi) {
  const c = lecteurSon(); if (!c) return;
  try {
    const t = c.currentTime + 0.01;
    switch (n) {
      case 2: note(c, t, 659, 659, 0.45, 0.12, 'triangle'); note(c, t + 0.18, 523, 523, 0.6, 0.12, 'triangle'); break;
      case 3: note(c, t, 392, 370, 0.3, 0.14, 'sine', 4); note(c, t + 0.32, 370, 349, 0.45, 0.14, 'sine', 4); break;
      case 4: note(c, t, 1300, 520, 0.22, 0.13); break;
      case 5: note(c, t, 392, 392, 0.28, 0.13); note(c, t + 0.26, 330, 330, 0.5, 0.13); break;
      case 6: note(c, t, 220, 330, 0.18, 0.15); note(c, t + 0.15, 330, 196, 0.35, 0.13); break;
      case 7: {
        const d = 0.5, nb = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, nb, c.sampleRate), data = buf.getChannelData(0);
        for (let i = 0; i < nb; i++) data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / nb);
        const src = c.createBufferSource(); src.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
        const g = c.createGain(); g.gain.value = 0.25;
        src.connect(f).connect(g).connect(c.destination); src.start(t);
        break;
      }
      case 8: note(c, t, 262, 262, 0.9, 0.16, 'triangle'); note(c, t, 131, 131, 0.9, 0.06); break;
      case 9: note(c, t, 880, 880, 1.1, 0.06); note(c, t, 1320, 1320, 0.8, 0.03); break;
      case 10: note(c, t, 700, 520, 0.18, 0.1); note(c, t + 0.22, 520, 640, 0.25, 0.1); break;
      default: note(c, t, 620, 300, 0.25, 0.14);
    }
  } catch { /* pas de son possible */ }
}
