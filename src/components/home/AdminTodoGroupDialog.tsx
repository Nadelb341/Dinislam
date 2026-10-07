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
import { Mic, MicOff } from 'lucide-react';
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

/** Les 3 onglets de la fenêtre d'un groupe (2026-10-07, montage validé par Nadia) */
type Kind = 'cours' | 'apporter' | 'note';
const KINDS: { key: Kind; icon: string; label: string; tone: string }[] = [
  { key: 'cours', icon: '🎒', label: 'Prochain cours', tone: 'bg-amber-50 dark:bg-amber-950/30' },
  { key: 'apporter', icon: '🧳', label: 'À apporter', tone: 'bg-violet-50 dark:bg-violet-950/30' },
  { key: 'note', icon: '📝', label: 'Mémo', tone: 'bg-sky-50 dark:bg-sky-950/30' },
];
const kindOf = (t: AdminTask): Kind => (t.to_bring ? 'apporter' : t.next_course ? 'cours' : 'note');
const flagsOf = (k: Kind) => ({ next_course: k !== 'note', to_bring: k === 'apporter' });

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
  const [kind, setKind] = useState<Kind>('cours');
  const [spoken, setSpoken] = useState<string | null>(null);
  const [homeworkFor, setHomeworkFor] = useState<AdminTask | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

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
    setKind('cours');
    setSpoken(null);
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
        group_id: group.id, title, position: minPos - 10, ...toRow({ ...options, ...flagsOf(kind) }),
      });
      if (error) throw error;
      setText(''); clearDraft(draftKey); setOptions(EMPTY_OPTIONS);
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
    // Micro d'abord : la phrase dite s'affiche, puis un tap sur 🎒 / 🧳 / 📝 la range
    setSpoken('');
    rec.onresult = (event) => {
      let said = '';
      for (let i = 0; i < event.results.length; i++) said += event.results[i][0].transcript;
      setSpoken(said);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const addSpoken = async (k: Kind) => {
    const title = (spoken ?? '').trim();
    if (!group || !title) return;
    const minPos = Math.min(0, ...tasks.map((t) => t.position));
    const { error } = await supabase.from('admin_tasks').insert({ group_id: group.id, title, position: minPos - 10, ...flagsOf(k) });
    if (error) { toast.error(errorMessage(error)); return; }
    setSpoken(null);
    setKind(k);
    refresh();
  };

  const moveTo = async (task: AdminTask, k: Kind) => {
    const { error } = await supabase.from('admin_tasks')
      .update({ ...flagsOf(k), carried: k === 'note' ? 0 : task.carried, updated_at: new Date().toISOString() })
      .eq('id', task.id);
    if (error) toast.error(errorMessage(error)); else { refresh(); toast.success(`Déplacé vers ${KINDS.find((x) => x.key === k)?.label}`); }
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

  // « En faire un devoir » : choisir un ou plusieurs élèves du groupe (ou tout le groupe), le formulaire s'ouvre rempli
  const toHomework = (task: AdminTask) => {
    setHomeworkFor(task);
    setPicked(new Set(task.student_id ? [task.student_id] : []));
  };
  const confirmHomework = (allGroup: boolean) => {
    const task = homeworkFor;
    if (!task) return;
    const ids = allGroup ? [] : [...picked];
    saveDraft('dinislam_homework', {
      titre: task.title, type: 'autre', description: '', lien_lecon: '', date_limite: task.due_date ?? '',
      assigned_to: ids.length === 1 ? 'student' : ids.length > 1 ? 'students' : group?.id ? 'groups' : 'all',
      group_id: '', student_id: ids.length === 1 ? ids[0] : '', student_ids: ids.length > 1 ? ids : [],
      group_ids: ids.length === 0 && group?.id ? [group.id] : [],
    });
    requestDraftResume('dinislam_homework');
    setHomeworkFor(null);
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
            {!task.done && KINDS.filter((k) => k.key !== kindOf(task)).map((k) => (
              <DropdownMenuItem key={k.key} onClick={() => moveTo(task, k.key)}>{k.icon} Déplacer vers « {k.label} »</DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={() => saveAsTemplate(task)}>⚡ Enregistrer comme modèle</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toHomework(task)}>📚 En faire un devoir…</DropdownMenuItem>
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
          <div className="flex items-center gap-2 pe-9">
            <DialogTitle className="flex items-center gap-2 min-w-0 flex-1">
              <span className={`h-3 w-3 rounded-full shrink-0 ${group.color}`} />
              <span className="[overflow-wrap:anywhere]">{group.name}</span>
            </DialogTitle>
            <Button type="button" size="sm" variant="outline" className="shrink-0 h-8 rounded-full" onClick={() => setShowOptions((v) => !v)} aria-expanded={showOptions}>
              ⋯ Plus
            </Button>
          </div>

          {/* ⋯ Plus : options de la prochaine ligne, modèles, tâches faites */}
          {showOptions && (
            <div className="rounded-2xl border border-border bg-muted/30 p-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">Pour la prochaine ligne que tu ajoutes :</p>
              <TaskOptions value={options} onChange={setOptions} students={groupStudents} />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">⚡ Modèles :</span>
                {templates.length === 0 && <span className="text-[11px] text-muted-foreground">aucun pour l'instant (📌 › « Enregistrer comme modèle »)</span>}
                {templates.map((tpl) => (
                  <span key={tpl.id} className="inline-flex items-center rounded-full border border-border bg-card text-xs">
                    <button type="button" onClick={() => addFromTemplate(tpl)} className="px-2.5 py-1 [overflow-wrap:anywhere] text-start">
                      {tpl.to_bring ? '🧳 ' : tpl.next_course ? '🎒 ' : '📝 '}{tpl.title}
                    </button>
                    {manageTemplates && (
                      <button type="button" onClick={() => setConfirmTemplateDelete({ id: tpl.id, title: tpl.title })} className="pe-2 text-destructive font-bold" aria-label={`Supprimer le modèle ${tpl.title}`}>✕</button>
                    )}
                  </span>
                ))}
                {templates.length > 0 && (
                  <button type="button" onClick={() => setManageTemplates((m) => !m)} className="text-[11px] font-semibold text-primary">
                    {manageTemplates ? 'Terminé' : 'Gérer'}
                  </button>
                )}
              </div>
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
          )}

          {/* Les 3 onglets de couleur */}
          <div role="tablist" className="grid grid-cols-3 gap-1">
            {KINDS.map((k) => {
              const count = k.key === 'cours' ? course.todo.length : k.key === 'apporter' ? course.bring.length : open.length;
              const active = kind === k.key;
              return (
                <button
                  key={k.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setKind(k.key)}
                  className={`min-w-0 rounded-t-2xl px-1 py-2 flex flex-col items-center gap-0.5 transition-opacity ${k.tone} ${active ? 'opacity-100' : 'opacity-55'}`}
                >
                  <span className="text-xl leading-none">{k.icon}</span>
                  <span className="text-[12px] font-bold leading-tight text-center">{k.label}</span>
                  {count > 0 && <span className="rounded-full bg-card px-1.5 text-[10px] font-bold">{count}</span>}
                </button>
              );
            })}
          </div>

          <div className={`-mt-4 rounded-b-2xl p-3 space-y-2 ${KINDS.find((k) => k.key === kind)?.tone}`}>
            {/* Entrée rapide + micro d'abord */}
            <div className="flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                placeholder={`${KINDS.find((k) => k.key === kind)?.label} : écris puis Entrée…`}
                aria-label="Nouvelle ligne"
                className="h-12 bg-card text-base"
                autoFocus
              />
              <Button type="button" onClick={toggleMic} variant={listening ? 'destructive' : 'default'} className={`h-12 w-12 shrink-0 rounded-xl text-xl ${listening ? 'animate-pulse' : ''}`} aria-label="Parler">
                {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            </div>
            {options.due_date || options.remind_at || options.student_id || options.recurrence || options.urgent ? (
              <p className="text-[11px] text-muted-foreground">Options de « ⋯ Plus » appliquées à la prochaine ligne.</p>
            ) : null}

            {spoken !== null && (
              <div className="rounded-xl border-2 border-dashed border-primary bg-card p-2.5 space-y-2">
                <Input value={spoken} onChange={(e) => setSpoken(e.target.value)} placeholder={listening ? 'Je t\'écoute…' : 'Ce que tu as dit'} aria-label="Phrase dictée" />
                <p className="text-[11px] text-muted-foreground">Touche où la ranger :</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {KINDS.map((k) => (
                    <button key={k.key} type="button" disabled={!spoken.trim()} onClick={() => addSpoken(k.key)}
                      className={`rounded-xl px-1 py-2 text-xs font-bold disabled:opacity-40 ${k.tone}`}>
                      {k.icon} {k.label}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setSpoken(null)} className="text-[11px] font-semibold text-muted-foreground">Annuler</button>
              </div>
            )}

            {/* Lignes de l'onglet */}
            {(() => {
              const items = kind === 'cours' ? course.todo : kind === 'apporter' ? course.bring : open;
              return items.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-3">Rien pour le moment</p>
              ) : (
                <div className="space-y-1.5">
                  <SortableCardList items={items} onReorder={reorder} renderItem={(t, dragProps) => renderTask(t, dragProps)} />
                </div>
              );
            })()}

            {kind === 'cours' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button type="button" variant="secondary" onClick={() => setCourseOpen(true)}>▶️ Mode cours</Button>
                <Button type="button" variant="secondary" onClick={() => setAnnounceOpen(true)} disabled={course.todo.length + course.bring.length === 0}>📢 Annoncer</Button>
              </div>
            )}
          </div>
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

        {/* En faire un devoir : un ou plusieurs élèves, ou tout le groupe */}
        <Dialog open={!!homeworkFor} onOpenChange={(o) => { if (!o) setHomeworkFor(null); }}>
          <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto" level="nested">
            <DialogTitle>📚 En faire un devoir</DialogTitle>
            <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">« {homeworkFor?.title} » · pour qui ?</p>
            <div className="flex flex-wrap gap-2">
              {groupStudents.map((st) => {
                const on = picked.has(st.user_id);
                return (
                  <button key={st.user_id} type="button"
                    onClick={() => setPicked((p) => { const n = new Set(p); if (n.has(st.user_id)) n.delete(st.user_id); else n.add(st.user_id); return n; })}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}>
                    {on ? '✓ ' : ''}{st.full_name || 'Élève'}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => confirmHomework(true)}>{group.id ? 'Tout le groupe' : 'Tous les élèves'}</Button>
              <Button disabled={picked.size === 0} onClick={() => confirmHomework(false)}>
                {picked.size > 0 ? `Pour ${picked.size} élève${picked.size > 1 ? 's' : ''}` : 'Choisis des élèves'}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Le formulaire de devoir s'ouvre déjà rempli : tu choisis le type, la date et tu valides.</p>
          </DialogContent>
        </Dialog>

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
