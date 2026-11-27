import { useQuery } from '@tanstack/react-query';
import { untypedDb } from '@/lib/untypedDb';
import { assemblerBesoins, type LigneBesoin, type LigneNomBesoin, type NomBase } from '@/lib/besoinAllah';

/** Clé react-query (mise en direct dans `realtimeSync.ts` pour les 2 tables) */
export const CLE_BESOINS_ALLAH = ['besoins-allah'];

interface Brut { lignes: LigneBesoin[]; noms: LigneNomBesoin[] }

async function lireBesoins(): Promise<Brut> {
  const [b, n] = await Promise.all([
    untypedDb.from('besoins_allah').select('*').order('position'),
    untypedDb.from('besoins_allah_noms').select('*').order('position'),
  ]);
  if (b.error) throw b.error;
  if (n.error) throw n.error;
  return { lignes: (b.data || []) as LigneBesoin[], noms: (n.data || []) as LigneNomBesoin[] };
}

/**
 * 🤲 Émotions « Besoin d'Allah » : base d'abord ; rien de lu (hors ligne à la 1re ouverture, table pas encore créée)
 * → copie de secours du code. `enBase` = l'enseignante peut modifier (sinon ✏️ explique pourquoi c'est impossible).
 */
export function useBesoinsAllah(nomsBase: NomBase[]) {
  const q = useQuery({ queryKey: CLE_BESOINS_ALLAH, queryFn: lireBesoins, retry: 1, staleTime: 60_000 });
  const besoins = assemblerBesoins(q.data?.lignes, q.data?.noms, nomsBase);
  return { besoins, enBase: !!q.data && q.data.lignes.length > 0, tableLue: !!q.data, isError: q.isError };
}
