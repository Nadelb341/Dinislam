import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { PrayerTimesData } from '@/hooks/usePrayerTimesCity';
import { cn } from '@/lib/utils';

interface SunArcDisplayProps {
  prayerTimes: PrayerTimesData;
  cityLabel: string;
  checkedPrayers: string[];
  onTogglePrayer: (prayerName: string) => void;
}

const SunArcDisplay = ({ prayerTimes, cityLabel, checkedPrayers, onTogglePrayer }: SunArcDisplayProps) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const toMinutes = (d: Date) => d.getHours() * 60 + d.getMinutes();

  const fajrMin = toMinutes(prayerTimes.fajrDate);
  const sunriseMin = toMinutes(prayerTimes.sunriseDate);
  const maghribMin = toMinutes(prayerTimes.maghribDate);
  const ishaMin = toMinutes(prayerTimes.ishaDate);
  const nowMin = toMinutes(now);

  // Day spans from fajr to isha
  const dayStart = fajrMin;
  const dayEnd = ishaMin;
  const dayDuration = dayEnd - dayStart;

  const progress = Math.max(0, Math.min(1, (nowMin - dayStart) / dayDuration));

  // Is it daytime (between sunrise and maghrib)?
  const isDaytime = nowMin >= sunriseMin && nowMin <= maghribMin;

  // SVG arc: sun travels from left (sunrise) to right (maghrib)
  const W = 300;
  const H = 120;
  const arcStartX = 10;
  const arcEndX = W - 10;
  const arcPeakY = 15;
  const baseY = H - 10;

  // Position on arc using quadratic bezier
  const t = progress;
  const cx = W / 2;
  const cy = arcPeakY;

  // Bezier: P(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
  const sunX = Math.pow(1 - t, 2) * arcStartX + 2 * (1 - t) * t * cx + Math.pow(t, 2) * arcEndX;
  const sunY = Math.pow(1 - t, 2) * baseY + 2 * (1 - t) * t * cy + Math.pow(t, 2) * baseY;

  // For the filled area under the arc up to current time
  // Generate path points for filled area
  const steps = 50;
  const filledPoints: string[] = [];
  for (let i = 0; i <= steps * t; i++) {
    const ti = i / steps;
    const xi = Math.pow(1 - ti, 2) * arcStartX + 2 * (1 - ti) * ti * cx + Math.pow(ti, 2) * arcEndX;
    const yi = Math.pow(1 - ti, 2) * baseY + 2 * (1 - ti) * ti * cy + Math.pow(ti, 2) * baseY;
    filledPoints.push(`${xi},${yi}`);
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const prayers = [
    { name: 'Sobh', time: prayerTimes.fajr, date: prayerTimes.fajrDate, checkKey: 'sobh' },
    { name: 'Lever', time: prayerTimes.sunrise, date: prayerTimes.sunriseDate, checkKey: null },
    { name: 'Dohr', time: prayerTimes.dhuhr, date: prayerTimes.dhuhrDate, checkKey: 'dhuhr' },
    { name: 'Asr', time: prayerTimes.asr, date: prayerTimes.asrDate, checkKey: 'asr' },
    { name: 'Maghreb', time: prayerTimes.maghrib, date: prayerTimes.maghribDate, checkKey: 'maghrib' },
    { name: 'Icha', time: prayerTimes.isha, date: prayerTimes.ishaDate, checkKey: 'isha' },
  ];

  const currentTimeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl overflow-hidden">
      {/* City header */}
      <div className="bg-green-700 px-4 py-2 text-center">
        <p className="text-white font-semibold text-sm">{cityLabel}</p>
        <p className="text-green-200 text-xs">UOIF (France) (12.0° / 12.0°)</p>
      </div>

      {/* Arc */}
      <div className="relative px-2 pt-2 pb-0">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
          {/* Gradient definition */}
          <defs>
            <linearGradient id="arcGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c6a1a" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#7c6a1a" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Base line */}
          <line x1={arcStartX} y1={baseY} x2={arcEndX} y2={baseY} stroke="#64748b" strokeWidth="1" />

          {/* Dashed arc (full day) */}
          <path
            d={`M ${arcStartX} ${baseY} Q ${cx} ${arcPeakY} ${arcEndX} ${baseY}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* Filled area under arc */}
          {filledPoints.length > 1 && (
            <polygon
              points={`${arcStartX},${baseY} ${filledPoints.join(' ')} ${sunX},${baseY}`}
              fill="url(#arcGrad)"
            />
          )}

          {/* Sun or Moon */}
          {isDaytime ? (
            <g transform={`translate(${sunX - 10}, ${sunY - 10})`}>
              <circle cx="10" cy="10" r="8" fill="#fbbf24" opacity="0.9" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <line
                  key={angle}
                  x1="10" y1="10"
                  x2={10 + Math.cos((angle * Math.PI) / 180) * 13}
                  y2={10 + Math.sin((angle * Math.PI) / 180) * 13}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ))}
            </g>
          ) : (
            <g transform={`translate(${W - 30}, 10)`}>
              <path d="M 10 0 A 10 10 0 1 0 10 20 A 7 10 0 1 1 10 0" fill="#cbd5e1" />
            </g>
          )}

          {/* Prayer time markers on baseline */}
          {prayers.map((p, i) => {
            const pMin = toMinutes(p.date);
            const px = ((pMin - dayStart) / dayDuration) * (arcEndX - arcStartX) + arcStartX;
            const isPast = nowMin > pMin;
            if (px < arcStartX || px > arcEndX) return null;
            return (
              <g key={i}>
                <circle
                  cx={px}
                  cy={baseY}
                  r="5"
                  fill={isPast ? '#16a34a' : '#1e293b'}
                  stroke={isPast ? '#16a34a' : '#64748b'}
                  strokeWidth="1.5"
                />
                {isPast && (
                  <path
                    d={`M ${px - 2.5} ${baseY} l 1.5 1.5 l 3 -3`}
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Current time */}
        <div className="absolute top-2 right-4 text-white text-xs font-mono opacity-80">
          {currentTimeStr}
        </div>
      </div>

      {/* Prayer times list */}
      <div className="divide-y divide-slate-700">
        {prayers.map((p, i) => {
          const pMin = toMinutes(p.date);
          const isPast = nowMin > pMin;
          const isCurrent = prayers[i + 1] ? nowMin >= pMin && nowMin < toMinutes(prayers[i + 1].date) : false;
          // Only the 5 actual prayers have a checkbox key (not Lever du soleil)
          const checkKey = p.checkKey;
          const isChecked = checkKey ? checkedPrayers.includes(checkKey) : false;

          return (
            <div
              key={i}
              className={`flex items-center justify-between px-4 py-3 ${
                isCurrent ? 'bg-green-900/40' : isPast ? 'opacity-60' : ''
              }`}
            >
              <span className={`text-sm ${isCurrent ? 'text-green-300 font-bold' : 'text-slate-200'}`}>
                {p.name}
              </span>
              <div className="flex items-center gap-3">
                <span className={`font-mono tabular-nums ${isCurrent ? 'text-green-300 font-bold text-base' : 'text-slate-200 text-sm'}`}>
                  {p.time}
                </span>
                {isCurrent && (
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                )}
                {/* Checkbox for the 5 prayers */}
                {checkKey && (
                  <button
                    onClick={() => onTogglePrayer(checkKey)}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                      isChecked
                        ? 'bg-green-500 border-green-500'
                        : 'border-slate-500 hover:border-green-400'
                    )}
                    aria-label={`Marquer ${p.name} comme effectuée`}
                  >
                    {isChecked && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SunArcDisplay;
