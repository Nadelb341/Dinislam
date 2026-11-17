import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReglagesRamadan } from '@/lib/saisons';
import { LANTERNE_VB, NB_LANTERNES, lanterneSvg } from './dessinsRamadan';

/**
 * 🏮 Sous le message de bienvenue, pendant le Ramadan (Nadia, 2026-11-15/16) :
 * - 30 lanternes : une s'allume pour chaque jour passé (celle du jour clignote doucement) ;
 * - ⏳ « Iftar dans 2 h 14 » (Maghrib de la ville de l'élève, calculé dans l'appli : marche sans Internet) ;
 * - 🍽️ au Maghrib : les lanternes s'allument une à une + l'invocation de la rupture du jeûne (1 fois par jour).
 * Invocation : « ذَهَبَ الظَّمَأُ… » — Abou Dawoud n° 2357 (hadith hasan).
 */
const fmt = (ms: number) => { const m = Math.max(0, Math.round(ms / 60000)); const h = Math.floor(m / 60); return h ? `${h} h ${String(m % 60).padStart(2, '0')}` : `${m} min`; };

export function LanternesRamadan({ jour, r, maghrib }: { jour: number; r: ReglagesRamadan; maghrib: Date | null }) {
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setMaintenant(Date.now()), 30000); return () => clearInterval(t); }, []);
  const avant = maghrib ? maghrib.getTime() - maintenant : null;
  const iftarEnCours = avant !== null && avant <= 0 && avant > -60 * 60000;
  // Animation de l'iftar : au Maghrib (ou à l'ouverture dans les 40 min après), une fois par jour sur l'appareil
  const [anim, setAnim] = useState(false);
  useEffect(() => {
    if (!r.iftar || avant === null || avant > 0 || avant < -40 * 60000) return;
    const cle = `dinislam_iftar_${new Date().toLocaleDateString('en-CA')}`;
    try { if (localStorage.getItem(cle)) return; localStorage.setItem(cle, '1'); } catch { /* */ }
    setAnim(true);
    const t = setTimeout(() => setAnim(false), 14000);
    return () => clearTimeout(t);
  }, [avant, r.iftar]);
  const allumees = Math.max(0, Math.min(30, jour - 1));
  // Les 4 nouvelles lanternes (2026-11-17), chacune avec ses propres dégradés
  const dessins = useMemo(() => Array.from({ length: 30 }, (_, i) => lanterneSvg(i % NB_LANTERNES, `m${i}`)), []);

  return (
    <section aria-label="Les lanternes du Ramadan" className="rounded-2xl border-2 border-[#e2c08f] bg-[#fffaf0]/90 dark:bg-card px-3 py-2 space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-extrabold text-[#7a4e10] dark:text-amber-200">🌙 Ramadan · jour {Math.max(1, jour)}</p>
        {r.compteRebours && avant !== null && (
          <p className="text-sm font-bold text-[#1d7f78] dark:text-teal-300">
            {avant > 0 ? `⏳ Iftar dans ${fmt(avant)}` : iftarEnCours ? '🍽️ C\'est l\'heure de l\'iftar !' : '🌙 Bonne nuit de Ramadan'}
          </p>
        )}
      </div>
      {r.lanternesMois && (
        <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-x-0.5 gap-y-1" aria-label={`${allumees} jour${allumees > 1 ? 's' : ''} de Ramadan passé${allumees > 1 ? 's' : ''} sur 30`}>
          {Array.from({ length: 30 }, (_, i) => {
            const etat = i < allumees ? 'allumee' : i === allumees ? 'aujourdhui' : 'eteinte';
            return (
              <svg key={i} viewBox={`0 0 ${LANTERNE_VB.w} ${LANTERNE_VB.h}`} aria-hidden className={`ramadan-mois w-full max-w-[20px] mx-auto overflow-visible ${etat}`}
                style={anim ? { animationDelay: `${i * 0.25}s` } : undefined} dangerouslySetInnerHTML={{ __html: dessins[i] }} />
            );
          })}
        </div>
      )}
      {anim && createPortal(
        <div role="status" className="saison-msg-arrive fixed inset-x-0 top-24 z-[60] flex justify-center px-4" onClick={() => setAnim(false)}>
          <div className="max-w-sm rounded-2xl border-2 border-[#e2c08f] bg-[#fffaf0] px-5 py-3 text-center shadow-xl space-y-1">
            <p className="text-lg font-extrabold text-[#7a4e10]">🍽️ C'est l'heure de l'iftar !</p>
            <p className="font-arabic text-xl leading-loose text-[#1d7f78]" dir="rtl" lang="ar">ذَهَبَ الظَّمَأُ، وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ</p>
            <p className="text-sm text-[#5a4a3a]">« La soif est partie, les veines sont humectées, et la récompense est acquise, si Allah le veut. »</p>
            <p className="text-[11px] text-[#8a7a6a]">Abou Dawoud n° 2357</p>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}
