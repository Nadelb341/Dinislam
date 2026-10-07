import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { SortableCardList, type DragItemProps } from '@/components/shared/SortableCardList';
import { saveDraft, loadDraft, clearDraft } from '@/hooks/useDraftRecovery';
import { requestDraftResume } from '@/lib/pendingDrafts';
import { moveToTrash } from '@/lib/trash';
import { openAdminSection, openGroupMessage } from '@/lib/adminBridge';
import { errorMessage } from '@/lib/utils';
import { toast } from 'sonner';
import { Mic, MicOff, Plus } from 'lucide-react';
import { courseItems, draftKeyOf, isLate, sortTasks, todayParis, type AdminTask, type TodoGroup, type TodoStudent } from '@/lib/adminTasks';
import { AnnounceDialog, CourseModeDialog } from './NextCourse';

const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-CA');
};

interface Options { due_date: string; remind_at: string; student_id: string; recurrence: boolean; urgent: boolean; next_course: boolean; to_bring: boolean }
const EMPTY_OPTIONS: Options = { due_date: '', remind_at: '', student_id: '', recurrence: false, urgent: false, next_course: false, to_bring: false };

/** Cases « 🎒 Pour le prochain cours » et « 🧳 À apporter » (proposition C + idée 7) : toujours visibles sous la saisie */
function CourseChips({ value, onChange }: { value: Options; onChange: (v: Options) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange({ ...value, next_course: !value.next_course, to_bring: value.next_course ? false : value.to_bring })}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${value.next_course ? 'bg-amber-100 border-amber-400 dark:bg-amber-950/50' : 'border-border'}`}
      >
        🎒 Pour le prochain cours
      </button>
      <button
        type="button"
        onClick={() => onChange({ ...value, to_bring: !value.to_bring, next_course: !value.to_bring ? true : value.next_course })}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${value.to_bring ? 'bg-amber-100 border-amber-400 dark:bg-amber-950/50' : 'border-border'}`}
      >
        🧳 À apporter (élèves)
      </button>
    </div>
  );
}

/** Champs supplémentaires d'une tâche (création et modification : mêmes réglages) */
function TaskOptions({ value, onChange, students }: { value: Options; onChange: (v: Options) => void; students: TodoStudent[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
      <label className="flex flex-col gap-1 min-w-0">
        <span className="text-xs text-muted-foreground">📅 Date limite</span>
        <Input type="date" value={value.due_date} onChange={(e) => onChange({ ...value, due_date: e.target.value })} />
      </label>
      <label className="flex flex-col gap-1 min-w-0">
        <span className="text-xs text-muted-foreground">⏰ Me le rappeler (notification)</span>
        <Input type="datetime-local" value={value.remind_at} onChange={(e) => onChange({ ...value, remind_at: e.target.value })} />
      </label>
      <label className="flex flex-col gap-1 min-w-0 sm:col-span-2">
        <span className="text-xs text-muted-foreground">👤 Pour un élève</span>
        <select
          value={value.student_id}
          onChange={(e) => onChange({ ...value, student_id: e.target.value })}
          className="h-10 rounded-md border border-input bg-background px-3"
        >
          <option value="">Aucun élève en particulier</option>
          {students.map((s) => <option key={s.user_id} value={s.user_id}>{s.full_name || 'Élève'}</option>)}
        </select>
      </label>
      <div className="sm:col-span-2"><CourseChips value={value} onChange={onChange} /></div>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button
          type="button"
          onClick={() => onChange({ ...value, recurrence: !value.recurrence })}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${value.recurrence ? 'bg-sky-100 border-sky-400 dark:bg-sky-950/50' : 'border-border'}`}
        >
          🔁 Revient chaque semaine
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...value, urgent: !value.urgent })}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${value.urgent ? 'bg-amber-100 border-amber-400 dark:bg-amber-950/50' : 'border-border'}`}
        >
          ⭐ Urgent
        </button>
      </div>
    </div>
  );
}

interface Props {
  group: TodoGroup | null;
  tasks: AdminTask[];
  students: TodoStudent[];
  onClose: () => void;
}

export function AdminTodoGroupDialog({ group, tasks, students, onClose }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  const [text, setText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<Options>(EMPTY_OPTIONS);
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [confirmDone, setConfirmDone] = useState<AdminTask | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminTask | null>(null);
  const [editing, setEditing] = useState<AdminTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editOptions, setEditOptions] = useState<Options>(EMPTY_OPTIONS);
  const [showOld, setShowOld] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [manageTemplates, setManageTemplates] = useState(false);
  const [confirmTemplateDelete, setConfirmTemplateDelete] = useState<{ id: string; title: string } | null>(null);

  // Idée 8 : modèles (lignes qui reviennent souvent), communs à tous les groupes
  const { data: templates = [] } = useQuery({
    queryKey: ['admin-task-templates'],
    enabled: !!group,
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_task_templates').select('*').order('created_at');
      if (error) throw error;
      return data || [];
    },
  });

  const draftKey = group ? draftKeyOf(group.id) : '';
  // À l'ouverture : on reprend le texte pas encore ajouté (brouillon)
  useEffect(() => {
    if (!group) return;
    setText(loadDraft<string>(draftKeyOf(group.id)) ?? '');
    setOptions(EMPTY_OPTIONS);
    setShowOptions(false);
    setShowOld(false);
  }, [group]);
  useEffect(() => {
    if (!draftKey) return;
    if (text.trim()) saveDraft(draftKey, text); else clearDraft(draftKey);
  }, [draftKey, text]);
  useEffect(() => () => recognitionRef.current?.stop(), []);

  const groupStudents = useMemo(() => {
    if (!group || group.id === null) return students;
    const members = new Set(group.memberIds);
    return students.filter((s) => members.has(s.user_id));
  }, [group, students]);
  const studentName = (id: string | null) => students.find((s) => s.user_id === id)?.full_name || 'Élève';

  const { open: allOpen, done } = useMemo(() => sortTasks(tasks), [tasks]);
  const course = useMemo(() => courseItems(tasks), [tasks]);
  const open = useMemo(() => allOpen.filter((t) => !t.next_course), [allOpen]);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const recentDone = done.filter((t) => (t.done_at ?? '') >= weekAgo);
  const oldDone = done.filter((t) => (t.done_at ?? '') < weekAgo);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });

  const toRow = (o: Options) => ({
    due_date: o.due_date || null,
    remind_at: o.remind_at ? new Date(o.remind_at).toISOString() : null,
    student_id: o.student_id || null,
    recurrence: o.recurrence ? 'weekly' : null,
    urgent: o.urgent,
    next_course: o.next_course || o.to_bring,
    to_bring: o.to_bring,
  });

  const add = async () => {
    const title = text.trim();
    if (!group || !title) return;
    setSaving(true);
    try {
      const minPos = Math.min(0, ...tasks.map((t) => t.position));
      const { error } = await supabase.from('admin_tasks').insert({
        group_id: group.id, title, position: minPos - 10, ...toRow(options),
      });
      if (error) throw error;
      setText(''); clearDraft(draftKey); setOptions((o) => ({ ...EMPTY_OPTIONS, next_course: o.next_course, to_bring: false })); setShowOptions(false);
      refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleMic = () => {
    if (listening) { recognitionRef.current?.stop(); return; }
    const Api = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Api) { toast.error('La dictée vocale n\'est pas disponible sur ce navigateur'); return; }
    const rec = new Api();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'fr-FR';
    const before = text ? `${text.trim()} ` : '';
    rec.onresult = (event) => {
      let said = '';
      for (let i = 0; i < event.results.length; i++) said += event.results[i][0].transcript;
      setText(before + said);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const setDone = async (task: AdminTask, value: boolean) => {
    try {
      const { error } = await supabase.from('admin_tasks')
        .update({ done: value, done_at: value ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
        .eq('id', task.id);
      if (error) throw error;
      // Tâche qui revient chaque semaine : la suivante est créée dès que celle-ci est faite
      if (value && task.recurrence === 'weekly') {
        const base = task.due_date ?? todayParis();
        const nextRemind = task.remind_at ? new Date(new Date(task.remind_at).getTime() + 7 * 86400000).toISOString() : null;
        const { error: e2 } = await supabase.from('admin_tasks').insert({
          group_id: task.group_id, title: task.title, due_date: addDays(base, 7), remind_at: nextRemind,
          student_id: task.student_id, recurrence: 'weekly', urgent: task.urgent, position: task.position,
          next_course: task.next_course, to_bring: task.to_bring,
        });
        if (e2) throw e2;
        toast.success(`🔁 Prochaine fois prévue le ${fmtDate(addDays(base, 7))}`);
      }
      refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async (task: AdminTask) => {
    if (!user) return;
    try {
      const ok = await moveToTrash(user.id, 'admin_task', task.id, task.title, task);
      if (!ok) throw new Error('La tâche n\'a pas pu être mise dans la corbeille, rien n\'a été supprimé');
      const { error } = await supabase.from('admin_tasks').delete().eq('id', task.id);
      if (error) throw error;
      toast.success('Tâche mise dans la corbeille (Paramètres)');
      refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const toggleUrgent = async (task: AdminTask) => {
    const { error } = await supabase.from('admin_tasks').update({ urgent: !task.urgent, updated_at: new Date().toISOString() }).eq('id', task.id);
    if (error) toast.error(errorMessage(error)); else refresh();
  };

  const toggleCourse = async (task: AdminTask) => {
    const on = !task.next_course;
    const { error } = await supabase.from('admin_tasks')
      .update({ next_course: on, to_bring: on ? task.to_bring : false, carried: on ? task.carried : 0, updated_at: new Date().toISOString() })
      .eq('id', task.id);
    if (error) toast.error(errorMessage(error)); else refresh();
  };

  const saveAsTemplate = async (task: AdminTask) => {
    const { error } = await supabase.from('admin_task_templates')
      .insert({ title: task.title, next_course: task.next_course, to_bring: task.to_bring });
    if (error) { toast.error(errorMessage(error)); return; }
    queryClient.invalidateQueries({ queryKey: ['admin-task-templates'] });
    toast.success('Modèle enregistré ⚡ Tu le retrouves sous la case de saisie');
  };

  const addFromTemplate = async (tpl: { title: string; next_course: boolean; to_bring: boolean }) => {
    if (!group) return;
    const minPos = Math.min(0, ...tasks.map((t) => t.position));
    const { error } = await supabase.from('admin_tasks').insert({
      group_id: group.id, title: tpl.title, position: minPos - 10, next_course: tpl.next_course || tpl.to_bring, to_bring: tpl.to_bring,
    });
    if (error) toast.error(errorMessage(error)); else { refresh(); toast.success(`Ajouté : ${tpl.title}`); }
  };

  const deleteTemplate = async (tpl: { id: string; title: string }) => {
    if (!user) return;
    const full = templates.find((t) => t.id === tpl.id);
    const ok = await moveToTrash(user.id, 'admin_task_template', tpl.id, `Modèle « ${tpl.title} »`, full ?? tpl);
    if (!ok) { toast.error("Le modèle n'a pas pu être mis dans la corbeille, rien n'a été supprimé"); return; }
    const { error } = await supabase.from('admin_task_templates').delete().eq('id', tpl.id);
    if (error) { toast.error(errorMessage(error)); return; }
    queryClient.invalidateQueries({ queryKey: ['admin-task-templates'] });
    toast.success('Modèle mis dans la corbeille (Paramètres)');
  };

  const startEdit = (task: AdminTask) => {
    setEditing(task);
    setEditTitle(task.title);
    setEditOptions({
      due_date: task.due_date ?? '', remind_at: toLocalInput(task.remind_at), student_id: task.student_id ?? '',
      recurrence: task.recurrence === 'weekly', urgent: task.urgent, next_course: task.next_course, to_bring: task.to_bring,
    });
  };
  const saveEdit = async () => {
    if (!editing || !editTitle.trim()) return;
    const row = toRow(editOptions);
    // Un nouveau rappel (heure changée) doit pouvoir repartir
    const remindChanged = (row.remind_at ?? null) !== (editing.remind_at ? new Date(editing.remind_at).toISOString() : null);
    const { error } = await supabase.from('admin_tasks').update({
      title: editTitle.trim(), ...row, ...(remindChanged ? { reminded_at: null } : {}), updated_at: new Date().toISOString(),
    }).eq('id', editing.id);
    if (error) { toast.error(errorMessage(error)); return; }
    setEditing(null);
    refresh();
  };

  const reorder = async (items: AdminTask[]) => {
    const updates = items.map((t, i) => ({ id: t.id, position: i * 10 }));
    queryClient.setQueryData<AdminTask[]>(['admin-tasks'], (old) =>
      (old || []).map((t) => { const u = updates.find((x) => x.id === t.id); return u ? { ...t, position: u.position } : t; }));
    const results = await Promise.all(updates.map((u) => supabase.from('admin_tasks').update({ position: u.position }).eq('id', u.id)));
    if (results.some((r) => r.error)) toast.error('Le nouvel ordre n\'a pas pu être enregistré');
    refresh();
  };

  const toHomework = (task: AdminTask) => {
    saveDraft('dinislam_homework', {
      titre: task.title, type: 'autre', description: '', lien_lecon: '', date_limite: task.due_date ?? '',
      assigned_to: task.student_id ? 'student' : group?.id ? 'groups' : 'all',
      group_id: '', student_id: task.student_id ?? '', group_ids: !task.student_id && group?.id ? [group.id] : [],
    });
    requestDraftResume('dinislam_homework');
    onClose();
    openAdminSection({ section: 'cahier-texte' });
  };
  const toMessage = (task: AdminTask) => {
    onClose();
    openGroupMessage({ groupIds: group?.id ? [group.id] : [], text: task.title });
  };
  const toStudent = (task: AdminTask) => {
    onClose();
    openAdminSection({ section: 'eleves', search: studentName(task.student_id) });
  };

  const renderTask = (task: AdminTask, dragProps?: DragItemProps) => {
    const late = isLate(task);
    const { ref, style, isDragging, ...dragAttrs } = dragProps ?? { ref: undefined, style: undefined, isDragging: false };
    return (
      <div
        key={task.id}
        ref={ref}
        style={style}
        {...dragAttrs}
        className={`flex items-start gap-2 rounded-xl px-2 py-2 bg-card border ${task.urgent && !task.done ? 'border-amber-400' : 'border-border'} ${isDragging ? 'opacity-60 shadow-lg' : ''}`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" onPointerDown={(e) => e.stopPropagation()} className="shrink-0 text-lg leading-none mt-0.5" aria-label="Modifier ou supprimer">📌</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="z-[700]">
            <DropdownMenuItem onClick={() => startEdit(task)}>✏️ Modifier</DropdownMenuItem>
            {!task.done && <DropdownMenuItem onClick={() => toggleUrgent(task)}>{task.urgent ? '☆ Plus urgent' : '⭐ Urgent'}</DropdownMenuItem>}
            {!task.done && <DropdownMenuItem onClick={() => toggleCourse(task)}>{task.next_course ? '🎒 Retirer du prochain cours' : '🎒 Pour le prochain cours'}</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => saveAsTemplate(task)}>⚡ Enregistrer comme modèle</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toHomework(task)}>📚 En faire un devoir</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toMessage(task)}>✉️ En faire un message au groupe</DropdownMenuItem>
            {task.student_id && <DropdownMenuItem onClick={() => toStudent(task)}>👤 Voir la fiche de {studentName(task.student_id)}</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDelete(task)}>🗑️ Supprimer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1 min-w-0">
          <p className={`text-sm [overflow-wrap:anywhere] ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.urgent && !task.done && '⭐ '}{task.title}
          </p>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            {task.due_date && <span className={late ? 'text-destructive font-bold' : ''}>📅 {fmtDate(task.due_date)}{late ? ' · en retard' : ''}</span>}
            {task.remind_at && !task.done && <span>⏰ {new Date(task.remind_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
            {task.student_id && <span>👤 {studentName(task.student_id)}</span>}
            {task.recurrence === 'weekly' && <span>🔁 chaque semaine</span>}
            {task.to_bring && <span>🧳 à apporter</span>}
            {(task.carried ?? 0) > 0 && !task.done && <span className="font-semibold text-amber-700 dark:text-amber-300">🔁 reportée ×{task.carried}</span>}
          </div>
        </div>
        <input
          type="checkbox"
          checked={task.done}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={() => (task.done ? setDone(task, false) : setConfirmDone(task))}
          className="shrink-0 mt-1 h-5 w-5 accent-emerald-600"
          aria-label={task.done ? 'Remettre à faire' : 'Valider'}
        />
      </div>
    );
  };

  if (!group) return null;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[85vh] overflow-y-auto p-5 space-y-4">
          <DialogTitle className="flex items-center gap-2 pe-8">
            <span className={`h-3 w-3 rounded-full shrink-0 ${group.color}`} />
            <span className="[overflow-wrap:anywhere]">{group.name}</span>
          </DialogTitle>

          {/* Ajouter */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                placeholder="Nouvelle tâche…"
                aria-label="Nouvelle tâche"
                autoFocus
              />
              <Button type="button" variant={listening ? 'destructive' : 'outline'} size="icon" onClick={toggleMic} aria-label="Dicter la tâche">
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button type="button" size="icon" onClick={add} disabled={saving || !text.trim()} aria-label="Ajouter">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <CourseChips value={options} onChange={setOptions} />
            {templates.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">⚡ Modèles :</span>
                {templates.map((tpl) => (
                  <span key={tpl.id} className="inline-flex items-center rounded-full border border-border bg-muted/40 text-xs">
                    <button type="button" onClick={() => addFromTemplate(tpl)} className="px-2.5 py-1 [overflow-wrap:anywhere] text-start">
                      {tpl.to_bring ? '🧳 ' : tpl.next_course ? '🎒 ' : ''}{tpl.title}
                    </button>
                    {manageTemplates && (
                      <button type="button" onClick={() => setConfirmTemplateDelete({ id: tpl.id, title: tpl.title })} className="pe-2 text-destructive font-bold" aria-label={`Supprimer le modèle ${tpl.title}`}>✕</button>
                    )}
                  </span>
                ))}
                <button type="button" onClick={() => setManageTemplates((m) => !m)} className="text-[11px] font-semibold text-primary">
                  {manageTemplates ? 'Terminé' : 'Gérer'}
                </button>
              </div>
            )}
            <button type="button" onClick={() => setShowOptions(!showOptions)} className="text-xs font-semibold text-primary">
              {showOptions ? '− Moins d\'options' : '+ Date, rappel, élève, chaque semaine, urgent'}
            </button>
            {showOptions && <TaskOptions value={options} onChange={setOptions} students={groupStudents} />}
          </div>

          {/* 🎒 Au prochain cours (proposition C) */}
          {(course.todo.length > 0 || course.bring.length > 0) && (
            <div className="rounded-2xl p-3 space-y-2 bg-gradient-to-br from-amber-50 to-pink-50 dark:from-amber-950/30 dark:to-pink-950/20 border border-amber-300 dark:border-amber-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">🎒 Au prochain cours</p>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="secondary" className="h-8" onClick={() => setAnnounceOpen(true)}>📢 Annoncer au groupe</Button>
                  <Button size="sm" className="h-8" onClick={() => setCourseOpen(true)}>▶️ Mode cours</Button>
                </div>
              </div>
              {course.todo.length > 0 && (
                <div className="space-y-1.5">
                  <SortableCardList items={course.todo} onReorder={reorder} renderItem={(t, dragProps) => renderTask(t, dragProps)} />
                </div>
              )}
              {course.bring.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">🧳 À apporter par les élèves</p>
                  <SortableCardList items={course.bring} onReorder={reorder} renderItem={(t, dragProps) => renderTask(t, dragProps)} />
                </div>
              )}
            </div>
          )}

          {/* À faire */}
          {(course.todo.length > 0 || course.bring.length > 0) && open.length > 0 && <p className="text-xs font-semibold text-muted-foreground">📝 À faire</p>}
          {open.length === 0 ? (course.todo.length + course.bring.length > 0 ? null : (
            <p className="text-center text-sm text-muted-foreground py-3">Rien à faire pour ce groupe 🎉</p>
          )) : (
            <div className="space-y-1.5">
              <SortableCardList items={open} onReorder={reorder} renderItem={(t, dragProps) => renderTask(t, dragProps)} />
              <p className="text-[11px] text-muted-foreground text-center">Reste appuyée sur une tâche puis glisse-la pour changer l'ordre</p>
            </div>
          )}

          {/* Faites */}
          {recentDone.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">✅ Fait cette semaine</p>
              {recentDone.map((t) => renderTask(t))}
            </div>
          )}
          {oldDone.length > 0 && (
            <div className="space-y-1.5">
              <button type="button" onClick={() => setShowOld(!showOld)} className="text-xs font-semibold text-muted-foreground">
                {showOld ? '▾' : '▸'} Faites plus tôt ({oldDone.length})
              </button>
              {showOld && oldDone.map((t) => renderTask(t))}
            </div>
          )}
        </div>
        <ScrollButtons showTop={showTop} showBottom={showBottom} onScrollTop={scrollToTop} onScrollBottom={scrollToBottom} position="absolute" />

        {/* Valider */}
        <AlertDialog open={!!confirmDone} onOpenChange={(o) => { if (!o) setConfirmDone(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Valider cette tâche ?</AlertDialogTitle>
              <AlertDialogDescription className="[overflow-wrap:anywhere]">
                « {confirmDone?.title} » sera barrée et rangée en bas de la liste.{confirmDone?.recurrence === 'weekly' ? ' Elle reviendra la semaine prochaine.' : ''}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (confirmDone) setDone(confirmDone, true); setConfirmDone(null); }}>✅ Valider</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Supprimer */}
        <AlertDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette tâche ?</AlertDialogTitle>
              <AlertDialogDescription className="[overflow-wrap:anywhere]">
                « {confirmDelete?.title} » ira dans la corbeille de Paramètres, tu pourras la restaurer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (confirmDelete) remove(confirmDelete); setConfirmDelete(null); }}>Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <CourseModeDialog groupId={group.id} groupName={group.name} open={courseOpen} onClose={() => setCourseOpen(false)} />
        <AnnounceDialog groupId={group.id} groupName={group.name} tasks={tasks} open={announceOpen} onClose={() => setAnnounceOpen(false)} onSent={onClose} />

        {/* Supprimer un modèle */}
        <AlertDialog open={!!confirmTemplateDelete} onOpenChange={(o) => { if (!o) setConfirmTemplateDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce modèle ?</AlertDialogTitle>
              <AlertDialogDescription className="[overflow-wrap:anywhere]">« {confirmTemplateDelete?.title} » ira dans la corbeille de Paramètres. Les tâches déjà ajoutées ne changent pas.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (confirmTemplateDelete) deleteTemplate(confirmTemplateDelete); setConfirmTemplateDelete(null); }}>Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modifier */}
        <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" level="nested">
            <DialogTitle>✏️ Modifier la tâche</DialogTitle>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveEdit(); } }}
              aria-label="Tâche"
            />
            <TaskOptions value={editOptions} onChange={setEditOptions} students={groupStudents} />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
              <Button onClick={saveEdit} disabled={!editTitle.trim()}>Enregistrer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
