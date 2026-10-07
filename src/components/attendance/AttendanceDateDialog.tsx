import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/lib/utils';
import { addAttendanceSession, deleteAttendanceSession, moveAttendanceSession, todayIso } from '@/lib/attendanceSessions';

/**
 * Enseignante : ajouter une date de cours, changer la date d'une séance (les présences suivent) ou la supprimer (corbeille).
 * `date` = null → ajout ; sinon modification de cette séance. `existing` = dates déjà enregistrées (pour éviter les doublons).
 */
export function AttendanceDateDialog({ open, date, existing, level = 'base', onClose }: {
  open: boolean; date: string | null; existing: string[]; level?: 'base' | 'nested'; onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { if (open) setValue(date ?? todayIso()); }, [open, date]);

  const refresh = () => {
    for (const key of ['attendance-records', 'all-attendance', 'my-attendance', 'attendance-sessions']) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
  const nice = (d: string) => format(parseISO(d), 'EEEE dd MMMM yyyy', { locale: fr });

  const save = async () => {
    if (!value || value === date) return;
    if (existing.includes(value)) {
      toast.error(`Il y a déjà une séance le ${format(parseISO(value), 'dd/MM/yyyy')}`);
      return;
    }
    setSaving(true);
    try {
      if (date) await moveAttendanceSession(date, value);
      else await addAttendanceSession(value, user?.id);
      toast.success(date ? `Séance déplacée au ${nice(value)}` : `Séance du ${nice(value)} ajoutée`);
      refresh();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!date || !user) return;
    try {
      await deleteAttendanceSession(date, user.id, `Séance du ${format(parseISO(date), 'dd/MM/yyyy')}`);
      toast.success('Séance mise dans la corbeille (Paramètres)');
      refresh();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm" level={level}>
        <DialogTitle className="pe-8">{date ? '📅 Modifier la séance' : '➕ Ajouter une date de cours'}</DialogTitle>
        {date && <p className="text-sm text-muted-foreground">Séance du {nice(date)}. Si tu changes la date, les présences déjà notées la suivent.</p>}
        <Input type="date" value={value} onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } }} aria-label="Date du cours" />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={save} disabled={saving || !value || value === date}>{date ? 'Enregistrer' : 'Ajouter'}</Button>
        </div>
        {date && (
          <Button variant="outline" className="w-full text-destructive border-destructive/40" onClick={() => setConfirmDelete(true)}>🗑️ Supprimer cette séance</Button>
        )}
        <ConfirmDeleteDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          onConfirm={() => { setConfirmDelete(false); remove(); }}
          title="Supprimer cette séance ?"
          description={date ? `La séance du ${format(parseISO(date), 'dd/MM/yyyy')} et les présences de tous les élèves iront dans la corbeille (Paramètres), d'où tu pourras les restaurer.` : ''}
        />
      </DialogContent>
    </Dialog>
  );
}
