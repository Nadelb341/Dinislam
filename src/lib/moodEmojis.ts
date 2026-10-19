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

/* ───────────── Toute l'appli (2026-10-19, demande de Nadia) ─────────────
 * Un message SANS émoji reçoit des émojis selon son ton, son sujet et la saison.
 * Un message qui a déjà un émoji n'est jamais touché (choix fait à la main).
 * ⚠️ Copie côté serveur : supabase/functions/_shared/moodEmojis.ts (garder les deux pareils).
 */
export type Tone = Mood | 'neutre';

const HAS_EMOJI = /\p{Extended_Pictographic}/u;

const NEGATIVE = /(?:^|[^\p{L}])(erreur|impossible|échec|échoué|introuvable|refus|invalide|manquant|désolé|oups|problème|attention|à refaire|pas pu|n'a pas|ne peut|non enregistré|expiré|bloqué)/iu;
const POSITIVE = /(?:^|[^\p{L}])(bravo|réussi|félicitations|merci|super|génial|validé|enregistré|ajouté|envoyé|créé|modifié|terminé|débloqué|bienvenue|mis à jour|copié|restauré|programmé)/iu;

/** Émoji du sujet du message (le premier qui correspond) */
const TOPICS: [RegExp, string][] = [
  [/pri(è|e)re|invocation/i, '🤲'],
  [/sourate|coran|verset/i, '📖'],
  [/récitation|audio|enregistrement|micro/i, '🎙️'],
  [/ramadan/i, '🌙'],
  [/nom d'allah|noms d'allah/i, '✨'],
  [/message|réponse|conversation/i, '💌'],
  [/devoir/i, '📝'],
  [/corbeille|suppr/i, '🗑️'],
  [/notification|rappel/i, '🔔'],
  [/leçon|nourania|alphabet|lettre/i, '📚'],
  [/groupe/i, '👥'],
  [/vacances/i, '🏖️'],
  [/photo|image/i, '🖼️'],
  [/vidéo/i, '🎬'],
  [/pdf|fichier|document/i, '📄'],
  [/quiz|question/i, '❓'],
  [/flashcard|vocabulaire/i, '🃏'],
  [/présence|absence/i, '📋'],
  [/connexion|mot de passe|compte/i, '🔐'],
];

export function toneOf(text: string): Tone {
  if (NEGATIVE.test(text)) return 'triste';
  if (POSITIVE.test(text)) return 'joie';
  return 'neutre';
}

export function topicEmoji(text: string): string | null {
  return TOPICS.find(([re]) => re.test(text))?.[1] ?? null;
}

/** Ajoute les émojis à un message de l'appli (rien si le message en a déjà). */
export function addMoodEmojis(text: string, tone?: Tone, date = new Date(), rnd: () => number = Math.random): string {
  if (!text || !text.trim() || HAS_EMOJI.test(text)) return text;
  const t = tone ?? toneOf(text);
  const topic = topicEmoji(text);
  if (t === 'triste') return `${text} ${pick(SAD, rnd)}${topic ?? ''}`;
  if (t === 'joie') return `${text} ${topic ?? pick(SPARKLES, rnd)}${pick(HAPPY, rnd)}${pick(seasonEmojis(date), rnd)}`;
  return `${text} ${topic ?? pick(seasonEmojis(date), rnd)}`;
}
