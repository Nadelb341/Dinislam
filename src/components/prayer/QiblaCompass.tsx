import { useEffect, useState, useRef } from 'react';
import { calculateQiblaDirection, CityOption } from '@/hooks/usePrayerTimesCity';
import { Navigation, X } from 'lucide-react';

interface QiblaCompassProps {
  city: CityOption;
  onClose: () => void;
}

const QiblaCompass = ({ city, onClose }: QiblaCompassProps) => {
  const qiblaAngle = calculateQiblaDirection(city.lat, city.lon);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [compassRotation, setCompassRotation] = useState(0);
  const animRef = useRef<number>();

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const alpha = (e as any).webkitCompassHeading ?? e.alpha;
      if (alpha !== null) {
        setDeviceHeading(alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.addEventListener('deviceorientation', handleOrientation as EventListener, true);
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
    };
  }, []);

  // Smooth compass animation
  useEffect(() => {
    const target = deviceHeading !== null ? -(deviceHeading) : 0;
    let current = compassRotation;

    const animate = () => {
      const diff = target - current;
      current += diff * 0.1;
      setCompassRotation(current);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [deviceHeading]);

  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;

  const degMarkers = Array.from({ length: 72 }, (_, i) => i * 5);
  const cardinals = [
    { deg: 0, label: 'N' },
    { deg: 90, label: 'E' },
    { deg: 180, label: 'S' },
    { deg: 270, label: 'O' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-t-3xl w-full max-w-md p-6 pb-8 space-y-4"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Direction Qibla</h3>
            <p className="text-sm text-muted-foreground">Qibla : {Math.round(qiblaAngle)}° depuis {city.label}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-muted hover:bg-muted/80">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Simple map visual */}
        <div className="rounded-xl overflow-hidden bg-blue-50 dark:bg-slate-800 relative" style={{ height: 140 }}>
          {/* Stylized map */}
          <svg viewBox="0 0 340 140" className="w-full h-full">
            {/* Background sea */}
            <rect width="340" height="140" fill="#a8d8ea" />
            {/* Simplified Europe */}
            <path d="M 30 20 L 80 15 L 110 25 L 130 20 L 140 35 L 120 50 L 100 60 L 80 70 L 60 80 L 40 75 L 20 60 L 15 40 Z" fill="#c8d8a8" />
            {/* Africa */}
            <path d="M 50 80 L 100 75 L 130 90 L 140 120 L 110 140 L 70 140 L 40 130 L 35 100 Z" fill="#d4c5a0" />
            {/* Middle East */}
            <path d="M 180 40 L 230 35 L 250 55 L 240 80 L 210 90 L 185 75 L 175 55 Z" fill="#d4c5a0" />
            {/* Saudi Arabia marker */}
            <circle cx="215" cy="65" r="8" fill="#1a6b3a" opacity="0.9" />
            <text x="215" y="69" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">🕋</text>

            {/* User location (France area) */}
            <circle cx="90" cy="35" r="5" fill="#1a6b3a" />

            {/* Qibla direction line */}
            <line
              x1="90" y1="35"
              x2="210" y2="60"
              stroke="#1a6b3a"
              strokeWidth="2"
              strokeDasharray="5 3"
              markerEnd="url(#arrow)"
            />
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 Z" fill="#1a6b3a" />
              </marker>
            </defs>

            {/* Labels */}
            <text x="90" y="28" textAnchor="middle" fill="#1a3a1a" fontSize="8" fontWeight="bold">{city.label}</text>
            <text x="225" y="58" fill="#1a3a1a" fontSize="7">La Mecque</text>
          </svg>
        </div>

        {/* Compass */}
        <div className="flex items-center justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            {/* Rotating compass ring */}
            <svg
              width={size}
              height={size}
              style={{ transform: `rotate(${compassRotation}deg)`, transition: 'transform 0.1s linear' }}
              className="absolute inset-0"
            >
              {/* Outer ring */}
              <circle cx={cx} cy={cy} r={r} fill="#1a6b3a" />
              <circle cx={cx} cy={cy} r={r - 2} fill="none" stroke="#2d8a50" strokeWidth="1" />

              {/* Decorative inner pattern */}
              <circle cx={cx} cy={cy} r={r * 0.7} fill="#155e30" opacity="0.5" />
              <circle cx={cx} cy={cy} r={r * 0.5} fill="#1a6b3a" opacity="0.3" />

              {/* Degree markers */}
              {degMarkers.map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const isMajor = deg % 30 === 0;
                const innerR = isMajor ? r - 15 : r - 10;
                return (
                  <line
                    key={deg}
                    x1={cx + Math.sin(rad) * r}
                    y1={cy - Math.cos(rad) * r}
                    x2={cx + Math.sin(rad) * innerR}
                    y2={cy - Math.cos(rad) * innerR}
                    stroke={isMajor ? 'white' : 'rgba(255,255,255,0.4)'}
                    strokeWidth={isMajor ? 1.5 : 0.8}
                  />
                );
              })}

              {/* Degree numbers */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const textR = r - 25;
                const isCardinal = deg % 90 === 0;
                const label = cardinals.find(c => c.deg === deg)?.label ?? String(deg);
                return (
                  <text
                    key={deg}
                    x={cx + Math.sin(rad) * textR}
                    y={cy - Math.cos(rad) * textR + 4}
                    textAnchor="middle"
                    fill={isCardinal ? 'white' : 'rgba(255,255,255,0.7)'}
                    fontSize={isCardinal ? 16 : 9}
                    fontWeight={isCardinal ? 'bold' : 'normal'}
                  >
                    {label}
                  </text>
                );
              })}
            </svg>

            {/* Fixed: Kaaba pointer (Qibla direction) */}
            <svg width={size} height={size} className="absolute inset-0">
              <g transform={`rotate(${qiblaAngle + compassRotation}, ${cx}, ${cy})`}>
                {/* White needle pointing to Qibla */}
                <polygon
                  points={`${cx},${cy - r + 30} ${cx - 6},${cy + 20} ${cx},${cy + 10} ${cx + 6},${cy + 20}`}
                  fill="white"
                  opacity="0.95"
                />
                {/* Kaaba icon at tip */}
                <text x={cx} y={cy - r + 45} textAnchor="middle" fontSize="16">🕋</text>
              </g>

              {/* Red North needle */}
              <g transform={`rotate(${compassRotation}, ${cx}, ${cy})`}>
                <polygon
                  points={`${cx},${cy - 30} ${cx - 4},${cy} ${cx},${cy + 10} ${cx + 4},${cy}`}
                  fill="#ef4444"
                  opacity="0.9"
                />
                <text x={cx + 15} y={cy + 5} fill="#ef4444" fontSize="12" fontWeight="bold">N</text>
              </g>

              {/* Center dot */}
              <circle cx={cx} cy={cy} r="6" fill="#1e293b" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Info */}
        <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 text-center">
          <p className="text-sm text-green-800 dark:text-green-300">
            La Qibla est à <strong>{Math.round(qiblaAngle)}°</strong> depuis {city.label}
          </p>
          {deviceHeading === null && (
            <p className="text-xs text-muted-foreground mt-1">
              Activez la boussole de votre appareil pour une orientation en temps réel
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QiblaCompass;
