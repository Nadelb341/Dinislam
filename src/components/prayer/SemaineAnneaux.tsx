import { useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * 🗓️ Ma semaine en anneaux (Nadia, 2026-11-26 : présentation D « les anneaux », placée comme la E = juste sous
 * « Mes 5 étoiles du jour », et un peu plus mise en valeur). Chaque jour (lundi → dimanche) = un anneau en 5 morceaux,
 * un morceau coloré par prière faite ; 5/5 = anneau doré qui brille. Aujourd'hui entouré. Remplace l'ancienne carte
 * « Suivi de la semaine » (pastilles + légende).
 */
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const cle = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function Anneau({ n, futur, nuit }: { n: number; futur: boolean; nuit: boolean }) {
  const complet = n >= 5;
  const plein = complet ? '#f5b81b' : '#4f86f7';
  const vide = nuit ? 'rgba(255,255,255,.22)' : '#d6d1e8';
  const segments = [0, 1, 2, 3, 4].map((i) => {
    const a0 = -90 + i * 72 + 5, a1 = a0 + 62, r = 15;
    const p = (a: number) => [20 + r * Math.cos((a * Math.PI) / 180), 20 + r * Math.sin((a * Math.PI) / 180)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return <path key={i} d={`M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`} stroke={!futur && i < n ? plein : vide} strokeWidth="5" fill="none" strokeLinecap="round" />;
  });
  return (
    <svg viewBox="0 0 40 40" className={cn('h-10 w-10 sm:h-11 sm:w-11', complet && 'drop-shadow-[0_0_6px_rgba(245,184,27,.8)]')} aria-hidden>
      {segments}
      {!futur && (
        <text x="20" y="24.5" textAnchor="middle" fontSize="11" fontWeight="800" fill={complet ? '#c98a00' : nuit ? '#fff' : '#2d3a6a'}>{complet ? '★' : n}</text>
      )}
    </svg>
  );
}

export function SemaineAnneaux({ dates, texte, nuit = false }: { dates: Record<string, number>; texte: string; nuit?: boolean }) {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const jourCle = aujourdhui.toDateString();
  const semaine = useMemo(() => {
    const t = new Date(jourCle);
    const lundi = new Date(t);
    lundi.setDate(t.getDate() + (t.getDay() === 0 ? -6 : 1 - t.getDay()));
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(lundi); d.setDate(lundi.getDate() + i); return d; });
  }, [jourCle]);
  const total = semaine.reduce((s, d) => s + (d <= aujourdhui ? Math.min(5, dates[cle(d)] ?? 0) : 0), 0);
  return (
    <div className={cn('mt-3 rounded-2xl p-2.5', nuit ? 'bg-emerald-300/20 ring-1 ring-emerald-200/40' : 'bg-gradient-to-br from-emerald-50 to-green-100 ring-1 ring-emerald-200 dark:from-emerald-950/40 dark:to-green-900/30 dark:ring-emerald-800')}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 px-1">
        <h3 className="text-sm font-extrabold" style={{ color: texte }}>🗓️ Ma semaine</h3>
        <span className="text-[11px] font-bold tabular-nums" style={{ color: texte, opacity: 0.85 }}>{total} prières faites</span>
      </div>
      <ol className="grid grid-cols-7 gap-0.5">
        {semaine.map((d, i) => {
          const futur = d > aujourdhui;
          const auj = d.getTime() === aujourdhui.getTime();
          const n = Math.min(5, dates[cle(d)] ?? 0);
          return (
            <li key={i} aria-label={`${JOURS[i]} ${d.getDate()} : ${futur ? 'pas encore' : `${n} prière${n > 1 ? 's' : ''} sur 5`}`}
              className={cn('flex min-w-0 flex-col items-center gap-0.5 rounded-xl py-1', auj && (nuit ? 'bg-white/15 ring-2 ring-amber-300/80' : 'bg-white ring-2 ring-[#4f86f7] dark:bg-white/10'))}>
              <span className="text-[10px] font-extrabold leading-none sm:text-[11px]" style={{ color: texte, opacity: futur ? 0.5 : 1 }}>{auj ? 'Auj.' : JOURS[i]}</span>
              <Anneau n={n} futur={futur} nuit={nuit} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
