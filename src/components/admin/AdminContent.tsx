import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Carte Prière › « Gérer le contenu » : catégories de la prière.
 * (Nadia, 2026-11-21) Les anciens onglets Ramadan, Nourania et Sourates n'avaient rien à faire ici : retirés.
 * Ramadan se gère dans sa carte (thème, vidéo), Nourania dans ses leçons (✏️), Sourates dans leurs fiches.
 * Rien n'est effacé en base (les 17 liens YouTube des leçons Nourania restent dans nourania_lessons.audio_url).
 */
const AdminContent = () => {
  const { data: prayerCategories } = useQuery({
    queryKey: ['admin-prayer-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('prayer_categories').select('*').order('display_order');
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-2">
      {prayerCategories?.map((category) => (
        <Card key={category.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">{category.name_french}</p>
                <p className="text-sm font-arabic">{category.name_arabic}</p>
                {category.description && <p className="text-xs text-muted-foreground">{category.description}</p>}
              </div>
              <Badge variant={category.is_default ? 'default' : 'secondary'}>{category.is_default ? 'Par défaut' : 'Personnalisé'}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminContent;
