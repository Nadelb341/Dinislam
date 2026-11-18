import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/lib/pushHelper';

/**
 * 👪 Parents prévenus des nouveaux devoirs de leur enfant (Nadia, 2026-11-18, idée 16 · modèle 2).
 * Seulement les liens CONFIRMÉS. Une notification par enfant, avec SON prénom, dans la catégorie à part `par_dev`
 * (interrupteur « Nouveaux devoirs de mon enfant » dans ⚙️ Paramètres) : jamais mélangée avec les devoirs du parent.
 * Les devoirs programmés sont annoncés aux parents par la tâche serveur (process-scheduled-notifications).
 */
export async function prevenirParentsNouveauxDevoirs(eleveIds: string[], liste: string): Promise<void> {
  if (!eleveIds.length) return;
  try {
    const { data: liens } = await supabase.from('parent_links').select('parent_id, child_id').in('child_id', eleveIds).eq('confirme', true);
    if (!liens?.length) return;
    const enfants = [...new Set(liens.map((l) => l.child_id))];
    const { data: profils } = await supabase.from('profiles').select('user_id, full_name').in('user_id', enfants);
    for (const enfant of enfants) {
      const parents = [...new Set(liens.filter((l) => l.child_id === enfant && l.parent_id !== enfant).map((l) => l.parent_id))];
      if (!parents.length) continue;
      const prenom = (profils?.find((p) => p.user_id === enfant)?.full_name || 'Ton enfant').trim().split(/\s+/)[0];
      sendPushNotification({ userIds: parents, category: 'par_dev', type: 'user', title: `📓 ${prenom} : nouveaux devoirs`, body: liste, data: { url: '/?open=enfants' } });
    }
  } catch (e) {
    console.error('[Parents] notification des nouveaux devoirs non envoyée', e);
  }
}
