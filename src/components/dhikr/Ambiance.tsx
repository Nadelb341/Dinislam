import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * 🌅 Les couleurs de la carte Dhikr.
 * 27/11 (2ᵉ demande de Nadia) : UN SEUL fond, une scène « réelle » (ciel rose-doré, mosquée blanche, lanternes, fleurs, lac),
 * fichier `public/images/dhikr/fond-dhikr.jpg` fourni par Nadia, AVEC son bandeau « Dhikr / Se souvenir d'Allah… » (27/11 au soir :
 * « je le trouve joli », on le garde) : image FIXE sur tout l'écran (voir `FondDhikr`), la page ne réécrit pas son titre.
 * Tant que le fichier n'existe pas :
 * un dégradé doux ciel rose-doré (PAS de mosquée / lanternes / fleurs dessinées : Nadia ne les aime pas).
 * Le jour où le fichier est posé dans `public/images/dhikr/`, il s'affiche tout seul à la mise en ligne suivante
 * (`__FOND_DHIKR__`, écrit par vite.config.ts : vide si le fichier manque → aucune demande inutile ; sinon sa taille,
 * qui change l'adresse quand l'image est remplacée). Fichier de public/ = gardé en mémoire hors ligne (pré-cache).
 * L'ancienne ambiance jour / couchant / nuit est remplacée par ce fond unique (textes foncés, lisibles partout).
 */
export type NomAmbiance = 'jour' | 'couchant' | 'nuit';
/** Moment de la journée (sert encore à la petite carte de l'accueil et aux réglages) */
export const ambianceDe = (d: Date): NomAmbiance => {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 6.5 && h < 17) return 'jour';
  if (h >= 17 && h < 19.5) return 'couchant';
  return 'nuit';
};

export interface Couleurs { nom: NomAmbiance; texte: string; doux: string; or: string; voile: string; bord: string }
/** Palette unique « ciel rose-doré » : textes prune foncé, or soutenu (contraste vérifié sur le rose clair) */
export const COULEURS_DHIKR: Couleurs = { nom: 'jour', texte: '#2b1630', doux: '#5b3a52', or: '#8a5300', voile: 'rgba(255,250,244,.78)', bord: 'rgba(196,140,60,.35)' };
export const COULEURS: Record<NomAmbiance, Couleurs> = { jour: COULEURS_DHIKR, couchant: COULEURS_DHIKR, nuit: COULEURS_DHIKR };

export function useAmbiance(): Couleurs {
  return COULEURS_DHIKR;
}

declare const __FOND_DHIKR__: string | undefined;
/** Version de l'image de fond (vide = pas d'image : le dégradé seul) */
const VERSION_FOND = typeof __FOND_DHIKR__ === 'string' ? __FOND_DHIKR__ : '';
export const IMAGE_FOND_DHIKR = VERSION_FOND ? `/images/dhikr/fond-dhikr.jpg?v=${VERSION_FOND}` : null;
/** Taille de l'image de Nadia (px) et bas de son bandeau « Dhikr / Se souvenir d'Allah… » */
const IMG_L = 976, IMG_H = 1110, BAS_BANDEAU = 222;
/** Dégradé doux ciel rose-doré (sans image, ou le temps qu'elle arrive) */
export const DEGRADE_DHIKR = 'linear-gradient(180deg, #fde3d3 0%, #f9cfc4 22%, #f6c7a9 45%, #f8dcae 70%, #fff3df 100%)';

/** Bas de l'en-tête de l'appli (fixe en haut) : l'image commence juste en dessous */
function useBasEntete(): number {
  const [bas, setBas] = useState(56);
  useEffect(() => {
    const mesurer = () => {
      const e = document.querySelector('header');
      if (e) setBas(Math.max(0, Math.round(e.getBoundingClientRect().bottom)));
    };
    mesurer();
    const e = document.querySelector('header');
    const ro = typeof ResizeObserver !== 'undefined' && e ? new ResizeObserver(mesurer) : null;
    if (ro && e) ro.observe(e);
    window.addEventListener('resize', mesurer);
    window.addEventListener('scroll', mesurer, { passive: true });
    return () => { ro?.disconnect(); window.removeEventListener('resize', mesurer); window.removeEventListener('scroll', mesurer); };
  }, []);
  return bas;
}

/**
 * Le grand fond de la carte (27/11 soir, Nadia : « que l'image englobe toute la page », plus de bleu en haut ni en bas) :
 * l'image est FIXE sur tout l'écran, sous l'en-tête (`cover`, jamais étirée de travers : elle garde ses proportions, seuls les
 * bords sont coupés selon l'écran) ; le contenu défile par-dessus. Un bloc vide garde la place de son bandeau dessiné, pour que
 * les onglets commencent juste en dessous. La page doit utiliser `<AppLayout sansFondEcran>` (sinon le fond bleu de l'appli
 * recouvre l'image). Sans image : le dégradé, comme avant.
 */
export function FondDhikr({ ambiance, children, className }: { ambiance: Couleurs; children: ReactNode; className?: string }) {
  const haut = useBasEntete();
  const bloc = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState(0);
  useEffect(() => {
    if (!IMAGE_FOND_DHIKR) return;
    const calculer = () => {
      const el = bloc.current;
      if (!el) return;
      const menuBas = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--menu-bas')) || 0;
      const l = document.documentElement.clientWidth, h = window.innerHeight - haut - menuBas;
      const echelle = Math.max(l / IMG_L, h / IMG_H);
      const basBandeau = haut + BAS_BANDEAU * echelle;              // dans l'écran (l'image ne bouge pas)
      const hautBloc = el.getBoundingClientRect().top + window.scrollY; // dans la page, défilement remis à zéro
      setPlace(Math.max(0, Math.round(basBandeau - hautBloc)));
    };
    calculer();
    // le menu du bas mesure sa hauteur juste après l'affichage : on recalcule un peu plus tard
    const t = window.setTimeout(calculer, 400);
    window.addEventListener('resize', calculer);
    return () => { window.clearTimeout(t); window.removeEventListener('resize', calculer); };
  }, [haut]);

  if (!IMAGE_FOND_DHIKR) {
    return (
      <div className={cn('relative overflow-hidden', className)} style={{ background: DEGRADE_DHIKR, color: ambiance.texte }}>
        <div className="absolute inset-x-0 top-0 h-48 pointer-events-none" aria-hidden style={{ background: 'radial-gradient(60% 100% at 70% 0%, rgba(255,214,150,.45), rgba(255,214,150,0))' }} />
        <div className="relative">{children}</div>
      </div>
    );
  }
  return (
    <div className={cn('relative', className)} style={{ color: ambiance.texte }}>
      {/* 28/11 (Nadia) : le bas de l'image s'arrête juste au-dessus de la barre des matières (--menu-bas) */}
      <div aria-hidden className="fixed inset-x-0 -z-10 pointer-events-none"
        style={{ top: haut, bottom: 'var(--menu-bas, 0px)', backgroundColor: '#f4cfa9', backgroundImage: `url("${IMAGE_FOND_DHIKR}")`, backgroundSize: 'cover', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat' }} />
      {/* La place du bandeau dessiné dans l'image (la page ne réécrit pas son titre) */}
      <div ref={bloc} aria-hidden style={{ height: place }} />
      {children}
    </div>
  );
}

/** Les petites animations de la carte (étoiles qui scintillent, étoiles dorées de la fin, perle qui brille) */
export function StylesDhikr() {
  return (
    <style>{`
      @keyframes dhk-scintille { 0%,100% { opacity: .25 } 50% { opacity: 1 } }
      .dhk-scintille { animation: dhk-scintille 3.2s ease-in-out infinite; }
      @keyframes dhk-etoile { 0% { transform: translateY(8px) scale(.4) rotate(0); opacity: 0 } 30% { opacity: 1 } 100% { transform: translateY(-46px) scale(1) rotate(40deg); opacity: 0 } }
      .dhk-etoile { animation: dhk-etoile 2.4s ease-out infinite; }
      @keyframes dhk-halo { 0%,100% { opacity: .4 } 50% { opacity: .95 } }
      .dhk-halo { animation: dhk-halo 2s ease-in-out infinite; }
      @keyframes dhk-apparait { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
      .dhk-apparait { animation: dhk-apparait .35s ease-out both; }
      /* Compteur au centre du cercle : la taille suit la largeur du cercle (cqw) ; vieux navigateurs = tailles fixes */
      .dhk-cercle { container-type: inline-size; }
      .dhk-num { font-size: 3rem; font-size: 19cqw; }
      .dhk-num-long { font-size: 2.4rem; font-size: 14.5cqw; }
      .dhk-sur { font-size: 1.5rem; font-size: 9cqw; }
      .dhk-tour { font-size: .8rem; font-size: max(.65rem, 4.6cqw); }
      .dhk-fois { font-size: .7rem; font-size: max(.6rem, 3.8cqw); }
      @keyframes dhk-perle { 0%,100% { transform: scale(1) } 50% { transform: scale(1.07) } }
      .dhk-perle-active { animation: dhk-perle 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      @keyframes dhk-message { from { opacity: 0; transform: translateY(14px) scale(.97) } to { opacity: 1; transform: none } }
      .dhk-message { animation: dhk-message .35s ease-out both; }
      @media (prefers-reduced-motion: reduce) { .dhk-scintille, .dhk-etoile, .dhk-halo, .dhk-apparait, .dhk-perle-active, .dhk-message { animation: none !important; } }
    `}</style>
  );
}
