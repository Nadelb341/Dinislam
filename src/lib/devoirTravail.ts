import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { sendPushNotification } from '@/lib/pushHelper';
import { audioExt } from '@/hooks/useAudioRecorder';
import { deposerFichierDevoir, type PieceJointe } from '@/lib/devoirFichiers';

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

/** Nom de la carte affiché à l'élève pour un devoir qui s'allume tout seul */
const CARTE_AUTO: Record<string, string> = { nourania: 'Nourania', sourate: 'Sourates', sourates: 'Sourates', invocations: 'Invocations', invocation: 'Invocations' };

/**
 * 💎 Devoir qui s'allume TOUT SEUL avec le travail fait dans la carte (Nadia, 2026-11-18 ; même règle que
 * `devoir_travail` en base, migration 20261118220000) : Nourania / sourate / invocation avec un élément visé,
 * sauf les révisions (« Réviser… », « Revoir… ») qui se rendent toujours dans le cahier.
 * Renvoie le nom de la carte, ou null si le devoir se valide avec « ✅ Je valide mon devoir ».
 */
export function carteDevoirAuto(d: { type: string; cible_id?: string | null; titre: string }): string | null {
  if (!d.cible_id) return null;
  if (/^\s*(r[ée]viser|revoir)/i.test(d.titre)) return null;
  return CARTE_AUTO[d.type] ?? null;
}

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
export async function envoyerDevoir(opts: { devoirId: string; userId: string; userName: string; titre: string; audio?: Blob | null; photos?: File[];
  /** 📝 Devoirs libres (2026-11-26) : texte écrit et réponses aux questions */
  reponse_texte?: string | null; reponses?: string[] }) {
  const { devoirId, userId, userName, titre, audio } = opts;
  // 📷 Idée 2 (2026-11-04) : photos du travail de l'élève (compressées), dans SON dossier
  const photos: PieceJointe[] = [];
  for (const f of opts.photos ?? []) photos.push(await deposerFichierDevoir(`${userId}/rendus`, f));
  let audioUrl: string | null = null;
  if (audio) {
    const mimeType = audio.type || 'audio/webm';
    const fileName = `${userId}/${devoirId}-${Date.now()}.${audioExt(audio)}`;
    const { error: upErr } = await supabase.storage.from('devoirs-audios').upload(fileName, audio, { contentType: mimeType, upsert: true });
    if (upErr) throw upErr;
    audioUrl = supabase.storage.from('devoirs-audios').getPublicUrl(fileName).data.publicUrl;
  }
  const { data: existing } = await supabase.from('devoirs_rendus').select('id').eq('devoir_id', devoirId).eq('student_id', userId).maybeSingle();
  const row = {
    audio_url: audioUrl, photos: photos as unknown as Json, statut: 'rendu', commentaire_admin: null, rendu_at: new Date().toISOString(),
    // Seulement pour un devoir libre : les autres devoirs n'écrivent pas ces colonnes
    ...(opts.reponse_texte !== undefined || opts.reponses !== undefined ? { reponse_texte: opts.reponse_texte?.trim() || null, reponses: (opts.reponses ?? []) as unknown as Json } : {}),
  };
  const { error } = existing
    ? await supabase.from('devoirs_rendus').update(row).eq('id', existing.id)
    : await supabase.from('devoirs_rendus').insert({ ...row, devoir_id: devoirId, student_id: userId });
  if (error) throw error;
  const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
  const adminIds = (admins || []).map((a) => a.user_id);
  if (adminIds.length) {
    sendPushNotification({
      userIds: adminIds, title: audio ? '🎙️ Devoir à valider (avec audio)' : photos.length ? '📷 Devoir à valider (avec photo)' : opts.reponse_texte?.trim() || opts.reponses?.length ? '✏️ Devoir à valider (texte écrit)' : '📚 Devoir à valider', category: 'adm_hw',
      body: `${userName || 'Un élève'} a validé : ${titre}`, data: { url: '/?open=todo&cahier=1' },
    });
  }
}
