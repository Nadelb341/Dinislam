import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * 🗂️ Les 4 cartes d'un groupe du Cahier de texte (① Avant · ② Pendant · ③ Après · 🗂️ Mémo) — demande de Nadia, 2026-11-05 :
 * ⋮ Modifier (emoji + petite phrase) · Renommer (titre) · Supprimer (corbeille, restaurable) · ordre par appui long + glisser.
 * Les numéros ①②③ suivent l'ordre. Mêmes réglages pour TOUS les groupes : app_appearance, clé « cartes_cahier ».
 */
export type CleCarte = 'avant' | 'pendant' | 'apres' | 'memo';
export interface ReglageCarte { titre?: string; emoji?: string; phrase?: string }
export interface ReglagesCartesCahier { ordre: CleCarte[]; cartes: Partial<Record<CleCarte, ReglageCarte>>; supprimees: CleCarte[] }

export const CARTES: CleCarte[] = ['avant', 'pendant', 'apres', 'memo'];
/** Par défaut : les 3 cartes du déroulé sont numérotées, le Mémo a son emoji */
export const CARTE_DEFAUT: Record<CleCarte, { titre: string; emoji: string; phrase: string | null; numerotee: boolean }> = {
  avant: { titre: 'Avant le cours', emoji: '', phrase: null, numerotee: true },
  pendant: { titre: 'Pendant le cours', emoji: '', phrase: "Programme, appel, ce qu'on a vu", numerotee: true },
  apres: { titre: 'Après le cours', emoji: '', phrase: 'Donner les devoirs, élève par élève', numerotee: true },
  memo: { titre: 'Mémo', emoji: '🗂️', phrase: 'Prochain cours, à préparer, à apporter, notes et fichiers', numerotee: false },
};
export const CARTES_DEFAUT: ReglagesCartesCahier = { ordre: [...CARTES], cartes: {}, supprimees: [] };

export function fusionnerCartes(v: Partial<ReglagesCartesCahier> | null | undefined): ReglagesCartesCahier {
  const ordre = (Array.isArray(v?.ordre) ? v!.ordre : []).filter((k): k is CleCarte => CARTES.includes(k as CleCarte));
  for (const k of CARTES) if (!ordre.includes(k)) ordre.push(k);
  return {
    ordre,
    cartes: (v?.cartes && typeof v.cartes === 'object') ? v.cartes : {},
    supprimees: (Array.isArray(v?.supprimees) ? v!.supprimees : []).filter((k): k is CleCarte => CARTES.includes(k as CleCarte)),
  };
}

export function useReglagesCartesCahier() {
  return useQuery({
    queryKey: ['app-appearance', 'cartes_cahier'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from('app_appearance').select('value').eq('key', 'cartes_cahier').maybeSingle();
      // ⚠️ 2026-11-07 (audit DETTE) : lecture ratée = erreur, JAMAIS des « valeurs par défaut » qu'un enregistrement écraserait ensuite
      if (error) throw error;
      return fusionnerCartes(data?.value as Partial<ReglagesCartesCahier> | null);
    },
  });
}

export async function enregistrerCartesCahier(r: ReglagesCartesCahier, userId: string | null) {
  return supabase.from('app_appearance').upsert({ key: 'cartes_cahier', value: r as unknown as never, updated_at: new Date().toISOString(), updated_by: userId });
}

/** Numéro affiché (①②③…) : rang parmi les cartes numérotées visibles, dans l'ordre choisi */
const CERCLES = ['①', '②', '③', '④', '⑤', '⑥'];
export function numeroDe(r: ReglagesCartesCahier, k: CleCarte): string {
  if (!CARTE_DEFAUT[k].numerotee || r.cartes[k]?.emoji) return '';
  const visibles = r.ordre.filter((x) => !r.supprimees.includes(x) && CARTE_DEFAUT[x].numerotee && !r.cartes[x]?.emoji);
  const i = visibles.indexOf(k);
  return i >= 0 ? CERCLES[i] ?? `${i + 1}.` : '';
}

export const titreDe = (r: ReglagesCartesCahier, k: CleCarte) => r.cartes[k]?.titre?.trim() || CARTE_DEFAUT[k].titre;
export const emojiDe = (r: ReglagesCartesCahier, k: CleCarte) => r.cartes[k]?.emoji ?? CARTE_DEFAUT[k].emoji;
