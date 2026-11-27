import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Undo2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { PastilleSource } from '@/components/shared/DegreAuthenticite';
import {
  avancer, CHAPELETS, CLE_REGLAGES, compteurDepart, ecrireLocal, encouragement, intervalleAuto, lireReglages, reculer,
  type EtatCompteur, type ReglagesChapelet,
} from '@/lib/dhikr';
import { ApercuChapelet, DefsPerles, FIL, Perle, Pompon } from './Perles';
import type { Couleurs } from './Ambiance';

/**
 * 📿 LE CHAPELET (Nadia, 27/11, présentation A) — utilisé PARTOUT où l'on compte (chapelet libre, séries, après la prière…).
 * En haut le badge d'encouragement, le mérite + sa source, l'arabe doré, la phonétique, le sens ; le grand compteur « 18/33 » +
 * « Tour : 1 » ; dessous la misbaha : perles enfilées sur un fil courbe, pompon au bout, les perles GLISSENT d'une perle à l'autre.
 * Deux modes : 👆 À mon rythme (toucher le grand bouton ou le chapelet) / ▶️ Automatique (vitesse ×0,5 / ×1, pause).
 * Petite vibration à chaque perle, plus forte à la fin. Tout marche sans réseau ; le choix du chapelet et du mode est gardé sur l'appareil.
 */
export interface EtapeChapelet { titre: string; arabe: string; phonetique: string; sens: string; nombre: number }

// ─── Géométrie du fil : une boucle en goutte, les 2 bouts se rejoignent en haut au pompon (viewBox 360 × 250) ───
const P = { x0: 160, y0: 24, x1: -200, y1: 282, x2: 560, y2: 282, x3: 200, y3: 24 };
const ECHANTILLONS = (() => {
  const pts: { x: number; y: number; s: number }[] = [];
  let s = 0, px = P.x0, py = P.y0;
  for (let i = 0; i <= 300; i++) {
    const t = i / 300, u = 1 - t;
    const x = u * u * u * P.x0 + 3 * u * u * t * P.x1 + 3 * u * t * t * P.x2 + t * t * t * P.x3;
    const y = u * u * u * P.y0 + 3 * u * u * t * P.y1 + 3 * u * t * t * P.y2 + t * t * t * P.y3;
    s += Math.hypot(x - px, y - py); px = x; py = y;
    pts.push({ x, y, s });
  }
  return pts;
})();
const LONGUEUR = ECHANTILLONS[ECHANTILLONS.length - 1].s;
function pointA(s: number) {
  let lo = 0, hi = ECHANTILLONS.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ECHANTILLONS[m].s < s) lo = m; else hi = m; }
  const a = ECHANTILLONS[lo], b = ECHANTILLONS[hi];
  const k = b.s === a.s ? 0 : (s - a.s) / (b.s - a.s);
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
}
const R = 13, ESPACE = 29.5;
const CHEMIN = `M${P.x0} ${P.y0} C${P.x1} ${P.y1} ${P.x2} ${P.y2} ${P.x3} ${P.y3}`;

const sansAnimation = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const vibrer = (m: number | number[]) => { try { navigator.vibrate?.(m); } catch { /* pas de vibration (iPhone) */ } };

/** La misbaha dessinée : `perles` = nombre de perles déjà passées (glisse doucement vers la nouvelle valeur) */
export function Misbaha({ perles, style, separateur = 33, onToucher, petit }: {
  perles: number; style: ReglagesChapelet['chapelet']; separateur?: number; onToucher?: () => void; petit?: boolean;
}) {
  const uid = useId().replace(/:/g, '');
  const [aff, setAff] = useState(perles);
  const affRef = useRef(perles);
  useEffect(() => {
    const de = affRef.current, vers = perles;
    if (de === vers) return;
    if (sansAnimation() || Math.abs(vers - de) > 6) { affRef.current = vers; setAff(vers); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 320);
      const v = de + (vers - de) * (1 - Math.pow(1 - p, 3));
      affRef.current = v; setAff(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [perles]);

  const balance = Math.max(-1, Math.min(1, (perles - aff) * 2)) * 7; // le pompon se balance un peu quand une perle passe
  const centre = LONGUEUR / 2;
  const base = Math.round(aff);
  const vues: { i: number; x: number; y: number; o: number }[] = [];
  for (let k = -9; k <= 9; k++) {
    const i = base + k;
    const s = centre + (i - aff) * ESPACE;
    if (s < R + 6 || s > LONGUEUR - R - 6) continue;
    const bord = Math.min(s, LONGUEUR - s);
    vues.push({ i, ...pointA(s), o: Math.max(0.3, Math.min(1, (bord - R) / 30)) });
  }
  const bas = pointA(centre);
  return (
    <svg viewBox="0 0 360 250" className={cn('w-full h-auto select-none touch-manipulation', onToucher && 'cursor-pointer', petit ? 'max-w-[300px]' : 'max-w-[440px]')}
      role={onToucher ? 'button' : 'img'} aria-label={onToucher ? 'Toucher le chapelet pour compter une perle' : 'Chapelet'}
      tabIndex={onToucher ? 0 : undefined}
      onClick={onToucher} onKeyDown={(e) => { if (onToucher && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onToucher(); } }}>
      <DefsPerles uid={uid} style={style} />
      <defs>
        <radialGradient id={`${uid}-halo`}><stop offset="0" stopColor="#fff4c4" stopOpacity=".95" /><stop offset=".6" stopColor="#f5c542" stopOpacity=".45" /><stop offset="1" stopColor="#f5c542" stopOpacity="0" /></radialGradient>
      </defs>
      <path d={CHEMIN} stroke={FIL[style]} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Halo doré sous la perle à compter (en bas du U) */}
      <circle className="dhk-halo" cx={bas.x} cy={bas.y} r={R + 9} fill={`url(#${uid}-halo)`} />
      {vues.map((v) => {
        const sep = separateur > 1 && ((v.i % separateur) + separateur) % separateur === 0;
        return (
          <g key={v.i} transform={`translate(${v.x.toFixed(2)} ${v.y.toFixed(2)})`} opacity={v.o}>
            <ellipse cx="1.5" cy={R * 0.85} rx={R * 0.8} ry={R * 0.28} fill="#000" opacity=".12" />
            <Perle uid={uid} style={style} r={sep ? R + 2.5 : R} n={v.i} />
            {v.i === perles && <circle r={R + 3.5} fill="none" stroke="#e3b341" strokeWidth="2.2" opacity=".9" />}
          </g>
        );
      })}
      {/* Les 2 bouts du fil se rejoignent en haut : la perle « imam » et le pompon (gland), qui se balance doucement */}
      <path d={`M${P.x0} ${P.y0} L180 14 L${P.x3} ${P.y3}`} stroke={FIL[style]} strokeWidth="2" fill="none" strokeLinecap="round" />
      <g transform={`translate(180 8) rotate(${balance.toFixed(2)})`}>
        <Pompon uid={uid} style={style} taille={1.3} />
      </g>
    </svg>
  );
}

/** Les étoiles dorées de la fin */
function EtoilesDorees() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className="dhk-etoile absolute text-xl" style={{ left: `${6 + ((i * 37) % 88)}%`, bottom: `${8 + ((i * 23) % 40)}%`, animationDelay: `${(i % 6) * 0.35}s`, color: '#f5c542', textShadow: '0 0 8px rgba(245,197,66,.8)' }}>✦</span>
      ))}
    </div>
  );
}

export function ChoixChapelet({ ouvert, onFermer, valeur, onChoisir }: { ouvert: boolean; onFermer: () => void; valeur: ReglagesChapelet['chapelet']; onChoisir: (c: ReglagesChapelet['chapelet']) => void }) {
  const uid = useId().replace(/:/g, '');
  return (
    <Dialog open={ouvert} onOpenChange={(o) => { if (!o) onFermer(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>🎨 Choisis ton chapelet</DialogTitle>
          <DialogDescription>Gardé sur cet appareil.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CHAPELETS.map((c) => (
            <button key={c.cle} type="button" onClick={() => { onChoisir(c.cle); onFermer(); }} aria-pressed={valeur === c.cle}
              className={cn('rounded-2xl border-2 p-2 bg-gradient-to-b from-sky-50 to-white text-slate-800 transition active:scale-95',
                valeur === c.cle ? 'border-amber-500 ring-2 ring-amber-300' : 'border-slate-200 hover:border-amber-300')}>
              <ApercuChapelet style={c.cle} uid={`${uid}${c.cle}`} />
              <span className="block text-sm font-bold">{c.titre}{valeur === c.cle ? ' ✓' : ''}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Chapelet({ etapes, merite, source, degre, divergence, onFini, ambiance, onTerminer, libelleTerminer = '✅ Terminer' }: {
  etapes: EtapeChapelet[]; merite?: string | null; source?: string | null;
  /** 🕌 27/11 : degré d'authenticité de la source (vide = deviné d'après la source) */
  degre?: string | null; divergence?: string | null;
  /** Appelé à CHAQUE tour terminé, avec le nombre de dhikr du tour */
  onFini?: (nombre: number) => void;
  ambiance: Couleurs;
  /** Bouton de fin (ex. « Geste suivant ») ; absent = seulement « Encore un tour » */
  onTerminer?: () => void;
  libelleTerminer?: string;
}) {
  const [reglages, setReglages] = useState<ReglagesChapelet>(() => lireReglages());
  const changer = (r: Partial<ReglagesChapelet>) => setReglages((v) => { const n = { ...v, ...r }; ecrireLocal(CLE_REGLAGES, n); return n; });
  const [etat, setEtat] = useState<EtatCompteur>(compteurDepart);
  const etatRef = useRef(etat);
  const [perles, setPerles] = useState(0);
  const [enMarche, setEnMarche] = useState(false);
  const [passage, setPassage] = useState<string | null>(null);
  const [choix, setChoix] = useState(false);
  const onFiniRef = useRef(onFini);
  onFiniRef.current = onFini;
  const etapesRef = useRef(etapes);
  etapesRef.current = etapes;
  const totalTour = useMemo(() => etapes.reduce((s, e) => s + Math.max(1, e.nombre), 0), [etapes]);

  const compter = useCallback(() => {
    const r = avancer(etatRef.current, etapesRef.current);
    if (r.evt === 'rien') return;
    etatRef.current = r.etat; setEtat(r.etat);
    setPerles((p) => p + 1);
    if (r.evt === 'fini') {
      vibrer([90, 60, 180]);
      setEnMarche(false);
      onFiniRef.current?.(etapesRef.current.reduce((s, e) => s + Math.max(1, e.nombre), 0));
    } else if (r.evt === 'etape') {
      vibrer([30, 40, 30]);
      const fait = etapesRef.current[r.etat.etape - 1], suite = etapesRef.current[r.etat.etape];
      setPassage(`✓ ${fait?.titre ?? ''} — maintenant : ${suite?.titre ?? ''}`);
    } else vibrer(12);
  }, []);
  const annulerPerle = () => {
    const e = reculer(etatRef.current, etapesRef.current);
    if (e === etatRef.current) return;
    etatRef.current = e; setEtat(e); setPerles((p) => Math.max(0, p - 1));
  };
  const encoreUnTour = () => {
    const e = { etape: 0, compte: 0, tour: etatRef.current.tour + 1, fini: false };
    etatRef.current = e; setEtat(e);
    if (reglages.mode === 'auto') setEnMarche(true);
  };
  const recommencer = () => { const e = compteurDepart(); etatRef.current = e; setEtat(e); setEnMarche(false); };

  // Le message « ✓ … — maintenant : … » s'efface tout seul
  useEffect(() => { if (!passage) return; const t = setTimeout(() => setPassage(null), 2200); return () => clearTimeout(t); }, [passage]);

  // ▶️ Mode automatique : une perle toutes les 1,6 s (×1) ou 3,2 s (×0,5) ; s'arrête si l'appli passe en arrière-plan
  useEffect(() => {
    if (reglages.mode !== 'auto' || !enMarche || etat.fini) return;
    const t = setInterval(() => { if (document.visibilityState === 'visible') compter(); }, intervalleAuto(reglages.vitesse));
    return () => clearInterval(t);
  }, [reglages.mode, reglages.vitesse, enMarche, etat.fini, compter]);

  const etape = etapes[Math.min(etat.etape, etapes.length - 1)] ?? { titre: '', arabe: '', phonetique: '', sens: '', nombre: 1 };
  const badge = etat.fini ? 'Qu\'Allah accepte ton dhikr 🤲' : encouragement(etat.compte, etape.nombre);
  const nuit = ambiance.nom === 'nuit';
  const pastille = nuit ? 'bg-white/10 border-white/25' : 'bg-white/80 border-white';
  const nomChapelet = CHAPELETS.find((c) => c.cle === reglages.chapelet)?.titre ?? '';

  return (
    <div className="space-y-3" style={{ color: ambiance.texte }}>
      {/* Barre des étapes (après la prière : 4 étapes ; soir : 3) */}
      {etapes.length > 1 && (
        <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${etapes.length}, minmax(0, 1fr))` }} aria-label="Les étapes">
          {etapes.map((e, i) => {
            const faite = i < etat.etape || (etat.fini && i === etat.etape);
            const enCours = i === etat.etape && !etat.fini;
            return (
              <li key={i} className={cn('rounded-xl px-1 py-1.5 text-center border text-[11px] sm:text-xs font-bold leading-tight [overflow-wrap:anywhere]',
                faite ? 'bg-amber-400 border-amber-500 text-amber-950' : enCours ? (nuit ? 'bg-white/20 border-amber-300 text-white' : 'bg-white border-amber-400 text-slate-900') : (nuit ? 'bg-white/5 border-white/15 text-white/70' : 'bg-white/50 border-white text-slate-600'))}>
                <span className="block text-[10px] opacity-80">{faite ? '✓' : `${i + 1}`} · {e.nombre}</span>{e.titre}
              </li>
            );
          })}
        </ol>
      )}

      <div className="grid gap-3 lg:grid-cols-2 paysage:grid-cols-2 lg:items-center paysage:items-center">
        <div className="space-y-2 text-center min-w-0">
          <span key={badge} className={cn('dhk-apparait inline-block rounded-full border-2 px-3 py-1 text-sm font-extrabold shadow-sm', pastille)} style={{ borderColor: '#e3b341', color: ambiance.texte }} aria-live="polite">
            {badge}
          </span>
          {merite && (
            <p className="text-xs sm:text-sm leading-snug [overflow-wrap:anywhere]" style={{ color: ambiance.doux }}>
              ✨ {merite}{source && <span className="whitespace-nowrap font-bold"> — {source}</span>}
              {source && <PastilleSource source={source} degre={degre} divergence={divergence} compact className="ml-1" />}
            </p>
          )}
          <p dir="rtl" lang="ar" className="font-arabic text-2xl sm:text-3xl leading-[1.9] font-bold [overflow-wrap:anywhere]" style={{ color: ambiance.or, textShadow: nuit ? '0 0 12px rgba(245,210,122,.35)' : '0 1px 0 rgba(255,255,255,.7)' }}>
            {etape.arabe}
          </p>
          <p className="italic text-base sm:text-lg font-semibold [overflow-wrap:anywhere]">{etape.phonetique}</p>
          <p className="text-sm [overflow-wrap:anywhere]" style={{ color: ambiance.doux }}>{etape.sens}</p>
        </div>

        <div className="flex flex-col items-center gap-1 min-w-0">
          {/* Le grand compteur */}
          <div className="flex items-baseline gap-3" aria-live="polite">
            <span className="text-5xl sm:text-6xl font-black tabular-nums leading-none" style={{ color: ambiance.texte }}>
              {etat.compte}<span className="text-3xl sm:text-4xl opacity-60">/{etape.nombre}</span>
            </span>
            <span className={cn('rounded-full border px-2 py-0.5 text-xs font-bold whitespace-nowrap', pastille)}>Tour : {etat.tour}</span>
          </div>
          {passage && <p className="dhk-apparait rounded-full bg-amber-400 text-amber-950 px-3 py-1 text-xs sm:text-sm font-extrabold text-center [overflow-wrap:anywhere]">{passage}</p>}
          <div className="relative w-full flex justify-center">
            <Misbaha perles={perles} style={reglages.chapelet} separateur={etape.nombre >= 10 ? etape.nombre : 0}
              onToucher={!etat.fini && reglages.mode === 'rythme' ? compter : undefined} />
            {etat.fini && <EtoilesDorees />}
          </div>
        </div>
      </div>

      {etat.fini ? (
        <div className={cn('dhk-apparait relative overflow-hidden rounded-3xl border-2 p-4 text-center space-y-3', pastille)} style={{ borderColor: '#e3b341' }}>
          <EtoilesDorees />
          <p className="relative text-xl sm:text-2xl font-black">Qu'Allah accepte ton dhikr 🤲</p>
          <p className="relative text-sm" style={{ color: ambiance.doux }}>{totalTour} dhikr ce tour-ci · ajoutés à ton carnet</p>
          <div className="relative flex flex-wrap justify-center gap-2">
            <button type="button" onClick={encoreUnTour} className="rounded-full border-2 border-amber-400 bg-white text-slate-900 px-4 py-2 font-bold shadow-sm active:scale-95">🔁 Encore un tour</button>
            {onTerminer && <button type="button" onClick={onTerminer} className="rounded-full bg-amber-500 hover:bg-amber-600 text-amber-950 px-4 py-2 font-extrabold shadow active:scale-95">{libelleTerminer}</button>}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Le mode : un interrupteur à 2 positions ; la vitesse n'apparaît QU'EN automatique */}
          <div role="radiogroup" aria-label="Mode du chapelet" className={cn('mx-auto grid grid-cols-2 max-w-sm rounded-full border p-1', pastille)}>
            {([['rythme', '👆 À mon rythme'], ['auto', '▶️ Automatique']] as const).map(([m, l]) => (
              <button key={m} type="button" role="radio" aria-checked={reglages.mode === m}
                onClick={() => { changer({ mode: m }); setEnMarche(m === 'auto'); }}
                className={cn('rounded-full px-2 py-2 text-sm font-extrabold transition [overflow-wrap:anywhere]',
                  reglages.mode === m ? 'bg-amber-400 text-amber-950 shadow' : nuit ? 'text-white/85' : 'text-slate-700')}>
                {l}
              </button>
            ))}
          </div>
          {reglages.mode === 'auto' ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {([0.5, 1] as const).map((v) => (
                <button key={v} type="button" onClick={() => changer({ vitesse: v })} aria-pressed={reglages.vitesse === v}
                  className={cn('rounded-full border-2 px-3 py-1 text-sm font-bold', reglages.vitesse === v ? 'border-amber-400 bg-amber-100 text-amber-950' : cn(pastille, nuit ? 'text-white' : 'text-slate-700'))}>
                  ×{v === 0.5 ? '0,5' : '1'}
                </button>
              ))}
              <button type="button" onClick={() => setEnMarche((m) => !m)}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-amber-950 px-4 py-2 font-extrabold shadow active:scale-95">
                {enMarche ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> {etat.compte || etat.etape ? 'Reprendre' : 'Commencer'}</>}
              </button>
            </div>
          ) : (
            <button type="button" onClick={compter}
              className="mx-auto block w-full max-w-sm rounded-3xl bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 py-4 text-lg font-black shadow-lg ring-2 ring-white/70 active:scale-[0.98] transition-transform">
              👆 Toucher pour compter
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <button type="button" onClick={() => setChoix(true)} className={cn('rounded-full border px-3 py-1.5 font-bold', pastille, nuit ? 'text-white' : 'text-slate-800')}>🎨 Mon chapelet : {nomChapelet}</button>
        {!etat.fini && (etat.compte > 0 || etat.etape > 0) && (
          <button type="button" onClick={annulerPerle} className={cn('inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-bold', pastille, nuit ? 'text-white' : 'text-slate-800')}>
            <Undo2 className="h-3.5 w-3.5" /> Une perle en arrière
          </button>
        )}
        {(etat.compte > 0 || etat.etape > 0 || etat.tour > 1) && (
          <button type="button" onClick={recommencer} className={cn('inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-bold', pastille, nuit ? 'text-white' : 'text-slate-800')}>
            <RotateCcw className="h-3.5 w-3.5" /> Recommencer
          </button>
        )}
      </div>
      <ChoixChapelet ouvert={choix} onFermer={() => setChoix(false)} valeur={reglages.chapelet} onChoisir={(c) => changer({ chapelet: c })} />
    </div>
  );
}
