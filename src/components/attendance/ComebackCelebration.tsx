import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useConfetti } from '@/hooks/useConfetti';
import { withName } from '@/lib/encouragements';

/** 🎉 « Bon retour » (idée 5, 2026-10-08) : l'élève qui décrochait vient de revalider → message + confettis, une seule fois */
export default function ComebackCelebration() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { fireConfetti } = useConfetti();
  const done = useRef(false);

  const { data } = useQuery({
    queryKey: ['comeback', user?.id],
    enabled: !!user && !isAdmin,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from('dropout_state').select('comeback_seen, comeback_at').eq('student_id', user!.id).maybeSingle();
      return data;
    },
  });
  const show = !!data && data.comeback_seen === false;

  useEffect(() => {
    if (!show || done.current) return;
    done.current = true;
    supabase.rpc('mark_comeback_seen').then(() => {});
    window.setTimeout(fireConfetti, 300);
  }, [show, fireConfetti]);

  if (!show) return null;
  const close = () => queryClient.setQueryData(['comeback', user?.id], { ...data, comeback_seen: true });
  return (
    <Dialog open onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-sm text-center">
        <DialogTitle className="text-2xl">{withName(user, '🎉 Bon retour, {prenom} !')}</DialogTitle>
        <p className="text-lg">On est fiers de toi, tu as repris ton chemin ! Continue comme ça 💪</p>
        <Button onClick={close} className="w-full">Merci 😊</Button>
      </DialogContent>
    </Dialog>
  );
}
