/**
 * 🔊 Petits sons du décor de saison (feuille sèche en automne, cristal en hiver).
 * Correction du 2026-11-04 (Nadia : « pas de son quand je touche les feuilles » sur iPhone) :
 * - Safari (iPhone) ne laisse démarrer le son que pendant un VRAI toucher terminé (touchend / click),
 *   pas au moment où le doigt se pose (pointerdown, là où la feuille éclate). Le son restait donc « en pause ».
 *   → on débloque le son au premier toucher terminé, n'importe où dans l'appli, avec un son vide et `resume()`.
 * - Un seul lecteur de son pour toute l'appli (iPhone en limite le nombre).
 * NB : bouton « silencieux » de l'iPhone activé (petit interrupteur sur le côté, orange) = aucun son, c'est voulu par Apple.
 */
/** 🌰❄️ Événement envoyé à chaque validation fêtée (useConfetti) : pluie de glands (automne) ou de flocons dorés (hiver) */
export const EVT_VALIDATION = 'dinislam:validation';

let lecteur: AudioContext | null = null;
let debloque = false;

export function lecteurSon(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    lecteur = lecteur || new AC();
    if (lecteur.state === 'suspended') void lecteur.resume().catch(() => { /* pas encore permis */ });
    return lecteur;
  } catch { return null; }
}

/** À appeler une fois (au montage du décor) : débloque le son dès le premier toucher terminé */
export function preparerSon() {
  if (debloque || typeof window === 'undefined') return;
  const debloquer = () => {
    const c = lecteurSon(); if (!c) return;
    try {
      const vide = c.createBuffer(1, 1, 22050), src = c.createBufferSource();
      src.buffer = vide; src.connect(c.destination); src.start(0);
    } catch { /* */ }
    if (c.state === 'running') {
      debloque = true;
      window.removeEventListener('touchend', debloquer); window.removeEventListener('click', debloquer); window.removeEventListener('keydown', debloquer);
    }
  };
  window.addEventListener('touchend', debloquer, { passive: true });
  window.addEventListener('click', debloquer);
  window.addEventListener('keydown', debloquer);
}

/** 🍂 Petit bruit de feuille sèche (sans points) */
export function bruitFeuille() {
  const c = lecteurSon(); if (!c) return;
  try {
    const d = 0.22, n = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, n, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) { const crepite = Math.random() < 0.06 ? 1 : 0.35; data[i] = (Math.random() * 2 - 1) * crepite * Math.pow(1 - i / n, 2); }
    const src = c.createBufferSource(); src.buffer = buf;
    const filtre = c.createBiquadFilter(); filtre.type = 'bandpass'; filtre.frequency.value = 2600; filtre.Q.value = 0.7;
    const g = c.createGain(); g.gain.value = 0.5;
    src.connect(filtre).connect(g).connect(c.destination); src.start();
  } catch { /* pas de son possible */ }
}

/** ❄️ Petit son de cristal (flocon attrapé, pluie dorée) */
export function sonCristal() {
  const c = lecteurSon(); if (!c) return;
  try {
    const t0 = c.currentTime;
    [1568, 2093, 2637].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + i * 0.05); g.gain.linearRampToValueAtTime(0.18, t0 + i * 0.05 + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.05 + 0.6);
      o.connect(g).connect(c.destination); o.start(t0 + i * 0.05); o.stop(t0 + i * 0.05 + 0.65);
    });
  } catch { /* pas de son possible */ }
}
