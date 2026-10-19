import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CRASH_ACTION } from '@/lib/crashLog';

/** Pastille du Monitoring : erreurs pas encore lues + plantages « chat qui pleure » pas encore résolus */
export function useMonitoringErrorCount() {
  const { isAdmin } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    const load = async () => {
      const [{ count: unread }, { count: crashes }] = await Promise.all([
        supabase
          .from('app_logs')
          .select('*', { count: 'exact', head: true })
          .in('level', ['error', 'warn'])
          .eq('is_read', false)
          .neq('action', CRASH_ACTION),
        supabase
          .from('app_logs')
          .select('*', { count: 'exact', head: true })
          .eq('action', CRASH_ACTION)
          .is('resolved_at', null),
      ]);
      setCount((unread || 0) + (crashes || 0));
    };

    load();
    const interval = setInterval(load, 60000);
    window.addEventListener('dinislam:crashes-changed', load);
    return () => { clearInterval(interval); window.removeEventListener('dinislam:crashes-changed', load); };
  }, [isAdmin]);

  return count;
}
