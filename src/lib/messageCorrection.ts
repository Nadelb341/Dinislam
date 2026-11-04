import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/lib/pushHelper';

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
}) {
  const { studentId, quoi, lien, audioUrl, commentaire, sorte = 'corrige', notifier = true } = opts;
  const titre = sorte === 'corrige' ? `📝 Ton professeur a corrigé ${quoi}` : `🔄 Ton professeur te demande de retravailler ${quoi}`;
  const texte = [
    titre,
    commentaire?.trim() ? `💬 « ${commentaire.trim()} »` : '',
    audioUrl ? '🎧 Écoute sa correction ci-dessous, puis touche le bouton pour y aller.' : '👉 Touche le bouton pour y aller.',
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
