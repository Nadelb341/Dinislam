import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { trierGroupesParNumero } from '@/lib/studentGroups';
import { EVT_FILE, nbEnFile, rejouerFile } from '@/lib/fileHorsLigne';

/** 📨 Données de la carte Convocations (enseignante) — en direct, lisibles hors ligne (copie du service worker) */
export interface EleveConv {
  id: string; nom: string; groupes: string[];
  phone: string | null; parent_phone: string | null; parent_phone_nom: string | null; parent2_phone: string | null; parent2_phone_nom: string | null;
  parents: string[];
}

export function useConvocations(enabled: boolean) {
  const q = useQuery({
    queryKey: ['convocations', 'classe'],
    enabled,
    queryFn: async () => {
      const depuis = new Date(Date.now() - 60 * 86400000).toISOString();
      const [grps, mbrs, roles, profs, horaires, liens, modeles, progs, convs] = await Promise.all([
        supabase.from('student_groups').select('id, name, color, position'),
        supabase.from('student_group_members').select('user_id, group_id'),
        supabase.from('user_roles').select('user_id').eq('role', 'student'),
        supabase.from('profiles').select('user_id, full_name, email, phone, parent_phone, parent_phone_nom, parent2_phone, parent2_phone_nom').eq('is_approved', true),
        supabase.from('group_schedules').select('group_id, weekday, start_time'),
        supabase.from('parent_links').select('parent_id, child_id'),
        supabase.from('convocation_modeles').select('*').order('position').order('created_at'),
        supabase.from('convocation_programmations').select('*').order('jour').order('heure'),
        supabase.from('convocations').select('*').gte('envoye_le', depuis).order('envoye_le', { ascending: false }),
      ]);
      const err = [grps, mbrs, roles, profs, horaires, liens, modeles, progs, convs].find((r) => r.error)?.error;
      if (err) throw err;
      const estEleve = new Set((roles.data || []).map((r) => r.user_id));
      const groupesDe = new Map<string, string[]>();
      for (const m of mbrs.data || []) groupesDe.set(m.user_id, [...(groupesDe.get(m.user_id) || []), m.group_id]);
      const eleves: EleveConv[] = (profs.data || []).filter((p) => estEleve.has(p.user_id)).map((p) => ({
        id: p.user_id, nom: p.full_name || p.email || 'Élève', groupes: groupesDe.get(p.user_id) || [],
        phone: p.phone, parent_phone: p.parent_phone, parent_phone_nom: p.parent_phone_nom, parent2_phone: p.parent2_phone, parent2_phone_nom: p.parent2_phone_nom,
        parents: (liens.data || []).filter((l) => l.child_id === p.user_id).map((l) => l.parent_id),
      })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
      return {
        groupes: trierGroupesParNumero(grps.data || []), eleves, horaires: horaires.data || [],
        modeles: modeles.data || [], programmations: progs.data || [], convocations: convs.data || [],
      };
    },
  });
  return q;
}

/** 📡 Écritures faites hors ligne : nombre, et envoi au retour du réseau / à l'ouverture */
export function useFileHorsLigne(enabled = true) {
  const [n, setN] = useState(() => nbEnFile());
  useEffect(() => {
    if (!enabled) return;
    const maj = () => setN(nbEnFile());
    const tenter = () => { rejouerFile().then(maj, maj); };
    tenter();
    window.addEventListener('online', tenter);
    window.addEventListener(EVT_FILE, maj);
    const t = setInterval(() => { if (nbEnFile()) tenter(); }, 30000);
    return () => { window.removeEventListener('online', tenter); window.removeEventListener(EVT_FILE, maj); clearInterval(t); };
  }, [enabled]);
  return n;
}
