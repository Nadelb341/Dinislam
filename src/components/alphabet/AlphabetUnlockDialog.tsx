import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/utils';
import { computeUnlocked, type AlphabetLetterLite } from '@/lib/alphabetProgress';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letters: AlphabetLetterLite[];
  /** Élève présélectionné (depuis sa fiche) */
  initialStudentId?: string;
}

/**
 * Admin : débloquer à la main une ou plusieurs lettres pour un élève.
 * Une lettre débloquée reste ouverte mais n'ouvre pas les suivantes (voir lib/alphabetProgress).
 */
export function AlphabetUnlockDialog({ open, onOpenChange, letters, initialStudentId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState<string>(initialStudentId ?? '');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open && initialStudentId) setStudentId(initialStudentId); }, [open, initialStudentId]);

  const { data: students = [] } = useQuery({
    queryKey: ['alphabet-unlock-students'],
    enabled: open,
    queryFn: async () => {
      const [{ data: profiles }, { data: admins }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').eq('is_approved', true).order('full_name'),
        supabase.from('user_roles').select('user_id').eq('role', 'admin'),
      ]);
      const adminIds = new Set((admins || []).map((a) => a.user_id));
      return (profiles || []).filter((p) => !adminIds.has(p.user_id));
    },
  });

  const { data: studentData, isFetching } = useQuery({
    queryKey: ['alphabet-unlock-student', studentId],
    enabled: open && !!studentId,
    queryFn: async () => {
      const [{ data: progress }, { data: unlocks }] = await Promise.all([
        supabase.from('user_alphabet_progress').select('letter_id').eq('user_id', studentId).eq('is_validated', true),
        supabase.from('alphabet_admin_unlocks').select('letter_id').eq('user_id', studentId),
      ]);
      return {
        learned: new Set((progress || []).map((p) => p.letter_id)),
        unlocks: new Set((unlocks || []).map((u) => u.letter_id)),
      };
    },
  });

  useEffect(() => { setSelected(new Set(studentData?.unlocks ?? [])); }, [studentData]);

  const orderedIds = useMemo(() => letters.map((l) => l.id), [letters]);
  const learned = useMemo(() => studentData?.learned ?? new Set<number>(), [studentData]);
  // Ce que l'élève a ouvert par son propre suivi (sans les déblocages admin)
  const byOrder = useMemo(() => computeUnlocked(orderedIds, learned, new Set(), false).unlocked, [orderedIds, learned]);

  const original = studentData?.unlocks ?? new Set<number>();
  const toAdd = [...selected].filter((id) => !original.has(id));
  const toRemove = [...original].filter((id) => !selected.has(id));

  const toggle = (id: number) => {
    if (learned.has(id) || byOrder.has(id)) return; // déjà ouverte par l'élève lui-même
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const unlockAll = () => setSelected(new Set(letters.filter((l) => !byOrder.has(l.id) && !learned.has(l.id)).map((l) => l.id)));

  const save = async () => {
    if (!studentId || !user) return;
    setSaving(true);
    try {
      if (toAdd.length) {
        const { error } = await supabase.from('alphabet_admin_unlocks')
          .insert(toAdd.map((letter_id) => ({ user_id: studentId, letter_id, created_by: user.id })));
        if (error) throw error;
      }
      if (toRemove.length) {
        const { error } = await supabase.from('alphabet_admin_unlocks')
          .delete().eq('user_id', studentId).in('letter_id', toRemove);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ['alphabet-unlock-student', studentId] });
      queryClient.invalidateQueries({ queryKey: ['alphabet-admin-unlocks'] });
      toast.success(`✅ ${toAdd.length ? `${toAdd.length} lettre(s) débloquée(s)` : ''}${toAdd.length && toRemove.length ? ' · ' : ''}${toRemove.length ? `${toRemove.length} reverrouillée(s)` : ''}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogTitle>🔓 Débloquer des lettres</DialogTitle>
        <DialogDescription>
          Les lettres débloquées ici restent ouvertes pour l'élève, sans ouvrir les suivantes : l'ordre continue selon ce qu'il apprend.
        </DialogDescription>

        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full h-11 rounded-xl border border-border bg-background px-3"
          aria-label="Élève"
        >
          <option value="">Choisir un élève…</option>
          {students.map((s) => <option key={s.user_id} value={s.user_id}>{s.full_name || 'Élève'}</option>)}
        </select>

        {studentId && (
          <>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>🟢 apprise</span><span>🔵 ouverte par son suivi</span><span>🟡 débloquée par toi</span><span>🔒 fermée</span>
            </div>
            <div dir="rtl" className={`grid grid-cols-7 gap-1.5 ${isFetching ? 'opacity-50' : ''}`}>
              {letters.map((l) => {
                const isLearned = learned.has(l.id);
                const isOrder = byOrder.has(l.id);
                const isAdmin = selected.has(l.id);
                const cls = isLearned ? 'bg-emerald-100 border-emerald-400 dark:bg-emerald-950/40'
                  : isOrder ? 'bg-sky-100 border-sky-400 dark:bg-sky-950/40'
                  : isAdmin ? 'bg-amber-100 border-amber-400 dark:bg-amber-950/40'
                  : 'bg-muted/40 border-border opacity-70';
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggle(l.id)}
                    className={`relative aspect-square rounded-xl border-2 font-arabic text-2xl ${cls}`}
                    aria-label={`${l.name_french}${isAdmin ? ' (débloquée par toi)' : ''}`}
                  >
                    {l.letter_arabic}
                    {!isLearned && !isOrder && !isAdmin && <span className="absolute bottom-0 end-0.5 text-[9px]">🔒</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Touche une lettre fermée pour la débloquer, touche-la encore pour la refermer.</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={unlockAll}>Tout débloquer</Button>
              <Button variant="outline" onClick={() => setSelected(new Set())}>Tout refermer</Button>
            </div>
            <Button className="w-full" disabled={saving || (!toAdd.length && !toRemove.length)} onClick={save}>
              {toAdd.length || toRemove.length ? `Enregistrer (🔓 +${toAdd.length} · 🔒 −${toRemove.length})` : 'Aucun changement'}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
