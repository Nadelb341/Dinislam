/**
 * 🌅 Moment de la journée pour le « ciel des prières » (Nadia, 2026-11-26, choix A + ambiance dans toute la page) :
 * Sobh = orangé, Chourouk = entre orangé et bleu, Dhohr et Asr = bleu, Maghreb = orangé, Icha = nuit étoilée.
 * Calculé avec les vrais horaires de la ville de l'élève (marche sans Internet une fois les horaires connus).
 */
export type Moment = 'sobh' | 'chourouk' | 'dhohr' | 'asr' | 'maghreb' | 'icha';

export interface Horaires { fajrDate: Date; sunriseDate: Date; dhuhrDate: Date; asrDate: Date; maghribDate: Date; ishaDate: Date }

/** Le chourouk dure 1 h 30 après le lever du soleil, ensuite c'est le plein jour (ambiance bleue, comme Dhohr) */
export const DUREE_CHOUROUK_MS = 90 * 60 * 1000;

const minutes = (d: Date) => d.getHours() * 60 + d.getMinutes();

export function momentDe(h: Horaires, maintenant = new Date()): Moment {
  const m = minutes(maintenant);
  const fajr = minutes(h.fajrDate), lever = minutes(h.sunriseDate), asr = minutes(h.asrDate);
  const maghreb = minutes(h.maghribDate), icha = minutes(h.ishaDate);
  const finChourouk = lever + DUREE_CHOUROUK_MS / 60000;
  if (m < fajr || m >= icha) return 'icha';
  if (m < lever) return 'sobh';
  if (m < finChourouk) return 'chourouk';
  if (m < asr) return 'dhohr';
  if (m < maghreb) return 'asr';
  return 'maghreb';
}

/** Ambiance de chaque moment : voile posé sur l'image, fond de toute la page, couleur des titres */
export const AMBIANCES: Record<Moment, { nom: string; arabe: string; voile: string; filtre: string; fond: string; texte: string; etoiles: boolean; x: number; y: number }> = {
  sobh:     { nom: 'Sobh', arabe: 'الصبح', voile: 'linear-gradient(180deg,rgba(255,150,70,.55),rgba(255,190,120,.25))', filtre: 'saturate(1.15) brightness(.92)', fond: 'linear-gradient(180deg,#ffd9b3 0%,#ffeedd 45%,#fff6ec 100%)', texte: '#5a2a0c', etoiles: false, x: 9.6, y: 39.5 },
  chourouk: { nom: 'Chourouk', arabe: 'الشروق', voile: 'linear-gradient(90deg,rgba(255,160,80,.45),rgba(120,170,255,.30))', filtre: 'saturate(1.1)', fond: 'linear-gradient(135deg,#ffe0c2 0%,#e6f0ff 60%,#d8e9ff 100%)', texte: '#3a2a4a', etoiles: false, x: 26.2, y: 24.3 },
  dhohr:    { nom: 'Dhohr', arabe: 'الظهر', voile: 'linear-gradient(180deg,rgba(110,170,255,.35),rgba(170,210,255,.15))', filtre: 'saturate(1.05) brightness(1.04)', fond: 'linear-gradient(180deg,#cfe6ff 0%,#e8f3ff 50%,#f5faff 100%)', texte: '#14305e', etoiles: false, x: 49.4, y: 14.2 },
  asr:      { nom: 'Asr', arabe: 'العصر', voile: 'linear-gradient(180deg,rgba(100,160,250,.35),rgba(255,220,160,.12))', filtre: 'saturate(1.05)', fond: 'linear-gradient(180deg,#d6e8ff 0%,#eef4ff 55%,#fff4e4 100%)', texte: '#14305e', etoiles: false, x: 66.8, y: 18.6 },
  maghreb:  { nom: 'Maghreb', arabe: 'المغرب', voile: 'linear-gradient(180deg,rgba(255,120,60,.55),rgba(200,80,90,.30))', filtre: 'saturate(1.2) brightness(.9)', fond: 'linear-gradient(180deg,#ffc9a3 0%,#ffe0cc 45%,#fdeee6 100%)', texte: '#5a1f12', etoiles: false, x: 82.4, y: 33 },
  icha:     { nom: 'Icha', arabe: 'العشاء', voile: 'linear-gradient(180deg,rgba(10,14,60,.88),rgba(25,30,90,.78))', filtre: 'brightness(.75) saturate(.8)', fond: 'linear-gradient(180deg,#141a4a 0%,#1f2560 55%,#2a2f6e 100%)', texte: '#f1eeff', etoiles: true, x: 93.4, y: 47.5 },
};

/** Les 5 prières (clés de `user_daily_prayers`) dans l'ordre de la journée */
export const CINQ_PRIERES = [
  { cle: 'sobh', nom: 'Sobh', arabe: 'الصُّبْح', rakat: 2, heure: (h: Horaires) => h.fajrDate },
  { cle: 'dhuhr', nom: 'Dhohr', arabe: 'الظُّهْر', rakat: 4, heure: (h: Horaires) => h.dhuhrDate },
  { cle: 'asr', nom: 'Asr', arabe: 'العَصْر', rakat: 4, heure: (h: Horaires) => h.asrDate },
  { cle: 'maghrib', nom: 'Maghreb', arabe: 'المَغْرِب', rakat: 3, heure: (h: Horaires) => h.maghribDate },
  { cle: 'isha', nom: 'Icha', arabe: 'العِشَاء', rakat: 4, heure: (h: Horaires) => h.ishaDate },
] as const;
