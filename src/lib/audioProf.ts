import { supabase } from '@/integrations/supabase/client';
import { audioExt } from '@/hooks/useAudioRecorder';

/** Dépose un audio du professeur (consigne ou correction) dans son dossier du stockage des devoirs ; renvoie le lien */
export async function deposerAudioProf(userId: string, blob: Blob, sorte: 'consignes' | 'corrections'): Promise<string> {
  const path = `${userId}/${sorte}/${Date.now()}.${audioExt(blob)}`;
  const { error } = await supabase.storage.from('devoirs-audios').upload(path, blob, { contentType: blob.type || 'audio/mp4' });
  if (error) throw error;
  return supabase.storage.from('devoirs-audios').getPublicUrl(path).data.publicUrl;
}

