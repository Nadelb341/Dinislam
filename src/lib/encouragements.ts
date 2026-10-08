/**
 * Messages personnalisés au prénom de l'élève (demande de Nadia, 2026-10-08 : « tous les messages de l'appli »).
 * {prenom} = prénom ; {e} = « e » pour une fille ; {courageux|courageuse} = forme garçon | forme fille.
 */
export function personalize(text: string, fullName: string | null | undefined, gender?: string | null): string {
  const prenom = (fullName || '').trim().split(/\s+/)[0] || '';
  const girl = gender === 'fille';
  let out = text
    // {courageux|courageuse} : forme garçon | forme fille
    .replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, m: string, f: string) => (girl ? f : m))
    .replace(/\{e\}/g, girl ? 'e' : '');
  // Prénom inconnu : on retire « {prenom}, » ou « , {prenom} » sans laisser de virgule en trop
  if (!prenom) out = out.replace(/\{prenom\},\s*/g, '').replace(/,\s*\{prenom\}/g, '').replace(/\s*\{prenom\}/g, '');
  return out.replace(/\{prenom\}/g, prenom).replace(/\s{2,}/g, ' ').trim();
}

/** Les 24 messages d'encouragement du « chemin de la semaine » (un tiré au hasard, jamais le même 2 semaines de suite) */
export const ENCOURAGEMENTS = [
  '💪 {prenom}, chaque petit effort te rapproche du but, continue !',
  '🌱 Petit à petit, tu grandis dans ta lecture, {prenom}, machaAllah !',
  "⭐ {prenom}, « les actions les plus aimées d'Allah sont les plus régulières, même si elles sont petites. » (Al-Boukhari et Mouslim)",
  '📖 Un peu chaque jour, {prenom}, et tu verras la différence !',
  '🚀 Tu es capable de grandes choses, {prenom}, bismillah !',
  '🌟 Ton prof est fier de tes progrès, {prenom}, continue comme ça !',
  '🤲 {prenom}, commence par « Bismillah », Allah facilitera.',
  '🎯 Un objectif cette semaine, {prenom} : tu peux le faire !',
  "🧠 Répète à voix haute, {prenom}, c'est comme ça qu'on retient le mieux.",
  '⏰ {prenom}, 10 minutes par jour suffisent pour avancer.',
  '🏆 Chaque leçon validée est une victoire, {prenom} !',
  '🌙 Le soir avant de dormir, une petite révision, {prenom} ?',
  '💎 Le savoir est un trésor, {prenom}, tu en gagnes un peu chaque semaine.',
  "🐢 Pas besoin d'aller vite, {prenom}, l'important est d'avancer.",
  '✨ Tu as déjà fait beaucoup de chemin, {prenom}, bravo !',
  "📚 {prenom}, « le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne. » (Al-Boukhari)",
  "🎉 Encore un effort, {prenom}, la prochaine étape t'attend !",
  "🌈 Les erreurs font partie de l'apprentissage, {prenom}, continue !",
  '🦁 Sois {courageux|courageuse}, {prenom}, tu progresses chaque semaine !',
  '🌸 Ta régularité fait plaisir à voir, {prenom}, continue !',
  "🔑 La clé, c'est la répétition, {prenom} : relis encore une fois !",
  "🙌 {prenom}, demande à quelqu'un de t'écouter réciter, ça aide beaucoup !",
  "🕌 Inch'Allah, {prenom}, cette semaine sera une belle semaine d'apprentissage.",
  "❤️ Fais-le pour Allah, {prenom}, et Il t'aidera à retenir.",
];
