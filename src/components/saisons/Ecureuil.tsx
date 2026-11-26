import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSaisonActive } from '@/lib/saisons';
import { sonCristal } from '@/lib/sonSaison';
import { ECUREUIL_SVG, ECUREUIL_VB, MAISON_VB, maisonnetteSvg } from './dessinsCachettes';
import { gene, type Boite } from './cacheCacheLogique';
import { niveauIndice, ordreAuHasard, positionDansPage, repereCourt, texteIndice, type PageEcureuil } from './ecureuilLogique';
import { demarrerEcureuil, donnerPrenom, ecureuilTrouve, enregistrerPages, faireAvancer, fermerBravo, useEcureuil } from './ecureuilEtat';

/**
 * 🐿️ L'écureuil qui se cache dans TOUTE l'appli (Nadia, 2026-11-26).
 * - `EcureuilPartout` (monté UNE fois dans App.tsx, au-dessus des pages) : le cache dans la page choisie, posé au bord
 *   d'un titre / d'une carte / d'une image (on voit les 3/4 de lui, il ne cache jamais un bouton), les indices dans une
 *   petite bulle en bas à gauche (20 s, 35 s, 45 s), le bravo quand on le trouve.
 * - `MaisonEcureuil` (accueil, monté par JeuxSaison) : sa maisonnette, à la place de l'ancienne « cachette dans le décor ».
 * - Même réglage et même filtre de groupes que les autres petits jeux (`r.jeux.ecureuil`, `r.jeux.groupes`).
 * Tout marche sans réseau : rien n'est envoyé, l'état vit sur l'appareil.
 */
const lire = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } };
const sansRecherche = (chemin: string) => chemin.split('?')[0].split('#')[0] || '/';

/** Même règle que les autres petits jeux : allumé, saison décorée, et (si des groupes sont choisis) dans un de ces groupes */
function useJeuConcerne(userId: string | null, isAdmin: boolean) {
  const { saison, r } = useSaisonActive();
  const j = r.jeux;
  const { data: mesGroupes = [] } = useQuery({
    queryKey: ['my-group-ids', userId], enabled: !!userId && j.groupes.length > 0 && !isAdmin,
    queryFn: async () => ((await supabase.from('student_group_members').select('group_id').eq('user_id', userId!)).data || []).map((g) => g.group_id),
  });
  return !!saison && j.ecureuil !== false && (isAdmin || !j.groupes.length || mesGroupes.some((g) => j.groupes.includes(g)));
}

export default function EcureuilPartout() {
  const { user, isAdmin, isApproved } = useAuth();
  const concerne = useJeuConcerne(user?.id ?? null, isAdmin);
  if (!user || !(isAdmin || isApproved === true) || !concerne) return null;
  return <EcureuilJeu />;
}

function EcureuilJeu() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { etat, bravo, prenom } = useEcureuil();
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    demarrerEcureuil();
    const t = setInterval(() => { faireAvancer(); setMaintenant(Date.now()); }, 1000);
    return () => clearInterval(t);
  }, []);

  // 🗺️ Les pages où il peut se cacher = les cartes que l'élève voit sur SON accueil (lues à chaque passage sur l'accueil)
  useEffect(() => {
    if (pathname !== '/') return;
    const lireCartes = () => {
      const vues = new Set<string>();
      const pages: PageEcureuil[] = [];
      document.querySelectorAll<HTMLElement>('.carte-accueil[data-carte-chemin]').forEach((el) => {
        const chemin = el.dataset.carteChemin || '';
        if (!chemin.startsWith('/') || sansRecherche(chemin) === '/' || vues.has(chemin)) return;
        vues.add(chemin);
        pages.push({ chemin, nom: el.dataset.carteNom || 'une carte' });
      });
      if (pages.length) enregistrerPages(pages);
    };
    const t0 = setTimeout(lireCartes, 1500);
    const t = setInterval(lireCartes, 5000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, [pathname]);

  const cache = etat?.lieu === 'cache' ? etat : null;
  const surLaPage = !!cache && pathname === sansRecherche(cache.chemin);
  const niveau = cache ? niveauIndice(maintenant - cache.depuis) : 0;
  const [repere, setRepere] = useState<{ repere?: string; ou?: string }>({});
  const texte = cache ? texteIndice(niveau, { surLaPage, nomPage: cache.nomPage, ...(surLaPage ? repere : {}) }) : null;

  return (
    <>
      {cache && surLaPage && <EcureuilCache key={`${cache.chemin}|${cache.depuis}`} graine={cache.graine} niveau={niveau} onRepere={setRepere} />}
      {cache && texte && (
        <BulleIndice texte={texte} allerA={niveau >= 3 && !surLaPage ? () => navigate(cache.chemin) : undefined} />
      )}
      {bravo > 0 && <BravoEcureuil prenom={prenom} />}
    </>
  );
}

/* ---------- 🐿️ Caché dans la page ---------- */
type Cible = { el: HTMLElement; place: number; repere: string; ou: string };
const LARG = 40, VISIBLE = 30; // 40 px de large ; 30 px visibles sur 40 = les 3/4 de son corps
/** Marge autour de lui dans sa boîte : sa lueur (3ᵉ indice) n'est pas coupée en carré ; seul le bas (caché) est coupé */
const MARGE = 14;
const estFixe = (el: HTMLElement) => {
  for (let n: HTMLElement | null = el; n && n !== document.body; n = n.parentElement) if (getComputedStyle(n).position === 'fixed') return true;
  return false;
};
function repereDe(el: HTMLElement): string {
  const tag = el.tagName;
  if (/^H[1-4]$/.test(tag)) return repereCourt(el.textContent || '') || 'un titre';
  if (tag === 'IMG') return (el as HTMLImageElement).alt ? repereCourt((el as HTMLImageElement).alt) : 'une image';
  const titre = el.querySelector('h1, h2, h3, h4');
  const t = repereCourt((titre?.textContent || el.innerText || '').split('\n')[0] || '');
  return t || 'une carte';
}
/** Choisit où il se pose dans la page : toujours la même place pour une même graine, jamais sur un bouton */
function choisirCible(graine: number): Cible | null {
  const racine = document.querySelector('main') ?? document.body;
  const sy = window.scrollY, W = window.innerWidth;
  const limite = Math.max(window.innerHeight * 2.2, 1400); // pas trop loin en bas : il doit rester trouvable par un enfant
  const els = [...racine.querySelectorAll<HTMLElement>('h1, h2, h3, img, [class*="rounded-xl"], [class*="rounded-2xl"], [class*="rounded-3xl"]')]
    .filter((el) => !el.closest('[role="dialog"], [data-pas-ecureuil], [data-ecureuil], [data-cache-perso], header, nav'))
    .filter((el) => { const r = el.getBoundingClientRect(); const top = r.top + sy; return r.width >= 90 && r.height >= 24 && r.width <= W + 2 && top - VISIBLE >= 70 && top < limite; })
    .slice(0, 160)
    .filter((el) => !estFixe(el));
  if (!els.length) return null;
  const inter = [...document.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [role="button"], [role="tab"], [role="switch"]')]
    .filter((o) => !o.closest('[data-ecureuil]')).map((o) => ({ o, r: o.getBoundingClientRect() })).filter((x) => x.r.width > 0);
  const places = [0.8, 0.2, 0.5, 0.65, 0.35];
  const decale = Math.floor(graine * 997) % places.length;
  for (const i of ordreAuHasard(els.length, graine)) {
    const el = els[i];
    const r = el.getBoundingClientRect();
    const obs: Boite[] = inter.filter(({ o }) => o !== el && !o.contains(el) && !el.contains(o)).map(({ r: b }) => b);
    for (let k = 0; k < places.length; k++) {
      const p = places[(k + decale) % places.length];
      const b = { left: r.left + p * (r.width - LARG), top: r.top - VISIBLE, width: LARG, height: VISIBLE };
      if (b.left < 4 || b.left + LARG > W - 4) continue;
      if (gene(b, obs, 6 * LARG * VISIBLE * 4)) continue;
      return { el, place: p, repere: repereDe(el), ou: positionDansPage(r.top + sy, document.documentElement.scrollHeight) };
    }
  }
  return null;
}

function EcureuilCache({ graine, niveau, onRepere }: { graine: number; niveau: number; onRepere: (r: { repere?: string; ou?: string }) => void }) {
  const [cible, setCible] = useState<Cible | null>(null);
  const cibleRef = useRef(cible);
  cibleRef.current = cible;
  const repereRef = useRef(onRepere);
  repereRef.current = onRepere;
  useEffect(() => {
    const chercher = () => {
      const c = cibleRef.current;
      if (c?.el.isConnected && c.el.getBoundingClientRect().width > 0) return;
      const n = choisirCible(graine);
      setCible(n);
      repereRef.current(n ? { repere: n.repere, ou: n.ou } : {});
    };
    // Le temps que la page s'affiche (cartes chargées à part)
    const t0 = setTimeout(chercher, 1200);
    const t = setInterval(chercher, 2000);
    return () => { clearTimeout(t0); clearInterval(t); repereRef.current({}); };
  }, [graine]);

  const boiteRef = useRef<HTMLDivElement>(null);
  const flecheRef = useRef<HTMLDivElement>(null);
  const [sens, setSens] = useState<'ici' | 'haut' | 'bas'>('ici');
  const fleche = niveau >= 3;
  // Il suit sa place à chaque image (la page qui bouge, qui change de taille) ; au 3ᵉ indice, la flèche le suit
  useEffect(() => {
    if (!cible) return;
    let raf = 0, sensAvant = '';
    const tour = () => {
      raf = requestAnimationFrame(tour);
      const b = boiteRef.current;
      if (!b || document.hidden) return;
      const r = cible.el.getBoundingClientRect();
      if (r.width < 1) { b.style.visibility = 'hidden'; return; }
      const x = r.left + cible.place * (r.width - LARG), y = r.top - VISIBLE;
      b.style.visibility = 'visible';
      b.style.transform = `translate(${(x - MARGE + window.scrollX).toFixed(1)}px, ${(y - MARGE + window.scrollY).toFixed(1)}px)`;
      const f = flecheRef.current;
      if (!f) return;
      const h = window.innerHeight;
      const s = y < 56 ? 'haut' : y + VISIBLE > h - 70 ? 'bas' : 'ici';
      if (s !== sensAvant) { sensAvant = s; setSens(s); }
      const cx = Math.min(window.innerWidth - 60, Math.max(8, x + LARG / 2 - 16));
      f.style.transform = s === 'ici' ? `translate(${cx.toFixed(1)}px, ${(y - 40).toFixed(1)}px)` : s === 'haut' ? `translate(${cx.toFixed(1)}px, 64px)` : `translate(${cx.toFixed(1)}px, ${h - 150}px)`;
    };
    raf = requestAnimationFrame(tour);
    return () => cancelAnimationFrame(raf);
  }, [cible, fleche]);

  if (!cible) return null;
  const toucher = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); try { sonCristal(); } catch { /* son indisponible */ } ecureuilTrouve(); };
  return createPortal(
    <>
      <div ref={boiteRef} data-ecureuil className="pointer-events-none absolute left-0 top-0 z-[35] overflow-hidden" style={{ width: LARG + 2 * MARGE, height: VISIBLE + MARGE, visibility: 'hidden' }}>
        <button type="button" onClick={toucher} aria-label="Un petit écureuil se cache ici : touche-le !"
          className="pointer-events-auto absolute block h-10 w-10 outline-none [-webkit-tap-highlight-color:transparent]" style={{ left: MARGE, top: MARGE }}>
          <svg viewBox={ECUREUIL_VB} aria-hidden className={`h-10 w-10 overflow-visible ${niveau >= 3 ? 'ecureuil-remue' : 'ecureuil-guette'}`}
            style={{ filter: niveau >= 3 ? undefined : 'drop-shadow(0 1px 1px rgba(60,30,10,.3))' }} dangerouslySetInnerHTML={{ __html: ECUREUIL_SVG }} />
        </button>
      </div>
      {fleche && (
        <div ref={flecheRef} data-ecureuil aria-hidden className="pointer-events-none fixed left-0 top-0 z-[46]">
          <span className={`ecureuil-fleche ${sens === 'haut' ? 'haut' : ''} inline-block whitespace-nowrap rounded-full border-2 border-amber-300 bg-white/95 px-2 py-0.5 text-sm font-extrabold text-amber-800 shadow-md`}>
            {sens === 'ici' ? '👇' : sens === 'haut' ? '⬆️ Plus haut !' : '⬇️ Plus bas !'}
          </span>
        </div>
      )}
    </>,
    document.body,
  );
}

/* ---------- 💡 La bulle des indices (petite, en bas à gauche, à côté de l'étoile) ---------- */
function BulleIndice({ texte, allerA }: { texte: string; allerA?: () => void }) {
  const [ouvert, setOuvert] = useState(true);
  // Chaque nouvel indice s'ouvre 9 s, puis se replie en un petit écureuil (le toucher le rouvre)
  useEffect(() => { setOuvert(true); const t = setTimeout(() => setOuvert(false), 9000); return () => clearTimeout(t); }, [texte]);
  const pos = { left: 'calc(env(safe-area-inset-left, 0px) + 64px)', bottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 84px), calc(var(--menu-bas, 0px) + 16px))' };
  return createPortal(
    ouvert ? (
      <div data-ecureuil role="status" className="jeux-bulle fixed z-[45] flex max-w-[min(15rem,calc(100vw-8rem))] items-start gap-1.5 rounded-2xl rounded-bl-sm border-2 border-amber-300 bg-white/95 dark:bg-card px-2.5 py-1.5 shadow-lg" style={pos}>
        <svg viewBox={ECUREUIL_VB} aria-hidden className="mt-0.5 h-7 w-7 shrink-0" dangerouslySetInnerHTML={{ __html: ECUREUIL_SVG }} />
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">💡 Indice de l'écureuil</p>
          <p className="text-xs font-semibold leading-snug text-amber-950 dark:text-amber-100 [overflow-wrap:anywhere]">{texte}</p>
          {allerA && <button type="button" onClick={() => { allerA(); setOuvert(false); }} className="mt-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">🐿️ Y aller</button>}
        </div>
        <button type="button" aria-label="Fermer l'indice" onClick={() => setOuvert(false)} className="-mr-1 -mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-extrabold text-destructive">✕</button>
      </div>
    ) : (
      <button type="button" data-ecureuil onClick={() => setOuvert(true)} aria-label="Revoir l'indice de l'écureuil"
        className="fixed z-[45] grid h-9 w-9 place-items-center rounded-full border-2 border-amber-300 bg-white/90 opacity-85 shadow" style={pos}>
        <svg viewBox={ECUREUIL_VB} aria-hidden className="h-6 w-6" dangerouslySetInnerHTML={{ __html: ECUREUIL_SVG }} />
      </button>
    ),
    document.body,
  );
}

/* ---------- 🎉 Trouvé : il rentre dans sa maisonnette ---------- */
function SceneRentre() {
  const vide = useMemo(() => maisonnetteSvg('bravo-vide', false), []);
  const plein = useMemo(() => maisonnetteSvg('bravo-plein', true), []);
  return (
    <svg viewBox="0 0 150 100" aria-hidden className="mx-auto h-28 w-auto overflow-visible">
      <g transform="translate(48 2)"><svg viewBox={MAISON_VB} width="100" height="96" dangerouslySetInnerHTML={{ __html: vide }} /></g>
      <g transform="translate(48 2)" className="maison-allume"><svg viewBox={MAISON_VB} width="100" height="96" dangerouslySetInnerHTML={{ __html: plein }} /></g>
      <g transform="translate(6 56)"><g className="ecureuil-rentre"><svg viewBox={ECUREUIL_VB} width="38" height="38" dangerouslySetInnerHTML={{ __html: ECUREUIL_SVG }} /></g></g>
    </svg>
  );
}
function BravoEcureuil({ prenom }: { prenom: string }) {
  return createPortal(
    <div data-ecureuil className="fixed inset-0 z-[80] grid place-items-center bg-black/30 px-4" onClick={fermerBravo}>
      <div className="jeux-bulle w-full max-w-sm max-h-[90dvh] overflow-y-auto space-y-2 rounded-3xl border-2 border-amber-300 bg-card p-5 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <SceneRentre />
        <p className="text-lg font-extrabold text-amber-800 dark:text-amber-200 [overflow-wrap:anywhere]">🎉 Bravo{prenom ? ` ${prenom}` : ''} !</p>
        <p className="text-sm font-semibold">Tu m'as trouvé ! 🐿️ Je rentre vite dans ma maisonnette 🏡</p>
        <p className="text-xs text-muted-foreground">Mais attention… je vais bientôt repartir me cacher ailleurs ! Ouvre l'œil 👀</p>
        <button type="button" onClick={fermerBravo} className="w-full rounded-xl bg-amber-500 py-2 text-sm font-bold text-white">À tout à l'heure ! 👋</button>
      </div>
    </div>,
    document.body,
  );
}

/* ---------- 🏡 La maisonnette sur l'accueil (dans la rangée de la bulle du cache-cache) ---------- */
export function MaisonEcureuil({ userId, prenom }: { userId: string; prenom: string }) {
  const { etat } = useEcureuil();
  useEffect(() => { demarrerEcureuil(); }, []);
  useEffect(() => { donnerPrenom(prenom); }, [prenom]);
  const [place, setPlace] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const chercher = () => { const p = document.getElementById('maison-ecureuil'); setPlace((x) => (x === p ? x : p)); };
    chercher();
    const t = setInterval(chercher, 1500);
    return () => clearInterval(t);
  }, []);
  const dedans = etat?.lieu === 'maison';
  const svg = useMemo(() => maisonnetteSvg(`accueil-${dedans ? 'in' : 'out'}`, dedans), [dedans]);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(t); }, [message]);
  useEffect(() => { setMessage(null); }, [dedans]);
  const p = prenom || '';

  // 📣 Présentation du nouveau personnage : UNE fois par élève (gardée sur l'appareil)
  const cleAnnonce = `dinislam_ecureuil_annonce_${userId}`;
  const [annonce, setAnnonce] = useState(false);
  useEffect(() => {
    if (lire(cleAnnonce)) return;
    const t = setTimeout(() => setAnnonce(true), 1500);
    return () => clearTimeout(t);
  }, [cleAnnonce]);
  const fermerAnnonce = () => { ecrire(cleAnnonce, '1'); setAnnonce(false); };
  const annonceSvg = useMemo(() => maisonnetteSvg('annonce', true), []);

  const toucher = () => setMessage(dedans
    ? `Coucou${p ? ` ${p}` : ''} ! Je me repose dans ma maisonnette 🏡 Je repars bientôt me cacher 😉`
    : 'Je ne suis pas à la maison ! Cherche-moi dans l\'appli 🔍');
  const texteBulle = message ?? (dedans ? null : `Tu ne me trouveras pas${p ? `, ${p}` : ''} ! 😜`);

  return (
    <>
      {place && createPortal(
        <div className="flex items-end gap-1">
          {texteBulle && (
            <span role="status" className="jeux-bulle mb-6 max-w-[8rem] sm:max-w-[12rem] rounded-2xl rounded-br-none border-2 border-amber-300 bg-white dark:bg-card px-2 py-1 text-[11px] sm:text-xs font-extrabold leading-tight text-amber-800 dark:text-amber-200 shadow-md [overflow-wrap:anywhere]">
              {texteBulle}
            </span>
          )}
          <button type="button" onClick={toucher} aria-label={dedans ? 'La maisonnette de l\'écureuil : il est chez lui !' : 'La maisonnette de l\'écureuil : il est parti se cacher'}
            className="shrink-0 outline-none [-webkit-tap-highlight-color:transparent]">
            <svg viewBox={MAISON_VB} aria-hidden className="h-16 w-[4.2rem] overflow-visible drop-shadow" dangerouslySetInnerHTML={{ __html: svg }} />
          </button>
        </div>, place)}
      {annonce && createPortal(
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/30 px-4" onClick={fermerAnnonce}>
          <div className="jeux-bulle w-full max-w-sm max-h-[90dvh] overflow-y-auto space-y-2 rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-[#fff8ee] to-[#fbe7c8] dark:from-card dark:to-card p-5 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <svg viewBox={MAISON_VB} aria-hidden className="mx-auto h-24 w-24 overflow-visible" dangerouslySetInnerHTML={{ __html: annonceSvg }} />
            <p className="text-lg font-extrabold text-[#7a3d17] dark:text-amber-200">🐿️ Nouveau !</p>
            <p className="text-sm font-bold">Un petit écureuil s'est installé dans Dinislam ! 🏡</p>
            <p className="text-sm">Il adore jouer à cache-cache 🙈 : il se cache partout dans l'appli, derrière un titre, une carte ou une image… 🔍</p>
            <p className="text-sm">Tu ne le trouves pas ? Il te donnera des indices 💡</p>
            <p className="text-sm">Quand tu le trouves, touche-le : il rentre dans sa maisonnette, ici sur l'accueil 🎉</p>
            <button type="button" onClick={fermerAnnonce} className="w-full rounded-xl bg-[#b5562b] py-2 text-sm font-bold text-white">🐿️ D'accord, je le cherche !</button>
          </div>
        </div>, document.body)}
    </>
  );
}
