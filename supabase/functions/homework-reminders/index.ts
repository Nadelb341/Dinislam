import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const REMINDER_MESSAGES = [
  "Nadia attend que tu lui envoies ton devoir 📚",
  "N'oublie pas ! Nadia attend ton enregistrement ⏰",
  "Il te reste du temps, mais n'oublie pas ton devoir ! 💪",
  "Allez, enregistre et envoie ton devoir maintenant 🎙️",
  "Nadia attend ton devoir avec impatience 🌟",
  "Tu n'as pas encore rendu ton devoir. Lance-toi ! 📖",
  "Coup de pouce ! Pense à rendre ton devoir avant la date limite ✨",
];

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Devoirs avec une date butoir pas encore dépassée
    const { data: devoirs, error: devoirsError } = await supabase
      .from('devoirs')
      .select('id, titre, assigned_to, group_id, student_id, date_limite')
      .not('date_limite', 'is', null)
      .gt('date_limite', new Date().toISOString());

    if (devoirsError) throw devoirsError;
    if (!devoirs?.length) return new Response(JSON.stringify({ success: true, totalSent: 0 }), { headers: { 'Content-Type': 'application/json' } });

    // Admins à exclure
    const { data: adminRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    const adminIds = new Set((adminRoles || []).map((r: any) => r.user_id));

    let totalSent = 0;

    for (const devoir of devoirs) {
      // Trouver les élèves concernés selon assigned_to
      let studentIds: string[] = [];

      if (devoir.assigned_to === 'all') {
        const { data: profiles } = await supabase.from('profiles').select('user_id').eq('is_approved', true);
        studentIds = (profiles || []).map((p: any) => p.user_id).filter((id: string) => !adminIds.has(id));
      } else if (devoir.assigned_to === 'group' && devoir.group_id) {
        const { data: members } = await supabase
          .from('student_group_members').select('user_id').eq('group_id', devoir.group_id);
        studentIds = (members || []).map((m: any) => m.user_id).filter((id: string) => !adminIds.has(id));
      } else if (devoir.assigned_to === 'student' && devoir.student_id) {
        if (!adminIds.has(devoir.student_id)) studentIds = [devoir.student_id];
      }

      if (!studentIds.length) continue;

      // Exclure ceux qui ont déjà rendu (statut rendu ou corrigé)
      const { data: rendus } = await supabase
        .from('devoirs_rendus').select('student_id').eq('devoir_id', devoir.id).in('statut', ['rendu', 'corrige']);
      const rendusIds = new Set((rendus || []).map((r: any) => r.student_id));
      const pendingIds = studentIds.filter((id) => !rendusIds.has(id));
      if (!pendingIds.length) continue;

      // Vérifier le log de rappel (dédup 2h)
      const { data: logs } = await supabase
        .from('homework_reminder_logs')
        .select('student_id, last_sent_at')
        .eq('devoir_id', devoir.id)
        .in('student_id', pendingIds);

      const logMap = new Map((logs || []).map((l: any) => [l.student_id, new Date(l.last_sent_at)]));
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const toNotify = pendingIds.filter((id) => {
        const lastSent = logMap.get(id);
        return !lastSent || lastSent < twoHoursAgo;
      });

      if (!toNotify.length) continue;

      // Message aléatoire
      const randomMsg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];

      // Envoyer la notification push via la fonction existante
      await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'Origin': 'https://dinislam.lovable.app',
        },
        body: JSON.stringify({
          userIds: toNotify,
          title: `📚 Devoir à rendre : ${devoir.titre}`,
          body: randomMsg,
          data: { url: '/?open=devoirs' },
        }),
      });

      // Upsert dans homework_reminder_logs
      const now = new Date().toISOString();
      await supabase.from('homework_reminder_logs').upsert(
        toNotify.map((id) => ({ devoir_id: devoir.id, student_id: id, last_sent_at: now })),
        { onConflict: 'devoir_id,student_id' }
      );

      totalSent += toNotify.length;
    }

    return new Response(JSON.stringify({ success: true, totalSent }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
