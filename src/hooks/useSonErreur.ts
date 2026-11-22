import { useQuery } from '@tanstack/react-query';
import { untypedDb } from '@/lib/untypedDb';
import { retenirSonErreur } from '@/lib/sonsErreur';

/** Le son doux de l'erreur choisi par l'enseignante (gardé aussi sur l'appareil pour le hors-ligne) */
export function useSonErreurChoisi() {
  return useQuery({
    queryKey: ['reglages-appli', 'son_erreur_petits'],
    queryFn: async () => {
      const { data, error } = await untypedDb.from('reglages_appli').select('valeur').eq('cle', 'son_erreur_petits').maybeSingle();
      if (error) throw error;
      const n = Number((data as { valeur?: unknown } | null)?.valeur) || 1;
      retenirSonErreur(n);
      return n;
    },
  });
}

