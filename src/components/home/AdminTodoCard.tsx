import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown } from 'lucide-react';
import { takeDraftResume } from '@/lib/pendingDrafts';
import { AdminTodoGroupDialog } from './AdminTodoGroupDialog';
import { draftKeyOf, isLate, sortTasks, type AdminTask, type TodoGroup, type TodoStudent } from '@/lib/adminTasks';

const COLLAPSE_KEY = 'dinislam_todo_collapsed';
const MAX_LINES = 4;
const GENERAL: Omit<TodoGroup, 'memberIds'> = { id: null, name: 'Général', color: 'bg-slate-400' };

/**
 * Accueil, enseignante seulement : carte « À FAIRE » (demande de Nadia 2026-10-07, proposition B).
 * Un post-it par groupe d'élèves (les mêmes que dans bouclier › Élèves, un nouveau groupe apparaît tout seul)
 * + « Général ». Chaque post-it montre jusqu'à 4 lignes ; au-delà, on touche le post-it pour tout voir.
 */
export function AdminTodoCard() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });
  const [openId, setOpenId] = useState<string | null | undefined>(undefined); // undefined = aucun, null = Général
  const resumeChecked = useRef(false);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* stockage indisponible */ }
      return !c;
    });
  };

  const { data: groups = [] } = useQuery({
    queryKey: ['admin-todo-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_groups')
        .select('id, name, color, position, student_group_members ( user_id )')
        .order('position', { ascending: true, nullsFirst: false })
        .order('name');
      if (error) throw error;
      return (data || []).map((g): TodoGroup => ({
        id: g.id, name: g.name, color: g.color || 'bg-primary',
        memberIds: (g.student_group_members || []).map((m) => m.user_id),
      }));
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_tasks').select('*').order('position');
      if (error) throw error;
      return (data || []) as AdminTask[];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ['admin-todo-students'],
    queryFn: async () => {
      const [{ data: profiles }, { data: admins }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').eq('is_approved', true).order('full_name'),
        supabase.from('user_roles').select('user_id').eq('role', 'admin'),
      ]);
      const adminIds = new Set((admins || []).map((a) => a.user_id));
      return (profiles || []).filter((p) => !adminIds.has(p.user_id)) as TodoStudent[];
    },
  });

  const allGroups: TodoGroup[] = useMemo(() => [...groups, { ...GENERAL, memberIds: [] }], [groups]);
  // Une tâche dont le groupe a été supprimé retombe dans « Général »
  const groupIds = useMemo(() => new Set(groups.map((g) => g.id)), [groups]);
  const tasksOf = (id: string | null) => tasks.filter((t) => (id === null ? !t.group_id || !groupIds.has(t.group_id) : t.group_id === id));

  const openCount = tasks.filter((t) => !t.done).length;
  const lateCount = tasks.filter(isLate).length;

  // « Continuer » depuis le message d'ouverture de l'appli : on rouvre le bon post-it
  useEffect(() => {
    if (resumeChecked.current || groups.length === 0) return;
    resumeChecked.current = true;
    for (const g of [...groups.map((x) => x.id), null]) {
      if (takeDraftResume(draftKeyOf(g))) { setCollapsed(false); setOpenId(g); break; }
    }
  }, [groups]);

  const openGroup = openId === undefined ? null : allGroups.find((g) => g.id === openId) ?? null;

  return (
    <section className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 shadow-sm animate-fade-in">
      <button type="button" onClick={toggleCollapsed} className="w-full flex items-center gap-2 px-4 py-3 text-start" aria-expanded={!collapsed}>
        <span className="text-xl">📝</span>
        <span className="font-bold tracking-wide text-foreground">À FAIRE</span>
        {openCount > 0 && (
          <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center bg-destructive text-destructive-foreground ${lateCount ? 'animate-pulse' : ''}`}>
            {openCount > 99 ? '99+' : openCount}
          </span>
        )}
        {lateCount > 0 && <span className="text-xs font-semibold text-destructive">{lateCount} en retard</span>}
        <ChevronDown className={`ms-auto h-5 w-5 text-muted-foreground transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
      </button>

      {!collapsed && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 px-3 pb-3 items-start">
          {allGroups.map((g) => {
            const { open, done } = sortTasks(tasksOf(g.id));
            const lines = [...open, ...done.filter((t) => (t.done_at ?? '') >= new Date(Date.now() - 7 * 86400000).toISOString())];
            const shown = lines.slice(0, MAX_LINES);
            const more = lines.length - shown.length;
            const late = open.some(isLate);
            return (
              <button
                key={g.id ?? 'general'}
                type="button"
                onClick={() => setOpenId(g.id)}
                className="relative overflow-hidden rounded-xl bg-card text-start shadow-sm transition-transform active:scale-[0.98] min-w-0"
              >
                <span className={`absolute inset-0 opacity-[0.13] ${g.color}`} aria-hidden />
                <span className={`absolute inset-x-0 top-0 h-1.5 ${g.color}`} aria-hidden />
                <span className="relative flex flex-col gap-1 p-2.5 pt-3">
                  <span className="flex items-start gap-1.5">
                    <span className="flex-1 min-w-0 text-[13px] font-bold leading-tight text-foreground [overflow-wrap:anywhere]">{g.name}</span>
                    {open.length > 0 && (
                      <span className={`shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-destructive text-destructive-foreground ${late ? 'animate-pulse' : ''}`}>
                        {open.length}
                      </span>
                    )}
                  </span>
                  {shown.length === 0 ? (
                    <span className="text-[12px] text-muted-foreground">Rien à faire 🎉 · touche pour ajouter</span>
                  ) : (
                    <span className="flex flex-col gap-0.5">
                      {shown.map((t) => (
                        <span
                          key={t.id}
                          className={`block truncate text-[12px] leading-snug ${t.done ? 'line-through text-muted-foreground' : isLate(t) ? 'text-destructive font-semibold' : 'text-foreground'}`}
                        >
                          {t.urgent && !t.done ? '⭐ ' : '• '}{t.title}
                        </span>
                      ))}
                    </span>
                  )}
                  {more > 0 && <span className="text-[11px] font-semibold text-primary">+ {more} autre{more > 1 ? 's' : ''} →</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <AdminTodoGroupDialog
        group={openGroup}
        tasks={openGroup ? tasksOf(openGroup.id) : []}
        students={students}
        onClose={() => setOpenId(undefined)}
      />
    </section>
  );
}
