/** Un mot exemple illustré par lettre (idée bonus 6, 2026-10-07) — l'audio est enregistré par l'enseignante (ligne « mot »). */
/** tr : prononciation en lettres latines (mêmes repères que les lignes : ḥ ṣ ḍ ṭ ẓ ʿ q, â î oû = voyelles longues) */
export interface AlphabetWord { word: string; tr: string; fr: string; emoji: string }

export const ALPHABET_WORDS: Record<string, AlphabetWord> = {
  'ا': { word: 'أَرْنَب', tr: 'arnab', fr: 'lapin', emoji: '🐇' },
  'ب': { word: 'بَيْت', tr: 'bayt', fr: 'maison', emoji: '🏠' },
  'ت': { word: 'تُفَّاحَة', tr: 'touffâḥa', fr: 'pomme', emoji: '🍎' },
  'ث': { word: 'ثَعْلَب', tr: 'thaʿlab', fr: 'renard', emoji: '🦊' },
  'ج': { word: 'جَمَل', tr: 'jamal', fr: 'chameau', emoji: '🐪' },
  'ح': { word: 'حِصَان', tr: 'ḥiṣân', fr: 'cheval', emoji: '🐴' },
  'خ': { word: 'خَرُوف', tr: 'kharoûf', fr: 'mouton', emoji: '🐑' },
  'د': { word: 'دُبّ', tr: 'doubb', fr: 'ours', emoji: '🐻' },
  'ذ': { word: 'ذُرَة', tr: 'dhoura', fr: 'maïs', emoji: '🌽' },
  'ر': { word: 'رِيشَة', tr: 'rîcha', fr: 'plume', emoji: '🪶' },
  'ز': { word: 'زَرَافَة', tr: 'zarâfa', fr: 'girafe', emoji: '🦒' },
  'س': { word: 'سَمَكَة', tr: 'samaka', fr: 'poisson', emoji: '🐟' },
  'ش': { word: 'شَمْس', tr: 'chams', fr: 'soleil', emoji: '☀️' },
  'ص': { word: 'صَقْر', tr: 'ṣaqr', fr: 'faucon', emoji: '🦅' },
  'ض': { word: 'ضِفْدَع', tr: 'ḍifdaʿ', fr: 'grenouille', emoji: '🐸' },
  'ط': { word: 'طَائِرَة', tr: 'ṭâʾira', fr: 'avion', emoji: '✈️' },
  'ظ': { word: 'ظَرْف', tr: 'ẓarf', fr: 'enveloppe', emoji: '✉️' },
  'ع': { word: 'عَيْن', tr: 'ʿayn', fr: 'œil', emoji: '👁️' },
  'غ': { word: 'غَيْمَة', tr: 'ghayma', fr: 'nuage', emoji: '☁️' },
  'ف': { word: 'فِيل', tr: 'fîl', fr: 'éléphant', emoji: '🐘' },
  'ق': { word: 'قَمَر', tr: 'qamar', fr: 'lune', emoji: '🌙' },
  'ك': { word: 'كِتَاب', tr: 'kitâb', fr: 'livre', emoji: '📖' },
  'ل': { word: 'لَيْمُون', tr: 'laymoûn', fr: 'citron', emoji: '🍋' },
  'م': { word: 'مَوْز', tr: 'mawz', fr: 'banane', emoji: '🍌' },
  'ن': { word: 'نَحْلَة', tr: 'naḥla', fr: 'abeille', emoji: '🐝' },
  'ه': { word: 'هَدِيَّة', tr: 'hadiyya', fr: 'cadeau', emoji: '🎁' },
  'و': { word: 'وَرْدَة', tr: 'warda', fr: 'rose', emoji: '🌹' },
  'ي': { word: 'يَد', tr: 'yad', fr: 'main', emoji: '✋' },
};
