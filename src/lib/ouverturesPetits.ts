import { useQuery } from '@tanstack/react-query';
import { untypedDb } from '@/lib/untypedDb';

/** 🔓 Lettres des tout-petits ouvertes à la main (table `alphabet_petits_ouvertes`, Nadia 22/11) */
export interface OuverturePetit { id: string; letter_id: number; group_id: string | null; user_id: string | null }
export const CLE_OUVERTURES = ['alphabet-petits-ouvertes'];

export function useOuverturesPetits() {
  return useQuery({
    queryKey: CLE_OUVERTURES,
    queryFn: async () => {
      const { data, error } = await untypedDb.from('alphabet_petits_ouvertes').select('id, letter_id, group_id, user_id');
      if (error) throw error;
      return (data || []) as OuverturePetit[];
    },
  });
}

/** Lettres ouvertes pour cet enfant (à tous, à un de ses groupes, ou à lui) */
export function lettresOuvertesPour(ouv: OuverturePetit[], userId: string | null | undefined, groupes: string[]) {
  return new Set(ouv.filter((o) => (!o.group_id && !o.user_id) || (o.group_id && groupes.includes(o.group_id)) || (o.user_id && o.user_id === userId)).map((o) => o.letter_id));
}

/** Petit résumé pour la vignette de l'enseignante */
export function resumeOuverture(ouv: OuverturePetit[], letterId: number) {
  const l = ouv.filter((o) => o.letter_id === letterId);
  if (l.some((o) => !o.group_id && !o.user_id)) return '🌍';
  if (!l.length) return '🔒';
  return `🎯${l.length}`;
}

