import { useCallback, useMemo } from 'react';
import { useLocal, useMaintenant } from '@/hooks/useDhikrLocal';
export { useLocal, useMaintenant, useJournee, noterDhikr, envoyerCarnetUneFois } from '@/hooks/useDhikrLocal';
import { useQuery } from '@tanstack/react-query';
import { untypedDb } from '@/lib/untypedDb';
import {
  carnetALHeure, cleAvancee, cleCarnet, ecrireLocal,
  avanceeDuJour, type AvanceeSerie, type Carnet,
} from '@/lib/dhikr';
import {
  DHIKR_GESTES_SECOURS, DHIKR_ITEMS_SECOURS, DHIKR_QUIZ_SECOURS, type DhikrGeste, type DhikrItem, type DhikrQuestion,
} from '@/data/dhikrContenu';

/**
 * 📿 Données de la carte Dhikr (Nadia, 27/11). Le contenu est lu EN BASE (dhikr_items, dhikr_gestes, dhikr_quiz) ;
 * base jamais lue sur cet appareil (1re fois hors ligne) → la copie de secours du code (jamais d'écran vide).
 * En direct : `realtimeSync.ts` (clés 'dhikr-…'). Carnet, journée et séries en cours : gardés sur l'appareil.
 */
async function lire<T>(table: string): Promise<T[]> {
  const { data, error } = await untypedDb.from(table).select('*').order('position').order('created_at');
  if (error) throw error;
  return (data || []) as T[];
}

// Copie de secours : seulement ce qui est visible (jamais un texte caché « à confirmer »)
const SECOURS_ITEMS = DHIKR_ITEMS_SECOURS.filter((x) => x.visible);
const SECOURS_GESTES = DHIKR_GESTES_SECOURS.filter((x) => x.visible);

export function useDhikrItems() {
  const q = useQuery({ queryKey: ['dhikr-items'], queryFn: () => lire<DhikrItem>('dhikr_items'), retry: 1 });
  return { items: q.data ?? SECOURS_ITEMS, enBase: !!q.data, chargement: q.isLoading };
}
export function useDhikrGestes() {
  const q = useQuery({ queryKey: ['dhikr-gestes'], queryFn: () => lire<DhikrGeste>('dhikr_gestes'), retry: 1 });
  return { gestes: q.data ?? SECOURS_GESTES, enBase: !!q.data, chargement: q.isLoading };
}
export function useDhikrQuiz() {
  const q = useQuery({ queryKey: ['dhikr-quiz'], queryFn: () => lire<DhikrQuestion>('dhikr_quiz'), retry: 1 });
  return { questions: q.data ?? DHIKR_QUIZ_SECOURS, enBase: !!q.data };
}

export function useCarnet(uid: string | null | undefined) {
  const brut = useLocal<Carnet>(uid ? cleCarnet(uid) : null);
  const maintenant = useMaintenant();
  return useMemo(() => carnetALHeure(brut, maintenant), [brut, maintenant]);
}
export function useAvancee(uid: string | null | undefined, serie: string) {
  const brut = useLocal<AvanceeSerie>(uid ? cleAvancee(uid, serie) : null);
  const maintenant = useMaintenant();
  const avancee = useMemo(() => avanceeDuJour(brut, maintenant), [brut, maintenant]);
  const ecrire = useCallback((a: AvanceeSerie) => { if (uid) ecrireLocal(cleAvancee(uid, serie), a); }, [uid, serie]);
  return { avancee, ecrire };
}

// ─── I · Défi du groupe ───────────────────────────────────────────────────────
export interface DefiDhikr {
  id: string; titre: string; dhikr_cle: string | null; dhikr_titre: string | null; objectif: number;
  group_ids: string[]; debut: string; fin: string; total: number; created_at: string;
}
export interface Participation { id: string; defi_id: string; user_id: string; nombre: number; created_at: string }

export function useDefis(actif = true) {
  return useQuery({
    queryKey: ['dhikr-defis'], enabled: actif, retry: 1,
    queryFn: async () => {
      const { data, error } = await untypedDb.from('dhikr_defis').select('*').order('fin', { ascending: false });
      if (error) throw error;
      return (data || []) as DefiDhikr[];
    },
  });
}
/** L'élève : seulement SES ajouts (la base ne lui montre pas les autres). L'enseignante : tous. */
export function useParticipations(actif = true) {
  return useQuery({
    queryKey: ['dhikr-participations'], enabled: actif, retry: 1,
    queryFn: async () => {
      const { data, error } = await untypedDb.from('dhikr_defi_participations').select('*').order('created_at', { ascending: false }).limit(2000);
      if (error) throw error;
      return (data || []) as Participation[];
    },
  });
}
