import { useNavigate } from 'react-router-dom';
import { useVillePriere } from '@/hooks/useVillePriere';
import { usePrayerTimesCity, getSavedMethod } from '@/hooks/usePrayerTimesCity';
import { useLienInvocationRupture } from '@/hooks/useInvocationRupture';

/**
 * 🔗 2026-11-26 (Nadia : liens entre cartes, L8 / L9 / L10) — en haut de la page Ramadan :
 * - L9 : l'imsak (Fajr) et l'iftar (Maghrib) du jour, pour la ville de l'élève (mêmes horaires que la page Prière,
 *   calculés sur l'appareil : marche sans Internet) ;
 * - L8 : « 📖 Mon Coran du Ramadan » → carte Coran, onglet Programme (1 Juz' par jour, départ = 1er jour du Ramadan) ;
 * - L10 : « 🤲 Invocation de la rupture du jeûne » → carte Invocations, sur cette invocation.
 */
export function RamadanLiens() {
  const navigate = useNavigate();
  const { ville } = useVillePriere();
  const { prayerTimes } = usePrayerTimesCity(ville, getSavedMethod());
  const lienInvocation = useLienInvocationRupture();

  return (
    <section aria-label="Horaires du jeûne et raccourcis" className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border-2 border-violet-200 bg-violet-50 dark:bg-violet-950/40 dark:border-violet-800 px-3 py-2 text-center">
          <p className="text-xs font-bold text-violet-700 dark:text-violet-300">🌅 Imsak (Fajr)</p>
          <p className="text-2xl font-black text-violet-900 dark:text-violet-100 tabular-nums">{prayerTimes?.fajr ?? '…'}</p>
          <p className="text-[11px] text-violet-700/80 dark:text-violet-300/80">début du jeûne</p>
        </div>
        <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/40 dark:border-orange-800 px-3 py-2 text-center">
          <p className="text-xs font-bold text-orange-700 dark:text-orange-300">🌇 Iftar (Maghrib)</p>
          <p className="text-2xl font-black text-orange-900 dark:text-orange-100 tabular-nums">{prayerTimes?.maghrib ?? '…'}</p>
          <p className="text-[11px] text-orange-700/80 dark:text-orange-300/80">rupture du jeûne</p>
        </div>
      </div>
      <p className="text-center text-[11px] text-muted-foreground [overflow-wrap:anywhere]">📍 Horaires d'aujourd'hui pour {ville.label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => navigate('/coran?tab=programme')}
          className="rounded-2xl bg-gradient-to-r from-[#7a1d22] to-[#561216] text-white px-4 py-3 font-extrabold text-sm shadow active:scale-[0.98] transition-transform">
          📖 Mon Coran du Ramadan
        </button>
        <button type="button" onClick={() => navigate(lienInvocation)}
          className="rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-4 py-3 font-extrabold text-sm shadow active:scale-[0.98] transition-transform">
          🤲 Invocation de la rupture du jeûne
        </button>
      </div>
    </section>
  );
}
