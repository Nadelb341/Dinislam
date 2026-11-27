import type { Degre } from '@/lib/degreAuthenticite';

/**
 * 📊 Carte « Niveaux d'authenticité » (dans la carte Hadiths, 2026-11-27, règle n°1 de Nadia).
 * Contenu MODIFIABLE par Nadia (✏️) : réglage `niveaux_authenticite` de la table `reglages_appli`.
 * Ce fichier = contenu de départ (même texte que la migration 20261127180000) ET copie de secours hors ligne.
 * Phrases des niveaux = celles de Nadia (CLAUDE.md, 27/11).
 */
export interface NiveauContenu {
  cle: Exclude<Degre, 'coran'>;
  /** Phrase de Nadia */
  phrase: string;
  /** Exemple simple (texte en français) */
  exemple: string;
  /** Référence de l'exemple + qui l'a jugé */
  exemple_source: string;
  /** Petite remarque pour les élèves (facultatif) */
  note: string;
}

export interface ContenuNiveaux {
  intro: string;
  niveaux: NiveauContenu[];
  divergence: string;
  fadail: string;
  ordre_titre: string;
  ordre: string[];
  ordre_note: string;
}

export const NIVEAUX_DEPART: ContenuNiveaux = {
  intro: "Les paroles attribuées au Prophète ﷺ (les hadiths) n'ont pas toutes la même force. Les savants du hadith ont vérifié, une par une, qui les a transmises. Voici les 4 niveaux : dans l'appli, chaque hadith porte sa pastille de couleur.",
  niveaux: [
    {
      cle: 'sahih',
      phrase: 'Hadith reconnu authentique.',
      exemple: '« Les actions ne valent que par leurs intentions. »',
      exemple_source: 'Al-Boukhârî n° 1 et Mouslim n° 1907',
      note: "Tout ce qui est dans Sahîh Al-Boukhârî et Sahîh Mouslim est de ce niveau.",
    },
    {
      cle: 'hasan',
      phrase: 'Hadith fiable, mais dont le degré est inférieur au Sahih.',
      exemple: "L'invocation de la rupture du jeûne : « Dhahaba-dh-dhama'ou wabtallati-l-'ouroûq… » (La soif est partie, les veines sont humidifiées…)",
      exemple_source: "Abou Dâwoud n° 2357, jugé hasan (bon) par Ad-Dâraqoutnî et Al-Albânî",
      note: 'On peut s\'appuyer dessus.',
    },
    {
      cle: 'daif',
      phrase: 'Hadith présentant une faiblesse dans sa chaîne de transmission ou sa transmission.',
      exemple: "« Allâhoumma bârik lanâ fîmâ razaqtanâ wa qinâ 'adhâba-n-nâr » (Ô Allah, bénis ce que Tu nous as donné…), dit avant de manger.",
      exemple_source: "Ibn As-Sounnî, « 'Amal al-yawm wa-l-layla », jugé faible par les spécialistes du hadith",
      note: "Ce qui est sûr avant de manger, c'est « Bismillâh » (Al-Boukhârî n° 5376 et Mouslim n° 2022).",
    },
    {
      cle: 'mawdou',
      phrase: 'Hadith fabriqué et faussement attribué au Prophète ﷺ.',
      exemple: '« Aimer sa patrie fait partie de la foi. »',
      exemple_source: 'Déclaré inventé par As-Saghânî et Al-Albânî : ce n\'est PAS une parole du Prophète ﷺ',
      note: "On ne le dit jamais comme une parole du Prophète ﷺ.",
    },
  ],
  divergence: "En cas de divergence entre les spécialistes du hadith, on le précise au lieu de choisir arbitrairement un avis. Dans l'appli : pastille « ⚖️ Avis divergents ».",
  fadail: "Un hadith faible n'est pas automatiquement présenté comme faux : certains savants l'ont admis sous conditions dans les mérites des œuvres (Fada'il al-A'mal). Mais on ne s'en sert JAMAIS pour présenter une pratique comme une Sunna établie ou une obligation.",
  ordre_titre: "L'ordre des sources",
  ordre: [
    'Le Saint Coran',
    'Sahîh Al-Boukhârî',
    'Sahîh Mouslim',
    "Les autres recueils de hadiths authentifiés : Abou Dâwoud, At-Tirmidhî, An-Nasâ'î, Ibn Mâjah, etc.",
    "Les ouvrages de référence des savants sunnites, notamment ceux de l'école malikite",
  ],
  ordre_note: 'Les hadiths des autres recueils (4) sont toujours accompagnés de leur degré d\'authenticité et de leur référence.',
};

/** Lit le réglage en base sans jamais casser l'affichage : champ manquant = texte de départ */
export function contenuNiveaux(v: unknown): ContenuNiveaux {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<ContenuNiveaux>;
  const texte = (x: unknown, d: string) => (typeof x === 'string' ? x : d);
  const niveaux = NIVEAUX_DEPART.niveaux.map((n) => {
    const b = Array.isArray(o.niveaux) ? (o.niveaux as Partial<NiveauContenu>[]).find((x) => x && x.cle === n.cle) : undefined;
    return b ? { cle: n.cle, phrase: texte(b.phrase, n.phrase), exemple: texte(b.exemple, n.exemple), exemple_source: texte(b.exemple_source, n.exemple_source), note: texte(b.note, n.note) } : n;
  });
  return {
    intro: texte(o.intro, NIVEAUX_DEPART.intro),
    niveaux,
    divergence: texte(o.divergence, NIVEAUX_DEPART.divergence),
    fadail: texte(o.fadail, NIVEAUX_DEPART.fadail),
    ordre_titre: texte(o.ordre_titre, NIVEAUX_DEPART.ordre_titre),
    ordre: Array.isArray(o.ordre) && o.ordre.every((x) => typeof x === 'string') && o.ordre.length ? o.ordre : NIVEAUX_DEPART.ordre,
    ordre_note: texte(o.ordre_note, NIVEAUX_DEPART.ordre_note),
  };
}

/** ❓ Le petit quiz (4 questions, 2 chances) : construit d'après le contenu, donc toujours d'accord avec ce que Nadia a écrit */
export interface QuestionNiveau { question: string; choix: string[]; bonne: number; explication: string }

export function quizNiveaux(c: ContenuNiveaux): QuestionNiveau[] {
  const n = (cle: NiveauContenu['cle']) => c.niveaux.find((x) => x.cle === cle)!;
  return [
    { question: 'Que veut dire « SAHIH » (صحيح) ?', choix: ['Authentique', 'Inventé', 'Faible', 'Bon'], bonne: 0, explication: n('sahih').phrase },
    { question: 'Que veut dire « HASAN » (حسن) ?', choix: ['Faible', 'Bon', 'Authentique', 'Inventé'], bonne: 1, explication: n('hasan').phrase },
    { question: "Que veut dire « MAWDOU' » (موضوع) ?", choix: ['Bon', 'Authentique', 'Inventé', 'Faible'], bonne: 2, explication: n('mawdou').phrase },
    {
      question: "Un hadith DA'IF (faible) peut-il servir à dire qu'une pratique est une Sunna établie ou une obligation ?",
      choix: ['Oui, toujours', 'Non, jamais', 'Oui, si beaucoup de gens le disent'], bonne: 1, explication: c.fadail,
    },
  ];
}
