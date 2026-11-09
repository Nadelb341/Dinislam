import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendPushInternal } from "../_shared/parisTime.ts";
import { AMCES_CALENDAR_2026 } from "../_shared/amcesCalendar2026.ts";

/**
 * 🕌 Rappels de prière (idée 11 de l'audit, choix de Nadia du 2026-11-09) :
 * - chacun allume les prières qu'il veut (Paramètres › Notifications, éteintes au départ) ;
 * - moment au choix de chacun : à l'heure, 5, 10 ou 15 min avant (`priere_avance`) ;
 * - heures de SA ville et de SA méthode de calcul (comme la page Prière) ; Clermont-l'Hérault = calendrier AMCES ;
 * - jamais coupés par le mode calme (comme annoncé dans les réglages).
 * Appelée toutes les 5 min par pg_cron. `rappels_priere_envoyes` empêche tout doublon.
 */
const PRIERES = [
  { cle: 'fajr', col: 'fajr_reminder', nom: 'Fajr', idx: 0 },
  { cle: 'dhuhr', col: 'dhuhr_reminder', nom: 'Dohr', idx: 2 },
  { cle: 'asr', col: 'asr_reminder', nom: 'Asr', idx: 3 },
  { cle: 'maghrib', col: 'maghrib_reminder', nom: 'Maghrib', idx: 4 },
  { cle: 'isha', col: 'isha_reminder', nom: 'Icha', idx: 5 },
] as const;
const FENETRE_MS = 10 * 60 * 1000; // rattrape une tâche planifiée en retard, sans jamais envoyer un rappel « trop vieux »
const DEFAUT = { ville: 'Montpellier (34)', pays: 'FR', lat: 43.61, lon: 3.88, methode: 3 };

const fuseauDe = (pays: string | null) => (pays === 'MA' ? 'Africa/Casablanca' : 'Europe/Paris');
/** Date du jour (AAAA-MM-JJ) dans le fuseau donné */
const jourLocal = (fuseau: string, t = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: fuseau, year: 'numeric', month: '2-digit', day: '2-digit' }).format(t);
/** Instant réel d'une heure « HH:MM » locale, le jour donné, dans le fuseau donné */
function instant(jour: string, hm: string, fuseau: string): number {
  const [y, m, d] = jour.split('-').map(Number);
  const [h, mi] = hm.slice(0, 5).split(':').map(Number);
  const naif = Date.UTC(y, m - 1, d, h, mi);
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: fuseau, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
    .formatToParts(new Date(naif)).map((x) => [x.type, x.value]));
  const vuLocal = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return naif - (vuLocal - naif);
}

type Horaires = Record<string, string>;
async function horairesDuJour(supabase: ReturnType<typeof createClient>, ville: string, lat: number, lon: number, methode: number, jour: string): Promise<Horaires | null> {
  if (ville.includes("Clermont-l'Hérault") && jour.startsWith('2026-')) {
    const [, m, d] = jour.split('-').map(Number);
    const t = AMCES_CALENDAR_2026[m - 1]?.[String(d)];
    if (t) return Object.fromEntries(PRIERES.map((p) => [p.cle, t[p.idx]]));
  }
  const cle = `${lat},${lon},${methode},${jour}`;
  const { data: dejaLa } = await supabase.from('horaires_priere_jour').select('horaires').eq('cle', cle).maybeSingle();
  if (dejaLa?.horaires) return dejaLa.horaires as Horaires;
  const [y, m, d] = jour.split('-');
  const res = await fetch(`https://api.aladhan.com/v1/timings/${d}-${m}-${y}?latitude=${lat}&longitude=${lon}&method=${methode}`);
  if (!res.ok) return null;
  const t = (await res.json())?.data?.timings;
  if (!t) return null;
  const h: Horaires = { fajr: t.Fajr, dhuhr: t.Dhuhr, asr: t.Asr, maghrib: t.Maghrib, isha: t.Isha };
  await supabase.from('horaires_priere_jour').upsert({ cle, horaires: h });
  return h;
}

serve(async (req) => {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const maintenant = Date.now();
    // ?essai=1 : heures du jour de la ville par défaut et instants des rappels, SANS lire aucun réglage ni rien envoyer
    if (new URL(req.url).searchParams.get('essai') === '1') {
      const fuseau = fuseauDe(DEFAUT.pays), jour = jourLocal(fuseau);
      const h = await horairesDuJour(supabase, DEFAUT.ville, DEFAUT.lat, DEFAUT.lon, DEFAUT.methode, jour);
      const amces = await horairesDuJour(supabase, "Clermont-l'Hérault (34)", 43.63, 3.43, 3, jour);
      return Response.json({ maintenant: new Date(maintenant).toISOString(), jour, ville: DEFAUT.ville, horaires: h,
        instants_utc: h && Object.fromEntries(PRIERES.map((p) => [p.cle, new Date(instant(jour, h[p.cle], fuseau)).toISOString()])), amces });
    }

    let q = supabase.from('notification_preferences')
      .select('user_id, fajr_reminder, dhuhr_reminder, asr_reminder, maghrib_reminder, isha_reminder, priere_ville, priere_pays, priere_lat, priere_lon, priere_methode, priere_avance')
      .or('fajr_reminder.eq.true,dhuhr_reminder.eq.true,asr_reminder.eq.true,maghrib_reminder.eq.true,isha_reminder.eq.true');
    const { data: prefs, error } = await q;
    if (error) throw error;
    if (!prefs?.length) return Response.json({ success: true, envoyes: 0, raison: 'personne n\'a allumé de rappel' });

    const aEnvoyer: { user_id: string; priere: typeof PRIERES[number]; heure: string; avance: number; jour: string }[] = [];
    for (const p of prefs) {
      const ville = p.priere_ville ?? DEFAUT.ville;
      const fuseau = fuseauDe(p.priere_pays ?? DEFAUT.pays);
      const lat = p.priere_lat ?? DEFAUT.lat, lon = p.priere_lon ?? DEFAUT.lon, methode = p.priere_methode ?? DEFAUT.methode;
      const avance = p.priere_avance ?? 0;
      // Aujourd'hui, et demain pour un rappel du Fajr « 15 min avant » qui tomberait juste après minuit (rare)
      for (const jour of [jourLocal(fuseau), jourLocal(fuseau, new Date(maintenant + 86400000))]) {
        const h = await horairesDuJour(supabase, ville, lat, lon, methode, jour);
        if (!h) continue;
        for (const pr of PRIERES) {
          if ((p as Record<string, unknown>)[pr.col] !== true || !h[pr.cle]) continue;
          const moment = instant(jour, h[pr.cle], fuseau) - avance * 60000;
          if (maintenant >= moment && maintenant - moment < FENETRE_MS) aEnvoyer.push({ user_id: p.user_id, priere: pr, heure: h[pr.cle].slice(0, 5), avance, jour });
        }
      }
    }

    let envoyes = 0;
    for (const r of aEnvoyer) {
      // On réserve d'abord la ligne : si elle existe déjà, le rappel est déjà parti (aucun doublon possible)
      const { data: reserve } = await supabase.from('rappels_priere_envoyes')
        .upsert({ user_id: r.user_id, jour: r.jour, priere: r.priere.cle }, { onConflict: 'user_id,jour,priere', ignoreDuplicates: true })
        .select('user_id');
      if (!reserve?.length) continue;
      const titre = r.avance ? `🕌 ${r.priere.nom} dans ${r.avance} min (${r.heure})` : `🕌 C'est l'heure du ${r.priere.nom} (${r.heure})`;
      const corps = r.avance ? `{prenom}, la prière du ${r.priere.nom} approche. Prépare-toi 🤲` : `{prenom}, c'est l'heure de la prière du ${r.priere.nom} 🤲`;
      try {
        const res = await sendPushInternal({ userIds: [r.user_id], title: titre, body: corps, type: 'prayer_reminder', tag: `priere-${r.priere.cle}`, data: { url: '/priere' } });
        envoyes += res.sent ?? 0;
      } catch (e) {
        console.error('prayer-reminders envoi', r.user_id, e);
      }
    }
    // Ménage : on ne garde que 3 jours de traces et d'horaires
    const avant = new Date(maintenant - 3 * 86400000).toISOString();
    await supabase.from('rappels_priere_envoyes').delete().lt('envoye_le', avant);
    await supabase.from('horaires_priere_jour').delete().lt('cree_le', avant);

    return Response.json({ success: true, candidats: aEnvoyer.length, envoyes });
  } catch (e) {
    console.error('prayer-reminders', e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
});
