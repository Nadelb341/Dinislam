import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BulleTuEsIci } from '@/components/shared/BulleTuEsIci';
import { compagnonSvg, COMPAGNONS, imageDeCarteRamadan, type CompagnonRamadan } from '@/components/saisons/dessinsRamadan';

/**
 * 🌙 Parcours Nourania en serpentin (Nadia, 2026-11-18) : même disposition que le parcours des sourates
 * (rangées de 3, ruban qui serpente, défilement vers la leçon en cours), aux couleurs de Nourania : bleu nuit et or.
 * Petites images de la saison Ramadan le long du chemin (lanterne, croissant, colombe, tapis…), discrètes.
 * 🎁 Cadeau aux leçons 9, 14 et 17. Validée = or plein ; en cours = bulle « Tu es ici » + halo doux ; verrouillée = grisée.
 * Seul l'affichage change : l'ouverture d'une leçon passe par `onLessonClick` (même logique qu'avant).
 */
export interface LeconParcours { id: string; lesson_number: number; title_arabic: string | null; title_french: string | null }
export interface EtatLecon { validee: boolean; enAttente: boolean; ouverte: boolean }

const LECONS_CADEAU = new Set([9, 14, 17]);
const PAR_RANGEE = 3;
const HAUT_RANGEE = 160;
const MARGE_HAUT = 70;
const TAILLE = 66;
const RUBAN = 13;
const BOMBE = 40;

// Décors le long du chemin : une petite image dans chaque creux de virage, à tour de rôle
type Decor = { k: 'image'; slug: string } | { k: 'compagnon'; c: CompagnonRamadan };
const DECORS: Decor[] = [
  { k: 'image', slug: 'nourania' }, { k: 'compagnon', c: 'colombe' }, { k: 'image', slug: 'invocations' },
  { k: 'compagnon', c: 'tapis' }, { k: 'image', slug: 'alphabet' }, { k: 'compagnon', c: 'dromadaire' },
  { k: 'image', slug: 'hadiths' }, { k: 'compagnon', c: 'lune' },
];

// Petites étoiles fixes dans le ciel (positions en fraction, toujours les mêmes)
const ETOILES = Array.from({ length: 34 }, (_, i) => ({
  x: ((i * 37) % 97) / 100 + 0.015,
  y: ((i * 53) % 101) / 101,
  r: i % 5 === 0 ? 1.6 : i % 3 === 0 ? 1.2 : 0.8,
  d: (i % 7) * 0.6,
}));

export default function NouraniaPathView({ lessons, etat, onLessonClick }: {
  lessons: LeconParcours[];
  etat: (lesson: LeconParcours, index: number) => EtatLecon;
  onLessonClick: (lesson: LeconParcours, index: number) => void;
}) {
  const [largeur, setLargeur] = useState(340);
  const enCoursRef = useRef<HTMLDivElement>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const boite = useCallback((node: HTMLDivElement | null) => {
    observer.current?.disconnect();
    if (!node) return;
    const o = new ResizeObserver((e) => { const w = Math.floor(e[0].contentRect.width); if (w > 0) setLargeur(Math.min(w, 440)); });
    o.observe(node);
    observer.current = o;
  }, []);
  useEffect(() => () => observer.current?.disconnect(), []);

  const W = largeur;
  const xs = useMemo(() => [W * 0.18, W * 0.5, W * 0.82], [W]);
  const etats = useMemo(() => lessons.map((l, i) => etat(l, i)), [lessons, etat]);
  const noeuds = useMemo(() => lessons.map((lecon, i) => {
    const rangee = Math.floor(i / PAR_RANGEE), col = i % PAR_RANGEE;
    const x = rangee % 2 === 0 ? xs[col] : xs[2 - col];
    return { x, y: MARGE_HAUT + rangee * HAUT_RANGEE, lecon, i };
  }), [lessons, xs]);

  const enCours = useMemo(() => etats.findIndex((e) => e.ouverte && !e.validee), [etats]);

  // Défilement vers la leçon en cours
  useEffect(() => {
    if (enCours < 0) return;
    const t = setTimeout(() => enCoursRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    return () => clearTimeout(t);
  }, [enCours]);

  const segments = useMemo(() => noeuds.slice(0, -1).map((a, i) => {
    const b = noeuds[i + 1];
    const r1 = Math.floor(i / PAR_RANGEE), r2 = Math.floor((i + 1) / PAR_RANGEE);
    if (r1 === r2) return { d: `M ${a.x} ${a.y} L ${b.x} ${b.y}`, vers: i + 1 };
    const bx = r1 % 2 === 0 ? xs[2] + BOMBE : xs[0] - BOMBE;
    return { d: `M ${a.x} ${a.y} C ${bx} ${a.y + HAUT_RANGEE * 0.4}, ${bx} ${b.y - HAUT_RANGEE * 0.4}, ${b.x} ${b.y}`, vers: i + 1 };
  }), [noeuds, xs]);

  const rangees = Math.ceil(lessons.length / PAR_RANGEE);
  const hauteur = MARGE_HAUT + Math.max(0, rangees - 1) * HAUT_RANGEE + 120;

  // Un décor dans le creux de chaque virage (côté opposé à la courbe), entre le nom d'une rangée et l'étoile de la suivante.
  // Pas de décor quand la leçon en cours est juste en dessous (sa bulle « Tu es ici » passerait dessus).
  const decors = useMemo(() => Array.from({ length: Math.max(0, rangees - 1) }, (_, r) => {
    if (enCours === (r + 1) * PAR_RANGEE + 2) return null;
    const d = DECORS[r % DECORS.length];
    const gauche = r % 2 === 0; // virage à droite → creux à gauche
    const svg = d.k === 'image' ? imageDeCarteRamadan(d.slug, r) : compagnonSvg(d.c, `np${r}`);
    const vb = d.k === 'image' ? '0 0 48 48' : `0 0 ${COMPAGNONS[d.c].vb[0]} ${COMPAGNONS[d.c].vb[1]}`;
    const l = d.k === 'compagnon' && d.c !== 'colombe' && d.c !== 'lune' ? 44 : 34;
    return { svg, vb, l, x: gauche ? 2 : W - 2 - l, y: MARGE_HAUT + r * HAUT_RANGEE + 104, miroir: !gauche && d.k === 'compagnon' };
  }).filter((d): d is NonNullable<typeof d> => d !== null), [rangees, W, enCours]);

  const couleurRuban = (vers: number) => {
    const e = etats[vers];
    if (e?.validee) return '#e7bf55';
    if (e?.ouverte) return '#a9bcff';
    return '#4a5a96';
  };

  return (
    <div ref={boite} className="relative w-full overflow-hidden rounded-3xl border border-[#c9a04a]/40 bg-gradient-to-b from-[#17307a] via-[#1f43a3] to-[#2856c0] shadow-[inset_0_0_40px_rgba(0,0,0,0.22)]">
      <style>{`
        @keyframes np-halo { 0%,100% { filter: drop-shadow(0 0 5px rgba(240,200,100,.55)); transform: scale(1); } 50% { filter: drop-shadow(0 0 14px rgba(245,210,120,.9)); transform: scale(1.06); } }
        .np-en-cours { animation: np-halo 2.4s ease-in-out infinite; }
        /* Leçon validée : plus lumineuse (Nadia, 2026-11-18) */
        .np-validee { filter: drop-shadow(0 0 7px rgba(255,222,120,.95)) drop-shadow(0 0 16px rgba(255,205,90,.55)); }
        @keyframes np-scintille { 0%,100% { opacity: .25; } 50% { opacity: .9; } }
        .np-etoile { animation: np-scintille 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .np-en-cours, .np-etoile, .bulle-tu-es-ici { animation: none !important; } }
      `}</style>
      <div className="relative mx-auto" style={{ width: W, height: hauteur }}>
        {/* Ciel étoilé + ruban */}
        <svg className="pointer-events-none absolute inset-0" width={W} height={hauteur} viewBox={`0 0 ${W} ${hauteur}`} fill="none" aria-hidden>
          {ETOILES.map((e, i) => (
            <circle key={i} className="np-etoile" cx={e.x * W} cy={e.y * hauteur} r={e.r} fill="#fff3c4" style={{ animationDelay: `${-e.d}s` }} />
          ))}
          {segments.map((s, i) => <path key={`o${i}`} d={s.d} stroke="#000" strokeOpacity={0.25} strokeWidth={RUBAN + 4} strokeLinecap="round" />)}
          {segments.map((s, i) => <path key={`r${i}`} d={s.d} stroke={couleurRuban(s.vers)} strokeWidth={RUBAN} strokeLinecap="round" opacity={0.85} />)}
          {segments.map((s, i) => <path key={`p${i}`} d={s.d} stroke="#fff6d8" strokeOpacity={0.35} strokeWidth={1.4} strokeDasharray="2 7" strokeLinecap="round" />)}
        </svg>

        {/* Petites images de la saison Ramadan dans les virages */}
        {decors.map((d, i) => (
          <svg key={`d${i}`} viewBox={d.vb} aria-hidden className="pointer-events-none absolute overflow-visible opacity-90"
            style={{ left: d.x, top: d.y - d.l / 2, width: d.l, height: d.l, transform: d.miroir ? 'scaleX(-1)' : undefined }}
            dangerouslySetInnerHTML={{ __html: d.svg }} />
        ))}

        {/* Les leçons */}
        {noeuds.map(({ x, y, lecon, i }) => {
          const e = etats[i];
          const courante = i === enCours;
          const cadeau = LECONS_CADEAU.has(lecon.lesson_number);
          const ouvrir = () => onLessonClick(lecon, i);
          return (
            <div key={lecon.id} id={`lesson-${lecon.id}`} ref={courante ? enCoursRef : undefined}
              className="absolute flex flex-col items-center" style={{ left: x - TAILLE / 2, top: y - TAILLE / 2, width: TAILLE }}>
              {courante && <BulleTuEsIci onClick={ouvrir} haut={32} />}
              {cadeau && (
                <span aria-hidden className={cn('absolute z-10 text-xl leading-none drop-shadow', courante ? '-right-4 -top-1' : '-top-4 left-1/2 -translate-x-1/2')}>🎁</span>
              )}
              <button type="button" onClick={ouvrir} disabled={!e.ouverte}
                aria-label={`Leçon ${lecon.lesson_number}${lecon.title_french ? ` : ${lecon.title_french}` : ''}${e.validee ? ', validée' : e.enAttente ? ', en attente de validation' : !e.ouverte ? ', verrouillée' : ''}`}
                className={cn('relative grid place-items-center rounded-full transition-transform duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f3c86a]',
                  e.ouverte && !e.validee && 'hover:scale-105', courante && 'np-en-cours', e.validee && 'np-validee', !e.ouverte && 'cursor-not-allowed')}
                style={{ width: TAILLE, height: TAILLE }}>
                <svg viewBox="0 0 66 66" className="absolute inset-0 h-full w-full" aria-hidden>
                  <defs>
                    <linearGradient id={`npo${i}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff6cf" /><stop offset=".5" stopColor="#f5cd55" /><stop offset="1" stopColor="#d9a521" /></linearGradient>
                    <linearGradient id={`npb${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3f62cc" /><stop offset="1" stopColor="#21409a" /></linearGradient>
                  </defs>
                  {/* Étoile à 8 branches arrondie (deux carrés croisés), comme les motifs des livres de Nourania */}
                  {[0, 45].map((r) => (
                    <rect key={r} x="13" y="13" width="40" height="40" rx="7" transform={`rotate(${r} 33 33)`}
                      fill={e.validee ? `url(#npo${i})` : e.ouverte ? `url(#npb${i})` : '#5a6898'}
                      stroke={e.validee ? '#fff1bf' : e.ouverte ? '#e7bf55' : '#646c90'} strokeWidth={e.ouverte || e.validee ? 2.4 : 1.4} />
                  ))}
                  <circle cx="33" cy="33" r="15" fill={e.validee ? '#ffe28a' : e.ouverte ? '#1f3d94' : '#65729f'} stroke={e.validee ? '#fff4cf' : e.ouverte ? '#e7bf55' : '#6d7598'} strokeWidth="1.2" />
                </svg>
                <span className={cn('relative text-[15px] font-extrabold leading-none tabular-nums', e.validee ? 'text-[#6b4a00]' : e.ouverte ? 'text-[#ffe08a]' : 'text-[#e1e6f7]')}>
                  {e.validee ? <Check className="h-5 w-5" strokeWidth={3} /> : !e.ouverte ? <Lock className="h-4 w-4" /> : lecon.lesson_number}
                </span>
                {e.enAttente && !e.validee && (
                  <span aria-hidden className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border border-[#e7bf55] bg-[#fff4d6] text-[11px]">⏳</span>
                )}
              </button>
              <span className={cn('mt-1.5 w-[104px] text-center text-[10px] font-medium leading-snug [overflow-wrap:break-word] [hyphens:none]', e.ouverte ? 'text-[#f6efdc]' : 'text-[#c9d1ee]')}>
                <span className="text-[13px] font-extrabold text-[#ffd86e]">Leçon {lecon.lesson_number}</span>
                {lecon.title_french ? <><br />{lecon.title_french.replace(/^Leçon\s*\d+\s*[-–:]\s*/i, '')}</> : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
