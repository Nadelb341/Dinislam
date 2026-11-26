import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import type { ReglagesSaisons } from '@/lib/saisons';
import type { PeriodeRamadan } from '@/lib/ramadanDates';
import { EVT_VALIDATION, preparerSon, sonTintement } from '@/lib/sonSaison';
import { habitSvg, PAUSE_MS, toucherCompagnon, useHabitDuJour, useTailleCompagnon } from './compagnonEvenement';
import { jourHijriDe } from '@/lib/phaseLune';
import { usePaysage } from '@/hooks/usePaysage';
import { CACTUS_VB, COMPAGNONS, KAABA_VB, LANTERNE_VB, MESA_VB, MOSQUEE_VB, MOUTON_VB, NB_LANTERNES, PALMIER_VB, TOUFFE, cactusSvg, compagnonSvg, etoilePendue, kaabaSvg, lanterneSvg, mesaSvg, mosqueeSvg, moutonSvg, palmierSvg, rocherSvg } from './dessinsRamadan';

/**
 * 🌙 Décor de la 5ᵉ saison « Ramadan » (choix de Nadia du 2026-11-15 : ambiance B « sable doré et lanternes », un peu des
 * autres SANS surcharger — « ça étouffe »). Même base que les 4 saisons :
 * - guirlande sur toute la largeur en haut : des lanternes DIFFÉRENTES et lumineuses qui DÉFILENT doucement le long du fil ;
 * - Kaaba en haut à gauche (à la place de l'arbre), mosquée en bas à droite (à la place de la cheminée), dunes en bas ;
 * - 2026-11-17 (Nadia) : en bas, un vrai petit DÉSERT (rochers orangés au loin, palmiers, cactus, rochers, touffes) où MARCHE
 *   le dromadaire (il grandit, parle et porte son habit du jour comme les autres compagnons). Le tapis volant, lui, se promène
 *   dans toute l'appli (TapisPromeneur) ;
 * - 2026-11-17 (Nadia, finition C éclaircie) : dessins refaits ; la lune suit la VRAIE phase du mois (croissant éclairé à droite
 *   au début, pleine lune au milieu, croissant éclairé à gauche à la fin) ; au Maghrib les lanternes s'allument UNE PAR UNE ;
 *   petites étoiles pendues entre les lanternes ; le dromadaire cligne des yeux et remue la queue en marchant ; le tapis ondule.
 * - quelques étoiles et croissants qui tombent (on les attrape : paillettes + tintement) ;
 * - lanternes légèrement allumées le jour, au MAXIMUM dès le Maghrib (classe `ramadan-soir`) ; ciel plus étoilé les 10 dernières nuits
 *   + étoile filante rare à attraper ;
 * - pluie de dattes, d'étoiles et de petites lanternes à chaque validation ;
 * - Aïd el-Fitr : même décor, plus festif (ballons, feux d'artifice, cadeaux) ; Aïd el-Adha (3 jours) : en plus, des moutons.
 * Rien ne bloque les cartes (seuls le compagnon et les petites étoiles se touchent).
 */
type Chute = { id: number; x: number; d: number; v: number; t: number; k: 'etoile' | 'croissant' };
type Goutte = { id: number; x: number; d: number; v: number; k: 'datte' | 'etoile' | 'lanterne' };
let compteur = 0;

export function DecorRamadan({ r, soir, fete, userId }: { r: ReglagesSaisons; soir: boolean; fete: PeriodeRamadan; userId: string | null }) {
  const c = r.ramadan;
  const mode = fete?.mode ?? 'ramadan';
  const reduit = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const calme = reduit && !r.animerToujours;
  const perso = 'dromadaire' as const;
  const taille = useTailleCompagnon();
  const habit = useHabitDuJour(userId);
  const dernieresNuits = c.dernieresNuits && mode === 'ramadan' && (fete?.jour ?? 0) >= 21;
  const jourHijri = jourHijriDe(fete);

  // Couleurs + soir sur toute la page
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('saison-soir', soir);
    html.classList.toggle('ramadan-soir', soir);
    html.classList.toggle('ramadan-aid', mode !== 'ramadan');
    return () => { html.classList.remove('saison-soir', 'ramadan-soir', 'ramadan-aid'); };
  }, [soir, mode]);
  useEffect(() => { preparerSon(); }, []);

  // Discret pendant qu'on fait défiler (comme la cheminée)
  const [defile, setDefile] = useState(false);
  useEffect(() => {
    let t = 0;
    const f = () => { setDefile(true); clearTimeout(t); t = window.setTimeout(() => setDefile(false), 700); };
    window.addEventListener('scroll', f, { passive: true });
    return () => { window.removeEventListener('scroll', f); clearTimeout(t); };
  }, []);

  // ⭐ Quelques étoiles et croissants qui tombent (peu : « pas surcharger »)
  const chutes = useMemo<Chute[]>(() => Array.from({ length: Math.max(4, Math.min(10, Math.round(r.quantite / 2.5))) }, (_, i) => ({
    id: i, x: (i * 37 + 7) % 96, d: -(i * 3.7) % 22, v: 16 + (i % 4) * 3, t: 14 + (i % 3) * 4, k: i % 3 === 0 ? 'croissant' : 'etoile',
  })), [r.quantite]);
  const [attrapees, setAttrapees] = useState<Set<number>>(new Set());
  const [eclats, setEclats] = useState<{ id: number; x: number; y: number }[]>([]);
  const attraper = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setAttrapees((s) => new Set(s).add(id));
    const ec = { id: ++compteur, x: e.clientX, y: e.clientY };
    setEclats((x) => [...x, ec]);
    if (c.son) sonTintement();
    setTimeout(() => setEclats((x) => x.filter((y) => y.id !== ec.id)), 900);
    setTimeout(() => setAttrapees((s) => { const n = new Set(s); n.delete(id); return n; }), 6000);
  };

  // 🎊 Pluie à chaque validation
  const [pluie, setPluie] = useState<Goutte[]>([]);
  useEffect(() => {
    if (!c.pluieValidation) return;
    const pleuvoir = () => {
      const kinds: Goutte['k'][] = ['datte', 'etoile', 'datte', 'lanterne', 'etoile'];
      const n = Array.from({ length: 26 }, (_, i) => ({ id: ++compteur, x: Math.random() * 96, d: Math.random() * 0.9, v: 2.6 + Math.random() * 1.4, k: kinds[i % kinds.length] }));
      setPluie((p) => [...p, ...n]);
      if (c.son) sonTintement();
      setTimeout(() => setPluie((p) => p.filter((g) => !n.includes(g))), 4600);
    };
    window.addEventListener(EVT_VALIDATION, pleuvoir);
    return () => window.removeEventListener(EVT_VALIDATION, pleuvoir);
  }, [c.pluieValidation, c.son]);

  // ✨ 10 dernières nuits : une étoile filante rare à attraper
  const [filante, setFilante] = useState(false);
  useEffect(() => {
    if (!dernieresNuits || !soir || calme) return;
    const t = setInterval(() => { if (Math.random() < 0.35) { setFilante(true); setTimeout(() => setFilante(false), 2600); } }, 20000);
    return () => clearInterval(t);
  }, [dernieresNuits, soir, calme]);

  // Compagnon : il se promène sur les dunes, on le touche → il s'arrête et parle (comme les autres saisons)
  const persoRef = useRef<HTMLButtonElement>(null);
  const [pause, setPause] = useState(false);
  const toucherPerso = () => {
    if (persoRef.current && toucherCompagnon(persoRef.current, COMPAGNONS[perso].nom)) { setPause(true); setTimeout(() => setPause(false), PAUSE_MS); }
  };
  const p = COMPAGNONS[perso];
  // 2026-11-26 (Nadia : téléphone tourné) : en paysage peu haut, la bande du bas (désert, dromadaire, mosquée) est réduite de moitié
  const paysage = usePaysage();
  const hauteurPerso = Math.round(46 * taille * (paysage ? 0.5 : 1));
  // 16 lanternes (deux fois, pour un défilement sans à-coup), chacune avec ses propres dégradés, et une étoile pendue après chacune
  const guirlande = useMemo(() => Array.from({ length: 32 }, (_, i) => ({ lanterne: lanterneSvg(((i % 16) * 3 + 1) % NB_LANTERNES, `g${i}`), etoile: etoilePendue(`g${i}`) })), []);
  const kaaba = useMemo(() => kaabaSvg('kaaba', jourHijri), [jourHijri]);
  const mosquee = useMemo(() => mosqueeSvg('mosquee'), []);
  const persoSvg = useMemo(() => compagnonSvg(perso, 'perso'), []);
  const desert = useMemo(desertSvgs, []);
  const colombe = useMemo(() => compagnonSvg('colombe', 'vol'), []);

  return (
    <>
      {/* Derrière les cartes : guirlande (tout en haut, toute la largeur) et Kaaba (en haut à gauche) ; elles défilent avec l'accueil */}
      <div aria-hidden className="contents pointer-events-none">
        {c.guirlande && (
          <div className="ramadan-guirlande pointer-events-none absolute inset-x-0 top-0 -z-[4] h-[66px] overflow-hidden">
            <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[12px] w-full"><path d="M0 2Q25 7 50 3T100 2" stroke="#b07a1f" strokeWidth=".5" fill="none" vectorEffect="non-scaling-stroke" /></svg>
            <div className={`ramadan-defile absolute left-0 top-[4px] flex w-max items-start ${calme ? '' : 'anime'}`}>
              {guirlande.map((g, i) => (
                <div key={i} className="flex items-start">
                  <svg viewBox={`0 0 ${LANTERNE_VB.w} ${LANTERNE_VB.h}`} className="ramadan-lanterne mx-[10px] h-[54px] w-[26px] overflow-visible"
                    style={{ animationDelay: `${-(i % 5) * 0.7}s`, ['--d' as string]: `${(i % 16) * 0.35}s` }} dangerouslySetInnerHTML={{ __html: g.lanterne }} />
                  <svg viewBox="0 0 14 30" className="ramadan-etoile-pendue mx-[10px] h-[24px] w-[11px] overflow-visible" style={{ animationDelay: `${-(i % 3) * 0.9}s` }} dangerouslySetInnerHTML={{ __html: g.etoile }} />
                </div>
              ))}
            </div>
          </div>
        )}
        {c.kaaba && (
          <svg data-cachette="La Kaaba" data-cachette-bord="0.3" data-cachette-place="0.5" viewBox={`0 0 ${KAABA_VB.w} ${KAABA_VB.h}`} className="ramadan-kaaba pointer-events-none absolute -z-[5] overflow-visible"
            style={{ top: c.guirlande ? 58 : 10, left: -4, width: [0, 78, 94, 112][r.tailleArbre] ?? 94 }} dangerouslySetInnerHTML={{ __html: kaaba }} />
        )}
      </div>

      {createPortal(
        <div className={`ramadan-decor pointer-events-none ${soir ? 'ramadan-soir' : ''} ${calme ? 'ramadan-calme' : ''}`}>
          {soir && (
            <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 -z-[8] h-28 ramadan-ciel">
              {Array.from({ length: dernieresNuits ? 22 : 10 }, (_, i) => (
                <span key={i} className="ramadan-ciel-etoile" style={{ left: `${(i * 47 + 5) % 97}%`, top: 6 + (i * 23) % 70, animationDelay: `${-i * 0.37}s` }} />
              ))}
            </div>
          )}
          {filante && (
            <button type="button" aria-label="Une étoile filante : attrape-la !" className="ramadan-filante pointer-events-auto fixed z-[42] text-2xl"
              onClick={() => { setFilante(false); if (c.son) sonTintement(); toast.success('✨ Tu as attrapé l\'étoile filante des dernières nuits !'); }}>🌠</button>
          )}

          {/* ⭐ Étoiles et croissants qui tombent */}
          {c.etoiles && !calme && chutes.map((s) => !attrapees.has(s.id) && (
            <button key={s.id} type="button" aria-label="Attrape l'étoile" onClick={(e) => attraper(s.id, e)}
              className="ramadan-chute pointer-events-auto fixed top-0 z-[41] grid h-7 w-7 place-items-center"
              style={{ left: `${s.x}%`, animationDuration: `${s.v}s`, animationDelay: `${s.d}s`, ['--balance' as string]: `${s.t}px` }}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 overflow-visible" aria-hidden>
                {s.k === 'etoile'
                  ? <path d="M12 2l2.6 6.2 6.8.6-5.2 4.4 1.6 6.6L12 16.3l-5.8 3.5 1.6-6.6L2.6 8.8l6.8-.6z" fill="#ffd54a" stroke="#c99a1a" strokeWidth=".8" />
                  : <path d="M14 3a9 9 0 1 0 7 13A7 7 0 1 1 14 3z" fill="#f5c542" stroke="#c99a1a" strokeWidth=".8" />}
              </svg>
            </button>
          ))}
          {eclats.map((e) => (
            <span key={e.id} aria-hidden className="ramadan-eclat fixed z-[42]" style={{ left: e.x - 20, top: e.y - 20 }}>
              {Array.from({ length: 8 }, (_, i) => <i key={i} style={{ transform: `rotate(${i * 45}deg) translateY(-14px)` }} />)}
            </span>
          ))}

          {/* 🎊 Pluie de dattes, étoiles, lanternes */}
          {pluie.map((g) => (
            <span key={g.id} aria-hidden className="ramadan-pluie fixed top-0 z-[43] text-xl" style={{ left: `${g.x}%`, animationDelay: `${g.d}s`, animationDuration: `${g.v}s` }}>
              {g.k === 'datte' ? <svg viewBox="0 0 12 20" className="h-6 w-4"><ellipse cx="6" cy="10" rx="5" ry="9" fill="#7a3b1c" stroke="#3a1a08" strokeWidth=".8" /><ellipse cx="4.4" cy="7" rx="1.2" ry="3" fill="#b0603a" /></svg>
                : g.k === 'lanterne' ? <svg viewBox={`0 0 ${LANTERNE_VB.w} ${LANTERNE_VB.h}`} className="h-9 w-[18px]" dangerouslySetInnerHTML={{ __html: lanterneSvg(g.id % NB_LANTERNES, `p${g.id}`) }} />
                : '⭐'}
            </span>
          ))}

          {/* 🏜️ Le désert en bas : rochers au loin, dune, palmiers, cactus, rochers, touffes, dune devant */}
          {c.dunes && (
            <div aria-hidden className="ramadan-desert pointer-events-none fixed inset-x-0 bottom-0 z-[27] h-[96px] overflow-hidden paysage:right-auto paysage:w-[200%] paysage:origin-bottom-left paysage:scale-50 au-dessus-menu" style={{ marginBottom: 'var(--menu-bas, env(safe-area-inset-bottom, 0px))' }}>
              {desert.map((o, i) => o.fond
                ? <svg key={i} viewBox="0 0 340 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 w-full" style={{ height: o.h }} dangerouslySetInnerHTML={{ __html: o.svg }} />
                : <svg key={i} viewBox={o.vb} className="absolute overflow-visible" style={{ left: o.left, bottom: o.bas, height: o.h, opacity: o.opacite, transform: o.miroir ? 'scaleX(-1)' : undefined }} dangerouslySetInnerHTML={{ __html: o.svg }} />)}
            </div>
          )}

          {/* 🕊️ La colombe vole de temps en temps au-dessus du désert (Nadia, 2026-11-17), en battant des ailes */}
          {c.dunes && !calme && (
            <svg aria-hidden viewBox={`0 0 ${COMPAGNONS.colombe.vb[0]} ${COMPAGNONS.colombe.vb[1]}`} className="ramadan-colombe-vol pointer-events-none fixed left-0 z-[28] h-[26px] w-[34px] overflow-visible"
              style={{ bottom: `calc(var(--menu-bas, env(safe-area-inset-bottom, 0px)) + ${paysage ? 37 : 74}px)` }} dangerouslySetInnerHTML={{ __html: colombe }} />
          )}

          {/* 🎉 Aïd : ballons, feux d'artifice, cadeaux ; Aïd el-Adha : moutons */}
          {mode !== 'ramadan' && !calme && (
            <div aria-hidden className="pointer-events-none fixed inset-0 z-[28] overflow-hidden">
              {['#f9a8d4', '#fde68a', '#7fd8cf', '#fdba74', '#a5b4fc'].map((col, i) => (
                <svg key={i} viewBox="0 0 20 34" className="anniv-ballon absolute" style={{ left: `${6 + i * 21}%`, width: 24, animationDelay: `${i * 5}s`, animationDuration: `${22 + i * 2}s` }}>
                  <path d="M10 22v12" stroke="#94a3b8" strokeWidth=".6" fill="none" /><ellipse cx="10" cy="11" rx="8.5" ry="10.5" fill={col} /><path d="M8.6 21.5h2.8l-1.4 1.6z" fill={col} />
                </svg>
              ))}
              {[0, 1, 2].map((i) => (
                <span key={i} className="ramadan-feu" style={{ left: `${18 + i * 30}%`, top: `${14 + (i % 2) * 10}%`, animationDelay: `${i * 1.3}s`, ['--c' as string]: ['#f5c542', '#f472b6', '#2aa198'][i] }}>
                  {Array.from({ length: 12 }, (_, j) => <i key={j} style={{ transform: `rotate(${j * 30}deg)` }} />)}
                </span>
              ))}
              <span className="absolute bottom-[30px] left-[30%] text-xl">🎁</span>
              <span className="absolute bottom-[26px] left-[58%] text-lg">🎁</span>
              {mode === 'adha' && (
                <>
                  <svg viewBox={`0 0 ${MOUTON_VB.w} ${MOUTON_VB.h}`} className="ramadan-mouton absolute bottom-[16px] h-[32px] w-[44px]" style={{ left: '12%' }} dangerouslySetInnerHTML={{ __html: moutonSvg('m1') }} />
                  <svg viewBox={`0 0 ${MOUTON_VB.w} ${MOUTON_VB.h}`} className="ramadan-mouton absolute bottom-[12px] h-[28px] w-[38px]" style={{ left: '46%', animationDelay: '-3s', transform: 'scaleX(-1)' }} dangerouslySetInnerHTML={{ __html: moutonSvg('m2') }} />
                </>
              )}
            </div>
          )}

          {/* 🐪 Le dromadaire marche dans le désert */}
          {c.compagnon && (
            <button ref={persoRef} type="button" onClick={toucherPerso} aria-label={`${p.nom} : touche-le pour qu'il te parle`} data-cachette="Le dromadaire" data-cachette-bord="0.12" data-cachette-place="0.45"
              className={`ramadan-perso pointer-events-auto fixed left-0 z-[29] outline-none [-webkit-tap-highlight-color:transparent] ${pause || calme ? 'pause' : ''}`}
              style={{ bottom: 'calc(var(--menu-bas, env(safe-area-inset-bottom, 0px)) + 6px)', height: hauteurPerso, width: Math.round(hauteurPerso * p.vb[0] / p.vb[1]) }}>
              <svg viewBox={`0 0 ${p.vb[0]} ${p.vb[1]}`} className="ramadan-dromadaire h-full w-full overflow-visible" aria-hidden
                dangerouslySetInnerHTML={{ __html: persoSvg + habitSvg(habit, p.vb[0], p.vb[1], 'dromadaire') }} />
            </button>
          )}

          {/* 🕌 Mosquée en bas à droite */}
          {c.mosquee && (
            <svg aria-hidden data-cachette="La mosquée" data-cachette-cote="gauche" data-cachette-bord="0.12" data-cachette-place="0.85" viewBox={`0 0 ${MOSQUEE_VB.w} ${MOSQUEE_VB.h}`} className="ramadan-mosquee fixed bottom-0 z-30 transition-opacity duration-500 au-dessus-menu"
              style={{ right: 'max(-6px, env(safe-area-inset-right, 0px))', width: paysage ? 'min(15vw, 56px)' : 'min(30vw, 112px)', marginBottom: 'var(--menu-bas, env(safe-area-inset-bottom, 0px))', opacity: defile ? 0.3 : 1 }}
              dangerouslySetInnerHTML={{ __html: mosquee }} />
          )}
        </div>,
        document.body,
      )}
      {c.message && <MessageFete mode={mode} annee={fete?.debut?.slice(0, 4) ?? ''} userId={userId} />}
    </>
  );
}

/** 🏜️ Les éléments du désert (positions en % de la largeur : rien sous la mosquée, à droite) */
type ObjetDesert = { svg: string; h: number; fond?: boolean; vb?: string; left?: string; bas?: number; opacite?: number; miroir?: boolean };
function desertSvgs(): ObjetDesert[] {
  const vb = (o: { w: number; h: number }) => `0 0 ${o.w} ${o.h}`;
  return [
    { vb: vb(MESA_VB), svg: mesaSvg('d1'), left: '-2%', bas: 26, h: 52, opacite: .8 },
    { vb: vb(MESA_VB), svg: mesaSvg('d2'), left: '42%', bas: 28, h: 40, opacite: .7, miroir: true },
    { fond: true, h: 46, svg: '<path d="M0 22Q60 6 130 18T260 14T340 18V60H0z" fill="#f1d7a3"/>' },
    { vb: vb(PALMIER_VB), svg: palmierSvg('d3'), left: '25%', bas: 12, h: 74 },
    { vb: vb(PALMIER_VB), svg: palmierSvg('d4'), left: '33%', bas: 18, h: 50 },
    { vb: vb(CACTUS_VB), svg: cactusSvg(0, 'd5'), left: '5%', bas: 6, h: 42 },
    { vb: vb(CACTUS_VB), svg: cactusSvg(1, 'd6'), left: '52%', bas: 4, h: 28 },
    { vb: vb(CACTUS_VB), svg: cactusSvg(0, 'd7'), left: '64%', bas: 10, h: 30 },
    { vb: '0 0 40 22', svg: rocherSvg('d8'), left: '16%', bas: 4, h: 12 },
    { vb: '0 0 40 22', svg: rocherSvg('d9'), left: '45%', bas: 2, h: 10 },
    { fond: true, h: 24, svg: '<path d="M0 30Q80 14 170 26T340 24V60H0z" fill="#e9c58c"/><path d="M40 40q5-3 10 0M200 44q5-3 10 0M290 42q5-3 10 0" stroke="#d4a76a" stroke-width="1" fill="none"/>' },
    { vb: '0 0 20 10', svg: TOUFFE, left: '2%', bas: 2, h: 10 },
    { vb: '0 0 20 10', svg: TOUFFE, left: '38%', bas: 3, h: 9 },
    { vb: '0 0 20 10', svg: TOUFFE, left: '58%', bas: 1, h: 10 },
  ];
}

/** 📢 « Ramadan Moubarak » à la 1ʳᵉ connexion du Ramadan, « Aïd Moubarak Saïd » le jour de chaque Aïd (éphémère, 12 s) */
function MessageFete({ mode, annee, userId }: { mode: 'ramadan' | 'fitr' | 'adha'; annee: string; userId: string | null }) {
  const cle = `dinislam_msg_${mode}_${annee}_${userId ?? 'invite'}`;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let deja: string | null = null;
    try { deja = localStorage.getItem(cle); } catch { /* */ }
    if (deja) return;
    const t = setTimeout(() => { setVisible(true); try { localStorage.setItem(cle, '1'); } catch { /* */ } }, 1500);
    return () => clearTimeout(t);
  }, [cle]);
  useEffect(() => { if (!visible) return; const t = setTimeout(() => setVisible(false), 12000); return () => clearTimeout(t); }, [visible]);
  if (!visible) return null;
  const texte = mode === 'ramadan'
    ? { titre: '🌙 Ramadan Moubarak !', ar: 'رَمَضَان مُبَارَك', sous: 'Qu\'Allah accepte ton jeûne, tes prières et tes efforts.' }
    : { titre: '🎉 Aïd Moubarak Saïd !', ar: 'عِيد مُبَارَك سَعِيد', sous: mode === 'adha' ? 'Belle fête de l\'Aïd el-Adha à toi et ta famille 🐑' : 'Belle fête de l\'Aïd el-Fitr à toi et ta famille !' };
  return createPortal(
    <div role="status" className="saison-msg-arrive fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 au-dessus-menu" onClick={() => setVisible(false)}>
      <div className="max-w-sm rounded-2xl border-2 border-[#e2c08f] bg-[#fffaf0] px-5 py-3 text-center shadow-xl">
        <p className="text-lg font-extrabold text-[#7a4e10]">{texte.titre}</p>
        <p className="font-arabic text-2xl text-[#1d7f78]" dir="rtl" lang="ar">{texte.ar}</p>
        <p className="text-sm text-[#5a4a3a]">{texte.sous}</p>
      </div>
    </div>,
    document.body,
  );
}
