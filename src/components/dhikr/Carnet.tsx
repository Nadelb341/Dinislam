import { cn } from '@/lib/utils';
import { joursDeLaSemaine, serieDeJours, totalSemaine, type Carnet, type MomentCarnet } from '@/lib/dhikr';
import type { Couleurs } from './Ambiance';

/**
 * 📒 G · Mon carnet de dhikr (Nadia, 27/11) : série de jours, total de la semaine, moments faits.
 * Remis à zéro chaque semaine le dimanche soir à minuit (heure de l'appareil) ; on garde UNIQUEMENT la semaine passée pour comparer.
 * Gardé sur l'appareil (marche sans réseau) ; les totaux de la semaine partent aussi en base pour l'enseignante (`envoyerSemaine`).
 */
const NOMS_MOMENTS: Record<MomentCarnet, string> = {
  matin: '☀️ Matin', soir: '🌙 Soir', reveil: '🌅 Réveil', apres_priere: '🕌 Après la prière', libre: '📿 Chapelet', defi: '🤝 Défi',
};
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function CarnetDhikr({ carnet, ambiance }: { carnet: Carnet; ambiance: Couleurs }) {
  const maintenant = new Date();
  const semaine = joursDeLaSemaine(carnet);
  const total = totalSemaine(carnet.courante);
  const avant = totalSemaine(carnet.precedente);
  const serie = serieDeJours(carnet, maintenant);
  const max = Math.max(1, ...semaine.map((j) => j.total));
  const momentsFaits = [...new Set(semaine.flatMap((j) => j.moments))];
  const nuit = ambiance.nom === 'nuit';
  const carte = nuit ? 'bg-white/10 border-white/20' : 'bg-white/80 border-white';
  const aujourdhui = semaine.findIndex((j) => j.cle === `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}-${String(maintenant.getDate()).padStart(2, '0')}`);
  const ecart = total - avant;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { t: 'Jours d\'affilée', v: serie, e: '🔥' },
          { t: 'Cette semaine', v: total, e: '📿' },
          { t: 'La semaine passée', v: avant, e: '🗓️' },
        ].map((x) => (
          <div key={x.t} className={cn('rounded-3xl border p-2 text-center', carte)}>
            <p className="text-2xl">{x.e}</p>
            <p className="text-2xl sm:text-3xl font-black tabular-nums">{x.v}</p>
            <p className="text-[11px] sm:text-xs font-bold leading-tight [overflow-wrap:anywhere]" style={{ color: ambiance.doux }}>{x.t}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-sm font-bold">
        {total === 0 ? 'Ta semaine commence : fais ton premier dhikr 🤍'
          : ecart > 0 ? `✨ ${ecart} de plus que la semaine passée, ma shâ' Allah !`
            : ecart === 0 ? 'Autant que la semaine passée, continue 🤍' : `Encore ${-ecart} pour égaler la semaine passée 🌿`}
      </p>
      <div className={cn('rounded-3xl border p-3', carte)}>
        <div className="grid grid-cols-7 gap-1 items-end h-32" aria-label="Les dhikr de chaque jour de la semaine">
          {semaine.map((j, i) => (
            <div key={j.cle} className="flex flex-col items-center justify-end h-full gap-1 min-w-0">
              <span className="text-[10px] font-bold tabular-nums">{j.total || ''}</span>
              <div className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-amber-500 to-amber-300 transition-all"
                style={{ height: `${Math.max(j.total ? 8 : 2, (j.total / max) * 80)}%`, opacity: j.total ? 1 : 0.3 }} />
              <span className={cn('text-[11px] font-bold', i === aujourdhui && 'underline decoration-2 decoration-amber-400')}>{JOURS[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={cn('rounded-3xl border p-3', carte)}>
        <p className="text-sm font-extrabold mb-2">Les moments faits cette semaine</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(NOMS_MOMENTS) as MomentCarnet[]).map((m) => {
            const fait = momentsFaits.includes(m);
            return <span key={m} className={cn('rounded-full border px-3 py-1 text-sm font-bold', fait ? 'bg-amber-400 border-amber-500 text-amber-950' : nuit ? 'border-white/25 text-white/60' : 'border-slate-200 text-slate-500 bg-white')}>{fait ? '✓ ' : ''}{NOMS_MOMENTS[m]}</span>;
          })}
        </div>
      </div>
      <p className="text-xs text-center" style={{ color: ambiance.doux }}>🔄 Le carnet repart à zéro chaque dimanche soir à minuit. Il est gardé sur cet appareil, et ton professeur voit tes totaux de la semaine.</p>
    </div>
  );
}
