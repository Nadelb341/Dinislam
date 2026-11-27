import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * 🌅 Les couleurs de la carte Dhikr.
 * 27/11 (2ᵉ demande de Nadia) : UN SEUL fond, une scène « réelle » (ciel rose-doré, mosquée blanche, lanternes, fleurs, lac),
 * fichier `public/images/dhikr/fond-dhikr.jpg` fourni par Nadia, AVEC son bandeau « Dhikr / Se souvenir d'Allah… » (27/11 au soir :
 * « je le trouve joli », on le garde) : l'image est posée en haut, en largeur (jamais coupée en hauteur), et la page ne
 * réécrit pas son titre (bloc vide `976/215` à la place du bandeau). Tant que le fichier n'existe pas :
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
/** Sur téléphone, l'image garde au moins cette largeur (bords coupés) pour que le bandeau « Dhikr » reste lisible */
const LARGEUR_MIN_FOND = 560;
/** Dégradé doux ciel rose-doré (aussi sous l'image, le temps qu'elle arrive) */
export const DEGRADE_DHIKR = 'linear-gradient(180deg, #fde3d3 0%, #f9cfc4 22%, #f6c7a9 45%, #f8dcae 70%, #fff3df 100%)';

/** Le grand fond de la carte : l'image en haut, en pleine largeur, fondue vers le crème en bas ; sinon le dégradé */
export function FondDhikr({ ambiance, children, className }: { ambiance: Couleurs; children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden', className)} style={{ background: IMAGE_FOND_DHIKR ? '#fff3df' : DEGRADE_DHIKR, color: ambiance.texte }}>
      {IMAGE_FOND_DHIKR && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden
          style={{ backgroundImage: `url("${IMAGE_FOND_DHIKR}")`, backgroundSize: `max(100%, ${LARGEUR_MIN_FOND}px) auto`, backgroundPosition: 'center top', backgroundRepeat: 'no-repeat' }} />
      )}
      {/* Fondu du bas de l'image vers le dégradé (pages plus longues que l'image) */}
      {IMAGE_FOND_DHIKR && (
        <div className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none" aria-hidden
          style={{ width: `max(100%, ${LARGEUR_MIN_FOND}px)`, aspectRatio: '976 / 1110', background: 'linear-gradient(180deg, rgba(255,243,223,0) 82%, #fff3df 100%)' }} />
      )}
      {/* Petit halo doré en haut, très doux (comme le soleil couchant de la scène) */}
      {!IMAGE_FOND_DHIKR && <div className="absolute inset-x-0 top-0 h-48 pointer-events-none" aria-hidden style={{ background: 'radial-gradient(60% 100% at 70% 0%, rgba(255,214,150,.45), rgba(255,214,150,0))' }} />}
      <div className="relative">
        {/* L'image a son propre bandeau « Dhikr » (voulu par Nadia, 27/11) : on laisse sa place, la page n'écrit pas de 2ᵉ titre */}
        {IMAGE_FOND_DHIKR && <div aria-hidden className="relative left-1/2 -translate-x-1/2" style={{ width: `max(100%, ${LARGEUR_MIN_FOND}px)`, aspectRatio: '976 / 215' }} />}
        {children}
      </div>
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
      .dhk-tour { font-size: .8rem; font-size: 4.6cqw; }
      .dhk-fois { font-size: .7rem; font-size: 3.8cqw; }
      @keyframes dhk-perle { 0%,100% { transform: scale(1) } 50% { transform: scale(1.07) } }
      .dhk-perle-active { animation: dhk-perle 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      @keyframes dhk-message { from { opacity: 0; transform: translateY(14px) scale(.97) } to { opacity: 1; transform: none } }
      .dhk-message { animation: dhk-message .35s ease-out both; }
      @media (prefers-reduced-motion: reduce) { .dhk-scintille, .dhk-etoile, .dhk-halo, .dhk-apparait, .dhk-perle-active, .dhk-message { animation: none !important; } }
    `}</style>
  );
}
