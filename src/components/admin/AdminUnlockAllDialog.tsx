import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Unlock, Users } from 'lucide-react';

interface Props {
  moduleType: 'sourates' | 'nourania' | 'invocations' | 'allah-names';
}

const MODULE_LABELS: Record<string, string> = {
  sourates: 'toutes les sourates',
  nourania: 'toutes les leçons Nourania',
  invocations: 'toutes les invocations',
  'allah-names': 'les 99 Noms d\'Allah',
};

const AdminUnlockAllDialog = ({ moduleType }: Props) => {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [originallyUnlockedIds, setOriginallyUnlockedIds] = useState<string[]>([]);
  const [snapshotTaken, setSnapshotTaken] = useState(false);

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

  // Detect which students already have full access
  const { data: fullyUnlockedIds = [], isFetched: fullyUnlockedFetched } = useQuery({
    queryKey: ['fully-unlocked-students', moduleType],
    enabled: open,
    queryFn: async () => {
      if (moduleType === 'sourates') {
        const { data: sourates } = await (supabase as any).from('sourates').select('id');
        const totalCount = sourates?.length || 0;
        if (!totalCount) return [];
        const { data: progress } = await (supabase as any)
          .from('user_sourate_progress')
          .select('user_id')
          .eq('context', 'sourates')
          .eq('is_validated', true);
        const counts: Record<string, number> = {};
        (progress || []).forEach((r: any) => { counts[r.user_id] = (counts[r.user_id] || 0) + 1; });
        return Object.entries(counts).filter(([, c]) => c >= totalCount).map(([id]) => id);

      } else if (moduleType === 'nourania') {
        const { data: lessons } = await (supabase as any).from('nourania_lessons').select('id');
        const totalCount = lessons?.length || 0;
        if (!totalCount) return [];
        const { data: progress } = await (supabase as any)
          .from('user_nourania_progress')
          .select('user_id')
          .eq('is_validated', true);
        const counts: Record<string, number> = {};
        (progress || []).forEach((r: any) => { counts[r.user_id] = (counts[r.user_id] || 0) + 1; });
        return Object.entries(counts).filter(([, c]) => c >= totalCount).map(([id]) => id);

      } else if (moduleType === 'invocations') {
        const { data: invocations } = await (supabase as any).from('invocations').select('id');
        const totalCount = invocations?.length || 0;
        if (!totalCount) return [];
        const { data: progress } = await (supabase as any)
          .from('user_invocation_progress')
          .select('user_id')
          .eq('is_validated', true);
        const counts: Record<string, number> = {};
        (progress || []).forEach((r: any) => { counts[r.user_id] = (counts[r.user_id] || 0) + 1; });
        return Object.entries(counts).filter(([, c]) => c >= totalCount).map(([id]) => id);

      } else if (moduleType === 'allah-names') {
        const { data: names } = await (supabase as any).from('allah_names').select('id');
        const totalCount = names?.length || 0;
        if (!totalCount) return [];
        const { data: progress } = await (supabase as any)
          .from('user_allah_name_progress')
          .select('user_id')
          .eq('is_validated', true);
        const counts: Record<string, number> = {};
        (progress || []).forEach((r: any) => { counts[r.user_id] = (counts[r.user_id] || 0) + 1; });
        return Object.entries(counts).filter(([, c]) => c >= totalCount).map(([id]) => id);
      }
      return [];
    },
  });

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSnapshotTaken(false);
      setSelectedIds([]);
      setOriginallyUnlockedIds([]);
    }
  }, [open]);

  // Pre-populate once when fresh data arrives
  useEffect(() => {
    if (open && fullyUnlockedFetched && !snapshotTaken) {
      setSelectedIds([...fullyUnlockedIds]);
      setOriginallyUnlockedIds([...fullyUnlockedIds]);
      setSnapshotTaken(true);
    }
  }, [open, fullyUnlockedFetched, fullyUnlockedIds, snapshotTaken]);

  const toUnlock = selectedIds.filter(id => !originallyUnlockedIds.includes(id));
  const toLock = originallyUnlockedIds.filter(id => !selectedIds.includes(id));
  const hasChanges = toUnlock.length > 0 || toLock.length > 0;

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (moduleType === 'sourates') {
        if (toUnlock.length > 0) {
          const { data: sourates, error } = await (supabase as any).from('sourates').select('id');
          if (error) throw error;
          const progressRows = toUnlock.flatMap((userId: string) =>
            (sourates || []).map((s: any) => ({
              user_id: userId,
              sourate_id: s.id,
              is_validated: true,
              progress_percentage: 100,
              context: 'sourates',
            }))
          );
          const { error: progressErr } = await (supabase as any)
            .from('user_sourate_progress')
            .upsert(progressRows, { onConflict: 'user_id,sourate_id,context' });
          if (progressErr) throw progressErr;
        }
        for (const userId of toLock) {
          const { error } = await (supabase as any)
            .from('user_sourate_progress')
            .delete()
            .eq('user_id', userId)
            .eq('context', 'sourates');
          if (error) throw error;
        }

      } else if (moduleType === 'nourania') {
        if (toUnlock.length > 0) {
          const { data: lessons, error } = await (supabase as any).from('nourania_lessons').select('id');
          if (error) throw error;
          for (const userId of toUnlock) {
            await (supabase as any).from('user_nourania_progress').delete().eq('user_id', userId);
            const rows = (lessons || []).map((l: any) => ({
              user_id: userId, lesson_id: l.id, is_validated: true, is_completed: true,
            }));
            const { error: insErr } = await (supabase as any).from('user_nourania_progress').insert(rows);
            if (insErr) throw insErr;
          }
        }
        for (const userId of toLock) {
          await (supabase as any).from('user_nourania_progress').delete().eq('user_id', userId);
        }

      } else if (moduleType === 'invocations') {
        if (toUnlock.length > 0) {
          const { data: invocations, error } = await (supabase as any).from('invocations').select('id');
          if (error) throw error;
          for (const userId of toUnlock) {
            await (supabase as any).from('user_invocation_progress').delete().eq('user_id', userId);
            const rows = (invocations || []).map((i: any) => ({
              user_id: userId, invocation_id: i.id, is_validated: true, is_memorized: true,
            }));
            const { error: insErr } = await (supabase as any).from('user_invocation_progress').insert(rows);
            if (insErr) throw insErr;
            await (supabase as any)
              .from('invocation_validation_requests').delete()
              .eq('user_id', userId).eq('status', 'pending');
          }
        }
        for (const userId of toLock) {
          await (supabase as any).from('user_invocation_progress').delete().eq('user_id', userId);
        }

      } else if (moduleType === 'allah-names') {
        if (toUnlock.length > 0) {
          const { data: names, error } = await (supabase as any).from('allah_names').select('id');
          if (error) throw error;
          for (const userId of toUnlock) {
            await (supabase as any).from('user_allah_name_progress').delete().eq('user_id', userId);
            const rows = (names || []).map((n: any) => ({
              user_id: userId, name_id: n.id, is_validated: true,
              validated_at: new Date().toISOString(),
            }));
            const { error: insErr } = await (supabase as any).from('user_allah_name_progress').insert(rows);
            if (insErr) throw insErr;
          }
        }
        for (const userId of toLock) {
          await (supabase as any).from('user_allah_name_progress').delete().eq('user_id', userId);
        }
      }

      // Recalculate points for all affected students.
      // Unlock: the DB trigger handles it per row, but we call explicitly as safety net.
      // Lock (delete): the trigger does NOT fire on DELETE, so this call is required.
      const allAffected = [...new Set([...toUnlock, ...toLock])];
      for (const userId of allAffected) {
        await supabase.rpc('recalculate_student_points', { p_user_id: userId });
      }
    },
    onSuccess: () => {
      const parts = [];
      if (toUnlock.length > 0) parts.push(`${toUnlock.length} élève(s) déverrouillé(s)`);
      if (toLock.length > 0) parts.push(`${toLock.length} élève(s) remis en mode normal`);
      toast.success(`✅ ${parts.join(' · ')}`);
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message || 'Erreur'),
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

  const getButtonLabel = () => {
    if (applyMutation.isPending) return 'Application…';
    const parts = [];
    if (toUnlock.length > 0) parts.push(`🔓 +${toUnlock.length}`);
    if (toLock.length > 0) parts.push(`🔒 -${toLock.length}`);
    if (parts.length === 0) return 'Aucun changement';
    return `Appliquer (${parts.join(' · ')})`;
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
        Accès complet
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Unlock className="h-4 w-4 text-emerald-600 shrink-0" />
              Accès complet — {MODULE_LABELS[moduleType]}
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground -mt-1">
            Les élèves <span className="font-medium text-foreground">cochés ✅</span> ont accès à tout.
            Décocher un élève le remet en mode normal (validation une par une).
          </p>

          <div className="border rounded-xl overflow-hidden">
            <label className="flex items-center gap-3 px-3 py-2.5 bg-muted/40 cursor-pointer border-b hover:bg-muted/60 transition-colors">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Tout sélectionner {!loadingStudents && `(${students.length} élèves)`}
                </span>
              </div>
            </label>

            <div className="max-h-52 overflow-y-auto divide-y">
              {loadingStudents ? (
                <p className="text-xs text-muted-foreground text-center py-4">Chargement…</p>
              ) : students.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Aucun élève trouvé</p>
              ) : (
                students.map((s: any) => {
                  const isChecked = selectedIds.includes(s.user_id);
                  const wasUnlocked = originallyUnlockedIds.includes(s.user_id);
                  return (
                    <label
                      key={s.user_id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggle(s.user_id)}
                      />
                      <span className="text-sm flex-1">{s.full_name || 'Élève sans nom'}</span>
                      {wasUnlocked && isChecked && (
                        <span className="text-[10px] text-emerald-600 font-medium shrink-0">Accès total</span>
                      )}
                      {wasUnlocked && !isChecked && (
                        <span className="text-[10px] text-amber-600 font-medium shrink-0">→ Mode normal</span>
                      )}
                      {!wasUnlocked && isChecked && (
                        <span className="text-[10px] text-blue-600 font-medium shrink-0">→ Accès total</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => applyMutation.mutate()}
              disabled={!hasChanges || applyMutation.isPending}
            >
              {getButtonLabel()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminUnlockAllDialog;
