import { useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useConfetti } from '@/hooks/useConfetti';
import { todayIso } from '@/lib/attendanceSessions';
import { attendanceStreak, buildAttendanceMessage } from '@/lib/attendanceMessage';

/**
 * Message éphémère à l'élève après le dernier cours (2026-10-07, textes choisis par Nadia), une seule fois :
 * présent / en retard / absent, accordé au féminin, avec le prénom, confettis si présent,
 * bonus « 🔥 N cours d'affilée » dès 3 cours suivis de suite. L'enseignante peut le couper pour un élève (Registre › 🔕).
 */
export default function AttendanceMessage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { fireConfetti } = useConfetti();
  const marked = useRef<string | null>(null);

  const { data } = useQuery({
    queryKey: ['attendance-message', user?.id],
    enabled: !!user && !isAdmin,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [{ data: records }, { data: profile }] = await Promise.all([
        supabase.from('attendance_records').select('id, date, status, send_message, message_seen_at')
          .eq('user_id', user!.id).lte('date', todayIso()).order('date', { ascending: false }).limit(20),
        supabase.from('profiles').select('full_name, gender').eq('user_id', user!.id).maybeSingle(),
      ]);
      return { records: records || [], profile };
    },
  });

  const last = data?.records[0];
  // Seulement le dernier cours, s'il est récent (3 semaines), pas encore vu et que l'enseignante n'a pas coupé le message
  const show = !!last && !last.message_seen_at && last.send_message && last.date >= format(subDays(new Date(), 21), 'yyyy-MM-dd');
  const streak = useMemo(() => attendanceStreak((data?.records ?? []).map((r) => r.status)), [data]);

  useEffect(() => {
    if (!show || !last || marked.current === last.id) return;
    marked.current = last.id;
    // Vu dès l'affichage : il ne reviendra pas, même si l'appli est fermée sans toucher le bouton
    supabase.rpc('mark_attendance_message_seen', { p_id: last.id }).then(() => {});
    if (last.status === 'present') window.setTimeout(fireConfetti, 300);
  }, [show, last, fireConfetti]);

  if (!show || !last) return null;
  const firstName = (data?.profile?.full_name || '').trim().split(/\s+/)[0];
  const close = () => queryClient.setQueryData(['attendance-message', user?.id], {
    ...data!, records: data!.records.map((r) => (r.id === last.id ? { ...r, message_seen_at: new Date().toISOString() } : r)),
  });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-sm text-center">
        <DialogTitle className="text-xl">Salam{firstName ? ` ${firstName}` : ''} 👋</DialogTitle>
        <p className="text-xs text-muted-foreground">Cours du {format(parseISO(last.date), 'EEEE d MMMM', { locale: fr })}</p>
        <p className="text-lg leading-relaxed">{buildAttendanceMessage(last.status, data?.profile?.gender === 'fille')}</p>
        {streak >= 3 && (
          <p className="rounded-xl bg-orange-100 dark:bg-orange-950/40 py-2 font-bold">🔥 {streak} cours d'affilée, quelle régularité !</p>
        )}
        <Button onClick={close} className="w-full">Merci 😊</Button>
      </DialogContent>
    </Dialog>
  );
}
