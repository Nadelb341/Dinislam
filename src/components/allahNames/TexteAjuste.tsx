import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';

/**
 * Texte qui peut passer à la ligne ENTRE les mots, mais dont aucun mot n'est jamais coupé :
 * si le mot le plus long ne tient pas dans la largeur de la tuile, la taille diminue doucement jusqu'à ce qu'il tienne.
 * (FitText fait la même chose sur UNE seule ligne ; ici plusieurs lignes sont permises, ex. « Dhoul-Jalâl wal-Ikrâm ».)
 */
export function TexteAjuste({ children, taille, min = 12, className = '', style, dir, lang }: {
  children: ReactNode; taille: number; min?: number; className?: string; style?: CSSProperties; dir?: 'rtl' | 'ltr'; lang?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ajuster = () => {
      let t = taille;
      el.style.fontSize = `${t}px`;
      let garde = 0;
      // Un mot trop long déborde sur le côté (overflow-wrap: normal) : on réduit jusqu'à ce qu'il tienne
      while (el.scrollWidth > el.clientWidth + 0.5 && t > min && garde < 60) {
        t -= 1;
        el.style.fontSize = `${t}px`;
        garde++;
      }
    };
    ajuster();
    let largeur = el.clientWidth;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
      if (el.clientWidth !== largeur) { largeur = el.clientWidth; ajuster(); }
    }) : null;
    ro?.observe(el);
    // Les polices arabes arrivent parfois après le premier affichage : on réajuste une fois chargées
    let annule = false;
    document.fonts?.ready?.then(() => { if (!annule) ajuster(); }, () => {});
    return () => { annule = true; ro?.disconnect(); };
  }, [children, taille, min]);
  return (
    <p ref={ref} dir={dir} lang={lang} className={`w-full max-w-full overflow-hidden text-center ${className}`}
      style={{ fontSize: taille, overflowWrap: 'normal', wordBreak: 'normal', hyphens: 'none', WebkitHyphens: 'none', ...style }}>
      {children}
    </p>
  );
}
