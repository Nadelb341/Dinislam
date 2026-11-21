import { useQuery } from '@tanstack/react-query';
import { untypedDb } from '@/lib/untypedDb';
import { ALPHABET_WORDS, type AlphabetWord } from '@/data/alphabetWords';

/**
 * ✏️ Mots exemples de l'Alphabet (2026-11-21) : le mot choisi par Nadia (table `alphabet_mots`), sinon le mot de départ.
 * Sans réseau ni copie : les mots de départ (jamais de fiche vide).
 */
export function useMotsAlphabet(): Record<string, AlphabetWord & { modifie?: boolean }> {
  const { data = [] } = useQuery({
    queryKey: ['alphabet-mots'],
    queryFn: async () => {
      const { data: rows, error } = await untypedDb.from('alphabet_mots').select('lettre, word, tr, fr, emoji');
      if (error) throw error;
      return (rows || []) as ({ lettre: string } & AlphabetWord)[];
    },
  });
  const mots: Record<string, AlphabetWord & { modifie?: boolean }> = { ...ALPHABET_WORDS };
  for (const r of data) mots[r.lettre] = { word: r.word, tr: r.tr || '', fr: r.fr || '', emoji: r.emoji || '⭐', modifie: true };
  return mots;
}
