import type { Degre } from '@/lib/degreAuthenticite';

/**
 * 🌟 99 noms d'Allah — fiche ADULTE écrite par Nadia (textes validés par elle, 27/11/2026), colonne `allah_names.fiche_adulte`.
 * Source de vérité : scripts/fiches-99-noms/lot_*.py → supabase/data/allah_names_fiches_adultes_2026-11-27.json → migration 20261127200000.
 * Les numéros suivent TOUJOURS l'ordre de l'appli (display_order). `numero_source` = numéro dans la liste de ChatGPT (décalée d'1 dès 67).
 * La version « enfant » (colonne `fiche_enfant`) est dans `src/lib/ficheEnfant.ts` (élève enfant = seulement elle).
 */
export type StatutNom = 'etabli' | 'divergence' | 'non_etabli';
export type ClassementNom = 'coran' | 'sunna' | 'coran_sunna' | 'discute';
export type TypeSection = 'texte' | 'preuve' | 'invocation' | 'prophetique' | 'divergence' | 'authenticite';

export interface SectionFiche {
  type: TypeSection;
  titre: string;
  texte?: string | null;
  arabe?: string | null;
  phonetique?: string | null;
  traduction?: string | null;
  ref?: string | null;
  degre?: string | null;
  note?: string | null;
  badge?: string | null;
}

export interface FicheAdulte {
  nom_arabe: string;
  translit: string;
  traduction: string;
  provenance: string;
  statut: StatutNom;
  classement: ClassementNom;
  numero_source?: number;
  sections: SectionFiche[];
}

/** Badges du système de Nadia (captures #176-177) */
export const STATUTS: Record<StatutNom, { libelle: string; emoji: string; sens: string; classe: string }> = {
  etabli: { libelle: 'Établi', emoji: '🟢', sens: "Nom dont l'établissement est solidement fondé",
    classe: 'bg-emerald-100 text-emerald-900 ring-emerald-400 dark:bg-emerald-900/60 dark:text-emerald-100' },
  divergence: { libelle: 'Divergence', emoji: '🟠', sens: 'Nom discuté entre les savants',
    classe: 'bg-orange-100 text-orange-900 ring-orange-400 dark:bg-orange-900/60 dark:text-orange-100' },
  non_etabli: { libelle: 'Non établi', emoji: '🔴', sens: 'Preuve insuffisante pour le retenir comme nom divin',
    classe: 'bg-rose-100 text-rose-900 ring-rose-400 dark:bg-rose-900/60 dark:text-rose-100' },
};

/** Les 3 listes du bouton « Authenticité » (mêmes fiches, aucun doublon, ordre de l'appli) */
export const LISTES_AUTHENTICITE = [
  { cle: 'coran', titre: 'Noms tirés du Coran', emoji: '📗', classements: ['coran', 'coran_sunna'] as ClassementNom[] },
  { cle: 'sunna', titre: 'Noms tirés de la Sunna authentique', emoji: '📘', classements: ['sunna'] as ClassementNom[] },
  { cle: 'discute', titre: 'Statut discuté', emoji: '⚖️', classements: ['discute'] as ClassementNom[] },
] as const;

const STATUTS_OK: StatutNom[] = ['etabli', 'divergence', 'non_etabli'];
const CLASSEMENTS_OK: ClassementNom[] = ['coran', 'sunna', 'coran_sunna', 'discute'];
const DEGRES_OK = ['sahih', 'hasan', 'daif', 'mawdou', 'coran'];

/** Lit la colonne jsonb ; renvoie null si vide ou mal formée (on garde alors l'ancienne fiche) */
export function lireFicheAdulte(v: unknown): FicheAdulte | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const f = v as Partial<FicheAdulte>;
  if (typeof f.translit !== 'string' || !Array.isArray(f.sections)) return null;
  return {
    nom_arabe: f.nom_arabe || '',
    translit: f.translit,
    traduction: f.traduction || '',
    provenance: f.provenance || '',
    statut: STATUTS_OK.includes(f.statut as StatutNom) ? (f.statut as StatutNom) : 'divergence',
    classement: CLASSEMENTS_OK.includes(f.classement as ClassementNom) ? (f.classement as ClassementNom) : 'discute',
    numero_source: f.numero_source,
    sections: f.sections.filter((s): s is SectionFiche => !!s && typeof s === 'object' && typeof (s as SectionFiche).titre === 'string'),
  };
}

export const degreSection = (d: string | null | undefined): Degre | null => (d && DEGRES_OK.includes(d) ? (d as Degre) : null);

/** Un texte de Nadia → blocs : paragraphes (séparés par une ligne vide) et listes (lignes commençant par « - ») */
export type Bloc = { type: 'p'; texte: string } | { type: 'liste'; puces: string[] };
export function blocs(t: string | null | undefined): Bloc[] {
  const out: Bloc[] = [];
  for (const morceau of (t || '').split(/\n\s*\n/)) {
    const lignes = morceau.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lignes.length) continue;
    let para: string[] = [];
    let puces: string[] = [];
    const vider = () => {
      if (para.length) { out.push({ type: 'p', texte: para.join(' ') }); para = []; }
      if (puces.length) { out.push({ type: 'liste', puces }); puces = []; }
    };
    for (const l of lignes) {
      if (/^[-•]\s+/.test(l)) {
        if (para.length) { out.push({ type: 'p', texte: para.join(' ') }); para = []; }
        puces.push(l.replace(/^[-•]\s+/, ''));
      } else {
        if (puces.length) { out.push({ type: 'liste', puces }); puces = []; }
        para.push(l);
      }
    }
    vider();
  }
  return out;
}

/** Numéros des sections affichées (l'encadré « À savoir – Divergence » n'est pas numéroté) */
export function numerosSections(sections: SectionFiche[]): (number | null)[] {
  let n = 0;
  return sections.map((s) => (s.type === 'divergence' ? null : ++n));
}

/** Noms rangés dans une liste du bouton « Authenticité », dans l'ordre de l'appli */
export function nomsDeLaListe<T extends { display_order: number | null; fiche_adulte?: unknown }>(noms: T[], classements: readonly ClassementNom[]): T[] {
  return noms
    .filter((n) => { const f = lireFicheAdulte(n.fiche_adulte); return !!f && classements.includes(f.classement); })
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}
