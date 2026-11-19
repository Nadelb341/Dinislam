import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useSaisonActive, type Saison } from '@/lib/saisons';
import { sonHarpeEtoiles } from '@/lib/sonSaison';
import { COMPAGNONS, compagnonSvg } from './dessinsRamadan';
import { OBJETS_SAISON, objetSvg, type ObjetSaison } from './dessinsPromeneurs';
import { FeuArtificeDore, type ThemeFeu } from './FeuArtificeDore';

/**
 * 🧞 Le tapis volant se promène dans TOUTE l'appli pendant la saison Ramadan.
 * Nadia, 2026-11-17 (2ᵉ version) : « je ne veux pas qu'il suive l'écran et qu'il soit visible en permanence ; je veux qu'il
 * fasse un parcours un peu partout, et que les élèves le croisent par moment quand ils passent devant lui ; on clique dessus
 * → un géant feu d'artifice d'étoiles et de lunes dorées et de scintillements sur tout l'écran (5 s, réglable 10, 20, 30 s) ;
 * les allers-retours gauche-droite, c'est monotone ».
 * → Il vole DANS la page (il défile avec elle, il n'est pas collé à l'écran), lentement, en courbes, d'un point au hasard à
 *   un autre sur toute la hauteur de la page. Après quelques points, il sort par un côté et part se promener ailleurs
 *   puis revient par un autre endroit au bout de `tapisRetour` secondes (15 par défaut, réglable). Sa place est gardée quand on
 *   change de page, et il RÉAPPARAÎT à chaque retour sur l'accueil (Nadia, 2026-11-17).
 * 2026-11-18 (Nadia) : toucher le tapis joue aussi le son « Harpe magique » (volume 45 %), et CHAQUE saison a son objet
 * qui se promène de la même façon : ⛄ bonhomme de neige (hiver, il sautille), 🍂 feuille géante dorée (automne, elle
 * tournoie en planant), ☀️ soleil brillant (été, ses rayons tournent), 🐦 oiseau bleu et blanc (printemps, il bat des ailes).
 * Le toucher = feu d'artifice aux couleurs de la saison + un petit son doux. Réglage : Décorations des saisons › chaque saison.
 * Seul l'objet se touche (le reste de l'écran reste cliquable).
 */
type Mode = 'tapis' | 'sautille' | 'tournoie' | 'soleil' | 'vole';
type Etat = { x: number; y: number; ang: number; cx: number; cy: number; reste: number; sortie: boolean; retour: number; vite: number };
/** Une place par objet : gardée quand on change de page */
const etats: Record<string, Etat> = {};
const VITESSE = 38; // px par seconde : lent, comme une promenade
const VIRAGE = 1.1; // radians par seconde : de belles courbes, pas de zigzag

/** Hauteur de la page (sans l'objet lui-même, pour ne jamais l'agrandir) */
function dimensions() {
  const racine = document.getElementById('root');
  return { W: document.documentElement.clientWidth, H: Math.max(racine?.offsetHeight ?? 0, window.innerHeight) };
}
function cibleAuHasard(e: Etat, larg: number, haut: number) {
  const { W, H } = dimensions();
  e.cx = 10 + Math.random() * Math.max(10, W - larg - 20);
  e.cy = 70 + Math.random() * Math.max(20, H - 70 - haut - 90);
}

type Config = { cle: string; svg: string; vb: [number, number]; larg: number; haut: number; mode: Mode; son: () => void; theme: ThemeFeu; label: string; classe: string };

const OBJET_DE: Record<Exclude<Saison, 'ramadan'>, { objet: ObjetSaison; mode: Mode; son: () => void; label: string }> = {
  hiver: { objet: 'bonhomme', mode: 'sautille', son: sonHarpeEtoiles, label: 'Le bonhomme de neige : touche-le pour un feu d\'artifice !' },
  automne: { objet: 'feuille', mode: 'tournoie', son: sonHarpeEtoiles, label: 'La feuille dorée : touche-la pour un feu d\'artifice !' },
  ete: { objet: 'soleil', mode: 'soleil', son: sonHarpeEtoiles, label: 'Le soleil : touche-le pour un feu d\'artifice !' },
  printemps: { objet: 'oiseau', mode: 'vole', son: sonHarpeEtoiles, label: 'L\'oiseau : touche-le pour un feu d\'artifice !' },
};

/** Choisit l'objet de la saison en cours (le nom reste « TapisPromeneur » : AppLayout l'affiche déjà) */
export function TapisPromeneur() {
  const { saison, r } = useSaisonActive();
  const reduit = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const bouge = !reduit || r.animerToujours;
  const config = useMemo<Config | null>(() => {
    if (!saison) return null;
    if (saison === 'ramadan') {
      const [w, h] = COMPAGNONS.tapis.vb;
      return { cle: 'tapis', svg: compagnonSvg('tapis', 'promeneur'), vb: [w, h], larg: 75, haut: 40, mode: 'tapis', son: sonHarpeEtoiles, theme: 'ramadan', label: 'Le tapis volant : touche-le pour un feu d\'artifice !', classe: 'tapis-promeneur' };
    }
    const o = OBJET_DE[saison];
    const d = OBJETS_SAISON[o.objet];
    return { cle: o.objet, svg: objetSvg(o.objet, `pr${o.objet}`), vb: d.vb, larg: d.larg, haut: d.haut, mode: o.mode, son: o.son, theme: saison, label: o.label, classe: `objet-promeneur objet-${o.objet}` };
  }, [saison]);
  if (!saison || !config || !bouge) return null;
  const reglage = saison === 'ramadan' ? r.ramadan.tapisPromeneur : r[saison].promeneur;
  if (reglage === false) return null;
  const son = saison === 'ramadan' ? r.ramadan.son : r[saison].son;
  // Durée du feu d'artifice et temps de retour : ceux réglés pour le tapis (Ramadan) servent pour toutes les saisons
  const duree = r.ramadan.dureeFeuArtifice || 5;
  const retour = Math.max(5, r.ramadan.tapisRetour || 15) * 1000;
  return <ObjetPromeneur key={config.cle} c={config} son={son !== false} duree={duree} retour={retour} />;
}

function ObjetPromeneur({ c, son, duree, retour }: { c: Config; son: boolean; duree: number; retour: number }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [feu, setFeu] = useState(0);
  const retourRef = useRef(retour);
  retourRef.current = retour;
  const { pathname } = useLocation();
  const { cle, larg: LARG, haut: HAUT, mode } = c;

  // 🏠 Retour sur l'accueil : il réapparaît tout de suite, à la hauteur de l'écran, en entrant par un côté
  useEffect(() => {
    const etat = etats[cle];
    if (pathname !== '/' || !etat) return;
    const { W } = dimensions();
    const gauche = Math.random() < 0.5;
    Object.assign(etat, { x: gauche ? -LARG - 10 : W + 10, y: window.scrollY + window.innerHeight * (0.25 + Math.random() * 0.4), ang: gauche ? 0 : Math.PI, sortie: false, vite: 1, reste: 3 + Math.floor(Math.random() * 3), retour: performance.now() + 1500 });
    cibleAuHasard(etat, LARG, HAUT);
    etat.cy = window.scrollY + window.innerHeight * (0.2 + Math.random() * 0.5);
  }, [pathname, cle, LARG, HAUT]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!etats[cle]) {
      // 1ʳᵉ apparition : il arrive par un côté, un peu plus bas que le haut de l'écran
      const { W } = dimensions();
      const gauche = Math.random() < 0.5;
      etats[cle] = { x: gauche ? -LARG - 10 : W + 10, y: window.scrollY + window.innerHeight * (0.3 + Math.random() * 0.4), ang: gauche ? 0 : Math.PI, cx: 0, cy: 0, reste: 3 + Math.floor(Math.random() * 4), sortie: false, retour: performance.now() + 1500, vite: 1 };
      cibleAuHasard(etats[cle], LARG, HAUT);
    }
    let raf = 0;
    let avant = performance.now();
    const tour = (now: number) => {
      raf = requestAnimationFrame(tour);
      const dt = Math.min(0.05, (now - avant) / 1000);
      avant = now;
      const e = etats[cle];
      if (document.hidden || !e) return;
      // Parti se promener ailleurs : invisible jusqu'à son retour
      if (now < e.retour) { el.style.visibility = 'hidden'; return; }
      el.style.visibility = 'visible';
      const { W, H } = dimensions();
      // Il tourne doucement vers son prochain point (courbes), puis avance
      const voulu = Math.atan2(e.cy - e.y, e.cx - e.x);
      let diff = voulu - e.ang;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      const virage = VIRAGE * (e.sortie ? 1.8 : 1) * dt;
      e.ang += Math.max(-virage, Math.min(virage, diff));
      const v = VITESSE * e.vite;
      e.x += Math.cos(e.ang) * v * dt;
      e.y += Math.sin(e.ang) * v * dt;
      e.y = Math.max(40, Math.min(H - HAUT - 20, e.y));
      const loin = Math.hypot(e.cx - e.x, e.cy - e.y);
      if (e.sortie) {
        if (e.x < -LARG - 5 || e.x > W + 5) {
          // Sorti de l'écran : il revient plus tard, par un côté au hasard, à une autre hauteur de la page
          const gauche = Math.random() < 0.5;
          e.retour = now + retourRef.current;
          e.x = gauche ? -LARG - 10 : W + 10;
          e.ang = gauche ? 0 : Math.PI;
          e.y = 70 + Math.random() * Math.max(20, H - 200);
          e.sortie = false; e.vite = 1; e.reste = 3 + Math.floor(Math.random() * 4);
          cibleAuHasard(e, LARG, HAUT);
        }
      } else if (loin < 30) {
        e.reste -= 1;
        if (e.reste <= 0) { e.sortie = true; e.cx = Math.cos(e.ang) >= 0 ? W + 200 : -LARG - 200; e.cy = e.y + (Math.random() - 0.5) * 120; }
        else cibleAuHasard(e, LARG, HAUT);
      }
      // Sa façon de bouger, selon l'objet ; il regarde dans le sens où il va
      const sens = Math.cos(e.ang) < 0 ? -1 : 1;
      const penche = Math.max(-18, Math.min(18, Math.sin(e.ang) * 22));
      const x = e.x.toFixed(1);
      let t: string;
      if (mode === 'sautille') {
        // ⛄ petits sauts, il s'écrase un tout petit peu en touchant « le sol »
        const s = Math.abs(Math.sin(now / 260));
        t = `translate(${x}px, ${(e.y - s * 10).toFixed(1)}px) scaleX(${sens}) scaleY(${(0.95 + s * 0.05).toFixed(3)}) rotate(${(Math.sin(now / 520) * 4).toFixed(1)}deg)`;
      } else if (mode === 'tournoie') {
        // 🍂 elle plane en se balançant et montre ses deux faces (pas de retournement brutal)
        const f = Math.cos(now / 650), face = Math.sign(f || 1) * Math.max(0.3, Math.abs(f));
        t = `translate(${x}px, ${(e.y + Math.sin(now / 800) * 6).toFixed(1)}px) rotate(${(Math.sin(now / 900) * 32 + penche).toFixed(1)}deg) scaleX(${face.toFixed(3)})`;
      } else if (mode === 'soleil') {
        // ☀️ il flotte doucement, ce sont ses rayons qui tournent (CSS)
        t = `translate(${x}px, ${(e.y + Math.sin(now / 900) * 5).toFixed(1)}px)`;
      } else if (mode === 'vole') {
        // 🐦 il vole en ondulant, le bec dans le sens du vol
        t = `translate(${x}px, ${(e.y + Math.sin(now / 380) * 6).toFixed(1)}px) scaleX(${sens}) rotate(${(penche * 0.6).toFixed(1)}deg)`;
      } else {
        // 🧞 le tapis flotte (léger haut-bas) et penche le nez dans les descentes
        t = `translate(${x}px, ${(e.y + Math.sin(now / 650) * 4).toFixed(1)}px) scaleX(${sens}) rotate(${penche.toFixed(1)}deg)`;
      }
      el.style.transform = t;
    };
    raf = requestAnimationFrame(tour);
    return () => cancelAnimationFrame(raf);
  }, [cle, LARG, HAUT, mode]);

  const toucher = () => {
    setFeu((n) => n + 1);
    if (son) c.son();
    // Il s'en va en vitesse après son feu d'artifice
    const e = etats[cle];
    if (e) { e.sortie = true; e.vite = 3; e.cx = Math.cos(e.ang) >= 0 ? dimensions().W + 200 : -LARG - 200; e.cy = e.y - 60; }
  };

  const [w, h] = c.vb;
  return createPortal(
    <>
      <div className="pointer-events-none absolute left-0 top-0 z-[35] h-0 w-0">
        <button ref={ref} type="button" onClick={toucher} aria-label={c.label}
          className={`${c.classe} pointer-events-auto absolute left-0 top-0 outline-none [-webkit-tap-highlight-color:transparent]`}
          style={{ width: LARG, height: HAUT, visibility: 'hidden' }}>
          <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full overflow-visible" aria-hidden dangerouslySetInnerHTML={{ __html: c.svg }} />
        </button>
      </div>
      {feu > 0 && <FeuArtificeDore key={feu} duree={duree} theme={c.theme} onFin={() => setFeu(0)} />}
    </>,
    document.body,
  );
}
