import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { untypedDb } from '@/lib/untypedDb';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { errorMessage } from '@/lib/utils';
import type { CleRubrique } from '@/lib/petits';

/** 🧸 Données de l'accueil du Groupe 0 (Nadia, 2026-11-22) */
export interface FichePetit {
  id: string; rubrique: CleRubrique; titre: string; arabe: string | null; texte: string | null; emoji: string | null;
  image_url: string | null; audio_url: string | null; versets: string[] | null; position: number;
}
export interface Etoile { source: string; ref: string; created_at: string }

/** L'élève est-il dans le Groupe 0 ? (même repère que l'onglet « tout-petits » : groupe dont le nom commence par « Groupe 0 ») */
export function useEstGroupe0(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['groupe0', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: m, error } = await supabase.from('student_group_members').select('group_id').eq('user_id', userId!);
      if (error) throw error;
      const ids = (m || []).map((r) => r.group_id);
      if (!ids.length) return false;
      const { data: g, error: e2 } = await supabase.from('student_groups').select('name').in('id', ids);
      if (e2) throw e2;
      return (g || []).some((x) => /^groupe 0/i.test(x.name.trim()));
    },
  });
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
