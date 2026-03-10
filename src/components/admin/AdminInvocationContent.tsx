import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import ContentUploadTabs from './ContentUploadTabs';
import ContentItemCard, { ContentType } from './ContentItemCard';

const AdminInvocationContent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [deleteContentId, setDeleteContentId] = useState<string | null>(null);

  const { data: invocations = [] } = useQuery({
    queryKey: ['admin-invocations-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('invocations').select('*').order('id');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: contents = [], refetch: refetchContents } = useQuery({
    queryKey: ['admin-invocation-contents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('invocation_content').select('*').order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const uploadToStorage = useCallback(async (invocationId: number, file: File, contentType: string) => {
    if (!user?.id) { toast.error('Vous devez être connecté'); return; }
    setIsUploading(true);
    try {
      const existingCount = contents.filter(c => c.invocation_id === invocationId).length;
      const ext = file.name.split('.').pop();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `invocation-${invocationId}/${uniqueName}`;
      const { error: uploadError } = await supabase.storage.from('invocation-content').upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) { toast.error(`Erreur upload: ${uploadError.message}`); return; }
      const { data: urlData } = supabase.storage.from('invocation-content').getPublicUrl(filePath);
      const defaultTitle = contentType === 'audio' ? 'Audio' : file.name;
      const { error: insertError } = await supabase.from('invocation_content').insert({
        invocation_id: invocationId, content_type: contentType, file_url: urlData.publicUrl,
        file_name: defaultTitle, display_order: existingCount, uploaded_by: user.id,
      });
      if (insertError) { toast.error(`Erreur: ${insertError.message}`); return; }
      await refetchContents();
      toast.success('Contenu ajouté ✅');
    } catch (error) { console.error(error); }
    finally { setIsUploading(false); }
  }, [user, contents, refetchContents]);

  const handleAddYoutube = useCallback(async (invocationId: number, embedUrl: string) => {
    if (!user?.id) return;
    setIsUploading(true);
    try {
      const existingCount = contents.filter(c => c.invocation_id === invocationId).length;
      const { error } = await supabase.from('invocation_content').insert({
        invocation_id: invocationId, content_type: 'youtube', file_url: embedUrl,
        file_name: 'Vidéo YouTube', display_order: existingCount, uploaded_by: user.id,
      });
      if (error) { toast.error(error.message); return; }
      await refetchContents();
      toast.success('Lien YouTube ajouté ✅');
    } catch (error) { console.error(error); }
    finally { setIsUploading(false); }
  }, [user, contents, refetchContents]);

  const updateTitleMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from('invocation_content').update({ file_name: title }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-invocation-contents'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const content = contents.find(c => c.id === contentId);
      if (!content) return;
      if (content.content_type !== 'youtube') {
        try {
          const url = new URL(content.file_url);
          const bucketPath = url.pathname.split('/object/public/invocation-content/');
          if (bucketPath[1]) await supabase.storage.from('invocation-content').remove([decodeURIComponent(bucketPath[1])]);
        } catch (e) { console.warn(e); }
      }
      const { error } = await supabase.from('invocation_content').delete().eq('id', contentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invocation-contents'] });
      toast.success('Contenu supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const mapContentType = (type: string): ContentType => {
    if (type === 'youtube') return 'youtube';
    if (type === 'audio') return 'audio';
    return 'fichier';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">Gestion du contenu Invocations</h3>
      <p className="text-sm text-muted-foreground">Ajoutez des fichiers, vidéos YouTube ou audio pour chaque invocation.</p>
      <div className="space-y-3">
        {invocations.map((invocation) => {
          const invContents = contents.filter(c => c.invocation_id === invocation.id);
          return (
            <Card key={invocation.id}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="font-bold">{invocation.title_french}</p>
                  <p className="text-sm text-muted-foreground font-arabic">{invocation.title_arabic}</p>
                </div>
                {invContents.length > 0 && (
                  <div className="space-y-1.5">
                    {invContents.map((content) => (
                      <ContentItemCard
                        key={content.id}
                        id={content.id}
                        title={content.file_name}
                        contentType={mapContentType(content.content_type)}
                        url={content.file_url}
                        onDelete={(id) => setDeleteContentId(id)}
                        onUpdateTitle={(id, title) => updateTitleMutation.mutate({ id, title })}
                        deleteDisabled={deleteMutation.isPending}
                      />
                    ))}
                  </div>
                )}
                {invContents.length === 0 && <p className="text-xs text-muted-foreground italic">Aucun contenu</p>}
                <ContentUploadTabs
                  onUploadFile={(file) => uploadToStorage(invocation.id, file, 'fichier')}
                  onAddYoutubeLink={(url) => handleAddYoutube(invocation.id, url)}
                  onUploadAudio={(file) => uploadToStorage(invocation.id, file, 'audio')}
                  isUploading={isUploading}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
      <ConfirmDeleteDialog
        open={!!deleteContentId}
        onOpenChange={(open) => !open && setDeleteContentId(null)}
        onConfirm={() => { if (deleteContentId) deleteMutation.mutate(deleteContentId); setDeleteContentId(null); }}
        description="Ce contenu sera supprimé définitivement."
      />
    </div>
  );
};

export default AdminInvocationContent;
