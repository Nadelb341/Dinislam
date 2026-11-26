import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Saison } from '@/lib/saisons';
import { IMAGES_AUTOMNE } from './dessinsAutomne';
import { PERSOS } from './dessinsHiver';
import { ANIMAUX } from './dessinsPrintempsEte';
import { porterHabit } from './compagnonEvenement';
import { usePaysage } from '@/hooks/usePaysage';
import { COMPAGNONS, compagnonSvg } from './dessinsRamadan';
import { EVT_SON_FEU, arreterSonFeu, basculerSonFeu, lireSonFeu, sonFeuEnCours } from '@/lib/sonFeu';
import { FEU_MAX, HABIT, echelleFeu, motArabeDuJour, motGentilDuJour, niveauFeu } from './jeuxSaisonLogique';
import { dire, fichierVoix } from '@/lib/voixFabriquees';
import { FENETRE, cheminTraces, choisirCachette, fenetreCachette, gene, pointVisible, type Boite, type Cote } from './cacheCacheLogique';

/**
 * 🔥 Flamme de la cheminée + 🙈 cache-cache (Nadia, 2026-11-11 : cheminée idées 1, 2, 4, 5 ; cache-cache les 5 idées).
 * RIEN À GAGNER : ce sont des animations. Tout marche sans réseau (mémoire de l'appareil) ; les devoirs viennent de la copie hors ligne.
 */
const jour = () => new Date().toLocaleDateString('en-CA');
const lireJ = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const ecrireJ = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible */ } };

// ——— dessins du coin du feu (viewBox de la cheminée : 200 × 172, foyer centré en 100 / 140) ———
const CHAT_DORT = '<g stroke="#3f2a1d" stroke-width="1.2" stroke-linejoin="round"><path d="M4 22c0-8 8-13 18-13 9 0 15 4 15 10 0 3-2 5-5 5H8c-3 0-4-1-4-2z" fill="#f0a35a"/><path d="M33 22c5 1 8-2 7-6" fill="none" stroke-width="3" stroke="#f0a35a"/><circle cx="10" cy="15" r="7" fill="#f0a35a"/><path d="M5 10l1-6 4 4zM12 8l3-5 2 6z" fill="#f0a35a"/></g><path d="M7 15q1.5 1.2 3 0M11 15.5q1.2 1 2.4 0" stroke="#3f2a1d" stroke-width="1" fill="none"/><path d="M18 14l3-1M24 13l2-2" stroke="#c97a38" stroke-width="1.2"/><text x="20" y="4" font-size="7" fill="#64748b">z</text><text x="26" y="0" font-size="5" fill="#64748b">z</text>';
const CHAT_ATTEND = '<g stroke="#3f2a1d" stroke-width="1.2" stroke-linejoin="round"><path d="M10 34c-4 0-6-3-5-8 1-6 4-11 9-11s8 5 9 11c1 5-1 8-5 8z" fill="#f0a35a"/><path d="M22 31c6 0 9-4 7-9" fill="none" stroke="#f0a35a" stroke-width="3"/><circle cx="14" cy="11" r="7.5" fill="#f0a35a"/><path d="M8 7l0-7 5 4zM15 4l5-4 0 7z" fill="#f0a35a"/></g><circle cx="11.3" cy="10.5" r="1.5" fill="#1f2937"/><circle cx="16.7" cy="10.5" r="1.5" fill="#1f2937"/><circle cx="11.7" cy="10" r=".5" fill="#fff"/><circle cx="17.1" cy="10" r=".5" fill="#fff"/><path d="M13 13.5h2l-1 1z" fill="#be185d"/><path d="M6 13l-4-1M6 14.5l-4 1M22 13l4-1M22 14.5l4 1" stroke="#3f2a1d" stroke-width=".6"/>';
const THEIERE = '<g stroke="#334155" stroke-width="1.2" stroke-linejoin="round"><path d="M5 10c0-4 4-6 9-6s9 2 9 6v6c0 3-3 5-9 5s-9-2-9-5z" fill="#0f766e"/><path d="M23 10c4 0 6 3 4 6l-4 2" fill="none" stroke="#0f766e" stroke-width="2.2"/><path d="M5 11L0 7" stroke="#0f766e" stroke-width="2.2"/><ellipse cx="14" cy="4" rx="5" ry="1.6" fill="#115e59"/><circle cx="14" cy="2" r="1.5" fill="#fbbf24"/></g><path d="M9 12h10" stroke="#fde68a" stroke-width="1.2"/>';
/** Places des bûches : 2 devant, puis 3 au-dessus (au plus 5) */
const PLACES_BUCHES = [[78, 147], [100, 147], [89, 141], [67, 141], [111, 141]];
const BUCHE = '<rect x="0" y="0" width="20" height="5.5" rx="2.7" fill="#8a5a36" stroke="#3f2a1d" stroke-width=".9"/><ellipse cx="19" cy="2.75" rx="2" ry="2.4" fill="#e3c49a" stroke="#3f2a1d" stroke-width=".7"/>';

export function FeuSemaine({ userId, regle, buches, decor, etincelles }: { userId: string; regle: boolean; buches: boolean; decor: boolean; etincelles: boolean }) {
  // 2026-11-26 (Nadia : téléphone tourné) : en paysage peu haut, la cheminée est réduite de moitié
  const L = usePaysage() ? 'min(15vw, 56px)' : 'min(30vw, 112px)';
  // Jours où l'élève est venu (gardé sur l'appareil) : le feu baisse d'un cran par jour SANS visite
  const etat = useMemo(() => {
    const cle = `dinislam_feu_visites_${userId}`;
    const aujourdhui = jour();
    const visites = lireJ<string[]>(cle, []).filter((j) => j !== aujourdhui);
    const n = niveauFeu(new Date(), visites);
    ecrireJ(cle, [...visites.slice(-20), aujourdhui]);
    const cleBonjour = `dinislam_feu_bonjour_${userId}`;
    const bonjour = lireJ<string>(cleBonjour, '') !== aujourdhui;
    ecrireJ(cleBonjour, aujourdhui);
    return { ...n, bonjour };
  }, [userId]);
  const [niveau, setNiveau] = useState(regle ? etat.avant : FEU_MAX);
  // La visite ravive le feu d'un cran, sous les yeux de l'élève
  useEffect(() => {
    if (!regle) { setNiveau(FEU_MAX); return; }
    setNiveau(etat.avant);
    if (etat.apres === etat.avant) return;
    const t = setTimeout(() => setNiveau(etat.apres), 1800);
    return () => clearTimeout(t);
  }, [regle, etat]);
  const [etincellesVisibles, setEtincellesVisibles] = useState(etincelles && etat.bonjour);
  useEffect(() => { if (!etincellesVisibles) return; const t = setTimeout(() => setEtincellesVisibles(false), 3200); return () => clearTimeout(t); }, [etincellesVisibles]);

  // 🪵 Devoirs de la semaine (le chemin des diamants) : une bûche par devoir validé ; tous validés = grand feu
  const { data: devoirs = { valides: 0, total: 0 } } = useQuery({
    queryKey: ['feu-devoirs', userId],
    enabled: buches,
    queryFn: async () => {
      const { data } = await supabase.rpc('weekly_program_view', { p_student: userId });
      const items = ((data || [])[0]?.items ?? []) as unknown as { done?: boolean }[];
      return { valides: items.filter((i) => i.done).length, total: items.length };
    },
  });
  const grandFeu = buches && devoirs.total > 0 && devoirs.valides === devoirs.total;
  const k = echelleFeu(niveau, grandFeu);

  // La flamme du dessin de la cheminée suit ce niveau (classe sur la page, retirée en quittant l'accueil)
  useEffect(() => {
    const el = document.documentElement;
    const actif = regle || grandFeu;
    el.classList.toggle('feu-regle', actif);
    el.classList.toggle('feu-eteint', actif && k === 0);
    el.style.setProperty('--feu-k', String(k));
    return () => { el.classList.remove('feu-regle', 'feu-eteint'); el.style.removeProperty('--feu-k'); };
  }, [regle, grandFeu, k]);

  // Discret pendant qu'on fait défiler l'accueil (comme la cheminée)
  const [defile, setDefile] = useState(false);
  useEffect(() => {
    let t = 0;
    const f = () => { setDefile(true); clearTimeout(t); t = window.setTimeout(() => setDefile(false), 700); };
    window.addEventListener('scroll', f, { passive: true });
    return () => { window.removeEventListener('scroll', f); clearTimeout(t); };
  }, []);

  // 🔁 Son du feu : un toucher le lance, un autre l'arrête ; il s'arrête aussi en quittant l'accueil
  const [sonJoue, setSonJoue] = useState(sonFeuEnCours());
  // 👂 Pour que les élèves sachent que le feu crépite (Nadia, 2026-11-18) : à chaque arrivée sur l'accueil, une bulle
  // « 🔊 Touche le feu ! » pendant 8 s, puis un petit 🔈 discret reste au-dessus du foyer
  const [bulleSon, setBulleSon] = useState(true);
  useEffect(() => { const t = setTimeout(() => setBulleSon(false), 8000); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const f = () => setSonJoue(sonFeuEnCours());
    window.addEventListener(EVT_SON_FEU, f);
    return () => { window.removeEventListener(EVT_SON_FEU, f); arreterSonFeu(); };
  }, []);

  const nbBuches = buches ? Math.min(devoirs.valides, 5) : 0;
  const chatDort = k > 0 && niveau >= 4;
  return createPortal(
    <>
    <div aria-hidden className="pointer-events-none fixed bottom-0 z-[31] transition-opacity duration-500"
      style={{ right: 'max(-6px, env(safe-area-inset-right, 0px))', width: L, aspectRatio: '200 / 172', marginBottom: 'env(safe-area-inset-bottom, 0px)', opacity: defile ? 0.3 : 1 }}>
      <svg viewBox="0 0 200 172" className="absolute inset-0 h-full w-full overflow-visible">
        {/* Braises qui fument (feu éteint) */}
        {k === 0 && (
          <g>
            <g fill="#f97316">{[88, 96, 104, 112].map((x, i) => <circle key={x} cx={x} cy={138 + (i % 2)} r="2.4" className="saison-braise" style={{ animationDelay: `${i * 0.3}s` }} />)}</g>
            {[0, 1, 2].map((i) => <circle key={i} cx={98 + i * 3} cy="128" r="5" fill="#94a3b8" className="feu-fumee" style={{ animationDelay: `${i * 0.9}s` }} />)}
          </g>
        )}
        {/* 🪵 Bûches des devoirs validés, empilées devant le feu */}
        {Array.from({ length: nbBuches }, (_, i) => (
          <g key={i} transform={`translate(${PLACES_BUCHES[i][0]} ${PLACES_BUCHES[i][1]})`}><g className="feu-buche" dangerouslySetInnerHTML={{ __html: BUCHE }} /></g>
        ))}
        {/* Grand feu : quelques étincelles qui crépitent */}
        {grandFeu && k > 0 && [0, 1, 2, 3].map((i) => <circle key={i} cx={92 + i * 5} cy="110" r="1.3" fill="#fde68a" className="feu-crepite" style={{ animationDelay: `${i * 0.35}s` }} />)}
        {decor && (
          <>
            {/* 🫖 La théière, suspendue au-dessus du feu, fume quand il est au maximum */}
            <path d="M100 62v14" stroke="#3f2a1d" strokeWidth="1.2" />
            <g transform="translate(86 76)" dangerouslySetInnerHTML={{ __html: THEIERE }} />
            {niveau >= FEU_MAX - 1 && k > 0 && [0, 1].map((i) => <circle key={i} cx={88 + i * 3} cy="80" r="3" fill="#e2e8f0" className="feu-fumee" style={{ animationDelay: `${i * 1.1}s` }} />)}
            {/* 🐈 Le chat dort devant le feu, ou attend en regardant l'élève quand le feu est éteint */}
            <g transform={chatDort ? 'translate(118 150)' : 'translate(126 136)'} dangerouslySetInnerHTML={{ __html: chatDort ? CHAT_DORT : CHAT_ATTEND }} />
          </>
        )}
        {/* ✨ Étincelles du bonjour (1ʳᵉ visite du jour) : elles montent par le haut de la cheminée */}
        {etincellesVisibles && Array.from({ length: 10 }, (_, i) => (
          <circle key={i} cx={88 + (i * 7) % 26} cy="20" r={1.4 + (i % 3) * 0.5} fill={i % 2 ? '#fde68a' : '#fb923c'} className="feu-etincelle"
            style={{ animationDelay: `${i * 0.18}s`, ['--dx' as string]: `${((i * 13) % 30) - 15}px` }} />
        ))}
      </svg>
    </div>
    {/* 🔥 Toucher le foyer = écouter le feu, toucher encore = l'arrêter (2026-11-17) ; son choisi dans Paramètres ; jamais tout seul. Sous la bulle « ? » du coin du feu, sans la toucher. */}
    {k > 0 && lireSonFeu() !== 'aucun' && (
      <button type="button" aria-label={sonJoue ? 'Arrêter le bruit du feu' : 'Écouter le feu'} aria-pressed={sonJoue} onClick={() => setSonJoue(basculerSonFeu())}
        className="fixed bottom-0 z-[32] rounded-full"
        style={{ right: `calc(max(-6px, env(safe-area-inset-right, 0px)) + ${L} * 0.3)`, width: `calc(${L} * 0.4)`, height: `calc(${L} * 0.3)`, marginBottom: `calc(env(safe-area-inset-bottom, 0px) + ${L} * 0.04)` }}>
        {/* 🔊 pendant que le son joue : on comprend qu'un nouveau toucher l'arrête */}
        {sonJoue
          ? <span aria-hidden className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 animate-pulse rounded-full bg-white/90 px-1.5 text-xs shadow">🔊</span>
          : bulleSon
            ? <span aria-hidden className="feu-bulle-son pointer-events-none absolute bottom-1 right-full mr-8 whitespace-nowrap rounded-full rounded-br-none border-2 border-orange-300 bg-white px-2 py-0.5 text-[11px] font-extrabold text-orange-700 shadow-md">🔊 Touche le feu !</span>
            : <span aria-hidden className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-1 text-[10px] opacity-80 shadow-sm">🔈</span>}
      </button>
    )}
    </>,
    document.body,
  );
}

// ——— 🙈 Cache-cache ———
/** 🔁 Un personnage différent à chaque partie (Nadia, 2026-11-12) ; c'est LUI qui dit « Essaie de me trouver ! » */
/** `repos` : de combien il redescend derrière sa cachette (plus petit = on en voit plus) ; il doit TOUJOURS dépasser un peu (Nadia, 17/11 : le tapis caché ne se voyait plus du tout) */
type AnimalCache = { vb: string; svg: string; nom: string; repos?: string; cle?: string };
const A48 = (k: string, nom: string): AnimalCache => ({ vb: '0 0 48 48', svg: IMAGES_AUTOMNE[k]?.svg ?? '', nom, cle: k });
const ANIMAUX_CACHE: Record<Saison, AnimalCache[]> = {
  automne: [A48('ecureuil', 'L\'écureuil'), A48('herisson', 'Le hérisson'), A48('hibou', 'Le hibou'), A48('renard', 'Le renard')],
  hiver: [{ vb: '0 0 30 38', svg: PERSOS.pingouin, nom: 'Le pingouin' }, { vb: '0 0 30 38', svg: PERSOS.bonhomme, nom: 'Le bonhomme de neige' }, A48('hibou', 'Le hibou')],
  printemps: [{ vb: '0 0 40 34', svg: ANIMAUX.lapin.svg, nom: 'Le lapin', repos: '54%' }, { vb: '0 0 40 34', svg: ANIMAUX.escargot.svg, nom: 'L\'escargot', repos: '54%' }, { vb: '0 0 40 34', svg: ANIMAUX.biche.svg, nom: 'La biche', repos: '54%' }],
  // 🌙 Ramadan (2026-11-16) : personnages du désert
  ramadan: (['dromadaire', 'colombe', 'tapis'] as const).map((k) => ({ vb: `0 0 ${COMPAGNONS[k].vb[0]} ${COMPAGNONS[k].vb[1]}`, svg: compagnonSvg(k, `cache-${k}`), nom: COMPAGNONS[k].nom, repos: ({ dromadaire: '50%', colombe: '46%', tapis: '38%' } as const)[k] })),
  ete: [{ vb: '0 0 40 34', svg: ANIMAUX.crabe.svg, nom: 'Le crabe', repos: '54%' }, { vb: '0 0 40 34', svg: ANIMAUX.dauphin.svg, nom: 'Le dauphin', repos: '54%' }],
};
/** 🐿️ 2026-11-26 : quand l'écureuil qui se cache PARTOUT est allumé, le cache-cache de l'accueil prend un autre animal (pas deux écureuils) */
const animauxDe = (saison: Saison, sansEcureuil: boolean) => ANIMAUX_CACHE[saison].filter((a) => !(sansEcureuil && a.cle === 'ecureuil'));
/** Tire un personnage, jamais le même que la partie d'avant */
function tirerAnimal(n: number): number {
  let avant = -1;
  try { avant = Number(sessionStorage.getItem('dinislam_cache_animal') ?? -1); } catch { /* stockage indisponible */ }
  let i = Math.floor(Math.random() * n);
  if (n > 1 && i === avant) i = (i + 1) % n;
  try { sessionStorage.setItem('dinislam_cache_animal', String(i)); } catch { /* stockage indisponible */ }
  return i;
}
const PLUIE: Record<Saison, string> = { automne: '🍂', hiver: '❄️', printemps: '🌸', ete: '🐚', ramadan: '⭐' };

/**
 * 🙈 2026-11-26 (Nadia) : il se cache PARTOUT dans l'accueil — derrière une carte, mais aussi derrière tout élément du décor
 * marqué `data-cachette="Le nom"` (logo, titre, arbre, cheminée, tas de feuilles, bonhomme de neige, soleil, papillon,
 * dromadaire…). Options de l'élément : `data-cachette-prep` (« dans », sinon « derrière »), `data-cachette-cote`
 * (haut | gauche | droite : par où il dépasse), `data-cachette-bord` (0 à 1 : de combien on rentre dans l'élément, quand le
 * dessin a du vide autour), `data-cachette-place` (0 à 1 : où le long du bord ; sinon au hasard), `data-cachette-repos`
 * (ex. « 34% » : il dépasse plus, quand il se confondrait avec le décor, comme dans le tas de feuilles).
 */
type Cachette = { el: HTMLElement; nom: string; prep: string; cote: Cote; bord: number; place: number; fixe: boolean; repos?: string };
const COTES: Cote[] = ['haut', 'gauche', 'droite'];
const PLACES = [0.5, 0.15, 0.85, 0.3, 0.7];
const nombre = (v: string | undefined, d: number) => { const n = Number(v); return v != null && v !== '' && Number.isFinite(n) ? n : d; };
/** Collé à l'écran (cheminée, tas de feuilles…) ou dans la page (cartes, logo…) */
function estFixe(el: HTMLElement) {
  for (let n: HTMLElement | null = el; n && n !== document.body; n = n.parentElement) if (getComputedStyle(n).position === 'fixed') return true;
  return false;
}
const visible = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.width > 8 && r.height > 8; };
/** Boutons et liens de l'écran : on ne cache jamais un petit bouton (les grandes cartes ne comptent pas). La zone à toucher
 *  posée SUR l'élément lui-même (ex. « secoue l'arbre », aussi grande que l'arbre) n'est pas un obstacle. */
function obstacles(el: HTMLElement): Boite[] {
  const e = el.getBoundingClientRect(), aireEl = e.width * e.height;
  return [...document.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [role="button"]')]
    .filter((o) => o !== el && !o.contains(el) && !el.contains(o) && !o.closest('[data-cache-perso]'))
    .map((o) => o.getBoundingClientRect()).filter((r) => r.width > 0)
    .filter((r) => {
      const ix = Math.max(0, Math.min(r.right, e.right) - Math.max(r.left, e.left)), iy = Math.max(0, Math.min(r.bottom, e.bottom) - Math.max(r.top, e.top));
      const aire = r.width * r.height;
      return !(ix * iy >= aire * 0.5 && aire >= aireEl * 0.5);
    });
}
function chercherCachette(tirage: { h1: number; h2: number; place: number }, nomAnimal: string): Cachette | null {
  // Jamais derrière lui-même (le dromadaire caché derrière le dromadaire, le bonhomme de neige derrière le bonhomme…)
  const decor = [...document.querySelectorAll<HTMLElement>('[data-cachette]')].filter(visible)
    .filter((el) => (el.dataset.cachette || '').toLowerCase() !== nomAnimal.toLowerCase());
  const cartes = [...document.querySelectorAll<HTMLElement>('.carte-accueil')].filter(visible);
  const choix = choisirCachette(decor.length, cartes.length, tirage.h1, tirage.h2);
  if (!choix) return null;
  const premiere = choix.type === 'decor' ? decor[choix.i] : cartes[choix.i];
  const ordre = [premiere, ...decor, ...cartes].filter((x, i, t) => t.indexOf(x) === i);
  for (const el of ordre) {
    const d = el.dataset;
    const cote = (COTES as string[]).includes(d.cachetteCote ?? '') ? d.cachetteCote as Cote : 'haut';
    const bord = nombre(d.cachetteBord, 0);
    const places = d.cachettePlace != null ? [nombre(d.cachettePlace, 0.5), ...PLACES] : [tirage.place, ...PLACES];
    const obs = obstacles(el);
    const r = el.getBoundingClientRect();
    const aireMax = 6 * FENETRE[cote].l * FENETRE[cote].h;
    const place = places.find((p) => !gene(fenetreCachette(r, cote, p, bord), obs, aireMax));
    if (place === undefined) continue;
    return { el, nom: d.cachette || d.carteNom || 'une carte', prep: d.cachettePrep || 'derrière', cote, bord, place, fixe: estFixe(el), repos: d.cachetteRepos };
  }
  return null;
}
const CLASSE_COTE: Record<Cote, string> = { haut: 'jeux-tete', gauche: 'jeux-cote-g', droite: 'jeux-cote-d' };
const NB_TRACES = 14;

export function CacheCache({ saison, userId, sansEcureuil = false }: { saison: Saison; userId: string; sansEcureuil?: boolean }) {
  const cleAlbum = `dinislam_cache_album_${userId}`;
  // 🔁 Nadia, 2026-11-12 : le jeu revient À CHAQUE retour sur l'accueil (nouvelle partie à chaque fois que l'accueil s'affiche)
  const [trouveIci, setTrouveIci] = useState(false);
  const [cachette, setCachette] = useState<Cachette | null>(null);
  const [bulle, setBulle] = useState<HTMLElement | null>(null);
  const [trouve, setTrouve] = useState<null | { cachette: string; album: string[] }>(null);
  const [danse, setDanse] = useState(false);
  // Une cachette différente à chaque partie
  const liste = useMemo(() => animauxDe(saison, sansEcureuil), [saison, sansEcureuil]);
  const [tirage] = useState(() => ({ h1: Math.random(), h2: Math.random(), place: 0.1 + Math.random() * 0.8, animal: tirerAnimal(liste.length) }));
  const animal = liste[tirage.animal] ?? liste[0];
  const nomAnimal = animal.nom;
  const fenRef = useRef<HTMLButtonElement>(null);
  const departRef = useRef<SVGSVGElement>(null);
  const tracesRef = useRef<HTMLDivElement>(null);

  // La cachette de la partie (cherchée dans l'accueil ; retrouvée si l'accueil se redessine) + la place de la bulle
  const cachetteRef = useRef(cachette);
  cachetteRef.current = cachette;
  useEffect(() => {
    if (trouveIci) return;
    const chercher = () => {
      const place = document.getElementById('bulle-cache-cache');
      setBulle((b) => (b === place ? b : place));
      const c = cachetteRef.current;
      if (c?.el.isConnected && visible(c.el)) return;
      const n = chercherCachette(tirage, nomAnimal);
      if (n) setCachette(n);
    };
    // Un petit délai : le décor (chargé à part) a le temps de s'afficher
    const t0 = setTimeout(chercher, 600);
    const t = setInterval(chercher, 2000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, [trouveIci, tirage, nomAnimal]);

  // ⏱️ Les traces n'arrivent qu'au bout de 20 s : l'enfant a d'abord le temps de chercher tout seul (Nadia, 2026-11-12)
  const [indice, setIndice] = useState(false);
  useEffect(() => { const t = setTimeout(() => setIndice(true), 20_000); return () => clearTimeout(t); }, []);

  // 📍 Il suit SA cachette à chaque image (défilement, changement de taille, dromadaire qui marche…) et
  // 🐾 les traces vont TOUJOURS vers le bout de lui qui dépasse (bug signalé par les élèves le 26/11 : elles visaient un
  // coin de la carte, bornés, et se décalaient après un défilement)
  useEffect(() => {
    if (!cachette || trouveIci) return;
    let raf = 0, dernier = '';
    const tour = () => {
      raf = requestAnimationFrame(tour);
      const b = fenRef.current;
      if (!b || document.hidden) return;
      const r = cachette.el.getBoundingClientRect();
      if (r.width < 1) { b.style.visibility = 'hidden'; return; }
      const f = fenetreCachette(r, cachette.cote, cachette.place, cachette.bord);
      const dx = cachette.fixe ? 0 : window.scrollX, dy = cachette.fixe ? 0 : window.scrollY;
      b.style.visibility = 'visible';
      b.style.transform = `translate(${(f.left + dx).toFixed(1)}px, ${(f.top + dy).toFixed(1)}px)`;
      const boite = tracesRef.current;
      if (!boite) return;
      const w = window.innerWidth, h = window.innerHeight;
      const d = departRef.current?.getBoundingClientRect();
      const depart = d && d.width ? { x: d.left + d.width / 2, y: d.top + d.height / 2 } : { x: w / 2, y: h - 80 };
      const traces = cheminTraces(depart, pointVisible(f, cachette.cote), { x0: 14, y0: 64, x1: w - 14, y1: h - 14 });
      const cle = traces.map((p) => `${p.x | 0},${p.y | 0}`).join(';');
      if (cle === dernier) return;
      dernier = cle;
      [...boite.children].forEach((s, i) => {
        const el = s as HTMLElement, p = traces[i];
        el.style.display = p ? '' : 'none';
        if (p) el.style.transform = `translate(${(p.x - 10).toFixed(1)}px, ${(p.y - 10).toFixed(1)}px) rotate(${p.r.toFixed(0)}deg)`;
      });
    };
    raf = requestAnimationFrame(tour);
    return () => cancelAnimationFrame(raf);
  }, [cachette, trouveIci, indice]);

  const trouver = () => {
    const nom = cachette?.nom || 'une carte';
    const album = [...new Set([...lireJ<string[]>(cleAlbum, []), nom])];
    ecrireJ(cleAlbum, album);
    porterHabit(userId, HABIT[saison].cle);
    setDanse(true);
    setTimeout(() => setDanse(false), 2600);
    setTrouve({ cachette: `${cachette?.prep || 'derrière'} « ${nom} »`, album });
    setTrouveIci(true);
    setCachette(null);
  };

  const mot = motArabeDuJour(jour(), saison === 'ramadan');
  const gentil = motGentilDuJour(jour());
  // 🔊 Voix fabriquée de Hamed (choix de Nadia du 26/11, gardée hors ligne une fois entendue), sinon la voix de l'appareil
  const ecouterMot = () => dire(mot.arabe, 'ar', 'hamed');
  const voix = !!fichierVoix(mot.arabe, 'ar', 'hamed') || (typeof window !== 'undefined' && 'speechSynthesis' in window);
  const { l: FL, h: FH } = cachette ? FENETRE[cachette.cote] : FENETRE.haut;

  return (
    <>
      {/* 💬 La bulle « Essaie de me trouver ! » (dite par le personnage de la partie), entre l'arbre / le message de bienvenue et
          le carnet (Nadia, 12/11). Les traces partent d'elle. (26/11 : l'ancienne « cachette dans le décor » est retirée) */}
      {bulle && !trouveIci && createPortal(
        <div className="jeux-bulle-cache flex items-end gap-1 pointer-events-none">
          <svg ref={departRef} viewBox={animal.vb} aria-hidden className="h-10 w-10 shrink-0" dangerouslySetInnerHTML={{ __html: animal.svg }} />
          <span className="relative mb-5 rounded-2xl rounded-bl-none border-2 border-amber-300 bg-white dark:bg-card px-2.5 py-1 text-[11px] sm:text-xs font-extrabold text-amber-800 dark:text-amber-200 shadow-md max-w-[6.5rem] sm:max-w-none leading-tight">Essaie de me trouver !</span>
        </div>, bulle)}
      {/* Il dépasse de sa cachette (la tête par le haut, ou le côté) : seul le bout visible se touche */}
      {cachette && !trouveIci && createPortal(
        <button ref={fenRef} type="button" data-cache-perso onClick={(e) => { e.preventDefault(); e.stopPropagation(); trouver(); }}
          aria-label={`${animal.nom} se cache ${cachette.prep} ${cachette.nom} : touche-le !`}
          className={`pointer-events-none ${cachette.fixe ? 'fixed' : 'absolute'} left-0 top-0 z-[33] overflow-hidden outline-none [-webkit-tap-highlight-color:transparent]`}
          style={{ width: FL, height: FH, visibility: 'hidden' }}>
          <svg viewBox={animal.vb} className={`pointer-events-auto cursor-pointer h-12 w-12 ${CLASSE_COTE[cachette.cote]} ${cachette.cote === 'droite' ? 'ml-auto' : ''}`}
            style={cachette.repos || animal.repos ? { ['--repos' as string]: cachette.repos || animal.repos } : undefined} dangerouslySetInnerHTML={{ __html: animal.svg }} />
        </button>,
        document.body,
      )}
      {/* 🐾 Les empreintes, de la bulle jusqu'à lui (placées à chaque image, voir plus haut) */}
      {cachette && !trouveIci && indice && createPortal(
        <div ref={tracesRef} aria-hidden className="pointer-events-none fixed inset-0 z-[25] overflow-hidden">
          {Array.from({ length: NB_TRACES }, (_, i) => (
            <span key={i} className="jeux-trace absolute left-0 top-0 text-lg leading-none" style={{ display: 'none', animationDelay: `${i * 0.25}s` }}>🐾</span>
          ))}
        </div>, document.body)}
      {/* 💃 Il sort, fait une pirouette, et la saison tombe sur tout l'écran */}
      {danse && createPortal(
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[85] overflow-hidden">
          {Array.from({ length: 22 }, (_, i) => (
            <span key={i} className="jeux-pluie absolute text-xl" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s` }}>{PLUIE[saison]}</span>
          ))}
        </div>, document.body)}
      {trouve && createPortal(
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/30 px-4" onClick={() => setTrouve(null)}>
          <div className="jeux-bulle max-w-sm w-full max-h-[90dvh] overflow-y-auto rounded-3xl bg-card p-5 space-y-3 shadow-2xl border-2 border-emerald-300 text-center" onClick={(e) => e.stopPropagation()}>
            <svg viewBox={animal.vb} className="jeux-pirouette mx-auto h-16 w-16" aria-hidden dangerouslySetInnerHTML={{ __html: animal.svg }} />
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">🙈 Trouvé ! {animal.nom} se cachait {trouve.cachette}</p>
            <p className="text-sm font-semibold [overflow-wrap:anywhere]">{gentil.texte}</p>
            {gentil.source && <p className="text-[11px] text-muted-foreground">Rapporté par {gentil.source}</p>}
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 space-y-1">
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">🔤 Le mot arabe du jour</p>
              <p className="text-4xl">{mot.image}</p>
              <p className="font-arabic text-4xl leading-snug" dir="rtl">{mot.arabe}</p>
              <p className="text-sm"><b>{mot.translit}</b> = {mot.sens}</p>
              {voix && <button type="button" onClick={ecouterMot} className="rounded-full bg-amber-500 text-white px-3 py-1 text-xs font-bold">🔊 Écouter</button>}
            </div>
            <p className="text-xs">Le personnage qui se promène en bas met {HABIT[saison].nom} pour toute la journée : regarde !</p>
            <div className="rounded-2xl bg-muted/50 p-2.5 text-start">
              <p className="text-[11px] font-bold">📒 Mon album des cachettes ({trouve.album.length})</p>
              <p className="mt-1 flex flex-wrap gap-1">{trouve.album.map((c) => <span key={c} className="rounded-full bg-card border px-2 py-0.5 text-[11px] font-semibold">{c}</span>)}</p>
            </div>
            <p className="text-[11px] text-muted-foreground">Reviens à l'accueil : il se cachera ailleurs 😉</p>
            <button type="button" onClick={() => setTrouve(null)} className="w-full rounded-xl bg-emerald-600 text-white py-2 text-sm font-bold">Super !</button>
          </div>
        </div>, document.body)}
    </>
  );
}
