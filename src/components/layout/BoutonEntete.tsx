import { forwardRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { lecteurSon } from '@/lib/sonSaison';

/**
 * 🎛️ Icônes de l'en-tête en « boutons de jeu » (choix de Nadia du 2026-11-18, modèle 1 « Bille bleue et anneau doré »
 * de la page de choix) : bille bleue bombée avec reflet, anneau or et cuivre, pictogramme doré.
 * Idées gardées : 1 petit rebond au toucher, 2 « clic » très doux, 3 compteurs rouges brillants, 4 « Actualiser » qui tourne.
 * Tout le style est ici et dans index.css (`.bouton-entete`) : pour revenir à l'ancien en-tête, mettre STYLE_JEU à false.
 */
export const STYLE_JEU = true;

/** « Clic » très doux et très court (synthèse, aucun fichier), seulement après un vrai toucher */
function clicDoux() {
  const c = lecteurSon(); if (!c) return;
  try {
    const t0 = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(1150, t0); o.frequency.exponentialRampToValueAtTime(620, t0 + 0.05);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);
    o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + 0.08);
  } catch { /* pas de son possible */ }
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icone: ReactNode;
  /** Compteur brillant (rouge par défaut) ; 0 ou absent = rien */
  compteur?: number;
  couleurCompteur?: 'rouge' | 'orange';
  /** Pastille verte ✓ (bouclier : rien à faire) */
  ok?: boolean;
  /** Le pictogramme fait un tour complet au toucher (Actualiser) */
  tourne?: boolean;
  children?: ReactNode;
};

export const BoutonEntete = forwardRef<HTMLButtonElement, Props>(function BoutonEntete(
  { icone, compteur, couleurCompteur = 'rouge', ok, tourne, className, onClick, children, ...rest }, ref,
) {
  const [anim, setAnim] = useState(0);
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      onClick={(e) => { clicDoux(); setAnim((n) => n + 1); onClick?.(e); }}
      className={cn('bouton-entete', !STYLE_JEU && 'bouton-entete-simple', className)}
    >
      <span key={anim} className={cn('bille', anim > 0 && 'rebond', anim > 0 && tourne && 'tourne')}>{icone}</span>
      {compteur != null && compteur > 0 ? (
        <span className={cn('pastille-entete', couleurCompteur === 'orange' && 'orange')}>{compteur > 9 ? '9+' : compteur}</span>
      ) : ok ? (
        <span className="pastille-entete vert" aria-hidden>✓</span>
      ) : null}
      {children}
    </button>
  );
});
