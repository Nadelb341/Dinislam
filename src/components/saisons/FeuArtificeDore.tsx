import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * 🎆 Géant feu d'artifice doré (Nadia, 2026-11-17 : quand on touche le tapis volant, « des étoiles dorées, des lunes dorées
 * et des scintillements qui envahissent tout l'écran juste 5 secondes, prolongeable à 10, 20, 30 s », d'après son image :
 * poussière d'or, éclats lumineux, rubans dorés qui tournoient).
 * Dessiné dans un canevas (rapide même sur un vieux téléphone, rien à télécharger, marche hors ligne). Rien de cliquable :
 * l'écran reste utilisable pendant le feu d'artifice. Un léger voile sombre fait briller l'or, puis disparaît.
 */
type Grain = { x: number; y: number; vx: number; vy: number; vie: number; max: number; t: number; k: 'or' | 'etoile' | 'lune' | 'bokeh'; rot: number; vr: number; ph: number; idx?: number };
type Ruban = { x: number; y: number; vy: number; vx: number; ph: number; long: number; larg: number };

function sprite(taille: number, dessin: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement('canvas');
  c.width = c.height = taille;
  const g = c.getContext('2d');
  if (g) dessin(g, taille);
  return c;
}

/** 🎨 Couleurs du feu d'artifice selon la saison (2026-11-18 : un objet qui se promène dans chaque saison) */
export type ThemeFeu = 'ramadan' | 'hiver' | 'automne' | 'ete' | 'printemps' | 'lettres';
type Palette = { lueur: [string, string, string, string]; etoile: [string, string, string]; special: [string, string]; ruban: [string, string, string, string]; voile: string; forme: 'lune' | 'flocon' | 'feuille' | 'soleil' | 'fleur' | 'lettre' };
const PALETTES: Record<ThemeFeu, Palette> = {
  ramadan: { lueur: ['rgba(255,255,240,1)', 'rgba(255,236,150,1)', 'rgba(255,200,80,.45)', 'rgba(255,190,60,0)'], etoile: ['#fff6cf', '#ffd76a', '#e0a92a'], special: ['#fff4c4', '#e9b739'], ruban: ['#fff1b8', '#e0b23a', '#b8891c', '#8a6414'], voile: '18,14,34', forme: 'lune' },
  hiver: { lueur: ['rgba(255,255,255,1)', 'rgba(214,240,255,1)', 'rgba(140,200,255,.45)', 'rgba(120,180,255,0)'], etoile: ['#ffffff', '#cfeaff', '#7fb8ec'], special: ['#ffffff', '#a9d6ff'], ruban: ['#ffffff', '#bfe2ff', '#7fb0e0', '#4f7fb5'], voile: '12,24,52', forme: 'flocon' },
  automne: { lueur: ['rgba(255,250,230,1)', 'rgba(255,214,130,1)', 'rgba(240,140,50,.45)', 'rgba(220,110,40,0)'], etoile: ['#fff2c8', '#ffc25a', '#d9771f'], special: ['#ffd36b', '#c8611a'], ruban: ['#ffe6a8', '#e8962e', '#b0581a', '#7d3a10'], voile: '34,18,10', forme: 'feuille' },
  ete: { lueur: ['rgba(255,255,235,1)', 'rgba(255,240,140,1)', 'rgba(255,190,70,.45)', 'rgba(255,170,40,0)'], etoile: ['#fffbd6', '#ffe066', '#ffa726'], special: ['#fff3a0', '#ffb300'], ruban: ['#fff6b0', '#ffd23f', '#ff9f1c', '#e07a00'], voile: '20,30,50', forme: 'soleil' },
  // 🔤 Bravo des lettres (Nadia, 2026-11-21) : même or que la feuille dorée, avec de GRANDES LETTRES ARABES dorées + « Bravo ! »
  lettres: { lueur: ['rgba(255,255,240,1)', 'rgba(255,236,150,1)', 'rgba(255,200,80,.45)', 'rgba(255,190,60,0)'], etoile: ['#fff6cf', '#ffd76a', '#e0a92a'], special: ['#fff4c4', '#d99a1c'], ruban: ['#fff1b8', '#e0b23a', '#b8891c', '#8a6414'], voile: '26,16,6', forme: 'lettre' },
  printemps: { lueur: ['rgba(255,255,255,1)', 'rgba(255,214,236,1)', 'rgba(140,190,255,.45)', 'rgba(120,170,255,0)'], etoile: ['#ffffff', '#ffd0e8', '#7aa8f0'], special: ['#ffe1f0', '#ff8fc2'], ruban: ['#ffe3f1', '#ff9cc9', '#6f9be6', '#3f6fc0'], voile: '24,22,48', forme: 'fleur' },
};

const LETTRES_OR = ['ا', 'ب', 'ت', 'ج', 'د', 'ر', 'س', 'ع', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];

export function FeuArtificeDore({ duree, onFin, theme = 'ramadan', lettres, bravo, auDessus }: {
  duree: number; onFin: () => void; theme?: ThemeFeu;
  /** Thème « lettres » : les lettres à faire pleuvoir en plus (ex. la lettre de l'enfant) */
  lettres?: string[];
  /** Grand texte doré au milieu (ex. « Bravo ! ») */
  bravo?: string;
  /** Au-dessus des écrans plein écran (jeux des tout-petits) */
  auDessus?: boolean;
}) {
  const pal = PALETTES[theme];
  const ref = useRef<HTMLCanvasElement>(null);
  const finRef = useRef(onFin);
  finRef.current = onFin;

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) { finRef.current(); return; }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0;
    const taille = () => { W = window.innerWidth; H = window.innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    taille();
    window.addEventListener('resize', taille);

    // Petites images dessinées une fois : lueur dorée, étoile à 4 branches, croissant de lune
    const lueur = sprite(64, (g, s) => {
      const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      r.addColorStop(0, pal.lueur[0]); r.addColorStop(.18, pal.lueur[1]); r.addColorStop(.42, pal.lueur[2]); r.addColorStop(1, pal.lueur[3]);
      g.fillStyle = r; g.fillRect(0, 0, s, s);
    });
    const etoile = sprite(64, (g, s) => {
      const c = s / 2, R = s / 2, r = s * .07;
      g.drawImage(lueur, s * .2, s * .2, s * .6, s * .6);
      g.beginPath();
      for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2, d = i % 2 ? r : R; g.lineTo(c + Math.cos(a) * d, c + Math.sin(a) * d); }
      g.closePath();
      const lg = g.createLinearGradient(0, 0, s, s); lg.addColorStop(0, pal.etoile[0]); lg.addColorStop(.5, pal.etoile[1]); lg.addColorStop(1, pal.etoile[2]);
      g.fillStyle = lg; g.fill();
    });
    // La « grande » forme de la gerbe : lune (Ramadan), flocon (hiver), feuille (automne), soleil (été), fleur (printemps)
    const lune = sprite(64, (g, s) => {
      g.drawImage(lueur, 0, 0, s, s);
      const c = s / 2;
      const lg = g.createLinearGradient(0, 0, s, s); lg.addColorStop(0, pal.special[0]); lg.addColorStop(1, pal.special[1]);
      g.fillStyle = lg; g.strokeStyle = lg; g.lineCap = 'round';
      if (pal.forme === 'lune') {
        g.beginPath(); g.arc(c, c, s * .3, 0, Math.PI * 2); g.fill();
        g.globalCompositeOperation = 'destination-out';
        g.beginPath(); g.arc(c + s * .13, c - s * .06, s * .26, 0, Math.PI * 2); g.fill();
      } else if (pal.forme === 'flocon') {
        g.lineWidth = s * .05;
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3, ex = c + Math.cos(a) * s * .32, ey = c + Math.sin(a) * s * .32;
          g.beginPath(); g.moveTo(c, c); g.lineTo(ex, ey); g.stroke();
          for (const k of [-1, 1]) { const mx = c + Math.cos(a) * s * .2, my = c + Math.sin(a) * s * .2, b = a + k * .7; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + Math.cos(b) * s * .09, my + Math.sin(b) * s * .09); g.stroke(); }
        }
      } else if (pal.forme === 'feuille') {
        g.beginPath(); g.moveTo(c, c - s * .32);
        g.bezierCurveTo(c + s * .34, c - s * .22, c + s * .3, c + s * .2, c, c + s * .3);
        g.bezierCurveTo(c - s * .3, c + s * .2, c - s * .34, c - s * .22, c, c - s * .32); g.fill();
        g.strokeStyle = 'rgba(140,60,10,.5)'; g.lineWidth = s * .025; g.beginPath(); g.moveTo(c, c - s * .26); g.lineTo(c, c + s * .38); g.stroke();
      } else if (pal.forme === 'soleil') {
        g.beginPath(); g.arc(c, c, s * .17, 0, Math.PI * 2); g.fill();
        g.lineWidth = s * .05;
        for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5; g.beginPath(); g.moveTo(c + Math.cos(a) * s * .24, c + Math.sin(a) * s * .24); g.lineTo(c + Math.cos(a) * s * .34, c + Math.sin(a) * s * .34); g.stroke(); }
      } else {
        for (let i = 0; i < 5; i++) { const a = (i * Math.PI * 2) / 5 - Math.PI / 2; g.beginPath(); g.ellipse(c + Math.cos(a) * s * .15, c + Math.sin(a) * s * .15, s * .13, s * .09, a, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#ffe066'; g.beginPath(); g.arc(c, c, s * .08, 0, Math.PI * 2); g.fill();
      }
    });

    // 🔤 Grandes lettres dorées (thème « lettres ») : la lettre de l'enfant revient plus souvent
    const listeLettres = pal.forme === 'lettre' ? [...LETTRES_OR, ...(lettres ?? []), ...(lettres ?? []), ...(lettres ?? []), ...(lettres ?? [])] : [];
    const spritesLettres = listeLettres.map((l) => sprite(128, (g, s) => {
      g.drawImage(lueur, 0, 0, s, s);
      g.font = `bold ${s * .62}px "Amiri", "Noto Naskh Arabic", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const lg = g.createLinearGradient(0, s * .15, s, s * .85); lg.addColorStop(0, '#fff6cf'); lg.addColorStop(.45, '#ffd76a'); lg.addColorStop(1, '#c4860f');
      g.lineWidth = s * .03; g.strokeStyle = 'rgba(120,70,0,.55)'; g.strokeText(l, s / 2, s / 2);
      g.fillStyle = lg; g.fillText(l, s / 2, s / 2);
    }));
    const grains: Grain[] = [];
    const rubans: Ruban[] = [];
    const ajouter = (g: Omit<Grain, 'vie' | 't'>) => grains.push({ ...g, vie: 0, t: 0 });
    const hasard = (a: number, b: number) => a + Math.random() * (b - a);
    // Une gerbe : plein de poussière d'or qui part en rond, quelques étoiles et une lune
    const gerbe = (x: number, y: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = hasard(40, 340);
        ajouter({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, max: hasard(1, 2.2), k: 'or', rot: 0, vr: 0, ph: Math.random() * 6 });
      }
      for (let i = 0; i < 7; i++) {
        const a = Math.random() * Math.PI * 2, v = hasard(60, 180);
        ajouter({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, max: hasard(1.6, 2.6), k: 'etoile', rot: Math.random() * 6, vr: hasard(-2, 2), ph: Math.random() * 6 });
      }
      if (spritesLettres.length) {
        for (let i = 0; i < 2; i++) ajouter({ x, y, vx: hasard(-110, 110), vy: hasard(-160, -40), max: hasard(2, 3), k: 'lune', rot: hasard(-.4, .4), vr: hasard(-.6, .6), ph: 0, idx: Math.floor(Math.random() * spritesLettres.length) });
      } else if (Math.random() < .7) ajouter({ x, y, vx: hasard(-60, 60), vy: hasard(-90, -20), max: hasard(2, 3), k: 'lune', rot: hasard(-.6, .6), vr: hasard(-.8, .8), ph: 0 });
    };
    // Au départ : la grande nuée de paillettes au milieu (comme sur l'image) + des lumières floues partout
    const nuee = () => {
      for (let i = 0; i < 480; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.pow(Math.random(), .6) * Math.min(W, H) * .45;
        ajouter({ x: W / 2 + Math.cos(a) * d * 1.3, y: H * .45 + Math.sin(a) * d * .7, vx: Math.cos(a) * hasard(10, 60), vy: Math.sin(a) * hasard(10, 40), max: hasard(1.8, 4), k: Math.random() < .15 ? 'bokeh' : Math.random() < .06 ? 'etoile' : 'or', rot: 0, vr: 0, ph: Math.random() * 6 });
      }
    };
    nuee();
    for (let i = 0; i < 8; i++) rubans.push({ x: hasard(0, W), y: hasard(-H * .7, -30), vy: hasard(45, 85), vx: hasard(-12, 12), ph: Math.random() * 6, long: hasard(110, 190), larg: hasard(6, 9) });

    const debut = performance.now();
    let prochaine = 0, raf = 0, avant = debut;
    const finGerbes = Math.max(1, duree - 1.4);
    const dessinerRuban = (r: Ruban, t: number) => {
      // Un ruban doré qui tournoie : une vague dont la largeur visible change (on voit sa face puis sa tranche)
      ctx.save();
      ctx.translate(r.x, r.y);
      const pas = 14, n = Math.round(r.long / pas);
      for (let i = 0; i < n; i++) {
        const y0 = i * pas, y1 = y0 + pas;
        const x0 = Math.sin(r.ph + t * 2.4 + i * .55) * 16, x1 = Math.sin(r.ph + t * 2.4 + (i + 1) * .55) * 16;
        const face = Math.cos(r.ph + t * 2.4 + i * .55);
        const lg = ctx.createLinearGradient(x0 - r.larg, y0, x0 + r.larg, y1);
        lg.addColorStop(0, face > 0 ? pal.ruban[0] : pal.ruban[2]); lg.addColorStop(1, face > 0 ? pal.ruban[1] : pal.ruban[3]);
        ctx.strokeStyle = lg;
        ctx.lineWidth = r.larg * (.35 + Math.abs(face) * .65);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
      ctx.restore();
    };

    const tour = (now: number) => {
      const t = (now - debut) / 1000;
      const dt = Math.min(.05, (now - avant) / 1000);
      avant = now;
      if (t > duree) { finRef.current(); return; }
      raf = requestAnimationFrame(tour);
      // De nouvelles gerbes un peu partout, jusqu'à 1,4 s de la fin
      if (t < finGerbes && t >= prochaine) {
        gerbe(hasard(W * .08, W * .92), hasard(H * .1, H * .75), W < 500 ? 110 : 160);
        prochaine = t + hasard(.15, .32);
      }
      if (t < finGerbes && Math.random() < .6) ajouter({ x: hasard(0, W), y: hasard(0, H), vx: 0, vy: hasard(-8, 8), max: hasard(1, 2.2), k: 'bokeh', rot: 0, vr: 0, ph: Math.random() * 6 });
      // Voile : apparaît en 0,4 s, s'efface sur la dernière seconde
      const voile = Math.min(1, t / .4) * Math.min(1, Math.max(0, (duree - t) / 1));
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = `rgba(${pal.voile},${(.66 * voile).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
      // Rubans
      for (const r of rubans) {
        r.y += r.vy * dt; r.x += r.vx * dt;
        if (r.y > H + 40 && t < finGerbes) { r.y = -r.long - hasard(0, 200); r.x = hasard(0, W); }
        ctx.globalAlpha = voile;
        dessinerRuban(r, t);
      }
      // Paillettes, étoiles et lunes
      for (let i = grains.length - 1; i >= 0; i--) {
        const g = grains[i];
        g.vie += dt;
        if (g.vie > g.max) { grains.splice(i, 1); continue; }
        const freine = g.k === 'or' ? .965 : .985;
        g.vx *= freine; g.vy *= freine;
        g.vy += (g.k === 'lune' ? 14 : g.k === 'bokeh' ? 0 : 38) * dt;
        g.x += g.vx * dt; g.y += g.vy * dt; g.rot += g.vr * dt;
        const reste = 1 - g.vie / g.max;
        const scint = .55 + .45 * Math.sin(g.ph + g.vie * 14);
        const a = Math.min(1, g.vie * 6) * reste * voile;
        if (g.k === 'or') {
          const s = 7 + 11 * reste;
          ctx.globalAlpha = a * scint;
          ctx.drawImage(lueur, g.x - s / 2, g.y - s / 2, s, s);
        } else if (g.k === 'bokeh') {
          const s = 22 + 18 * Math.sin(g.ph);
          ctx.globalAlpha = a * .4;
          ctx.drawImage(lueur, g.x - s / 2, g.y - s / 2, s, s);
        } else {
          const img = g.k === 'etoile' ? etoile : g.idx !== undefined ? spritesLettres[g.idx] : lune;
          const s = (g.k === 'etoile' ? 34 : g.idx !== undefined ? 96 : 44) * (.7 + .3 * scint);
          ctx.globalAlpha = a;
          ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.rot); ctx.drawImage(img, -s / 2, -s / 2, s, s); ctx.restore();
        }
      }
      // « Bravo ! » en grand, doré, qui respire
      if (bravo) {
        const taille = Math.min(W * .18, 110) * (1 + .05 * Math.sin(t * 5)) * Math.min(1, t / .35);
        ctx.globalAlpha = voile;
        ctx.font = `900 ${taille}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const lg = ctx.createLinearGradient(0, H * .3, 0, H * .45); lg.addColorStop(0, '#fff6cf'); lg.addColorStop(.5, '#ffd76a'); lg.addColorStop(1, '#c4860f');
        ctx.shadowColor = 'rgba(255,200,60,.9)'; ctx.shadowBlur = 24;
        ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(110,60,0,.7)'; ctx.strokeText(bravo, W / 2, H * .38);
        ctx.fillStyle = lg; ctx.fillText(bravo, W / 2, H * .38);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(tour);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', taille); };
  }, [duree, pal, lettres, bravo]);

  return createPortal(<canvas ref={ref} aria-hidden className={`pointer-events-none fixed inset-0 h-full w-full ${auDessus ? 'z-[9999]' : 'z-[90]'}`} />, document.body);
}
