import type { StatutNom } from '@/lib/ficheAdulte';

/**
 * 🧒 99 noms d'Allah — version ENFANT (proposition a-f validée par Nadia le 27/11/2026), colonne `allah_names.fiche_enfant`.
 * Source : scripts/fiches-99-noms/enfants.py → supabase/data/allah_names_fiches_enfants_2026-11-27.json → migration 20261127220000.
 * Tirée UNIQUEMENT de la fiche adulte de Nadia du même nom (aucune nouvelle référence, aucun mérite, aucune promesse).
 *
 * QUI VOIT QUOI (Nadia, 27/11) : l'enseignante voit les 2 versions (bascule) ; un élève enfant SEULEMENT la version enfant,
 * un élève adulte SEULEMENT la version adulte. 3-6 ans = version courte (le nom, « Ça veut dire… », « Je dis ») ;
 * 7-12 ans = version enfant ; 13 ans et plus = adulte ; âge inconnu = enfant. L'enseignante peut forcer le choix pour un élève
 * (table `allah_names_version_eleve` : auto / petit / enfant / adulte).
 */
export interface FicheEnfant {
  nom_arabe: string;
  translit: string;
  statut: StatutNom;
  sens: string;
  comme: string;
  faire: string;
  dire: string;
  dire_type: 'personnelle' | 'texte';
  dire_arabe?: string | null;
  dire_traduction?: string | null;
  dire_ref?: string | null;
  dire_degre?: string | null;
  prudence?: string | null;
  a_relire: boolean;
}

export type Version99Noms = 'petit' | 'enfant' | 'adulte';
export type ChoixVersion = 'auto' | Version99Noms;

export const CHOIX_VERSION: { cle: ChoixVersion; libelle: string }[] = [
  { cle: 'auto', libelle: "🎂 Selon l'âge" },
  { cle: 'petit', libelle: '🧸 Petit (3-6 ans)' },
  { cle: 'enfant', libelle: '🧒 Enfant' },
  { cle: 'adulte', libelle: '🧑 Adulte' },
];

/** Les parties qu'on peut modifier avec le ✏️ (une à la fois) */
export const PARTIES_ENFANT = [
  { cle: 'sens', titre: 'Ça veut dire…', emoji: '💡' },
  { cle: 'comme', titre: 'Comme quand…', emoji: '🌈' },
  { cle: 'faire', titre: 'Ce que je peux faire', emoji: '🤲' },
  { cle: 'dire', titre: 'Je dis', emoji: '💬' },
] as const;
export type PartieEnfant = (typeof PARTIES_ENFANT)[number]['cle'];

const STATUTS_OK: StatutNom[] = ['etabli', 'divergence', 'non_etabli'];

/** Lit la colonne jsonb ; null si vide ou mal formée (on garde alors l'ancienne fiche) */
export function lireFicheEnfant(v: unknown): FicheEnfant | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const f = v as Partial<FicheEnfant>;
  if (typeof f.sens !== 'string' || typeof f.dire !== 'string') return null;
  return {
    nom_arabe: f.nom_arabe || '',
    translit: f.translit || '',
    statut: STATUTS_OK.includes(f.statut as StatutNom) ? (f.statut as StatutNom) : 'divergence',
    sens: f.sens,
    comme: f.comme || '',
    faire: f.faire || '',
    dire: f.dire,
    dire_type: f.dire_type === 'texte' ? 'texte' : 'personnelle',
    dire_arabe: f.dire_arabe ?? null,
    dire_traduction: f.dire_traduction ?? null,
    dire_ref: f.dire_ref ?? null,
    dire_degre: f.dire_degre ?? null,
    prudence: f.prudence ?? null,
    a_relire: f.a_relire !== false,
  };
}

/** Âge en années à une date donnée (date de naissance prioritaire, sinon l'âge saisi), null si inconnu */
export function ageDe(p: { date_of_birth?: string | null; age?: number | null } | null | undefined, aujourdhui = new Date()): number | null {
  if (!p) return null;
  if (p.date_of_birth) {
    const d = new Date(p.date_of_birth);
    if (!Number.isNaN(d.getTime())) {
      return aujourdhui.getFullYear() - d.getFullYear()
        - (aujourdhui < new Date(aujourdhui.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
    }
  }
  return typeof p.age === 'number' ? p.age : null;
}

/** La version que voit un ÉLÈVE : choix de l'enseignante, sinon selon l'âge (inconnu = enfant) */
export function versionPourEleve(age: number | null, choix: ChoixVersion | null | undefined): Version99Noms {
  if (choix && choix !== 'auto') return choix;
  if (age === null) return 'enfant';
  if (age <= 6) return 'petit';
  if (age <= 12) return 'enfant';
  return 'adulte';
}

export const estChoixVersion = (v: unknown): v is ChoixVersion => v === 'auto' || v === 'petit' || v === 'enfant' || v === 'adulte';
