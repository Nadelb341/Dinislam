import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Saison } from '@/lib/saisons';
import { IMAGES_AUTOMNE } from './dessinsAutomne';
import { PERSOS } from './dessinsHiver';
import { ANIMAUX } from './dessinsPrintempsEte';
import { porterHabit } from './compagnonEvenement';
import { FEU_MAX, HABIT, echelleFeu, motArabeDuJour, motGentilDuJour, niveauFeu } from './jeuxSaisonLogique';

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

  const nbBuches = buches ? Math.min(devoirs.valides, 5) : 0;
  const chatDort = k > 0 && niveau >= 4;
  return createPortal(
    <div aria-hidden className="pointer-events-none fixed bottom-0 z-[31] transition-opacity duration-500"
      style={{ right: 'max(-6px, env(safe-area-inset-right, 0px))', width: 'min(30vw, 112px)', aspectRatio: '200 / 172', marginBottom: 'env(safe-area-inset-bottom, 0px)', opacity: defile ? 0.3 : 1 }}>
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
    </div>,
    document.body,
  );
}

// ——— 🙈 Cache-cache ———
/** 🔁 Un personnage différent à chaque partie (Nadia, 2026-11-12) ; c'est LUI qui dit « Essaie de me trouver ! » */
type AnimalCache = { vb: string; svg: string; nom: string };
const A48 = (k: string, nom: string): AnimalCache => ({ vb: '0 0 48 48', svg: IMAGES_AUTOMNE[k]?.svg ?? '', nom });
const ANIMAUX_CACHE: Record<Saison, AnimalCache[]> = {
  automne: [A48('ecureuil', 'L\'écureuil'), A48('herisson', 'Le hérisson'), A48('hibou', 'Le hibou'), A48('renard', 'Le renard')],
  hiver: [{ vb: '0 0 30 38', svg: PERSOS.pingouin, nom: 'Le pingouin' }, { vb: '0 0 30 38', svg: PERSOS.bonhomme, nom: 'Le bonhomme de neige' }, A48('hibou', 'Le hibou')],
  printemps: [{ vb: '0 0 40 34', svg: ANIMAUX.lapin.svg, nom: 'Le lapin' }, { vb: '0 0 40 34', svg: ANIMAUX.escargot.svg, nom: 'L\'escargot' }, { vb: '0 0 40 34', svg: ANIMAUX.biche.svg, nom: 'La biche' }],
  ete: [{ vb: '0 0 40 34', svg: ANIMAUX.crabe.svg, nom: 'Le crabe' }, { vb: '0 0 40 34', svg: ANIMAUX.dauphin.svg, nom: 'Le dauphin' }],
};
/** Tire un personnage, jamais le même que la partie d'avant */
function tirerAnimal(saison: Saison): number {
  const n = ANIMAUX_CACHE[saison].length;
  let avant = -1;
  try { avant = Number(sessionStorage.getItem('dinislam_cache_animal') ?? -1); } catch { /* stockage indisponible */ }
  let i = Math.floor(Math.random() * n);
  if (n > 1 && i === avant) i = (i + 1) % n;
  try { sessionStorage.setItem('dinislam_cache_animal', String(i)); } catch { /* stockage indisponible */ }
  return i;
}
const PLUIE: Record<Saison, string> = { automne: '🍂', hiver: '❄️', printemps: '🌸', ete: '🐚' };

/** B · la cachette dans le décor (un petit tas d'où dépasse sa queue), dans la rangée de la bulle */
const CACHETTES_DECOR: Record<Saison, { nom: string; tas: string }[]> = {
  automne: [{ nom: 'le tas de feuilles', tas: '🍂🍁' }, { nom: 'les branches de l\'arbre', tas: '🍁🍂' }, { nom: 'le panier de pommes', tas: '🍎🧺' }, { nom: 'les champignons', tas: '🍄🍂' }],
  hiver: [{ nom: 'le tas de neige', tas: '❄️⛄' }, { nom: 'le sapin', tas: '🎄' }, { nom: 'les flocons', tas: '❄️❄️' }, { nom: 'le bonhomme de neige', tas: '⛄' }],
  printemps: [{ nom: 'les fleurs', tas: '🌷🌼' }, { nom: 'l\'arbre en fleurs', tas: '🌸🌳' }, { nom: 'le buisson', tas: '🌿🌱' }, { nom: 'les papillons', tas: '🦋🌼' }],
  ete: [{ nom: 'le sable', tas: '🏖️🐚' }, { nom: 'le parasol', tas: '⛱️' }, { nom: 'les vagues', tas: '🌊🌊' }, { nom: 'le seau de plage', tas: '🪣🐚' }],
};

export function CacheCache({ saison, userId }: { saison: Saison; userId: string }) {
  const cleAlbum = `dinislam_cache_album_${userId}`;
  // 🔁 Nadia, 2026-11-12 : le jeu revient À CHAQUE retour sur l'accueil (nouvelle partie à chaque fois que l'accueil s'affiche)
  const [trouveIci, setTrouveIci] = useState(false);
  const [hote, setHote] = useState<{ el: HTMLElement; nom: string } | null>(null);
  const [bulle, setBulle] = useState<HTMLElement | null>(null);
  const [trouve, setTrouve] = useState<null | { cachette: string; album: string[] }>(null);
  const [danse, setDanse] = useState(false);
  // Une cachette différente à chaque partie
  const [tirage] = useState(() => ({ carte: Math.random(), coin: Math.floor(Math.random() * 4), animal: tirerAnimal(saison) }));
  const animal = ANIMAUX_CACHE[saison][tirage.animal] ?? ANIMAUX_CACHE[saison][0];
  const cachette = CACHETTES_DECOR[saison][tirage.coin];
  const decorRef = useRef<HTMLButtonElement>(null);

  // La carte de la partie (cherchée dans l'accueil ; retrouvée si l'accueil se redessine) + la place de la bulle
  const hoteRef = useRef(hote);
  hoteRef.current = hote;
  useEffect(() => {
    if (trouveIci) return;
    const chercher = () => {
      const place = document.getElementById('bulle-cache-cache');
      setBulle((b) => (b === place ? b : place));
      if (hoteRef.current?.el.isConnected) return;
      const cartes = [...document.querySelectorAll<HTMLElement>('.carte-accueil')];
      const carte = cartes.length ? cartes[Math.floor(tirage.carte * cartes.length)] : null;
      const parent = carte?.parentElement;
      if (carte && parent) setHote({ el: parent, nom: carte.dataset.carteNom || 'une carte' });
    };
    chercher();
    const t = setInterval(chercher, 2000);
    return () => clearInterval(t);
  }, [trouveIci, tirage]);

  // 🐾 Les traces partent de sa cachette dans le décor (B) et mènent à la carte où il se cache (A) — les 3 façons en même temps
  const [traces, setTraces] = useState<{ x: number; y: number; r: number }[]>([]);
  // ⏱️ Les traces n'arrivent qu'au bout de 20 s : l'enfant a d'abord le temps de chercher tout seul (Nadia, 2026-11-12)
  const [indice, setIndice] = useState(false);
  useEffect(() => { const t = setTimeout(() => setIndice(true), 20_000); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!hote || trouveIci || !indice) { setTraces([]); return; }
    let raf = 0;
    const calculer = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = hote.el.getBoundingClientRect();
        const d = decorRef.current?.getBoundingClientRect();
        const h = window.innerHeight, w = window.innerWidth;
        const x1 = d ? d.left + d.width / 2 : w * 0.5, y1 = d ? d.top + d.height / 2 : h - 70;
        const x2 = Math.min(w - 30, Math.max(30, r.right - 40)), y2 = Math.max(70, Math.min(h - 120, r.top + 10));
        const n = 9, ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 90;
        setTraces(Array.from({ length: n }, (_, i) => {
          const t = (i + 1) / (n + 1), dec = (i % 2 ? 9 : -9);
          return { x: x1 + (x2 - x1) * t + dec, y: y1 + (y2 - y1) * t, r: ang };
        }));
      });
    };
    calculer();
    window.addEventListener('scroll', calculer, true);
    window.addEventListener('resize', calculer);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', calculer, true); window.removeEventListener('resize', calculer); };
  }, [hote, trouveIci, indice]);

  const trouver = () => {
    const nom = hote?.nom || 'une carte';
    const album = [...new Set([...lireJ<string[]>(cleAlbum, []), nom])];
    ecrireJ(cleAlbum, album);
    porterHabit(userId, HABIT[saison].cle);
    setDanse(true);
    setTimeout(() => setDanse(false), 2600);
    setTrouve({ cachette: nom, album });
    setTrouveIci(true);
    setHote(null);
  };
  const rate = () => toast(indice ? `🍃 Raté ! Plus personne ici… Suis les traces 🐾` : `🍃 Raté ! Plus personne ici… Cherche encore !`);

  const mot = motArabeDuJour(jour());
  const gentil = motGentilDuJour(jour());
  const parler = () => {
    try {
      const u = new SpeechSynthesisUtterance(mot.arabe);
      u.lang = 'ar-SA'; u.rate = 0.8;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch { /* voix indisponible sur cet appareil */ }
  };
  const voix = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <>
      {/* 💬 La bulle « Essaie de me trouver ! » (dite par le personnage de la partie) et, à droite, B · sa cachette dans le décor
          (un petit tas d'où dépasse sa queue). Dans la rangée entre l'arbre et le carnet : plus rien de collé à l'écran (Nadia, 12/11) */}
      {bulle && !trouveIci && createPortal(
        <div className="flex w-full items-end justify-between gap-2">
          <div className="jeux-bulle-cache flex items-end gap-1 pointer-events-none">
            <svg viewBox={animal.vb} aria-hidden className="h-10 w-10 shrink-0" dangerouslySetInnerHTML={{ __html: animal.svg }} />
            <span className="relative mb-5 rounded-2xl rounded-bl-none border-2 border-amber-300 bg-white dark:bg-card px-2.5 py-1 text-[11px] sm:text-xs font-extrabold text-amber-800 dark:text-amber-200 shadow-md max-w-[6.5rem] sm:max-w-none leading-tight">Essaie de me trouver !</span>
          </div>
          <button ref={decorRef} type="button" onClick={rate} aria-label={`Une cachette : ${cachette.nom}`}
            className="flex items-end pe-1 outline-none [-webkit-tap-highlight-color:transparent]">
            <svg viewBox={animal.vb} aria-hidden className="order-2 -ml-5 h-8 w-8 opacity-70 jeux-decor-d" dangerouslySetInnerHTML={{ __html: animal.svg }} />
            <span aria-hidden className="relative text-2xl leading-none drop-shadow">{cachette.tas}</span>
          </button>
        </div>, bulle)}
      {/* A · sa tête sort de derrière la carte (les oreilles restent visibles) */}
      {hote && !trouveIci && createPortal(
        <button type="button" onClick={(e) => { e.stopPropagation(); trouver(); }} aria-label={`${animal.nom} se cache ici : touche-le !`}
          className="pointer-events-none absolute -top-11 right-3 z-[2] h-11 w-12 overflow-hidden outline-none [-webkit-tap-highlight-color:transparent]">
          <svg viewBox={animal.vb} className="pointer-events-auto cursor-pointer jeux-tete h-12 w-12" dangerouslySetInnerHTML={{ __html: animal.svg }} />
        </button>,
        hote.el,
      )}
      {/* C · les empreintes, du décor jusqu'à la carte */}
      {traces.length > 0 && createPortal(
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[25]">
          {traces.map((p, i) => (
            <span key={i} className="jeux-trace absolute text-lg" style={{ left: p.x - 10, top: p.y - 10, transform: `rotate(${p.r}deg)`, animationDelay: `${i * 0.25}s` }}>🐾</span>
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
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">🙈 Trouvé ! {animal.nom} se cachait derrière « {trouve.cachette} »</p>
            <p className="text-sm font-semibold [overflow-wrap:anywhere]">{gentil.texte}</p>
            {gentil.source && <p className="text-[11px] text-muted-foreground">Rapporté par {gentil.source}</p>}
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 space-y-1">
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">🔤 Le mot arabe du jour</p>
              <p className="text-4xl">{mot.image}</p>
              <p className="font-arabic text-4xl leading-snug" dir="rtl">{mot.arabe}</p>
              <p className="text-sm"><b>{mot.translit}</b> = {mot.sens}</p>
              {voix && <button type="button" onClick={parler} className="rounded-full bg-amber-500 text-white px-3 py-1 text-xs font-bold">🔊 Écouter</button>}
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
