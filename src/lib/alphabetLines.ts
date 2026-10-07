/**
 * Les 6 lignes de la fiche d'une lettre (validées par Nadia le 2026-10-07) :
 * formes · voyelles courtes · voyelles longues · tanouines · soukoune (alif devant) · chadda (alif devant, 3 voyelles).
 * Pour le Alif, ce sont les hamzas qui portent les voyelles ; soukoune et chadda ne s'appliquent pas.
 */
export type LineKey = 'formes' | 'courtes' | 'longues' | 'tanouines' | 'soukoune' | 'chadda';

export interface LineCell { text: string; label: string }
export interface LetterLine { key: LineKey; title: string; subtitle: string; cells: LineCell[] }

export const LINE_TITLES: Record<LineKey, string> = {
  formes: 'Formes de la lettre',
  courtes: 'Voyelles courtes',
  longues: 'Voyelles longues',
  tanouines: 'Tanouines',
  soukoune: 'Soukoune',
  chadda: 'Chadda',
};

/** Couleur pastel de chaque ligne (fiche, bouclier, jeux) */
export const LINE_TONES: Record<LineKey, string> = {
  formes: 'bg-violet-50 dark:bg-violet-950/30',
  courtes: 'bg-sky-50 dark:bg-sky-950/30',
  longues: 'bg-emerald-50 dark:bg-emerald-950/30',
  tanouines: 'bg-amber-50 dark:bg-amber-950/30',
  soukoune: 'bg-rose-50 dark:bg-rose-950/30',
  chadda: 'bg-indigo-50 dark:bg-indigo-950/30',
};

const F = 'َ', K = 'ِ', D = 'ُ', S = 'ْ', SH = 'ّ';
const FT = 'ً', KT = 'ٍ', DT = 'ٌ';
const ALIF = 'ا', YA = 'ي', WAW = 'و', HAMZA_UP = 'أ', HAMZA_DOWN = 'إ', MADDA = 'آ';

/** Son de la consonne en lettres latines (points sous les emphatiques) */
const SOUND: Record<string, string> = {
  'ا': '', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'ḥ', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r',
  'ز': 'z', 'س': 's', 'ش': 'ch', 'ص': 'ṣ', 'ض': 'ḍ', 'ط': 'ṭ', 'ظ': 'ẓ', 'ع': 'ʿ', 'غ': 'gh', 'ف': 'f',
  'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y',
};

export interface LetterForLines {
  letter_arabic: string;
  position_isolated: string | null;
  position_initial: string | null;
  position_medial: string | null;
  position_final: string | null;
}

export function buildLines(l: LetterForLines): LetterLine[] {
  const L = l.letter_arabic;
  const c = SOUND[L] ?? '';
  const formes: LetterLine = {
    key: 'formes', title: LINE_TITLES.formes, subtitle: 'Isolée · Début · Milieu · Fin',
    cells: [
      { text: l.position_isolated || L, label: 'Isolée' },
      { text: l.position_initial || L, label: 'Début' },
      { text: l.position_medial || L, label: 'Milieu' },
      { text: l.position_final || L, label: 'Fin' },
    ],
  };
  if (L === ALIF) {
    return [
      formes,
      { key: 'courtes', title: LINE_TITLES.courtes, subtitle: 'a · i · ou', cells: [
        { text: HAMZA_UP + F, label: 'a' }, { text: HAMZA_DOWN + K, label: 'i' }, { text: HAMZA_UP + D, label: 'ou' }] },
      { key: 'longues', title: LINE_TITLES.longues, subtitle: 'â · î · oû', cells: [
        { text: MADDA, label: 'â' }, { text: HAMZA_DOWN + K + YA, label: 'î' }, { text: HAMZA_UP + D + WAW, label: 'oû' }] },
      { key: 'tanouines', title: LINE_TITLES.tanouines, subtitle: 'an · in · oun', cells: [
        { text: HAMZA_UP + FT, label: 'an' }, { text: HAMZA_DOWN + KT, label: 'in' }, { text: HAMZA_UP + DT, label: 'oun' }] },
    ];
  }
  return [
    formes,
    { key: 'courtes', title: LINE_TITLES.courtes, subtitle: 'a · i · ou', cells: [
      { text: L + F, label: `${c}a` }, { text: L + K, label: `${c}i` }, { text: L + D, label: `${c}ou` }] },
    { key: 'longues', title: LINE_TITLES.longues, subtitle: 'â · î · oû', cells: [
      { text: L + F + ALIF, label: `${c}â` }, { text: L + K + YA, label: `${c}î` }, { text: L + D + WAW, label: `${c}oû` }] },
    { key: 'tanouines', title: LINE_TITLES.tanouines, subtitle: 'an · in · oun', cells: [
      { text: L + FT + ALIF, label: `${c}an` }, { text: L + KT, label: `${c}in` }, { text: L + DT, label: `${c}oun` }] },
    { key: 'soukoune', title: LINE_TITLES.soukoune, subtitle: 'avec le alif devant', cells: [
      { text: HAMZA_UP + F + L + S, label: `a${c}` }] },
    { key: 'chadda', title: LINE_TITLES.chadda, subtitle: 'avec les 3 voyelles courtes', cells: [
      { text: HAMZA_UP + F + L + SH + F, label: `a${c}${c}a` },
      { text: HAMZA_UP + F + L + SH + K, label: `a${c}${c}i` },
      { text: HAMZA_UP + F + L + SH + D, label: `a${c}${c}ou` }] },
  ];
}

/**
 * Consigne d'une case pour les jeux de lecture. La lettre est TOUJOURS nommée (demande de Nadia 2026-10-07) :
 * « la voyelle courte « a » avec la lettre ب (Ba) », sinon fَ ou بَ pourraient tous deux sembler justes.
 */
export function cellPrompt(line: LetterLine, cellIndex: number, letter: { letter_arabic: string; name_french: string }): string {
  const who = `la lettre ${letter.letter_arabic} (${letter.name_french})`;
  const label = line.cells[cellIndex]?.label ?? '';
  switch (line.key) {
    case 'formes': return ({
      Isolée: `${who} toute seule`, Début: `${who} au début d'un mot`, Milieu: `${who} au milieu d'un mot`, Fin: `${who} à la fin d'un mot`,
    } as Record<string, string>)[label] ?? who;
    case 'courtes': return `la voyelle courte « ${['a', 'i', 'ou'][cellIndex]} » avec ${who}`;
    case 'longues': return `la voyelle longue « ${['â', 'î', 'oû'][cellIndex]} » avec ${who}`;
    case 'tanouines': return `le tanouine « ${['an', 'in', 'oun'][cellIndex]} » avec ${who}`;
    case 'soukoune': return `la soukoune sur ${who}`;
    case 'chadda': return `la chadda avec « ${['a', 'i', 'ou'][cellIndex]} » sur ${who}`;
  }
}

/** Cases qu'on peut demander sans ambiguïté : leur écriture n'apparaît qu'une fois dans la ligne
 *  (ex. pour د, « isolée » et « début » s'écrivent pareil → on ne les demande pas). */
export function askableCells(line: LetterLine): number[] {
  return line.cells.map((c, i) => (line.cells.filter((o) => o.text === c.text).length === 1 ? i : -1)).filter((i) => i >= 0);
}

/** Hamza sous le alif (إ) : la kasra ou le tanouine kasra s'empile dessous → ces cases ont besoin de plus de hauteur */
export const hasLowHamza = (text: string) => text.includes('\u0625') || text.includes('\u0655');
