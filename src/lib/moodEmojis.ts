/**
 * Émojis selon le ton du message et la saison (demande de Nadia, 2026-10-19).
 * Style voulu : ✨💫🌟🌈🌹🌿🍁🍂🪵 + ☺️🥹😎🥳🥰😉🤗🤭 ; tristes quand le message est négatif : 🥺😔🥴😮‍💨😥😕
 */
export type Mood = 'joie' | 'triste';

const SPARKLES = ['✨', '💫', '🌟', '🌈'];
const HAPPY = ['☺️', '🥹', '😎', '🥳', '🥰', '😉', '🤗', '🤭'];
const SAD = ['🥺', '😔', '🥴', '😮‍💨', '😥', '😕'];

/** Saison en France : printemps (mars-mai), été (juin-août), automne (sept.-nov.), hiver (déc.-févr.) */
export function seasonEmojis(date = new Date()): string[] {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return ['🌸', '🌷', '🌿', '🌹'];
  if (m >= 6 && m <= 8) return ['☀️', '🌻', '🌈', '🌴'];
  if (m >= 9 && m <= 11) return ['🍁', '🍂', '🪵', '🌰'];
  return ['❄️', '⛄', '🌨️', '🧣'];
}

const pick = <T,>(arr: T[], rnd: () => number) => arr[Math.floor(rnd() * arr.length)];

/** Ajoute des émojis au bon endroit : ambiance de saison + visage selon le ton (jamais joyeux sur un message triste). */
export function withMoodEmojis(text: string, mood: Mood = 'joie', date = new Date(), rnd: () => number = Math.random): string {
  if (mood === 'triste') return `${text} ${pick(SAD, rnd)}${pick(seasonEmojis(date), rnd)}`;
  return `${pick(SPARKLES, rnd)} ${text} ${pick(HAPPY, rnd)}${pick(seasonEmojis(date), rnd)}`;
}
