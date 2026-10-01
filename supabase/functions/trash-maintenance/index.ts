import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendPushInternal } from "../_shared/parisTime.ts";

/**
 * Corbeille des ÉLÈVES (demande de Nadia du 2026-09-30) — lancé chaque jour par pg_cron :
 * - un élément reste 61 jours (2 mois) dans la corbeille, puis il est supprimé définitivement ;
 *   seuls les éléments qui ont atteint 2 mois partent, les autres restent ;
 * - 3 jours avant, les élèves de plus de 12 ans reçoivent l'alerte
 *   « Attention : Ta corbeille dans « Paramètres » va être vidée automatiquement dans 3 jours ».
 * La corbeille de l'admin (Nadia) n'est JAMAIS vidée automatiquement.
 */
const KEEP_DAYS = 61;
const WARN_DAYS = 3;
const DAY = 24 * 60 * 60 * 1000;

function ageOf(p: { date_of_birth: string | null; age: number | null }): number | null {
  if (p.date_of_birth) {
    const b = new Date(p.date_of_birth);
    const n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
  }
  return p.age ?? null;
}

serve(async () => {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: adminRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    const adminIds = new Set((adminRoles || []).map((r: { user_id: string }) => r.user_id));
    const now = Date.now();

    // 1. Vidage : éléments d'élèves de plus de 61 jours
    const purgeBefore = new Date(now - KEEP_DAYS * DAY).toISOString();
    const { data: old } = await supabase.from('trash_items').select('id, user_id, item_type, item_data').lt('deleted_at', purgeBefore);
    const toPurge = (old || []).filter((t: { user_id: string }) => !adminIds.has(t.user_id));
    const audioPaths = toPurge
      .filter((t: { item_type: string }) => t.item_type === 'sourate_recitation')
      .map((t: { item_data: { audio_url?: string } | null }) => (String(t.item_data?.audio_url || '').match(/\/storage\/v1\/object\/(?:public|sign)\/recitations\/(.+?)(?:\?|$)/) || [])[1])
      .filter(Boolean)
      .map((p: string) => decodeURIComponent(p));
    if (audioPaths.length) await supabase.storage.from('recitations').remove(audioPaths);
    if (toPurge.length) await supabase.from('trash_items').delete().in('id', toPurge.map((t: { id: string }) => t.id));

    // 2. Alerte : éléments qui seront vidés dans 3 jours (fenêtre d'un jour → une seule alerte par élément)
    const warnFrom = new Date(now - (KEEP_DAYS - WARN_DAYS + 1) * DAY).toISOString();
    const warnTo = new Date(now - (KEEP_DAYS - WARN_DAYS) * DAY).toISOString();
    const { data: soon } = await supabase.from('trash_items').select('user_id').gte('deleted_at', warnFrom).lt('deleted_at', warnTo);
    const candidates = [...new Set((soon || []).map((t: { user_id: string }) => t.user_id))].filter(id => !adminIds.has(id));
    let warned: string[] = [];
    if (candidates.length) {
      const { data: profiles } = await supabase.from('profiles').select('user_id, date_of_birth, age').in('user_id', candidates);
      // Âge inconnu → on prévient quand même (mieux vaut une alerte de trop qu'une perte sans prévenir)
      warned = (profiles || []).filter((p: { user_id: string; date_of_birth: string | null; age: number | null }) => { const a = ageOf(p); return a === null || a > 12; }).map((p: { user_id: string }) => p.user_id);
      if (warned.length) {
        await sendPushInternal({
          userIds: warned,
          title: '🗑️ Ta corbeille',
          body: 'Attention : Ta corbeille dans « Paramètres » va être vidée automatiquement dans 3 jours',
          type: 'trash_warning',
          data: { url: '/settings#corbeille' },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, purged: toPurge.length, warned: warned.length }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('trash-maintenance', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
