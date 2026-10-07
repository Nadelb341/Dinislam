import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { parisNow, sendPushInternal } from "../_shared/parisTime.ts";

// Titre lisible de la notification (avant : « 📅 general »)
const MODULE_TITLES: Record<string, string> = {
  general: '📅 Rappel', cours: "🎒 Cours d'arabe", ramadan: '🌙 Ramadan', sourates: '📖 Sourates', nourania: '✨ Nourania',
  invocations: '🤲 Invocations', priere: '🕌 Prière', allah_names: "🌟 99 Noms d'Allah", alphabet: '🔤 Alphabet',
};
/** Jour de la semaine d'une date AAAA-MM-JJ : 1 = lundi … 7 = dimanche */
const isoWeekday = (day: string) => { const d = new Date(`${day}T12:00:00Z`).getUTCDay(); return d === 0 ? 7 : d; };

const ALLOWED_ORIGINS = ['https://dinislam-app.vercel.app', 'http://localhost:8080'];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // L'heure saisie par l'admin est l'heure de Paris (avant : comparée à l'heure UTC → 2 h de décalage)
    const now = parisNow();
    const today = now.day;
    const currTotal = now.hour * 60 + now.minute;

    // Fetch active scheduled notifications for today
    const { data: notifications, error } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today);

    if (error) throw error;

    let totalSent = 0;
    // Vacances scolaires (pause des notifications cochées « pause pendant les vacances »)
    const { data: holidays } = await supabase.from('school_holidays').select('start_date, end_date').lte('start_date', today).gte('end_date', today);
    const inHolidays = (holidays ?? []).length > 0;

    for (const notif of (notifications || [])) {
      const sendTime = notif.send_time?.substring(0, 5);
      if (!sendTime) continue;
      // Jours choisis (ex. chaque mardi) ; vide = tous les jours
      if (Array.isArray(notif.weekdays) && notif.weekdays.length && !notif.weekdays.includes(isoWeekday(today))) continue;
      if (notif.skip_holidays && inHolidays) continue;

      // Déclenché toutes les 5 min par pg_cron : on envoie dans les 5 min qui suivent l'heure prévue,
      // une seule fois par jour (last_sent_on) — avant, la fenêtre ±5 min pouvait envoyer 2 ou 3 fois.
      const [sendHour, sendMinute] = sendTime.split(':').map(Number);
      const diff = currTotal - (sendHour * 60 + sendMinute);
      if (diff < 0 || diff >= 5) continue;
      if (notif.last_sent_on === today) continue;

      // Call the send-push-notification edge function (now VAPID-based)
      const pushBody: Record<string, unknown> = {
        title: MODULE_TITLES[notif.module] ?? `📅 ${notif.module}`,
        body: notif.message,
        tag: `scheduled-${notif.id}`,
        type: 'scheduled',
        category: 'sched',
      };

      // Determine recipients
      if (notif.recipients !== 'all' && Array.isArray(notif.recipients)) {
        if (notif.recipients.length === 0) continue;
        pushBody.userIds = notif.recipients;
      } else {
        pushBody.sendToAll = true;
      }

      // Marquer AVANT l'envoi : si deux passages se chevauchent, un seul envoie
      const { data: claimed } = await supabase
        .from('scheduled_notifications').update({ last_sent_on: today })
        .eq('id', notif.id).or(`last_sent_on.is.null,last_sent_on.neq.${today}`).select('id');
      if (!claimed?.length) continue;

      // Rappel « 🎒 Cours d'arabe » : message personnalisé avec la sourate et la leçon en cours de chaque élève
      if (notif.module === 'cours') {
        const { data: targets } = await supabase.rpc('course_reminder_targets');
        const wanted = Array.isArray(notif.recipients) ? new Set(notif.recipients as string[]) : null;
        for (const t of (targets ?? []) as { user_id: string; sourate: string | null; lecon: string | null }[]) {
          if (wanted && !wanted.has(t.user_id)) continue;
          const parts = [t.sourate ? `ta sourate ${t.sourate}` : '', t.lecon ? `ta ${t.lecon} de Nourania` : ''].filter(Boolean);
          const body = parts.length
            ? `📖 Demain, c'est cours d'arabe ! Pense à travailler ${parts.join(' et ')} ce soir, inch'Allah 💪`
            : notif.message;
          try {
            const r = await sendPushInternal({ ...pushBody, userId: t.user_id, body, sendToAll: undefined, userIds: undefined });
            totalSent += r?.sent || 0;
          } catch (e) { console.error('Rappel du cours non envoyé', t.user_id, e); }
        }
        continue;
      }

      const pushResult = await sendPushInternal(pushBody);
      const sent = pushResult?.sent || 0;
      totalSent += sent;
      console.log(`Scheduled notification ${notif.id}: sent to ${sent} recipients`);
    }

    // Rappels des tâches « À FAIRE » de l'enseignante (heure choisie atteinte, pas encore rappelées)
    let tasksReminded = 0;
    const { data: dueTasks } = await supabase
      .from('admin_tasks')
      .select('id, title, created_by, group_id')
      .eq('done', false)
      .is('reminded_at', null)
      .lte('remind_at', new Date().toISOString());
    for (const task of (dueTasks || [])) {
      if (!task.created_by) continue;
      // Marquer AVANT l'envoi : un seul passage envoie le rappel
      const { data: claimed } = await supabase.from('admin_tasks')
        .update({ reminded_at: new Date().toISOString() }).eq('id', task.id).is('reminded_at', null).select('id');
      if (!claimed?.length) continue;
      try {
        await sendPushInternal({
          userId: task.created_by,
          title: '📝 À FAIRE',
          body: task.title,
          tag: `admin-task-${task.id}`,
          type: 'admin_task',
          category: 'adm_task',
          data: { url: '/?open=todo' },
        });
        tasksReminded++;
      } catch (e) {
        console.error('Rappel de tâche non envoyé', task.id, e);
      }
    }

    // La veille du cours (mardi 10 h, heure de Paris) : rappel à l'enseignante s'il reste des « 📚 Devoirs à préparer »
    let prepReminded = 0;
    if (!inHolidays && isoWeekday(today) === 2 && currTotal >= 10 * 60 && currTotal < 10 * 60 + 5) {
      const { data: prep } = await supabase.from('admin_tasks').select('id, created_by, group_id').eq('done', false).eq('to_prepare', true);
      if (prep?.length) {
        const { error: logErr } = await supabase.from('auto_reminder_logs').insert({ kind: 'devoirs_a_preparer', sent_on: today });
        if (!logErr) {
          const { data: groups } = await supabase.from('student_groups').select('id, name');
          const byOwner = new Map<string, typeof prep>();
          for (const t of prep) if (t.created_by) byOwner.set(t.created_by, [...(byOwner.get(t.created_by) ?? []), t]);
          for (const [owner, list] of byOwner) {
            const perGroup = new Map<string, number>();
            for (const t of list) {
              const name = groups?.find((g) => g.id === t.group_id)?.name ?? 'Général';
              perGroup.set(name, (perGroup.get(name) ?? 0) + 1);
            }
            const detail = [...perGroup].map(([g, n]) => `${g} : ${n}`).join(' · ');
            try {
              await sendPushInternal({
                userId: owner,
                title: '📚 Devoirs à préparer',
                body: `Demain c'est cours : il te reste ${list.length} devoir${list.length > 1 ? 's' : ''} à préparer (${detail})`,
                tag: `prep-${today}`,
                type: 'admin_task',
                category: 'adm_task',
                data: { url: '/?open=todo' },
              });
              prepReminded++;
            } catch (e) {
              console.error('Rappel « devoirs à préparer » non envoyé', e);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      prepReminded,
      processed: (notifications || []).length,
      totalSent,
      tasksReminded,
    }), { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
