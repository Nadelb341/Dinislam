import { supabase } from '@/integrations/supabase/client';

/**
 * Audios des exercices d'Alphabet : rangés dans l'espace « recitations » (l'élève n'écrit que dans son dossier,
 * l'enseignante dans « admin/ »). Lus avec un lien signé (2 h), comme les récitations (fiable sur iPhone).
 */
export async function uploadAlphabetAudio(path: string, blob: Blob): Promise<string> {
  const { error } = await supabase.storage.from('recitations').upload(path, blob, { contentType: blob.type || 'audio/mp4' });
  if (error) throw error;
  return supabase.storage.from('recitations').getPublicUrl(path).data.publicUrl;
}

export async function playableUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/(?:public|sign)\/recitations\/(.+?)(?:\?|$)/);
  if (!m) return url;
  const { data } = await supabase.storage.from('recitations').createSignedUrl(decodeURIComponent(m[1]), 7200);
  return data?.signedUrl ?? url;
}
