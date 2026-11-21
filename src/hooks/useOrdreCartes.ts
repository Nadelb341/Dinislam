import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { untypedDb } from '@/lib/untypedDb';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';

/**
 * ✋ Ordre d'une liste de cartes fixes (table `ordre_cartes`, 2026-11-21). Dans Dinislam, SEULE l'enseignante range ;
 * les élèves voient exactement le même ordre. Un élément nouveau (pas encore rangé) se place à la fin.
 */
export function useOrdreCartes<T>(cle: string, elements: T[], idDe: (e: T) => string) {
  const queryClient = useQueryClient();
  const { data: ordre = [] } = useQuery({
    queryKey: ['ordre-cartes', cle],
    queryFn: async () => {
      const { data, error } = await untypedDb.from('ordre_cartes').select('ordre').eq('cle', cle).maybeSingle();
      if (error) throw error;
      return ((data as { ordre?: string[] } | null)?.ordre ?? []) as string[];
    },
  });
  const rang = (e: T) => { const i = ordre.indexOf(idDe(e)); return i === -1 ? Number.MAX_SAFE_INTEGER : i; };
  const ranges = elements.map((e, i) => ({ e, i })).sort((a, b) => rang(a.e) - rang(b.e) || a.i - b.i).map((x) => x.e);

  const ranger = async (n: T[]) => {
    const ids = n.map(idDe);
    queryClient.setQueryData(['ordre-cartes', cle], ids);
    try {
      const r = await ecrireOuGarder({ table: 'ordre_cartes', op: 'upsert', rows: [{ cle, ordre: ids, updated_at: new Date().toISOString() }] });
      toast.success(r === 'en_attente' ? '📡 Ordre gardé, envoyé au retour du réseau' : '✋ Ordre enregistré (les élèves voient le même)');
    } catch (e) {
      toast.error((e as Error).message);
      void queryClient.invalidateQueries({ queryKey: ['ordre-cartes', cle] });
    }
  };
  return { ranges, ranger };
}
