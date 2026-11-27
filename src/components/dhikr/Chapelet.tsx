import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pause, Play, RotateCcw, Undo2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { PastilleSource } from '@/components/shared/DegreAuthenticite';
import {
  avancer, CHAPELETS, CLE_REGLAGES, compteurDepart, ecrireLocal, etatCercle, intervalleAuto, lireReglages, reculer,
  type EtatCompteur, type ReglagesChapelet,
} from '@/lib/dhikr';
import { ApercuChapelet, DefsPerles, FIL, Perle } from './Perles';
import type { Couleurs } from './Ambiance';

/**
 * 📿 LE CHAPELET (Nadia, 27/11, présentation A) — utilisé PARTOUT où l'on compte (chapelet libre, séries, après la prière…).
 * En haut l'arabe doré, la phonétique, le sens, puis le mérite + sa source (27/11 soir : sous le sens ; plus de bulle d'encouragement) ;
 * en dessous, 2 colonnes : à gauche le choix du dhikr + les boutons, à droite le chapelet (le verset 40:14 est parti dans la carte Hadiths, 28/11) ; le grand compteur « 18/33 » +
 * « Tour : 1 » au CENTRE d'un cercle de 11 perles (27/11, 2ᵉ demande : la perle à compter en doré, 33 = 3 tours de 11) ;
 * dessous le gros bouton doré « 👆 Touchez pour compter » et le verset (Ghâfir 40:14) avec « En savoir plus ».
 * Deux modes : 👆 À mon rythme (toucher le grand bouton ou le chapelet) / ▶️ Automatique (vitesse ×0,5 / ×1, pause).
 * Petite vibration à chaque perle, plus forte à la fin. Tout marche sans réseau ; le choix du chapelet et du mode est gardé sur l'appareil.
 */
export interface EtapeChapelet { titre: string; arabe: string; phonetique: string; sens: string; nombre: number;
  /** Clé du dhikr (dhikr_items.cle) : certains ont leur propre temps en automatique (`intervalleAuto`) */
  cle?: string | null }

// ─── Le chapelet en CERCLE (Nadia, 27/11, 2ᵉ demande, d'après sa capture) ───
// 11 perles en cercle autour du compteur ; la perle à compter est DORÉE. 33 = 3 tours de 11 (« Tour : 1, 2, 3 »),
// 100 = 10 tours (le dernier n'a qu'1 perle), 34 = 4 tours. Moins de 11 (ex. 3 fois) : autant de perles que de fois.
const sansAnimation = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const vibrer = (m: number | number[]) => { try { navigator.vibrate?.(m); } catch { /* pas de vibration (iPhone) */ } };

/** Le cercle de perles dessiné, avec le compteur au centre ; toucher le cercle = une perle de plus */
export function CercleChapelet({ compte, nombre, style, onToucher, tourComplet = 1 }: {
  compte: number; nombre: number; style: ReglagesChapelet['chapelet']; onToucher?: () => void;
  /** « Encore un tour » : 2, 3… (affiché discrètement) */
  tourComplet?: number;
}) {
  const uid = useId().replace(/:/g, '');
  const c = etatCercle(compte, nombre);
  const R = c.parTour === 1 ? 0 : 108;                 // rayon du cercle des perles
  const r = c.parTour <= 4 ? 24 : 20;                  // rayon d'une perle
  const anime = !sansAnimation();
  const perles = Array.from({ length: c.parTour }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / c.parTour;
    return { i, x: 150 + R * Math.cos(a), y: (c.parTour === 1 ? 46 : 150) + R * Math.sin(a) };
  });
  return (
    <div className="dhk-cercle relative w-full max-w-[310px] paysage:max-w-[250px] mx-auto aspect-square select-none">
      <svg viewBox="0 0 300 300" className={cn('absolute inset-0 w-full h-full touch-manipulation', onToucher && 'cursor-pointer')}
        role={onToucher ? 'button' : 'img'} tabIndex={onToucher ? 0 : undefined}
        aria-label={onToucher ? 'Toucher le chapelet pour compter une perle' : 'Chapelet'}
        onClick={onToucher} onKeyDown={(e) => { if (onToucher && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onToucher(); } }}>
        <DefsPerles uid={uid} style={style} />
        <DefsPerles uid={`${uid}or`} style="dore" />
        <defs>
          <radialGradient id={`${uid}-halo`}><stop offset="0" stopColor="#fff4c4" stopOpacity=".95" /><stop offset=".55" stopColor="#f5c542" stopOpacity=".5" /><stop offset="1" stopColor="#f5c542" stopOpacity="0" /></radialGradient>
          <radialGradient id={`${uid}-centre`} cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#fffdf8" stopOpacity=".96" /><stop offset="1" stopColor="#fbeedd" stopOpacity=".9" /></radialGradient>
          <filter id={`${uid}-ombre`} x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2.2" stdDeviation="2.4" floodColor="#7a4b1e" floodOpacity=".28" /></filter>
        </defs>
        {/* Le fil du chapelet */}
        {c.parTour > 1 && <circle cx="150" cy="150" r={R} stroke={FIL[style]} strokeWidth="2.2" fill="none" opacity=".9" />}
        {/* Le disque crème du compteur, au centre */}
        <circle cx="150" cy="150" r={c.parTour > 1 ? R - r - 12 : 70} fill={`url(#${uid}-centre)`} stroke="#e8c98a" strokeWidth="1.5" />
        {perles.map((p) => {
          const aCompter = !c.fini && p.i === c.position;
          const passee = c.fini || p.i < c.position;
          const inutile = p.i >= c.utiles;
          return (
            <g key={p.i} transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`} opacity={inutile ? 0.28 : 1}>
              {aCompter && <circle r={r + 12} fill={`url(#${uid}-halo)`} className={anime ? 'dhk-halo' : undefined} />}
              <g filter={`url(#${uid}-ombre)`} className={aCompter && anime ? 'dhk-perle-active' : undefined}>
                {aCompter ? <Perle uid={`${uid}or`} style="dore" r={r + 2} n={p.i} /> : <Perle uid={uid} style={style} r={r} n={p.i} />}
              </g>
              {aCompter && <circle r={r + 5} fill="none" stroke="#d8a531" strokeWidth="2.4" />}
              {passee && !aCompter && <circle r={r + 2.5} fill="none" stroke="#e3b341" strokeWidth="1.4" opacity=".55" />}
            </g>
          );
        })}
      </svg>
      {/* Le compteur au centre : « 1 /33 » et « Tour : 1 » */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" aria-live="polite">
        <p className="font-black tabular-nums leading-none text-[#2b1630]">
          <span className={nombre >= 100 ? 'dhk-num-long' : 'dhk-num'}>{compte}</span><span className="dhk-sur text-[#8a5300]"> /{nombre}</span>
        </p>
        <p className="mt-1.5 rounded-full bg-gradient-to-b from-[#f7d77e] to-[#dfa83a] dhk-tour px-3 py-0.5 font-extrabold text-[#3d2500] shadow-sm">
          Tour : {c.tour}{c.tours > 1 && <span className="font-bold opacity-75"> / {c.tours}</span>}
        </p>
        {tourComplet > 1 && <p className="dhk-fois mt-1 font-bold text-[#5b3a52]">🔁 {tourComplet}ᵉ fois</p>}
      </div>
    </div>
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


export function Chapelet({ etapes, merite, source, degre, divergence, onFini, ambiance, onTerminer, libelleTerminer = '✅ Terminer', choixDhikr }: {
  etapes: EtapeChapelet[]; merite?: string | null; source?: string | null;
  /** 🕌 27/11 : degré d'authenticité de la source (vide = deviné d'après la source) */
  degre?: string | null; divergence?: string | null;
  /** Appelé à CHAQUE tour terminé, avec le nombre de dhikr du tour */
  onFini?: (nombre: number) => void;
  ambiance: Couleurs;
  /** Bouton de fin (ex. « Geste suivant ») ; absent = seulement « Encore un tour » */
  onTerminer?: () => void;
  libelleTerminer?: string;
  /** 28/11 (Nadia) : le choix du dhikr (Soubhâna-llâh · 33…), en haut de la colonne de gauche */
  choixDhikr?: ReactNode;
}) {
  const [reglages, setReglages] = useState<ReglagesChapelet>(() => lireReglages());
  const changer = (r: Partial<ReglagesChapelet>) => setReglages((v) => { const n = { ...v, ...r }; ecrireLocal(CLE_REGLAGES, n); return n; });
  const [etat, setEtat] = useState<EtatCompteur>(compteurDepart);
  const etatRef = useRef(etat);
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
    etatRef.current = e; setEtat(e);
  };
  const encoreUnTour = () => {
    const e = { etape: 0, compte: 0, tour: etatRef.current.tour + 1, fini: false };
    etatRef.current = e; setEtat(e);
    if (reglages.mode === 'auto') setEnMarche(true);
  };
  const recommencer = () => { const e = compteurDepart(); etatRef.current = e; setEtat(e); setEnMarche(false); };

  // Le message « ✓ … — maintenant : … » s'efface tout seul
  useEffect(() => { if (!passage) return; const t = setTimeout(() => setPassage(null), 2200); return () => clearTimeout(t); }, [passage]);

  // ▶️ Mode automatique : une perle toutes les 1,6 s (×1) ou 3,2 s (×0,5) — 15 s / 30 s pour le tahlil ×100 ;
  // s'arrête si l'appli passe en arrière-plan
  const cleEtape = etapes[Math.min(etat.etape, etapes.length - 1)]?.cle ?? null;
  useEffect(() => {
    if (reglages.mode !== 'auto' || !enMarche || etat.fini) return;
    const t = setInterval(() => { if (document.visibilityState === 'visible') compter(); }, intervalleAuto(reglages.vitesse, cleEtape));
    return () => clearInterval(t);
  }, [reglages.mode, reglages.vitesse, enMarche, etat.fini, compter, cleEtape]);

  const etape = etapes[Math.min(etat.etape, etapes.length - 1)] ?? { titre: '', arabe: '', phonetique: '', sens: '', nombre: 1 };
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

      {/* Le dhikr : arabe, phonétique, sens, puis le mérite et sa source (sous le sens, choix de Nadia du 27/11) */}
      <div className="space-y-1 text-center min-w-0">
        <p dir="rtl" lang="ar" className="font-arabic text-2xl sm:text-3xl leading-[1.8] font-bold [overflow-wrap:anywhere]" style={{ color: ambiance.or, textShadow: nuit ? '0 0 12px rgba(245,210,122,.35)' : '0 1px 0 rgba(255,255,255,.7)' }}>
          {etape.arabe}
        </p>
        <p className="italic text-base sm:text-lg font-semibold [overflow-wrap:anywhere]">{etape.phonetique}</p>
        <p className="text-sm [overflow-wrap:anywhere]" style={{ color: ambiance.doux }}>{etape.sens}</p>
        {merite && (
          <p className="text-xs sm:text-sm leading-snug [overflow-wrap:anywhere]" style={{ color: ambiance.doux }}>
            ✨ {merite}{source && <span className="whitespace-nowrap font-bold"> — {source}</span>}
            {source && <PastilleSource source={source} degre={degre} divergence={divergence} compact className="ml-1" />}
          </p>
        )}
      </div>
      {passage && <p className="dhk-apparait mx-auto w-fit rounded-full bg-amber-400 text-amber-950 px-3 py-1 text-xs sm:text-sm font-extrabold text-center [overflow-wrap:anywhere]">{passage}</p>}

      {/* 2 colonnes (Nadia, 27/11 soir puis 28/11) : à gauche le choix du dhikr puis les boutons, à droite le chapelet */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 items-center">
        <div className="space-y-2 min-w-0">
          {choixDhikr}
          {etat.fini ? (
            <div className={cn('dhk-apparait relative overflow-hidden rounded-3xl border-2 p-3 sm:p-4 text-center space-y-2 sm:space-y-3', pastille)} style={{ borderColor: '#e3b341' }}>
              <EtoilesDorees />
              <p className="relative text-lg sm:text-2xl font-black">Qu'Allah accepte ton dhikr 🤲</p>
              <p className="relative text-sm" style={{ color: ambiance.doux }}>{totalTour} dhikr ce tour-ci · ajoutés à ton carnet</p>
              <div className="relative flex flex-wrap justify-center gap-2">
                <button type="button" onClick={encoreUnTour} className="rounded-full border-2 border-amber-400 bg-white text-slate-900 px-4 py-2 font-bold shadow-sm active:scale-95">🔁 Encore un tour</button>
                {onTerminer && <button type="button" onClick={onTerminer} className="rounded-full bg-amber-500 hover:bg-amber-600 text-amber-950 px-4 py-2 font-extrabold shadow active:scale-95">{libelleTerminer}</button>}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Le mode : un interrupteur à 2 positions ; la vitesse n'apparaît QU'EN automatique */}
              <div role="radiogroup" aria-label="Mode du chapelet" className={cn('mx-auto grid grid-cols-1 min-[560px]:grid-cols-2 max-w-sm rounded-[1.4rem] border p-1 gap-0.5', pastille)}>
                {([['rythme', '👆 À mon rythme'], ['auto', '▶️ Automatique']] as const).map(([m, l]) => (
                  <button key={m} type="button" role="radio" aria-checked={reglages.mode === m}
                    onClick={() => { changer({ mode: m }); setEnMarche(m === 'auto'); }}
                    className={cn('rounded-full px-2 py-1.5 sm:py-2 text-xs sm:text-sm font-extrabold transition',
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
                  className="mx-auto block w-full max-w-sm rounded-full bg-gradient-to-b from-[#f9dc85] via-[#ecb948] to-[#d29a2a] text-[#3d2500] py-3 sm:py-4 text-base sm:text-lg font-black shadow-[0_4px_14px_rgba(185,131,31,.45)] ring-2 ring-white/80 active:scale-[0.98] transition-transform">
                  👆 Touchez pour compter
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
        </div>
        <div className="relative min-w-0 flex justify-center">
          <CercleChapelet compte={etat.compte} nombre={etape.nombre} style={reglages.chapelet} tourComplet={etat.tour}
            onToucher={!etat.fini && reglages.mode === 'rythme' ? compter : undefined} />
          {etat.fini && <EtoilesDorees />}
        </div>
      </div>
      <ChoixChapelet ouvert={choix} onFermer={() => setChoix(false)} valeur={reglages.chapelet} onChoisir={(c) => changer({ chapelet: c })} />
    </div>
  );
}
