import { useState, useEffect, useCallback } from 'react';

export interface PrayerTimesData {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  fajrDate: Date;
  sunriseDate: Date;
  dhuhrDate: Date;
  asrDate: Date;
  maghribDate: Date;
  ishaDate: Date;
}

export interface CityOption {
  label: string;
  country: string;
  lat: number;
  lon: number;
}

export const CITIES: CityOption[] = [
  { label: 'Montpellier', country: 'FR', lat: 43.6117, lon: 3.8767 },
  { label: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 },
  { label: 'Lyon', country: 'FR', lat: 45.7640, lon: 4.8357 },
  { label: 'Marseille', country: 'FR', lat: 43.2965, lon: 5.3698 },
  { label: 'Toulouse', country: 'FR', lat: 43.6047, lon: 1.4442 },
  { label: 'Bordeaux', country: 'FR', lat: 44.8378, lon: -0.5792 },
  { label: 'Nantes', country: 'FR', lat: 47.2184, lon: -1.5536 },
  { label: 'Strasbourg', country: 'FR', lat: 48.5734, lon: 7.7521 },
  { label: 'Lille', country: 'FR', lat: 50.6292, lon: 3.0573 },
  { label: 'Nice', country: 'FR', lat: 43.7102, lon: 7.2620 },
  { label: 'Rennes', country: 'FR', lat: 48.1173, lon: -1.6778 },
  { label: 'Grenoble', country: 'FR', lat: 45.1885, lon: 5.7245 },
  { label: 'Bruxelles', country: 'BE', lat: 50.8503, lon: 4.3517 },
  { label: 'Genève', country: 'CH', lat: 46.2044, lon: 6.1432 },
  { label: 'Londres', country: 'GB', lat: 51.5074, lon: -0.1278 },
  { label: 'Madrid', country: 'ES', lat: 40.4168, lon: -3.7038 },
  { label: 'La Mecque', country: 'SA', lat: 21.3891, lon: 39.8579 },
  { label: 'Alger', country: 'DZ', lat: 36.7372, lon: 3.0863 },
  { label: 'Casablanca', country: 'MA', lat: 33.5731, lon: -7.5898 },
  { label: 'Tunis', country: 'TN', lat: 36.8065, lon: 10.1815 },
];

function parseTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function usePrayerTimesCity(city: CityOption) {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();

      // Method 2 = ISNA, method 12 = UOIF (France)
      const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${city.lat}&longitude=${city.lon}&method=12`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erreur API');
      const json = await res.json();
      const t = json.data.timings;

      const fajr = t.Fajr;
      const sunrise = t.Sunrise;
      const dhuhr = t.Dhuhr;
      const asr = t.Asr;
      const maghrib = t.Maghrib;
      const isha = t.Isha;

      setPrayerTimes({
        fajr,
        sunrise,
        dhuhr,
        asr,
        maghrib,
        isha,
        fajrDate: parseTime(fajr),
        sunriseDate: parseTime(sunrise),
        dhuhrDate: parseTime(dhuhr),
        asrDate: parseTime(asr),
        maghribDate: parseTime(maghrib),
        ishaDate: parseTime(isha),
      });
    } catch (e) {
      setError('Impossible de charger les horaires');
    } finally {
      setLoading(false);
    }
  }, [city.lat, city.lon]);

  useEffect(() => {
    fetchTimes();
    // Refresh at midnight
    const now = new Date();
    const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const timeout = setTimeout(fetchTimes, msToMidnight);
    return () => clearTimeout(timeout);
  }, [fetchTimes]);

  const getNextPrayer = useCallback(() => {
    if (!prayerTimes) return null;
    const now = new Date();
    const prayers = [
      { name: 'Sobh (Fajr)', arabic: 'الفجر', date: prayerTimes.fajrDate, time: prayerTimes.fajr },
      { name: 'Lever du soleil', arabic: 'الشروق', date: prayerTimes.sunriseDate, time: prayerTimes.sunrise },
      { name: 'Dohr', arabic: 'الظهر', date: prayerTimes.dhuhrDate, time: prayerTimes.dhuhr },
      { name: 'Asr', arabic: 'العصر', date: prayerTimes.asrDate, time: prayerTimes.asr },
      { name: 'Maghreb', arabic: 'المغرب', date: prayerTimes.maghribDate, time: prayerTimes.maghrib },
      { name: 'Icha', arabic: 'العشاء', date: prayerTimes.ishaDate, time: prayerTimes.isha },
    ];
    for (const p of prayers) {
      if (p.date > now) return p;
    }
    return prayers[0]; // Tomorrow's fajr
  }, [prayerTimes]);

  return { prayerTimes, loading, error, getNextPrayer };
}

export function calculateQiblaDirection(lat: number, lon: number): number {
  // Kaaba coordinates
  const kaabaLat = 21.3891 * (Math.PI / 180);
  const kaabaLon = 39.8579 * (Math.PI / 180);
  const userLat = lat * (Math.PI / 180);
  const dLon = kaabaLon - lon * (Math.PI / 180);

  const x = Math.sin(dLon) * Math.cos(kaabaLat);
  const y = Math.cos(userLat) * Math.sin(kaabaLat) - Math.sin(userLat) * Math.cos(kaabaLat) * Math.cos(dLon);
  const bearing = Math.atan2(x, y) * (180 / Math.PI);
  return (bearing + 360) % 360;
}
