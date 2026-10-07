import type { Tables } from '@/integrations/supabase/types';

/** Carte « À FAIRE » de l'accueil (enseignante) : types et petites règles partagées */
export type AdminTask = Tables<'admin_tasks'>;
export interface TodoGroup { id: string | null; name: string; color: string; memberIds: string[] }
export interface TodoStudent { user_id: string; full_name: string | null }

export const todayParis = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
export const isLate = (t: AdminTask) => !t.done && !!t.due_date && t.due_date < todayParis();
/** Tâches pas faites (⭐ urgentes d'abord, puis l'ordre choisi), puis les faites (les plus récentes d'abord) */
export function sortTasks(tasks: AdminTask[]) {
  const open = tasks.filter((t) => !t.done).sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.position - b.position);
  const done = tasks.filter((t) => t.done).sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? ''));
  return { open, done };
}
export const draftKeyOf = (groupId: string | null) => `dinislam_admin_task_${groupId ?? 'general'}`;
