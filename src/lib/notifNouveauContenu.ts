import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/lib/pushHelper';
import { accesDe, elevesQuiVoient, type Eleve, type Visibilite } from '@/lib/cartesAcces';

/**
 * ✨ Nouveau contenu dans une carte (Nadia, 2026-11-18, idée 10) : une notification « ✨ Nouveau dans <carte> : … »
 * aux seuls élèves qui VOIENT la carte (même règle que l'accueil : `elevesQuiVoient` de cartesAcces).
 * Contenu ciblé à un élève → seulement lui. Un ajout groupé (plusieurs fichiers d'un coup) = UN seul appel.
 * Fire-and-forget : une erreur ici ne bloque jamais l'ajout du contenu.
 */
export async function prevenirNouveauContenu(p: {
  /** Chemin de la carte (« /nourania », « /module/vocabulaire »…) ou id du module */
  carte: { chemin: string } | { moduleId: string };
  /** Ce qui est nouveau, en clair (« Leçon 3 – une vidéo ») */
  quoi: string;
  /** Lien ouvert en touchant la notification. Envoi à tous : on garde seulement la carte (sans « ?item= »),
   *  sinon les élèves qui n'ont pas encore ouvert cet élément tomberaient sur « verrouillé ». */
  url?: string;
  /** Contenu réservé à un élève : seulement lui */
  eleveId?: string | null;
}): Promise<void> {
  try {
    const q = supabase.from('learning_modules').select('id, title, builtin_path, is_active, ouverte_du, ouverte_jusquau');
    const { data: mod } = await ('chemin' in p.carte ? q.eq('builtin_path', p.carte.chemin) : q.eq('id', p.carte.moduleId)).maybeSingle();
    const nomCarte = mod?.title || 'ton appli';
    const titre = `✨ Nouveau dans ${nomCarte}`;
    const url = p.url || mod?.builtin_path || '/';
    const body = `${p.quoi} t'attend, {prenom} !`;
    if (p.eleveId) {
      sendPushNotification({ title: titre, body, category: 'lesson', type: 'user', userId: p.eleveId, data: { url } });
      return;
    }
    if (!mod) return;
    const [{ data: vis }, { data: roles }, { data: profils }, { data: membres }] = await Promise.all([
      supabase.from('module_visibility').select('visibility_type, user_ids, group_ids').eq('module_id', mod.id).maybeSingle(),
      supabase.from('user_roles').select('user_id').eq('role', 'student'),
      supabase.from('profiles').select('user_id, full_name, is_approved'),
      supabase.from('student_group_members').select('user_id, group_id'),
    ]);
    const etudiants = new Set((roles || []).map((r) => r.user_id));
    const eleves: Eleve[] = (profils || [])
      .filter((x) => x.is_approved && etudiants.has(x.user_id))
      .map((x) => ({ id: x.user_id, nom: x.full_name || '', groupes: (membres || []).filter((m) => m.user_id === x.user_id).map((m) => m.group_id) }));
    const ids = [...elevesQuiVoient(mod, accesDe(mod, vis as Visibilite | null), eleves)];
    if (!ids.length) return;
    sendPushNotification({ title: titre, body, category: 'lesson', type: 'user', userIds: ids, data: { url: url.split('?')[0] } });
  } catch (e) {
    console.error('[Push] Nouveau contenu :', e);
  }
}
