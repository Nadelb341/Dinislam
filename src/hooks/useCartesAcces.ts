import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { trierGroupesParNumero } from '@/lib/studentGroups';
import { accesDe, type Acces, type Eleve } from '@/lib/cartesAcces';
import { EVT_ATTENTE, changementsEnAttente, envoyerAccesEnAttente, nombreEnAttente, type CarteAEnregistrer } from '@/lib/cartesAccesEnregistrer';

/**
 * 🗂️ Données de « Qui voit quoi » (admin) : cartes + qui les voit, groupes, élèves et leurs groupes.
 * En direct (clé 'cartes-acces' dans realtimeSync.ts) ; lisible hors ligne (copie gardée par le service worker).
 */
export interface CarteAcces extends CarteAEnregistrer { display_order: number; acces: Acces }
export interface GroupeAcces { id: string; name: string; color: string | null }

export function useCartesAcces(enabled = true) {
  const q = useQuery({
    queryKey: ['cartes-acces'],
    enabled,
    queryFn: async () => {
      const [mods, vis, grps, mbrs, profs, roles] = await Promise.all([
        supabase.from('learning_modules').select('id, title, builtin_path, is_active, display_order, ouverte_du, ouverte_jusquau').order('display_order'),
        supabase.from('module_visibility').select('module_id, visibility_type, user_ids, group_ids'),
        supabase.from('student_groups').select('id, name, color, position'),
        supabase.from('student_group_members').select('user_id, group_id'),
        supabase.from('profiles').select('user_id, full_name, email').eq('is_approved', true),
        supabase.from('user_roles').select('user_id').eq('role', 'student'),
      ]);
      const err = mods.error || vis.error || grps.error || mbrs.error || profs.error || roles.error;
      if (err) throw err;
      const parModule = new Map((vis.data || []).map((v) => [v.module_id, v]));
      // 📡 Les changements faits hors ligne (pas encore envoyés) s'affichent déjà
      const attente = new Map(changementsEnAttente().map((c) => [c.moduleId, c]));
      const cartes: CarteAcces[] = (mods.data || []).map((m) => {
        const a = attente.get(m.id);
        const mm = a ? { ...m, ...a.carte } : m;
        return { ...mm, acces: accesDe(mm, a ? a.visibilite : parModule.get(m.id)) };
      });
      // Groupes : par numéro (Groupe 0, 1, 2…) puis les autres dans l'ordre choisi
      const groupes: GroupeAcces[] = trierGroupesParNumero(grps.data || []);
      const estEleve = new Set((roles.data || []).map((r) => r.user_id));
      const groupesDe = new Map<string, string[]>();
      for (const m of mbrs.data || []) groupesDe.set(m.user_id, [...(groupesDe.get(m.user_id) || []), m.group_id]);
      const eleves: Eleve[] = (profs.data || []).filter((p) => estEleve.has(p.user_id))
        .map((p) => ({ id: p.user_id, nom: p.full_name || p.email || 'Sans nom', groupes: groupesDe.get(p.user_id) || [] }))
        .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
      return { cartes, groupes, eleves };
    },
  });
  const d = q.data;
  const noms = useMemo(() => {
    const g = new Map((d?.groupes || []).map((x) => [x.id, x.name]));
    const e = new Map((d?.eleves || []).map((x) => [x.id, x.nom]));
    return { nomGroupe: (id: string) => g.get(id) ?? 'groupe supprimé', nomEleve: (id: string) => e.get(id) ?? 'élève parti' };
  }, [d]);
  return { ...q, cartes: d?.cartes || [], groupes: d?.groupes || [], eleves: d?.eleves || [], ...noms };
}

/** 📡 Changements gardés hors ligne : leur nombre, et envoi automatique au retour du réseau / à l'ouverture */
export function useAccesEnAttente(enabled = true) {
  const [n, setN] = useState(() => nombreEnAttente());
  useEffect(() => {
    if (!enabled) return;
    const maj = () => setN(nombreEnAttente());
    const tenter = () => { envoyerAccesEnAttente().then(maj, maj); };
    tenter();
    window.addEventListener('online', tenter);
    window.addEventListener(EVT_ATTENTE, maj);
    const t = setInterval(() => { if (nombreEnAttente()) tenter(); }, 30000);
    return () => { window.removeEventListener('online', tenter); window.removeEventListener(EVT_ATTENTE, maj); clearInterval(t); };
  }, [enabled]);
  return n;
}

/** Après un changement : tous les écrans qui montrent les cartes se mettent à jour */
export function rafraichirCartes(queryClient: { invalidateQueries: (f: { queryKey: string[] }) => unknown }) {
  for (const k of ['cartes-acces', 'learning-modules', 'admin-learning-modules', 'module-visibility', 'cartes-visibles', 'cartes-journal']) queryClient.invalidateQueries({ queryKey: [k] });
}
