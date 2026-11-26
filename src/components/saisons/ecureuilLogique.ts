/**
 * 🐿️ Logique de l'écureuil qui se cache dans TOUTE l'appli (Nadia, 2026-11-26) — pure, testée dans ecureuilLogique.test.ts.
 * - À la connexion, environ 2 fois sur 5 il est dans sa maisonnette de l'accueil, puis il repart se cacher.
 * - Il se cache dans une page de l'appli (une de celles que l'élève voit sur l'accueil), posé au bord d'un élément.
 * - Indices : 20 s → la page ; 35 s → plus précis ; 45 s → très précis (il remue, une flèche le montre).
 * - Trouvé → il rentre dans sa maisonnette et repart se cacher au bout de 1 à 2 minutes (au hasard).
 * Rien ne passe par Internet : tout se décide sur l'appareil.
 */

export type PageEcureuil = { chemin: string; nom: string };
export type EtatEcureuil =
  | { lieu: 'maison'; jusqua: number; dernier?: string }
  | { lieu: 'cache'; chemin: string; nomPage: string; depuis: number; graine: number };

/** Environ 1 fois sur 2 ou 3 il est chez lui à la connexion */
export const PROBA_MAISON = 0.4;
/** Délais des indices, comptés depuis le moment où il s'est caché */
export const DELAIS_INDICES = [20_000, 35_000, 45_000] as const;
/** Si l'élève n'a encore vu aucune carte de l'accueil : il se cache sur l'accueil */
export const PAGE_SECOURS: PageEcureuil = { chemin: '/', nom: 'Accueil' };

export function niveauIndice(ecoule: number): 0 | 1 | 2 | 3 {
  if (ecoule >= DELAIS_INDICES[2]) return 3;
  if (ecoule >= DELAIS_INDICES[1]) return 2;
  if (ecoule >= DELAIS_INDICES[0]) return 1;
  return 0;
}

/** Après l'avoir trouvé : il reste chez lui 1 à 2 minutes (jamais plus) */
export const dureeRetour = (h: number) => 60_000 + Math.round(Math.min(1, Math.max(0, h)) * 60_000);
/** À la connexion, quand il est chez lui : 30 s à 1 min avant de repartir */
export const dureeMaisonConnexion = (h: number) => 30_000 + Math.round(Math.min(1, Math.max(0, h)) * 30_000);

/** Choisit la page de sa cachette, jamais la même que la fois d'avant (s'il y a le choix) */
export function choisirPage(pages: PageEcureuil[], h: number, eviter?: string): PageEcureuil {
  const liste = pages.length ? pages : [PAGE_SECOURS];
  const autres = liste.length > 1 && eviter ? liste.filter((p) => p.chemin !== eviter) : liste;
  const choix = autres.length ? autres : liste;
  return choix[Math.min(choix.length - 1, Math.floor(Math.max(0, h) * choix.length))];
}

export function partirSeCacher(maintenant: number, pages: PageEcureuil[], h: number, graine: number, eviter?: string): EtatEcureuil {
  const p = choisirPage(pages, h, eviter);
  return { lieu: 'cache', chemin: p.chemin, nomPage: p.nom, depuis: maintenant, graine };
}

/** L'état au moment de la connexion */
export function etatDeDepart(maintenant: number, pages: PageEcureuil[], h1: number, h2: number, h3: number): EtatEcureuil {
  if (h1 < PROBA_MAISON) return { lieu: 'maison', jusqua: maintenant + dureeMaisonConnexion(h2) };
  return partirSeCacher(maintenant, pages, h2, h3);
}

/** Le temps passe : chez lui et c'est l'heure → il repart se cacher ailleurs */
export function avancer(e: EtatEcureuil, maintenant: number, pages: PageEcureuil[], h: number, graine: number): EtatEcureuil {
  if (e.lieu === 'maison' && maintenant >= e.jusqua) return partirSeCacher(maintenant, pages, h, graine, e.dernier);
  return e;
}

/** Trouvé : il rentre dans sa maisonnette */
export function apresTrouve(e: EtatEcureuil, maintenant: number, h: number): EtatEcureuil {
  return { lieu: 'maison', jusqua: maintenant + dureeRetour(h), dernier: e.lieu === 'cache' ? e.chemin : undefined };
}

/** Une petite image pour le nom de la page (indice n° 1) */
export function emojiPage(nom: string): string {
  const n = nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const table: [RegExp, string][] = [
    [/priere|lodo|ablution/, '🕌'], [/sourate|coran|lecture/, '📖'], [/invocation|dou|dhikr/, '🤲'], [/nourania/, '🔤'],
    [/alphabet|lettre/, '✏️'], [/ramadan/, '🌙'], [/allah|noms/, '🌟'], [/hadith/, '📜'], [/prophete|histoire/, '📚'],
    [/grammaire|conjugaison|vocabulaire|dictionnaire|darija/, '📝'], [/classement/, '🏆'], [/presence/, '📋'], [/parametre/, '⚙️'], [/accueil/, '🏡'],
  ];
  return table.find(([r]) => r.test(n))?.[1] ?? '📄';
}

/** En haut / au milieu / en bas de la page (indice n° 2) */
export function positionDansPage(haut: number, hauteurPage: number): 'en haut' | 'au milieu' | 'en bas' {
  const r = hauteurPage > 0 ? haut / hauteurPage : 0;
  return r < 0.34 ? 'en haut' : r < 0.67 ? 'au milieu' : 'en bas';
}

/**
 * 💡 Le texte de l'indice. `surLaPage` : l'élève est dans la bonne page ; `repere` : le titre / la carte près de lui
 * (connu seulement quand on est sur la page) ; `ou` : en haut, au milieu, en bas.
 */
export function texteIndice(niveau: number, c: { surLaPage: boolean; nomPage: string; repere?: string; ou?: string }): string | null {
  if (niveau <= 0) return null;
  const page = `« ${c.nomPage} » ${emojiPage(c.nomPage)}`;
  if (!c.surLaPage) {
    if (niveau === 1) return `Psst ! Je suis caché dans la page ${page}`;
    if (niveau === 2) return `Je t'attends toujours dans la page ${page}. Vas-y, cherche bien 🔍`;
    return `Je suis dans la page ${page} ! Touche « Y aller » 👇`;
  }
  if (niveau === 1) return `Je suis caché dans cette page ! Regarde bien partout 👀`;
  if (niveau === 2) return c.repere ? `Je suis tout près de « ${c.repere} », ${c.ou ?? 'dans la page'} 🔍` : `Je suis ${c.ou ?? 'dans la page'}, au bord d'une carte 🔍`;
  return 'Regarde : je remue et je brille ! Suis la flèche ✨';
}

/** Mélange les numéros 0 … n-1 de façon toujours pareille pour une même graine (pour choisir sa cachette dans la page) */
export function ordreAuHasard(n: number, graine: number): number[] {
  const t = Array.from({ length: n }, (_, i) => i);
  let s = Math.floor(Math.abs(graine) * 2147483647) || 1;
  const r = () => { s = (s * 48271) % 2147483647; return s / 2147483647; };
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; }
  return t;
}

/** Un repère lisible pour l'indice n° 2 : le début du texte, sans couper un mot */
export function repereCourt(texte: string, max = 28): string {
  const t = texte.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const coupe = t.slice(0, max);
  const i = coupe.lastIndexOf(' ');
  return `${(i > 10 ? coupe.slice(0, i) : coupe).trim()}…`;
}
