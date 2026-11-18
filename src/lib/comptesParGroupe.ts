import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * 👥 Comptes rangés PAR GROUPE (comptes validés, sans les admins), avec recherche par prénom.
 * Même présentation que le 👻 mode fantôme (Nadia, 2026-11-18 : « c'est plus facile pour moi de vérifier groupe par groupe ») :
 * sert au mode fantôme ET aux cartes « Valider des sourates / leçons / invocations pour un élève ».
 */
export type CompteGroupe = { user_id: string; full_name: string | null };

export function useComptesParGroupe(enabled = true) {
  return useQuery({
    queryKey: ['mode-fantome', 'comptes'],
    enabled,
    queryFn: async () => {
      const [{ data: profils, error }, { data: admins }, { data: groupes }, { data: membres }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').eq('is_approved', true).order('full_name'),
        supabase.from('user_roles').select('user_id').eq('role', 'admin'),
        supabase.from('student_groups').select('id, name, position').order('position'),
        supabase.from('student_group_members').select('group_id, user_id'),
      ]);
      if (error) throw error;
      const exclus = new Set((admins || []).map((a) => a.user_id));
      return { comptes: (profils || []).filter((p) => !exclus.has(p.user_id)) as CompteGroupe[], groupes: groupes || [], membres: membres || [] };
    },
  });
}

export function sectionsParGroupe(data: ReturnType<typeof useComptesParGroupe>['data'], cherche: string) {
  if (!data) return [];
  const q = cherche.trim().toLowerCase();
  const garde = (c: CompteGroupe) => !q || (c.full_name || '').toLowerCase().includes(q);
  const dansUnGroupe = new Set<string>();
  const res = data.groupes.map((g) => {
    const ids = new Set(data.membres.filter((m) => m.group_id === g.id).map((m) => m.user_id));
    ids.forEach((id) => dansUnGroupe.add(id));
    return { titre: g.name, comptes: data.comptes.filter((c) => ids.has(c.user_id) && garde(c)) };
  });
  res.push({ titre: 'Sans groupe (parents, adultes…)', comptes: data.comptes.filter((c) => !dansUnGroupe.has(c.user_id) && garde(c)) });
  return res.filter((s) => s.comptes.length);
}

