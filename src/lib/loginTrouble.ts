import { supabase } from '@/integrations/supabase/client';

export type LoginTroubleReason = 'email' | 'oubli';
export interface LoginTrouble {
  user_id: string;
  name: string;
  reason: LoginTroubleReason;
  /** Date de la demande « mot de passe oublié » (raison « oubli ») */
  since: string | null;
}

const RECENT_DAYS = 14;

/**
 * Élèves approuvés qui n'arrivent pas à se connecter (bandeau du bouclier, demande de Nadia 2026-10-06) :
 *  - « email » : e-mail jamais confirmé → Supabase refuse toutes leurs connexions ;
 *  - « oubli » : ont demandé un nouveau mot de passe ces 14 derniers jours sans réussir à se connecter depuis.
 */
export async function fetchLoginTrouble(): Promise<LoginTrouble[]> {
  const [{ data: status, error }, { data: profiles }, { data: admins }] = await Promise.all([
    supabase.rpc('admin_students_auth_status'),
    supabase.from('profiles').select('user_id, full_name').eq('is_approved', true),
    supabase.from('user_roles').select('user_id').eq('role', 'admin'),
  ]);
  if (error) throw error;
  const adminIds = new Set((admins || []).map((a) => a.user_id));
  const names = new Map((profiles || []).filter((p) => !adminIds.has(p.user_id)).map((p) => [p.user_id, p.full_name || 'Élève']));
  const limit = Date.now() - RECENT_DAYS * 86400000;
  const out: LoginTrouble[] = [];
  for (const s of status || []) {
    const name = names.get(s.user_id);
    if (!name) continue;
    if (!s.email_confirmed) { out.push({ user_id: s.user_id, name, reason: 'email', since: null }); continue; }
    const asked = s.recovery_sent_at ? new Date(s.recovery_sent_at).getTime() : 0;
    const signed = s.last_sign_in_at ? new Date(s.last_sign_in_at).getTime() : 0;
    if (asked > limit && signed < asked) out.push({ user_id: s.user_id, name, reason: 'oubli', since: s.recovery_sent_at });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export interface AbsentStudent {
  user_id: string;
  name: string;
  /** Dernière visite connue (null = jamais venu depuis l'inscription) */
  lastSeen: string | null;
  /** Jours depuis la dernière visite (ou depuis l'inscription) */
  days: number;
}

export const ABSENT_DAYS = 30;

/**
 * Élèves approuvés qui n'ont pas ouvert l'appli depuis plus de 30 jours (bandeau du bouclier, demande de Nadia 2026-10-18).
 * Souvent un souci de connexion qui ne se voit pas autrement (ex. Lina Nebian en 2026-10).
 * Dernière visite = la plus récente entre la présence (profiles.last_seen) et la dernière connexion ; jamais venu = date d'inscription.
 * Pas compté dans les pastilles rouges : c'est une information, pas une urgence.
 */
export async function fetchAbsentStudents(): Promise<AbsentStudent[]> {
  const [{ data: status }, { data: profiles, error }, { data: admins }] = await Promise.all([
    supabase.rpc('admin_students_auth_status'),
    supabase.from('profiles').select('user_id, full_name, last_seen, created_at').eq('is_approved', true),
    supabase.from('user_roles').select('user_id').eq('role', 'admin'),
  ]);
  if (error) throw error;
  const adminIds = new Set((admins || []).map((a) => a.user_id));
  const signIn = new Map((status || []).map((s) => [s.user_id, s.last_sign_in_at]));
  const out: AbsentStudent[] = [];
  for (const p of profiles || []) {
    if (adminIds.has(p.user_id)) continue;
    const seen = [p.last_seen, signIn.get(p.user_id)].filter((d): d is string => !!d).sort().pop() ?? null;
    const ref = seen ?? p.created_at;
    if (!ref) continue;
    const days = Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
    if (days > ABSENT_DAYS) out.push({ user_id: p.user_id, name: p.full_name || 'Élève', lastSeen: seen, days });
  }
  return out.sort((a, b) => b.days - a.days);
}
