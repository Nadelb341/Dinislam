import { supabase } from '@/integrations/supabase/client';

/**
 * Élèves sans aucun appareil qui reçoit les notifications (idée validée par Nadia le 2026-09-30).
 * Pastille rouge sur « Élèves » seulement pour ceux inscrits depuis plus de 7 jours, et pas avant le
 * 2026-10-07 : la bascule vers Vercel du 2026-09-30 a remis tout le monde à zéro, on laisse une semaine
 * aux élèves pour réactiver les notifications sur la nouvelle adresse.
 */
export const NO_PUSH_GRACE_UNTIL = new Date('2026-10-07T00:00:00+02:00').getTime();
const WEEK = 7 * 24 * 60 * 60 * 1000;

export async function fetchNoPushStudents(): Promise<{ all: Set<string>; overdue: Set<string> }> {
  const db = supabase;
  const [{ data: profiles }, { data: admins }, { data: subs }] = await Promise.all([
    db.from('profiles').select('user_id, created_at').eq('is_approved', true),
    db.from('user_roles').select('user_id').eq('role', 'admin'),
    db.from('push_subscriptions').select('user_id').eq('is_active', true),
  ]);
  const adminIds = new Set((admins || []).map((a) => a.user_id));
  const withPush = new Set((subs || []).map((s) => s.user_id));
  const all = new Set<string>();
  const overdue = new Set<string>();
  const now = Date.now();
  for (const p of profiles || []) {
    if (adminIds.has(p.user_id) || withPush.has(p.user_id)) continue;
    all.add(p.user_id);
    if (now >= NO_PUSH_GRACE_UNTIL && p.created_at && now - new Date(p.created_at).getTime() > WEEK) overdue.add(p.user_id);
  }
  return { all, overdue };
}
