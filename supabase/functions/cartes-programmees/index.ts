import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendPushInternal } from "../_shared/parisTime.ts";

/**
 * 🗂️ « Qui voit quoi » — idée 5 + 6 (Nadia, 2026-11-11) : une carte dont l'ouverture était programmée
 * (`learning_modules.ouverte_du`) s'ouvre toute seule ; ici on PRÉVIENT les élèves qui la voient désormais
 * (catégorie « act » = Paramètres › Notifications › Nouvelle activité) et on l'écrit dans le journal.
 * Appelée toutes les 15 min par pg_cron. `ouverture_annoncee_le` empêche tout doublon.
 * La règle « qui voit » est celle de la base (`eleves_qui_voient` → `carte_visible_pour`), jamais réécrite ici.
 */
const RATTRAPAGE_MS = 6 * 60 * 60 * 1000; // une tâche en retard rattrape jusqu'à 6 h, jamais une vieille ouverture

serve(async () => {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const maintenant = new Date();
    const { data: cartes, error } = await supabase.from('learning_modules')
      .select('id, title, builtin_path, ouverte_du, ouverte_jusquau, ouverture_annoncee_le')
      .not('ouverte_du', 'is', null)
      .lte('ouverte_du', maintenant.toISOString())
      .gte('ouverte_du', new Date(maintenant.getTime() - RATTRAPAGE_MS).toISOString());
    if (error) throw error;

    const resultats: { carte: string; eleves: number; envoyes: number }[] = [];
    for (const c of cartes || []) {
      if (c.ouverture_annoncee_le && c.ouverture_annoncee_le >= c.ouverte_du) continue; // déjà annoncée
      if (c.ouverte_jusquau && c.ouverte_jusquau <= maintenant.toISOString()) continue; // déjà refermée
      // On réserve d'abord l'annonce (deux passages en même temps ne préviennent jamais deux fois)
      const { data: reserve } = await supabase.from('learning_modules')
        .update({ ouverture_annoncee_le: maintenant.toISOString() })
        .eq('id', c.id)
        .or(`ouverture_annoncee_le.is.null,ouverture_annoncee_le.lt.${c.ouverte_du}`)
        .select('id');
      if (!reserve?.length) continue;

      const { data: ids } = await supabase.rpc('eleves_qui_voient', { p_module: c.id });
      const eleves = ((ids || []) as unknown[]).map((x) => (typeof x === 'string' ? x : (x as Record<string, string>).eleves_qui_voient)).filter(Boolean);
      let envoyes = 0;
      if (eleves.length) {
        try {
          const res = await sendPushInternal({
            userIds: eleves, category: 'act', tag: `carte-${c.id.slice(0, 8)}`,
            title: `🎉 {prenom}, nouvelle carte : ${c.title} !`,
            body: `La carte « ${c.title} » est maintenant ouverte pour toi sur Dinislam.`,
            data: { url: c.builtin_path || '/' },
          });
          envoyes = res.sent ?? 0;
        } catch (e) {
          console.error('cartes-programmees envoi', c.id, e);
        }
      }
      await supabase.from('cartes_journal').insert({
        module_id: c.id, carte: c.title, par: null,
        quoi: `⏰ Ouverture programmée arrivée — ${eleves.length} élève${eleves.length > 1 ? 's' : ''} prévenu${eleves.length > 1 ? 's' : ''}`,
      });
      resultats.push({ carte: c.title, eleves: eleves.length, envoyes });
    }
    return Response.json({ success: true, resultats });
  } catch (e) {
    console.error('cartes-programmees', e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
});
