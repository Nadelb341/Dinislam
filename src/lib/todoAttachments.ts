import { supabase } from '@/integrations/supabase/client';
import { compressDocument } from '@/lib/compressImage';

/** Carte « À FAIRE » : fichiers d'une ligne (stockage privé `admin-todo`, 2026-10-25) */
export type TodoAttachment = { path: string; name: string; type: string };

export const asAttachments = (v: unknown): TodoAttachment[] =>
  Array.isArray(v) ? (v as TodoAttachment[]).filter((a) => a && typeof a.path === 'string') : [];

/** Envoie un fichier dans le stockage privé (photos compressées avant l'envoi) */
export async function uploadTodoFile(taskId: string, file: File): Promise<TodoAttachment> {
  const f = await compressDocument(file);
  const safe = (f.name || 'fichier').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(-80);
  const path = `${taskId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from('admin-todo').upload(path, f, { contentType: f.type || undefined });
  if (error) throw error;
  return { path, name: file.name || safe, type: f.type || file.type || '' };
}

