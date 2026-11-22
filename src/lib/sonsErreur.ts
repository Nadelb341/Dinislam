import { lecteurSon } from '@/lib/sonSaison';

/**
 * 🔈 Sons DOUX joués quand un tout-petit se trompe dans un jeu (Nadia, 2026-11-22 : « pas agressif, plutôt doux »).
 * 10 sons fabriqués par l'appli (aucun fichier, marchent sans Internet). L'enseignante choisit le sien
 * (réglage « son_erreur_petits », table reglages_appli) ; on le garde aussi sur l'appareil pour le hors-ligne.
 */
export const SONS_ERREUR: { n: number; emoji: string; nom: string }[] = [
  // Les 5 sons choisis par Nadia le 22/11 (ils remplacent les 10 premiers, qui ne lui plaisaient pas)
  { n: 1, emoji: '🎵', nom: 'Kalimba douce' },
  { n: 2, emoji: '🪵', nom: 'Marimba « pom-pom »' },
  { n: 3, emoji: '🪕', nom: 'Harpe qui descend' },
  { n: 4, emoji: '🎠', nom: 'Boîte à musique' },
  { n: 5, emoji: '🍃', nom: 'Souffle et note' },
];

const CLE = 'dinislam_son_erreur_petits';
let choisi = (() => { try { const n = Number(localStorage.getItem(CLE)); return n >= 1 && n <= 5 ? n : 1; } catch { return 1; } })();

export function retenirSonErreur(n: number) {
  if (!SONS_ERREUR.some((s) => s.n === n)) return;
  choisi = n;
  try { localStorage.setItem(CLE, String(n)); } catch { /* stockage indisponible */ }
}
export const sonErreurChoisi = () => choisi;

/** Une note : montée très rapide, puis s'éteint doucement */
function note(c: AudioContext, t: number, f: number, duree: number, volume: number, forme: OscillatorType = 'sine', attaque = 0.008) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = forme; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + attaque);
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
      case 2: note(c, t, 392, 0.45, 0.25, 'triangle'); note(c, t + 0.2, 330, 0.55, 0.25, 'triangle'); break;
      case 3: [1046, 880, 698, 587].forEach((f, i) => note(c, t + i * 0.09, f, 0.8, 0.12)); break;
      case 4: [1046, 880, 784].forEach((f, i) => { note(c, t + i * 0.16, f, 0.7, 0.11); note(c, t + i * 0.16, f * 2.76, 0.2, 0.02); }); break;
      case 5: {
        const d = 0.35, nb = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, nb, c.sampleRate), data = buf.getChannelData(0);
        for (let i = 0; i < nb; i++) data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / nb);
        const src = c.createBufferSource(); src.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
        const g = c.createGain(); g.gain.value = 0.08;
        src.connect(f).connect(g).connect(c.destination); src.start(t);
        note(c, t + 0.25, 523, 0.8, 0.14);
        break;
      }
      default: note(c, t, 659, 0.7, 0.2); note(c, t, 1318, 0.25, 0.04); note(c, t + 0.22, 523, 0.9, 0.2); note(c, t + 0.22, 1046, 0.3, 0.04);
    }
  } catch { /* pas de son possible */ }
}
