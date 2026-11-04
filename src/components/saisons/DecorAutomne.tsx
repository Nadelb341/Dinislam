import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import type { ReglagesSaisons } from '@/lib/saisons';
import { lundiDeLaSemaine } from '@/lib/saisons';
import { TapisFeuilles } from './TapisFeuilles';
import { ARBRE_VB, CHEMINEE_VB, ERABLE, dessinerArbre, dessinerCheminee } from './dessinsAutomne';

/** 🌰 Événement envoyé à chaque validation fêtée (useConfetti) : pluie de glands, pommes de pin et feuilles */
export const EVT_VALIDATION = 'dinislam:validation';

/**
 * 🍂 Décor d'automne de l'accueil (maquette validée par Nadia le 2026-11-03) :
 * - petit arbre à branches en haut à gauche (il défile avec l'accueil), qui se balance ; des feuilles partent de ses branches
 * - feuilles qui tombent sur toute la largeur et toute la hauteur : les « loin » (petites, pâles) DERRIÈRE les cartes,
 *   les « proches » (grandes, qui grandissent en tombant) DEVANT ; aucune ne reste en haut
 * - toucher une feuille de devant : elle éclate + petit bruit de feuille sèche (sans points), la carte dessous ne s'ouvre pas
 * - cheminée en bas à droite, petit feu en journée, grand feu après le Maghrib ; presque transparente pendant le défilement
 * - message « Attrape les feuilles ! » une fois par semaine (le 1er jour d'ouverture à partir du lundi)
 * Rien ne bloque un toucher (pointer-events: none). « Réduire les animations » du téléphone = décor immobile, sans feuilles.
 * Les feuilles s'arrêtent quand l'appli est en arrière-plan.
 */

const FORMES: Record<string, Path2D | null> = { erable: null, chene: null, ginkgo: null, simple: null };
const CHEMINS: Record<string, string> = {
  erable: ERABLE,
  chene: 'M20 2c3 0 4 4 3 6 4-1 6 2 4 5 4 0 5 4 2 6 3 2 2 6-2 6 1 4-2 6-5 4 0 3-1 6-2 9-1-3-2-6-2-9-3 2-6 0-5-4-4 0-5-4-2-6-3-2-2-6 2-6-2-3 0-6 4-5-1-2 0-6 3-6z',
  ginkgo: 'M20 38V24C12 22 4 15 3 6c7-3 13-1 17 4 4-5 10-7 17-4-1 9-9 16-17 18z',
  simple: 'M20 2C31 10 33 26 20 38 7 26 9 10 20 2z',
};
const COUL = ['#b5562b', '#c98a2b', '#7a4a2a', '#d9a441', '#a8432a', '#e07b2e', '#8c3a1c', '#e8b04a'];
const TAILLE_ARBRE = [0, 76, 92, 110];

interface Feuille {
  z: number; devant: boolean; deLArbre: boolean; forme: string; c: string; x: number; y: number; vx: number;
  rot: number; vr: number; flip: number; vf: number; bal: number; fb: number; ph: number; age: number; xAff: number; r: number;
  /** 🌟 feuille dorée rare (à attraper) */
  doree: boolean;
}
interface Goutte { type: 'gland' | 'pin' | 'feuille'; c: string; x: number; y: number; vy: number; rot: number; vr: number; s: number; ph: number }
interface Eclat { x: number; y: number; vx: number; vy: number; r: number; vr: number; s: number; c: string; v: number; vie: number }

let audio: AudioContext | null = null;
function bruitFeuille() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audio = audio || new AC();
    const d = 0.22, n = Math.floor(audio.sampleRate * d), buf = audio.createBuffer(1, n, audio.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) { const crepite = Math.random() < 0.06 ? 1 : 0.35; data[i] = (Math.random() * 2 - 1) * crepite * Math.pow(1 - i / n, 2); }
    const src = audio.createBufferSource(); src.buffer = buf;
    const filtre = audio.createBiquadFilter(); filtre.type = 'bandpass'; filtre.frequency.value = 2600; filtre.Q.value = 0.7;
    const g = audio.createGain(); g.gain.value = 0.5;
    src.connect(filtre).connect(g).connect(audio.destination); src.start();
  } catch { /* pas de son possible */ }
}

export function DecorAutomne({ r, soir, userId }: { r: ReglagesSaisons; soir: boolean; userId: string | null }) {
  const a = r.automne;
  // « Réduire les animations » du téléphone : respecté seulement si l'admin a décoché « Animer même si… » (tout était figé sur l'iPhone de Nadia)
  const reduit = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const calme = reduit && !r.animerToujours;
  const arbre = useMemo(() => dessinerArbre(a.oiseaux), [a.oiseaux]);
  const cheminee = useMemo(() => dessinerCheminee(a), [a]);
  const arbreRef = useRef<SVGSVGElement>(null);
  const arriereRef = useRef<HTMLCanvasElement>(null);
  const avantRef = useRef<HTMLCanvasElement>(null);
  const [defile, setDefile] = useState(false);
  const largeurArbre = TAILLE_ARBRE[r.tailleArbre] ?? 92;

  // Cheminée presque transparente pendant le défilement, pour ne cacher aucune carte
  useEffect(() => {
    if ((!a.cheminee && !a.tapis) || !a.transparente) return;
    let t = 0;
    const f = () => { setDefile(true); clearTimeout(t); t = window.setTimeout(() => setDefile(false), 600); };
    window.addEventListener('scroll', f, { passive: true });
    return () => { window.removeEventListener('scroll', f); clearTimeout(t); };
  }, [a.cheminee, a.tapis, a.transparente]);

  // Les feuilles qui tombent (2 calques : derrière et devant les cartes)
  useEffect(() => {
    if (!a.feuilles || calme) return;
    const cvA = arriereRef.current, cvV = avantRef.current;
    if (!cvA || !cvV) return;
    const ctxA = cvA.getContext('2d'), ctxV = cvV.getContext('2d');
    if (!ctxA || !ctxV) return;
    for (const k of Object.keys(CHEMINS)) if (!FORMES[k]) FORMES[k] = new Path2D(CHEMINS[k]);
    const nervure = new Path2D('M20 6V38');
    const formes = (['erable', 'chene', 'ginkgo', 'simple'] as const).filter((k) => a[k]);
    if (!formes.length) formes.push('erable');
    let W = 0, H = 0;
    const taille = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight;
      for (const c of [cvA, cvV]) { c.width = W * dpr; c.height = H * dpr; }
      for (const c of [ctxA, ctxV]) c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    taille(); window.addEventListener('resize', taille);
    const vitesse = [0, 0.55, 0.75, 1, 1.3, 1.6][r.vitesse] ?? 1;
    const pointArbre = (): [number, number] | null => {
      const el = arbreRef.current; if (!el || !a.arbre || !arbre.bouts.length) return null;
      const b = el.getBoundingClientRect(); if (b.bottom < 0) return null;   // arbre sorti de l'écran (on a défilé)
      const [x, y] = arbre.bouts[Math.floor(Math.random() * arbre.bouts.length)];
      return [b.left + x * (b.width / ARBRE_VB.w), b.top + y * (b.height / ARBRE_VB.h)];
    };
    const nouvelle = (depart: boolean): Feuille => {
      const devant = a.devantDerriere ? Math.random() < 0.42 : false;
      const z = devant ? 0.8 + Math.random() * 0.5 : 0.3 + Math.random() * 0.35;
      const pt = !depart && Math.random() < 0.45 ? pointArbre() : null;
      return {
        doree: devant && a.feuilleDoree && Math.random() < 0.03,
        z, devant, deLArbre: !!pt, forme: formes[Math.floor(Math.random() * formes.length)], c: COUL[Math.floor(Math.random() * COUL.length)],
        x: pt ? pt[0] : Math.random() * W, y: pt ? pt[1] : depart ? Math.random() * H : -30 - Math.random() * 40,
        vx: pt ? 18 + Math.random() * 34 : -12 + Math.random() * 24,
        rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 2.2, flip: Math.random() * Math.PI * 2, vf: 1.5 + Math.random() * 2.5,
        bal: 10 + Math.random() * 18, fb: 0.6 + Math.random() * 0.9, ph: Math.random() * 6.3, age: depart ? 1 : 0, xAff: -999, r: 0,
      };
    };
    const feuilles: Feuille[] = [];
    const eclats: Eclat[] = [];
    const n = Math.max(3, Math.min(40, r.quantite));
    for (let i = 0; i < n; i++) feuilles.push(nouvelle(true));

    const dessiner = (ctx: CanvasRenderingContext2D, f: Feuille, t: number) => {
      const px = 9 + 15 * f.z, sc = px / 40, fl = Math.cos(f.flip);
      const sx = (Math.abs(fl) < 0.18 ? 0.18 * Math.sign(fl || 1) : fl) * sc;
      const xb = f.x + Math.sin(t * f.fb + f.ph) * f.bal * f.z * Math.min(1, f.age);
      ctx.save(); ctx.translate(xb, f.y); ctx.rotate(f.rot); ctx.scale(sx, sc); ctx.translate(-20, -20);
      ctx.globalAlpha = (f.devant ? 0.95 : 0.55) * Math.min(1, f.age * 3);
      if (f.doree) { ctx.shadowColor = 'rgba(250,204,21,.95)'; ctx.shadowBlur = 14; }
      ctx.fillStyle = f.doree ? '#f5c542' : f.c; ctx.fill(FORMES[f.forme]!); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,240,210,.18)'; ctx.fillRect(0, 0, 20, 40);
      ctx.strokeStyle = f.doree ? 'rgba(140,90,0,.7)' : 'rgba(60,25,8,.45)'; ctx.lineWidth = 1.4; ctx.stroke(nervure);
      ctx.restore();
      f.xAff = xb; f.r = px * 0.6;
    };

    // 🌬️ Feuilles soufflées quand on fait défiler (idée 15 de l'hiver, appliquée à l'automne)
    let souffle = 0, dernierY = window.scrollY;
    const auDefile = () => { const dy = window.scrollY - dernierY; dernierY = window.scrollY; if (a.ventDefile) souffle = Math.max(-500, Math.min(500, souffle + dy * 3)); };
    window.addEventListener('scroll', auDefile, { passive: true });
    // 🌰 Pluie de glands, pommes de pin et quelques feuilles à chaque validation (idée 17)
    // dessinés directement (pas d'image SVG dans le canevas : plus fiable, iPhone compris), taille s
    const dessinerGland = (ctx: CanvasRenderingContext2D, s: number) => {
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#4a2c1a';
      ctx.beginPath(); ctx.ellipse(0, s * 0.12, s * 0.26, s * 0.34, 0, 0, Math.PI * 2); ctx.fillStyle = '#c98a3e'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-s * 0.08, s * 0.05, s * 0.06, s * 0.14, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,230,180,.55)'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -s * 0.16, s * 0.32, s * 0.17, 0, Math.PI, 0); ctx.lineTo(s * 0.32, -s * 0.1); ctx.quadraticCurveTo(0, -s * 0.02, -s * 0.32, -s * 0.1); ctx.closePath();
      ctx.fillStyle = '#7a4a2a'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -s * 0.32); ctx.lineTo(s * 0.05, -s * 0.45); ctx.lineWidth = 2; ctx.stroke();
    };
    const dessinerPin = (ctx: CanvasRenderingContext2D, s: number) => {
      ctx.lineWidth = 1.1; ctx.strokeStyle = '#4a2c1a';
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.27, s * 0.42, 0, 0, Math.PI * 2); ctx.fillStyle = '#8a5a32'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#b07a46';
      for (let r = 0; r < 4; r++) for (let c = -1; c <= 1; c++) {
        const x = c * s * 0.13 + (r % 2 ? s * 0.065 : 0), y = -s * 0.27 + r * s * 0.17;
        if (Math.abs(x) > s * 0.2) continue;
        ctx.beginPath(); ctx.arc(x, y, s * 0.075, 0, Math.PI); ctx.fill(); ctx.stroke();
      }
    };
    const pluie: Goutte[] = [];
    const pleuvoir = () => {
      if (!a.pluieValidation) return;
      for (let i = 0; i < 38; i++) {
        const k = Math.random();
        pluie.push({ type: k < 0.4 ? 'gland' : k < 0.7 ? 'pin' : 'feuille', c: COUL[Math.floor(Math.random() * COUL.length)], x: Math.random() * W, y: -30 - Math.random() * H * 0.6,
          vy: 150 + Math.random() * 120, rot: Math.random() * 6.3, vr: (Math.random() - 0.5) * 4, s: 20 + Math.random() * 10, ph: Math.random() * 6.3 });
      }
    };
    window.addEventListener(EVT_VALIDATION, pleuvoir);

    let dernier = performance.now(), raf = 0;
    const boucle = (now: number) => {
      const dt = Math.min(0.05, (now - dernier) / 1000); dernier = now; const t = now / 1000;
      ctxA.clearRect(0, 0, W, H); ctxV.clearRect(0, 0, W, H);
      const vent = a.vent ? Math.sin(t * 0.23) * 14 + Math.sin(t * 0.07 + 1) * 10 + 6 : 4;
      for (let i = 0; i < feuilles.length; i++) {
        const f = feuilles[i]; f.age += dt;
        f.y += (22 + 34 * f.z) * vitesse * dt * (f.deLArbre ? Math.min(1, 0.35 + f.age) : 1) - souffle * 1.1 * f.z * dt;
        f.x += Math.sin(f.ph + t) * souffle * 0.25 * f.z * dt;
        f.x += (f.vx + vent) * f.z * dt; f.vx *= 1 - 0.12 * dt;
        f.rot += f.vr * dt; f.flip += f.vf * dt;
        if (f.devant) f.z = Math.min(1.45, f.z + 0.05 * dt);
        if (f.x < -30) f.x = W + 20; if (f.x > W + 30) f.x = -20;
        if (f.y > H + 30) feuilles[i] = nouvelle(false);
        dessiner(f.devant ? ctxV : ctxA, f, t);
      }
      souffle *= Math.pow(0.03, dt);
      for (let i = pluie.length - 1; i >= 0; i--) {
        const g = pluie[i]; g.y += g.vy * dt; g.x += Math.sin(t * 2 + g.ph) * 18 * dt; g.rot += g.vr * dt;
        if (g.y > H + 40) { pluie.splice(i, 1); continue; }
        ctxV.save(); ctxV.translate(g.x, g.y); ctxV.rotate(g.rot);
        if (g.type === 'gland') dessinerGland(ctxV, g.s);
        else if (g.type === 'pin') dessinerPin(ctxV, g.s);
        else { const sc = g.s / 40; ctxV.scale(sc, sc); ctxV.translate(-20, -20); ctxV.fillStyle = g.c; ctxV.fill(FORMES.erable!); ctxV.strokeStyle = 'rgba(60,25,8,.45)'; ctxV.lineWidth = 1.4; ctxV.stroke(nervure); }
        ctxV.restore();
      }
      for (let i = eclats.length - 1; i >= 0; i--) {
        const e = eclats[i]; e.v += dt;
        if (e.v > e.vie) { eclats.splice(i, 1); continue; }
        e.vy += 380 * dt; e.x += e.vx * dt; e.y += e.vy * dt; e.r += e.vr * dt;
        ctxV.save(); ctxV.globalAlpha = 1 - e.v / e.vie; ctxV.translate(e.x, e.y); ctxV.rotate(e.r);
        ctxV.fillStyle = e.c; ctxV.beginPath(); ctxV.moveTo(0, -e.s); ctxV.lineTo(e.s * 0.8, e.s * 0.6); ctxV.lineTo(-e.s * 0.7, e.s * 0.5); ctxV.closePath(); ctxV.fill(); ctxV.restore();
      }
      raf = requestAnimationFrame(boucle);
    };
    const demarrer = () => { cancelAnimationFrame(raf); if (!document.hidden) { dernier = performance.now(); raf = requestAnimationFrame(boucle); } };
    document.addEventListener('visibilitychange', demarrer);
    demarrer();

    // Toucher une feuille de devant : elle éclate (la carte en dessous ne s'ouvre pas)
    let bloquerClic = false;
    const toucher = (ev: PointerEvent) => {
      if (!a.eclate) return;
      let cible = -1, meil = 1e9;
      feuilles.forEach((f, i) => { if (!f.devant) return; const d = Math.hypot(f.xAff - ev.clientX, f.y - ev.clientY); if (d < f.r + 12 && d < meil) { meil = d; cible = i; } });
      if (cible < 0) return;
      ev.preventDefault(); ev.stopPropagation(); bloquerClic = true; setTimeout(() => { bloquerClic = false; }, 500);
      const f = feuilles[cible];
      if (f.doree) {
        for (let k = 0; k < 20; k++) {
          const ang = Math.random() * Math.PI * 2, v = 80 + Math.random() * 130;
          eclats.push({ x: f.xAff, y: f.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 70, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14, s: 2.5 + Math.random() * 4, c: k % 2 ? '#facc15' : '#fff3b0', v: 0, vie: 0.8 + Math.random() * 0.5 });
        }
        toast('🌟 Tu as attrapé la feuille dorée !');
      }
      for (let k = 0; k < 9; k++) {
        const ang = Math.random() * Math.PI * 2, v = 70 + Math.random() * 110;
        eclats.push({ x: f.xAff, y: f.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 60, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14, s: 2 + Math.random() * 3.5 * f.z, c: f.c, v: 0, vie: 0.55 + Math.random() * 0.35 });
      }
      feuilles[cible] = nouvelle(false);
      if (a.son) bruitFeuille();
    };
    const clic = (ev: MouseEvent) => { if (bloquerClic) { ev.preventDefault(); ev.stopPropagation(); bloquerClic = false; } };
    window.addEventListener('pointerdown', toucher, { capture: true });
    window.addEventListener('click', clic, { capture: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', taille);
      document.removeEventListener('visibilitychange', demarrer);
      window.removeEventListener('pointerdown', toucher, { capture: true });
      window.removeEventListener('scroll', auDefile);
      window.removeEventListener(EVT_VALIDATION, pleuvoir);
      window.removeEventListener('click', clic, { capture: true });
    };
  }, [a, arbre, calme, r.quantite, r.vitesse]);

  const feuDeJour = !soir || !a.grandFeuSoir;
  return (
    <>
      {/* Derrière les cartes : feuilles « loin » + arbre (il défile avec l'accueil) */}
      <div aria-hidden className={`saison-decor contents pointer-events-none ${calme ? 'saison-calme' : ''}`}>
        {a.feuilles && !calme && <canvas ref={arriereRef} className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />}
        {a.arbre && (
          <svg ref={arbreRef} viewBox={`0 0 ${ARBRE_VB.w} ${ARBRE_VB.h}`} className="pointer-events-none absolute -z-[5] overflow-visible"
            style={{ top: 6, left: -6, width: largeurArbre }} dangerouslySetInnerHTML={{ __html: arbre.svg }} />
        )}
      </div>
      {createPortal(
        <div aria-hidden className={`saison-decor pointer-events-none ${calme ? 'saison-calme' : ''}`}>
          {/* 🍂 Tapis de feuilles à gauche de la cheminée (sous elle : la cheminée reste devant) */}
          <TapisFeuilles a={a} userId={userId} calme={calme} defile={defile} largeurCheminee={a.cheminee ? Math.min(window.innerWidth * 0.3, 112) : 0} />
          {a.cheminee && (
            <svg viewBox={`0 0 ${CHEMINEE_VB.w} ${CHEMINEE_VB.h}`}
              className={`fixed bottom-0 z-30 transition-opacity duration-500 ${feuDeJour && a.petitFeuJour ? 'saison-feu-jour' : ''}`}
              style={{ right: 'max(-6px, env(safe-area-inset-right, 0px))', width: 'min(30vw, 112px)', marginBottom: 'env(safe-area-inset-bottom, 0px)', opacity: defile ? 0.3 : 1 }}
              dangerouslySetInnerHTML={{ __html: cheminee }} />
          )}
          {a.feuilles && !calme && <canvas ref={avantRef} className="fixed inset-0 z-40 h-full w-full" />}
          {soir && a.grandFeuSoir && a.cheminee && <div className="fixed inset-0 z-[29] saison-voile-soir" />}
        </div>,
        document.body,
      )}
      {a.feuilles && a.eclate && a.messageSemaine && !calme && <MessageFeuilles userId={userId} />}
    </>
  );
}

/** 🍁 Message éphémère « Attrape les feuilles ! » : 1 fois par semaine (1er jour d'ouverture à partir du lundi) */
function MessageFeuilles({ userId }: { userId: string | null }) {
  const cle = `dinislam_msg_feuilles_${userId ?? 'invite'}`;
  const semaine = lundiDeLaSemaine();
  const [visible, setVisible] = useState(false);
  const [part, setPart] = useState(false);
  useEffect(() => {
    let deja: string | null = null;
    try { deja = localStorage.getItem(cle); } catch { /* stockage bloqué */ }
    if (deja === semaine) return;
    const t1 = window.setTimeout(() => { setVisible(true); try { localStorage.setItem(cle, semaine); } catch { /* */ } }, 1800);
    return () => clearTimeout(t1);
  }, [cle, semaine]);
  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => fermer(), 12000);
    return () => clearTimeout(t);
  }, [visible]);
  const fermer = () => { setPart(true); window.setTimeout(() => setVisible(false), 450); };
  if (!visible) return null;
  return createPortal(
    <div role="status" className={`fixed inset-x-0 z-[60] flex justify-center px-4 ${part ? 'saison-msg-part' : 'saison-msg-arrive'}`}
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border-2 border-[#e2c08f] bg-gradient-to-br from-[#fff8ee] via-[#fbe7c8] to-[#f6d3a8] p-4 pr-10 shadow-[0_16px_40px_-12px_rgba(120,60,20,.55)]">
        <svg viewBox="0 0 40 40" aria-hidden className="saison-msg-feuille absolute -left-2 -top-3 h-14 w-14 opacity-90"><path d={ERABLE} fill="#e8572a" stroke="#4a2c1a" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        <svg viewBox="0 0 40 40" aria-hidden className="saison-msg-feuille b absolute -bottom-3 right-10 h-9 w-9 opacity-80"><path d={ERABLE} fill="#f2a33a" stroke="#4a2c1a" strokeWidth="2" strokeLinejoin="round" /></svg>
        <div className="relative flex items-center gap-3 pl-8">
          <div className="min-w-0">
            <p className="text-base font-extrabold text-[#7a3d17]">Attrape les feuilles ! 🍂</p>
            <p className="text-sm leading-snug text-[#5a3a22]">Les feuilles qui passent <b>devant</b> les cartes s'attrapent : touche-en une, elle éclate avec un petit <i>crac</i> de feuille sèche&nbsp;!</p>
          </div>
        </div>
        <button type="button" onClick={fermer} aria-label="Fermer le message"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-[#7a3d17] font-bold">✕</button>
        <button type="button" onClick={fermer}
          className="relative mt-3 ml-8 rounded-full bg-[#b5562b] px-4 py-1.5 text-sm font-bold text-white shadow active:scale-95">🍁 J'essaie !</button>
      </div>
    </div>,
    document.body,
  );
}
