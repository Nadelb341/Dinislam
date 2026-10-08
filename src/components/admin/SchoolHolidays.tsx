import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { moveToTrash } from '@/lib/trash';
import { errorMessage } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Holiday = Tables<'school_holidays'>;

/** Vacances scolaires : les notifications cochées « pause pendant les vacances » ne partent pas pendant ces périodes (2026-10-08) */
export function SchoolHolidays() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [toDelete, setToDelete] = useState<Holiday | null>(null);
  const [open, setOpen] = useState(false);

  const { data: holidays = [] } = useQuery({
    queryKey: ['school-holidays'],
    queryFn: async () => {
      const { data, error } = await supabase.from('school_holidays').select('*').order('start_date');
      if (error) throw error;
      return data || [];
    },
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['school-holidays'] });
  const d = (x: string) => format(parseISO(x), 'EEE d MMM yyyy', { locale: fr });
  const today = new Date().toISOString().slice(0, 10);

  const add = async () => {
    if (!label.trim() || !start || !end) { toast.error('Indique un nom, une date de début et une date de fin'); return; }
    if (end < start) { toast.error('La date de fin doit être après la date de début'); return; }
    const { error } = await supabase.from('school_holidays').insert({ label: label.trim(), start_date: start, end_date: end });
    if (error) { toast.error(errorMessage(error)); return; }
    setLabel(''); setStart(''); setEnd('');
    toast.success('Vacances ajoutées 🏖️');
    refresh();
  };

  const remove = async (h: Holiday) => {
    if (!user) return;
    const ok = await moveToTrash(user.id, 'school_holiday', h.id, `${h.label} (${format(parseISO(h.start_date), 'dd/MM')} → ${format(parseISO(h.end_date), 'dd/MM/yyyy')})`, h);
    if (!ok) { toast.error("Mise en corbeille impossible : rien n'a été supprimé"); return; }
    const { error } = await supabase.from('school_holidays').delete().eq('id', h.id);
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success('Période mise dans la corbeille (Paramètres)');
    refresh();
  };

  return (
    <div className="rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/20 p-3 space-y-2">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 text-sm font-semibold">
        <span>🏖️ Vacances scolaires (pause des rappels)</span>
        <span className="text-xs text-muted-foreground">{open ? '▾' : '▸'} {holidays.length}</span>
      </button>
      {open && (
        <>
          <p className="text-xs text-muted-foreground">Pendant ces périodes, les notifications cochées « 🏖️ Pause pendant les vacances » ne partent pas (ex. le rappel du mardi). Remplies avec la zone C (Montpellier).</p>
          <div className="space-y-1.5">
            {holidays.map((h) => (
              <div key={h.id} className={`flex items-center gap-2 rounded-lg bg-card border px-2 py-1.5 text-sm ${h.end_date < today ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium [overflow-wrap:anywhere]">{h.label}{h.start_date <= today && today <= h.end_date ? ' · en cours' : ''}</p>
                  <p className="text-xs text-muted-foreground">du {d(h.start_date)} au {d(h.end_date)}</p>
                </div>
                <button type="button" onClick={() => setToDelete(h)} className="text-destructive text-sm font-bold px-1" aria-label={`Supprimer ${h.label}`}>🗑️</button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. Vacances de Noël" aria-label="Nom des vacances" />
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Premier jour" />
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="Dernier jour"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
          </div>
          <Button size="sm" variant="outline" className="w-full" onClick={add}>➕ Ajouter une période</Button>
        </>
      )}
      <ConfirmDeleteDialog
        open={!!toDelete}
        onOpenChange={(o) => { if (!o) setToDelete(null); }}
        onConfirm={() => { if (toDelete) remove(toDelete); setToDelete(null); }}
        title="Supprimer cette période de vacances ?"
        description={toDelete ? `« ${toDelete.label} » ira dans la corbeille (Paramètres), tu pourras la restaurer.` : ''}
      />
    </div>
  );
}
