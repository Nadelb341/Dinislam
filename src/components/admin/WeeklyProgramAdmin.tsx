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
import { useEngagement } from '@/hooks/useEngagement';
import { dropoutLevel, dropoutReason, type Engagement } from '@/lib/engagement';
import { EncourageDialog } from '@/components/home/DropoutAlerts';

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
  const [encourage, setEncourage] = useState<Engagement | null>(null);
  // Suivi : orange = aucun diamant la semaine dernière, rouge = 2 semaines ou plus (ou rien validé depuis 3 semaines)
  const { data: engagement = [] } = useEngagement(open);
  const engOf = (id: string) => engagement.find((e) => e.student_id === id);

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
  const levelOf = (id: string) => { const e = engOf(id); return e ? dropoutLevel(e) : null; };
  const reds = progs.filter((p) => levelOf(p.student_id) === 'red').length;
  const oranges = progs.filter((p) => levelOf(p.student_id) === 'orange').length;
  // Ceux qui décrochent en haut (rouge, puis orange), puis les autres par ordre alphabétique
  const rank = (id: string) => ({ red: 0, orange: 1 }[levelOf(id) ?? ''] ?? 2);
  const ordered = [...progs].sort((a, b) => rank(a.student_id) - rank(b.student_id));

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
          {(reds > 0 || oranges > 0) && (
            <p className="text-xs font-semibold">
              {reds > 0 && <span className="text-red-700 dark:text-red-400">🔴 {reds} élève{reds > 1 ? 's' : ''} décroche{reds > 1 ? 'nt' : ''} (2 semaines ou plus) </span>}
              {oranges > 0 && <span className="text-orange-700 dark:text-orange-400">🟠 {oranges} n'{oranges > 1 ? 'ont' : 'a'} rien fait la semaine dernière</span>}
            </p>
          )}
          {showStudents && (
            <div className="space-y-2">
              {progs.length === 0 && <p className="text-sm text-muted-foreground text-center">Aucun chemin pour le moment (le prochain se crée mercredi à 21 h).</p>}
              {ordered.map((p) => {
                const level = levelOf(p.student_id);
                const eng = engOf(p.student_id);
                return (
                <div key={p.program_id} className={`rounded-xl border-2 p-2.5 space-y-1.5 ${level === 'red' ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : level === 'orange' ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30' : 'border-border bg-card'}`}>
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
                  {level && eng && <p className={`text-xs font-semibold ${level === 'red' ? 'text-red-700 dark:text-red-400' : 'text-orange-700 dark:text-orange-400'}`}>{level === 'red' ? '🔴' : '🟠'} {dropoutReason(eng)}</p>}
                  {/* Historique des semaines précédentes */}
                  {eng && eng.weeks.length > 1 && (
                    <div className="flex flex-wrap gap-1">
                      {eng.weeks.slice(1).map((w) => (
                        <span key={w.week} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${w.done === 0 ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300' : w.done === w.total ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'}`}>
                          {new Date(`${w.week}T12:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} : 💎 {w.done}/{w.total}
                        </span>
                      ))}
                    </div>
                  )}
                  {level && eng && <Button size="sm" variant="outline" className="h-8" onClick={() => setEncourage(eng)}>✉️ Encourager</Button>}
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
                );
              })}
            </div>
          )}
        </>
      )}
      <EncourageDialog student={encourage} onClose={() => setEncourage(null)} />
    </div>
  );
}
