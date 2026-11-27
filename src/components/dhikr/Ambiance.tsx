import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * 🌅 Les couleurs de la carte Dhikr (Nadia, 27/11) : le jour, ciel bleu clair et mosquée bleue ; au coucher du soleil,
 * orange → violet et mosquée violette ; le soir, nuit bleu marine étoilée. L'or des perles partout.
 * Dessiné dans le code (aucune image) : marche hors ligne.
 */
export type NomAmbiance = 'jour' | 'couchant' | 'nuit';
export const ambianceDe = (d: Date): NomAmbiance => {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 6.5 && h < 17) return 'jour';
  if (h >= 17 && h < 19.5) return 'couchant';
  return 'nuit';
};

export interface Couleurs { nom: NomAmbiance; texte: string; doux: string; or: string; voile: string; bord: string }
export const COULEURS: Record<NomAmbiance, Couleurs> = {
  jour: { nom: 'jour', texte: '#13254a', doux: '#3b5277', or: '#9a6700', voile: 'rgba(255,255,255,.72)', bord: 'rgba(59,94,160,.25)' },
  couchant: { nom: 'couchant', texte: '#2a1238', doux: '#4a2a55', or: '#8a4b00', voile: 'rgba(255,247,240,.78)', bord: 'rgba(120,60,140,.28)' },
  nuit: { nom: 'nuit', texte: '#f3f6ff', doux: '#c9d3f5', or: '#f5d27a', voile: 'rgba(14,24,70,.72)', bord: 'rgba(245,210,122,.35)' },
};

export function useAmbiance(force?: NomAmbiance): Couleurs {
  const [nom, setNom] = useState<NomAmbiance>(() => force ?? ambianceDe(new Date()));
  useEffect(() => {
    if (force) { setNom(force); return; }
    const t = setInterval(() => setNom(ambianceDe(new Date())), 60_000);
    return () => clearInterval(t);
  }, [force]);
  return COULEURS[nom];
}

const FONDS: Record<NomAmbiance, string> = {
  jour: 'linear-gradient(180deg, #cfe9ff 0%, #e3f2ff 45%, #f6fbff 100%)',
  couchant: 'linear-gradient(180deg, #ffcf8a 0%, #f59e6b 30%, #c96aa0 65%, #6b4aa0 100%)',
  nuit: 'linear-gradient(180deg, #0a1438 0%, #14225c 55%, #1d2f73 100%)',
};
const MOSQUEE: Record<NomAmbiance, string> = { jour: '#7fa9e0', couchant: '#5a3483', nuit: '#0b1233' };

/** La silhouette de la mosquée (coupole + 2 minarets), en bas à droite */
function Mosquee({ couleur, fenetres }: { couleur: string; fenetres: boolean }) {
  return (
    <svg viewBox="0 0 200 110" className="absolute bottom-0 right-0 w-[220px] max-w-[60%] h-auto pointer-events-none select-none" aria-hidden>
      <g fill={couleur}>
        <rect x="18" y="30" width="12" height="80" rx="2" /><path d="M16 32 L24 8 L32 32 Z" /><rect x="15" y="44" width="18" height="4" rx="1" />
        <rect x="170" y="30" width="12" height="80" rx="2" /><path d="M168 32 L176 8 L184 32 Z" /><rect x="167" y="44" width="18" height="4" rx="1" />
        <path d="M60 110 V70 Q60 30 100 22 Q140 30 140 70 V110 Z" />
        <path d="M100 22 V8" stroke={couleur} strokeWidth="2.5" /><circle cx="100" cy="7" r="3.2" />
        <rect x="40" y="78" width="120" height="32" />
      </g>
      {fenetres && <g fill="#f5d27a" opacity=".85">
        <path d="M92 110 V92 a8 8 0 0 1 16 0 V110 Z" /><rect x="70" y="86" width="7" height="12" rx="3.5" /><rect x="123" y="86" width="7" height="12" rx="3.5" />
      </g>}
    </svg>
  );
}

const ETOILES = Array.from({ length: 26 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 53) % 62, s: 1 + (i % 3) * 0.6, d: (i % 5) * 0.7 }));

/** Le grand fond de la carte (bandeau du haut et pages) */
export function FondDhikr({ ambiance, children, className, mosquee = true }: { ambiance: Couleurs; children: ReactNode; className?: string; mosquee?: boolean }) {
  const nuit = ambiance.nom === 'nuit';
  return (
    <div className={cn('relative overflow-hidden', className)} style={{ background: FONDS[ambiance.nom], color: ambiance.texte }}>
      {nuit && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {ETOILES.map((e, i) => (
            <span key={i} className="dhk-scintille absolute rounded-full bg-white" style={{ left: `${e.x}%`, top: `${e.y}%`, width: e.s * 2, height: e.s * 2, animationDelay: `${e.d}s` }} />
          ))}
          <span className="absolute right-6 top-4 h-9 w-9 rounded-full" style={{ boxShadow: 'inset -9px 3px 0 0 #f5d27a' }} />
        </div>
      )}
      {mosquee && <Mosquee couleur={MOSQUEE[ambiance.nom]} fenetres={nuit} />}
      <div className="relative">{children}</div>
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
      @media (prefers-reduced-motion: reduce) { .dhk-scintille, .dhk-etoile, .dhk-halo, .dhk-apparait { animation: none !important; } }
    `}</style>
  );
}
