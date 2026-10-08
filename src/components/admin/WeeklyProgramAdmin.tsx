import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { byName, errorMessage } from '@/lib/utils';
import { nextCourseDay, type WeeklyProgram } from '@/lib/weeklyProgram';
import { sortGroups } from '@/lib/studentGroups';

/**
 * Côté enseignante (bouclier › Cahier de texte) : le « 💎 chemin de la semaine » se crée tout seul chaque mercredi à 21 h.
 * Ici : l'activer ou non, le couper pour un groupe, voir où en est chaque élève et lui laisser un mot.
 */
export function WeeklyProgramAdmin() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const { data } = useQuery({
    queryKey: ['weekly-program-admin'],
    enabled: open,
    queryFn: async () => {
      const [settings, groups, programs] = await Promise.all([
        supabase.from('weekly_program_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('student_groups').select('id, name, color, position'),
        supabase.rpc('weekly_program_view', {}),
      ]);
      if (settings.error) throw settings.error;
      if (programs.error) throw programs.error;
      return {
        settings: settings.data,
        groups: sortGroups(groups.data || []),
        programs: ((programs.data || []) as unknown as WeeklyProgram[]).sort(byName((p) => p.full_name)),
      };
    },
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['weekly-program-admin'] });

  const saveSettings = async (patch: { enabled?: boolean; disabled_group_ids?: string[] }) => {
    const { error } = await supabase.from('weekly_program_settings').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) toast.error(errorMessage(error)); else refresh();
  };
  const toggleGroup = (id: string, on: boolean) => {
    const cur = new Set(data?.settings?.disabled_group_ids ?? []);
    if (on) cur.delete(id); else cur.add(id);
    saveSettings({ disabled_group_ids: [...cur] });
  };
  const saveNote = async (programId: string) => {
    const { error } = await supabase.from('weekly_programs').update({ teacher_note: note.trim() || null }).eq('id', programId);
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success(note.trim() ? 'Mot ajouté sur son chemin 💬' : 'Mot retiré');
    setEditing(null);
    refresh();
  };

  const enabled = data?.settings?.enabled ?? true;
  const progs = data?.programs ?? [];
  const full = progs.filter((p) => p.items.length && p.items.every((i) => i.done)).length;

  return (
    <div className="rounded-2xl border border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/20 p-3 space-y-3">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 text-start">
        <span className="font-bold">🤖 Chemin de la semaine (automatique) 💎</span>
        <span className="text-xs text-muted-foreground shrink-0">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <>
          <p className="text-xs text-muted-foreground">Chaque mercredi à 21 h, chaque élève reçoit son chemin : l'étape suivante de chaque carte qu'il voit (Nourania, Sourates, 99 Noms…). Quand tu valides une étape, son diamant brille tout seul. Pause pendant les vacances scolaires. Tu n'as rien d'autre à faire.</p>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-card p-2.5">
            <span className="text-sm font-semibold">Programme automatique</span>
            <Switch checked={enabled} onCheckedChange={(v) => saveSettings({ enabled: v })} />
          </div>
          {enabled && (data?.groups ?? []).length > 0 && (
            <div className="rounded-xl bg-card p-2.5 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Groupes concernés</p>
              {data!.groups.map((g) => (
                <div key={g.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="[overflow-wrap:anywhere]">👥 {g.name}</span>
                  <Switch checked={!(data!.settings?.disabled_group_ids ?? []).includes(g.id)} onCheckedChange={(v) => toggleGroup(g.id, v)} />
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => setShowStudents((s) => !s)} className="w-full rounded-xl bg-card p-2.5 flex items-center justify-between gap-2 text-sm font-semibold">
            <span>👀 Le chemin de chaque élève</span>
            <span className="text-xs text-muted-foreground">{full}/{progs.length} trésors ouverts {showStudents ? '▾' : '▸'}</span>
          </button>
          {showStudents && (
            <div className="space-y-2">
              {progs.length === 0 && <p className="text-sm text-muted-foreground text-center">Aucun chemin pour le moment (le prochain se crée mercredi à 21 h).</p>}
              {progs.map((p) => (
                <div key={p.program_id} className="rounded-xl bg-card border border-border p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold [overflow-wrap:anywhere]">{p.full_name || 'Élève'}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">pour le {nextCourseDay(p.week_start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.items.map((i) => (
                      <span key={`${i.module}-${i.item_id}`} className={`rounded-full px-2 py-0.5 text-xs ${i.done ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-muted'}`}>
                        {i.done ? '💎' : '⏳'} {i.label} : {i.detail}
                      </span>
                    ))}
                  </div>
                  {editing === p.program_id ? (
                    <div className="flex gap-1.5">
                      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. insiste sur les madd" autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNote(p.program_id); } }} />
                      <Button size="sm" onClick={() => saveNote(p.program_id)}>OK</Button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setEditing(p.program_id); setNote(p.teacher_note ?? ''); }} className="text-xs text-primary font-semibold text-start [overflow-wrap:anywhere]">
                      {p.teacher_note ? `💬 ${p.teacher_note} ✏️` : '✏️ Ajouter un mot pour cet élève'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
