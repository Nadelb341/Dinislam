import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';

/**
 * 🍂 Fond de TOUT l'accueil en automne (Nadia, 28/11, choix A) : son image (jour, ou nuit du Maghrib au Fajr), avec la carte
 * « Dhikr du jour » dessinée VIDE. La vraie carte (chapelet, dhikr du jour, bouton) est placée tout en haut de l'accueil et
 * l'image est calée pour que la carte dessinée soit exactement derrière elle ; l'image défile AVEC la page (sinon la carte
 * dessinée vide apparaîtrait derrière le contenu). Sous l'image : sa couleur du bas.
 * Posée dans <body> (portail) derrière toute l'appli ; la page passe `sansFondEcran` à AppLayout (plus le fond bleu).
 * Les classes `fond-actif` / `fond-nuit` sont mises comme pour les fonds d'écran (cartes en verre, textes adaptés la nuit).
 */
export interface ImageFondAccueil {
  url: string;
  /** Haut de la carte dessinée, en % de la largeur de l'image */
  haut: number;
  /** Hauteur de la carte dessinée, en % de la largeur de l'image */
  hauteur: number;
  /** Largeur / hauteur de l'image */
  ratio: number;
  /** Couleur du ciel (au-dessus) et du bas (sous l'image) */
  ciel: string;
  bas: string;
  nuit: boolean;
}

export const FONDS_ACCUEIL_AUTOMNE: Record<'jour' | 'nuit', ImageFondAccueil> = {
  jour: { url: '/images/accueil/automne-dhikr.jpg', haut: 39.6, hauteur: 26.6, ratio: 788 / 1110, ciel: '#e9c3cf', bas: '#f1c9b3', nuit: false },
  nuit: { url: '/images/accueil/automne-dhikr-nuit.jpg', haut: 43.8, hauteur: 28.8, ratio: 788 / 1110, ciel: '#151c4f', bas: '#1a2150', nuit: true },
};

export function FondAccueil({ fond, carte, marge, setMarge }: {
  fond: ImageFondAccueil;
  /** La vraie carte « Dhikr du jour » (son bord du haut) */
  carte: RefObject<HTMLElement | null>;
  marge: number;
  setMarge: (n: number) => void;
}) {
  const [place, setPlace] = useState({ haut: 0, decalage: 0, hauteur: 0 });

  // Classes des fonds d'écran (cartes en verre ; textes clairs la nuit)
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('fond-actif');
    html.classList.toggle('fond-nuit', fond.nuit);
    return () => { html.classList.remove('fond-actif', 'fond-nuit'); };
  }, [fond.nuit]);

  useLayoutEffect(() => {
    const calculer = () => {
      const el = carte.current;
      if (!el) return;
      const L = document.documentElement.clientWidth;
      const entete = document.querySelector('header');
      const basEntete = entete ? entete.getBoundingClientRect().bottom + window.scrollY : 56;
      const hautCarte = el.getBoundingClientRect().top + window.scrollY;     // avec la marge actuelle
      const naturel = hautCarte - marge;                                     // sans marge
      // distance haut de l'image → bord du haut de la carte dessinée, moins les 12 px (mt-3) entre le bloc et la vraie carte
      const carteDessinee = (fond.haut / 100) * L - 12;
      // Si le titre est plus court que le ciel de l'image : marge au-dessus de la carte ; sinon l'image descend
      const nouvelleMarge = Math.max(0, Math.round(basEntete + carteDessinee - naturel));
      if (nouvelleMarge !== marge) { setMarge(nouvelleMarge); return; }
      const hautImage = naturel + nouvelleMarge - carteDessinee;             // ≥ bas de l'en-tête
      const total = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      setPlace({ haut: basEntete, decalage: Math.max(0, Math.round(hautImage - basEntete)), hauteur: Math.max(0, total - basEntete) });
    };
    calculer();
    const t = window.setTimeout(calculer, 500);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(calculer) : null;
    ro?.observe(document.body);
    window.addEventListener('resize', calculer);
    return () => { window.clearTimeout(t); ro?.disconnect(); window.removeEventListener('resize', calculer); };
  }, [carte, fond.haut, marge, setMarge]);

  return createPortal(
    <div aria-hidden className="pointer-events-none" style={{
      position: 'absolute', left: 0, right: 0, top: place.haut, height: place.hauteur, zIndex: -10,
      backgroundColor: fond.bas,
      backgroundImage: `url("${fond.url}"), linear-gradient(${fond.ciel}, ${fond.ciel})`,
      backgroundSize: `100% auto, 100% ${place.decalage + 2}px`,
      backgroundPosition: `center ${place.decalage}px, center top`,
      backgroundRepeat: 'no-repeat, no-repeat',
    }} />,
    document.body,
  );
}
