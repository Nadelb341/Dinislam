import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { parisNow, sendPushInternal } from "../_shared/parisTime.ts";

/**
 * 📨 Convocations programmées (Nadia, 2026-11-11 : organisation A, envoi gratuit A).
 * Toutes les 15 min (pg_cron) :
 * - le jour et à l'heure choisis, chaque élève visé reçoit SA convocation dans l'appli (notification à lui et à ses
 *   parents reliés + carte « Je viens / Absent ») ; Nadia reçoit « 📨 Convocations envoyées » pour faire WhatsApp/SMS en 1 appui ;
 * - vacances : si le cours de la semaine tombe pendant les vacances, rien n'est envoyé (option « sauter les vacances ») ;
 * - rappel la veille (option) : à partir de 18 h, « 🎒 Demain, cours à 14 h ».
 * Variables : {prénom}, {groupe}, {jour}, {heure}, {frise}, {saison} — même rendu que src/lib/convocations.ts › rendreConvocation (à changer ENSEMBLE).
 * `dernier_envoi` / `dernier_rappel` = un seul passage par jour.
 */
type Horaire = { group_id: string; weekday: number; start_time: string };
const DEFAUT = { weekday: 3, start_time: '14:00:00' };
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** Instant réel d'une heure locale de Paris (même méthode que prayer-reminders) */
function instantParis(jour: string, hm: string): number {
  const [y, m, d] = jour.split('-').map(Number);
  const [h, mi] = hm.split(':').map(Number);
  const naif = Date.UTC(y, m - 1, d, h, mi);
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
    .formatToParts(new Date(naif)).map((x) => [x.type, x.value]));
  return naif - (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - naif);
}
const plusJours = (jour: string, n: number) => { const d = new Date(`${jour}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const isoJour = (jour: string) => ((new Date(`${jour}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
const libelleJour = (jour: string) => { const d = new Date(`${jour}T12:00:00Z`); return `${JOURS[d.getUTCDay()]} ${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`; };
const libelleHeure = (hm: string) => { const [h, m] = hm.split(':').map(Number); return `${h} h${m ? ` ${String(m).padStart(2, '0')}` : ''}`; };
// 🎨 Frise et emoji de la saison (mois de Paris) — mêmes que src/lib/convocations.ts
const MOTIF: Record<string, [string, string]> = { automne: ['🪵', '🍂'], hiver: ['❄️', '⛄'], printemps: ['🌸', '🐰'], ete: ['☀️', '🐚'] };
const EMOJI: Record<string, string> = { automne: '🍂', hiver: '❄️', printemps: '🌸', ete: '☀️' };
function saisonDe(mois0: number) { return mois0 === 11 || mois0 <= 1 ? 'hiver' : mois0 <= 4 ? 'printemps' : mois0 <= 7 ? 'ete' : 'automne'; }
export function rendreConvocation(texte: string, v: { prenom: string; groupe: string; jour: string; heure: string }, mois0 = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', month: 'numeric' }).format(new Date())) - 1) {
  const s = saisonDe(mois0);
  const frise = Array.from({ length: 11 }, (_, i) => MOTIF[s][i % 2]).join('');
  return texte.replace(/\{pr[ée]nom\}/gi, v.prenom).replace(/\{groupe\}/gi, v.groupe).replace(/\{jour\}/gi, v.jour).replace(/\{heure\}/gi, v.heure)
    .replace(/\{frise\}/gi, frise).replace(/\{saison\}/gi, EMOJI[s]);
}

serve(async () => {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const now = parisNow();
    const aujourdHui = now.day;
    const hm = now.hour * 60 + now.minute;
    const { data: progs, error } = await supabase.from('convocation_programmations').select('*').eq('actif', true);
    if (error) throw error;
    if (!progs?.length) return Response.json({ success: true, envoyes: 0 });

    const [{ data: horaires }, { data: vacances }, { data: membres }, { data: groupes }, { data: roles }, { data: profils }, { data: liens }, { data: admins }] = await Promise.all([
      supabase.from('group_schedules').select('group_id, weekday, start_time'),
      supabase.from('school_holidays').select('start_date, end_date'),
      supabase.from('student_group_members').select('user_id, group_id'),
      supabase.from('student_groups').select('id, name'),
      supabase.from('user_roles').select('user_id').eq('role', 'student'),
      supabase.from('profiles').select('user_id, full_name').eq('is_approved', true),
      supabase.from('parent_links').select('parent_id, child_id'),
      supabase.from('user_roles').select('user_id').eq('role', 'admin'),
    ]);
    const enVacances = (jour: string) => (vacances || []).some((v) => v.start_date <= jour && jour <= v.end_date);
    const eleves = new Set((roles || []).map((r) => r.user_id));
    const nomDe = new Map((profils || []).map((p) => [p.user_id, p.full_name || 'Élève']));
    /** Prochain cours d'un groupe dans les 7 jours (vacances NON sautées : on veut savoir si le cours de la semaine en tombe pendant) */
    const coursDe = (gid: string | null) => {
      const h: Omit<Horaire, 'group_id'> = (horaires || []).find((x) => x.group_id === gid) ?? DEFAUT;
      for (let k = 0; k <= 7; k++) {
        const jour = plusJours(aujourdHui, k);
        if (isoJour(jour) !== h.weekday) continue;
        const debut = instantParis(jour, h.start_time.slice(0, 5));
        if (debut > Date.now()) return { jour, hm: h.start_time.slice(0, 5), instant: debut };
      }
      return null;
    };

    const bilan: Record<string, number> = {};
    for (const p of progs) {
      // Élèves visés et le groupe de chacun (pour l'horaire)
      const vises: { id: string; gid: string | null }[] = [];
      const premierGroupe = (id: string, parmi?: string[]) => (membres || []).find((m) => m.user_id === id && (!parmi || parmi.includes(m.group_id)))?.group_id ?? null;
      if (p.cible === 'tous') for (const id of eleves) vises.push({ id, gid: premierGroupe(id) });
      else if (p.cible === 'groupes') for (const m of membres || []) { if (p.group_ids.includes(m.group_id) && eleves.has(m.user_id) && !vises.some((v) => v.id === m.user_id)) vises.push({ id: m.user_id, gid: m.group_id }); }
      else for (const id of p.student_ids) if (eleves.has(id)) vises.push({ id, gid: premierGroupe(id) });

      const parentsDe = (id: string) => (liens || []).filter((l) => l.child_id === id).map((l) => l.parent_id);
      const envoyer = async (canal: 'appli' | 'rappel') => {
        const envoiId = crypto.randomUUID();
        let n = 0;
        for (const v of vises) {
          const c = coursDe(v.gid);
          if (!c) continue;
          if (p.sauter_vacances && enVacances(c.jour)) continue;
          if (canal === 'rappel' && c.jour !== plusJours(aujourdHui, 1)) continue;
          const groupe = (groupes || []).find((g) => g.id === v.gid)?.name ?? '';
          const prenom = (nomDe.get(v.id) || 'Élève').split(' ')[0];
          const texte = canal === 'appli'
            ? rendreConvocation(p.texte, { prenom, groupe, jour: libelleJour(c.jour), heure: libelleHeure(c.hm) })
            : `🎒 ${prenom}, demain c'est cours à ${libelleHeure(c.hm)}${groupe ? ` (${groupe})` : ''}. À demain in shaa Allah 🤲`;
          const { error: e } = await supabase.from('convocations').insert({ envoi_id: envoiId, student_id: v.id, group_id: v.gid, cours_le: new Date(c.instant).toISOString(), texte, canal, programmation_id: p.id, destinataire: 'appli' });
          if (e) { console.error('convocations insert', e); continue; }
          try {
            await sendPushInternal({ userIds: [v.id, ...parentsDe(v.id)], category: 'sched', tag: `convocation-${v.id.slice(0, 8)}`,
              title: canal === 'appli' ? '📨 Convocation au cours' : '🎒 Cours demain', body: texte, data: { url: '/?convocation=1' } });
          } catch (err) { console.error('convocations push', v.id, err); }
          n++;
        }
        return n;
      };

      const jourHeure = p.heure.slice(0, 5).split(':').map(Number);
      if (isoJour(aujourdHui) === p.jour && hm >= jourHeure[0] * 60 + jourHeure[1] && p.dernier_envoi !== aujourdHui) {
        // On réserve d'abord le passage du jour (deux passages en même temps n'envoient jamais deux fois)
        const { data: ok } = await supabase.from('convocation_programmations').update({ dernier_envoi: aujourdHui }).eq('id', p.id)
          .or(`dernier_envoi.is.null,dernier_envoi.neq.${aujourdHui}`).select('id');
        if (ok?.length) {
          const n = await envoyer('appli');
          bilan[`envoi ${p.id.slice(0, 8)}`] = n;
          if (n) await sendPushInternal({ userIds: (admins || []).map((a) => a.user_id), title: `📨 ${n} convocation${n > 1 ? 's' : ''} envoyée${n > 1 ? 's' : ''} dans l'appli`,
            body: 'Touche pour les envoyer aussi par WhatsApp ou SMS (1 appui par élève).', data: { url: '/?convocations=1' } }).catch((e) => console.error(e));
        }
      }
      if (p.rappel_veille && hm >= 18 * 60 && p.dernier_rappel !== aujourdHui) {
        const { data: ok } = await supabase.from('convocation_programmations').update({ dernier_rappel: aujourdHui }).eq('id', p.id)
          .or(`dernier_rappel.is.null,dernier_rappel.neq.${aujourdHui}`).select('id');
        if (ok?.length) bilan[`rappel ${p.id.slice(0, 8)}`] = await envoyer('rappel');
      }
    }
    return Response.json({ success: true, bilan });
  } catch (e) {
    console.error('convocations-programmees', e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
});
