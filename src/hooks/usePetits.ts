import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { untypedDb } from '@/lib/untypedDb';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { errorMessage } from '@/lib/utils';
import { aAccueilPetits, carteOuvertePetit, type AccesCartesPetits, type CleRubrique, type Enfant, type PublicPetits } from '@/lib/petits';
import { useMyAge } from '@/hooks/useMyAge';

/** 🧸 Données de l'accueil du Groupe 0 (Nadia, 2026-11-22) */
export interface FichePetit {
  id: string; rubrique: CleRubrique; titre: string; arabe: string | null; texte: string | null; emoji: string | null;
  image_url: string | null; audio_url: string | null; versets: string[] | null; position: number;
}
export interface Etoile { source: string; ref: string; created_at: string }

/** Les groupes de l'élève (pour savoir s'il a l'accueil des tout-petits et quelles cartes lui sont ouvertes) */
export function useMesGroupes(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['mes-groupes', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('student_group_members').select('group_id').eq('user_id', userId!);
      if (error) throw error;
      return (data || []).map((r) => r.group_id as string);
    },
  });
}

/** Tous les groupes (noms), pour l'écran de l'enseignante */
export function useGroupes() {
  return useQuery({
    queryKey: ['student-groups-noms'],
    queryFn: async () => {
      const { data, error } = await supabase.from('student_groups').select('id, name').order('name');
      if (error) throw error;
      return (data || []) as { id: string; name: string }[];
    },
  });
}

/**
 * 🔒 L'accueil des tout-petits pour l'élève connecté : l'a-t-il ? quelles cartes lui sont ouvertes ?
 * L'enseignante voit tout (les cartes fermées sont signalées).
 */
export function useAccesPetits(userId: string | null | undefined, isAdmin: boolean) {
  const age = useMyAge();
  const { data: groupes = [], isFetched } = useMesGroupes(isAdmin ? null : userId);
  const pub = useReglage<PublicPetits>('petits_public', { moins6: false, groupes: [] });
  const cartes = useReglage<AccesCartesPetits>('petits_cartes', {});
  const enfant: Enfant = { age, groupes };
  return {
    pret: isAdmin || isFetched,
    aAccueil: !isAdmin && aAccueilPetits(pub.valeur, enfant),
    ouverte: (cle: string) => isAdmin || carteOuvertePetit(cartes.valeur, cle, enfant),
    fermeePourTous: (cle: string) => !cartes.valeur[cle],
    pub, cartes,
  };
}

export function useFichesPetits() {
  return useQuery({
    queryKey: ['petits-fiches'],
    queryFn: async () => {
      const { data, error } = await untypedDb.from('petits_fiches').select('id, rubrique, titre, arabe, texte, emoji, image_url, audio_url, versets, position').order('position').order('created_at');
      if (error) throw error;
      return (data || []) as FichePetit[];
    },
  });
}

export function useEtoiles(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['petits-etoiles', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await untypedDb.from('petits_etoiles').select('source, ref, created_at').eq('user_id', userId!);
      if (error) throw error;
      return (data || []) as Etoile[];
    },
  });
}

/** Donne une étoile (une seule fois pour la même source + ref) ; marche sans réseau. Renvoie true si elle est nouvelle. */
export function useGagnerEtoile(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return async (source: string, ref: string) => {
    if (!userId) return false;
    const cle = ['petits-etoiles', userId];
    const avant = queryClient.getQueryData<Etoile[]>(cle) ?? [];
    if (avant.some((e) => e.source === source && e.ref === ref)) return false;
    queryClient.setQueryData<Etoile[]>(cle, [...avant, { source, ref, created_at: new Date().toISOString() }]);
    try {
      await ecrireOuGarder({ table: 'petits_etoiles', op: 'upsert', rows: [{ user_id: userId, source, ref }] });
    } catch (e) { toast.error(errorMessage(e)); }
    return true;
  };
}

/** Un réglage de l'appli (table reglages_appli) : lu par tous, changé par l'enseignante */
export function useReglage<T>(cle: string, defaut: T) {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ['reglages-appli', cle],
    queryFn: async () => {
      const { data, error } = await untypedDb.from('reglages_appli').select('valeur').eq('cle', cle).maybeSingle();
      if (error) throw error;
      return ((data as { valeur?: T } | null)?.valeur ?? defaut) as T;
    },
  });
  const changer = async (valeur: T) => {
    queryClient.setQueryData(['reglages-appli', cle], valeur);
    const r = await ecrireOuGarder({ table: 'reglages_appli', op: 'upsert', rows: [{ cle, valeur, updated_at: new Date().toISOString() }] });
    toast.success(r === 'en_attente' ? '📡 Gardé, envoyé au retour du réseau' : 'Enregistré ✅');
  };
  return { valeur: q.data ?? defaut, changer };
}
