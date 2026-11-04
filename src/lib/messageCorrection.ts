import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/lib/pushHelper';
import { lienTravail } from '@/lib/devoirTravail';

/**
 * 📝 Demande de Nadia (2026-11-04) : chaque fois que le professeur renvoie une correction (sourate, 99 noms, Nourania,
 * Alphabet, invocation, devoir à refaire…), l'élève reçoit un MESSAGE dans l'enveloppe ✉️ de l'en-tête :
 * « 📝 Ton professeur a corrigé ta sourate Al-Masad », avec l'audio de la correction (à écouter dans le message)
 * et un bouton qui ouvre directement le bon endroit (`content` = lien dans l'appli).
 * + la notification (si l'élève les a activées : catégorie `rec`, interrupteur dans ses Paramètres).
 */
export async function envoyerMessageCorrection(opts: {
  studentId: string;
  /** ex. « ta sourate Al-Masad », « ta leçon 4 de Nourania », « ton devoir « Revoir la leçon 10 » » */
  quoi: string;
  /** lien dans l'appli (« /sourates?item=111 ») */
  lien: string;
  audioUrl?: string | null;
  commentaire?: string | null;
  /** « corrigé » (par défaut) ou « à retravailler » */
  sorte?: 'corrige' | 'retravailler';
  /** false : la notification est déjà envoyée par l'écran qui appelle (évite d'en recevoir deux) */
  notifier?: boolean;
  /** Correction d'un DEVOIR (2026-11-05) : le bouton ouvre directement l'élément du devoir (la sourate, la leçon…),
   *  comme « Commencer mon travail », au lieu du simple cahier. `lien` sert de secours si le devoir n'a pas de carte. */
  devoirId?: string | null;
}) {
  const { studentId, quoi, audioUrl, commentaire, sorte = 'corrige', notifier = true, devoirId } = opts;
  let lien = opts.lien;
  if (devoirId) {
    const { data: d } = await supabase.from('devoirs').select('id, type, cible_id').eq('id', devoirId).maybeSingle();
    const direct = d ? lienTravail(d) : null;
    if (direct) lien = direct;
  }
  const titre = sorte === 'corrige' ? `📝 Ton professeur a corrigé ${quoi}` : `🔄 Ton professeur te demande de retravailler ${quoi}`;
  const texte = [
    titre,
    commentaire?.trim() ? `💬 « ${commentaire.trim()} »` : '',
    audioUrl ? '🎧 Écoute sa correction ci-dessous, puis touche le bouton en dessous.' : '👉 Touche le bouton en dessous.',
  ].filter(Boolean).join('\n');
  const { error } = await supabase.from('user_messages').insert({
    user_id: studentId, sender_type: 'admin', message_type: 'correction', message: texte, audio_url: audioUrl ?? null, content: lien,
  });
  if (error) console.error('Message de correction :', error.message);
  if (notifier) {
    sendPushNotification({
      userId: studentId, type: 'user', category: 'rec',
      title: sorte === 'corrige' ? '📝 {prenom}, ton professeur a corrigé ton travail' : '🔄 {prenom}, un travail à retravailler',
      body: `${titre.replace(/^\S+\s/, '')}. Ouvre tes messages ✉️`,
      data: { url: '/?open=messages' },
    });
  }
  return !error;
}

/** Texte du bouton d'une correction selon l'endroit où il mène (demande de Nadia, 2026-11-05 : « Aller dans la sourate ») */
export function texteBoutonCorrection(lien: string): string {
  const route = lien.split('?')[0];
  const textes: Record<string, string> = {
    '/sourates': 'Aller dans la sourate',
    '/allah-names': "Aller dans le nom d'Allah",
    '/nourania': 'Aller dans la leçon',
    '/alphabet': 'Aller dans la lettre',
    '/invocations': "Aller dans l'invocation",
    '/priere': 'Aller dans la prière',
    '/coran': 'Aller dans le Coran',
  };
  return textes[route] ?? 'Aller dans mon devoir';
}
