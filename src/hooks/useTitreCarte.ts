import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * ✏️ Titre d'une page = titre de sa carte de l'accueil (Nadia, 2026-11-21, proposition 2 du crayon) : quand elle renomme
 * une carte (⋮ › Modifier la carte), la barre du haut de la page suit. Tant que ce n'est pas lu (ou sans réseau ni copie) :
 * le titre de départ. Une seule lecture partagée par toutes les pages.
 */
export function useTitreCarte(chemin: string, defaut: string): string {
  const { data } = useQuery({
    queryKey: ['learning-modules', 'titres'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('learning_modules').select('builtin_path, title');
      if (error) throw error;
      return data || [];
    },
  });
  return data?.find((m) => m.builtin_path === chemin)?.title?.trim() || defaut;
}
