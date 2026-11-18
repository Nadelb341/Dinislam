/**
 * 🖼️ Encadrement des cartes de l'accueil (choix de Nadia, 2026-11-18) :
 * bouclier › 🔧 Apparence appli › « Modifications générales » › « Page d'accueil » › « Encadrement des cartes ».
 * 5 cadres retenus sur 10 (artefact E9CN…) : Cadre doré, Couture, Coins ornés, Arche, Halo — + « Sans cadre ».
 * Idées gardées (1 à 8) : couleur par carte (dont « couleur de la saison »), « Appliquer à toutes les cartes »,
 * aperçu en direct, couleurs de la saison pour tous les cadres, Halo automatique le jour où un devoir est à rendre,
 * épaisseur fin / normal / épais, « Sans cadre », « ↩️ Revenir aux cadres d'origine ».
 * Enregistré pour tout le monde dans app_appearance (clé « encadrements », version d'avant « encadrements_avant »).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Saison } from '@/lib/saisons';

/** Titre de la carte du bouclier (orthographe à confirmer par Nadia : un seul endroit à changer) */
export const TITRE_MODIFICATIONS_GENERALES = 'Modifications générales';

export type Cadre = 'aucun' | 'dore' | 'couture' | 'coins' | 'arche' | 'halo';
export type CouleurCadre = 'origine' | 'rose' | 'or' | 'bleu' | 'vert' | 'violet' | 'saison';
export type Epaisseur = 'fin' | 'normal' | 'epais';

export const CADRES: { v: Cadre; label: string; aide: string }[] = [
  { v: 'aucun', label: 'Sans cadre', aide: 'La carte reste comme avant.' },
  { v: 'dore', label: 'Cadre doré', aide: 'Double filet, comme une enluminure.' },
  { v: 'couture', label: 'Couture', aide: 'Pointillés cousus, comme un cahier en tissu.' },
  { v: 'coins', label: 'Coins ornés', aide: 'Fin trait + une étoile ✦ à chaque coin.' },
  { v: 'arche', label: 'Arche', aide: 'Le haut en arc, comme la porte d\'une mosquée.' },
  { v: 'halo', label: 'Halo', aide: 'Lueur qui respire doucement.' },
];

export const COULEURS: { v: CouleurCadre; label: string }[] = [
  { v: 'origine', label: 'Celle du cadre' },
  { v: 'rose', label: 'Rose' },
  { v: 'or', label: 'Or' },
  { v: 'bleu', label: 'Bleu' },
  { v: 'vert', label: 'Vert' },
  { v: 'violet', label: 'Violet' },
  { v: 'saison', label: 'Saison' },
];

export const EPAISSEURS: { v: Epaisseur; label: string; f: number }[] = [
  { v: 'fin', label: 'Fin', f: 0.6 },
  { v: 'normal', label: 'Normal', f: 1 },
  { v: 'epais', label: 'Épais', f: 1.6 },
];

export type CarteAccueil = 'carnet' | 'majournee' | 'priere' | 'hadith' | 'sourateJour' | 'cahier' | 'devoirs' | 'progres' | 'matieres';

/** Les grandes cartes de l'accueil, dans l'ordre de la page (les cartes des matières = une seule ligne) */
export const CARTES_ACCUEIL: { v: CarteAccueil; label: string; prof?: boolean }[] = [
  { v: 'carnet', label: '📒 Carnet de liaison' },
  { v: 'majournee', label: '📋 Ma journée', prof: true },
  { v: 'priere', label: '🕌 Prochaine prière' },
  { v: 'hadith', label: '🕊️ Hadith du jour' },
  { v: 'sourateJour', label: '📖 Sourate du jour' },
  { v: 'cahier', label: '📚 Cahier de texte' },
  { v: 'devoirs', label: '📌 Devoirs à faire' },
  { v: 'progres', label: '📈 Progrès' },
  { v: 'matieres', label: '🗂️ Cartes des matières (toutes)' },
];

export interface ReglageCarte { cadre: Cadre; couleur: CouleurCadre; epaisseur: Epaisseur }
export interface ReglagesEncadrements {
  cartes: Record<CarteAccueil, ReglageCarte>;
  /** Idée 4 : tous les cadres prennent la couleur de la saison */
  couleursSaison: boolean;
  /** Idée 5 : le jour où un devoir est à rendre, « Devoirs à faire » passe au Halo */
  haloJourDevoir: boolean;
}

const SANS: ReglageCarte = { cadre: 'aucun', couleur: 'origine', epaisseur: 'normal' };
export const ENCADREMENTS_DEFAUT: ReglagesEncadrements = {
  cartes: {
    carnet: SANS, majournee: SANS, priere: SANS, hadith: SANS, sourateJour: SANS,
    cahier: SANS, devoirs: { cadre: 'dore', couleur: 'origine', epaisseur: 'normal' }, progres: SANS, matieres: SANS,
  },
  couleursSaison: false,
  haloJourDevoir: true,
};

const estCadre = (v: unknown): v is Cadre => CADRES.some((c) => c.v === v);
const estCouleur = (v: unknown): v is CouleurCadre => COULEURS.some((c) => c.v === v);
const estEpaisseur = (v: unknown): v is Epaisseur => EPAISSEURS.some((c) => c.v === v);

export function fusionnerEncadrements(v: unknown): ReglagesEncadrements {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<ReglagesEncadrements>;
  const cartes = { ...ENCADREMENTS_DEFAUT.cartes };
  for (const c of CARTES_ACCUEIL) {
    const x = (o.cartes as Record<string, Partial<ReglageCarte>> | undefined)?.[c.v];
    if (x) cartes[c.v] = {
      cadre: estCadre(x.cadre) ? x.cadre : cartes[c.v].cadre,
      couleur: estCouleur(x.couleur) ? x.couleur : cartes[c.v].couleur,
      epaisseur: estEpaisseur(x.epaisseur) ? x.epaisseur : cartes[c.v].epaisseur,
    };
  }
  return {
    cartes,
    couleursSaison: typeof o.couleursSaison === 'boolean' ? o.couleursSaison : ENCADREMENTS_DEFAUT.couleursSaison,
    haloJourDevoir: typeof o.haloJourDevoir === 'boolean' ? o.haloJourDevoir : ENCADREMENTS_DEFAUT.haloJourDevoir,
  };
}

export function useReglagesEncadrements() {
  return useQuery({
    queryKey: ['app-appearance', 'encadrements'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ReglagesEncadrements> => {
      const { data, error } = await supabase.from('app_appearance').select('value').eq('key', 'encadrements').maybeSingle();
      // Lecture ratée = erreur, JAMAIS des valeurs par défaut qu'un enregistrement écraserait ensuite
      if (error) throw error;
      return fusionnerEncadrements(data?.value);
    },
  });
}

/** Couleur [clair, doux clair, sombre, doux sombre] */
type Teinte = [string, string, string, string];
const TEINTES: Record<Exclude<CouleurCadre, 'origine' | 'saison'>, Teinte> = {
  rose: ['#e8a3ad', '#fde4e7', '#b85a6a', '#3a2030'],
  or: ['#c99a2e', '#f3dc9a', '#e2bb57', '#5a4718'],
  bleu: ['#6b8fd6', '#dde7fb', '#8fa9ef', '#1f2c55'],
  vert: ['#3fae84', '#d6f3e6', '#5fd4a4', '#163a2b'],
  violet: ['#9b7ad8', '#ece4fb', '#b79cf0', '#2c2148'],
};
/** Idée 4 : automne cuivré, hiver bleu glacé, printemps rose, été turquoise, Ramadan doré */
const TEINTES_SAISON: Record<Saison, Teinte> = {
  automne: ['#c0703a', '#f7dcc5', '#e0955c', '#3d2616'],
  hiver: ['#6aa6d8', '#dcecf8', '#8cc0ea', '#1a2f45'],
  printemps: ['#e58fb0', '#fbe1eb', '#f0a8c4', '#3e2030'],
  ete: ['#23a8a0', '#d2f2ef', '#4fd0c6', '#123a37'],
  ramadan: TEINTES.or,
};
const ORIGINE: Record<Exclude<Cadre, 'aucun'>, keyof typeof TEINTES> = { dore: 'or', couture: 'rose', coins: 'or', arche: 'or', halo: 'rose' };

export function teinteDe(cadre: Exclude<Cadre, 'aucun'>, couleur: CouleurCadre, saison: Saison | null, toutSaison: boolean): Teinte {
  if (toutSaison || couleur === 'saison') return saison ? TEINTES_SAISON[saison] : TEINTES.or;
  if (couleur === 'origine') return TEINTES[ORIGINE[cadre]];
  return TEINTES[couleur];
}

/** Échantillon de couleur pour les boutons du réglage */
export function echantillon(couleur: CouleurCadre, saison: Saison | null): string {
  if (couleur === 'origine') return 'linear-gradient(135deg,#c99a2e 50%,#e8a3ad 50%)';
  if (couleur === 'saison') return saison ? TEINTES_SAISON[saison][0] : TEINTES.or[0];
  return TEINTES[couleur][0];
}
