import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ContentUploadTabs from './ContentUploadTabs';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { ArrowLeft, FileText, CheckCircle, Upload, X, BookOpen, Film, Music, Link } from 'lucide-react';

interface Props {
  onBack: () => void;
}

// Clé interne pour identifier la carte PDF principale du Coran
const CORAN_PDF_SECTION = 'coran-pdf-principal';
const CORAN_EXTRA_SECTION = 'coran-contenu-extra';

const AdminCoranContent = ({ onBack }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isUploadingExtra, setIsUploadingExtra] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pdfMode, setPdfMode] = useState<'upload' | 'url'>('url');
  const [pdfUrlInput, setPdfUrlInput] = useState('');

  // Récupérer l'ID du module Coran
  const { data: module } = useQuery({
    queryKey: ['coran-module'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('learning_modules')
        .select('id')
        .eq('builtin_path', '/coran')
        .maybeSingle();
      return data;
    },
  });

  // Récupérer ou créer automatiquement la carte PDF principale
  const { data: pdfCard } = useQuery({
    queryKey: ['coran-pdf-card', module?.id],
    enabled: !!module?.id,
    queryFn: async () => {
      const { data: existing } = await (supabase as any)
        .from('module_cards')
        .select('id')
        .eq('module_id', module.id)
        .eq('section', CORAN_PDF_SECTION)
        .limit(1);
      if (existing?.length) return existing[0];
      const { data: created } = await (supabase as any)
        .from('module_cards')
        .insert({ module_id: module.id, title: 'Coran PDF', section: CORAN_PDF_SECTION, display_order: 0 })
        .select('id')
        .single();
      return created;
    },
  });

  // Récupérer ou créer automatiquement la carte pour les autres contenus
  const { data: extraCard } = useQuery({
    queryKey: ['coran-extra-card', module?.id],
    enabled: !!module?.id,
    queryFn: async () => {
      const { data: existing } = await (supabase as any)
        .from('module_cards')
        .select('id')
        .eq('module_id', module.id)
        .eq('section', CORAN_EXTRA_SECTION)
        .limit(1);
      if (existing?.length) return existing[0];
      const { data: created } = await (supabase as any)
        .from('module_cards')
        .insert({ module_id: module.id, title: 'Coran Contenu Extra', section: CORAN_EXTRA_SECTION, display_order: 1 })
        .select('id')
        .single();
      return created;
    },
  });

  // PDF actuel
  const { data: pdfContent, refetch: refetchPdf } = useQuery({
    queryKey: ['coran-pdf-content', pdfCard?.id],
    enabled: !!pdfCard?.id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('module_card_content')
        .select('id, file_url, file_name')
        .eq('card_id', pdfCard.id)
        .eq('content_type', 'fichier')
        .limit(1);
      return data?.[0] || null;
    },
  });

  // Autres contenus (YouTube, audio...)
  const { data: extraContents = [], refetch: refetchExtra } = useQuery({
    queryKey: ['coran-extra-contents', extraCard?.id],
    enabled: !!extraCard?.id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('module_card_content')
        .select('id, file_url, file_name, content_type')
        .eq('card_id', extraCard.id)
        .order('display_order');
      return data || [];
    },
  });

  const uploadToStorage = async (file: File, cardId: string) => {
    const ext = file.name.split('.').pop();
    const path = `card-${cardId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('module-cards').upload(path, file, { upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('module-cards').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const removeFromStorage = async (fileUrl: string) => {
    try {
      const url = new URL(fileUrl);
      const parts = url.pathname.split('/object/public/module-cards/');
      if (parts[1]) await supabase.storage.from('module-cards').remove([decodeURIComponent(parts[1])]);
    } catch {}
  };

  // Upload PDF du Coran
  const handleUploadPdf = useCallback(async (file: File) => {
    if (!user?.id || !pdfCard?.id) return;
    setIsUploadingPdf(true);
    try {
      // Supprimer l'ancien PDF si existant
      if (pdfContent) {
        await removeFromStorage(pdfContent.file_url);
        await (supabase as any).from('module_card_content').delete().eq('id', pdfContent.id);
      }
      const publicUrl = await uploadToStorage(file, pdfCard.id);
      const { error } = await (supabase as any).from('module_card_content').insert({
        card_id: pdfCard.id, content_type: 'fichier', file_url: publicUrl,
        file_name: file.name, display_order: 0, uploaded_by: user.id,
      });
      if (error) throw error;
      await refetchPdf();
      queryClient.invalidateQueries({ queryKey: ['coran-pdf-content'] });
      toast.success('✅ PDF du Coran uploadé avec succès !');
    } catch (e: any) {
      toast.error(e.message || 'Erreur upload');
    } finally {
      setIsUploadingPdf(false);
    }
  }, [user, pdfCard, pdfContent, refetchPdf, queryClient]);

  // Enregistrer une URL externe comme PDF du Coran
  const handleSavePdfUrl = useCallback(async () => {
    const url = pdfUrlInput.trim();
    if (!url || !user?.id || !pdfCard?.id) return;
    setIsUploadingPdf(true);
    try {
      if (pdfContent) {
        await removeFromStorage(pdfContent.file_url);
        await (supabase as any).from('module_card_content').delete().eq('id', pdfContent.id);
      }
      const { error } = await (supabase as any).from('module_card_content').insert({
        card_id: pdfCard.id, content_type: 'fichier', file_url: url,
        file_name: 'Coran PDF', display_order: 0, uploaded_by: user.id,
      });
      if (error) throw error;
      setPdfUrlInput('');
      await refetchPdf();
      queryClient.invalidateQueries({ queryKey: ['coran-pdf-content'] });
      toast.success('✅ Lien PDF enregistré !');
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setIsUploadingPdf(false);
    }
  }, [pdfUrlInput, user, pdfCard, pdfContent, refetchPdf, queryClient]);

  // Supprimer le PDF
  const handleDeletePdf = useCallback(async () => {
    if (!pdfContent) return;
    try {
      await removeFromStorage(pdfContent.file_url);
      await (supabase as any).from('module_card_content').delete().eq('id', pdfContent.id);
      await refetchPdf();
      toast.success('PDF supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }, [pdfContent, refetchPdf]);

  // Upload fichier ou audio dans les contenus extra
  const handleUploadExtra = useCallback(async (file: File, type: string) => {
    if (!user?.id || !extraCard?.id) return;
    setIsUploadingExtra(true);
    try {
      const publicUrl = await uploadToStorage(file, extraCard.id);
      const { error } = await (supabase as any).from('module_card_content').insert({
        card_id: extraCard.id, content_type: type, file_url: publicUrl,
        file_name: file.name, display_order: (extraContents as any[]).length, uploaded_by: user.id,
      });
      if (error) throw error;
      await refetchExtra();
      toast.success('Contenu ajouté ✅');
    } catch (e: any) {
      toast.error(e.message || 'Erreur upload');
    } finally {
      setIsUploadingExtra(false);
    }
  }, [user, extraCard, extraContents, refetchExtra]);

  // Ajouter un lien YouTube dans les contenus extra
  const handleAddYoutube = useCallback(async (embedUrl: string) => {
    if (!user?.id || !extraCard?.id) return;
    setIsUploadingExtra(true);
    try {
      const { error } = await (supabase as any).from('module_card_content').insert({
        card_id: extraCard.id, content_type: 'youtube', file_url: embedUrl,
        file_name: 'Vidéo YouTube', display_order: (extraContents as any[]).length, uploaded_by: user.id,
      });
      if (error) throw error;
      await refetchExtra();
      toast.success('Vidéo YouTube ajoutée ✅');
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setIsUploadingExtra(false);
    }
  }, [user, extraCard, extraContents, refetchExtra]);

  // Supprimer un contenu extra
  const handleDeleteExtra = useCallback(async (id: string) => {
    const item = (extraContents as any[]).find(c => c.id === id);
    if (!item) return;
    try {
      if (item.content_type !== 'youtube') await removeFromStorage(item.file_url);
      await (supabase as any).from('module_card_content').delete().eq('id', id);
      await refetchExtra();
      toast.success('Contenu supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
    setDeleteId(null);
  }, [extraContents, refetchExtra]);

  const contentTypeIcon = (type: string) => {
    if (type === 'youtube') return <Film className="h-4 w-4 text-red-500" />;
    if (type === 'audio') return <Music className="h-4 w-4 text-purple-500" />;
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  const isReady = !!pdfCard && !!extraCard;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
      </Button>

      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-green-600" />
          Gestion — Coran
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez le PDF et les contenus affichés sur la page Coran.
        </p>
      </div>

      {/* ── Section PDF du Coran ── */}
      <div className="rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-4 space-y-3">
        <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          PDF du Coran
          <span className="text-xs font-normal text-muted-foreground">(affiché en haut de la page)</span>
        </h3>

        {pdfContent ? (
          <div className="flex items-center gap-3 bg-white dark:bg-emerald-950/40 rounded-lg p-3 border border-emerald-200 dark:border-emerald-700">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 [overflow-wrap:anywhere]">{pdfContent.file_name}</p>
              <a href={pdfContent.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                Voir le PDF ↗
              </a>
            </div>
            <Button
              variant="outline" size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
              onClick={() => setDeleteId('pdf')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className={`space-y-3 ${!isReady ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Onglets choix mode */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPdfMode('url')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pdfMode === 'url' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                <Link className="h-3.5 w-3.5" /> Lien URL
              </button>
              <button
                type="button"
                onClick={() => setPdfMode('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pdfMode === 'upload' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                <Upload className="h-3.5 w-3.5" /> Téléverser
              </button>
            </div>

            {pdfMode === 'url' ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Colle un lien public Google Drive, Dropbox ou autre hébergement PDF.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://drive.google.com/file/d/..."
                    value={pdfUrlInput}
                    onChange={e => setPdfUrlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSavePdfUrl(); } }}
                    disabled={isUploadingPdf}
                    className="flex-1 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleSavePdfUrl}
                    disabled={isUploadingPdf || !pdfUrlInput.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  >
                    {isUploadingPdf ? 'Enregistrement…' : 'Enregistrer'}
                  </Button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  type="file" accept=".pdf" className="hidden"
                  disabled={isUploadingPdf}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadPdf(f); e.target.value = ''; }}
                />
                <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-xl p-6 flex flex-col items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors">
                  <Upload className="h-8 w-8 text-emerald-500" />
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 text-center">
                    {isUploadingPdf ? 'Upload en cours…' : !isReady ? 'Chargement…' : 'Cliquer ici pour téléverser le PDF du Coran'}
                  </p>
                  <p className="text-xs text-muted-foreground">Fichier PDF uniquement — max ~50 Mo</p>
                </div>
              </label>
            )}
          </div>
        )}
      </div>

      {/* ── Autres contenus ── */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Film className="h-4 w-4 text-blue-500" />
          Autres contenus
          <span className="text-xs font-normal text-muted-foreground">(vidéos YouTube, audio...)</span>
        </h3>

        {/* Liste des contenus existants */}
        {(extraContents as any[]).length > 0 && (
          <div className="space-y-2">
            {(extraContents as any[]).map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 bg-muted/40 rounded-lg p-2.5">
                {contentTypeIcon(c.content_type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm [overflow-wrap:anywhere]">{c.file_name}</p>
                </div>
                <Button
                  variant="ghost" size="sm"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => setDeleteId(c.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upload tabs */}
        <ContentUploadTabs
          onUploadFile={file => handleUploadExtra(file, 'fichier')}
          onAddYoutubeLink={handleAddYoutube}
          onUploadAudio={file => handleUploadExtra(file, 'audio')}
          isUploading={isUploadingExtra}
          disabled={!isReady}
        />
      </div>

      {/* Confirmation suppression */}
      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={open => { if (!open) setDeleteId(null); }}
        title={deleteId === 'pdf' ? 'Supprimer le PDF du Coran ?' : 'Supprimer ce contenu ?'}
        onConfirm={() => {
          if (deleteId === 'pdf') handleDeletePdf();
          else if (deleteId) handleDeleteExtra(deleteId);
        }}
      />
    </div>
  );
};

export default AdminCoranContent;
