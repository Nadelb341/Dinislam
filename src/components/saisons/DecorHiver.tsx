import { habitSvg, PAUSE_MS, toucherCompagnon, useHabitDuJour, useTailleCompagnon } from './compagnonEvenement';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import type { ReglagesSaisons } from '@/lib/saisons';
import { lundiDeLaSemaine } from '@/lib/saisons';
import { EVT_VALIDATION, preparerSon, sonCristal } from '@/lib/sonSaison';
import {
  CHALET_VB, LANTERNES_SVG, MOTS_HIVER, NEIGE_SVG, OURS_SVG, PERSOS, TAS_NEIGE_SVG, dessinerChalet, dessinerChemineeHiver,
} from './dessinsHiver';

/**
 * ❄️ Décor d'hiver de l'accueil (maquette validée par Nadia le 2026-11-04, https://claude.ai/artifact/EM2t21xMZFFrMgWBGB5XuC) :
 * - flocons derrière (petits, flous) et devant (gros, dessinés) les cartes ; toucher un flocon de devant = paillettes + son de cristal
 * - chalet en haut à gauche (fenêtres allumées le soir), ciel du soir léger, givre dans les coins le matin (Fajr → Dhohr)
 * - neige brillante en bas avec lanternes, ours polaire qui dort, pingouin OU bonhomme de neige (ils alternent à chaque connexion)
 *   qui se promène, glisse, laisse des traces et plonge dans un tas de neige ; toucher le personnage → « Je me repose ? »
 * - cheminée d'hiver en bas à droite (petit feu le jour, grand feu + chocolat chaud le soir), transparente pendant le défilement
 * - givre et neige qui s'accumule sur les cartes (toucher une carte fait tomber sa neige), neige sur le titre
 * - effets 15 vent au défilement, 16 vitre givrée après 1 min sans toucher, 17 pluie dorée à chaque validation,
 *   18 l'ours montre un mot de l'hiver une fois par jour, 20 flocon doré rare
 * Seul le personnage (et l'ours) se touchent ; le reste ne bloque aucun toucher.
 */

interface Flocon { z: number; devant: boolean; rare: boolean; x: number; y: number; vx: number; rot: number; vr: number; bal: number; fb: number; ph: number; xAff: number; r: number }
interface Eclat { x: number; y: number; vx: number; vy: number; s: number; c: string; v: number; vie: number }
interface Dore { x: number; y: number; vy: number; r: number; rot: number; vr: number; ph: number; v: number }
type Perso = 'pingouin' | 'bonhomme';

const NEIGE_DEPART = 14, NEIGE_MAX = 22;
const ATTENTE_VITRE = 60_000;

/** Pingouin ou bonhomme de neige : on change à chaque nouvelle connexion (gardé le temps de la session) */
function choisirPerso(userId: string | null): Perso {
  const cle = `dinislam_hiver_perso_${userId ?? 'invite'}`;
  try {
    const s = sessionStorage.getItem(cle);
    if (s === 'pingouin' || s === 'bonhomme') return s;
    const p: Perso = localStorage.getItem(cle) === 'pingouin' ? 'bonhomme' : 'pingouin';
    localStorage.setItem(cle, p); sessionStorage.setItem(cle, p);
    return p;
  } catch { return 'pingouin'; }
}

/** Dessine un flocon à 6 branches centré en (0,0) */
function trace(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, c = Math.cos(a), s = Math.sin(a);
    ctx.moveTo(0, 0); ctx.lineTo(c * r, s * r);
    for (const k of [0.5, 0.78]) {
      const bx = c * r * k, by = s * r * k;
      for (const d of [-1, 1]) { const b = a + d * 0.75; ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(b) * r * 0.28, by + Math.sin(b) * r * 0.28); }
    }
  }
}

export function DecorHiver({ r, soir, matin, userId }: { r: ReglagesSaisons; soir: boolean; matin: boolean; userId: string | null }) {
  const h = r.hiver;
  const reduit = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const calme = reduit && !r.animerToujours;
  const chalet = useMemo(() => dessinerChalet(), []);
  const cheminee = useMemo(() => dessinerChemineeHiver(), []);
  const perso = useMemo(() => choisirPerso(userId), [userId]);
  const arriereRef = useRef<HTMLCanvasElement>(null);
  const avantRef = useRef<HTMLCanvasElement>(null);
  const persoRef = useRef<SVGSVGElement>(null);
  const tracesRef = useRef<SVGSVGElement>(null);
  const tasRef = useRef<SVGSVGElement>(null);
  const eclatsRef = useRef<Eclat[]>([]);
  // 🦔 Compagnon (2026-11-11) : touché → arrêt 10 s + message ; il grandit un peu chaque jour
  const pauseJusqua = useRef(0);
  const echelle = useTailleCompagnon();
  const habit = useHabitDuJour(userId);
  const echelleRef = useRef(echelle);
  echelleRef.current = echelle;
  const [defile, setDefile] = useState(false);
  const [bulle, setBulle] = useState(false);
  const [repos, setRepos] = useState(() => { try { return sessionStorage.getItem('dinislam_hiver_repos') === '1'; } catch { return false; } });
  const [mot, setMot] = useState<[string, string] | null>(null);
  const [ourEveil, setOursEveil] = useState(false);
  const [givree, setGivree] = useState(false);
  const reposRef = useRef(repos);
  reposRef.current = repos;

  useEffect(() => { preparerSon(); }, []);

  // Classes sur <html> : couleurs du soir, givre du matin, neige/givre sur les cartes et sur le titre
  useEffect(() => {
    const html = document.documentElement;
    const classes: [string, boolean][] = [
      ['saison-soir', soir], ['hiver-neige-cartes', h.neigeCartes], ['hiver-givre', h.givre], ['hiver-titre', h.neigeTitre],
    ];
    classes.forEach(([c, v]) => html.classList.toggle(c, v));
    return () => classes.forEach(([c]) => html.classList.remove(c));
  }, [soir, h.neigeCartes, h.givre, h.neigeTitre]);

  // Neige qui s'accumule doucement sur les cartes (limite), elle tombe quand on touche la carte
  useEffect(() => {
    if (!h.neigeCartes) return;
    const t = window.setInterval(() => {
      document.querySelectorAll<HTMLElement>('.carte-accueil').forEach((m) => {
        const v = m.style.getPropertyValue('--n'); const n = v ? parseFloat(v) : NEIGE_DEPART;
        if (n < NEIGE_MAX) m.style.setProperty('--n', `${Math.min(NEIGE_MAX, n + 0.5)}px`);
      });
    }, 2500);
    return () => clearInterval(t);
  }, [h.neigeCartes]);

  // Cheminée presque transparente pendant le défilement
  useEffect(() => {
    if (!h.transparente) return;
    let t = 0;
    const f = () => { setDefile(true); clearTimeout(t); t = window.setTimeout(() => setDefile(false), 600); };
    window.addEventListener('scroll', f, { passive: true });
    return () => { window.removeEventListener('scroll', f); clearTimeout(t); };
  }, [h.transparente]);

  // 16 · Vitre givrée : 1 minute sans toucher l'écran → le givre envahit les bords ; un toucher l'essuie
  useEffect(() => {
    if (!h.vitre || calme) return;
    let t = 0;
    const reveil = () => { setGivree(false); clearTimeout(t); t = window.setTimeout(() => setGivree(true), ATTENTE_VITRE); };
    const evts = ['pointerdown', 'scroll', 'keydown'] as const;
    evts.forEach((e) => window.addEventListener(e, reveil, { passive: true }));
    reveil();
    return () => { clearTimeout(t); evts.forEach((e) => window.removeEventListener(e, reveil)); };
  }, [h.vitre, calme]);

  // 18 · L'ours se réveille une fois par jour et montre un mot de l'hiver
  const montrerMot = () => {
    const jour = Math.floor(Date.now() / 86_400_000);
    setMot(MOTS_HIVER[jour % MOTS_HIVER.length]); setOursEveil(true);
  };
  useEffect(() => {
    if (!h.ours || !h.motOurs) return;
    const cle = `dinislam_ours_mot_${userId ?? 'invite'}`, auj = new Date().toDateString();
    let deja: string | null = null;
    try { deja = localStorage.getItem(cle); } catch { /* */ }
    if (deja === auj) return;
    const t = window.setTimeout(() => { montrerMot(); try { localStorage.setItem(cle, auj); } catch { /* */ } }, 6000);
    return () => clearTimeout(t);
  }, [h.ours, h.motOurs, userId]);
  useEffect(() => {
    if (!mot) return;
    const t = window.setTimeout(() => { setMot(null); setOursEveil(false); }, 10_000);
    return () => clearTimeout(t);
  }, [mot]);

  // Flocons (2 calques) + éclats + vent du défilement + pluie dorée + flocon doré
  useEffect(() => {
    if (!h.flocons || calme) return;
    const cvA = arriereRef.current, cvV = avantRef.current;
    if (!cvA || !cvV) return;
    const ctxA = cvA.getContext('2d'), ctxV = cvV.getContext('2d');
    if (!ctxA || !ctxV) return;
    let W = 0, H = 0;
    const taille = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight;
      for (const c of [cvA, cvV]) { c.width = W * dpr; c.height = H * dpr; }
      for (const c of [ctxA, ctxV]) c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    taille(); window.addEventListener('resize', taille);
    const vitesse = [0, 0.55, 0.75, 1, 1.3, 1.6][r.vitesse] ?? 1;
    const nouveau = (depart: boolean): Flocon => {
      const k = Math.random(); let devant: boolean, z: number;
      if (k < 0.5) { devant = false; z = 0.2 + Math.random() * 0.3; }
      else if (k < 0.85) { devant = h.devantDerriere && Math.random() < 0.5; z = 0.5 + Math.random() * 0.3; }
      else { devant = h.devantDerriere; z = 0.85 + Math.random() * 0.4; }
      return {
        rare: devant && h.floconDore && Math.random() < 0.03, z, devant,
        x: Math.random() * W, y: depart ? Math.random() * H : -20 - Math.random() * 40, vx: -8 + Math.random() * 16,
        rot: Math.random() * 6.3, vr: (Math.random() - 0.5) * 0.8, bal: 6 + Math.random() * 14, fb: 0.4 + Math.random() * 0.8, ph: Math.random() * 6.3, xAff: 0, r: 0,
      };
    };
    const n = Math.max(10, Math.min(90, Math.round(r.quantite * 2.3)));
    const flocons: Flocon[] = Array.from({ length: n }, () => nouveau(true));
    const eclats = eclatsRef.current;
    const dores: Dore[] = [];

    const dessiner = (f: Flocon, t: number) => {
      const xb = f.x + Math.sin(t * f.fb + f.ph) * f.bal * f.z; f.xAff = xb;
      if (!f.devant && f.z >= 0.5) {
        const rr = 3 + 6 * f.z; f.r = rr;
        ctxA.save(); ctxA.globalAlpha = 0.75; ctxA.translate(xb, f.y); ctxA.rotate(f.rot); ctxA.lineCap = 'round';
        trace(ctxA, rr); ctxA.strokeStyle = 'rgba(70,110,170,.45)'; ctxA.lineWidth = 2.6; ctxA.stroke();
        trace(ctxA, rr); ctxA.strokeStyle = '#fff'; ctxA.lineWidth = 1.3; ctxA.stroke(); ctxA.restore(); return;
      }
      if (!f.devant) {
        const rr = 1.4 + f.z * 4.5; f.r = rr;
        const g = ctxA.createRadialGradient(xb, f.y, 0, xb, f.y, rr); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctxA.fillStyle = g; ctxA.beginPath(); ctxA.arc(xb, f.y, rr, 0, 7); ctxA.fill();
        ctxA.fillStyle = 'rgba(150,180,220,.35)'; ctxA.beginPath(); ctxA.arc(xb, f.y, rr * 0.35, 0, 7); ctxA.fill(); return;
      }
      const rr = 3 + 7 * f.z; f.r = rr;
      ctxV.save(); ctxV.translate(xb, f.y); ctxV.rotate(f.rot); ctxV.lineCap = 'round';
      trace(ctxV, rr); ctxV.strokeStyle = 'rgba(70,110,170,.55)'; ctxV.lineWidth = 3.2; ctxV.stroke();
      if (f.rare) { ctxV.shadowColor = 'rgba(250,204,21,.9)'; ctxV.shadowBlur = 10; }
      trace(ctxV, rr); ctxV.strokeStyle = f.rare ? '#facc15' : '#ffffff'; ctxV.lineWidth = f.rare ? 2.2 : 1.7; ctxV.stroke(); ctxV.shadowBlur = 0;
      ctxV.fillStyle = '#fff'; ctxV.beginPath(); ctxV.arc(0, 0, 1.6, 0, 7); ctxV.fill();
      ctxV.restore();
    };

    // 15 · vent quand on fait défiler
    let souffle = 0, dernierY = window.scrollY;
    const auDefile = () => { const dy = window.scrollY - dernierY; dernierY = window.scrollY; if (h.ventDefile) souffle = Math.max(-500, Math.min(500, souffle + dy * 3)); };
    window.addEventListener('scroll', auDefile, { passive: true });
    // 17 · pluie de flocons dorés à chaque validation
    const pluie = () => {
      if (!h.pluieDoree) return;
      if (h.son) sonCristal();
      for (let i = 0; i < 46; i++) dores.push({ x: Math.random() * W, y: -10 - Math.random() * H * 0.5, vy: 70 + Math.random() * 80, r: 3 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 3, ph: Math.random() * 6, v: 0 });
    };
    window.addEventListener(EVT_VALIDATION, pluie);

    let dernier = performance.now(), raf = 0;
    const boucle = (now: number) => {
      const dt = Math.min(0.05, (now - dernier) / 1000); dernier = now; const t = now / 1000;
      ctxA.clearRect(0, 0, W, H); ctxV.clearRect(0, 0, W, H);
      const vent = Math.sin(t * 0.2) * 10 + Math.sin(t * 0.06 + 2) * 8;
      for (let i = 0; i < flocons.length; i++) {
        const f = flocons[i];
        f.y += (14 + 26 * f.z) * vitesse * dt - souffle * 1.1 * f.z * dt;
        f.x += (f.vx + vent) * f.z * dt + Math.sin(f.ph + t) * souffle * 0.25 * f.z * dt;
        f.rot += f.vr * dt; if (f.devant) f.z = Math.min(1.4, f.z + 0.04 * dt);
        if (f.x < -20) f.x = W + 10; if (f.x > W + 20) f.x = -10;
        if (f.y > H + 20) flocons[i] = nouveau(false);
        dessiner(f, t);
      }
      souffle *= Math.pow(0.03, dt);
      for (let i = dores.length - 1; i >= 0; i--) {
        const d = dores[i]; d.v += dt; d.y += d.vy * dt; d.x += Math.sin(d.v * 2 + d.ph) * 20 * dt; d.rot += d.vr * dt;
        if (d.y > H + 20) { dores.splice(i, 1); continue; }
        ctxV.save(); ctxV.translate(d.x, d.y); ctxV.rotate(d.rot); ctxV.lineCap = 'round'; ctxV.shadowColor = 'rgba(250,204,21,.8)'; ctxV.shadowBlur = 8;
        trace(ctxV, d.r); ctxV.strokeStyle = '#facc15'; ctxV.lineWidth = 1.8; ctxV.stroke(); ctxV.restore();
      }
      for (let i = eclats.length - 1; i >= 0; i--) {
        const e = eclats[i]; e.v += dt;
        if (e.v > e.vie) { eclats.splice(i, 1); continue; }
        e.vy += 90 * dt; e.x += e.vx * dt; e.y += e.vy * dt;
        ctxV.save(); ctxV.globalAlpha = 1 - e.v / e.vie; ctxV.fillStyle = e.c; ctxV.translate(e.x, e.y); ctxV.rotate(e.v * 6);
        ctxV.beginPath(); ctxV.moveTo(0, -e.s); ctxV.lineTo(e.s * 0.35, 0); ctxV.lineTo(0, e.s); ctxV.lineTo(-e.s * 0.35, 0); ctxV.closePath(); ctxV.fill(); ctxV.restore();
      }
      raf = requestAnimationFrame(boucle);
    };
    const demarrer = () => { cancelAnimationFrame(raf); if (!document.hidden) { dernier = performance.now(); raf = requestAnimationFrame(boucle); } };
    document.addEventListener('visibilitychange', demarrer);
    demarrer();

    // Toucher : un flocon de devant éclate (la carte dessous ne s'ouvre pas) ; sinon, toucher une carte fait tomber sa neige
    let bloquerClic = false;
    const toucher = (ev: PointerEvent) => {
      if (h.eclate) {
        let cible = -1, meil = 1e9;
        flocons.forEach((f, i) => { if (!f.devant) return; const d = Math.hypot(f.xAff - ev.clientX, f.y - ev.clientY); if (d < f.r + 12 && d < meil) { meil = d; cible = i; } });
        if (cible >= 0) {
          ev.preventDefault(); ev.stopPropagation(); bloquerClic = true; setTimeout(() => { bloquerClic = false; }, 500);
          const f = flocons[cible];
          if (f.rare) {
            for (let k = 0; k < 22; k++) { const a = Math.random() * 6.3, v = 60 + Math.random() * 110; eclats.push({ x: f.xAff, y: f.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, s: 2.5 + Math.random() * 3, c: k % 2 ? '#facc15' : '#fff7c2', v: 0, vie: 0.8 + Math.random() * 0.5 }); }
            toast('✨ Tu as attrapé le flocon doré !');
          }
          for (let k = 0; k < 12; k++) { const a = Math.random() * 6.3, v = 50 + Math.random() * 90; eclats.push({ x: f.xAff, y: f.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, s: 2 + Math.random() * 3, c: k % 3 ? '#ffffff' : '#bcd8ff', v: 0, vie: 0.6 + Math.random() * 0.4 }); }
          flocons[cible] = nouveau(false);
          if (h.son) sonCristal();
          return;
        }
      }
      const carte = h.neigeCartes ? (ev.target as HTMLElement | null)?.closest?.<HTMLElement>('.carte-accueil') : null;
      if (carte) {
        const v = carte.style.getPropertyValue('--n'); const nn = v ? parseFloat(v) : NEIGE_DEPART;
        const b = carte.getBoundingClientRect();
        for (let k = 0; k < Math.round(nn * 3); k++) eclats.push({ x: b.left + 10 + Math.random() * (b.width - 20), y: b.top, vx: (Math.random() - 0.5) * 30, vy: 10 + Math.random() * 30, s: 1.5 + Math.random() * 2, c: '#ffffff', v: 0, vie: 0.9 + Math.random() * 0.5 });
        carte.style.setProperty('--n', '0px');
      }
    };
    const clic = (ev: MouseEvent) => { if (bloquerClic) { ev.preventDefault(); ev.stopPropagation(); bloquerClic = false; } };
    window.addEventListener('pointerdown', toucher, { capture: true });
    window.addEventListener('click', clic, { capture: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', taille);
      window.removeEventListener('scroll', auDefile);
      window.removeEventListener(EVT_VALIDATION, pluie);
      document.removeEventListener('visibilitychange', demarrer);
      window.removeEventListener('pointerdown', toucher, { capture: true });
      window.removeEventListener('click', clic, { capture: true });
    };
  }, [h, calme, r.quantite, r.vitesse]);

  // Le pingouin / bonhomme de neige : marche, pause, glissade (6), traces (3), plongeon dans le tas (14)
  useEffect(() => {
    const el = persoRef.current;
    if (!h.neigeBas || !h.personnage || calme || !el) return;
    const P = { x: 70, dir: 1, mode: 'marche' as 'marche' | 'pause' | 'glisse' | 'plonge', t: 0, pas: 0, pied: 0, cool: 6, eclate: 0 };
    const poudreuse = (x: number, k: number) => {
      const tas = tasRef.current; if (tas) { tas.classList.remove('hiver-tas-secoue'); requestAnimationFrame(() => tas.classList.add('hiver-tas-secoue')); }
      const y = window.innerHeight - 16;
      for (let i = 0; i < Math.round(34 * k); i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 60 + Math.random() * 110;
        eclatsRef.current.push({ x: x + (Math.random() - 0.5) * 20, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: 1.6 + Math.random() * 2.6, c: i % 4 ? '#ffffff' : '#cfe2fb', v: 0, vie: 1 + Math.random() * 0.6 });
      }
    };
    const empreinte = (x: number, y: number, glisse: boolean) => {
      const sv = tracesRef.current; if (!sv || !h.traces) return;
      const e = document.createElementNS('http://www.w3.org/2000/svg', glisse ? 'rect' : 'ellipse');
      if (glisse) { e.setAttribute('x', String(x - 3)); e.setAttribute('y', String(y)); e.setAttribute('width', '7'); e.setAttribute('height', '2.2'); e.setAttribute('rx', '1'); }
      else { e.setAttribute('cx', String(x)); e.setAttribute('cy', String(y)); e.setAttribute('rx', perso === 'pingouin' ? '2.2' : '3'); e.setAttribute('ry', '1.2'); }
      e.setAttribute('fill', '#c3d6ee'); e.style.transition = 'opacity 6s linear'; sv.appendChild(e);
      requestAnimationFrame(() => requestAnimationFrame(() => { e.style.opacity = '0'; }));
      setTimeout(() => e.remove(), 6200);
    };
    let dernier = performance.now(), raf = 0;
    const boucle = (now: number) => {
      const dt = Math.min(0.05, (now - dernier) / 1000); dernier = now;
      const larg = window.innerWidth, limite = larg * 0.62, tasX = larg * 0.42;
      if (reposRef.current || now < pauseJusqua.current) { el.style.transform = `translateX(${P.x}px) scaleX(${P.dir}) scale(${echelleRef.current})`; raf = requestAnimationFrame(boucle); return; }
      if (P.mode === 'plonge') {
        P.t += dt;
        if (P.t < 0.4) { const k = P.t / 0.4; el.style.opacity = '1'; el.style.transform = `translateX(${tasX - 15}px) translateY(${-14 * Math.sin(k * Math.PI) + k * k * 26}px) scaleX(${P.dir}) scale(${echelleRef.current})`; }
        else if (P.t < 3) { if (P.eclate === 0) { P.eclate = 1; poudreuse(tasX, 1); } el.style.opacity = '0'; }
        else {
          if (P.eclate === 1) { P.eclate = 2; poudreuse(tasX, 0.45); P.dir *= -1; }
          el.style.opacity = '1'; el.style.transform = `translateX(${tasX - 15}px) translateY(${-10 * Math.max(0, (3.4 - P.t) / 0.4)}px) scaleX(${P.dir}) scale(${echelleRef.current})`;
          if (P.t > 3.4) { P.mode = 'marche'; P.t = 0; P.cool = 9; P.x = tasX - 15; P.eclate = 0; }
        }
        raf = requestAnimationFrame(boucle); return;
      }
      P.cool -= dt; P.t += dt;
      if (P.mode === 'pause' && P.t > 1.8) { P.mode = h.glissade && Math.random() < 0.35 ? 'glisse' : 'marche'; P.t = 0; }
      if (P.mode === 'marche' && P.t > 3 + Math.random() * 4) { P.mode = h.glissade && Math.random() < 0.5 ? 'glisse' : 'pause'; P.t = 0; }
      if (P.mode === 'glisse' && P.t > 1.6) { P.mode = 'marche'; P.t = 0; }
      const v = P.mode === 'marche' ? 16 : P.mode === 'glisse' ? 55 : 0;
      P.x += v * P.dir * dt;
      if (P.x > limite) P.dir = -1; if (P.x < -10) P.dir = 1;
      if (h.plongeon && P.mode === 'marche' && P.cool <= 0 && Math.abs(P.x + 15 - tasX) < 3) { P.mode = 'plonge'; P.t = 0; P.x = tasX - 15; }
      P.pas += Math.abs(v * dt);
      if (P.pas > (P.mode === 'glisse' ? 5 : 7)) { P.pas = 0; P.pied ^= 1; empreinte(P.x + 15 + (P.mode === 'glisse' ? 0 : (P.pied ? -3 : 3)), 36 + (P.mode === 'glisse' ? 0 : (P.pied ? 1 : -1)), P.mode === 'glisse'); }
      const dand = P.mode === 'marche' ? (perso === 'pingouin' ? `rotate(${Math.sin(P.t * 12) * 6}deg)` : `translateY(${-Math.abs(Math.sin(P.t * 7)) * 3}px)`)
        : P.mode === 'glisse' ? (perso === 'pingouin' ? 'rotate(70deg) translateY(10px)' : 'rotate(-8deg)') : '';
      el.style.transform = `translateX(${P.x}px) scaleX(${P.dir}) scale(${echelleRef.current})`;
      const corps = el.querySelector<SVGGElement>('.hiver-corps');
      if (corps) { corps.style.transformBox = 'fill-box'; corps.style.transformOrigin = '50% 100%'; corps.style.transform = dand; }
      raf = requestAnimationFrame(boucle);
    };
    const demarrer = () => { cancelAnimationFrame(raf); if (!document.hidden) { dernier = performance.now(); raf = requestAnimationFrame(boucle); } };
    document.addEventListener('visibilitychange', demarrer);
    demarrer();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', demarrer); };
  }, [h.neigeBas, h.personnage, h.traces, h.glissade, h.plongeon, calme, perso]);

  const reposer = (oui: boolean) => {
    setBulle(false);
    if (oui) { setRepos(true); try { sessionStorage.setItem('dinislam_hiver_repos', '1'); } catch { /* */ } }
  };
  const feuDeJour = !soir || !h.grandFeuSoir;
  const largeurChalet = [0, 76, 92, 110][r.tailleArbre] ?? 92;

  return (
    <>
      {/* Derrière les cartes : flocons « loin », chalet (il défile avec l'accueil), ciel du soir */}
      <div aria-hidden className={`hiver-decor contents pointer-events-none ${soir ? 'hiver-soir' : ''}`}>
        {h.flocons && !calme && <canvas ref={arriereRef} className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />}
        {h.cielSoir && soir && (
          <div className="pointer-events-none fixed inset-x-0 top-0 -z-[8] h-24 hiver-ciel">
            {Array.from({ length: 9 }, (_, i) => <span key={i} className="hiver-ciel-etoile" style={{ left: `${8 + i * 10.5}%`, top: 6 + (i * 17) % 40, animationDelay: `${-i * 0.3}s` }} />)}
          </div>
        )}
        {h.chalet && (
          <svg viewBox={`0 0 ${CHALET_VB.w} ${CHALET_VB.h}`} className="pointer-events-none absolute -z-[5] overflow-visible"
            style={{ top: 10, left: -4, width: largeurChalet }} dangerouslySetInnerHTML={{ __html: chalet }} />
        )}
      </div>
      {createPortal(
        <div className={`hiver-decor pointer-events-none ${soir ? 'hiver-soir' : ''} ${calme ? 'hiver-calme' : ''}`}>
          {h.givreMatin && matin && <div aria-hidden className="fixed inset-0 z-[35] hiver-givre-coins" />}
          {soir && <div aria-hidden className="fixed inset-0 z-[26] hiver-voile-soir" />}
          {h.neigeBas && (
            <>
              <svg aria-hidden viewBox="0 0 340 60" preserveAspectRatio="none" className="fixed inset-x-0 bottom-0 z-[27] h-[60px] w-full"
                style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }} dangerouslySetInnerHTML={{ __html: NEIGE_SVG + (h.lanternes ? LANTERNES_SVG : '') }} />
              <svg ref={tracesRef} aria-hidden className="fixed bottom-0 left-0 z-[28] h-10 w-full" viewBox={`0 0 ${typeof window !== 'undefined' ? window.innerWidth : 390} 40`} preserveAspectRatio="none" />
              {h.ours && (
                <button type="button" aria-label="L'ours polaire : touche-le pour voir le mot de l'hiver" onClick={() => h.motOurs && montrerMot()}
                  className={`pointer-events-auto fixed bottom-2 left-1.5 z-[28] w-[58px] ${ourEveil ? 'hiver-ours-reveil' : ''}`}>
                  <svg viewBox="0 0 60 48" aria-hidden dangerouslySetInnerHTML={{ __html: OURS_SVG }} />
                </button>
              )}
              {h.personnage && (
                <svg ref={persoRef} viewBox="0 0 30 38" role="button" tabIndex={0}
                  aria-label={perso === 'pingouin' ? "Le pingouin : touche-le pour qu'il te parle" : "Le bonhomme de neige : touche-le pour qu'il te parle"}
                  onClick={(e) => { e.stopPropagation(); if (repos) { setRepos(false); try { sessionStorage.removeItem('dinislam_hiver_repos'); } catch { /* */ } } else if (toucherCompagnon(e.currentTarget, perso === 'pingouin' ? 'Le pingouin' : 'Le bonhomme de neige')) pauseJusqua.current = performance.now() + PAUSE_MS; else setBulle(true); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') setBulle(true); }}
                  className="pointer-events-auto fixed bottom-1.5 left-0 z-[29] h-[38px] w-[30px] cursor-pointer overflow-visible outline-none [-webkit-tap-highlight-color:transparent]"
                  style={{ transform: 'translateX(70px)', transformOrigin: '50% 100%' }} dangerouslySetInnerHTML={{ __html: PERSOS[perso] + habitSvg(habit, 30, 38) }} />
              )}
              {h.personnage && h.plongeon && (
                <svg ref={tasRef} aria-hidden viewBox="0 0 60 26" className="fixed bottom-[3px] z-[30] h-[26px] w-[60px] overflow-visible" style={{ left: 'calc(42% - 30px)' }}
                  dangerouslySetInnerHTML={{ __html: TAS_NEIGE_SVG }} />
              )}
            </>
          )}
          {bulle && (
            <div className="pointer-events-auto fixed bottom-14 left-2 z-[60] w-56 rounded-2xl border-2 border-[#bcd3ee] bg-white p-2.5 text-xs text-[#1e3a8a] shadow-[0_10px_24px_-10px_rgba(30,60,120,.45)]">
              <b className="block text-sm">{perso === 'pingouin' ? '🐧' : '⛄'} Je me repose ?</b>
              Je reste tranquille jusqu'à ta prochaine connexion.
              <div className="mt-2 flex gap-1.5">
                <button type="button" onClick={() => reposer(true)} className="flex-1 rounded-full bg-[#3f6fb5] px-2 py-1 font-bold text-white">Oui, repose-toi</button>
                <button type="button" onClick={() => reposer(false)} className="flex-1 rounded-full bg-[#e1ebf8] px-2 py-1 font-bold text-[#1e3a8a]">Non, continue</button>
              </div>
            </div>
          )}
          {mot && (
            <div role="status" className="hiver-bulle-in pointer-events-auto fixed bottom-16 left-1.5 z-[60] min-w-[160px] rounded-2xl border-2 border-[#bcd3ee] bg-white py-2 pl-2.5 pr-8 text-[#1e3a8a] shadow-[0_10px_24px_-10px_rgba(30,60,120,.45)]">
              <small className="block text-[10px] font-bold text-[#5d6f88]">❄️ Mot de l'hiver du jour</small>
              <p className="font-arabic text-2xl leading-relaxed text-[#14213d]" dir="rtl">{mot[0]}</p>
              <p className="text-xs">{mot[1]}</p>
              <button type="button" aria-label="Fermer" onClick={() => { setMot(null); setOursEveil(false); }}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-extrabold text-white">✕</button>
            </div>
          )}
          {h.cheminee && (
            <svg aria-hidden viewBox="0 0 200 172"
              className={`fixed bottom-0 z-30 transition-opacity duration-500 ${feuDeJour && h.petitFeuJour ? 'hiver-feu-jour' : ''} ${h.chocolat && soir ? 'hiver-chocolat-visible' : ''}`}
              style={{ right: 'max(-6px, env(safe-area-inset-right, 0px))', width: 'min(30vw, 112px)', marginBottom: 'env(safe-area-inset-bottom, 0px)', opacity: defile ? 0.3 : 1 }}
              dangerouslySetInnerHTML={{ __html: cheminee }} />
          )}
          {h.flocons && !calme && <canvas ref={avantRef} className="fixed inset-0 z-40 h-full w-full" />}
          {h.vitre && <div aria-hidden className={`fixed inset-0 z-[45] hiver-vitre ${givree ? 'givree' : ''}`} />}
        </div>,
        document.body,
      )}
      {h.flocons && h.eclate && h.messageSemaine && !calme && <MessageFlocons userId={userId} />}
    </>
  );
}

/** ❄️ Message éphémère « Attrape les flocons ! » : 1 fois par semaine (1er jour d'ouverture à partir du lundi) */
function MessageFlocons({ userId }: { userId: string | null }) {
  const cle = `dinislam_msg_flocons_${userId ?? 'invite'}`;
  const semaine = lundiDeLaSemaine();
  const [visible, setVisible] = useState(false);
  const [part, setPart] = useState(false);
  const fermer = () => { setPart(true); window.setTimeout(() => setVisible(false), 450); };
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
  if (!visible) return null;
  return createPortal(
    <div role="status" className={`fixed inset-x-0 z-[60] flex justify-center px-4 ${part ? 'saison-msg-part' : 'saison-msg-arrive'}`}
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 110px)' }}>
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border-2 border-[#bcd3ee] bg-gradient-to-br from-white via-[#e8f1fc] to-[#dbe8f8] p-4 pr-10 shadow-[0_16px_40px_-12px_rgba(30,60,120,.5)]">
        <p className="text-base font-extrabold text-[#1e3a8a]">❄️ Attrape les flocons !</p>
        <p className="text-sm leading-snug text-[#34465f]">Les flocons qui passent <b>devant</b> les cartes s'attrapent : touche-en un, il éclate en paillettes avec un petit son de cristal&nbsp;!</p>
        <button type="button" onClick={fermer} aria-label="Fermer le message"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 font-bold text-[#1e3a8a]">✕</button>
        <button type="button" onClick={fermer} className="mt-3 rounded-full bg-[#3f6fb5] px-4 py-1.5 text-sm font-bold text-white shadow active:scale-95">❄️ J'essaie !</button>
      </div>
    </div>,
    document.body,
  );
}
