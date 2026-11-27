/**
 * 🕌 Degré d'authenticité d'un hadith (règle n°1 de Nadia, 2026-11-27 : « dans TOUTE l'appli sans exception »).
 * Logique SANS React (utilisable par les données, les tests et les textes) ; la pastille est dans
 * `src/components/shared/DegreAuthenticite.tsx`.
 * - SAHIH (صحيح) · Authentique · HASAN (حسن) · Bon · DA'IF (ضعيف) · Faible · MAWDOU' (موضوع) · Inventé
 * - « avis divergents » : les spécialistes du hadith ne sont pas d'accord → on l'écrit, on ne choisit pas au hasard.
 * - Le Coran n'a pas de degré : pastille « CORAN ».
 * En base : colonnes `degre` (sahih / hasan / daif / mawdou / coran, vide autorisé) + `degre_divergence` (phrase courte).
 */
export type Degre = 'sahih' | 'hasan' | 'daif' | 'mawdou' | 'coran';

export const LISTE_DEGRES: Degre[] = ['sahih', 'hasan', 'daif', 'mawdou', 'coran'];

export interface InfoDegre {
  nom: string; ar: string; fr: string; sens: string;
  /** Pastille : fond plein + texte foncé + liseré (lisible de jour comme de nuit) */
  classe: string;
  /** Couleur de la carte « 📊 Niveaux d'authenticité » (mêmes teintes que la pastille) */
  carte: string;
  emoji: string;
}

export const DEGRES: Record<Degre, InfoDegre> = {
  sahih: {
    nom: 'SAHIH', ar: 'صحيح', fr: 'Authentique', sens: 'Hadith reconnu authentique.', emoji: '🟢',
    classe: 'bg-emerald-100 text-emerald-900 ring-emerald-400 dark:bg-emerald-800 dark:text-emerald-50 dark:ring-emerald-400',
    carte: 'from-emerald-100 to-emerald-50 border-emerald-300 text-emerald-950 dark:from-emerald-900 dark:to-emerald-950 dark:border-emerald-600 dark:text-emerald-50',
  },
  hasan: {
    nom: 'HASAN', ar: 'حسن', fr: 'Bon', sens: 'Hadith fiable, mais dont le degré est inférieur au Sahih.', emoji: '🔵',
    classe: 'bg-sky-100 text-sky-900 ring-sky-400 dark:bg-sky-800 dark:text-sky-50 dark:ring-sky-400',
    carte: 'from-sky-100 to-sky-50 border-sky-300 text-sky-950 dark:from-sky-900 dark:to-sky-950 dark:border-sky-600 dark:text-sky-50',
  },
  daif: {
    nom: "DA'IF", ar: 'ضعيف', fr: 'Faible', sens: 'Hadith présentant une faiblesse dans sa chaîne de transmission ou sa transmission.', emoji: '🟠',
    classe: 'bg-amber-100 text-amber-900 ring-amber-400 dark:bg-amber-800 dark:text-amber-50 dark:ring-amber-400',
    carte: 'from-amber-100 to-amber-50 border-amber-300 text-amber-950 dark:from-amber-900 dark:to-amber-950 dark:border-amber-600 dark:text-amber-50',
  },
  mawdou: {
    nom: "MAWDOU'", ar: 'موضوع', fr: 'Inventé', sens: 'Hadith fabriqué et faussement attribué au Prophète ﷺ.', emoji: '🔴',
    classe: 'bg-rose-100 text-rose-900 ring-rose-400 dark:bg-rose-800 dark:text-rose-50 dark:ring-rose-400',
    carte: 'from-rose-100 to-rose-50 border-rose-300 text-rose-950 dark:from-rose-900 dark:to-rose-950 dark:border-rose-600 dark:text-rose-50',
  },
  coran: {
    nom: 'CORAN', ar: 'قرآن', fr: 'Le Saint Coran', sens: "Parole d'Allah.", emoji: '📖',
    classe: 'bg-violet-100 text-violet-900 ring-violet-400 dark:bg-violet-800 dark:text-violet-50 dark:ring-violet-400',
    carte: 'from-violet-100 to-violet-50 border-violet-300 text-violet-950 dark:from-violet-900 dark:to-violet-950 dark:border-violet-600 dark:text-violet-50',
  },
};

/** Valeur lue en base (texte libre) → degré connu, sinon null */
export function normaliserDegre(v: unknown): Degre | null {
  return typeof v === 'string' && (LISTE_DEGRES as string[]).includes(v) ? (v as Degre) : null;
}

const sansAccents = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'");

/** La source cite-t-elle le Coran (« Coran 2:255 », « Sourate Al-Baqara, verset 185 ») ? */
export function estCoran(source: string | null | undefined): boolean {
  return /\bcoran\b|\bsourate\b|qur'?an|\bverset/.test(sansAccents(source || ''));
}

/** La source cite-t-elle Al-Boukhârî ou Mouslim (dans leur Sahih) ? */
const estBoukhariMouslim = (s: string) => /boukh|bukh|bokh|mouslim|muslim/.test(s);

/** Degrés écrits en toutes lettres dans la source (« jugé authentique par Al-Albânî », « hasan sahîh », « faible »…) */
function degresEcrits(s: string): Degre[] {
  const t = s.replace(/sahih (al-)?(boukh|bukh|mouslim|muslim)\w*/g, ''); // « Sahih Boukhari » = le nom du livre
  const motifs: [Degre, RegExp][] = [
    ['sahih', /hasan sahih|authentique|\bsahih\b/],
    ['hasan', /\bhasan\b(?! sahih)/],
    ['daif', /faible|\bda'?if\b|\bdhaif\b/],
    ['mawdou', /invente|\bmawd(o|ou|u)'?\b|fabrique/],
  ];
  // Dans l'ordre où ils sont écrits (le 1er cité = l'avis principal)
  return motifs.map(([d, r]) => ({ d, i: t.search(r) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i).map((x) => x.d);
}

/**
 * Devine le degré d'après une source écrite, quand la base ne le donne pas :
 * - Al-Boukhârî ou Mouslim → SAHIH (même si un autre recueil est aussi cité) ;
 * - degré écrit en toutes lettres (« jugé hasan par Al-Albânî ») → ce degré (le 1er cité) ;
 * - seulement le Coran → CORAN ;
 * - autre recueil sans degré écrit (Abou Dâwoud, At-Tirmidhî…) → null : on n'invente rien.
 */
export function degreDeSource(source: string | null | undefined): Degre | null {
  const s = sansAccents(source || '');
  if (!s.trim()) return null;
  if (estBoukhariMouslim(s)) return 'sahih';
  const ecrits = degresEcrits(s);
  if (ecrits.length) return ecrits[0];
  if (estCoran(s)) return 'coran';
  return null;
}

/** Plusieurs degrés différents écrits dans la même source (« authentique selon X, faible selon Y ») = avis divergents */
export function divergenceDansSource(source: string | null | undefined): boolean {
  const s = sansAccents(source || '');
  if (estBoukhariMouslim(s)) return false;
  return new Set(degresEcrits(s)).size > 1;
}

/**
 * Ce qu'il faut afficher pour une citation : le degré donné en base, sinon celui de la source ;
 * `coranAussi` = la source cite AUSSI le Coran (verset + hadith : 2 pastilles).
 */
export function degreAffiche(source: string | null | undefined, degre?: string | null): { degre: Degre | null; coranAussi: boolean; divergenceSource: boolean } {
  const d = normaliserDegre(degre) ?? degreDeSource(source);
  return { degre: d, coranAussi: d !== null && d !== 'coran' && estCoran(source), divergenceSource: !normaliserDegre(degre) && divergenceDansSource(source) };
}

/** Texte court pour un message sans pastille (notification, quiz) : « SAHIH · Authentique » */
export function texteDegre(d: Degre | null | undefined): string {
  return d ? `${DEGRES[d].nom} · ${DEGRES[d].fr}` : '';
}
