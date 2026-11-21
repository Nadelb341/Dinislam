import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { untypedDb } from '@/lib/untypedDb';
import { useAuth } from '@/contexts/AuthContext';
import { raisonAcces, type Acces, type Mode } from '@/lib/cartesAcces';

/**
 * 🔤 Les 3 onglets de l'Alphabet (Nadia, 2026-11-21) et « qui voit chaque onglet » (table `alphabet_onglets`,
 * migration 20261121140000). Même règle que « Qui voit » des cartes : tous / certains (groupes OU élèves) / personne.
 * Réglages de départ : tout-petits = Groupe 0 ; alphabet arabe = les autres groupes ; particularités = personne.
 */
export type OngletAlphabet = 'arabe' | 'particularites' | 'petits';
export const ONGLETS_ALPHABET: { cle: OngletAlphabet; titre: string; emoji: string }[] = [
  { cle: 'arabe', titre: 'Alphabet arabe', emoji: '🔤' },
  { cle: 'particularites', titre: 'Lettres particulières', emoji: '✨' },
  { cle: 'petits', titre: 'Pour les tout-petits', emoji: '🧸' },
];

export interface LigneOnglet { cle: OngletAlphabet; mode: Mode; group_ids: string[]; user_ids: string[]; position?: number }

export const accesOnglet = (l: LigneOnglet | undefined): Acces =>
  l ? { mode: l.mode, groupes: l.group_ids || [], eleves: l.user_ids || [] } : { mode: 'tous', groupes: [], eleves: [] };

/** Les onglets visibles par la personne connectée (l'admin les voit tous). `null` tant que ce n'est pas chargé. */
export function useOngletsAlphabet() {
  const { user, isAdmin } = useAuth();
  const { data: lignesLues, isError: erreurLignes } = useQuery({
    queryKey: ['alphabet-onglets'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await untypedDb.from('alphabet_onglets').select('cle, mode, group_ids, user_ids, position');
      if (error) throw error;
      return (data || []) as LigneOnglet[];
    },
  });
  const { data: groupesLus, isError: erreurGroupes } = useQuery({
    queryKey: ['alphabet-mes-groupes', user?.id],
    enabled: !!user && !isAdmin,
    queryFn: async () => ((await supabase.from('student_group_members').select('group_id').eq('user_id', user!.id)).data || []).map((g) => g.group_id),
  });
  // Filet : lecture impossible (aucun réseau ni copie) → réglages « tout le monde » plutôt qu'une page vide
  const lignes = lignesLues ?? (erreurLignes ? [] : undefined);
  const mesGroupes = groupesLus ?? (erreurGroupes ? [] : undefined);
  const pret = !!lignes && (isAdmin || !!mesGroupes);
  // Ordre choisi par l'enseignante (position), sinon l'ordre de départ
  const rang = (cle: OngletAlphabet) => lignes?.find((l) => l.cle === cle)?.position ?? (ONGLETS_ALPHABET.findIndex((o) => o.cle === cle) + 1) * 10;
  const ordre = [...ONGLETS_ALPHABET].sort((a, b) => rang(a.cle) - rang(b.cle));
  const visibles: OngletAlphabet[] | null = !pret ? null : ordre.map((o) => o.cle).filter((cle) =>
    isAdmin || raisonAcces(accesOnglet(lignes!.find((l) => l.cle === cle)), user?.id ?? '', mesGroupes || []) !== null);
  return { lignes: lignes || [], visibles, ordre };
}
