import { useMemo } from 'react';
import { AMBIANCES, type Moment } from '@/lib/momentPriere';

/**
 * 🌅 Ciel des prières (Nadia, 2026-11-26, choix A + présentation 1) : SON image, en haut de la page, avec la couleur du moment
 * (voile + filtre), des étoiles à Icha, un anneau doré sur la prière en cours et la prochaine prière posée dessus.
 * Image dans `public/images/priere/` → gardée sur le téléphone, marche sans Internet.
 */
export function CielDesPrieres({ moment, prochaine }: { moment: Moment; prochaine: { name: string; time: string; arabic?: string } | null }) {
  const a = AMBIANCES[moment];
  // Étoiles placées une fois pour toutes (pas de saut à chaque rendu)
  const etoiles = useMemo(() => Array.from({ length: 50 }, (_, i) => ({ l: (i * 37.7) % 100, t: (i * 23.3) % 55, d: (i % 8) * 0.3 })), []);
  return (
    <div className="relative w-full overflow-hidden rounded-3xl shadow-lg" style={{ aspectRatio: '1148 / 648' }}>
      <img src="/images/priere/ciel-des-prieres.jpg" alt="Le ciel des prières : Sobh, Chourouk, Dhohr, Asr, Maghreb et Icha le long de la course du soleil"
        className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-1000" style={{ filter: a.filtre }} />
      <div className="absolute inset-0 mix-blend-multiply transition-[background] duration-1000" style={{ background: a.voile }} aria-hidden />
      {a.etoiles && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {etoiles.map((e, i) => (
            <span key={i} className="absolute h-[3px] w-[3px] rounded-full bg-white shadow-[0_0_6px_#fff] motion-safe:animate-pulse"
              style={{ left: `${e.l}%`, top: `${e.t}%`, animationDelay: `${e.d}s` }} />
          ))}
        </div>
      )}
      {/* Anneau doré sur la prière du moment */}
      <span className="absolute aspect-square w-[9%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#ffe27a] shadow-[0_0_18px_#ffd84d] transition-all duration-1000 motion-safe:animate-pulse"
        style={{ left: `${a.x}%`, top: `${a.y}%` }} aria-hidden />
      {prochaine && (
        <div className="absolute bottom-[5%] left-[3%] max-w-[80%] rounded-2xl bg-white/90 px-3 py-1.5 text-[#1f2240] shadow-md backdrop-blur-sm">
          <p className="text-[11px] font-semibold leading-tight text-[#5b5a7a]">Prochaine prière</p>
          <p className="text-sm font-extrabold leading-tight sm:text-base [overflow-wrap:anywhere]">
            {prochaine.name} · <span className="font-mono">{prochaine.time}</span>
            {prochaine.arabic && <span className="ms-1.5 font-arabic font-normal">{prochaine.arabic}</span>}
          </p>
        </div>
      )}
      <span className="sr-only">Maintenant : {a.nom}</span>
    </div>
  );
}
