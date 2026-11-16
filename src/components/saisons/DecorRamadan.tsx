import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import type { ReglagesSaisons } from '@/lib/saisons';
import type { PeriodeRamadan } from '@/lib/ramadanDates';
import { EVT_VALIDATION, preparerSon, sonTintement } from '@/lib/sonSaison';
import { habitSvg, PAUSE_MS, toucherCompagnon, useHabitDuJour, useTailleCompagnon } from './compagnonEvenement';
import { COMPAGNONS, KAABA, KAABA_VB, LANTERNES, MOSQUEE, MOUTON, ORDRE_COMPAGNONS, type CompagnonRamadan } from './dessinsRamadan';

/**
 * 🌙 Décor de la 5ᵉ saison « Ramadan » (choix de Nadia du 2026-11-15 : ambiance B « sable doré et lanternes », un peu des
 * autres SANS surcharger — « ça étouffe »). Même base que les 4 saisons :
 * - guirlande sur toute la largeur en haut : des lanternes DIFFÉRENTES et lumineuses qui DÉFILENT doucement le long du fil ;
 * - Kaaba en haut à gauche (à la place de l'arbre), mosquée en bas à droite (à la place de la cheminée), dunes en bas ;
 * - compagnon DIFFÉRENT à chaque connexion : dromadaire, tapis volant, lune lumineuse, colombe (il grandit et parle comme les autres) ;
 * - quelques étoiles et croissants qui tombent (on les attrape : paillettes + tintement) ;
 * - lanternes légèrement allumées le jour, au MAXIMUM dès le Maghrib (classe `ramadan-soir`) ; ciel plus étoilé les 10 dernières nuits
 *   + étoile filante rare à attraper ;
 * - pluie de dattes, d'étoiles et de petites lanternes à chaque validation ;
 * - Aïd el-Fitr : même décor, plus festif (ballons, feux d'artifice, cadeaux) ; Aïd el-Adha (3 jours) : en plus, des moutons.
 * Rien ne bloque les cartes (seuls le compagnon et les petites étoiles se touchent).
 */
const CLE_COMPAGNON = 'dinislam_ramadan_compagnon';
function compagnonDeLaConnexion(): CompagnonRamadan {
  // Un personnage différent à CHAQUE connexion (Nadia) : on avance d'un cran au début de chaque visite
  try {
    const deja = sessionStorage.getItem(CLE_COMPAGNON);
    if (deja && (ORDRE_COMPAGNONS as string[]).includes(deja)) return deja as CompagnonRamadan;
    const avant = Number(localStorage.getItem(CLE_COMPAGNON) ?? -1);
    const i = (avant + 1) % ORDRE_COMPAGNONS.length;
    localStorage.setItem(CLE_COMPAGNON, String(i));
    sessionStorage.setItem(CLE_COMPAGNON, ORDRE_COMPAGNONS[i]);
    return ORDRE_COMPAGNONS[i];
  } catch { return 'dromadaire'; }
}

type Chute = { id: number; x: number; d: number; v: number; t: number; k: 'etoile' | 'croissant' };
type Goutte = { id: number; x: number; d: number; v: number; k: 'datte' | 'etoile' | 'lanterne' };
let compteur = 0;

export function DecorRamadan({ r, soir, fete, userId }: { r: ReglagesSaisons; soir: boolean; fete: PeriodeRamadan; userId: string | null }) {
  const c = r.ramadan;
  const mode = fete?.mode ?? 'ramadan';
  const reduit = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const calme = reduit && !r.animerToujours;
  const perso = useMemo(compagnonDeLaConnexion, []);
  const taille = useTailleCompagnon();
  const habit = useHabitDuJour(userId);
  const dernieresNuits = c.dernieresNuits && mode === 'ramadan' && (fete?.jour ?? 0) >= 21;

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
  const hauteurPerso = Math.round((p.vole ? 30 : 36) * taille);
  const lanternes = useMemo(() => Array.from({ length: 16 }, (_, i) => LANTERNES[(i * 3 + 1) % LANTERNES.length]), []);

  return (
    <>
      {/* Derrière les cartes : guirlande (tout en haut, toute la largeur) et Kaaba (en haut à gauche) ; elles défilent avec l'accueil */}
      <div aria-hidden className="contents pointer-events-none">
        {c.guirlande && (
          <div className="ramadan-guirlande pointer-events-none absolute inset-x-0 top-0 -z-[4] h-[54px] overflow-hidden">
            <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[12px] w-full"><path d="M0 2Q25 7 50 3T100 2" stroke="#b07a1f" strokeWidth=".5" fill="none" vectorEffect="non-scaling-stroke" /></svg>
            <div className={`ramadan-defile absolute left-0 top-[4px] flex w-max ${calme ? '' : 'anime'}`}>
              {[...lanternes, ...lanternes].map((l, i) => (
                <svg key={i} viewBox="0 0 20 34" className="ramadan-lanterne mx-[22px] h-[42px] w-[25px] overflow-visible" style={{ animationDelay: `${-(i % 5) * 0.7}s` }} dangerouslySetInnerHTML={{ __html: l }} />
              ))}
            </div>
          </div>
        )}
        {c.kaaba && (
          <svg viewBox={`0 0 ${KAABA_VB.w} ${KAABA_VB.h}`} className="ramadan-kaaba pointer-events-none absolute -z-[5] overflow-visible"
            style={{ top: c.guirlande ? 50 : 10, left: -4, width: [0, 78, 94, 112][r.tailleArbre] ?? 94 }} dangerouslySetInnerHTML={{ __html: KAABA }} />
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
                : g.k === 'lanterne' ? <svg viewBox="0 0 20 34" className="h-8 w-5" dangerouslySetInnerHTML={{ __html: LANTERNES[g.id % LANTERNES.length] }} />
                : '⭐'}
            </span>
          ))}

          {/* 🏜️ Dunes */}
          {c.dunes && (
            <svg aria-hidden viewBox="0 0 340 60" preserveAspectRatio="none" className="fixed inset-x-0 bottom-0 z-[27] h-[54px] w-full" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              <path d="M0 34Q50 14 110 30T230 24T340 30V60H0z" fill="#e7b979" />
              <path d="M0 46Q70 30 150 44T340 40V60H0z" fill="#d79c56" />
              <path d="M40 44q4-3 8 0M190 50q4-3 8 0M280 47q4-3 8 0" stroke="#b97d3d" strokeWidth="1" fill="none" />
            </svg>
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
                  <svg viewBox="0 0 48 36" className="ramadan-mouton absolute bottom-[16px] h-[30px] w-[40px]" style={{ left: '12%' }} dangerouslySetInnerHTML={{ __html: MOUTON }} />
                  <svg viewBox="0 0 48 36" className="ramadan-mouton absolute bottom-[12px] h-[26px] w-[35px]" style={{ left: '46%', animationDelay: '-3s', transform: 'scaleX(-1)' }} dangerouslySetInnerHTML={{ __html: MOUTON }} />
                </>
              )}
            </div>
          )}

          {/* 🐪 Le compagnon de la connexion */}
          {c.compagnon && (
            <button ref={persoRef} type="button" onClick={toucherPerso} aria-label={`${p.nom} : touche-le pour qu'il te parle`}
              className={`ramadan-perso pointer-events-auto fixed left-0 z-[29] outline-none [-webkit-tap-highlight-color:transparent] ${p.vole ? 'vole' : ''} ${pause || calme ? 'pause' : ''}`}
              style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + ${p.vole ? 46 : 8}px)`, height: hauteurPerso, width: Math.round(hauteurPerso * p.vb[0] / p.vb[1]) }}>
              <svg viewBox={`0 0 ${p.vb[0]} ${p.vb[1]}`} className={`h-full w-full overflow-visible ${perso === 'lune' ? 'ramadan-lune' : ''}`} aria-hidden
                dangerouslySetInnerHTML={{ __html: p.svg + (perso === 'dromadaire' ? habitSvg(habit, p.vb[0], p.vb[1]) : '') }} />
            </button>
          )}

          {/* 🕌 Mosquée en bas à droite */}
          {c.mosquee && (
            <svg aria-hidden viewBox="0 0 200 172" className="ramadan-mosquee fixed bottom-0 z-30 transition-opacity duration-500"
              style={{ right: 'max(-6px, env(safe-area-inset-right, 0px))', width: 'min(30vw, 112px)', marginBottom: 'env(safe-area-inset-bottom, 0px)', opacity: defile ? 0.3 : 1 }}
              dangerouslySetInnerHTML={{ __html: MOSQUEE }} />
          )}
        </div>,
        document.body,
      )}
      {c.message && <MessageFete mode={mode} annee={fete?.debut?.slice(0, 4) ?? ''} userId={userId} />}
    </>
  );
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
    <div role="status" className="saison-msg-arrive fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4" onClick={() => setVisible(false)}>
      <div className="max-w-sm rounded-2xl border-2 border-[#e2c08f] bg-[#fffaf0] px-5 py-3 text-center shadow-xl">
        <p className="text-lg font-extrabold text-[#7a4e10]">{texte.titre}</p>
        <p className="font-arabic text-2xl text-[#1d7f78]" dir="rtl" lang="ar">{texte.ar}</p>
        <p className="text-sm text-[#5a4a3a]">{texte.sous}</p>
      </div>
    </div>,
    document.body,
  );
}
