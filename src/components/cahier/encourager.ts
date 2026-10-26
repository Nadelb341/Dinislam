import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/lib/pushHelper';
import { personalize } from '@/lib/encouragements';

/** 💌 Petits mots pour un élève qui n'a pas encore envoyé son devoir (au prénom, accordés fille/garçon) */
export const MESSAGES_ENCOURAGEMENT = [
  "💌 {prenom}, ton devoir t'attend ! Bismillah, tu vas y arriver 💪",
  '🌟 {prenom}, je compte sur toi pour ton devoir, je sais que tu en es capable !',
  "🤲 {prenom}, un petit moment aujourd'hui pour ton devoir ? Qu'Allah te facilite !",
  "💎 {prenom}, ton diamant n'attend plus que toi : envoie ton devoir et fais-le briller ✨",
  '🚀 Allez {prenom}, encore un petit effort pour ton devoir, je suis fière de toi !',
];

export function messageEncouragement(fullName: string | null | undefined, gender: string | null | undefined) {
  const modele = MESSAGES_ENCOURAGEMENT[Math.floor(Math.random() * MESSAGES_ENCOURAGEMENT.length)];
  return personalize(modele, fullName, gender);
}

/** Envoie le message dans la messagerie de l'élève + une notification */
export async function envoyerEncouragement(userId: string, message: string) {
  const { error } = await supabase.from('user_messages').insert({
    user_id: userId, message, sender_type: 'admin', message_type: 'text',
  });
  if (error) throw error;
  sendPushNotification({
    title: '✉️ {prenom}, nouveau message de ton prof', category: 'msg',
    body: message.substring(0, 100), userId, data: { url: '/?open=messages' },
  });
}
