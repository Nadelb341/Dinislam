import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { byName } from '@/lib/utils';

/**
 * 📓 Données partagées du « Tableau de la classe » (C) et du « Récapitulatif » (E) — 2026-10-26.
 * Toutes les clés commencent par 'cahier-classe' (rafraîchies en direct par RealtimeSync).
 */

export type CahierEleve = { user_id: string; full_name: string | null; gender: string | null };
export type CahierDevoir = {
  id: string; titre: string; type: string; assigned_to: string;
  group_id: string | null; student_id: string | null;
  created_at: string | null; date_limite: string | null;
};
export type CahierRendu = {
  id: string; devoir_id: string | null; student_id: string; statut: string | null;
  audio_url: string | null; rendu_at: string | null; commentaire_admin: string | null;
};
/** État d'une case élève × devoir */
export type EtatCase = 'hors' | 'corrige' | 'rendu' | 'a_refaire' | 'rien';

const DAY = 24 * 60 * 60 * 1000;
export const prenomOf = (name: string | null | undefined) => (name || '').trim().split(/\s+/)[0] || 'Élève';

/** Le devoir est-il donné à cet élève ? (individuel = lui seul ; groupe = membres du groupe ; tous = tout le monde) */
export function concerne(d: CahierDevoir, studentId: string, groupId: string | null, memberIds: string[]) {
  if (d.student_id) return d.student_id === studentId;
  if (d.group_id) return d.group_id === groupId && memberIds.includes(studentId);
  return d.assigned_to === 'all';
}

export function useCahierClasse(groupId: string | null, memberIds: string[]) {
  const membersKey = [...memberIds].sort().join(',');

  const { data, isLoading, error } = useQuery({
    queryKey: ['cahier-classe', 'donnees', groupId, membersKey],
    queryFn: async () => {
      const ids = membersKey ? membersKey.split(',') : [];
      const filtres = ['assigned_to.eq.all'];
      if (groupId) filtres.push(`group_id.eq.${groupId}`);
      if (ids.length) filtres.push(`student_id.in.(${ids.join(',')})`);
      const [devoirsRes, profilsRes, rendusRes] = await Promise.all([
        supabase.from('devoirs')
          .select('id, titre, type, assigned_to, group_id, student_id, created_at, date_limite')
          .or(filtres.join(','))
          .order('created_at', { ascending: true }),
        ids.length
          ? supabase.from('profiles').select('user_id, full_name, gender').in('user_id', ids)
          : Promise.resolve({ data: [] as CahierEleve[], error: null }),
        ids.length
          ? supabase.from('devoirs_rendus')
            .select('id, devoir_id, student_id, statut, audio_url, rendu_at, commentaire_admin')
            .in('student_id', ids)
            .order('rendu_at', { ascending: false })
          : Promise.resolve({ data: [] as CahierRendu[], error: null }),
      ]);
      if (devoirsRes.error) throw devoirsRes.error;
      if (profilsRes.error) throw profilsRes.error;
      if (rendusRes.error) throw rendusRes.error;
      const devoirs = (devoirsRes.data || []) as CahierDevoir[];
      const rendus = (rendusRes.data || []) as CahierRendu[];
      // Titres des devoirs rendus qui ne sont pas dans la liste (ex. devoir d'un ancien groupe de l'élève)
      const connus = new Set(devoirs.map((d) => d.id));
      const manquants = [...new Set(rendus.map((r) => r.devoir_id).filter((x): x is string => !!x && !connus.has(x)))];
      let autres: CahierDevoir[] = [];
      if (manquants.length) {
        const { data: extra } = await supabase.from('devoirs')
          .select('id, titre, type, assigned_to, group_id, student_id, created_at, date_limite')
          .in('id', manquants);
        autres = (extra || []) as CahierDevoir[];
      }
      const eleves = ((profilsRes.data || []) as CahierEleve[]);
      // Un membre sans fiche profil garde quand même sa ligne
      for (const id of ids) if (!eleves.some((e) => e.user_id === id)) eleves.push({ user_id: id, full_name: null, gender: null });
      return { devoirs, autres, rendus, eleves: eleves.sort(byName((e) => e.full_name)) };
    },
  });

  const calc = useMemo(() => {
    if (!data) return null;
    const ids = data.eleves.map((e) => e.user_id);
    // Dernier rendu de chaque élève pour chaque devoir (liste triée du plus récent au plus ancien)
    const renduDe = new Map<string, CahierRendu>();
    for (const r of data.rendus) {
      if (!r.devoir_id) continue;
      const k = `${r.devoir_id}|${r.student_id}`;
      if (!renduDe.has(k)) renduDe.set(k, r);
    }
    const etat = (d: CahierDevoir, studentId: string): EtatCase => {
      if (!concerne(d, studentId, groupId, ids)) return 'hors';
      const r = renduDe.get(`${d.id}|${studentId}`);
      if (!r) return 'rien';
      if (r.statut === 'corrige') return 'corrige';
      if (r.statut === 'a_refaire') return 'a_refaire';
      return 'rendu';
    };
    const stats = (d: CahierDevoir) => {
      const concernes = ids.filter((id) => concerne(d, id, groupId, ids));
      const valides = concernes.filter((id) => etat(d, id) === 'corrige').length;
      return { concernes, valides, termine: concernes.length > 0 && valides === concernes.length };
    };
    const now = Date.now();
    // Colonnes : 5 dernières semaines + plus anciens pas encore validés par tous
    const colonnes = data.devoirs.filter((d) => {
      const s = stats(d);
      if (!s.concernes.length) return false;
      const recent = !d.created_at || now - new Date(d.created_at).getTime() <= 35 * DAY;
      return recent || !s.termine;
    });
    const titreDe = new Map<string, CahierDevoir>();
    for (const d of [...data.devoirs, ...data.autres]) titreDe.set(d.id, d);
    return { eleves: data.eleves, colonnes, etat, stats, renduDe, titreDe, rendus: data.rendus };
  }, [data, groupId]);

  return { calc, isLoading, error };
}

/** Date courte « mer. 4/11 » */
export function dateCourte(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'numeric' });
}

export function enRetard(d: CahierDevoir) {
  return !!d.date_limite && new Date(d.date_limite).getTime() < Date.now();
}
