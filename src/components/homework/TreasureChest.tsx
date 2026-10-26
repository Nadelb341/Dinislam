/**
 * 🎁 Coffre au trésor du chemin de la semaine (demande de Nadia, 2026-10-26) :
 * fermé (bois, ferrures dorées, cadenas) tant qu'il n'est pas ouvert ; ouvert et rempli d'or qui scintille ensuite,
 * pour que l'enfant voie qu'il l'a déjà ouvert. Dessin en SVG : léger, net sur tous les écrans.
 */
import { useId } from 'react';

export function TreasureChest({ open, locked, className = 'h-14 w-14' }: { open: boolean; locked: boolean; className?: string }) {
  // Identifiants uniques : plusieurs coffres peuvent être affichés en même temps (chemin + fenêtre du trésor)
  const uid = useId().replace(/:/g, '');
  const wood = locked ? ['#7c6a58', '#4b3f34'] : ['#a0522d', '#5c2e12'];
  const gold = locked ? ['#b8ad8a', '#8a805f'] : ['#ffe27a', '#d99a06'];
  return (
    <svg viewBox="0 0 64 60" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`tc-wood-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={wood[0]} /><stop offset="1" stopColor={wood[1]} /></linearGradient>
        <linearGradient id={`tc-gold-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={gold[0]} /><stop offset="1" stopColor={gold[1]} /></linearGradient>
        <radialGradient id={`tc-glow-${uid}`} cx="50%" cy="55%" r="55%"><stop offset="0" stopColor="#fff3b0" stopOpacity=".95" /><stop offset="1" stopColor="#fff3b0" stopOpacity="0" /></radialGradient>
      </defs>
      {open ? (
        <>
          {/* Lueur dorée derrière le coffre */}
          <ellipse className="tresor-lueur" cx="32" cy="30" rx="30" ry="22" fill={`url(#tc-glow-${uid})`} />
          {/* Couvercle ouvert, basculé en arrière */}
          <path d="M10 22 L14 6 Q32 -1 50 6 L54 22 Z" fill={`url(#tc-wood-${uid})`} stroke="#3b1d0b" strokeWidth="1.2" />
          <path d="M12 16 L52 16" stroke={`url(#tc-gold-${uid})`} strokeWidth="3" />
          {/* Tas d'or qui déborde */}
          <path d="M9 30 Q14 18 22 22 Q27 14 33 20 Q40 13 45 21 Q52 18 55 30 Z" fill={`url(#tc-gold-${uid})`} stroke="#a86b00" strokeWidth="1" />
          {[[17, 25], [26, 21], [35, 19], [44, 22], [50, 27], [30, 27], [40, 27]].map(([x, y], k) => (
            <circle key={k} cx={x} cy={y} r="2.6" fill="#ffd84a" stroke="#b37800" strokeWidth=".8" />
          ))}
          <path d="M31 16 l3 -5 l3 5 l-3 3 Z" fill="#7dd3fc" stroke="#0369a1" strokeWidth=".8" />
          <path d="M22 18 l2.5 -4 l2.5 4 l-2.5 2.5 Z" fill="#f9a8d4" stroke="#be185d" strokeWidth=".8" />
          {/* Caisse */}
          <rect x="8" y="29" width="48" height="27" rx="3" fill={`url(#tc-wood-${uid})`} stroke="#3b1d0b" strokeWidth="1.2" />
          <rect x="8" y="29" width="48" height="5" fill={`url(#tc-gold-${uid})`} />
          <rect x="14" y="29" width="5" height="27" fill={`url(#tc-gold-${uid})`} opacity=".9" />
          <rect x="45" y="29" width="5" height="27" fill={`url(#tc-gold-${uid})`} opacity=".9" />
          {/* Étincelles */}
          {[[8, 8, 0], [56, 10, .5], [32, 3, 1], [4, 30, 1.3], [60, 34, .8]].map(([x, y, delay], k) => (
            <path key={k} className="tresor-etincelle" style={{ animationDelay: `${delay}s` }}
              d={`M${x} ${y - 4} L${x + 1.2} ${y - 1.2} L${x + 4} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 4} L${x - 1.2} ${y + 1.2} L${x - 4} ${y} L${x - 1.2} ${y - 1.2} Z`} fill="#fff7c2" />
          ))}
        </>
      ) : (
        <>
          {/* Couvercle bombé fermé */}
          <path d="M8 28 L8 20 Q32 4 56 20 L56 28 Z" fill={`url(#tc-wood-${uid})`} stroke="#3b1d0b" strokeWidth="1.2" />
          <path d="M8 22 Q32 7 56 22" fill="none" stroke={`url(#tc-gold-${uid})`} strokeWidth="3" />
          {/* Caisse */}
          <rect x="8" y="27" width="48" height="29" rx="3" fill={`url(#tc-wood-${uid})`} stroke="#3b1d0b" strokeWidth="1.2" />
          <rect x="8" y="27" width="48" height="5" fill={`url(#tc-gold-${uid})`} />
          <rect x="14" y="16" width="5" height="40" fill={`url(#tc-gold-${uid})`} opacity=".9" />
          <rect x="45" y="16" width="5" height="40" fill={`url(#tc-gold-${uid})`} opacity=".9" />
          {/* Serrure dorée */}
          <rect x="27" y="26" width="10" height="12" rx="2" fill={`url(#tc-gold-${uid})`} stroke="#8a5a00" strokeWidth="1" />
          <circle cx="32" cy="31" r="1.8" fill="#3b1d0b" />
          <rect x="31.2" y="31.5" width="1.6" height="4" fill="#3b1d0b" />
        </>
      )}
    </svg>
  );
}
