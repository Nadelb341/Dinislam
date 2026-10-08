import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { parisNow, sendPushInternal } from "../_shared/parisTime.ts";

// Titre lisible de la notification (avant : « 📅 general »)
const MODULE_TITLES: Record<string, string> = {
  general: '📅 Rappel', cours: "🎒 Cours d'arabe", ramadan: '🌙 Ramadan', sourates: '📖 Sourates', nourania: '✨ Nourania',
  invocations: '🤲 Invocations', priere: '🕌 Prière', allah_names: "🌟 99 Noms d'Allah", alphabet: '🔤 Alphabet',
};
// Relance automatique douce (idée 1, 2026-10-08) : mêmes messages que le bouton « ✉️ Encourager » (src/lib/engagement.ts)
const NUDGES = [
  "Salam {prenom} ! 🌟 Ça fait un moment que je n'ai pas eu de tes nouvelles. Ton chemin de la semaine t'attend dans le Cahier de texte, je suis sûre que tu vas y arriver 💪",
  "Coucou {prenom} 👋 Tu me manques dans les validations ! Un petit effort cette semaine et tes diamants vont briller 💎 Je crois en toi !",
  "{prenom}, n'oublie pas : 10 minutes par jour suffisent pour avancer 📖 Je t'attends avec ta prochaine leçon, inch'Allah 🤲",
  "Salam {prenom} 🌸 Si tu as besoin d'aide pour ta leçon ou ta sourate, écris-moi ici, je suis là pour t'aider 😊",
  "{prenom}, tu es capable de grandes choses, bismillah ! 🚀 Ouvre ton chemin de la semaine et commence par le diamant que tu préfères 💎",
];
const firstNameOf = (n: string | null) => (n || '').trim().split(/\s+/)[0] || '';

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
            ? `📖 {prenom}, demain c'est cours d'arabe ! Pense à travailler ${parts.join(' et ')} ce soir, inch'Allah 💪`
            : `{prenom}, ${notif.message}`;
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

    // 💎 Mercredi 21 h : le « chemin de la semaine » de chaque élève (sauf vacances, si l'enseignante l'a laissé activé)
    let programs = 0;
    if (!inHolidays && isoWeekday(today) === 3 && currTotal >= 21 * 60 && currTotal < 21 * 60 + 5) {
      const { data: settings } = await supabase.from('weekly_program_settings').select('enabled').eq('id', 1).maybeSingle();
      if (settings?.enabled !== false) {
        const { error: logErr } = await supabase.from('auto_reminder_logs').insert({ kind: 'chemin_semaine', sent_on: today });
        if (!logErr) {
          const { data: created } = await supabase.rpc('generate_weekly_programs', { p_week: today });
          programs = Number(created) || 0;
          const { data: rows } = await supabase.from('weekly_programs').select('student_id, items').eq('week_start', today);
          for (const r of (rows ?? []) as { student_id: string; items: unknown[] }[]) {
            const n = Array.isArray(r.items) ? r.items.length : 0;
            try {
              await sendPushInternal({
                userId: r.student_id,
                title: '🗺️ Ton chemin de la semaine',
                body: `{prenom}, ton chemin est prêt : ${n} diamant${n > 1 ? 's' : ''} à faire briller 💎 Commence par celui que tu veux !`,
                tag: `programme-${today}`,
                type: 'weekly_program',
                category: 'prog_week',
                data: { url: '/?open=devoirs' },
              });
            } catch (e) { console.error('Chemin de la semaine : notification non envoyée', r.student_id, e); }
          }
        }
      }
    }

    // 📊 Lundi 9 h : récap pour l'enseignante (qui a fait briller ses diamants depuis mercredi)
    let recap = false;
    if (isoWeekday(today) === 1 && currTotal >= 9 * 60 && currTotal < 9 * 60 + 5) {
      const { error: logErr } = await supabase.from('auto_reminder_logs').insert({ kind: 'recap_lundi', sent_on: today });
      if (!logErr) {
        const { data: view } = await supabase.rpc('weekly_program_view', {});
        const list = (view ?? []) as { full_name: string | null; items: { done: boolean }[] }[];
        if (list.length) {
          const first = (n: string | null) => (n || 'Élève').trim().split(/\s+/)[0];
          const all = list.filter((p) => p.items.length && p.items.every((i) => i.done));
          const none = list.filter((p) => p.items.length && p.items.every((i) => !i.done));
          const some = list.length - all.length - none.length;
          const names = none.slice(0, 6).map((p) => first(p.full_name)).join(', ') + (none.length > 6 ? '…' : '');
          const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
          try {
            await sendPushInternal({
              userIds: (admins ?? []).map((a: { user_id: string }) => a.user_id),
              title: '📊 Récap de la semaine',
              body: `💎 ${all.length} élève${all.length > 1 ? 's ont' : ' a'} tout validé, ${some} en partie, ${none.length} rien${none.length ? ` (${names})` : ''}.`,
              tag: `recap-${today}`,
              type: 'weekly_recap',
              category: 'adm_recap',
              data: { url: '/?admin=cahier-texte' },
            });
            recap = true;
          } catch (e) { console.error('Récap du lundi non envoyé', e); }
        }
      }
    }

    // 👀 Suivi des décrocheurs (idées 1 + 5) : niveau de chaque élève, « bon retour », relance du jeudi
    let comebacks = 0, nudges = 0;
    {
      const { data: eng } = await supabase.rpc('student_engagement');
      const { data: states } = await supabase.from('dropout_state').select('student_id, level, since');
      const stateOf = new Map(((states ?? []) as { student_id: string; level: string | null; since: string | null }[]).map((x) => [x.student_id, x]));
      const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
      const adminIds = (admins ?? []).map((a: { user_id: string }) => a.user_id);
      const thursdayNudge = !inHolidays && isoWeekday(today) === 4 && currTotal >= 18 * 60 && currTotal < 18 * 60 + 5;
      let nudgeAllowed = false;
      if (thursdayNudge) {
        const { data: st } = await supabase.from('weekly_program_settings').select('auto_nudge').eq('id', 1).maybeSingle();
        if (st?.auto_nudge !== false) {
          const { error: logErr } = await supabase.from('auto_reminder_logs').insert({ kind: 'relance_jeudi', sent_on: today });
          nudgeAllowed = !logErr;
        }
      }
      for (const e of (eng ?? []) as { student_id: string; full_name: string | null; gender: string | null; joined_at: string | null; last_validation: string | null; missed_streak: number }[]) {
        const ref = e.last_validation ?? e.joined_at;
        const idle = ref ? (Date.now() - new Date(ref).getTime()) / 86400000 : 0;
        const level = e.missed_streak >= 2 || idle >= 21 ? 'red' : e.missed_streak === 1 ? 'orange' : null;
        const prev = stateOf.get(e.student_id);
        const prenom = firstNameOf(e.full_name);

        // Idée 5 : il était rouge et vient de revalider quelque chose → bravo à l'élève, l'enseignante est prévenue
        if (prev?.level === 'red' && e.last_validation && prev.since && new Date(e.last_validation) > new Date(prev.since)) {
          await supabase.from('dropout_state').upsert({ student_id: e.student_id, level, since: new Date().toISOString(), comeback_at: new Date().toISOString(), comeback_seen: false, updated_at: new Date().toISOString() });
          comebacks++;
          try {
            await sendPushInternal({ userId: e.student_id, title: '🎉 Bon retour, {prenom} !', body: 'On est fiers de toi, tu es {reparti|repartie} ! Continue comme ça 💪', tag: `comeback-${today}`, type: 'comeback', category: 'rec', data: { url: '/' } });
            if (adminIds.length) await sendPushInternal({ userIds: adminIds, title: '💪 Suivi', body: `${prenom || 'Un élève'} est ${e.gender === 'fille' ? 'repartie' : 'reparti'} ! ${e.gender === 'fille' ? 'Elle' : 'Il'} vient de valider une étape.`, tag: `comeback-${e.student_id}`, type: 'comeback', category: 'adm_recap', data: { url: '/?admin=cahier-texte' } });
          } catch (err) { console.error('Bon retour non envoyé', e.student_id, err); }
          continue;
        }
        if (!prev || prev.level !== level) {
          await supabase.from('dropout_state').upsert({ student_id: e.student_id, level, since: new Date().toISOString(), updated_at: new Date().toISOString() });
        }

        // Idée 1 : jeudi 18 h, petit message automatique aux élèves en orange
        if (nudgeAllowed && level === 'orange') {
          const raw = NUDGES[Math.floor(Math.random() * NUDGES.length)];
          const msg = prenom ? raw.replace(/\{prenom\}/g, prenom) : raw.replace(/\{prenom\},?\s*/g, '');
          const { error: mErr } = await supabase.from('user_messages').insert({ user_id: e.student_id, message: msg, sender_type: 'admin', message_type: 'text' });
          if (mErr) { console.error('Relance non enregistrée', e.student_id, mErr.message); continue; }
          await supabase.from('encouragement_logs').insert({ student_id: e.student_id, message: msg, automatic: true });
          nudges++;
          try {
            await sendPushInternal({ userId: e.student_id, title: '✉️ {prenom}, nouveau message de ton prof', body: msg.substring(0, 100), tag: `nudge-${today}`, type: 'nudge', category: 'msg', data: { url: '/?open=messages' } });
          } catch (err) { console.error('Relance : notification non envoyée', e.student_id, err); }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      comebacks,
      nudges,
      programs,
      recap,
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
