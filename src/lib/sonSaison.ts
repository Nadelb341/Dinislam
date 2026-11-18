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

/** 🦋 Petit tintement doux (papillon, abeille, feuille au printemps) */
export function sonTintement() {
  const c = lecteurSon(); if (!c) return;
  try {
    const t0 = c.currentTime;
    [1319, 1760].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + i * 0.07); g.gain.linearRampToValueAtTime(0.12, t0 + i * 0.07 + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.07 + 0.35);
      o.connect(g).connect(c.destination); o.start(t0 + i * 0.07); o.stop(t0 + i * 0.07 + 0.4);
    });
  } catch { /* pas de son possible */ }
}

/** 🫧 « Plop » de bulle qui éclate (été) */
export function sonPlop() {
  const c = lecteurSon(); if (!c) return;
  try {
    const t0 = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(380, t0); o.frequency.exponentialRampToValueAtTime(1100, t0 + 0.08);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.14);
    o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + 0.16);
  } catch { /* pas de son possible */ }
}

/* ---------- 🧞⛄🍂☀️🐦 Sons des objets qui se promènent (Nadia, 2026-11-18) : doux, volume 45 % ---------- */
const VOLUME_PROMENEUR = 0.45;
function sortie(c: AudioContext) {
  const out = c.createGain(); out.gain.value = VOLUME_PROMENEUR * 0.6; out.connect(c.destination); return out;
}
function ping(c: AudioContext, out: AudioNode, t: number, f: number, dur: number, g: number, type: OscillatorType = 'sine') {
  const o = c.createOscillator(), e = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(g, t + 0.008); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(e).connect(out); o.start(t); o.stop(t + dur + 0.05);
}
/** 🧞 « D · Harpe magique » (choix de Nadia, page du 18/11) : une montée rapide de notes, comme une harpe */
export function sonHarpe() {
  const c = lecteurSon(); if (!c) return;
  try {
    const out = sortie(c), t = c.currentTime + 0.02;
    [1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637, 3136, 3520].forEach((f, i) => ping(c, out, t + i * 0.045, f, 0.9, 0.12, 'triangle'));
  } catch { /* pas de son possible */ }
}
/** ⛄ Hiver : cristal qui tinte, avec un petit écho glacé */
export function sonCristalHiver() {
  const c = lecteurSon(); if (!c) return;
  try {
    const out = sortie(c), t = c.currentTime + 0.02;
    [2637, 3136, 3951, 3136, 4699].forEach((f, i) => { ping(c, out, t + i * 0.08, f, 1.1, 0.1); ping(c, out, t + i * 0.08, f * 2.76, 0.3, 0.02); });
  } catch { /* pas de son possible */ }
}
/** 🍂 Automne : froissement doré (feuille qui passe) + deux notes chaudes */
export function sonFroissementDore() {
  const c = lecteurSon(); if (!c) return;
  try {
    const out = sortie(c), t = c.currentTime + 0.02, d = 0.5, n = Math.floor(c.sampleRate * d);
    const buf = c.createBuffer(1, n, c.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) { const x = i / n; data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.08 ? 1 : 0.3) * Math.sin(Math.PI * x) * (1 - x); }
    const src = c.createBufferSource(); src.buffer = buf;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(1800, t); bp.frequency.linearRampToValueAtTime(3200, t + d); bp.Q.value = 0.8;
    const g = c.createGain(); g.gain.value = 0.5; src.connect(bp).connect(g).connect(out); src.start(t);
    ping(c, out, t + 0.18, 1319, 0.9, 0.09, 'triangle'); ping(c, out, t + 0.3, 1760, 1.1, 0.08, 'triangle');
  } catch { /* pas de son possible */ }
}
/** ☀️ Été : carillon chaud (notes graves et rondes) */
export function sonCarillonChaud() {
  const c = lecteurSon(); if (!c) return;
  try {
    const out = sortie(c), t = c.currentTime + 0.02;
    [784, 988, 1175, 1568].forEach((f, i) => { ping(c, out, t + i * 0.13, f, 1.4, 0.13, 'sine'); ping(c, out, t + i * 0.13, f * 2, 0.6, 0.03, 'triangle'); });
  } catch { /* pas de son possible */ }
}
/** 🐦 Printemps : petit gazouillis (trois « tuit » qui montent) */
export function sonGazouillis() {
  const c = lecteurSon(); if (!c) return;
  try {
    const out = sortie(c), t0 = c.currentTime + 0.02;
    [0, 0.16, 0.3, 0.52].forEach((d, i) => {
      const t = t0 + d, o = c.createOscillator(), e = c.createGain(); o.type = 'sine';
      const bas = 2600 + i * 250, haut = 4200 + i * 300;
      o.frequency.setValueAtTime(bas, t); o.frequency.exponentialRampToValueAtTime(haut, t + 0.06); o.frequency.exponentialRampToValueAtTime(bas * 0.9, t + 0.11);
      e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(0.14, t + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(e).connect(out); o.start(t); o.stop(t + 0.14);
    });
  } catch { /* pas de son possible */ }
}
