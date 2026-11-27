import { useQuery } from '@tanstack/react-query';
import { untypedDb } from '@/lib/untypedDb';
import type { HadithDuJour } from '@/lib/hadithsDuJour';

/** 🕊️ Les hadiths de la table `hadiths_du_jour` (carte de l'accueil + carte Hadiths) : même clé = même copie hors ligne */
export const CLE_HADITHS_DU_JOUR = ['hadiths-du-jour'];

export async function lireHadithsDuJour(): Promise<HadithDuJour[]> {
  // '*' : marche avant ET après l'ajout des colonnes degre / degre_divergence (27/11)
  const { data, error } = await untypedDb.from('hadiths_du_jour').select('*').order('position').order('created_at');
  if (error) throw error;
  return (data || []) as HadithDuJour[];
}

export const useHadithsDuJour = () => useQuery({ queryKey: CLE_HADITHS_DU_JOUR, queryFn: lireHadithsDuJour, retry: 1 });
