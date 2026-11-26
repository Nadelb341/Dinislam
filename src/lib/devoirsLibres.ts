/**
 * 📝 Devoirs libres (Nadia, 2026-11-26, organisation « C. Des modèles prêts à remplir ») : des devoirs qu'elle prépare
 * elle-même (dictée, texte à lire, vidéo + questions…), donnés en général à un GROUPE entier.
 * - En base : `devoirs.type = 'libre'` + `libre_modele`, UNE ligne par élève (comme les autres devoirs), les copies d'un même
 *   devoir partagent `libre_lot` ; `libre_groupe` = le groupe visé (jamais `group_id` : la règle de lecture montrerait le
 *   devoir aux élèves décochés).
 * - L'élève répond selon le modèle : photo, texte, audio et/ou réponses aux questions (`devoirs_rendus.reponse_texte`, `reponses`).
 * Ce fichier ne contient que de la logique (sans écran), testée dans devoirsLibres.test.ts.
 */

export type ModeleLibre = 'dictee' | 'texte' | 'video' | 'fiche' | 'ecriture' | 'libre';
export type FormeReponse = 'texte' | 'photo' | 'audio' | 'questions';

export interface DefModele {
  cle: ModeleLibre;
  emoji: string;
  label: string;
  /** Petite phrase sous la tuile */
  aide: string;
  /** Texte proposé pour le devoir (modifiable) */
  titreParDefaut: string;
  /** Formes de réponse de l'élève (Libre : choisies par Nadia, voici celles cochées au départ) */
  formes: FormeReponse[];
  /** true : l'élève doit envoyer TOUTES les formes ; false : une seule suffit (ex. dictée : photo OU texte) */
  toutes: boolean;
  /** Couleurs vives de la tuile (jamais fades) */
  tuile: string;
}

export const MODELES_LIBRES: DefModele[] = [
  { cle: 'dictee', emoji: '🎤', label: 'Dictée', aide: 'Il écoute, il écrit, il envoie une photo ou le texte',
    titreParDefaut: "Faire la dictée et m'envoyer une photo", formes: ['photo', 'texte'], toutes: false,
    tuile: 'from-rose-100 to-pink-200 border-pink-400 text-pink-950 dark:from-pink-950/60 dark:to-rose-900/50 dark:border-pink-700 dark:text-pink-50' },
  { cle: 'texte', emoji: '📖', label: 'Texte à lire', aide: 'Il lit le texte et s’enregistre',
    titreParDefaut: "Lire le texte et m'envoyer un audio 🎙️", formes: ['audio'], toutes: true,
    tuile: 'from-amber-100 to-orange-200 border-orange-400 text-orange-950 dark:from-orange-950/60 dark:to-amber-900/50 dark:border-orange-700 dark:text-orange-50' },
  { cle: 'video', emoji: '🎬', label: 'Vidéo + questions', aide: 'Il regarde la vidéo et répond aux questions',
    titreParDefaut: 'Regarder la vidéo et répondre aux questions', formes: ['questions'], toutes: true,
    tuile: 'from-violet-100 to-purple-200 border-violet-400 text-violet-950 dark:from-violet-950/60 dark:to-purple-900/50 dark:border-violet-700 dark:text-violet-50' },
  { cle: 'fiche', emoji: '📄', label: 'Fiche à remplir', aide: 'Il remplit la fiche et envoie une photo',
    titreParDefaut: "Remplir la fiche et m'envoyer une photo", formes: ['photo'], toutes: true,
    tuile: 'from-sky-100 to-cyan-200 border-sky-400 text-sky-950 dark:from-sky-950/60 dark:to-cyan-900/50 dark:border-sky-700 dark:text-sky-50' },
  { cle: 'ecriture', emoji: '✍️', label: 'Écriture', aide: 'Il écrit, puis envoie le texte ou une photo',
    titreParDefaut: "Écrire et m'envoyer mon travail", formes: ['texte', 'photo'], toutes: false,
    tuile: 'from-emerald-100 to-green-200 border-emerald-400 text-emerald-950 dark:from-emerald-950/60 dark:to-green-900/50 dark:border-emerald-700 dark:text-emerald-50' },
  { cle: 'libre', emoji: '🧩', label: 'Libre', aide: 'Tout est possible, tu choisis sa réponse',
    titreParDefaut: '', formes: ['texte'], toutes: true,
    tuile: 'from-fuchsia-100 to-indigo-200 border-fuchsia-400 text-fuchsia-950 dark:from-fuchsia-950/60 dark:to-indigo-900/50 dark:border-fuchsia-700 dark:text-fuchsia-50' },
];

export const LABEL_MATIERE_LIBRE = 'Devoirs libres';
export const EMOJI_MATIERE_LIBRE = '📝';
export const MAX_QUESTIONS = 5;

export const modeleDe = (cle: string | null | undefined): DefModele =>
  MODELES_LIBRES.find((m) => m.cle === cle) ?? MODELES_LIBRES[MODELES_LIBRES.length - 1];

/** Étiquette montrée à Nadia dans les corrections : « 📝 Devoirs libres · Dictée » */
export const etiquetteLibre = (cle: string | null | undefined) => `${EMOJI_MATIERE_LIBRE} ${LABEL_MATIERE_LIBRE} · ${modeleDe(cle).label}`;

export const LIBELLE_FORME: Record<FormeReponse, string> = {
  texte: '✏️ Texte écrit', photo: '📷 Photo', audio: '🎙️ Audio', questions: '❓ Réponses aux questions',
};

/** Ce que l'élève doit renvoyer pour un devoir libre */
export interface RegleReponse { formes: FormeReponse[]; toutes: boolean }

export function regleReponse(d: { libre_modele?: string | null; reponses_attendues?: string[] | null }): RegleReponse {
  const m = modeleDe(d.libre_modele);
  const choisies = (d.reponses_attendues || []).filter((f): f is FormeReponse => f in LIBELLE_FORME);
  return { formes: choisies.length ? choisies : m.formes, toutes: m.toutes };
}

export interface ReponseEleve { texte: string; nbPhotos: number; audio: boolean; reponses: string[] }

/** Formes encore manquantes ([] = l'élève peut envoyer) */
export function formesManquantes(regle: RegleReponse, r: ReponseEleve, nbQuestions: number): FormeReponse[] {
  const fait = (f: FormeReponse) => {
    if (f === 'texte') return r.texte.trim().length > 0;
    if (f === 'photo') return r.nbPhotos > 0;
    if (f === 'audio') return r.audio;
    return nbQuestions === 0 || (r.reponses.length >= nbQuestions && r.reponses.slice(0, nbQuestions).every((x) => x.trim()));
  };
  const manque = regle.formes.filter((f) => !fait(f));
  if (regle.toutes) return manque;
  return manque.length === regle.formes.length ? manque : [];
}

/** Phrase pour l'élève : « Envoie une photo ou ton texte », « Envoie ton audio et tes réponses »… */
export function phraseReponse(regle: RegleReponse): string {
  const mots: Record<FormeReponse, string> = { texte: 'ton texte', photo: 'une photo de ton travail', audio: 'ton audio', questions: 'tes réponses aux questions' };
  const l = regle.formes.map((f) => mots[f]);
  if (!l.length) return '';
  const fin = l.length === 1 ? l[0] : `${l.slice(0, -1).join(', ')} ${regle.toutes ? 'et' : 'ou'} ${l[l.length - 1]}`;
  return `Envoie ${fin}`;
}

/** Questions écrites par Nadia (vides retirées, 5 au plus) */
export const questionsDe = (v: unknown): string[] =>
  (Array.isArray(v) ? v : []).map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, MAX_QUESTIONS);

export const reponsesDe = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x ?? '')) : []);

// ——— Pastilles rouges des tuiles ———
export interface DevoirLibreLigne {
  id: string;
  type: string;
  libre_modele?: string | null;
  libre_lot?: string | null;
  libre_groupe?: string | null;
  date_limite?: string | null;
  student_id?: string | null;
}

/** Les copies d'un même devoir libre (une par élève) ; un devoir sans lot compte seul */
export const cleLot = (d: Pick<DevoirLibreLigne, 'id' | 'libre_lot'>) => d.libre_lot || d.id;

/**
 * ⭐ LA règle des pastilles (une seule fonction à changer si Nadia en décide autrement) :
 * un devoir libre est « en cours » tant que sa date à rendre n'est pas passée (sans date = en cours).
 */
export function estEnCours(d: Pick<DevoirLibreLigne, 'date_limite'>, now: Date): boolean {
  return !d.date_limite || new Date(d.date_limite).getTime() > now.getTime();
}

/** Un devoir libre de CE groupe (`null` = écran « Général » : les devoirs libres donnés sans groupe) */
export const duGroupe = (d: Pick<DevoirLibreLigne, 'libre_groupe'>, groupeId: string | null) => (d.libre_groupe ?? null) === (groupeId ?? null);

/** Nombre de devoirs libres en cours par modèle, pour un groupe (chaque devoir compte UNE fois, pas une fois par élève) */
export function compterEnCours(devoirs: DevoirLibreLigne[], groupeId: string | null, now: Date): Record<ModeleLibre, number> {
  const out = Object.fromEntries(MODELES_LIBRES.map((m) => [m.cle, 0])) as Record<ModeleLibre, number>;
  const vus = new Set<string>();
  for (const d of devoirs) {
    if (d.type !== 'libre' || !duGroupe(d, groupeId) || !estEnCours(d, now)) continue;
    const k = cleLot(d);
    if (vus.has(k)) continue;
    vus.add(k);
    out[modeleDe(d.libre_modele).cle] += 1;
  }
  return out;
}

/** Les devoirs libres d'un groupe rassemblés par lot (le plus récent en premier) */
export function lotsDuGroupe<T extends DevoirLibreLigne & { created_at?: string | null }>(devoirs: T[], groupeId: string | null): { cle: string; copies: T[] }[] {
  const lots = new Map<string, T[]>();
  for (const d of devoirs) {
    if (d.type !== 'libre' || !duGroupe(d, groupeId)) continue;
    const k = cleLot(d);
    lots.set(k, [...(lots.get(k) || []), d]);
  }
  return [...lots.entries()].map(([cle, copies]) => ({ cle, copies }))
    .sort((a, b) => new Date(b.copies[0].created_at || 0).getTime() - new Date(a.copies[0].created_at || 0).getTime());
}

// ——— Ordre des lignes côté élève ———
/** « 📌 Devoirs à faire » : les devoirs libres en PREMIER (au-dessus des sourates), le reste garde son ordre */
export function ordreLignesEleve<T extends { type: string }>(liste: T[]): T[] {
  return liste.map((d, i) => ({ d, i })).sort((a, b) => (a.d.type === 'libre' ? 0 : 1) - (b.d.type === 'libre' ? 0 : 1) || a.i - b.i).map((x) => x.d);
}

// ——— Brouillon du formulaire (un par groupe) ———
export interface FormLibre {
  modele: ModeleLibre;
  titre: string;
  consigne: string;
  formes: FormeReponse[];
  questions: string[];
  video_lien: string;
  pj: { path: string; name: string; type: string }[];
  consigne_audio_url: string | null;
  exclus: string[];
}
export const CLE_BROUILLON_LIBRE = 'dinislam_devoir_libre_';
/** Réponse écrite de l'élève pas encore envoyée (clé : préfixe + id du devoir) */
export const CLE_REPONSE_LIBRE = 'dinislam_reponse_libre_';
export const cleBrouillonLibre = (groupeId: string | null) => `${CLE_BROUILLON_LIBRE}${groupeId ?? 'general'}`;

export const formLibreVide = (modele: ModeleLibre): FormLibre => {
  const m = modeleDe(modele);
  return { modele, titre: m.titreParDefaut, consigne: '', formes: [...m.formes], questions: modele === 'video' ? [''] : [], video_lien: '', pj: [], consigne_audio_url: null, exclus: [] };
};

export const formLibreRempli = (f: FormLibre | null | undefined) => !!f && (
  (!!f.titre.trim() && f.titre.trim() !== modeleDe(f.modele).titreParDefaut) || !!f.consigne.trim() || f.questions.some((q) => q.trim())
  || !!f.video_lien.trim() || f.pj.length > 0 || !!f.consigne_audio_url);

/** Ce qui manque pour donner le devoir (vide = prêt) */
export function manquesFormulaire(f: FormLibre): string[] {
  const m: string[] = [];
  if (!f.titre.trim()) m.push('le texte du devoir');
  if (f.modele === 'dictee' && !f.consigne_audio_url) m.push("l'audio de la dictée");
  if (f.modele === 'texte' && !f.consigne.trim() && !f.pj.length) m.push('le texte ou un document à lire');
  if (f.modele === 'video' && !f.video_lien.trim() && !f.pj.some((p) => (p.type || '').startsWith('video/'))) m.push('la vidéo (lien ou fichier)');
  if (f.modele === 'video' && !questionsDe(f.questions).length) m.push('au moins une question');
  if (f.modele === 'fiche' && !f.pj.length) m.push('la fiche (PDF ou image)');
  if (f.modele === 'libre' && !f.formes.length) m.push('la forme de la réponse');
  return m;
}

/** Colonnes du devoir à partir du formulaire (communes à toutes les copies) */
export function colonnesDuFormulaire(f: FormLibre) {
  const regle = f.modele === 'libre' ? f.formes : modeleDe(f.modele).formes;
  const questions = f.modele === 'video' || f.modele === 'libre' ? questionsDe(f.questions) : [];
  const formes = questions.length && !regle.includes('questions') ? [...regle, 'questions' as FormeReponse] : regle;
  return {
    titre: f.titre.trim(), description: f.consigne.trim() || null, libre_modele: f.modele,
    reponses_attendues: formes, questions, video_lien: f.video_lien.trim() || null,
    pieces_jointes: f.pj, consigne_audio_url: f.consigne_audio_url, audio_requis: formes.includes('audio'),
  };
}
