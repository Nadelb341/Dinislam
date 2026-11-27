/**
 * 🔍 Recherche d'un des 99 noms d'Allah (demande de Nadia, 27/11/2026) : en français, en phonétique (avec ou sans accents,
 * tirets, apostrophes, « Al- »), en arabe (avec ou sans voyelles), par numéro, ou par le sens.
 * Tout est calculé sur l'appareil (marche sans Internet).
 */

export interface NomCherchable {
  id: number;
  display_order: number | null;
  name_arabic: string;
  transliteration: string | null;
  name_french: string;
  fiche_signification?: string | null;
  explanation?: string | null;
  fiche_explication?: string | null;
}

/** Voyelles et signes arabes (fatha, kasra, chadda, soukoûn, alif suscrit, tatwîl, signes du Coran) : enlevés */
const estSigneArabe = (c: string) => { const n = c.charCodeAt(0); return (n >= 0x064b && n <= 0x065f) || n === 0x0670 || n === 0x0640 || (n >= 0x06d6 && n <= 0x06ed); };
const sansVoyelles = (s: string) => Array.from(s).filter((c) => !estSigneArabe(c)).join('');

/** Arabe sans voyelles, alifs et hamzas ramenés à une seule forme, sans « ال » au début ni « يا » */
export function normaliserArabe(s: string): string {
  let t = sansVoyelles(s || '')
    .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ء/g, '')
    .replace(/[^ء-ي\s]/g, ' ').replace(/(\S)\1+/g, '$1') // « رؤوف » (ؤ → و) = « رءوف » : lettre répétée = une seule
    .replace(/\s+/g, ' ').trim();
  t = t.replace(/^يا\s*/, '');
  return t.split(' ').map((m) => (m.length > 3 && m.startsWith('ال') ? m.slice(2) : m)).join(' ');
}

/** Lettres latines simples : sans accents, sans tirets ni apostrophes ni espaces ; « ou » = « u », « ch » = « sh »… */
export function normaliserLatin(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[''`ʿʾ´-]/g, '').replace(/[^a-z0-9]/g, '')
    .replace(/ou/g, 'u').replace(/ch/g, 'sh').replace(/ee/g, 'i').replace(/oo/g, 'u')
    .replace(/dh/g, 'z').replace(/q/g, 'k').replace(/ay/g, 'ai')
    .replace(/(.)\1/g, '$1'); // lettre doublée (« Rahmaan », « Qayyoum ») = une seule (« zzzz » reste « zz » : pas un nom)
}

/** Retire l'article au début : « al », « ar-r… », « ash-sh… »… (déjà normalisé) */
export function sansArticle(s: string): string {
  if (s.startsWith('al') && s.length > 3) return s.slice(2);
  // article assimilé : « ar-Rahmân » → « arahman » (lettres doublées déjà réduites) : a + r/s/t/d/n/z/sh/th
  const m = /^a(sh|th|[rstdnz])/.exec(s);
  if (m && s.length > m[0].length + 1) return s.slice(1);
  return s;
}

const MOTS_VIDES_FR = new Set(['le', 'la', 'les', 'l', 'de', 'du', 'des', 'd', 'celui', 'qui', 'et', 'a', 'un', 'une', 'tres', 'en', 'tout']);

function motsFr(s: string): string[] {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
}

export type Correspondance = 'numero' | 'nom' | 'arabe' | 'francais' | 'sens';

export interface Resultat<T> { nom: T; score: number; par: Correspondance }

/**
 * Renvoie les noms qui correspondent, les meilleurs d'abord (numéro exact, nom exact, début du nom, morceau du nom,
 * puis le sens). Recherche vide = rien (la page montre alors toute la liste).
 */
export function rechercherNoms<T extends NomCherchable>(noms: T[], requete: string): Resultat<T>[] {
  const q = (requete || '').trim();
  if (!q) return [];
  const res: Resultat<T>[] = [];
  const ajouter = (nom: T, score: number, par: Correspondance) => {
    const deja = res.find((r) => r.nom.id === nom.id);
    if (!deja) res.push({ nom, score, par });
    else if (score > deja.score) { deja.score = score; deja.par = par; }
  };

  // 1) Numéro (« 12 », « n°12 », « #12 »)
  const num = /^(?:n[°o]?\s*|#)?\s*(\d{1,3})$/i.exec(q);
  if (num) {
    const n = Number(num[1]);
    noms.forEach((nom) => { if (nom.display_order === n) ajouter(nom, 100, 'numero'); });
    return res;
  }

  // 2) Arabe
  if (/[؀-ۿ]/.test(q)) {
    const qa = normaliserArabe(q);
    if (!qa) return [];
    noms.forEach((nom) => {
      const a = normaliserArabe(nom.name_arabic);
      if (a === qa) ajouter(nom, 95, 'arabe');
      else if (a.startsWith(qa)) ajouter(nom, 80, 'arabe');
      else if (a.includes(qa)) ajouter(nom, 60, 'arabe');
    });
    return res.sort((x, y) => y.score - x.score || (x.nom.display_order ?? 0) - (y.nom.display_order ?? 0));
  }

  // 3) Phonétique (avec ou sans « Al- », accents, tirets)
  const ql = normaliserLatin(q);
  const qs = sansArticle(ql);
  if (ql.length >= 1) {
    noms.forEach((nom) => {
      const t = normaliserLatin(nom.transliteration || '');
      if (!t) return;
      // Formes du nom (avec / sans article) × formes de la recherche (telle quelle / sans article)
      const formesNom = [t, sansArticle(t)];
      const formesQ = [ql, qs];
      const un = (f: (n: string, r: string) => boolean) => formesNom.some((n) => formesQ.some((r) => f(n, r)));
      if (un((n, r) => n === r)) ajouter(nom, 90, 'nom');
      else if (un((n, r) => n.startsWith(r))) ajouter(nom, 75, 'nom');
      else if (un((n, r) => r.length >= 3 && n.includes(r))) ajouter(nom, 55, 'nom');
    });
  }

  // 4) Français (titre) puis sens (signification, explication)
  const mq = motsFr(q).filter((m) => !MOTS_VIDES_FR.has(m));
  if (mq.length) {
    const contient = (texte: string) => {
      const mt = motsFr(texte);
      return mq.every((m) => mt.some((w) => w.startsWith(m) || (m.length >= 4 && w.includes(m))));
    };
    noms.forEach((nom) => {
      if (contient(nom.name_french)) ajouter(nom, 70, 'francais');
      else if (contient(`${nom.fiche_signification || ''} ${nom.fiche_explication || nom.explanation || ''}`)) ajouter(nom, 40, 'sens');
    });
  }

  return res.sort((x, y) => y.score - x.score || (x.nom.display_order ?? 0) - (y.nom.display_order ?? 0));
}
