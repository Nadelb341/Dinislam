import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { parisNow, parisDay, sendPushInternal } from "../_shared/parisTime.ts";

/**
 * Rappels de devoirs (choix de Nadia du 2026-09-30) :
 * - 1 rappel par jour à 18 h (heure de Paris) pour chaque devoir pas encore rendu, jusqu'à la date limite ;
 * - la veille de la date limite, ce rappel de 18 h devient un message « c'est demain ! ».
 * Jamais la nuit. Déclenché par pg_cron (16 h et 17 h UTC = 18 h Paris en hiver / en été) :
 * la fonction ne fait rien si ce n'est pas 18 h à Paris. `homework_reminder_logs` évite tout doublon le même jour.
 */
const REMINDER_MESSAGES = [
  "Nadia attend que tu lui envoies ton devoir 📚",
  "N'oublie pas ! Nadia attend ton enregistrement ⏰",
  "Il te reste du temps, mais n'oublie pas ton devoir ! 💪",
  "Allez, enregistre et envoie ton devoir maintenant 🎙️",
  "Nadia attend ton devoir avec impatience 🌟",
  "Tu n'as pas encore rendu ton devoir. Lance-toi ! 📖",
  "Coup de pouce ! Pense à rendre ton devoir avant la date limite ✨",
];

serve(async (req) => {
  try {
    const force = new URL(req.url).searchParams.get('force') === '1';
    const now = parisNow();
    if (now.hour !== 18 && !force) {
      return new Response(JSON.stringify({ success: true, skipped: `il est ${now.hour} h à Paris` }), { headers: { 'Content-Type': 'application/json' } });
    }
    const today = now.day;
    const tomorrow = parisDay(new Date(Date.now() + 24 * 60 * 60 * 1000));

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Devoirs avec une date limite pas encore dépassée
    const { data: devoirs, error: devoirsError } = await supabase
      .from('devoirs')
      .select('id, titre, assigned_to, group_id, student_id, date_limite')
      .not('date_limite', 'is', null)
      .gt('date_limite', new Date().toISOString());
    if (devoirsError) throw devoirsError;
    if (!devoirs?.length) return new Response(JSON.stringify({ success: true, totalSent: 0 }), { headers: { 'Content-Type': 'application/json' } });

    const { data: adminRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    const adminIds = new Set((adminRoles || []).map((r: any) => r.user_id));

    let totalSent = 0;
    for (const devoir of devoirs) {
      let studentIds: string[] = [];
      if (devoir.assigned_to === 'all') {
        const { data: profiles } = await supabase.from('profiles').select('user_id').eq('is_approved', true);
        studentIds = (profiles || []).map((p: any) => p.user_id).filter((id: string) => !adminIds.has(id));
      } else if (devoir.assigned_to === 'group' && devoir.group_id) {
        const { data: members } = await supabase.from('student_group_members').select('user_id').eq('group_id', devoir.group_id);
        studentIds = (members || []).map((m: any) => m.user_id).filter((id: string) => !adminIds.has(id));
      } else if (devoir.assigned_to === 'student' && devoir.student_id) {
        if (!adminIds.has(devoir.student_id)) studentIds = [devoir.student_id];
      }
      if (!studentIds.length) continue;

      // Exclure ceux qui ont déjà rendu (rendu ou corrigé)
      const { data: rendus } = await supabase
        .from('devoirs_rendus').select('student_id').eq('devoir_id', devoir.id).in('statut', ['rendu', 'corrige']);
      const rendusIds = new Set((rendus || []).map((r: any) => r.student_id));
      const pendingIds = studentIds.filter((id) => !rendusIds.has(id));
      if (!pendingIds.length) continue;

      // Un seul rappel par jour et par devoir
      const { data: logs } = await supabase
        .from('homework_reminder_logs').select('student_id, last_sent_at')
        .eq('devoir_id', devoir.id).in('student_id', pendingIds);
      const sentToday = new Set((logs || []).filter((l: any) => parisDay(new Date(l.last_sent_at)) === today).map((l: any) => l.student_id));
      const toNotify = pendingIds.filter((id) => !sentToday.has(id));
      if (!toNotify.length) continue;

      const isEve = parisDay(new Date(devoir.date_limite)) === tomorrow;
      const title = isEve ? `⏰ C'est demain ! ${devoir.titre}` : `📚 Devoir à rendre : ${devoir.titre}`;
      const body = isEve
        ? "La date limite de ton devoir est demain. Pense à l'envoyer ce soir 🙏"
        : REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];

      const result = await sendPushInternal({ userIds: toNotify, title, body, type: 'homework_reminder', data: { url: '/?open=devoirs' } });

      const nowIso = new Date().toISOString();
      await supabase.from('homework_reminder_logs').upsert(
        toNotify.map((id) => ({ devoir_id: devoir.id, student_id: id, last_sent_at: nowIso })),
        { onConflict: 'devoir_id,student_id' }
      );
      totalSent += result.sent ?? 0;
    }

    return new Response(JSON.stringify({ success: true, totalSent }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('homework-reminders', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
