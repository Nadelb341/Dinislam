import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { parisNow, sendPushInternal } from "../_shared/parisTime.ts";

/**
 * Rappel du programme de lecture du Coran (carte « Coran » › Programme, 2026-10-25) :
 * à 20 h (heure de Paris), un rappel aux élèves dont le programme est en cours, rappel activé,
 * et qui n'ont pas encore coché la lecture du jour. Bouton dans la carte Notifications (catégorie `coran`).
 * Déclenché par pg_cron à 18 h et 19 h UTC : la fonction ne fait rien si ce n'est pas 20 h à Paris.
 * `coran_reminder_logs` évite tout doublon le même jour.
 */
const MESSAGES = [
  "📖 Ta lecture du Coran du jour t'attend, quelques pages et c'est fait !",
  "🌙 N'oublie pas ta lecture du jour, chaque page compte ✨",
  "📚 Ton programme de lecture t'attend, bismillah !",
  "💪 Encore une belle journée de lecture à cocher dans ton programme !",
];

type Programme = { start?: string; totalDays?: number; doneDays?: number[]; reminder?: boolean; finished?: boolean };

const dayIndex = (start: string, today: string) =>
  Math.floor((Date.parse(today + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z')) / 86400000) + 1;

serve(async (req) => {
  try {
    const force = new URL(req.url).searchParams.get('force') === '1';
    const now = parisNow();
    if (now.hour !== 20 && !force) {
      return new Response(JSON.stringify({ success: true, skipped: `il est ${now.hour} h à Paris` }), { headers: { 'Content-Type': 'application/json' } });
    }
    const today = now.day;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: rows, error } = await supabase
      .from('coran_progress').select('user_id, data').eq('kind', 'programme').eq('key', 'active');
    if (error) throw error;

    const due = (rows || []).filter((r: { user_id: string; data: Programme }) => {
      const p = r.data || {};
      if (!p.start || !p.totalDays || p.reminder === false || p.finished) return false;
      const d = dayIndex(p.start, today);
      return d >= 1 && d <= p.totalDays && !(p.doneDays || []).includes(d);
    }).map((r: { user_id: string }) => r.user_id);
    if (!due.length) return new Response(JSON.stringify({ success: true, totalSent: 0 }), { headers: { 'Content-Type': 'application/json' } });

    const { data: logs } = await supabase.from('coran_reminder_logs').select('user_id').eq('sent_on', today).in('user_id', due);
    const already = new Set((logs || []).map((l: { user_id: string }) => l.user_id));
    const toNotify = due.filter((id: string) => !already.has(id));
    if (!toNotify.length) return new Response(JSON.stringify({ success: true, totalSent: 0 }), { headers: { 'Content-Type': 'application/json' } });

    const body = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    const result = await sendPushInternal({ userIds: toNotify, title: '📖 Mon programme de lecture', body, type: 'coran_reminder', category: 'coran', data: { url: '/coran?tab=programme' } });
    await supabase.from('coran_reminder_logs').upsert(toNotify.map((user_id: string) => ({ user_id, sent_on: today })), { onConflict: 'user_id,sent_on' });

    return new Response(JSON.stringify({ success: true, totalSent: result.sent ?? 0, students: toNotify.length }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('coran-reminders', e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
