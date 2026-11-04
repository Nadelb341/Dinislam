import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/** Chemin d'une carte de l'accueil (« nourania », « sourates », « module/vocabulaire »…) — même règle que l'accueil */
export const slugCarte = (m: { builtin_path?: string | null; title?: string | null }) =>
  m.builtin_path ? m.builtin_path.replace(/^\//, '') : (m.title || '').toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Cartes de l'accueil ouvertes à l'élève connecté (2026-11-04) : ouvertes à tous et actives, ou ouvertes à lui / à son groupe.
 * Même calcul que l'accueil (Index.tsx `visibleModules`). L'admin : toutes. `null` tant que ce n'est pas chargé.
 */
export function useCartesVisibles(): Set<string> | null {
  const { user, isAdmin } = useAuth();
  const { data } = useQuery({
    queryKey: ['cartes-visibles', user?.id, isAdmin],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: mods }, { data: vis }, { data: grp }] = await Promise.all([
        supabase.from('learning_modules').select('id, title, builtin_path, is_active'),
        supabase.from('module_visibility').select('module_id, visibility_type, user_ids, group_ids'),
        supabase.from('student_group_members').select('group_id').eq('user_id', user!.id),
      ]);
      const mesGroupes = (grp || []).map((g) => g.group_id);
      const parModule = new Map((vis || []).map((v) => [v.module_id, v]));
      const ouvertes = (mods || []).filter((m) => {
        if (isAdmin) return true;
        const v = parModule.get(m.id);
        if (v?.visibility_type === 'users') return (v.user_ids || []).includes(user!.id);
        if (v?.visibility_type === 'groups') return mesGroupes.some((g) => (v.group_ids || []).includes(g));
        return !!m.is_active;
      });
      return ouvertes.map(slugCarte);
    },
  });
  return data ? new Set(data) : null;
}

/** Ligne du barème → cartes dont elle dépend (vide = toujours affichée : devoirs, présence, messages, trésor…) */
export const CARTES_DU_BAREME: Record<string, string[]> = {
  alphabet_bonne_reponse: ['alphabet'], alphabet_lettre_apprise: ['alphabet'],
  nourania_lecon_validee: ['nourania'], sourate_validee: ['sourates'], invocation_vue: ['invocations'],
  priere_validee: ['priere'], jeune_marque: ['ramadan'], quiz_reussi: ['ramadan'], ramadan_jour_complete: ['ramadan'],
  vocabulaire_appris: ['module/vocabulaire', 'grammaire'],
  allah_nom_valide: ['allah-names'],
};
