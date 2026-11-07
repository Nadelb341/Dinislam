import { supabase } from '@/integrations/supabase/client';
import { urlLisible } from '@/lib/fichiersPrives';

/**
 * Audios des exercices d'Alphabet : rangés dans l'espace « recitations » (l'élève n'écrit que dans son dossier,
 * l'enseignante dans « admin/ »). Lus avec un lien signé, comme les récitations (fiable sur iPhone).
 * 🔒 2026-11-07 : la signature passe par la lib commune `fichiersPrives` (lien d'1 h, gardé en mémoire 50 min).
 */
export async function uploadAlphabetAudio(path: string, blob: Blob): Promise<string> {
  const { error } = await supabase.storage.from('recitations').upload(path, blob, { contentType: blob.type || 'audio/mp4' });
  if (error) throw error;
  return supabase.storage.from('recitations').getPublicUrl(path).data.publicUrl;
}

export async function playableUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  return urlLisible(url);
}
