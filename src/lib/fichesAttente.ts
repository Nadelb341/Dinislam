import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

/**
 * 🗂️ Fiches en attente d'inscription (Nadia, 2026-11-15) : élèves / parents de ses cours qui n'ont pas encore de compte.
 * À une nouvelle inscription, l'appli PROPOSE la fiche dont le prénom ressemble (accents, majuscules, surnom qui commence
 * pareil : « Yous » ↔ « Yousra ») ; Nadia valide (✅ relier) ou refuse (✖️ c'est un nouvel élève).
 */
export type FicheAttente = Tables<'fiches_attente'>;

export const normaliser = (t: string | null | undefined) =>
  (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z\s-]/g, ' ').trim();

/** Fiche proposée pour un compte (ou null). Ignore les fiches déjà reliées et celles refusées pour ce compte. */
export function proposerFiche(nomComplet: string | null | undefined, userId: string, fiches: FicheAttente[]): FicheAttente | null {
  const mots = normaliser(nomComplet).split(/[\s-]+/).filter(Boolean);
  if (!mots.length) return null;
  const candidates = fiches.filter((f) => f.statut === 'attente' && !f.refus.includes(userId));
  const score = (f: FicheAttente) => {
    const p = normaliser(f.prenom);
    if (!p) return 0;
    if (mots.includes(p)) return 3;
    if (mots.some((m) => m.length >= 3 && p.length >= 3 && (m.startsWith(p) || p.startsWith(m)))) return 2;
    return 0;
  };
  const tries = candidates.map((f) => ({ f, s: score(f) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  return tries[0]?.f ?? null;
}

/** ✅ Relier : numéros, groupes et lien parent de la fiche copiés dans le compte (sans écraser ce qui est déjà rempli) */
export async function relierFiche(fiche: FicheAttente, userId: string) {
  const { data: p } = await supabase.from('profiles').select('phone, parent_phone, parent_phone_nom, parent2_phone, parent2_phone_nom').eq('user_id', userId).maybeSingle();
  const maj = {
    phone: p?.phone || fiche.telephone || null,
    parent_phone: p?.parent_phone || fiche.parent_telephone || null,
    parent_phone_nom: p?.parent_phone_nom || fiche.parent_nom || null,
    parent2_phone: p?.parent2_phone || fiche.parent2_telephone || null,
    parent2_phone_nom: p?.parent2_phone_nom || fiche.parent2_nom || null,
  };
  const { error: e1 } = await supabase.from('profiles').update(maj).eq('user_id', userId);
  if (e1) throw e1;
  if (fiche.group_ids.length) {
    const { error } = await supabase.from('student_group_members').upsert(fiche.group_ids.map((g) => ({ user_id: userId, group_id: g })), { onConflict: 'user_id,group_id', ignoreDuplicates: true });
    if (error) throw error;
  }
  if (fiche.parent_user_id) {
    const { data: deja } = await supabase.from('parent_links').select('parent_id').eq('parent_id', fiche.parent_user_id).eq('child_id', userId).maybeSingle();
    if (!deja) {
      const { error } = await supabase.from('parent_links').insert({ parent_id: fiche.parent_user_id, child_id: userId });
      if (error) throw error;
    }
  }
  const { error: e2 } = await supabase.from('fiches_attente').update({ statut: 'reliee', relie_a: userId, relie_le: new Date().toISOString() }).eq('id', fiche.id);
  if (e2) throw e2;
}

/** ✖️ Refuser : ce compte n'est pas cette fiche (elle reste en attente pour une autre inscription) */
export async function refuserFiche(fiche: FicheAttente, userId: string) {
  const { error } = await supabase.from('fiches_attente').update({ refus: [...new Set([...fiche.refus, userId])] }).eq('id', fiche.id);
  if (error) throw error;
}

/** 🗂️ Les fiches en attente d'inscription (admin), en direct (realtimeSync › 'fiches-attente') */
export function useFichesAttente() {
  return useQuery({
    queryKey: ['fiches-attente'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fiches_attente').select('*').order('created_at');
      if (error) throw error;
      return (data || []) as FicheAttente[];
    },
  });
}

