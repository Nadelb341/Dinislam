import { useEffect, useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { AMBIANCES, type Horaires, type Moment } from '@/lib/momentPriere';
import { parler } from '@/lib/petits';

/**
 * 🌅 Ciel des prières (Nadia, 2026-11-26, choix A + présentation 1) : SON image, en haut de la page, avec la couleur du moment
 * (voile + filtre), des étoiles à Icha, un anneau doré sur la prière en cours et la prochaine prière posée dessus.
 * 26/11 (2ᵉ demande) : sous chaque prière DE L'IMAGE, 🔊 (son nom en arabe) et son heure du jour (recalculée chaque jour) ;
 * idée a : compte à rebours vivant jusqu'à la prochaine prière.
 * Image dans `public/images/priere/` → gardée sur le téléphone, marche sans Internet.
 */

// Sous l'étiquette dessinée de chaque prière dans l'image (en % de l'image)
const REPERES: { cle: keyof Horaires; nom: string; arabe: string; x: number; y: number }[] = [
  { cle: 'fajrDate', nom: 'Sobh', arabe: 'الصُّبْح', x: 9.8, y: 55 },
  { cle: 'sunriseDate', nom: 'Chourouk', arabe: 'الشُّرُوق', x: 26.2, y: 40.5 },
  { cle: 'dhuhrDate', nom: 'Dhohr', arabe: 'الظُّهْر', x: 49.4, y: 30.5 },
  { cle: 'asrDate', nom: 'Asr', arabe: 'العَصْر', x: 66.8, y: 34.5 },
  { cle: 'maghribDate', nom: 'Maghreb', arabe: 'المَغْرِب', x: 82.4, y: 48.5 },
  { cle: 'ishaDate', nom: 'Icha', arabe: 'العِشَاء', x: 88.6, y: 28.5 },
];

const hm = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** « 1 h 20 min 05 s » jusqu'à `cible` (le lendemain si l'heure est déjà passée) */
function reste(cible: Date, maintenant: Date): string {
  let ms = cible.getTime() - maintenant.getTime();
  if (ms < 0) ms += 24 * 3600 * 1000;
  const t = Math.floor(ms / 1000);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return `${h ? `${h} h ` : ''}${String(m).padStart(h ? 2 : 1, '0')} min ${String(s).padStart(2, '0')} s`;
}

export function CielDesPrieres({ moment, horaires, prochaine }: {
  moment: Moment; horaires: Horaires; prochaine: { name: string; time: string; date: Date; arabic?: string } | null;
}) {
  const a = AMBIANCES[moment];
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setMaintenant(new Date()), 1000); return () => clearInterval(t); }, []);
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
      {/* 🔊 + heure du jour sous chaque prière de l'image */}
      {REPERES.map((r) => (
        <button key={r.nom} type="button" onClick={() => parler(r.arabe, 'ar')} aria-label={`${r.nom} à ${hm(horaires[r.cle])} : écouter en arabe`}
          className="absolute flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[#1f2240] shadow-sm active:scale-95 sm:gap-1 sm:px-2"
          style={{ left: `${r.x}%`, top: `${r.y}%` }}>
          <Volume2 className="h-2.5 w-2.5 shrink-0 text-[#2d4a9a] sm:h-3.5 sm:w-3.5" aria-hidden />
          <span className="font-mono text-[9px] font-extrabold leading-none tabular-nums sm:text-xs">{hm(horaires[r.cle])}</span>
        </button>
      ))}
      {prochaine && (
        <div className="absolute bottom-[4%] left-[50%] max-w-[62%] -translate-x-1/2 rounded-2xl bg-white/90 px-2.5 py-1 text-center text-[#1f2240] shadow-md backdrop-blur-sm sm:px-3 sm:py-1.5">
          <p className="text-[10px] font-semibold leading-tight text-[#5b5a7a] sm:text-[11px]">Prochaine prière : <b className="text-[#1f2240]">{prochaine.name}</b></p>
          <p className="text-xs font-extrabold leading-tight tabular-nums sm:text-sm" aria-live="off">⏳ dans {reste(prochaine.date, maintenant)}</p>
        </div>
      )}
      <span className="sr-only">Maintenant : {a.nom}</span>
    </div>
  );
}
