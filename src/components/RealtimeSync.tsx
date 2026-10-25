import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  REALTIME_DEBOUNCE_MS,
  REALTIME_EVENT,
  REALTIME_TABLES,
  REALTIME_TABLE_QUERY_KEYS,
  type RealtimeEventDetail,
} from '@/lib/realtimeSync';

/**
 * 🔄 Une seule connexion en direct pour toute l'appli (monté une fois dans App.tsx, ne dessine rien).
 * À chaque ajout / modification / suppression dans une des tables de `REALTIME_TABLE_QUERY_KEYS` :
 *  - les requêtes react-query concernées sont rafraîchies ;
 *  - l'événement navigateur `dinislam:realtime` prévient les écrans chargés sans react-query.
 * Les changements arrivés en rafale (réordonnancement…) sont regroupés : un seul rafraîchissement.
 * Tout est protégé : une erreur ici ne doit jamais empêcher l'appli de s'ouvrir.
 */
const RealtimeSync = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    const pending = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      timer = null;
      const tables = [...pending];
      pending.clear();
      try {
        const prefixes = new Set<string>();
        tables.forEach((t) => (REALTIME_TABLE_QUERY_KEYS[t] ?? []).forEach((k) => prefixes.add(k)));
        prefixes.forEach((k) => { void queryClient.invalidateQueries({ queryKey: [k] }); });
        tables.forEach((table) => {
          window.dispatchEvent(new CustomEvent<RealtimeEventDetail>(REALTIME_EVENT, { detail: { table } }));
        });
      } catch (err) {
        console.error('Mise à jour en direct impossible :', err);
      }
    };

    const onChange = (table: string) => {
      pending.add(table);
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, REALTIME_DEBOUNCE_MS);
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase.channel(`dinislam-direct-${userId}`);
      REALTIME_TABLES.forEach((table) => {
        channel!.on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange(table));
      });
      channel.subscribe();
    } catch (err) {
      console.error('Connexion en direct impossible :', err);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (channel) { try { void supabase.removeChannel(channel); } catch { /* déjà fermée */ } }
    };
  }, [userId, queryClient]);

  return null;
};

export default RealtimeSync;
