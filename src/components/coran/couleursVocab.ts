/** 🎨 Couleurs des sous-cartes du Vocabulaire du Coran (une couleur vive par carte, jamais fade) */
export const COULEURS_VOCAB: Record<string, { degrade: string; doux: string; texte: string }> = {
  emerald: { degrade: 'from-emerald-500 to-teal-700', doux: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800', texte: 'text-emerald-700 dark:text-emerald-300' },
  violet: { degrade: 'from-violet-500 to-purple-800', doux: 'bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800', texte: 'text-violet-700 dark:text-violet-300' },
  sky: { degrade: 'from-sky-500 to-blue-700', doux: 'bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800', texte: 'text-sky-700 dark:text-sky-300' },
  amber: { degrade: 'from-amber-500 to-orange-700', doux: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800', texte: 'text-amber-700 dark:text-amber-300' },
  rose: { degrade: 'from-rose-500 to-red-700', doux: 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800', texte: 'text-rose-700 dark:text-rose-300' },
  bordeaux: { degrade: 'from-[#7a1d22] to-[#561216]', doux: 'bg-[#fbf3ee] border-[#e6d9cc] dark:bg-[#221413] dark:border-[#3a2523]', texte: 'text-[#7a1d22] dark:text-[#e08a8f]' },
};
export const couleurVocab = (c: string | null) => COULEURS_VOCAB[c || ''] ?? COULEURS_VOCAB.sky;
