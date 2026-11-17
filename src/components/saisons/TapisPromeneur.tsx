import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useSaisonActive } from '@/lib/saisons';
import { sonTintement } from '@/lib/sonSaison';
import { COMPAGNONS, compagnonSvg } from './dessinsRamadan';
import { FeuArtificeDore } from './FeuArtificeDore';

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
 * Seul le tapis se touche (le reste de l'écran reste cliquable). Réglages : Décorations des saisons › Ramadan.
 */
type Etat = { x: number; y: number; ang: number; cx: number; cy: number; reste: number; sortie: boolean; retour: number; vite: number };
let etat: Etat | null = null;
const LARG = 75, HAUT = 40;
const VITESSE = 38; // px par seconde : lent, comme une promenade
const VIRAGE = 1.1; // radians par seconde : de belles courbes, pas de zigzag

/** Hauteur de la page (sans le tapis lui-même, pour ne jamais l'agrandir) */
function dimensions() {
  const racine = document.getElementById('root');
  return { W: document.documentElement.clientWidth, H: Math.max(racine?.offsetHeight ?? 0, window.innerHeight) };
}
function cibleAuHasard(e: Etat) {
  const { W, H } = dimensions();
  e.cx = 10 + Math.random() * Math.max(10, W - LARG - 20);
  e.cy = 70 + Math.random() * Math.max(20, H - 70 - HAUT - 90);
}

export function TapisPromeneur() {
  const { saison, r } = useSaisonActive();
  const reduit = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const actif = saison === 'ramadan' && r.ramadan.tapisPromeneur !== false && (!reduit || r.animerToujours);
  const svg = useMemo(() => compagnonSvg('tapis', 'promeneur'), []);
  const ref = useRef<HTMLButtonElement>(null);
  const [feu, setFeu] = useState(0);
  const son = r.ramadan.son;
  const duree = r.ramadan.dureeFeuArtifice || 5;
  const retour = Math.max(5, r.ramadan.tapisRetour || 15) * 1000;
  const retourRef = useRef(retour);
  retourRef.current = retour;
  const { pathname } = useLocation();

  // 🏠 Retour sur l'accueil : il réapparaît tout de suite, à la hauteur de l'écran, en entrant par un côté
  useEffect(() => {
    if (!actif || pathname !== '/' || !etat) return;
    const { W } = dimensions();
    const gauche = Math.random() < 0.5;
    Object.assign(etat, { x: gauche ? -LARG - 10 : W + 10, y: window.scrollY + window.innerHeight * (0.25 + Math.random() * 0.4), ang: gauche ? 0 : Math.PI, sortie: false, vite: 1, reste: 3 + Math.floor(Math.random() * 3), retour: performance.now() + 1500 });
    cibleAuHasard(etat);
    etat.cy = window.scrollY + window.innerHeight * (0.2 + Math.random() * 0.5);
  }, [pathname, actif]);

  useEffect(() => {
    if (!actif) return;
    const el = ref.current;
    if (!el) return;
    if (!etat) {
      // 1ʳᵉ apparition : il arrive par un côté, un peu plus bas que le haut de l'écran
      const { W } = dimensions();
      const gauche = Math.random() < 0.5;
      etat = { x: gauche ? -LARG - 10 : W + 10, y: window.scrollY + window.innerHeight * (0.3 + Math.random() * 0.4), ang: gauche ? 0 : Math.PI, cx: 0, cy: 0, reste: 3 + Math.floor(Math.random() * 4), sortie: false, retour: performance.now() + 1500, vite: 1 };
      cibleAuHasard(etat);
    }
    let raf = 0;
    let avant = performance.now();
    const tour = (now: number) => {
      raf = requestAnimationFrame(tour);
      const dt = Math.min(0.05, (now - avant) / 1000);
      avant = now;
      const e = etat!;
      if (document.hidden) return;
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
          // Sorti de l'écran : il revient dans 20 à 60 s, par un côté au hasard, à une autre hauteur de la page
          const gauche = Math.random() < 0.5;
          e.retour = now + retourRef.current;
          e.x = gauche ? -LARG - 10 : W + 10;
          e.ang = gauche ? 0 : Math.PI;
          e.y = 70 + Math.random() * Math.max(20, H - 200);
          e.sortie = false; e.vite = 1; e.reste = 3 + Math.floor(Math.random() * 4);
          cibleAuHasard(e);
        }
      } else if (loin < 30) {
        e.reste -= 1;
        if (e.reste <= 0) { e.sortie = true; e.cx = Math.cos(e.ang) >= 0 ? W + 200 : -LARG - 200; e.cy = e.y + (Math.random() - 0.5) * 120; }
        else cibleAuHasard(e);
      }
      // Il flotte (léger haut-bas), penche le nez dans les descentes, et regarde dans le sens où il va
      const flotte = Math.sin(now / 650) * 4;
      const sens = Math.cos(e.ang) < 0 ? -1 : 1;
      const penche = Math.max(-18, Math.min(18, (Math.sin(e.ang) * 22)));
      el.style.transform = `translate(${e.x.toFixed(1)}px, ${(e.y + flotte).toFixed(1)}px) scaleX(${sens}) rotate(${penche.toFixed(1)}deg)`;
    };
    raf = requestAnimationFrame(tour);
    return () => cancelAnimationFrame(raf);
  }, [actif]);

  const toucher = () => {
    setFeu((n) => n + 1);
    if (son) sonTintement();
    // Il s'en va en vitesse après son feu d'artifice
    if (etat) { etat.sortie = true; etat.vite = 3; etat.cx = Math.cos(etat.ang) >= 0 ? dimensions().W + 200 : -LARG - 200; etat.cy = etat.y - 60; }
  };

  if (!actif) return null;
  const [w, h] = COMPAGNONS.tapis.vb;
  return createPortal(
    <>
      <div className="pointer-events-none absolute left-0 top-0 z-[35] h-0 w-0">
        <button ref={ref} type="button" onClick={toucher} aria-label="Le tapis volant : touche-le pour un feu d'artifice !"
          className="tapis-promeneur pointer-events-auto absolute left-0 top-0 outline-none [-webkit-tap-highlight-color:transparent]"
          style={{ width: LARG, height: HAUT, visibility: 'hidden' }}>
          <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full overflow-visible" aria-hidden dangerouslySetInnerHTML={{ __html: svg }} />
        </button>
      </div>
      {feu > 0 && <FeuArtificeDore key={feu} duree={duree} onFin={() => setFeu(0)} />}
    </>,
    document.body,
  );
}
