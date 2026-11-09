import { supabase } from '@/integrations/supabase/client';
import { CITIES, getSavedMethod, type CityOption } from '@/hooks/usePrayerTimesCity';

/**
 * 🕌 Rappels de prière (idée 11 de l'audit, 2026-11-09).
 * La ville et la méthode de calcul étaient seulement sur l'appareil (page Prière) : on les copie dans
 * `notification_preferences` pour que le serveur (fonction `prayer-reminders`) envoie le rappel aux bonnes heures.
 */
export const PRAYER_REMINDER_KEYS = ['fajr_reminder', 'dhuhr_reminder', 'asr_reminder', 'maghrib_reminder', 'isha_reminder'] as const;
export const AVANCES_RAPPEL = [
  { valeur: 0, label: "À l'heure" },
  { valeur: 5, label: '5 min avant' },
  { valeur: 10, label: '10 min avant' },
  { valeur: 15, label: '15 min avant' },
] as const;

/** Ville choisie sur cet appareil (même règle que l'accueil : Montpellier par défaut) */
export function villePriereDeLAppareil(): CityOption {
  try {
    const saved = localStorage.getItem('dinislam_prayer_city');
    if (saved) {
      const p = JSON.parse(saved);
      if (p?.label && typeof p.lat === 'number' && typeof p.lon === 'number') return p;
    }
  } catch { /* stockage indisponible */ }
  return CITIES.find((c) => c.label.includes('Montpellier')) ?? CITIES[0];
}

/** Champs « ville / méthode » à enregistrer pour le serveur */
export function champsVillePriere(city: CityOption = villePriereDeLAppareil(), methodeId: number = getSavedMethod().id) {
  return { priere_ville: city.label, priere_pays: city.country, priere_lat: city.lat, priere_lon: city.lon, priere_methode: methodeId };
}

/** Page Prière : ville ou méthode changée → le serveur suit (silencieux, ne bloque jamais l'écran) */
export async function enregistrerVillePriere(userId: string, city: CityOption, methodeId: number) {
  try {
    await supabase.from('notification_preferences').upsert({ user_id: userId, ...champsVillePriere(city, methodeId) }, { onConflict: 'user_id' });
  } catch { /* hors ligne : sera renvoyé au prochain changement ou au prochain réglage */ }
}
