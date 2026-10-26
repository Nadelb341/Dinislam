import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNiveaux, type Niveau } from '@/hooks/useNiveaux';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { trashThenDelete } from '@/lib/trash';
import { errorMessage, cn } from '@/lib/utils';
import type { TodoStudent } from '@/lib/adminTasks';

const COULEURS = ['bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100', 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100', 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100', 'bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-100'];

/** 🎚️ Créer les niveaux d'un groupe (ex. « Dalil » seul, « Les autres ») : un toucher sur un élève le range dans le niveau */
export default function NiveauxGroupe({ groupId, groupName, students, onBack }: { groupId: string; groupName: string; students: TodoStudent[]; onBack: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: niveaux = [] } = useNiveaux(groupId);
  const [nom, setNom] = useState('');
  const [aSupprimer, setASupprimer] = useState<Niveau | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['cahier-classe', 'niveaux', groupId] });

  const ajouter = async () => {
    if (!nom.trim()) return;
    const { error } = await supabase.from('group_levels').insert({ group_id: groupId, name: nom.trim(), position: niveaux.length });
    if (error) { toast.error(errorMessage(error)); return; }
    setNom(''); refresh();
  };
  // Un élève n'est que dans un seul niveau : le toucher le déplace
  const ranger = async (n: Niveau, studentId: string) => {
    const dedans = n.member_ids.includes(studentId);
    const maj = niveaux.map((x) => ({ ...x, member_ids: x.id === n.id ? (dedans ? x.member_ids.filter((i) => i !== studentId) : [...x.member_ids, studentId]) : x.member_ids.filter((i) => i !== studentId) }));
    const touches = maj.filter((x, k) => x.member_ids.join() !== niveaux[k].member_ids.join());
    const res = await Promise.all(touches.map((x) => supabase.from('group_levels').update({ member_ids: x.member_ids }).eq('id', x.id)));
    const err = res.find((r) => r.error)?.error;
    if (err) toast.error(errorMessage(err));
    refresh();
  };
  const supprimer = async (n: Niveau) => {
    if (!user) return;
    try {
      await trashThenDelete({ userId: user.id, type: 'group_level', id: n.id, label: `Niveau « ${n.name} » (${groupName})`, data: n,
        remove: () => supabase.from('group_levels').delete().eq('id', n.id) });
      toast.success('Niveau mis dans la corbeille de Paramètres');
      refresh();
    } catch (e) { toast.error(errorMessage(e)); }
  };
  const sansNiveau = students.filter((s) => !niveaux.some((n) => n.member_ids.includes(s.user_id)));

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="text-sm font-bold text-primary">← Retour</button>
      <div>
        <p className="text-lg font-extrabold">🎚️ Niveaux · {groupName}</p>
        <p className="text-xs text-muted-foreground">Crée un niveau, puis touche les prénoms pour les y ranger. En donnant un devoir, tu choisis le niveau en un toucher.</p>
      </div>
      <div className="flex gap-2">
        <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. : Niveau 1, Les avancés, Dalil…" aria-label="Nom du niveau"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void ajouter(); } }} />
        <button type="button" onClick={() => void ajouter()} disabled={!nom.trim()} className="shrink-0 rounded-xl bg-[#2457a5] text-white px-4 text-sm font-bold disabled:opacity-50">＋ Ajouter</button>
      </div>
      {niveaux.map((n, k) => (
        <div key={n.id} className={cn('rounded-2xl p-3 space-y-2', COULEURS[k % COULEURS.length])}>
          <div className="flex items-center justify-between gap-2">
            <p className="font-extrabold [overflow-wrap:anywhere]">{n.name} · {n.member_ids.length} élève{n.member_ids.length > 1 ? 's' : ''}</p>
            <button type="button" onClick={() => setASupprimer(n)} className="text-xs font-bold text-destructive shrink-0">Supprimer</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {students.map((s) => {
              const dedans = n.member_ids.includes(s.user_id);
              return (
                <button key={s.user_id} type="button" onClick={() => void ranger(n, s.user_id)} aria-pressed={dedans}
                  className={cn('rounded-full px-3 py-1 text-xs font-bold border', dedans ? 'bg-white text-foreground border-white shadow-sm dark:bg-slate-900' : 'border-current/30 opacity-60')}>
                  {dedans ? '✓ ' : ''}{(s.full_name || 'Élève').trim().split(/\s+/)[0]}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {niveaux.length > 0 && sansNiveau.length > 0 && (
        <p className="text-xs text-muted-foreground">Sans niveau : {sansNiveau.map((s) => (s.full_name || 'Élève').trim().split(/\s+/)[0]).join(', ')}</p>
      )}
      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => { if (!o) setASupprimer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce niveau ?</AlertDialogTitle>
            <AlertDialogDescription>« {aSupprimer?.name} » ira dans la corbeille de Paramètres. Les élèves restent dans le groupe.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (aSupprimer) void supprimer(aSupprimer); setASupprimer(null); }}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
