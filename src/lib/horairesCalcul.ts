import { CalculationMethod, CalculationParameters, Coordinates, HighLatitudeRule, PrayerTimes } from 'adhan';

/**
 * 🕌 Horaires de prière calculés DANS l'appli (Nadia, 2026-11-15, solution B) : gratuit, sans Internet, pour n'importe quelle ville.
 * Remplace le service en ligne aladhan. Même calcul côté serveur (fonction `prayer-reminders`, npm:adhan@4.4.3) : mêmes heures partout.
 * Méthodes : 3 = MWL (Fajr 18°, Icha 17°), 12 = UOIF (12° / 12°), 2 = ISNA (15° / 15°),
 * 99 = AMCES (mosquée de Clermont-l'Hérault) : Fajr 15°, Icha = Maghrib + 80 min. Règle retrouvée le 2026-11-16 sur son calendrier 2026
 * (366 jours : écart ≤ 1 min, Asr ≤ 2 min) → son calendrier se refait tout seul chaque année (Nadia : « fais-le automatiquement »).
 */
export const METHODE_AMCES = 99;
export function parametres(methode: number): CalculationParameters {
  const p = methode === 12 || methode === METHODE_AMCES ? CalculationMethod.Other() : methode === 2 ? CalculationMethod.NorthAmerica() : CalculationMethod.MuslimWorldLeague();
  if (methode === 12) { p.fajrAngle = 12; p.ishaAngle = 12; }
  if (methode === METHODE_AMCES) { p.fajrAngle = 15; p.ishaInterval = 80; }
  // Été en France : le Fajr à 18° n'existe pas certaines nuits → règle « selon l'angle » (comme aladhan)
  p.highLatitudeRule = HighLatitudeRule.TwilightAngle;
  return p;
}

export type HorairesTexte = { fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string };

const hhmm = (d: Date, fuseau?: string) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false, ...(fuseau ? { timeZone: fuseau } : {}) });

export function calculerHoraires(lat: number, lon: number, methode: number, jour = new Date(), fuseau?: string): HorairesTexte {
  const t = new PrayerTimes(new Coordinates(lat, lon), jour, parametres(methode));
  return { fajr: hhmm(t.fajr, fuseau), sunrise: hhmm(t.sunrise, fuseau), dhuhr: hhmm(t.dhuhr, fuseau), asr: hhmm(t.asr, fuseau), maghrib: hhmm(t.maghrib, fuseau), isha: hhmm(t.isha, fuseau) };
}
