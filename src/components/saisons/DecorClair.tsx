import { habitSvg, PAUSE_MS, toucherCompagnon, useHabitDuJour, useTailleCompagnon } from './compagnonEvenement';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import type { ReglagesSaisons } from '@/lib/saisons';
import { lundiDeLaSemaine } from '@/lib/saisons';
import { EVT_VALIDATION, preparerSon, sonPlop, sonTintement } from '@/lib/sonSaison';
import {
  ANIMAUX, LUNE_SVG, MOTS, NUAGE_SVG, OISEAU_SVG, TORTUE_SVG, arbrePrintemps, bandeEte, bandePrintemps, palmiersEte, soleilEte, soleilPrintemps,
  type AnimalClair, type Clair,
} from './dessinsPrintempsEte';

/**
 * 🌸☀️ Décor du printemps et de l'été (demande de Nadia du 2026-11-04, même principe que l'automne et l'hiver) :
 * - printemps : papillons et abeilles qui volent, feuilles vertes et pétales qui tombent ; soleil à rayons pointus en haut à gauche ;
 *   nuages autour du titre ; grand arbre en bas à droite avec un oiseau ; prairie de marguerites en bas ; lapin / escargot / biche
 *   (à tour de rôle à chaque connexion) qui plonge dans une touffe de fleurs
 * - été : bulles qui montent et mouettes au loin ; soleil encore plus brillant ; palmiers et transat ; plage (mer qui ondule + sable) ;
 *   crabe (plonge dans le sable) ou dauphin (saute hors de l'eau et éclabousse), à tour de rôle
 * - le soir (Maghrib → Fajr) : la lune remplace le soleil, ciel du soir, lucioles ; le matin au printemps : rosée qui brille
 * - mêmes effets que l'hiver : attraper (papillon qui s'envole en paillettes / bulle qui éclate) avec son, vent au défilement,
 *   pluie à chaque validation (pétales et coccinelles / étoiles de mer et coquillages), élément doré rare, mot du jour de l'oiseau / la tortue,
 *   « Je me repose ? » en touchant l'animal, message de la semaine. Rien d'autre ne bloque les touchers.
 */

type Kind = 'papillon' | 'abeille' | 'feuille' | 'petale' | 'bulle' | 'mouette';
interface Volant { k: Kind; devant: boolean; z: number; x: number; y: number; ang: number; ph: number; rot: number; vr: number; c1: string; c2: string; rare: boolean; fuite: number; xAff: number; yAff: number; r: number }
interface Eclat { x: number; y: number; vx: number; vy: number; s: number; c: string; v: number; vie: number }
interface Goutte { k: 'petale' | 'marguerite' | 'coccinelle' | 'etoile' | 'coquillage' | 'bulle'; x: number; y: number; vy: number; rot: number; vr: number; s: number; ph: number; c: string }

const AILES: [string, string][] = [['#f26b38', '#f7b733'], ['#5aa9e6', '#a7d8f5'], ['#f48fb1', '#fce4ec'], ['#f9d54a', '#fff1a8'], ['#9b7fe0', '#d9cdf7']];
const VERTS = ['#8cc63f', '#7cb342', '#9fd14a', '#5cae38'];
const PETALES = ['#ffffff', '#ffd1dc', '#ffe8ef', '#fff4c2'];
const ANIMAUX_SAISON: Record<Clair, AnimalClair[]> = { printemps: ['lapin', 'escargot', 'biche'], ete: ['crabe', 'dauphin'] };

/** L'animal change à chaque nouvelle connexion (gardé le temps de la session) */
function choisirAnimal(saison: Clair, userId: string | null): AnimalClair {
  const liste = ANIMAUX_SAISON[saison], cle = `dinislam_${saison}_animal_${userId ?? 'invite'}`;
  try {
    const s = sessionStorage.getItem(cle) as AnimalClair | null;
    if (s && liste.includes(s)) return s;
    const avant = localStorage.getItem(cle) as AnimalClair | null;
    const p = liste[(Math.max(-1, avant ? liste.indexOf(avant) : -1) + 1) % liste.length];
    localStorage.setItem(cle, p); sessionStorage.setItem(cle, p);
    return p;
  } catch { return liste[0]; }
}

/* ---------- Dessins dans le canevas ---------- */
function dessinerPapillon(ctx: CanvasRenderingContext2D, s: number, battement: number, c1: string, c2: string, dore: boolean) {
  if (dore) { ctx.shadowColor = 'rgba(250,204,21,.95)'; ctx.shadowBlur = 12; }
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(58,42,32,.75)';
  for (const cote of [-1, 1]) {
    ctx.save(); ctx.scale(cote * battement, 1);
    ctx.beginPath(); ctx.ellipse(s * 0.5, -s * 0.28, s * 0.55, s * 0.4, -0.55, 0, Math.PI * 2); ctx.fillStyle = c1; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(s * 0.38, s * 0.34, s * 0.34, s * 0.27, 0.55, 0, Math.PI * 2); ctx.fillStyle = c2; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(s * 0.55, -s * 0.33, s * 0.12, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fill();
    ctx.restore();
  }
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.1, s * 0.5, 0, 0, Math.PI * 2); ctx.fillStyle = '#3a2a20'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-s * 0.04, -s * 0.45); ctx.quadraticCurveTo(-s * 0.2, -s * 0.8, -s * 0.3, -s * 0.85); ctx.moveTo(s * 0.04, -s * 0.45); ctx.quadraticCurveTo(s * 0.2, -s * 0.8, s * 0.3, -s * 0.85); ctx.stroke();
}
function dessinerAbeille(ctx: CanvasRenderingContext2D, s: number, battement: number, gauche: boolean) {
  if (gauche) ctx.scale(-1, 1);
  ctx.fillStyle = 'rgba(232,244,255,.85)'; ctx.strokeStyle = 'rgba(58,42,32,.5)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.ellipse(-s * 0.15, -s * 0.45, s * 0.28, s * 0.4 * battement + 0.5, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(s * 0.12, -s * 0.45, s * 0.24, s * 0.34 * battement + 0.5, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.55, s * 0.38, 0, 0, Math.PI * 2); ctx.fillStyle = '#f9c80e'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#3a2a20'; ctx.stroke();
  ctx.fillStyle = '#3a2a20'; ctx.fillRect(-s * 0.18, -s * 0.36, s * 0.13, s * 0.72); ctx.fillRect(s * 0.1, -s * 0.36, s * 0.13, s * 0.72);
  ctx.beginPath(); ctx.arc(s * 0.4, -s * 0.06, s * 0.07, 0, Math.PI * 2); ctx.fill();
}
/** 🌸 Idée 2 : fleurs qui poussent dans les 4 coins après 1 minute sans toucher */
const fleurCoin = (p: string, c: string) => `<svg viewBox="0 0 24 24"><path d="M12 24v-9" stroke="#4f9a2f" stroke-width="1.6"/><path d="M12 20c-4-1-6-4-5-6 3 0 5 2 5 6z" fill="#6cbf3f"/><g fill="${p}" stroke="${c}" stroke-width=".5"><circle cx="12" cy="5" r="3.4"/><circle cx="16.5" cy="8.5" r="3.4"/><circle cx="15" cy="13.5" r="3.4"/><circle cx="9" cy="13.5" r="3.4"/><circle cx="7.5" cy="8.5" r="3.4"/></g><circle cx="12" cy="9.6" r="2.6" fill="#f7c22e"/></svg>`;
const COINS_FLEURS: { pos: CSSProperties; t: number; d: number; svg: string }[] = [
  { pos: { left: 4, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 74px)' }, t: 30, d: 0, svg: fleurCoin('#ffd1dc', '#e891a8') },
  { pos: { left: 30, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }, t: 22, d: 1.2, svg: fleurCoin('#fff', '#d9d2c0') },
  { pos: { left: 6, top: 70 }, t: 24, d: 2, svg: fleurCoin('#fff4c2', '#e0c25a') },
  { pos: { right: 6, top: 76 }, t: 26, d: 0.6, svg: fleurCoin('#d9cdf7', '#9b7fe0') },
  { pos: { right: 34, top: 70 }, t: 20, d: 2.6, svg: fleurCoin('#ffd1dc', '#e891a8') },
  { pos: { left: 56, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 70px)' }, t: 18, d: 3.2, svg: fleurCoin('#fff4c2', '#e0c25a') },
];

/** 🐞 Idée 4 : la coccinelle qui se promène sur le haut d'une carte */
const COCCINELLE_SVG = '<svg viewBox="0 0 24 20" width="20" height="17"><g class="pe-pattes" stroke="#222" stroke-width="1.2" stroke-linecap="round"><path d="M6 12l-4 2M7 15l-3 4M12 16v3M17 15l3 4M18 12l4 2"/></g><circle cx="20" cy="9" r="3.4" fill="#222"/><ellipse cx="11" cy="10" rx="8.5" ry="7" fill="#e53935" stroke="#9c1c1c" stroke-width=".8"/><path d="M19 10H3" stroke="#222" stroke-width="1"/><g fill="#222"><circle cx="8" cy="6.5" r="1.5"/><circle cx="14" cy="6.5" r="1.5"/><circle cx="7.5" cy="13" r="1.4"/><circle cx="14.5" cy="13" r="1.4"/></g><circle cx="21.2" cy="8" r=".7" fill="#fff"/></svg>';

/**
 * 🏰 Idée 5 : le château de sable que le crabe construit pendant la semaine (lundi = un petit tas, dimanche = le château fini
 * avec son drapeau). viewBox 0 0 60 46, posé sur le sable.
 */
function chateauSable(etape: number): string {
  const sable = '#e9c27a', ombre = '#c99a4c', clair = '#f6dca2';
  const tour = (x: number, w: number, h: number) => `<rect x="${x}" y="${44 - h}" width="${w}" height="${h}" fill="${sable}" stroke="${ombre}" stroke-width=".8"/><path d="M${x} ${44 - h}h${w}v-3h-${w / 4}v2h-${w / 4}v-2h-${w / 4}v2h-${w / 4}z" fill="${clair}" stroke="${ombre}" stroke-width=".6"/>`;
  let g = `<ellipse cx="30" cy="44" rx="28" ry="3" fill="${ombre}" opacity=".35"/>`;
  if (etape === 1) return g + `<path d="M14 44c3-10 29-10 32 0z" fill="${sable}" stroke="${ombre}" stroke-width=".8"/>`;
  g += `<path d="M8 44c2-6 42-6 44 0z" fill="${sable}" stroke="${ombre}" stroke-width=".8"/>`;
  if (etape >= 4) g += `<rect x="14" y="30" width="32" height="14" fill="${sable}" stroke="${ombre}" stroke-width=".8"/>`;
  if (etape >= 2) g += tour(24, 12, etape >= 5 ? 30 : 22);
  if (etape >= 3) g += tour(8, 9, 18) + tour(43, 9, 18);
  if (etape >= 6) g += `<path d="M27 44v-7a3 3 0 0 1 6 0v7z" fill="${ombre}"/><rect x="10.5" y="31" width="3" height="3" fill="${ombre}"/><rect x="46" y="31" width="3" height="3" fill="${ombre}"/><rect x="28.5" y="${etape >= 5 ? 19 : 26}" width="3" height="4" fill="${ombre}"/>`;
  if (etape >= 7) g += `<path d="M30 ${etape >= 5 ? 11 : 19}V2" stroke="#7a5a30" stroke-width="1"/><path class="pe-drapeau" d="M30 2l9 3-9 3z" fill="#e53935"/>`;
  g += `<g fill="#fff" opacity=".5"><circle cx="20" cy="40" r=".7"/><circle cx="38" cy="38" r=".7"/><circle cx="48" cy="42" r=".6"/></g>`;
  return g;
}

const FEUILLE = new Path2D('M0 -10C6 -6 7 4 0 10C-7 4 -6 -6 0 -10z');
function dessinerBulle(ctx: CanvasRenderingContext2D, r: number, dore: boolean) {
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  g.addColorStop(0, dore ? 'rgba(255,240,170,.35)' : 'rgba(255,255,255,.18)'); g.addColorStop(0.8, dore ? 'rgba(250,204,21,.18)' : 'rgba(160,215,250,.14)'); g.addColorStop(1, dore ? 'rgba(250,204,21,.45)' : 'rgba(120,190,235,.4)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  if (dore) { ctx.shadowColor = 'rgba(250,204,21,.9)'; ctx.shadowBlur = 10; }
  ctx.strokeStyle = dore ? '#facc15' : 'rgba(100,175,225,.75)'; ctx.lineWidth = dore ? 2 : 1.2; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.35, r * 0.28, Math.PI * 1.05, Math.PI * 1.6); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = Math.max(1.2, r * 0.12); ctx.lineCap = 'round'; ctx.stroke();
}
function dessinerGoutte(ctx: CanvasRenderingContext2D, g: Goutte) {
  const s = g.s; ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(58,42,32,.6)';
  if (g.k === 'petale') { ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.24, 0, 0, Math.PI * 2); ctx.fillStyle = g.c; ctx.fill(); ctx.strokeStyle = 'rgba(200,150,160,.6)'; ctx.stroke(); return; }
  if (g.k === 'marguerite') {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i * Math.PI / 4); ctx.beginPath(); ctx.ellipse(s * 0.32, 0, s * 0.28, s * 0.12, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(180,170,150,.7)'; ctx.stroke(); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2); ctx.fillStyle = '#f7c22e'; ctx.fill(); return;
  }
  if (g.k === 'coccinelle') {
    ctx.beginPath(); ctx.arc(0, -s * 0.38, s * 0.2, 0, Math.PI * 2); ctx.fillStyle = '#2a1a10'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2); ctx.fillStyle = '#e0302a'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a1a10'; for (const [x, y] of [[-0.18, -0.1], [0.18, -0.1], [-0.16, 0.18], [0.16, 0.18]]) { ctx.beginPath(); ctx.arc(x * s, y * s, s * 0.08, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(0, -s * 0.4); ctx.lineTo(0, s * 0.42); ctx.stroke(); return;
  }
  if (g.k === 'etoile') {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s * 0.22 : s * 0.5; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = '#f2864a'; ctx.fill(); ctx.strokeStyle = '#c75a26'; ctx.stroke(); return;
  }
  if (g.k === 'coquillage') {
    ctx.beginPath(); ctx.moveTo(0, s * 0.45); ctx.lineTo(-s * 0.45, -s * 0.05); ctx.quadraticCurveTo(0, -s * 0.7, s * 0.45, -s * 0.05); ctx.closePath();
    ctx.fillStyle = '#fde2d4'; ctx.fill(); ctx.strokeStyle = '#d99a80'; ctx.stroke();
    ctx.beginPath(); for (const x of [-0.25, 0, 0.25]) { ctx.moveTo(0, s * 0.45); ctx.lineTo(x * s, -s * 0.3); } ctx.stroke(); return;
  }
  dessinerBulle(ctx, s * 0.4, false);
}

export function DecorClair({ saison, r, soir, matin, userId }: { saison: Clair; r: ReglagesSaisons; soir: boolean; matin: boolean; userId: string | null }) {
  const c = r[saison];
  const ete = saison === 'ete';
  const reduit = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const calme = reduit && !r.animerToujours;
  const soleil = useMemo(() => (ete ? soleilEte() : soleilPrintemps()), [ete]);
  const decor = useMemo(() => (ete ? palmiersEte() : arbrePrintemps()), [ete]);
  const animal = useMemo(() => choisirAnimal(saison, userId), [saison, userId]);
  const [W, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 390));
  useEffect(() => { const f = () => setW(window.innerWidth); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  const tasX = Math.round(W * 0.42);
  const bande = useMemo(() => (ete ? bandeEte(W, tasX) : bandePrintemps(W, tasX)), [ete, W, tasX]);
  const HB = ete ? 84 : 70;
  const arriereRef = useRef<HTMLCanvasElement>(null);
  const avantRef = useRef<HTMLCanvasElement>(null);
  const animalRef = useRef<SVGSVGElement>(null);
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
  const cleRepos = `dinislam_${saison}_repos`;
  const [repos, setRepos] = useState(() => { try { return sessionStorage.getItem(cleRepos) === '1'; } catch { return false; } });
  const reposRef = useRef(repos);
  reposRef.current = repos;
  const [mot, setMot] = useState<[string, string] | null>(null);

  useEffect(() => { preparerSon(); }, []);

  // Classe sur <html> : couleurs du soir (l'objet du logo est géré par TitreAccueil depuis le 2026-11-04)
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('saison-soir', soir);
    return () => html.classList.remove('saison-soir');
  }, [soir]);

  // Idée 2 (2026-11-04) : 1 minute sans toucher → petites fleurs qui poussent dans les coins (printemps) / reflets de soleil (été) ; un toucher les efface
  const [aurepos, setAuRepos] = useState(false);
  useEffect(() => {
    if (!c.repos || calme) return;
    let t = 0;
    const reveil = () => { setAuRepos(false); clearTimeout(t); t = window.setTimeout(() => setAuRepos(true), 60_000); };
    const evts = ['pointerdown', 'scroll', 'keydown'] as const;
    evts.forEach((e) => window.addEventListener(e, reveil, { passive: true }));
    reveil();
    return () => { clearTimeout(t); evts.forEach((e) => window.removeEventListener(e, reveil)); };
  }, [c.repos, calme]);

  // Idée 4 : une coccinelle se promène sur le bord du haut d'une carte, de temps en temps (printemps)
  useEffect(() => {
    if (ete || !c.coccinelle || calme) return;
    let t = 0;
    const promener = () => {
      const cartes = [...document.querySelectorAll<HTMLElement>('.carte-accueil')].filter((el) => {
        const b = el.getBoundingClientRect(); return b.top > 60 && b.bottom < window.innerHeight - 80;
      });
      const carte = cartes[Math.floor(Math.random() * cartes.length)];
      const parent = carte?.parentElement;
      if (parent && !parent.querySelector('.pe-coccinelle')) {
        const el = document.createElement('span');
        el.className = 'pe-coccinelle';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = COCCINELLE_SVG;
        el.style.setProperty('--pe-w', `${Math.max(60, carte.offsetWidth - 22)}px`);
        parent.appendChild(el);
        window.setTimeout(() => el.remove(), 15_000);
      }
      t = window.setTimeout(promener, 35_000 + Math.random() * 40_000);
    };
    t = window.setTimeout(promener, 12_000);
    return () => { clearTimeout(t); document.querySelectorAll('.pe-coccinelle').forEach((e) => e.remove()); };
  }, [ete, c.coccinelle, calme]);

  // Décor de droite presque transparent pendant le défilement
  useEffect(() => {
    if (!c.transparente) return;
    let t = 0;
    const f = () => { setDefile(true); clearTimeout(t); t = window.setTimeout(() => setDefile(false), 600); };
    window.addEventListener('scroll', f, { passive: true });
    return () => { window.removeEventListener('scroll', f); clearTimeout(t); };
  }, [c.transparente]);

  // Mot du jour (oiseau au printemps, tortue en été) : une fois par jour, puis en le touchant
  const montrerMot = () => { const jour = Math.floor(Date.now() / 86_400_000); setMot(MOTS[saison][jour % MOTS[saison].length]); };
  useEffect(() => {
    if (!c.motDuJour) return;
    const cle = `dinislam_${saison}_mot_${userId ?? 'invite'}`, auj = new Date().toDateString();
    let deja: string | null = null;
    try { deja = localStorage.getItem(cle); } catch { /* */ }
    if (deja === auj) return;
    const liste = MOTS[saison], jour = Math.floor(Date.now() / 86_400_000);
    const t = window.setTimeout(() => { setMot(liste[jour % liste.length]); try { localStorage.setItem(cle, auj); } catch { /* */ } }, 6000);
    return () => clearTimeout(t);
  }, [c.motDuJour, saison, userId]);
  useEffect(() => { if (!mot) return; const t = window.setTimeout(() => setMot(null), 10_000); return () => clearTimeout(t); }, [mot]);

  // Canevas : papillons, abeilles, feuilles, pétales / bulles, mouettes ; lucioles le soir ; pluie de validation ; éclats
  useEffect(() => {
    if (calme) return;
    const cvA = arriereRef.current, cvV = avantRef.current;
    if (!cvA || !cvV) return;
    const ctxA = cvA.getContext('2d'), ctxV = cvV.getContext('2d');
    if (!ctxA || !ctxV) return;
    let LW = 0, LH = 0;
    const taille = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1); LW = window.innerWidth; LH = window.innerHeight;
      for (const k of [cvA, cvV]) { k.width = LW * dpr; k.height = LH * dpr; }
      for (const k of [ctxA, ctxV]) k.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    taille(); window.addEventListener('resize', taille);
    const vitesse = [0, 0.55, 0.75, 1, 1.3, 1.6][r.vitesse] ?? 1;
    const nouveau = (k: Kind, depart: boolean): Volant => {
      const devant = c.devantDerriere && k !== 'mouette' && Math.random() < (k === 'bulle' ? 0.5 : 0.45);
      const z = devant ? 0.8 + Math.random() * 0.4 : 0.35 + Math.random() * 0.35;
      const [c1, c2] = k === 'feuille' ? [VERTS[Math.floor(Math.random() * VERTS.length)], ''] : k === 'petale' ? [PETALES[Math.floor(Math.random() * PETALES.length)], ''] : AILES[Math.floor(Math.random() * AILES.length)];
      const y = k === 'bulle' ? (depart ? Math.random() * LH : LH + 20 + Math.random() * 40)
        : k === 'feuille' || k === 'petale' ? (depart ? Math.random() * LH : -20 - Math.random() * 40)
          : k === 'mouette' ? 30 + Math.random() * LH * 0.25 : Math.random() * LH * 0.8;
      return {
        k, devant, z, x: Math.random() * LW, y, ang: Math.random() * Math.PI * 2, ph: Math.random() * 6.3, rot: Math.random() * 6.3, vr: (Math.random() - 0.5) * 1.6, c1, c2,
        rare: devant && c.rare && (k === 'papillon' || k === 'bulle') && Math.random() < 0.04, fuite: 0, xAff: 0, yAff: 0, r: 0,
      };
    };
    const base = Math.max(6, Math.min(40, r.quantite));
    const volants: Volant[] = [];
    const ajouter = (k: Kind, n: number) => { for (let i = 0; i < n; i++) volants.push(nouveau(k, true)); };
    if (ete) { if (c.volants) { ajouter('bulle', Math.round(base * 0.9)); ajouter('papillon', 2); } if (c.tombants) ajouter('mouette', 3); }
    else { if (c.volants) { ajouter('papillon', Math.round(base * 0.35)); ajouter('abeille', Math.max(2, Math.round(base * 0.15))); } if (c.tombants) { ajouter('feuille', Math.round(base * 0.35)); ajouter('petale', Math.round(base * 0.25)); } }
    const lucioles = Array.from({ length: 14 }, () => ({ x: Math.random(), y: 0.45 + Math.random() * 0.45, ph: Math.random() * 6.3, ang: Math.random() * 6.3 }));
    const eclats = eclatsRef.current;
    const pluie: Goutte[] = [];

    // Vent quand on fait défiler
    let souffle = 0, dernierY = window.scrollY;
    const auDefile = () => { const dy = window.scrollY - dernierY; dernierY = window.scrollY; if (c.ventDefile) souffle = Math.max(-500, Math.min(500, souffle + dy * 3)); };
    window.addEventListener('scroll', auDefile, { passive: true });
    // Pluie à chaque validation
    const pleuvoir = () => {
      if (!c.pluieValidation) return;
      const kinds: Goutte['k'][] = ete ? ['etoile', 'coquillage', 'bulle'] : ['petale', 'petale', 'marguerite', 'coccinelle'];
      for (let i = 0; i < 40; i++) {
        pluie.push({ k: kinds[Math.floor(Math.random() * kinds.length)], x: Math.random() * LW, y: -30 - Math.random() * LH * 0.6, vy: 140 + Math.random() * 110,
          rot: Math.random() * 6.3, vr: (Math.random() - 0.5) * 4, s: 16 + Math.random() * 10, ph: Math.random() * 6.3, c: PETALES[Math.floor(Math.random() * PETALES.length)] });
      }
      if (c.son) (ete ? sonPlop : sonTintement)();
    };
    window.addEventListener(EVT_VALIDATION, pleuvoir);

    let dernier = performance.now(), raf = 0;
    const boucle = (now: number) => {
      const dt = Math.min(0.05, (now - dernier) / 1000); dernier = now; const t = now / 1000;
      ctxA.clearRect(0, 0, LW, LH); ctxV.clearRect(0, 0, LW, LH);
      const vent = Math.sin(t * 0.23) * 12 + Math.sin(t * 0.07 + 1) * 8;
      for (let i = 0; i < volants.length; i++) {
        const v = volants[i], ctx = v.devant ? ctxV : ctxA;
        if (v.fuite > 0) { v.fuite += dt; v.y -= 260 * dt; v.x += Math.sin(v.ph + t * 6) * 60 * dt; if (v.y < -40) { volants[i] = nouveau(v.k, false); volants[i].y = v.k === 'bulle' ? LH + 30 : Math.random() * LH * 0.8; continue; } }
        else if (v.k === 'papillon') {
          v.ang += (Math.sin(t * 0.7 + v.ph) * 0.9 + (Math.random() - 0.5) * 0.6) * dt;
          const sp = (26 + 22 * v.z) * vitesse;
          v.x += Math.cos(v.ang) * sp * dt; v.y += Math.sin(v.ang) * sp * 0.55 * dt + Math.sin(t * 3 + v.ph) * 10 * dt;
          if (v.y < 20) v.ang = Math.abs(v.ang) % Math.PI; if (v.y > LH * 0.85) v.ang = -Math.abs(v.ang) % Math.PI;
        } else if (v.k === 'abeille') {
          v.ang += (Math.sin(t * 0.5 + v.ph) * 0.7) * dt;
          const sp = (48 + 30 * v.z) * vitesse;
          v.x += Math.cos(v.ang) * sp * dt; v.y += Math.sin(v.ang) * sp * 0.35 * dt + Math.sin(t * 9 + v.ph) * 18 * dt;
          if (v.y < 30) v.ang = Math.abs(v.ang) % Math.PI; if (v.y > LH * 0.85) v.ang = -Math.abs(v.ang) % Math.PI;
        } else if (v.k === 'feuille' || v.k === 'petale') {
          v.y += (20 + 30 * v.z) * vitesse * dt; v.x += (vent + Math.sin(t * 1.3 + v.ph) * 18) * v.z * dt; v.rot += v.vr * dt;
          if (v.y > LH + 30) volants[i] = nouveau(v.k, false);
        } else if (v.k === 'bulle') {
          v.y -= (16 + 22 * v.z) * vitesse * dt; v.x += (Math.sin(t * 1.4 + v.ph) * 14 + vent * 0.3) * v.z * dt;
          if (v.y < -40) volants[i] = nouveau('bulle', false);
        } else { v.x += (18 + 14 * v.z) * dt; v.y += Math.sin(t * 0.8 + v.ph) * 6 * dt; if (v.x > LW + 30) { v.x = -30; v.y = 30 + Math.random() * LH * 0.25; } }
        v.y -= souffle * 1.1 * v.z * dt; v.x += Math.sin(v.ph + t) * souffle * 0.25 * v.z * dt;
        if (v.x < -40) v.x = LW + 30; if (v.x > LW + 40) v.x = -30;
        const w = volants[i]; if (w !== v) continue;
        v.xAff = v.x; v.yAff = v.y;
        ctx.save(); ctx.translate(v.x, v.y);
        if (v.k === 'papillon') { const s = 7 + 7 * v.z; v.r = s; ctx.rotate(v.ang + Math.PI / 2); dessinerPapillon(ctx, s, 0.25 + 0.75 * Math.abs(Math.sin(t * 9 + v.ph)), v.rare ? '#facc15' : v.c1, v.rare ? '#fde68a' : v.c2, v.rare); }
        else if (v.k === 'abeille') { const s = 6 + 5 * v.z; v.r = s; dessinerAbeille(ctx, s, Math.abs(Math.sin(t * 40 + v.ph)), Math.cos(v.ang) < 0); }
        else if (v.k === 'feuille') { const s = (9 + 12 * v.z) / 20; v.r = 10 * s * 1.6; ctx.rotate(v.rot); ctx.scale(s * Math.cos(t * 2 + v.ph), s); ctx.fillStyle = v.c1; ctx.fill(FEUILLE); ctx.strokeStyle = 'rgba(40,80,20,.5)'; ctx.lineWidth = 1.2 / s; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, 9); ctx.stroke(); }
        else if (v.k === 'petale') { const s = 4 + 5 * v.z; v.r = s * 1.6; ctx.rotate(v.rot); ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.5 * Math.abs(Math.cos(t * 2 + v.ph)) + 1, 0, 0, Math.PI * 2); ctx.fillStyle = v.c1; ctx.fill(); ctx.strokeStyle = 'rgba(210,150,170,.6)'; ctx.lineWidth = 0.8; ctx.stroke(); }
        else if (v.k === 'bulle') { const s = 6 + 12 * v.z; v.r = s; dessinerBulle(ctx, s, v.rare); }
        else { ctx.strokeStyle = 'rgba(93,111,136,.7)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; const b = Math.sin(t * 4 + v.ph) * 2; ctx.beginPath(); ctx.moveTo(-9, b); ctx.quadraticCurveTo(-4.5, -5, 0, 0); ctx.quadraticCurveTo(4.5, -5, 9, b); ctx.stroke(); }
        ctx.restore();
      }
      souffle *= Math.pow(0.03, dt);
      // Lucioles du soir (en bas de l'écran)
      if (soir && c.lucioles) {
        for (const l of lucioles) {
          l.ang += (Math.random() - 0.5) * 2 * dt; l.x += Math.cos(l.ang) * 0.012 * dt; l.y += Math.sin(l.ang) * 0.01 * dt;
          if (l.x < 0 || l.x > 1) l.ang = Math.PI - l.ang; if (l.y < 0.45 || l.y > 0.95) l.ang = -l.ang;
          const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 1.6 + l.ph)), x = l.x * LW, y = l.y * LH;
          const g = ctxV.createRadialGradient(x, y, 0, x, y, 9); g.addColorStop(0, `rgba(250,255,170,${a})`); g.addColorStop(1, 'rgba(210,255,120,0)');
          ctxV.fillStyle = g; ctxV.beginPath(); ctxV.arc(x, y, 9, 0, Math.PI * 2); ctxV.fill();
        }
      }
      for (let i = pluie.length - 1; i >= 0; i--) {
        const g = pluie[i]; g.y += g.vy * dt; g.x += Math.sin(t * 2 + g.ph) * 18 * dt; g.rot += g.vr * dt;
        if (g.y > LH + 40) { pluie.splice(i, 1); continue; }
        ctxV.save(); ctxV.translate(g.x, g.y); ctxV.rotate(g.rot); dessinerGoutte(ctxV, g); ctxV.restore();
      }
      for (let i = eclats.length - 1; i >= 0; i--) {
        const e = eclats[i]; e.v += dt;
        if (e.v > e.vie) { eclats.splice(i, 1); continue; }
        e.vy += 120 * dt; e.x += e.vx * dt; e.y += e.vy * dt;
        ctxV.save(); ctxV.globalAlpha = 1 - e.v / e.vie; ctxV.fillStyle = e.c; ctxV.translate(e.x, e.y); ctxV.rotate(e.v * 6);
        ctxV.beginPath(); ctxV.moveTo(0, -e.s); ctxV.lineTo(e.s * 0.35, 0); ctxV.lineTo(0, e.s); ctxV.lineTo(-e.s * 0.35, 0); ctxV.closePath(); ctxV.fill(); ctxV.restore();
      }
      raf = requestAnimationFrame(boucle);
    };
    const demarrer = () => { cancelAnimationFrame(raf); if (!document.hidden) { dernier = performance.now(); raf = requestAnimationFrame(boucle); } };
    document.addEventListener('visibilitychange', demarrer);
    demarrer();

    // Toucher : papillon / abeille qui s'envole en paillettes, feuille qui éclate, bulle qui fait plop (la carte dessous ne s'ouvre pas)
    let bloquerClic = false;
    const toucher = (ev: PointerEvent) => {
      if (!c.attraper) return;
      let cible = -1, meil = 1e9;
      volants.forEach((v, i) => { if (!v.devant || v.fuite > 0 || v.k === 'mouette') return; const d = Math.hypot(v.xAff - ev.clientX, v.yAff - ev.clientY); if (d < v.r + 14 && d < meil) { meil = d; cible = i; } });
      if (cible < 0) return;
      ev.preventDefault(); ev.stopPropagation(); bloquerClic = true; setTimeout(() => { bloquerClic = false; }, 500);
      const v = volants[cible];
      const couleurs = v.rare ? ['#facc15', '#fff3b0'] : v.k === 'bulle' ? ['#ffffff', '#bfe6fb'] : v.k === 'feuille' ? [v.c1, '#d4ec8a'] : v.k === 'petale' ? [v.c1, '#ffd1dc'] : [v.c1, v.c2 || '#fff'];
      for (let k = 0; k < (v.rare ? 22 : 12); k++) {
        const a = Math.random() * 6.3, sp = 50 + Math.random() * 100;
        eclats.push({ x: v.xAff, y: v.yAff, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, s: 2 + Math.random() * 3, c: couleurs[k % 2], v: 0, vie: 0.6 + Math.random() * 0.4 });
      }
      if (v.rare) toast(v.k === 'bulle' ? '🫧 Tu as éclaté la bulle dorée !' : '🦋 Tu as attrapé le papillon doré !');
      if (v.k === 'papillon' || v.k === 'abeille') { v.fuite = 0.01; v.rare = false; } else volants[cible] = nouveau(v.k, false);
      if (c.son) (v.k === 'bulle' ? sonPlop : sonTintement)();
    };
    const clic = (ev: MouseEvent) => { if (bloquerClic) { ev.preventDefault(); ev.stopPropagation(); bloquerClic = false; } };
    window.addEventListener('pointerdown', toucher, { capture: true });
    window.addEventListener('click', clic, { capture: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', taille);
      window.removeEventListener('scroll', auDefile);
      window.removeEventListener(EVT_VALIDATION, pleuvoir);
      document.removeEventListener('visibilitychange', demarrer);
      window.removeEventListener('pointerdown', toucher, { capture: true });
      window.removeEventListener('click', clic, { capture: true });
    };
  }, [c, calme, ete, r.quantite, r.vitesse, soir]);

  // L'animal : lapin / escargot / biche / crabe marchent et plongent dans le tas ; le dauphin saute hors de l'eau
  useEffect(() => {
    const el = animalRef.current;
    if (!c.bas || !c.animal || calme || !el) return;
    const jaillir = (x: number, y: number, k: number, couleurs: string[], haut = 1) => {
      for (let i = 0; i < Math.round(30 * k); i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = (60 + Math.random() * 110) * haut;
        eclatsRef.current.push({ x: x + (Math.random() - 0.5) * 20, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: 1.8 + Math.random() * 2.8, c: couleurs[i % couleurs.length], v: 0, vie: 0.9 + Math.random() * 0.6 });
      }
      const tas = tasRef.current; if (tas && animal !== 'dauphin') { tas.classList.remove('pe-tas-secoue'); requestAnimationFrame(() => tas.classList.add('pe-tas-secoue')); }
    };
    const couleursTas = ete ? ['#f2cf86', '#e8b968', '#fbe6b4'] : ['#ffffff', '#ffd1dc', '#f7c22e', '#8cc63f', '#f05a3a'];
    const eau = ['#ffffff', '#bfe6fb', '#7cc6f2'];
    const vit: Record<AnimalClair, number> = { lapin: 22, escargot: 7, biche: 26, crabe: 18, dauphin: 0 };
    const P = { x: 60, dir: 1, mode: 'marche' as 'marche' | 'pause' | 'plonge' | 'saut' | 'eau', t: 0, cool: 6, eclate: 0, x0: 0 };
    if (animal === 'dauphin') { P.mode = 'eau'; el.style.opacity = '0'; }
    let dernier = performance.now(), raf = 0;
    const boucle = (now: number) => {
      const dt = Math.min(0.05, (now - dernier) / 1000); dernier = now;
      const larg = window.innerWidth, limite = larg * 0.6, tas = larg * 0.42, H = window.innerHeight;
      if (reposRef.current || now < pauseJusqua.current) { raf = requestAnimationFrame(boucle); return; }
      P.t += dt;
      if (animal === 'dauphin') {
        const mer = H - HB + 14;
        if (P.mode === 'eau') { el.style.opacity = '0'; if (P.t > 4 + Math.random() * 5) { P.mode = 'saut'; P.t = 0; P.x0 = larg * (0.08 + Math.random() * 0.4); P.dir = Math.random() < 0.5 ? 1 : -1; jaillir(P.x0, mer, 0.5, eau, 0.8); } }
        else {
          const k = Math.min(1, P.t / 1.3), x = P.x0 + P.dir * 90 * k, y = mer - Math.sin(Math.PI * k) * 72;
          const pente = Math.atan2(-Math.cos(Math.PI * k) * 72 * Math.PI, 90) * (180 / Math.PI);
          el.style.opacity = k < 0.04 || k > 0.96 ? '0.6' : '1';
          el.style.transform = `translate(${x - 20}px, ${y - 17}px) scaleX(${P.dir}) rotate(${pente}deg) scale(${echelleRef.current})`;
          if (k >= 1) { jaillir(x, mer, 0.8, eau, 0.9); P.mode = 'eau'; P.t = 0; }
        }
        raf = requestAnimationFrame(boucle); return;
      }
      const sol = H - (ete ? 30 : 22);
      if (P.mode === 'plonge') {
        if (P.t < 0.4) { const k = P.t / 0.4; el.style.opacity = '1'; el.style.transform = `translate(${tas - 20}px, ${sol - 34 - 16 * Math.sin(k * Math.PI) + k * k * 30}px) scaleX(${P.dir}) scale(${echelleRef.current})`; }
        else if (P.t < 3) { if (P.eclate === 0) { P.eclate = 1; jaillir(tas, H - 26, 1, couleursTas); } el.style.opacity = '0'; }
        else {
          if (P.eclate === 1) { P.eclate = 2; jaillir(tas, H - 26, 0.45, couleursTas); P.dir *= -1; }
          el.style.opacity = '1'; el.style.transform = `translate(${tas - 20}px, ${sol - 34 - 12 * Math.max(0, (3.4 - P.t) / 0.4)}px) scaleX(${P.dir}) scale(${echelleRef.current})`;
          if (P.t > 3.4) { P.mode = 'marche'; P.t = 0; P.cool = 10; P.x = tas - 20; P.eclate = 0; }
        }
        raf = requestAnimationFrame(boucle); return;
      }
      P.cool -= dt;
      if (P.mode === 'pause' && P.t > 2) { P.mode = 'marche'; P.t = 0; }
      if (P.mode === 'marche' && P.t > 4 + Math.random() * 4) { P.mode = 'pause'; P.t = 0; }
      const v = P.mode === 'marche' ? vit[animal] : 0;
      P.x += v * P.dir * dt;
      if (P.x > limite) P.dir = -1; if (P.x < -10) P.dir = 1;
      if (c.plongeon && P.mode === 'marche' && P.cool <= 0 && Math.abs(P.x + 20 - tas) < 3) { P.mode = 'plonge'; P.t = 0; P.x = tas - 20; }
      const saut = P.mode !== 'marche' ? 0 : animal === 'lapin' ? Math.abs(Math.sin(P.t * 6)) * 8 : animal === 'biche' ? Math.abs(Math.sin(P.t * 7)) * 4 : 0;
      const flip = animal === 'crabe' ? 1 : P.dir;
      el.style.opacity = '1';
      el.style.transform = `translate(${P.x}px, ${sol - 34 - saut}px) scaleX(${flip}) scale(${echelleRef.current})`;
      const corps = el.querySelector<SVGGElement>('.pe-corps');
      if (corps) {
        corps.style.transformBox = 'fill-box'; corps.style.transformOrigin = '50% 100%';
        corps.style.transform = P.mode !== 'marche' ? '' : animal === 'crabe' ? `rotate(${Math.sin(P.t * 14) * 5}deg)` : animal === 'escargot' ? `scaleX(${1 + Math.sin(P.t * 3) * 0.05})` : `rotate(${Math.sin(P.t * 6) * 3}deg)`;
      }
      raf = requestAnimationFrame(boucle);
    };
    const demarrer = () => { cancelAnimationFrame(raf); if (!document.hidden) { dernier = performance.now(); raf = requestAnimationFrame(boucle); } };
    document.addEventListener('visibilitychange', demarrer);
    demarrer();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', demarrer); };
  }, [c.bas, c.animal, c.plongeon, calme, animal, ete, HB]);

  // Lundi = 1 … dimanche = 7 : une étape de plus chaque jour
  const etapeChateau = ((new Date().getDay() + 6) % 7) + 1;
  const reposer = (oui: boolean) => { setBulle(false); if (oui) { setRepos(true); try { sessionStorage.setItem(cleRepos, '1'); } catch { /* */ } } };
  const largeurSoleil = [0, 76, 92, 110][r.tailleArbre] ?? 92;
  const nomAnimal = ANIMAUX[animal].nom;
  const emojiAnimal: Record<AnimalClair, string> = { lapin: '🐰', escargot: '🐌', biche: '🦌', crabe: '🦀', dauphin: '🐬' };

  return (
    <>
      {/* Derrière les cartes : soleil (ou lune le soir), nuages autour du titre, ciel du soir, animaux « loin » */}
      <div aria-hidden className={`pe-decor contents pointer-events-none ${soir ? 'pe-soir' : ''}`}>
        {!calme && <canvas ref={arriereRef} className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />}
        {c.cielSoir && soir && (
          <div className={`pointer-events-none fixed inset-x-0 top-0 -z-[8] h-28 ${ete ? 'pe-ciel-ete' : 'pe-ciel-printemps'}`}>
            {Array.from({ length: 8 }, (_, i) => <span key={i} className="pe-ciel-etoile" style={{ left: `${10 + i * 11}%`, top: 8 + (i * 17) % 44, animationDelay: `${-i * 0.35}s` }} />)}
          </div>
        )}
        {c.soleil && (!soir || !c.lune) && (
          <svg viewBox="0 0 120 120" className="pointer-events-none absolute -z-[5] overflow-visible" style={{ top: 4, left: -6, width: largeurSoleil }} dangerouslySetInnerHTML={{ __html: soleil }} />
        )}
        {c.lune && soir && (
          <svg viewBox="0 0 120 120" className="pe-lune pointer-events-none absolute -z-[5]" style={{ top: 8, left: -2, width: largeurSoleil * 0.8 }} dangerouslySetInnerHTML={{ __html: LUNE_SVG }} />
        )}
        {c.nuages && (
          <>
            <svg viewBox="0 0 80 40" className="pe-nuage pointer-events-none absolute -z-[6]" style={{ top: 18, right: '4%', width: 78 }} dangerouslySetInnerHTML={{ __html: NUAGE_SVG }} />
            <svg viewBox="0 0 80 40" className="pe-nuage b pointer-events-none absolute -z-[6]" style={{ top: 118, right: '-2%', width: 54, opacity: 0.85 }} dangerouslySetInnerHTML={{ __html: NUAGE_SVG }} />
            <svg viewBox="0 0 80 40" className="pe-nuage c pointer-events-none absolute -z-[6]" style={{ top: 126, left: '3%', width: 46, opacity: 0.8 }} dangerouslySetInnerHTML={{ __html: NUAGE_SVG }} />
          </>
        )}
      </div>
      {createPortal(
        <div className={`pe-decor pointer-events-none ${soir ? 'pe-soir' : ''}`}>
          {!ete && c.rosee && matin && (
            <div aria-hidden className="fixed inset-0 z-[35]">
              {Array.from({ length: 16 }, (_, i) => {
                const coin = i % 4, k = Math.floor(i / 4);
                return <span key={i} className="pe-rosee" style={{ [coin < 2 ? 'top' : 'bottom']: 6 + k * 13 + (coin % 2) * 5, [coin % 2 ? 'right' : 'left']: 6 + ((k * 23) % 40), animationDelay: `${-i * 0.4}s` }} />;
              })}
            </div>
          )}
          {soir && <div aria-hidden className="fixed inset-0 z-[26] pe-voile-soir" />}
          {c.bas && (
            <>
              <svg aria-hidden width={W} height={HB} viewBox={`0 0 ${W} ${HB}`} className="fixed bottom-0 left-0 z-[27]" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
                dangerouslySetInnerHTML={{ __html: bande.fond }} />
              {ete && c.chateau && (
                <svg aria-hidden viewBox="0 0 60 46" className="pe-chateau fixed z-[28]" key={etapeChateau}
                  style={{ left: Math.round(W * 0.2), bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', width: 54 }}
                  dangerouslySetInnerHTML={{ __html: chateauSable(etapeChateau) }} />
              )}
              {c.animal && (
                <svg ref={animalRef} viewBox="0 0 40 34" role="button" tabIndex={0} aria-label={`${nomAnimal} : touche-le pour qu'il te parle`}
                  onClick={(e) => { e.stopPropagation(); if (repos) { setRepos(false); try { sessionStorage.removeItem(cleRepos); } catch { /* */ } } else if (toucherCompagnon(e.currentTarget, nomAnimal)) pauseJusqua.current = performance.now() + PAUSE_MS; else setBulle(true); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') setBulle(true); }}
                  className="pointer-events-auto fixed left-0 top-0 z-[29] h-[34px] w-10 cursor-pointer overflow-visible outline-none [-webkit-tap-highlight-color:transparent]"
                  style={{ transform: `translate(60px, ${typeof window !== 'undefined' ? window.innerHeight - 56 : 600}px)`, opacity: animal === 'dauphin' ? 0 : 1, transformOrigin: '50% 100%' }}
                  dangerouslySetInnerHTML={{ __html: ANIMAUX[animal].svg + (animal === 'dauphin' ? '' : habitSvg(habit, 40, 34)) }} />
              )}
              <svg ref={tasRef} aria-hidden width={W} height={HB} viewBox={`0 0 ${W} ${HB}`} className="fixed bottom-0 left-0 z-[30] overflow-visible"
                style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)', transformOrigin: `${tasX}px ${HB}px` }} dangerouslySetInnerHTML={{ __html: bande.tas }} />
              {ete && c.motDuJour && (
                <button type="button" aria-label="La tortue : touche-la pour voir le mot de l'été" onClick={montrerMot} className="pe-tortue pointer-events-auto fixed bottom-1 left-1.5 z-[31] w-12">
                  <svg viewBox="0 0 40 34" aria-hidden dangerouslySetInnerHTML={{ __html: TORTUE_SVG }} />
                </button>
              )}
            </>
          )}
          {c.decor && (
            <div className="fixed bottom-0 z-[32] transition-opacity duration-500" style={{ right: 'max(-8px, env(safe-area-inset-right, 0px))', width: ete ? 'min(42vw, 165px)' : 'min(36vw, 140px)', marginBottom: 'env(safe-area-inset-bottom, 0px)', opacity: defile ? 0.3 : 1 }}>
              <svg aria-hidden viewBox={ete ? '0 0 200 220' : '0 0 200 240'} className="block w-full" dangerouslySetInnerHTML={{ __html: decor }} />
              {!ete && c.motDuJour && (
                <button type="button" aria-label="L'oiseau : touche-le pour voir le mot du printemps" onClick={montrerMot} className="pe-oiseau pointer-events-auto absolute" style={{ left: '22%', top: '40%', width: '24%' }}>
                  <svg viewBox="0 0 40 34" aria-hidden dangerouslySetInnerHTML={{ __html: OISEAU_SVG }} />
                </button>
              )}
            </div>
          )}
          {bulle && (
            <div className="pointer-events-auto fixed bottom-16 left-2 z-[60] w-56 rounded-2xl border-2 border-[#b9dc8a] bg-white p-2.5 text-xs text-[#2f5a1a] shadow-[0_10px_24px_-10px_rgba(40,90,30,.45)]">
              <b className="block text-sm">{emojiAnimal[animal]} Je me repose ?</b>
              Je reste tranquille jusqu'à ta prochaine connexion.
              <div className="mt-2 flex gap-1.5">
                <button type="button" onClick={() => reposer(true)} className="flex-1 rounded-full bg-[#5a9e2f] px-2 py-1 font-bold text-white">Oui, repose-toi</button>
                <button type="button" onClick={() => reposer(false)} className="flex-1 rounded-full bg-[#e6f3d6] px-2 py-1 font-bold text-[#2f5a1a]">Non, continue</button>
              </div>
            </div>
          )}
          {mot && (
            <div role="status" className="hiver-bulle-in pointer-events-auto fixed bottom-24 z-[60] min-w-[160px] rounded-2xl border-2 border-[#b9dc8a] bg-white py-2 pl-2.5 pr-8 text-[#2f5a1a] shadow-[0_10px_24px_-10px_rgba(40,90,30,.45)]"
              style={ete ? { left: 6 } : { right: 12 }}>
              <small className="block text-[10px] font-bold text-[#5d7a48]">{ete ? '☀️ Mot de l’été du jour' : '🌸 Mot du printemps du jour'}</small>
              <p className="font-arabic text-2xl leading-relaxed text-[#1f3a12]" dir="rtl">{mot[0]}</p>
              <p className="text-xs">{mot[1]}</p>
              <button type="button" aria-label="Fermer" onClick={() => setMot(null)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-extrabold text-white">✕</button>
            </div>
          )}
          {c.repos && !calme && (
            <div aria-hidden className={`fixed inset-0 z-[45] ${ete ? 'pe-reflets' : 'pe-coins'} ${aurepos ? 'pousse' : ''}`}>
              {ete
                ? [[8, 14], [78, 9], [60, 28], [18, 52]].map(([l, t], i) => <span key={i} className="pe-reflet" style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${-i * 0.7}s` }} />)
                : COINS_FLEURS.map((f, i) => <span key={i} className="pe-coin-fleur" style={{ ...f.pos, width: f.t, height: f.t, transitionDelay: `${f.d}s` }} dangerouslySetInnerHTML={{ __html: f.svg }} />)}
            </div>
          )}
          {!calme && <canvas ref={avantRef} className="fixed inset-0 z-40 h-full w-full" />}
        </div>,
        document.body,
      )}
      {c.volants && c.attraper && c.messageSemaine && !calme && <MessageSemaine saison={saison} userId={userId} />}
    </>
  );
}

/** Message éphémère de la semaine : « Attrape les papillons ! » / « Éclate les bulles ! » (1er jour d'ouverture à partir du lundi) */
function MessageSemaine({ saison, userId }: { saison: Clair; userId: string | null }) {
  const cle = `dinislam_msg_${saison}_${userId ?? 'invite'}`;
  const semaine = lundiDeLaSemaine();
  const [visible, setVisible] = useState(false);
  const [part, setPart] = useState(false);
  const fermer = () => { setPart(true); window.setTimeout(() => setVisible(false), 450); };
  useEffect(() => {
    let deja: string | null = null;
    try { deja = localStorage.getItem(cle); } catch { /* */ }
    if (deja === semaine) return;
    const t1 = window.setTimeout(() => { setVisible(true); try { localStorage.setItem(cle, semaine); } catch { /* */ } }, 1800);
    return () => clearTimeout(t1);
  }, [cle, semaine]);
  useEffect(() => { if (!visible) return; const t = window.setTimeout(() => fermer(), 12000); return () => clearTimeout(t); }, [visible]);
  if (!visible) return null;
  const ete = saison === 'ete';
  return createPortal(
    <div role="status" className={`fixed inset-x-0 z-[60] flex justify-center px-4 ${part ? 'saison-msg-part' : 'saison-msg-arrive'}`} style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 110px)' }}>
      <div className={`relative w-full max-w-sm overflow-hidden rounded-3xl border-2 p-4 pr-10 shadow-[0_16px_40px_-12px_rgba(40,90,60,.45)] ${ete ? 'border-[#f3d877] bg-gradient-to-br from-[#fffdf2] via-[#e9f7ff] to-[#d6f0ff]' : 'border-[#b9dc8a] bg-gradient-to-br from-white via-[#f1f9e6] to-[#e3f2cf]'}`}>
        <p className={`text-base font-extrabold ${ete ? 'text-[#1f6fa8]' : 'text-[#2f5a1a]'}`}>{ete ? '🫧 Éclate les bulles !' : '🦋 Attrape les papillons !'}</p>
        <p className="text-sm leading-snug text-[#3a4a3a]">{ete
          ? <>Les bulles qui passent <b>devant</b> les cartes s'éclatent : touche-en une, elle fait <i>plop</i>&nbsp;!</>
          : <>Les papillons et les abeilles qui passent <b>devant</b> les cartes s'attrapent : touche-en un, il s'envole en paillettes avec un petit tintement&nbsp;!</>}</p>
        <button type="button" onClick={fermer} aria-label="Fermer le message" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 font-bold">✕</button>
        <button type="button" onClick={fermer} className={`mt-3 rounded-full px-4 py-1.5 text-sm font-bold text-white shadow active:scale-95 ${ete ? 'bg-[#2e8fd0]' : 'bg-[#5a9e2f]'}`}>{ete ? '🫧 J’essaie !' : '🦋 J’essaie !'}</button>
      </div>
    </div>,
    document.body,
  );
}
