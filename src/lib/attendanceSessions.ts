import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { moveToTrash } from '@/lib/trash';

/** Date du jour au format de la base (aaaa-mm-jj) */
export const todayIso = () => format(new Date(), 'yyyy-MM-dd');

/** Dates du registre = séances enregistrées + dates qui ont des présences ; pour l'enseignante, la date du jour s'ajoute toujours */
export function attendanceDates(sessions: { date: string }[], records: { date: string }[], withToday: boolean): string[] {
  const set = new Set<string>([...sessions.map((s) => s.date), ...records.map((r) => r.date)]);
  if (withToday) set.add(todayIso());
  return [...set].sort();
}

export async function fetchAttendanceSessions() {
  const { data, error } = await supabase.from('attendance_sessions').select('date').order('date');
  if (error) throw error;
  return data || [];
}

export async function addAttendanceSession(date: string, userId?: string) {
  const { error } = await supabase.from('attendance_sessions').upsert({ date, created_by: userId ?? null }, { onConflict: 'date', ignoreDuplicates: true });
  if (error) throw error;
}

/** Changer la date d'une séance : la séance et toutes ses présences sont déplacées */
export async function moveAttendanceSession(from: string, to: string) {
  const { error } = await supabase.rpc('move_attendance_session', { p_from: from, p_to: to });
  if (error) throw error;
}

/** Supprimer une séance : corbeille d'abord (date + présences de tous les élèves), puis suppression */
export async function deleteAttendanceSession(date: string, userId: string, label: string) {
  const { data: rows, error: readErr } = await supabase.from('attendance_records').select('*').eq('date', date);
  if (readErr) throw readErr;
  const ok = await moveToTrash(userId, 'attendance_day', date, label, rows || []);
  if (!ok) throw new Error("Mise en corbeille impossible : rien n'a été supprimé");
  const { error } = await supabase.from('attendance_records').delete().eq('date', date);
  if (error) throw error;
  const { error: sErr } = await supabase.from('attendance_sessions').delete().eq('date', date);
  if (sErr) throw sErr;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

/**
 * Toucher un rond (enseignante) : vide → présent → absent → en retard → vide.
 * Même règle dans « Ma Présence » et dans le Registre du bouclier.
 */
export async function cycleAttendance(userId: string, date: string, current: { id: string; status: AttendanceStatus } | undefined, markedBy?: string) {
  if (!current) {
    const { error } = await supabase.from('attendance_records').insert({ user_id: userId, date, status: 'present', marked_by: markedBy ?? null });
    if (error) throw error;
    return;
  }
  const next: Record<AttendanceStatus, AttendanceStatus | null> = { present: 'absent', absent: 'late', late: null };
  const to = next[current.status];
  const { error } = to
    ? await supabase.from('attendance_records').update({ status: to }).eq('id', current.id)
    : await supabase.from('attendance_records').delete().eq('id', current.id);
  if (error) throw error;
}
