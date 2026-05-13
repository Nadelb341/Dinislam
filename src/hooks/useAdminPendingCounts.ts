import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

  const { data } = useQuery({
    queryKey: ['admin-pending-breakdown'],
    queryFn: async (): Promise<AdminPendingCounts> => {
      if (!user) return { registrations: 0, sourates: 0, nourania: 0, invocations: 0, messages: 0, homework: 0, recitations: 0, total: 0 };

      const [reg, sou, nou, msgs, hw, rec] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('sourate_validation_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('nourania_validation_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('user_messages').select('*', { count: 'exact', head: true }).eq('sender_type', 'user').eq('is_read', false),
        supabase.from('devoirs_rendus').select('*', { count: 'exact', head: true }).eq('statut', 'rendu'),
        supabase.from('sourate_recitations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      const r = reg.count || 0, s = sou.count || 0, n = nou.count || 0, m = msgs.count || 0, h = hw.count || 0, rc = rec.count || 0;
      return { registrations: r, sourates: s, nourania: n, invocations: 0, messages: m, homework: h, recitations: rc, total: r + s + n + m + h + rc };
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_messages' }, () => queryClient.invalidateQueries({ queryKey: ['admin-pending-breakdown'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devoirs_rendus' }, () => queryClient.invalidateQueries({ queryKey: ['admin-pending-breakdown'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sourate_recitations' }, () => queryClient.invalidateQueries({ queryKey: ['admin-pending-breakdown'] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, isAdmin, queryClient]);

  return data || { registrations: 0, sourates: 0, nourania: 0, invocations: 0, messages: 0, homework: 0, recitations: 0, total: 0 };
};
