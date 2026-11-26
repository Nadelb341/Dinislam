/**
 * 🎙️ Voix fabriquées UNE SEULE FOIS puis gardées dans l'appli (choix de Nadia du 26/11) : gratuit, et sans Internet
 * une fois entendues (le service worker garde chaque fichier de /sons/voix/ dès la 1re écoute).
 *   - Jamal (arabe ar-MA-JamalNeural, français fr-FR-RemyMultilingualNeural) : cartes des tout-petits (arabe ou titre)
 *     et quiz sonores des tout-petits (question + réponses).
 *   - Hamed (arabe ar-SA-HamedNeural, français fr-FR-HenriNeural) : le mot arabe du jour (cache-cache).
 *   - Les invocations des tout-petits ne changent PAS (choix « On laisse » du 26/11) : elles gardent `parler`.
 * Ordre : la voix enregistrée de Nadia (géré par l'appelant) → le fichier fabriqué → la voix du téléphone (`parler`).
 * Fichiers et index refaits par `node scripts/fabriquer-voix.mjs` (nouvelles phrases seulement).
 */
import { VOIX_FABRIQUEES, type VoixFabriquee } from '@/data/voixFabriquees';
import { parler } from '@/lib/petits';

export type { VoixFabriquee };
type Langue = 'ar' | 'fr';

/**
 * Le texte tel qu'il sert de clé dans l'index : sans emoji, espaces resserrés. ⚠️ La même règle est écrite dans
 * `scripts/fabriquer-voix.mjs` (fonction `normaliser`) : les changer ENSEMBLE (un test le vérifie).
 */
export function normaliserTexteVoix(texte: string) {
  return texte.normalize('NFC')
    .replace(/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|[\u{1F3FB}-\u{1F3FF}]|\uFE0F|\u200D|\u20E3/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** L'adresse du fichier fabriqué pour ce texte, ou null s'il n'a pas (encore) été fabriqué (voix null = aucune voix fabriquée) */
export function fichierVoix(texte: string, langue: Langue, voix: VoixFabriquee | null): string | null {
  if (!voix) return null;
  const nom = VOIX_FABRIQUEES[voix]?.[langue]?.[normaliserTexteVoix(texte)];
  return nom ? `/sons/voix/${voix}/${nom}` : null;
}

let enCours: HTMLAudioElement | null = null;

/** Arrête ce qui parle déjà (un fichier fabriqué, la voix du téléphone) avant de dire autre chose */
export function arreterVoix() {
  try { enCours?.pause(); } catch { /* rien à arrêter */ }
  enCours = null;
  try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch { /* pas de voix sur cet appareil */ }
}

/**
 * Lit un fichier son (voix de Nadia ou voix fabriquée) ; s'il ne se lit pas (hors ligne et jamais entendu, fichier
 * retiré…), on passe à la suite (`siEchec`) une seule fois.
 */
export function jouerFichier(url: string, siEchec: () => void) {
  arreterVoix();
  let relais = false;
  const ensuite = () => { if (relais) return; relais = true; siEchec(); };
  try {
    const a = new Audio(url);
    enCours = a;
    a.addEventListener('error', ensuite, { once: true });
    void a.play().catch(ensuite);
  } catch { ensuite(); }
}

/** Dit ce texte avec la voix fabriquée choisie si elle existe, sinon avec la voix du téléphone (comme avant) */
export function dire(texte: string, langue: Langue, voix: VoixFabriquee | null) {
  if (!texte) return;
  const url = fichierVoix(texte, langue, voix);
  if (url) jouerFichier(url, () => parler(texte, langue));
  else { arreterVoix(); parler(texte, langue); }
}

/** Le son enregistré par Nadia en priorité (s'il est là), sinon la voix fabriquée, sinon la voix du téléphone */
export function direAvecSaVoix(audioUrl: string | null | undefined, texte: string, langue: Langue, voix: VoixFabriquee | null) {
  if (audioUrl) jouerFichier(audioUrl, () => dire(texte, langue, voix));
  else dire(texte, langue, voix);
}
