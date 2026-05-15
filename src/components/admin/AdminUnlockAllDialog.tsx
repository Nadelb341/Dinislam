import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Unlock, Users } from 'lucide-react';

interface Props {
  moduleType: 'sourates' | 'nourania' | 'invocations';
}

const MODULE_LABELS: Record<string, string> = {
  sourates: 'toutes les sourates',
  nourania: 'toutes les leçons Nourania',
  invocations: 'toutes les invocations',
};

const AdminUnlockAllDialog = ({ moduleType }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['admin-students-unlock-list'],
    queryFn: async () => {
      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('user_id, full_name')
        .eq('is_approved', true)
        .order('full_name');

      const { data: adminRoles } = await (supabase as any)
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      const adminIds = new Set((adminRoles || []).map((r: any) => r.user_id));
      return (profiles || []).filter((s: any) => !adminIds.has(s.user_id));
    },
    enabled: open,
  });

  const unlockMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      if (!user) throw new Error('Non connecté');

      if (moduleType === 'sourates') {
        const { data: sourates, error } = await (supabase as any).from('sourates').select('id');
        if (error) throw error;

        // Batch upsert all progress (unique constraint exists on user_id,sourate_id)
        const progressRows = userIds.flatMap((userId: string) =>
          (sourates || []).map((s: any) => ({
            user_id: userId,
            sourate_id: s.id,
            is_validated: true,
            is_memorized: true,
            progress_percentage: 100,
          }))
        );
        const { error: progressErr } = await (supabase as any)
          .from('user_sourate_progress')
          .upsert(progressRows, { onConflict: 'user_id,sourate_id' });
        if (progressErr) throw progressErr;

      } else if (moduleType === 'nourania') {
        const { data: lessons, error } = await (supabase as any).from('nourania_lessons').select('id');
        if (error) throw error;

        for (const userId of userIds) {
          await (supabase as any).from('user_nourania_progress').delete().eq('user_id', userId);
          const rows = (lessons || []).map((l: any) => ({
            user_id: userId,
            lesson_id: l.id,
            is_validated: true,
            is_completed: true,
          }));
          const { error: insErr } = await (supabase as any).from('user_nourania_progress').insert(rows);
          if (insErr) throw insErr;
        }

      } else if (moduleType === 'invocations') {
        const { data: invocations, error } = await (supabase as any).from('invocations').select('id');
        if (error) throw error;

        for (const userId of userIds) {
          await (supabase as any).from('user_invocation_progress').delete().eq('user_id', userId);
          const rows = (invocations || []).map((i: any) => ({
            user_id: userId,
            invocation_id: i.id,
            is_validated: true,
            is_memorized: true,
          }));
          const { error: insErr } = await (supabase as any).from('user_invocation_progress').insert(rows);
          if (insErr) throw insErr;
          // Clear pending requests
          await (supabase as any)
            .from('invocation_validation_requests')
            .delete()
            .eq('user_id', userId)
            .eq('status', 'pending');
        }
      }
    },
    onSuccess: () => {
      toast.success(`✅ ${MODULE_LABELS[moduleType]} ont été déverrouillées pour ${selectedIds.length} élève(s) !`);
      setOpen(false);
      setSelectedIds([]);
    },
    onError: (e: any) => toast.error(e.message || 'Erreur lors du déverrouillage'),
  });

  const allSelected = students.length > 0 && selectedIds.length === students.length;

  const toggleAll = (checked: boolean | 'indeterminate') => {
    setSelectedIds(checked === true ? students.map((s: any) => s.user_id) : []);
  };

  const toggle = (userId: string) => {
    setSelectedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950"
      >
        <Unlock className="h-3.5 w-3.5 mr-1.5" />
        Déverrouiller tout
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Unlock className="h-4 w-4 text-emerald-600 shrink-0" />
              Déverrouiller {MODULE_LABELS[moduleType]}
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground -mt-1">
            Sélectionne les élèves pour qui tout le contenu sera immédiatement accessible.
          </p>

          <div className="border rounded-xl overflow-hidden">
            {/* Tout sélectionner */}
            <label className="flex items-center gap-3 px-3 py-2.5 bg-muted/40 cursor-pointer border-b hover:bg-muted/60 transition-colors">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
              />
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Tout sélectionner {!loadingStudents && `(${students.length} élèves)`}
                </span>
              </div>
            </label>

            {/* Liste élèves */}
            <div className="max-h-52 overflow-y-auto divide-y">
              {loadingStudents ? (
                <p className="text-xs text-muted-foreground text-center py-4">Chargement…</p>
              ) : students.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Aucun élève trouvé</p>
              ) : (
                students.map((s: any) => (
                  <label
                    key={s.user_id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <Checkbox
                      checked={selectedIds.includes(s.user_id)}
                      onCheckedChange={() => toggle(s.user_id)}
                    />
                    <span className="text-sm">{s.full_name || 'Élève sans nom'}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => unlockMutation.mutate(selectedIds)}
              disabled={selectedIds.length === 0 || unlockMutation.isPending}
            >
              {unlockMutation.isPending
                ? 'Déverrouillage…'
                : `🔓 Déverrouiller (${selectedIds.length})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminUnlockAllDialog;
