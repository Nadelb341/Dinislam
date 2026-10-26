import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { trashThenDelete } from '@/lib/trash';
import { compressDocument } from '@/lib/compressImage';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import ContentUploadTabs from '@/components/admin/ContentUploadTabs';
import ContentItemCard, { type ContentType } from '@/components/admin/ContentItemCard';
import { SafeYoutubeEmbed } from '@/components/SafeYoutubeEmbed';
import type { Tables } from '@/integrations/supabase/types';

type Content = Tables<'alphabet_content'>;

/** Type réel d'un fichier enregistré comme « fichier » (ancien écran du Tableau de bord) : deviné par son extension */
const kindOf = (c: Content): 'youtube' | 'audio' | 'video' | 'image' | 'pdf' => {
  if (c.content_type === 'youtube') return 'youtube';
  if (c.content_type === 'audio') return 'audio';
  if (c.content_type === 'video') return 'video';
  if (c.content_type === 'image') return 'image';
  const ext = (c.file_url.split('?')[0].split('.').pop() || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'm4a', 'wav', 'ogg'].includes(ext)) return 'audio';
  return 'pdf';
};

/** Affichage d'une ressource dans la fiche d'une lettre (élèves et professeur) */
function ResourceView({ content }: { content: Content }) {
  const kind = kindOf(content);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {kind === 'youtube' && <SafeYoutubeEmbed embedUrl={content.file_url} title={content.file_name} />}
      {kind === 'video' && <video src={content.file_url} controls className="w-full" controlsList="nodownload" />}
      {kind === 'image' && <img src={content.file_url} alt={content.file_name} className="w-full object-cover max-h-64" />}
      {kind === 'pdf' && (
        <a href={content.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 hover:bg-muted/50">
          <FileText className="h-5 w-5 text-red-500" />
          <span className="text-sm font-medium [overflow-wrap:anywhere]">{content.file_name}</span>
        </a>
      )}
      {kind === 'audio' && (
        <div className="p-3 flex items-center gap-3">
          <Volume2 className="h-5 w-5 text-primary" />
          <audio src={content.file_url} controls className="flex-1 h-8" />
        </div>
      )}
    </div>
  );
}

/**
 * 📎 Ressources d'une lettre (2026-10-27, choix de Nadia) : remplace l'ancien « Gérer le contenu » Alphabet du Tableau de bord.
 * Élèves : les ressources s'affichent. Professeur : « 📎 Ajouter une ressource » (fichier, lien YouTube, audio), renommer, retirer (corbeille).
 */
export function AlphabetLetterResources({ letterId, contents, isAdmin }: { letterId: number; contents: Content[]; isAdmin: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const mine = contents.filter((c) => c.letter_id === letterId);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['alphabet-contents-page'] });

  const insert = async (row: { content_type: string; file_url: string; file_name: string }) => {
    if (!user?.id) return;
    const { error } = await supabase.from('alphabet_content').insert({ ...row, letter_id: letterId, display_order: mine.length, uploaded_by: user.id });
    if (error) throw error;
    await refresh();
    toast.success('Ressource ajoutée ✅');
  };

  const uploadFile = async (file: File, contentType: 'fichier' | 'audio') => {
    if (!user?.id) { toast.error('Vous devez être connecté'); return; }
    setUploading(true);
    try {
      const compressed = await compressDocument(file);
      const ext = compressed.name.split('.').pop();
      const path = `letter-${letterId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from('alphabet-content').upload(path, compressed, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('alphabet-content').getPublicUrl(path);
      await insert({ content_type: contentType, file_url: data.publicUrl, file_name: contentType === 'audio' ? 'Audio' : file.name });
    } catch (e) {
      toast.error(`Erreur : ${e instanceof Error ? e.message : String(e)}`);
    } finally { setUploading(false); }
  };

  const addYoutube = async (embedUrl: string) => {
    setUploading(true);
    try { await insert({ content_type: 'youtube', file_url: embedUrl, file_name: 'Vidéo YouTube' }); }
    catch (e) { toast.error(`Erreur : ${e instanceof Error ? e.message : String(e)}`); }
    finally { setUploading(false); }
  };

  const rename = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from('alphabet_content').update({ file_name: title }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const content = mine.find((c) => c.id === id);
      if (!content || !user?.id) throw new Error('Ressource introuvable');
      // Corbeille d'abord ; le fichier reste stocké pour pouvoir le restaurer
      await trashThenDelete({ userId: user.id, type: 'alphabet_content', id, label: content.file_name || 'Ressource alphabet', data: content,
        remove: () => supabase.from('alphabet_content').delete().eq('id', id) });
    },
    onSuccess: () => { refresh(); toast.success('Ressource mise dans la corbeille'); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const mapType = (c: Content): ContentType => (c.content_type === 'youtube' ? 'youtube' : c.content_type === 'audio' ? 'audio' : 'fichier');

  if (!isAdmin && mine.length === 0) return null;

  return (
    <div className="space-y-3">
      {mine.length > 0 && <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ressources</h4>}
      {!isAdmin && mine.map((c) => <ResourceView key={c.id} content={c} />)}
      {isAdmin && mine.map((c) => (
        <div key={c.id} className="space-y-1.5">
          <ResourceView content={c} />
          <ContentItemCard id={c.id} title={c.file_name} contentType={mapType(c)} url={c.file_url}
            onDelete={(id) => setToDelete(id)} onUpdateTitle={(id, title) => rename.mutate({ id, title })} deleteDisabled={remove.isPending} />
        </div>
      ))}
      {isAdmin && (
        adding ? (
          <div className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/60 dark:bg-orange-950/20 dark:border-orange-800 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <p className="flex-1 text-sm font-bold text-orange-900 dark:text-orange-100">📎 Ajouter une ressource</p>
              <button type="button" onClick={() => setAdding(false)} className="text-xs font-semibold text-muted-foreground">Fermer</button>
            </div>
            <ContentUploadTabs
              onUploadFile={(file) => uploadFile(file, 'fichier')}
              onAddYoutubeLink={(url) => addYoutube(url)}
              onUploadAudio={(file) => uploadFile(file, 'audio')}
              isUploading={uploading}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)}
            className="w-full rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-800 px-3 py-2.5 text-sm font-bold text-orange-800 dark:text-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/30">
            📎 Ajouter une ressource
          </button>
        )
      )}
      <ConfirmDeleteDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        onConfirm={() => { if (toDelete) remove.mutate(toDelete); setToDelete(null); }}
        description="Cette ressource ira dans la corbeille (Paramètres), d'où tu pourras la restaurer."
      />
    </div>
  );
}
