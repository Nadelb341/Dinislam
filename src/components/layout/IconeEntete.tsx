import { forwardRef, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Settings, UsersRound, Mail, Trophy, CalendarCheck, BarChart3, Shield, RotateCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { sonClicEntete } from '@/lib/sonSaison';

/**
 * 🎛️ Icônes de l'en-tête (choix de Nadia, 2026-11-19) : modèle 3 « Applis d'iPhone » (carrés très arrondis, dégradé
 * vertical, une couleur par icône, pictogramme blanc) + la LUEUR du modèle 10 (halo de la couleur de l'icône).
 * Idées gardées : rebond au toucher, clic doux, Actualiser qui tourne, compteurs brillants (`.pastille-brillante`).
 * Zoom garde son logo d'origine (pas de bouton ici).
 * ↩️ Pour revenir aux anciennes icônes blanches : mettre STYLE_APPLI à false.
 */
export const STYLE_APPLI = true;

export type NomIcone = 'reglages' | 'comptes' | 'messages' | 'classement' | 'presence' | 'suivi' | 'bouclier' | 'actualiser' | 'accueil';

// Palette « bijoux » du modèle 3, dans l'ordre de la barre
const COULEUR: Record<NomIcone, string> = {
  reglages: '#10b981', comptes: '#f97316', messages: '#3b82f6', classement: '#eab308', presence: '#e11d48',
  suivi: '#8b5cf6', bouclier: '#dc2626', actualiser: '#06b6d4', accueil: '#6366f1',
};

// Pictogrammes blancs du modèle 3 (trait, viewBox 24)
const DESSIN: Record<NomIcone, ReactNode> = {
  reglages: <><circle cx="12" cy="12" r="3.2" /><path d="M12 3.5v2.3M12 18.2v2.3M3.5 12h2.3M18.2 12h2.3M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6" /><circle cx="12" cy="12" r="6.4" /></>,
  comptes: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19.5c0-3.3 2.7-5.6 6-5.6s6 2.3 6 5.6" /><circle cx="17" cy="9.3" r="2.4" /><path d="M16.3 13.8c2.6.3 4.7 2.3 4.7 5.2" /></>,
  messages: <><rect x="3.5" y="6" width="17" height="12.5" rx="2.6" /><path d="m4 7.5 8 5.8 8-5.8" /></>,
  classement: <><path d="M8 4.5h8v4.8a4 4 0 0 1-8 0z" /><path d="M8 6.5H5.3a2.8 2.8 0 0 0 3 3.6M16 6.5h2.7a2.8 2.8 0 0 1-3 3.6M12 13.3v3.4M9 19.8h6M10.2 16.7h3.6" /></>,
  presence: <><rect x="4" y="5.5" width="16" height="14.5" rx="2.6" /><path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" /><path d="m9 15 2 2 4-4" /></>,
  suivi: <path d="M6 19.5v-7M12 19.5V5.5M18 19.5v-10" />,
  bouclier: <path d="M12 3.5 5.5 6.3v4.9c0 4.3 2.8 7.6 6.5 9.3 3.7-1.7 6.5-5 6.5-9.3V6.3z" />,
  actualiser: <><path d="M19.5 11.5a7.5 7.5 0 1 1-2.2-5.3" /><path d="M19.5 4.5v5h-5" /></>,
  accueil: <><path d="M4.5 11.5 12 5l7.5 6.5" /><path d="M6.8 10v9.5h10.4V10" /><path d="M10.2 19.5v-4.8h3.6v4.8" /></>,
};

// Anciennes icônes (STYLE_APPLI = false)
const ANCIENNE: Record<NomIcone, typeof Home> = {
  reglages: Settings, comptes: UsersRound, messages: Mail, classement: Trophy, presence: CalendarCheck,
  suivi: BarChart3, bouclier: Shield, actualiser: RotateCw, accueil: Home,
};

const melange = (hex: string, vers: number, p: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (vers - v) * p));
  return `rgb(${c.join(',')})`;
};

/** Le petit carré coloré du modèle 3 */
function IconeAppli({ nom }: { nom: NomIcone }) {
  const c = COULEUR[nom];
  const id = `ie-${nom}`;
  return (
    <svg viewBox="0 0 48 48" className="icone-appli" aria-hidden style={{ ['--lueur' as string]: c }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={melange(c, 255, 0.25)} />
          <stop offset="1" stopColor={melange(c, 0, 0.18)} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="13" fill={`url(#${id})`} />
      <svg x="9.6" y="9.6" width="28.8" height="28.8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icone-dessin">
        {DESSIN[nom]}
      </svg>
    </svg>
  );
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { nom: NomIcone; children?: ReactNode };

/**
 * Un bouton de l'en-tête. Garde le comportement de l'ancien `<Button variant="ghost" size="icon">`
 * (taille fixée par le parent, `relative` pour les pastilles), ajoute rebond + clic doux.
 * Pour « Actualiser », la flèche tourne : le parent attend ~450 ms avant de recharger.
 */
export const BoutonEntete = forwardRef<HTMLButtonElement, Props>(function BoutonEntete({ nom, children, className, onClick, ...rest }, ref) {
  const icone = useRef<HTMLSpanElement>(null);
  if (!STYLE_APPLI) {
    const Ancienne = ANCIENNE[nom];
    return (
      <Button ref={ref} variant="ghost" size="icon" onClick={onClick} className={cn('relative text-primary-foreground hover:bg-primary-foreground/10', className)} {...rest}>
        <Ancienne className="h-5 w-5" />
        {children}
      </Button>
    );
  }
  return (
    <button
      ref={ref}
      type="button"
      className={cn('icone-entete', className)}
      onClick={(e) => {
        const el = icone.current;
        if (el) {
          el.classList.remove('rebond', 'tourne');
          void el.offsetWidth; // relance l'animation
          el.classList.add(nom === 'actualiser' ? 'tourne' : 'rebond');
        }
        sonClicEntete();
        onClick?.(e);
      }}
      {...rest}
    >
      <span ref={icone} className="icone-entete-corps"><IconeAppli nom={nom} /></span>
      {children}
    </button>
  );
});

/** Classe des pastilles (compteurs) en version brillante (sans effet si STYLE_APPLI = false : classe simplement inutilisée) */
export const PASTILLE = 'pastille-brillante';
