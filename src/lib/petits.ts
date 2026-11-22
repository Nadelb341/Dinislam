/**
 * 🧸 Accueil du Groupe 0 (Nadia, 2026-11-22 : les 15 idées gardées) : rubriques et petits calculs.
 * Contenu en base (table petits_fiches), modifiable avec le ✏️ ; étoiles dans petits_etoiles.
 */
export type CleRubrique = 'douas' | 'coran' | 'histoires' | 'cree' | 'piliers' | 'ablutions' | 'priere' | 'manieres' | 'ramadan' | 'aid' | 'phrases' | 'prieres5';
export type ModeRubrique = 'imagier' | 'coran' | 'doigts' | 'etapes' | 'autocollants' | 'calendrier';

export interface Rubrique {
  cle: CleRubrique; titre: string; emoji: string; fond: string; mode: ModeRubrique;
  /** Bouton « je l'ai fait » qui donne une étoile (une fois par jour et par fiche) */
  etoile?: string;
}

export const RUBRIQUES: Record<CleRubrique, Rubrique> = {
  douas: { cle: 'douas', titre: 'Mes petites dou\'as', emoji: '🤲', fond: 'from-emerald-300 to-teal-500', mode: 'imagier', etoile: 'Je l\'ai dite !' },
  histoires: { cle: 'histoires', titre: 'Les histoires des prophètes', emoji: '📚', fond: 'from-sky-300 to-indigo-500', mode: 'imagier' },
  coran: { cle: 'coran', titre: 'Le Coran des petits', emoji: '📖', fond: 'from-amber-300 to-orange-500', mode: 'coran' },
  cree: { cle: 'cree', titre: 'Allah a créé…', emoji: '🌍', fond: 'from-lime-300 to-green-500', mode: 'imagier' },
  piliers: { cle: 'piliers', titre: 'Les 5 piliers', emoji: '✋', fond: 'from-violet-300 to-purple-500', mode: 'doigts' },
  ablutions: { cle: 'ablutions', titre: 'Les ablutions', emoji: '💧', fond: 'from-cyan-300 to-blue-500', mode: 'etapes' },
  priere: { cle: 'priere', titre: 'Ma prière', emoji: '🕌', fond: 'from-indigo-300 to-blue-600', mode: 'etapes' },
  manieres: { cle: 'manieres', titre: 'Les bonnes manières', emoji: '😊', fond: 'from-pink-300 to-rose-500', mode: 'autocollants', etoile: 'Je l\'ai fait aujourd\'hui !' },
  ramadan: { cle: 'ramadan', titre: 'Ramadan et l\'Aïd', emoji: '🌙', fond: 'from-indigo-400 to-slate-800', mode: 'calendrier' },
  aid: { cle: 'aid', titre: 'L\'Aïd', emoji: '🎉', fond: 'from-yellow-300 to-orange-500', mode: 'imagier' },
  phrases: { cle: 'phrases', titre: 'Les petites phrases du jour', emoji: '💬', fond: 'from-yellow-200 to-amber-400', mode: 'imagier', etoile: 'Je l\'ai dite !' },
  prieres5: { cle: 'prieres5', titre: 'Le soleil et les 5 prières', emoji: '☀️', fond: 'from-sky-300 to-amber-300', mode: 'imagier' },
};

/** Les 4 grosses tuiles (idée 4), puis les autres cartes des petits */
export const TUILES_GRANDES: { cle: string; titre: string; emoji: string; fond: string; lien: string }[] = [
  { cle: 'alphabet', titre: 'Mes lettres', emoji: '🔤', fond: 'from-orange-300 to-red-500', lien: '/alphabet' },
  { cle: 'douas', titre: 'Mes dou\'as', emoji: '🤲', fond: RUBRIQUES.douas.fond, lien: '/petits/douas' },
  { cle: 'histoires', titre: 'Histoires', emoji: '📚', fond: RUBRIQUES.histoires.fond, lien: '/petits/histoires' },
  { cle: 'jeux', titre: 'Jeux', emoji: '🎮', fond: 'from-fuchsia-300 to-purple-600', lien: '/petits/jeux' },
];
export const TUILES_AUTRES: CleRubrique[] = ['coran', 'cree', 'piliers', 'ablutions', 'priere', 'manieres', 'ramadan'];

/** « 2026-11-22 » en heure locale (une étoile par jour) */
export function cleJour(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Référence de l'étoile du jour d'une fiche (une étoile par jour et par fiche) */
export const refEtoileDuJour = (f: { id: string }) => `${f.id}:${cleJour()}`;

/** Numéro du jour dans l'année (1 à 366) */
export function jourDeLAnnee(d = new Date()) {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000);
}

/** La petite phrase du jour : change chaque jour, tourne sur toute la liste */
export function duJour<T>(liste: T[], d = new Date()): T | null {
  return liste.length ? liste[jourDeLAnnee(d) % liste.length] : null;
}

/** Moment de la journée pour le grand dessin : 0 Fajr, 1 Dohr, 2 Asr, 3 Maghrib, 4 Icha (avant le Fajr = encore la nuit) */
export function momentPriere(maintenant: Date, h: { fajrDate: Date; dhuhrDate: Date; asrDate: Date; maghribDate: Date; ishaDate: Date }) {
  const t = maintenant.getTime();
  if (t >= h.ishaDate.getTime()) return 4;
  if (t >= h.maghribDate.getTime()) return 3;
  if (t >= h.asrDate.getTime()) return 2;
  if (t >= h.dhuhrDate.getTime()) return 1;
  if (t >= h.fajrDate.getTime()) return 0;
  return 4;
}

/** Jour du Ramadan (1 à 30) d'après son 1er jour « AAAA-MM-JJ » ; < 1 avant, > 30 après */
export function jourRamadan(debut: string, maintenant = new Date()) {
  const [a, m, j] = debut.split('-').map(Number);
  if (!a || !m || !j) return 0;
  const d0 = Date.UTC(a, m - 1, j);
  const auj = Date.UTC(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  return Math.floor((auj - d0) / 86400000) + 1;
}

/** La lune qui grandit pendant le mois */
export function luneDuJour(j: number) {
  if (j <= 3) return '🌒';
  if (j <= 10) return '🌓';
  if (j <= 13) return '🌔';
  if (j <= 17) return '🌕';
  if (j <= 21) return '🌖';
  if (j <= 25) return '🌗';
  return '🌘';
}

/** Lit à voix haute (voix de l'appareil) quand l'enseignante n'a pas encore enregistré sa voix */
export function parler(texte: string, langue: 'ar' | 'fr') {
  try {
    if (!('speechSynthesis' in window) || !texte) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = langue === 'ar' ? 'ar-SA' : 'fr-FR';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch { /* pas de voix sur cet appareil */ }
}

/** Joue sa voix (fichier) sinon la voix de l'appareil (l'arabe d'abord, sinon le titre) */
export function ecouterFiche(f: { audio_url: string | null; arabe: string | null; titre: string }) {
  if (f.audio_url) { try { void new Audio(f.audio_url).play().catch(() => {}); } catch { /* son indisponible */ } return; }
  if (f.arabe) parler(f.arabe, 'ar'); else parler(f.titre, 'fr');
}
