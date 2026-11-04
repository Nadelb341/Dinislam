/**
 * 🌧️🌈 Averse puis arc-en-ciel (idée 1, demande de Nadia du 2026-11-04) — pour les 4 saisons, réglable dans
 * bouclier › 🔧 Apparence appli › Décorations saisons › onglet de la saison › « La pluie et l'arc-en-ciel ».
 * - parfois : une averse de temps en temps (fréquence, durée, intensité réglables), puis l'arc-en-ciel derrière le titre ;
 * - periode : pluie continue entre deux dates ; l'arc-en-ciel le lendemain de la fin ;
 * - meteo : il pleut (ou neige l'hiver) quand il pleut vraiment dans la ville des horaires de prière (Open-Meteo, gratuit,
 *   sans clé ; vérifié toutes les 15 min, gardé en mémoire ; sans réseau : rien). L'arc-en-ciel quand la pluie s'arrête, de jour.
 * Rien ne bloque les touchers (pointer-events: none). Immobile si « Réduire les animations » et que Nadia ne force pas.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CLE_ESSAI_AVERSE as CLE_ESSAI, EVT_ESSAI_AVERSE, type ReglagesSaisons, type Saison } from '@/lib/saisons';

const jourIso = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const lendemain = (iso: string) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + 1); return jourIso(d); };

interface Meteo { pluie: boolean; neige: boolean; intensite: number; jour: boolean; at: number }
const CLE_METEO = 'dinislam_meteo_cache';
async function lireMeteo(lat: number, lon: number): Promise<Meteo | null> {
  try {
    const c = JSON.parse(localStorage.getItem(CLE_METEO) || 'null') as (Meteo & { lat: number; lon: number }) | null;
    if (c && c.lat === lat && c.lon === lon && Date.now() - c.at < 15 * 60_000) return c;
  } catch { /* */ }
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=precipitation,weather_code,is_day`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const j = await res.json() as { current?: { precipitation?: number; weather_code?: number; is_day?: number } };
    const code = j.current?.weather_code ?? 0, mm = j.current?.precipitation ?? 0;
    const neige = (code >= 71 && code <= 77) || code === 85 || code === 86;
    const pluie = neige || mm > 0 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
    const m: Meteo = { pluie, neige, intensite: mm < 0.5 ? 1 : mm < 2.5 ? 2 : 3, jour: j.current?.is_day !== 0, at: Date.now() };
    try { localStorage.setItem(CLE_METEO, JSON.stringify({ ...m, lat, lon })); } catch { /* */ }
    return m;
  } catch { return null; }
}

export function MeteoSaison({ saison, r, soir, ville }: { saison: Saison; r: ReglagesSaisons; soir: boolean; ville: { lat: number; lon: number } | null }) {
  const m = r.meteo[saison];
  const reduit = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const calme = reduit && !r.animerToujours;
  const [pluie, setPluie] = useState<{ neige: boolean; intensite: number } | null>(null);
  const [arc, setArc] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const neigeHiver = saison === 'hiver' && m.neige;

  // Une averse (essai, ou mode « parfois ») puis l'arc-en-ciel
  const timers = useRef<number[]>([]);
  const averse = (intensite = m.intensite, neige = neigeHiver) => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setArc(false); setPluie({ neige, intensite });
    timers.current.push(window.setTimeout(() => {
      setPluie(null);
      if (m.arcEnCiel && !soir) {
        timers.current.push(window.setTimeout(() => setArc(true), 1500));
        timers.current.push(window.setTimeout(() => setArc(false), 1500 + m.dureeArc * 1000));
      }
    }, Math.max(15, m.duree) * 1000));
  };
  const averseRef = useRef(averse); averseRef.current = averse;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ▶️ Essai demandé par l'admin
  useEffect(() => {
    const f = () => { try { localStorage.removeItem(CLE_ESSAI); } catch { /* */ } averseRef.current(); };
    let essai = 0;
    try { essai = Number(localStorage.getItem(CLE_ESSAI) || '0'); } catch { /* */ }
    if (Date.now() - essai < 5 * 60_000) window.setTimeout(f, 800);
    window.addEventListener(EVT_ESSAI_AVERSE, f);
    return () => window.removeEventListener(EVT_ESSAI_AVERSE, f);
  }, []);

  // Mode « parfois » : une averse de temps en temps
  useEffect(() => {
    if (!m.averse || m.mode !== 'parfois' || calme) return;
    const minutes = [0, 30, 15, 6][m.frequence] ?? 15;
    let t = 0;
    const suivante = (premiere: boolean) => {
      const ms = premiere ? (60 + Math.random() * 120) * 1000 : minutes * 60_000 * (0.7 + Math.random() * 0.6);
      t = window.setTimeout(() => { averseRef.current(); suivante(false); }, ms);
    };
    // La 1re arrive vite seulement une fois sur 3 (sinon on attend le rythme choisi)
    suivante(Math.random() < 0.35);
    return () => clearTimeout(t);
  }, [m.averse, m.mode, m.frequence, calme]);

  // Mode « période » : pluie continue entre deux dates ; arc-en-ciel le lendemain
  useEffect(() => {
    if (m.mode !== 'periode') return;
    const auj = jourIso();
    if (m.averse && m.du && m.au && auj >= m.du && auj <= m.au) { setPluie({ neige: neigeHiver, intensite: m.intensite }); return () => setPluie(null); }
    if (m.arcEnCiel && m.au && auj === lendemain(m.au) && !soir) {
      setArc(true); const t = window.setTimeout(() => setArc(false), m.dureeArc * 1000);
      return () => { clearTimeout(t); setArc(false); };
    }
  }, [m.mode, m.averse, m.arcEnCiel, m.du, m.au, m.intensite, m.dureeArc, neigeHiver, soir]);

  // Mode « vraie météo »
  useEffect(() => {
    if (m.mode !== 'meteo' || !ville) return;
    let actif = true, avant: boolean | null = null, tArc = 0;
    const verifier = async () => {
      const w = await lireMeteo(ville.lat, ville.lon);
      if (!actif || !w) return;
      if (w.pluie && m.averse) setPluie({ neige: saison === 'hiver' && (w.neige || m.neige), intensite: w.intensite }); else setPluie(null);
      if (avant === true && !w.pluie && w.jour && m.arcEnCiel) { setArc(true); clearTimeout(tArc); tArc = window.setTimeout(() => setArc(false), m.dureeArc * 1000); }
      avant = w.pluie;
    };
    void verifier();
    const iv = window.setInterval(() => void verifier(), 15 * 60_000);
    return () => { actif = false; clearInterval(iv); clearTimeout(tArc); setPluie(null); };
  }, [m.mode, m.averse, m.arcEnCiel, m.neige, m.dureeArc, ville, saison]);

  // Les gouttes (ou les flocons serrés) dans un canevas devant les cartes, très légères
  useEffect(() => {
    const cv = canvasRef.current;
    if (!pluie || calme || !cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    let LW = 0, LH = 0;
    const taille = () => { const dpr = Math.min(2, window.devicePixelRatio || 1); LW = window.innerWidth; LH = window.innerHeight; cv.width = LW * dpr; cv.height = LH * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    taille(); window.addEventListener('resize', taille);
    const n = [0, 55, 120, 220][pluie.intensite] ?? 120;
    const gouttes = Array.from({ length: n }, () => ({ x: Math.random() * LW, y: Math.random() * LH, z: 0.4 + Math.random() * 0.6, ph: Math.random() * 6.3 }));
    const ronds: { x: number; v: number }[] = [];
    const debut = performance.now();
    let dernier = debut, raf = 0;
    const boucle = (now: number) => {
      const dt = Math.min(0.05, (now - dernier) / 1000); dernier = now;
      const monte = Math.min(1, (now - debut) / 3000); // arrive doucement
      ctx.clearRect(0, 0, LW, LH);
      if (pluie.neige) {
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        for (const g of gouttes) {
          g.y += (60 + 90 * g.z) * dt; g.x += (Math.sin(now / 700 + g.ph) * 20 + 25) * g.z * dt;
          if (g.y > LH) { g.y = -6; g.x = Math.random() * LW; } if (g.x > LW) g.x = 0;
          ctx.globalAlpha = (0.5 + 0.5 * g.z) * monte; ctx.beginPath(); ctx.arc(g.x, g.y, 1.2 + 2 * g.z, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        ctx.lineCap = 'round';
        for (const g of gouttes) {
          const v = (520 + 420 * g.z) * dt;
          g.y += v; g.x -= v * 0.12;
          if (g.y > LH) { if (Math.random() < 0.25) ronds.push({ x: g.x, v: 0 }); g.y = -20 - Math.random() * 60; g.x = Math.random() * (LW + 80); }
          ctx.globalAlpha = (0.18 + 0.3 * g.z) * monte; ctx.strokeStyle = '#6f8fb3'; ctx.lineWidth = 0.8 + g.z;
          ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x + 1.6 * g.z * 1.2, g.y - (9 + 9 * g.z)); ctx.stroke();
        }
        // Petits ronds d'éclaboussure tout en bas
        ctx.strokeStyle = '#7c9cc0';
        for (let i = ronds.length - 1; i >= 0; i--) {
          const o = ronds[i]; o.v += dt; if (o.v > 0.5) { ronds.splice(i, 1); continue; }
          ctx.globalAlpha = (1 - o.v / 0.5) * 0.45 * monte; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(o.x, LH - 6, 2 + o.v * 14, 1 + o.v * 3, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(boucle);
    };
    const demarrer = () => { cancelAnimationFrame(raf); if (!document.hidden) { dernier = performance.now(); raf = requestAnimationFrame(boucle); } };
    document.addEventListener('visibilitychange', demarrer);
    demarrer();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', taille); document.removeEventListener('visibilitychange', demarrer); };
  }, [pluie, calme]);

  if (!m.averse && !m.arcEnCiel) return null;
  return (
    <>
      {/* Derrière les cartes : ciel un peu gris pendant l'averse, arc-en-ciel derrière le titre */}
      <div aria-hidden className={`pe-ciel-gris pointer-events-none absolute inset-x-0 top-0 -z-[4] h-56 ${pluie && m.ciel ? 'actif' : ''}`} />
      <svg aria-hidden viewBox="0 0 200 104" className={`pe-arc pointer-events-none absolute left-1/2 -z-[7] ${arc ? 'actif' : ''}`} style={{ top: 26, width: 'min(94vw, 400px)' }}>
        {['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc', '#91a7ff', '#d0a8ff'].map((c, i) => (
          <path key={c} d={`M${10 + i * 5} 100a${90 - i * 5} ${90 - i * 5} 0 0 1 ${180 - i * 10} 0`} fill="none" stroke={c} strokeWidth="5.2" strokeLinecap="round" />
        ))}
      </svg>
      {pluie && !calme && createPortal(<canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-[38] h-full w-full" />, document.body)}
    </>
  );
}
