import { supabase } from '@/integrations/supabase/client';

/**
 * Carte « Coran » › marque-page › « Pose une question » (2026-10-25) : la question arrive dans la messagerie
 * du professeur, avec la page concernée, et une notification lui est envoyée.
 */
export async function askTeacher(userId: string, question: string, pageLabel: string, readerIndex: number) {
  const text = `❔ Question sur le Coran (${pageLabel}) :\n${question.trim()}\n📖 Page à ouvrir : /coran?page=${readerIndex}`;
  const { error } = await supabase.from('user_messages').insert({ user_id: userId, message: text, sender_type: 'user', message_type: 'text' });
  if (error) throw error;
  try {
    const [{ data: roles }, { data: me }] = await Promise.all([
      supabase.from('user_roles').select('user_id').eq('role', 'admin'),
      supabase.from('profiles').select('full_name').eq('user_id', userId).maybeSingle(),
    ]);
    const adminIds = (roles || []).map((r) => r.user_id);
    if (adminIds.length) {
      await supabase.functions.invoke('send-push-notification', {
        body: { userIds: adminIds, title: '❔ Nouvelle question', category: 'adm_msg', body: `${me?.full_name || 'Un élève'} pose une question sur le Coran (${pageLabel})`, data: { url: '/?open=messages' } },
      });
    }
  } catch (e) { console.error('Notification de la question :', e); }
}
