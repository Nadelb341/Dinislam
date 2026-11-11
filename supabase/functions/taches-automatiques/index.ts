import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { parisNow, sendPushInternal } from "../_shared/parisTime.ts";

/**
 * ⏰ Tâches automatiques (2026-11-12), toutes les 15 min (pg_cron « dinislam-taches-automatiques ») :
 * 📒 Carnet de liaison
 *  - message programmé : à l'heure choisie, notification aux élèves visés + à leurs parents reliés (une seule fois : notifie_le) ;
 *  - relance : 2 jours après l'envoi, ceux qui n'ont pas touché « J'ai lu » reçoivent un petit rappel (une seule fois : relance_le).
 * ⏳ Gagner du temps (choix de Nadia du 11/11)
 *  - le MARDI à partir de 16 h : « 📊 Le bilan de la semaine est prêt : l'envoyer aux parents ? » (c'est Nadia qui décide) ;
 *  - le MARDI à partir de 18 h : « 🤖 Les devoirs de la semaine sont prêts » (pré-remplis élève par élève, à relire puis donner).
 *  Une seule fois par semaine : table taches_auto_journal.
 */
serve(async () => {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const bilan: Record<string, unknown> = {};
    const maintenant = new Date().toISOString();

    const [{ data: membres }, { data: roles }, { data: liens }, { data: admins }] = await Promise.all([
      supabase.from('student_group_members').select('user_id, group_id'),
      supabase.from('user_roles').select('user_id').eq('role', 'student'),
      supabase.from('parent_links').select('parent_id, child_id'),
      supabase.from('user_roles').select('user_id').eq('role', 'admin'),
    ]);
    const eleves = [...new Set((roles || []).map((r) => r.user_id))];
    const vises = (m: { cible: string; group_ids: string[]; student_ids: string[] }) =>
      m.cible === 'tous' ? eleves
        : m.cible === 'groupes' ? eleves.filter((id) => (membres || []).some((x) => x.user_id === id && m.group_ids.includes(x.group_id)))
        : eleves.filter((id) => m.student_ids.includes(id));
    const avecParents = (ids: string[]) => [...new Set([...ids, ...(liens || []).filter((l) => ids.includes(l.child_id)).map((l) => l.parent_id)])];

    // 📒 Messages programmés arrivés à l'heure
    const { data: aEnvoyer } = await supabase.from('carnet_messages').select('*').is('notifie_le', null).lte('envoyer_le', maintenant);
    let envoyes = 0;
    for (const m of aEnvoyer || []) {
      // On réserve d'abord (deux passages en même temps n'envoient jamais deux fois)
      const { data: ok } = await supabase.from('carnet_messages').update({ notifie_le: maintenant }).eq('id', m.id).is('notifie_le', null).select('id');
      if (!ok?.length) continue;
      const ids = avecParents(vises(m));
      if (ids.length) await sendPushInternal({ userIds: ids, category: 'sched', title: `📒 Carnet de liaison : ${m.emoji} ${m.titre}`, body: (m.texte || '').slice(0, 140) || 'Un nouveau message de ton professeur', data: { url: '/?carnet=1' } }).catch((e) => console.error('carnet push', e));
      envoyes++;
    }
    bilan.carnet_programmes = envoyes;

    // 🔔 Relance au bout de 2 jours
    const ilYa2j = new Date(Date.now() - 2 * 86400000).toISOString();
    const { data: aRelancer } = await supabase.from('carnet_messages').select('*').eq('relance', true).is('relance_le', null).not('notifie_le', 'is', null).lte('envoyer_le', ilYa2j);
    let relances = 0;
    for (const m of aRelancer || []) {
      const { data: ok } = await supabase.from('carnet_messages').update({ relance_le: maintenant }).eq('id', m.id).is('relance_le', null).select('id');
      if (!ok?.length) continue;
      const { data: lects } = await supabase.from('carnet_lectures').select('user_id').eq('message_id', m.id);
      const ontLu = new Set((lects || []).map((l) => l.user_id));
      const pasLu = vises(m).filter((id) => !ontLu.has(id) && !(liens || []).some((l) => l.child_id === id && ontLu.has(l.parent_id)));
      if (pasLu.length) await sendPushInternal({ userIds: avecParents(pasLu), category: 'sched', title: '📒 Un message t\'attend dans le carnet', body: `${m.emoji} ${m.titre} : touche « J'ai lu » quand tu l'as lu 🙂`, data: { url: '/?carnet=1' } }).catch((e) => console.error('carnet relance', e));
      relances += pasLu.length;
    }
    bilan.carnet_relances = relances;

    // ⏳ Les rendez-vous du mardi (une fois par semaine)
    const p = parisNow();
    const estMardi = new Date(`${p.day}T12:00:00Z`).getUTCDay() === 2;
    const adminIds = (admins || []).map((a) => a.user_id);
    const uneFois = async (cle: string) => {
      const { error } = await supabase.from('taches_auto_journal').insert({ cle });
      return !error; // déjà fait cette semaine = clé déjà là
    };
    if (estMardi && p.hour >= 16 && adminIds.length && await uneFois(`bilan-semaine-${p.day}`)) {
      await sendPushInternal({ userIds: adminIds, title: '📊 Le bilan de la semaine est prêt', body: 'Diamants, lignes, sourates de chaque élève : touche pour le relire et décider de l\'envoyer aux parents.', data: { url: '/?bilanSemaine=1' } }).catch((e) => console.error(e));
      bilan.bilan_semaine = 'proposé';
    }
    if (estMardi && p.hour >= 18 && adminIds.length && await uneFois(`devoirs-prets-${p.day}`)) {
      await sendPushInternal({ userIds: adminIds, title: '🤖 Les devoirs de la semaine sont prêts', body: 'Pré-remplis pour chaque élève, selon où il en est. Relis, puis donne-les au groupe en 1 appui.', data: { url: '/?open=todo&cahier=1&donnerGroupe=1' } }).catch((e) => console.error(e));
      bilan.devoirs_prets = 'proposé';
    }
    return Response.json({ success: true, bilan });
  } catch (e) {
    console.error('taches-automatiques', e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
});
