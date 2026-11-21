import { supabase } from '@/integrations/supabase/client';
import { compressDocument } from '@/lib/compressImage';

/** Type d'une zone de contenu (Particularités) ou d'une vidéo (Tout-petits) */
export type KindMedia = 'texte' | 'image' | 'video' | 'youtube' | 'pdf' | 'audio';

/** Devine le type d'un fichier choisi : image, vidéo, audio, sinon document (PDF…) */
export function kindDuFichier(f: File): KindMedia {
  const t = f.type || '';
  const ext = (f.name.split('.').pop() || '').toLowerCase();
  if (t.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'].includes(ext)) return 'image';
  if (t.startsWith('video/') || ['mp4', 'mov', 'webm', 'm4v'].includes(ext)) return 'video';
  if (t.startsWith('audio/') || ['mp3', 'm4a', 'wav', 'ogg', 'aac'].includes(ext)) return 'audio';
  return 'pdf';
}

/**
 * Envoie un fichier dans le stockage « alphabet-content » (images compressées d'abord) et renvoie son adresse publique.
 * Nom unique à chaque envoi : une vidéo gardée sur l'appareil n'est jamais remplacée en silence.
 */
export async function envoyerFichierAlphabet(file: File, dossier: string): Promise<{ url: string; kind: KindMedia; nom: string }> {
  const kind = kindDuFichier(file);
  const pret = kind === 'image' ? await compressDocument(file) : file;
  const ext = (pret.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${dossier}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('alphabet-content').upload(path, pret, { cacheControl: '31536000', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('alphabet-content').getPublicUrl(path);
  return { url: data.publicUrl, kind, nom: file.name.replace(/\.[^.]+$/, '') };
}

export const horsLigne = () => typeof navigator !== 'undefined' && navigator.onLine === false;

/**
 * ✋ Nouvel ordre après un glisser-déposer (Nadia, 2026-11-21 : dans Dinislam, SEULE l'enseignante range les cartes ;
 * les élèves voient exactement son ordre). Positions 10, 20, 30… ; hors ligne : gardé puis envoyé.
 */
export async function enregistrerOrdre(table: string, ids: string[], cle = 'id') {
  const { ecrireOuGarder } = await import('@/lib/fileHorsLigne');
  let attente = false;
  for (const [i, id] of ids.entries()) {
    const r = await ecrireOuGarder({ table, op: 'update', id, col: cle, values: { position: (i + 1) * 10 } });
    if (r === 'en_attente') attente = true;
  }
  return attente ? 'en_attente' : 'ok';
}
