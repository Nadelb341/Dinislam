import { useLocation } from 'react-router-dom';
import { useSaisonActive, type Saison } from '@/lib/saisons';

/**
 * 🍂 Petit décor dans les pages (Nadia, 2026-11-12 : « ok mais pas trop chargé ») : sur toutes les pages SAUF l'accueil
 * (qui a déjà son grand décor), 5 éléments de la saison qui tombent lentement, très légers, et un petit brin en haut à droite.
 * Rien de cliquable (ne gêne jamais), même décor pour tout le monde. Réglage : Décorations des saisons › « Petit décor dans les pages ».
 */
const ELEMENTS: Record<Saison, string[]> = {
  automne: ['🍂', '🍁', '🍂', '🍁', '🍂'],
  hiver: ['❄️', '❄️', '❄️', '❄️', '❄️'],
  printemps: ['🌸', '🌼', '🌸', '🌸', '🌼'],
  ete: ['☀️', '🐚', '🫧', '🐚', '🫧'],
};
const BRIN: Record<Saison, string> = { automne: '🍁🍂', hiver: '❄️⛄', printemps: '🌸🌿', ete: '🐚🌊' };

export function DecorPages() {
  const { pathname } = useLocation();
  const { saison, r } = useSaisonActive();
  if (!saison || pathname === '/' || r.decorPages === false) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
      <span className="absolute right-2 top-16 text-xl opacity-70 rotate-12">{BRIN[saison]}</span>
      {ELEMENTS[saison].map((e, i) => (
        <span key={i} className="decor-page absolute text-base opacity-40"
          style={{ left: `${8 + i * 21}%`, animationDelay: `${i * 4.2}s`, animationDuration: `${17 + (i % 3) * 4}s` }}>{e}</span>
      ))}
    </div>
  );
}
