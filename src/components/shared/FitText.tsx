import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Libellé court sur UNE ligne qui ne se coupe jamais (ni « … », ni césure) :
 * si le mot ne tient pas dans la place disponible (petit téléphone, beaucoup d'icônes),
 * la taille du texte diminue toute seule par petits pas jusqu'à ce qu'il tienne entier.
 * Utilisé pour les libellés des barres d'icônes (haut et bas).
 */
export function FitText({ children, className = "", style, min = 6 }: {
  children: ReactNode; className?: string; style?: CSSProperties; min?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "";
      let size = parseFloat(getComputedStyle(el).fontSize) || 10;
      let guard = 0;
      while (el.scrollWidth > el.clientWidth + 0.5 && size > min && guard < 30) {
        size -= 0.25;
        el.style.fontSize = `${size}px`;
        guard++;
      }
    };
    fit();
    // On ne recalcule que si la LARGEUR disponible change (évite une boucle de recalculs)
    let lastWidth = (el.parentElement ?? el).clientWidth;
    const ro = new ResizeObserver(() => {
      const w = (el.parentElement ?? el).clientWidth;
      if (w !== lastWidth) { lastWidth = w; fit(); }
    });
    ro.observe(el.parentElement ?? el);
    return () => ro.disconnect();
  }, [children, min]);
  return (
    <span ref={ref} className={`block max-w-full whitespace-nowrap overflow-hidden text-center ${className}`} style={style}>
      {children}
    </span>
  );
}
