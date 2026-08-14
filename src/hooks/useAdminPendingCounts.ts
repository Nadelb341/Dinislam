import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

interface AdminPendingCounts {
  registrations: number;
  sourates: number;
  nourania: number;
  invocations: number;
  messages: number;
  homework: number;
  recitations: number;
  total: number;
}

export const useAdminPendingCounts = (): AdminPendingCounts => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  // Réutilise le même compteur que l'icône ✉️ du header (même requête exacte côté admin) —
  // évite d'avoir deux requêtes indépendantes qui peuvent afficher des chiffres différents.
  const { unreadCount: messagesCount } = useUnreadMessages();

  const { data } = useQuery({
    queryKey: ['admin-pending-breakdown'],
    queryFn: async (): Promise<Omit<AdminPendingCounts, 'messages' | 'total'>> => {
      if (!user) return { registrations: 0, sourates: 0, nourania: 0, invocations: 0, homework: 0, recitations: 0 };

      const [reg, sou, nou, hw, rec] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('sourate_validation_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('nourania_validation_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('devoirs_rendus').select('*', { count: 'exact', head: true }).eq('statut', 'rendu'),
        supabase.from('sourate_recitations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      const r = reg.count || 0, s = sou.count || 0, n = nou.count || 0, h = hw.count || 0, rc = rec.count || 0;
      return { registrations: r, sourates: s, nourania: n, invocations: 0, homework: h, recitations: rc };
    },
    enabled: !!user && isAdmin,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!user || !isAdmin) return;
    const channel = supabase.channel('admin-pending-breakdown')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => queryClient.invalidateQueries({ queryKey: ['admin-pending-breakdown'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sourate_validation_requests' }, () => queryClient.invalidateQueries({ queryKey: ['admin-pending-breakdown'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nourania_validation_requests' }, () => queryClient.invalidateQueries({ queryKey: ['admin-pending-breakdown'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devoirs_rendus' }, () => queryClient.invalidateQueries({ queryKey: ['admin-pending-breakdown'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sourate_recitations' }, () => queryClient.invalidateQueries({ queryKey: ['admin-pending-breakdown'] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, isAdmin, queryClient]);

  const base = data || { registrations: 0, sourates: 0, nourania: 0, invocations: 0, homework: 0, recitations: 0 };
  return {
    ...base,
    messages: messagesCount,
    total: base.registrations + base.sourates + base.nourania + base.homework + base.recitations + messagesCount,
  };
};
