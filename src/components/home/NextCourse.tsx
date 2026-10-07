import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/utils';
import { openGroupMessage } from '@/lib/adminBridge';
import { courseItems, type AdminTask } from '@/lib/adminTasks';

/**
 * Idée 3 : « Mode cours » — grand écran simple pour cocher pendant le cours.
 * Idée 4 : « Terminer le cours » → ce qui n'a pas été fait reste pour le cours suivant, avec 🔁 (nombre de reports).
 * Charge lui-même les lignes du groupe : s'ouvre depuis la carte À FAIRE ou depuis le Registre de présence (idée 5).
 */
export function CourseModeDialog({ groupId, groupName, open, onClose }: { groupId: string | null; groupName: string; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [confirmItem, setConfirmItem] = useState<AdminTask | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ['admin-tasks'],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_tasks').select('*').order('position');
      if (error) throw error;
      return (data || []) as AdminTask[];
    },
  });
  const mine = useMemo(() => tasks.filter((t) => (groupId === null ? !t.group_id : t.group_id === groupId)), [tasks, groupId]);
  const { todo, bring } = courseItems(mine);
  const doneToday = mine.filter((t) => t.next_course && t.done && (t.done_at ?? '').slice(0, 10) === new Date().toISOString().slice(0, 10));

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });

  const markDone = async (t: AdminTask) => {
    const { error } = await supabase.from('admin_tasks').update({ done: true, done_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', t.id);
    if (error) toast.error(errorMessage(error)); else refresh();
  };

  const endCourse = async () => {
    const left = [...todo, ...bring];
    try {
      const results = await Promise.all(left.map((t) => supabase.from('admin_tasks').update({ carried: (t.carried ?? 0) + 1, updated_at: new Date().toISOString() }).eq('id', t.id)));
      if (results.some((r) => r.error)) throw new Error("Le report n'a pas pu être enregistré pour toutes les lignes");
      toast.success(left.length ? `Cours terminé ✓ ${left.length} ligne${left.length > 1 ? 's' : ''} reportée${left.length > 1 ? 's' : ''} au prochain cours 🔁` : 'Cours terminé ✓ Tout a été fait, machaAllah 🎉');
      refresh();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const Row = ({ t }: { t: AdminTask }) => (
    <label className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3 cursor-pointer active:scale-[0.99]">
      <input type="checkbox" checked={false} onChange={() => setConfirmItem(t)} className="h-7 w-7 shrink-0 accent-emerald-600" aria-label={`Valider : ${t.title}`} />
      <span className="flex-1 min-w-0 text-lg leading-snug [overflow-wrap:anywhere]">{t.urgent && '⭐ '}{t.title}</span>
      {(t.carried ?? 0) > 0 && <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 text-xs font-bold">🔁 ×{t.carried}</span>}
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto" level="nested">
        <DialogTitle className="text-2xl pe-8 [overflow-wrap:anywhere]">🎒 Cours · {groupName}</DialogTitle>
        {todo.length === 0 && bring.length === 0 && (
          <p className="text-center text-muted-foreground py-6">Rien de prévu pour ce cours. Ajoute des lignes avec 🎒 dans la carte À FAIRE.</p>
        )}
        {todo.length > 0 && (
          <div className="space-y-2">
            <p className="font-bold">À faire pendant le cours</p>
            {todo.map((t) => <Row key={t.id} t={t} />)}
          </div>
        )}
        {bring.length > 0 && (
          <div className="space-y-2">
            <p className="font-bold">🧳 Les élèves devaient apporter</p>
            {bring.map((t) => <Row key={t.id} t={t} />)}
          </div>
        )}
        {doneToday.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">✅ Fait aujourd'hui</p>
            {doneToday.map((t) => <p key={t.id} className="text-sm line-through text-muted-foreground [overflow-wrap:anywhere]">{t.title}</p>)}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <Button onClick={() => setConfirmEnd(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">✅ Terminer le cours</Button>
        </div>

        <AlertDialog open={!!confirmItem} onOpenChange={(o) => { if (!o) setConfirmItem(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Valider cette ligne ?</AlertDialogTitle>
              <AlertDialogDescription className="[overflow-wrap:anywhere]">« {confirmItem?.title} » sera barrée et rangée dans « Fait ».</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (confirmItem) markDone(confirmItem); setConfirmItem(null); }}>✅ Valider</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Terminer le cours ?</AlertDialogTitle>
              <AlertDialogDescription>
                {todo.length + bring.length > 0
                  ? `${todo.length + bring.length} ligne${todo.length + bring.length > 1 ? 's' : ''} pas encore faite${todo.length + bring.length > 1 ? 's' : ''} : elle${todo.length + bring.length > 1 ? 's restent' : ' reste'} pour le prochain cours, avec 🔁.`
                  : 'Tout a été fait pour ce cours.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={endCourse}>Terminer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

/** Idée 6 : annoncer au groupe ce qu'on fera au prochain cours (lignes au choix) et ce qu'il faut apporter (idée 7) */
export function AnnounceDialog({ groupId, groupName, tasks, open, onClose, onSent }: { groupId: string | null; groupName: string; tasks: AdminTask[]; open: boolean; onClose: () => void; onSent?: () => void }) {
  const { todo, bring } = courseItems(tasks);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  useEffect(() => { if (open) setPicked(new Set([...todo, ...bring].map((t) => t.id))); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const text = useMemo(() => {
    const a = todo.filter((t) => picked.has(t.id)).map((t) => `• ${t.title}`);
    const b = bring.filter((t) => picked.has(t.id)).map((t) => `• ${t.title}`);
    return [
      a.length ? `📚 Au prochain cours, inch'Allah :\n${a.join('\n')}` : '',
      b.length ? `🧳 Pense à apporter :\n${b.join('\n')}` : '',
    ].filter(Boolean).join('\n\n');
  }, [todo, bring, picked]);

  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const Line = ({ t }: { t: AdminTask }) => (
    <label className="flex items-start gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={picked.has(t.id)} onChange={() => toggle(t.id)} className="mt-0.5 h-4 w-4" />
      <span className="[overflow-wrap:anywhere]">{t.title}</span>
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" level="nested">
        <DialogTitle className="pe-8 [overflow-wrap:anywhere]">📢 Annoncer au groupe · {groupName}</DialogTitle>
        <p className="text-sm text-muted-foreground">Choisis les lignes à envoyer aux élèves : la messagerie s'ouvrira avec le message prêt, tu pourras encore le modifier.</p>
        {todo.length > 0 && <div className="space-y-1.5"><p className="text-xs font-semibold">Au prochain cours</p>{todo.map((t) => <Line key={t.id} t={t} />)}</div>}
        {bring.length > 0 && <div className="space-y-1.5"><p className="text-xs font-semibold">🧳 À apporter</p>{bring.map((t) => <Line key={t.id} t={t} />)}</div>}
        {text && <pre className="whitespace-pre-wrap rounded-xl bg-muted/50 p-3 text-sm font-sans [overflow-wrap:anywhere]">{text}</pre>}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button disabled={!text} onClick={() => { onClose(); onSent?.(); openGroupMessage({ groupIds: groupId ? [groupId] : [], text }); }}>Préparer le message</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
