/**
 * 🔧 Apparence de l'appli › « Le titre » (2026-10-29, choix de Nadia) : le haut de l'accueil.
 * Proposition 8 (lettres espacées entre deux traits dorés) + idée A (l'icône de l'appli, le croissant, au-dessus)
 * + idée B (le croissant brille et une pluie d'étoiles tombe sur le titre à l'ouverture)
 * + idée C (couleurs du Ramadan, automatiques pendant le mois de Ramadan). Tout se règle dans le bouclier.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Police = 'cinzel' | 'nunito' | 'amiri' | 'manuscrite';

export interface ReglagesTitre {
  texte: string;
  majuscules: boolean;
  police: Police;
  /** Espace entre les lettres, en dixièmes de « em » (0 à 4) */
  espacement: number;
  couleurTexte: string;
  couleurTraits: string;
  traits: boolean;
  icone: boolean;
  /** Effets */
  pluie: boolean;       // pluie d'étoiles à l'ouverture
  brillant: boolean;    // le croissant brille
  scintillant: boolean; // petites étoiles qui scintillent autour du nom
  ombre: boolean;       // ombre douce sous le nom
  reflet: boolean;      // reflet doré qui passe sur le nom
  /** Textes en dessous */
  salutation: string;
  bienvenue: string;    // {nom} = nom de l'élève
  /** Couleur de « Bienvenue, … ! » (bleu du logo par défaut, 2026-10-29) */
  couleurBienvenue: string;
  bismillah: boolean;
  /** vide = l'or habituel de l'appli */
  couleurBismillah: string;
  /** Idée C : couleurs du Ramadan */
  ramadan: boolean;
  ramadanTexte: string;
  ramadanTraits: string;
}

export const TITRE_DEFAUT: ReglagesTitre = {
  texte: 'Dinislam', majuscules: true, police: 'cinzel', espacement: 2,
  couleurTexte: '#14213d', couleurTraits: '#c9932a', traits: true, icone: true,
  pluie: true, brillant: true, scintillant: false, ombre: false, reflet: false,
  salutation: 'Assalamou Alaykoum', bienvenue: 'Bienvenue, {nom} !', couleurBienvenue: '#1f3fbf', bismillah: true, couleurBismillah: '',
  ramadan: true, ramadanTexte: '#0f5132', ramadanTraits: '#d4a017',
};

export const POLICES: { v: Police; label: string; css: string }[] = [
  { v: 'cinzel', label: 'Élégante (lettres de livre)', css: "'Cinzel', 'Times New Roman', serif" },
  { v: 'nunito', label: 'Ronde et moderne', css: "'Nunito', system-ui, sans-serif" },
  { v: 'amiri', label: 'Classique', css: "'Amiri', Georgia, serif" },
  { v: 'manuscrite', label: 'Écrite à la main', css: "'Patrick Hand', 'Comic Sans MS', cursive" },
];

/** Mois de Ramadan d'après le calendrier de l'Hégire du téléphone */
export function estRamadan(d = new Date()): boolean {
  try {
    const mois = new Intl.DateTimeFormat('en-u-ca-islamic', { month: 'numeric' }).formatToParts(d).find((p) => p.type === 'month')?.value;
    return mois === '9';
  } catch { return false; }
}

export function useReglagesTitre() {
  return useQuery({
    queryKey: ['app-appearance', 'titre'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ReglagesTitre> => {
      const { data } = await supabase.from('app_appearance').select('value').eq('key', 'titre').maybeSingle();
      return { ...TITRE_DEFAUT, ...((data?.value as Partial<ReglagesTitre> | null) ?? {}) };
    },
  });
}
