import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/lib/pushHelper';
import { audioExt } from '@/hooks/useAudioRecorder';

/**
 * 📚 Parcours d'un devoir (demande de Nadia, 2026-10-26) :
 * « ▶️ Commencer mon travail » ouvre le bon élément de la bonne carte (cible du devoir),
 * « ✅ Je valide mon devoir » l'envoie à l'enseignante (avec un audio si elle l'a demandé) → diamant orange,
 * puis l'enseignante valide → diamant doré.
 */

/** Carte de l'appli de chaque matière (type du devoir) */
export const ROUTE_OF: Record<string, string> = {
  nourania: '/nourania', sourate: '/sourates', recitation: '/sourates', allah_names: '/allah-names',
  alphabet: '/alphabet', invocations: '/invocations', priere: '/priere', coran: '/coran',
};

/** Lien « Commencer mon travail » : la carte, l'élément visé, et le devoir (bandeau « Je valide mon devoir ») */
export function lienTravail(d: { id: string; type: string; cible_id?: string | null }): string | null {
  const route = ROUTE_OF[d.type];
  if (!route) return null;
  const q = new URLSearchParams();
  if (d.cible_id) q.set('item', d.cible_id);
  q.set('devoir', d.id);
  return `${route}?${q.toString()}`;
}

/** L'élève valide son devoir : rendu « en attente » (avec ou sans audio) + notification à l'enseignante */
export async function envoyerDevoir(opts: { devoirId: string; userId: string; userName: string; titre: string; audio?: Blob | null }) {
  const { devoirId, userId, userName, titre, audio } = opts;
  let audioUrl: string | null = null;
  if (audio) {
    const mimeType = audio.type || 'audio/webm';
    const fileName = `${userId}/${devoirId}-${Date.now()}.${audioExt(audio)}`;
    const { error: upErr } = await supabase.storage.from('devoirs-audios').upload(fileName, audio, { contentType: mimeType, upsert: true });
    if (upErr) throw upErr;
    audioUrl = supabase.storage.from('devoirs-audios').getPublicUrl(fileName).data.publicUrl;
  }
  const { data: existing } = await supabase.from('devoirs_rendus').select('id').eq('devoir_id', devoirId).eq('student_id', userId).maybeSingle();
  const row = { audio_url: audioUrl, statut: 'rendu', commentaire_admin: null, rendu_at: new Date().toISOString() };
  const { error } = existing
    ? await supabase.from('devoirs_rendus').update(row).eq('id', existing.id)
    : await supabase.from('devoirs_rendus').insert({ ...row, devoir_id: devoirId, student_id: userId });
  if (error) throw error;
  const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
  const adminIds = (admins || []).map((a) => a.user_id);
  if (adminIds.length) {
    sendPushNotification({
      userIds: adminIds, title: audio ? '🎙️ Devoir à valider (avec audio)' : '📚 Devoir à valider', category: 'adm_hw',
      body: `${userName || 'Un élève'} a validé : ${titre}`, data: { url: '/?admin=cahier-texte' },
    });
  }
}
