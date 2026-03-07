import { useEffect, useState, useRef, useCallback } from 'react';
import { CityOption } from '@/hooks/usePrayerTimesCity';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QiblaCompassProps {
  city: CityOption;
  onClose: () => void;
}

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

const toRad = (deg: number) => deg * Math.PI / 180;
const toDeg = (rad: number) => rad * 180 / Math.PI;

function calcQiblaAngle(userLat: number, userLng: number): number {
  const dLng = toRad(KAABA_LNG - userLng);
  const userLatRad = toRad(userLat);
  const kaabaLatRad = toRad(KAABA_LAT);
  const y = Math.sin(dLng) * Math.cos(kaabaLatRad);
  const x = Math.cos(userLatRad) * Math.sin(kaabaLatRad) -
            Math.sin(userLatRad) * Math.cos(kaabaLatRad) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const QiblaCompass = ({ city, onClose }: QiblaCompassProps) => {
  const qiblaAngle = calcQiblaAngle(city.lat, city.lon);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [needsIOSPermission, setNeedsIOSPermission] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [compassSupported, setCompassSupported] = useState(true);
  const smoothHeadingRef = useRef(0);
  const animRef = useRef<number>();
  const targetHeadingRef = useRef(0);
  const listeningRef = useRef(false);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    let heading: number | null = null;
    // iOS provides webkitCompassHeading
    if ((e as any).webkitCompassHeading !== undefined && (e as any).webkitCompassHeading !== null) {
      heading = (e as any).webkitCompassHeading;
    } else if (e.alpha !== null && e.alpha !== undefined) {
      // Android: alpha is degrees from north (when using deviceorientationabsolute)
      heading = (360 - e.alpha) % 360;
    }
    if (heading !== null && !isNaN(heading)) {
      targetHeadingRef.current = heading;
      setDeviceHeading(heading);
    }
  }, []);

  const startListening = useCallback(() => {
    if (listeningRef.current) return;
    listeningRef.current = true;
    // Try absolute first (more accurate on Android)
    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    window.addEventListener('deviceorientation', handleOrientation as EventListener, true);
    
    // Detect if compass is not supported after a timeout
    setTimeout(() => {
      if (targetHeadingRef.current === 0 && deviceHeading === null) {
        setCompassSupported(false);
      }
    }, 3000);
  }, [handleOrientation, deviceHeading]);

  useEffect(() => {
    // Check if iOS permission is needed
    const DOE = window.DeviceOrientationEvent as any;
    if (typeof DOE?.requestPermission === 'function') {
      setNeedsIOSPermission(true);
    } else if (window.DeviceOrientationEvent) {
      startListening();
    } else {
      setCompassSupported(false);
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
      listeningRef.current = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [handleOrientation, startListening]);

  const requestIOSPermission = async () => {
    try {
      const DOE = window.DeviceOrientationEvent as any;
      const response = await DOE.requestPermission();
      if (response === 'granted') {
        setNeedsIOSPermission(false);
        startListening();
      } else {
        setPermissionDenied(true);
        setNeedsIOSPermission(false);
      }
    } catch {
      setPermissionDenied(true);
      setNeedsIOSPermission(false);
    }
  };

  // Smooth animation loop
  useEffect(() => {
    const animate = () => {
      const target = targetHeadingRef.current;
      let current = smoothHeadingRef.current;
      // Shortest path rotation
      let diff = target - current;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      current += diff * 0.1;
      smoothHeadingRef.current = current;
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // Force re-render at ~30fps for smooth visual updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 33);
    return () => clearInterval(interval);
  }, []);

  const currentHeading = smoothHeadingRef.current;
  const compassRotation = -currentHeading;
  const qiblaPointerRotation = qiblaAngle - currentHeading;

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
          <svg viewBox="0 0 340 140" className="w-full h-full">
            <rect width="340" height="140" fill="#a8d8ea" />
            <path d="M 30 20 L 80 15 L 110 25 L 130 20 L 140 35 L 120 50 L 100 60 L 80 70 L 60 80 L 40 75 L 20 60 L 15 40 Z" fill="#c8d8a8" />
            <path d="M 50 80 L 100 75 L 130 90 L 140 120 L 110 140 L 70 140 L 40 130 L 35 100 Z" fill="#d4c5a0" />
            <path d="M 180 40 L 230 35 L 250 55 L 240 80 L 210 90 L 185 75 L 175 55 Z" fill="#d4c5a0" />
            <circle cx="215" cy="65" r="8" fill="#1a6b3a" opacity="0.9" />
            <text x="215" y="69" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">🕋</text>
            <circle cx="90" cy="35" r="5" fill="#1a6b3a" />
            <line x1="90" y1="35" x2="210" y2="60" stroke="#1a6b3a" strokeWidth="2" strokeDasharray="5 3" markerEnd="url(#arrow)" />
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 Z" fill="#1a6b3a" />
              </marker>
            </defs>
            <text x="90" y="28" textAnchor="middle" fill="#1a3a1a" fontSize="8" fontWeight="bold">{city.label}</text>
            <text x="225" y="58" fill="#1a3a1a" fontSize="7">La Mecque</text>
          </svg>
        </div>

        {/* iOS Permission Button */}
        {needsIOSPermission && (
          <div className="text-center">
            <Button
              onClick={requestIOSPermission}
              className="bg-green-700 hover:bg-green-800 text-white gap-2"
            >
              🧭 Activer la boussole
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Autorisez l'accès à la boussole pour une orientation en temps réel
            </p>
          </div>
        )}

        {/* Compass */}
        <div className="flex items-center justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            {/* Rotating compass ring */}
            <svg
              width={size}
              height={size}
              style={{ transform: `rotate(${compassRotation}deg)` }}
              className="absolute inset-0 transition-none"
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

            {/* Fixed Qibla pointer */}
            <svg width={size} height={size} className="absolute inset-0">
              <g transform={`rotate(${qiblaPointerRotation}, ${cx}, ${cy})`}>
                <polygon
                  points={`${cx},${cy - r + 30} ${cx - 6},${cy + 20} ${cx},${cy + 10} ${cx + 6},${cy + 20}`}
                  fill="white"
                  opacity="0.95"
                />
                <text x={cx} y={cy - r + 45} textAnchor="middle" fontSize="16">🕋</text>
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
          {deviceHeading !== null && (
            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
              Cap actuel : {Math.round(deviceHeading)}° — Orientez le haut du téléphone vers 🕋
            </p>
          )}
          {((!compassSupported && !needsIOSPermission) || permissionDenied) && (
            <p className="text-xs text-muted-foreground mt-1">
              Boussole non disponible sur cet appareil. Orientez-vous à <strong>{Math.round(qiblaAngle)}°</strong> depuis le Nord.
            </p>
          )}
          {deviceHeading === null && compassSupported && !needsIOSPermission && !permissionDenied && (
            <p className="text-xs text-muted-foreground mt-1">
              Recherche de la boussole…
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QiblaCompass;
