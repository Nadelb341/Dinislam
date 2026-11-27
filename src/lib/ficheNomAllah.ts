import type { Degre } from '@/components/shared/DegreAuthenticite';

/**
 * 🌟 Fiche d'un des 99 noms d'Allah en 9 parties, toujours dans CET ordre (demande de Nadia du 27/11/2026) :
 * 1. Nom en arabe · 2. Translittération · 3. Signification · 4. Explication détaillée · 5. Preuve (Coran ou hadith)
 * 6. Moment approprié · 7. Exemple d'invocation · 8. Référence précise et degré d'authenticité · 9. Divergences.
 * Le contenu vit dans la table `allah_names` (colonnes fiche_*, migration 20261127150000) ; chaque partie a son ✏️ (enseignante).
 */

export interface FicheNom {
  id: number;
  display_order: number | null;
  name_arabic: string;
  transliteration: string | null;
  name_french: string;
  explanation: string | null;
  fiche_signification?: string | null;
  fiche_explication?: string | null;
  fiche_preuve_type?: string | null;
  fiche_preuve_arabe?: string | null;
  fiche_preuve_francais?: string | null;
  fiche_preuve_reference?: string | null;
  fiche_preuve_degre?: string | null;
  fiche_preuve_degre_note?: string | null;
  fiche_moment?: string | null;
  fiche_invocation_arabe?: string | null;
  fiche_invocation_phonetique?: string | null;
  fiche_invocation_francais?: string | null;
  fiche_invocation_reference?: string | null;
  fiche_invocation_degre?: string | null;
  fiche_invocation_degre_note?: string | null;
  fiche_invocation_personnelle?: boolean | null;
  fiche_autres_references?: string | null;
  fiche_divergences?: string | null;
  fiche_statut_nom?: string | null;
  fiche_a_relire?: boolean | null;
  fiche_note_relecture?: string | null;
}

export type ClePartie = 'arabe' | 'translit' | 'signification' | 'explication' | 'preuve' | 'moment' | 'invocation' | 'reference' | 'divergences';

export type TypeChamp = 'texte' | 'long' | 'arabe' | 'degre' | 'preuve_type' | 'oui_non';

export interface ChampPartie {
  col: keyof FicheNom;
  libelle: string;
  type: TypeChamp;
  /** Champ obligatoire : on ne peut pas le vider (sinon le nom disparaîtrait de la liste) */
  requis?: boolean;
}

export interface PartieFiche {
  cle: ClePartie;
  numero: number;
  titre: string;
  emoji: string;
  champs: ChampPartie[];
}

export const PARTIES_FICHE: PartieFiche[] = [
  { cle: 'arabe', numero: 1, titre: 'Nom en arabe', emoji: '🕌', champs: [{ col: 'name_arabic', libelle: 'Nom en arabe', type: 'arabe', requis: true }] },
  { cle: 'translit', numero: 2, titre: 'Translittération', emoji: '🔤', champs: [{ col: 'transliteration', libelle: 'Translittération (lettres latines)', type: 'texte', requis: true }] },
  { cle: 'signification', numero: 3, titre: 'Signification', emoji: '💡', champs: [
    { col: 'name_french', libelle: 'Sens court (affiché sur la tuile)', type: 'texte', requis: true },
    { col: 'fiche_signification', libelle: 'Phrase qui explique le sens', type: 'long' }] },
  { cle: 'explication', numero: 4, titre: 'Explication détaillée', emoji: '📖', champs: [{ col: 'fiche_explication', libelle: 'Explication détaillée', type: 'long' }] },
  { cle: 'preuve', numero: 5, titre: 'Preuve du Coran ou de la Sunna', emoji: '📜', champs: [
    { col: 'fiche_preuve_type', libelle: 'Type de preuve', type: 'preuve_type' },
    { col: 'fiche_preuve_arabe', libelle: 'Texte arabe (recopié d\'une source fiable)', type: 'arabe' },
    { col: 'fiche_preuve_francais', libelle: 'Traduction', type: 'long' }] },
  { cle: 'moment', numero: 6, titre: 'Moment approprié pour invoquer Allah par ce nom', emoji: '⏰', champs: [{ col: 'fiche_moment', libelle: 'Moment approprié', type: 'long' }] },
  { cle: 'invocation', numero: 7, titre: 'Exemple d\'invocation', emoji: '🤲', champs: [
    { col: 'fiche_invocation_personnelle', libelle: 'Invocation personnelle (pas un texte de la Sunna)', type: 'oui_non' },
    { col: 'fiche_invocation_arabe', libelle: 'Texte arabe', type: 'arabe' },
    { col: 'fiche_invocation_phonetique', libelle: 'Phonétique', type: 'texte' },
    { col: 'fiche_invocation_francais', libelle: 'Traduction / texte en français', type: 'long' }] },
  { cle: 'reference', numero: 8, titre: 'Référence précise et degré d\'authenticité', emoji: '🔎', champs: [
    { col: 'fiche_preuve_reference', libelle: 'Référence de la preuve', type: 'texte' },
    { col: 'fiche_preuve_degre', libelle: 'Degré de la preuve', type: 'degre' },
    { col: 'fiche_preuve_degre_note', libelle: 'Avis des spécialistes sur la preuve (s\'ils ne sont pas d\'accord)', type: 'long' },
    { col: 'fiche_invocation_reference', libelle: 'Référence de l\'invocation', type: 'texte' },
    { col: 'fiche_invocation_degre', libelle: 'Degré de l\'invocation', type: 'degre' },
    { col: 'fiche_invocation_degre_note', libelle: 'Avis des spécialistes sur l\'invocation (s\'ils ne sont pas d\'accord)', type: 'long' },
    { col: 'fiche_autres_references', libelle: 'Autres références', type: 'long' }] },
  { cle: 'divergences', numero: 9, titre: 'Divergences éventuelles entre les savants', emoji: '⚖️', champs: [{ col: 'fiche_divergences', libelle: 'Divergences', type: 'long' }] },
];

export const DEGRES_PERMIS: Degre[] = ['coran', 'sahih', 'hasan', 'daif', 'mawdou'];

export function degreValide(v: string | null | undefined): Degre | null {
  return v && (DEGRES_PERMIS as string[]).includes(v) ? (v as Degre) : null;
}

/** Explication à afficher : la détaillée, sinon l'ancienne courte (colonne explanation) */
export function explicationDe(f: FicheNom): string | null {
  return (f.fiche_explication || '').trim() || (f.explanation || '').trim() || null;
}

/** La partie a-t-elle quelque chose à montrer ? (les parties 1 à 3 ont toujours un contenu) */
export function partieRemplie(p: PartieFiche, f: FicheNom): boolean {
  if (p.cle === 'explication') return !!explicationDe(f);
  return p.champs.some((c) => {
    if (c.type === 'oui_non' || c.col === 'fiche_preuve_type') return false;
    const v = f[c.col];
    return typeof v === 'string' ? v.trim().length > 0 : v != null && v !== false;
  });
}

/**
 * Parties à afficher, dans l'ordre. L'élève ne voit que les parties remplies ; l'enseignante les voit toutes
 * (une partie vide affiche « à compléter » et son ✏️).
 */
export function partiesAffichees(f: FicheNom, isAdmin: boolean): PartieFiche[] {
  return PARTIES_FICHE.filter((p) => isAdmin || partieRemplie(p, f));
}

/** Valeurs d'une partie (pour le ✏️ et pour la corbeille) */
export function valeursPartie(p: PartieFiche, f: FicheNom): Record<string, string | boolean | null> {
  const v: Record<string, string | boolean | null> = {};
  p.champs.forEach((c) => {
    const x = f[c.col];
    v[c.col] = c.type === 'oui_non' ? !!x : (typeof x === 'string' ? x : x == null ? null : String(x));
  });
  return v;
}

/** Nettoie ce que l'enseignante a tapé : texte vide → null, degré inconnu → null */
export function nettoyerValeurs(p: PartieFiche, brut: Record<string, string | boolean | null>): Record<string, string | boolean | null> {
  const out: Record<string, string | boolean | null> = {};
  p.champs.forEach((c) => {
    const x = brut[c.col as string];
    if (c.type === 'oui_non') { out[c.col] = !!x; return; }
    const t = typeof x === 'string' ? x.trim() : '';
    if (c.type === 'degre') { out[c.col] = degreValide(t); return; }
    if (c.type === 'preuve_type') { out[c.col] = t === 'coran' || t === 'hadith' ? t : null; return; }
    out[c.col] = t || null;
  });
  return out;
}

/** Champs qui avaient un contenu et qui ont été vidés (→ l'ancienne version part dans la corbeille) */
export function champsVides(avant: Record<string, string | boolean | null>, apres: Record<string, string | boolean | null>): string[] {
  return Object.keys(avant).filter((k) => typeof avant[k] === 'string' && (avant[k] as string).trim() && !apres[k]);
}

/** Un champ obligatoire est-il vide ? (on refuse d'enregistrer) */
export function requisManquant(p: PartieFiche, valeurs: Record<string, string | boolean | null>): ChampPartie | null {
  return p.champs.find((c) => c.requis && !(typeof valeurs[c.col] === 'string' && (valeurs[c.col] as string).trim())) ?? null;
}

/** Paragraphes d'un texte long (lignes vides = nouveau paragraphe) */
export function paragraphes(t: string | null | undefined): string[] {
  return (t || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
}

/**
 * Taille du nom en arabe sur une tuile : DOUBLE de l'ancienne (24 px → 48 px), réduite seulement si le mot le plus long
 * est long (le composant TexteAjuste réduit encore si besoin, sans jamais couper un mot).
 */
export function tailleArabeTuile(arabe: string): number {
  const sansVoyelles = (arabe || '').replace(/[ً-ٰٟـ]/g, '');
  const plusLong = Math.max(1, ...sansVoyelles.split(/\s+/).map((m) => m.length));
  if (plusLong <= 6) return 48;
  if (plusLong <= 8) return 42;
  return 36;
}
