import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Check, Video, FileText, Volume2, Image as ImageIcon, X, Send, Clock, Lock, XCircle, BookOpen, Hand } from 'lucide-react';
import { sendPushNotification } from '@/lib/pushHelper';
import { useIsOver20 } from '@/hooks/useIsOver20';
import { getInvocationEnrichment } from '@/data/invocationsData';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { InvocationSceneSVG } from '@/components/invocations/InvocationSceneSVG';
import AdminUnlockAllDialog from '@/components/admin/AdminUnlockAllDialog';

const getCategoryColor = (category: string | null) => {
  switch (category) {
    case 'quotidienne': return 'bg-teal-500';
    case 'lieu': return 'bg-blue-500';
    case 'événement': return 'bg-purple-500';
    case 'nature': return 'bg-green-500';
    default: return 'bg-primary';
  }
};

const getCategoryLabel = (category: string | null) => {
  switch (category) {
    case 'quotidienne': return 'Quotidienne';
    case 'lieu': return 'Lieu';
    case 'événement': return 'Événement';
    case 'nature': return 'Nature';
    default: return 'Général';
  }
};

interface InvocationDetailDialogProps {
  invocation: any;
  contents: any[];
  progress: any;
  validationRequest: any;
  onClose: () => void;
  onMarkMemorized: (invocationId: number, isMemorized: boolean) => void;
  onRequestValidation: (invocationId: number) => void;
  isRequestingValidation: boolean;
}

const getYoutubeEmbedUrl = (watchUrl: string): string | null => {
  try {
    const videoId = new URL(watchUrl).searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
};

const InvocationDetailDialog = ({ invocation, contents, progress, validationRequest, onClose, onMarkMemorized, onRequestValidation, isRequestingValidation }: InvocationDetailDialogProps) => {
  const isMemorized = progress?.is_memorized ?? false;
  const isValidated = progress?.is_validated ?? false;
  const isRefused = validationRequest?.status === 'refused';
  const enrichment = getInvocationEnrichment(invocation.title_french);
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  const embedUrl = enrichment?.videoUrl ? getYoutubeEmbedUrl(enrichment.videoUrl) : null;

  const arabicText = invocation.content_arabic || enrichment?.arabic || '';
  const frenchText = invocation.content_french || enrichment?.translation || '';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[88vh] overflow-y-auto">

          {/* En-tête */}
          <div className="px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-base text-foreground leading-snug">{invocation.title_french}</h2>
                {invocation.title_arabic && (
                  <p className="font-arabic text-lg text-right text-muted-foreground mt-1">{invocation.title_arabic}</p>
                )}
              </div>
              {invocation.category && (
                <Badge className={`${getCategoryColor(invocation.category)} text-white text-xs flex-shrink-0`}>
                  {getCategoryLabel(invocation.category)}
                </Badge>
              )}
            </div>
          </div>

          <div className="p-5 space-y-4 pb-8">

            {/* Vidéo YouTube d'apprentissage */}
            {embedUrl && (
              <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
                <div className="bg-teal-700 px-3 py-1.5 flex items-center gap-2">
                  <Video className="h-3.5 w-3.5 text-white/80 flex-shrink-0" />
                  <p className="text-xs text-white/90 font-medium">Apprendre l'invocation</p>
                </div>
                <div className="aspect-video">
                  <iframe
                    src={embedUrl}
                    title={`Invocation — ${invocation.title_french}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Texte arabe */}
            {arabicText ? (
              <div className="rounded-2xl p-4 text-right" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
                <p className="font-arabic leading-loose text-white" style={{ fontSize: '22px', lineHeight: '2.2' }}>
                  {arabicText}
                </p>
              </div>
            ) : null}

            {/* Translittération */}
            {enrichment?.transliteration && (
              <div className="px-1">
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">
                  Prononciation
                </p>
                <p className="text-sm italic text-teal-700 dark:text-teal-300 leading-relaxed">
                  {enrichment.transliteration}
                </p>
              </div>
            )}

            {/* Traduction */}
            {frenchText ? (
              <div className="rounded-xl p-4 border" style={{ backgroundColor: '#fef9ec', borderColor: '#fde68a' }}>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Traduction</p>
                <p className="text-sm text-gray-700 leading-relaxed italic">« {frenchText} »</p>
              </div>
            ) : null}

            {/* Vertu */}
            {enrichment?.virtue && (
              <div className="rounded-xl p-4 border" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  ✨ Vertu
                </p>
                <p className="text-sm text-green-800 leading-relaxed">{enrichment.virtue}</p>
              </div>
            )}

            {/* Info complémentaire (ex: si on oublie) */}
            {enrichment?.extra && (
              <div className="rounded-xl p-4 border" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  💡 À savoir
                </p>
                <p className="text-sm text-blue-800 leading-relaxed">{enrichment.extra}</p>
              </div>
            )}

            {/* Source */}
            {enrichment?.source && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
                <BookOpen className="h-3 w-3 flex-shrink-0" />
                <span>{enrichment.source}</span>
              </p>
            )}

            {/* Médias ajoutés par l'admin */}
            {contents.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Ressources</h4>
                {contents.map((content) => (
                  <div key={content.id} className="border border-border rounded-xl overflow-hidden">
                    {content.content_type === 'video' && (
                      <div className="aspect-video">
                        <video src={content.file_url} controls preload="none" className="w-full h-full" controlsList="nodownload" />
                      </div>
                    )}
                    {content.content_type === 'image' && (
                      <img src={content.file_url} alt={content.file_name} className="w-full h-auto object-contain" loading="lazy" />
                    )}
                    {(content.content_type === 'pdf' || content.content_type === 'document') && (
                      <a href={content.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                        <FileText className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium">{content.file_name}</span>
                      </a>
                    )}
                    {content.content_type === 'audio' && (
                      <div className="p-3 flex items-center gap-3">
                        <Volume2 className="h-5 w-5 text-primary" />
                        <audio src={content.file_url} controls className="flex-1 h-8" />
                      </div>
                    )}
                    {!['video', 'image', 'pdf', 'document', 'audio'].includes(content.content_type) && (
                      <a href={content.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{content.file_name}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bouton mémorisé */}
            <Button
              className="w-full gap-2"
              variant={isMemorized ? 'outline' : 'default'}
              onClick={() => onMarkMemorized(invocation.id, !isMemorized)}
            >
              {isMemorized ? (
                <><Check className="h-4 w-4 text-green-500" /> Mémorisée ✅</>
              ) : (
                <><Hand className="h-4 w-4" /> Marquer comme mémorisée</>
              )}
            </Button>

            {/* Refusé */}
            {isRefused && !isValidated && (
              <div className="flex items-center justify-center gap-2 py-2 text-destructive font-medium text-sm">
                <XCircle className="h-5 w-5" />
                Refusée — réessayez
              </div>
            )}

            {/* Bouton validation */}
            {isValidated ? (
              <div className="flex items-center justify-center gap-2 py-2 text-green-600 dark:text-green-400 font-medium">
                <Check className="h-5 w-5" />
                Validée par l'enseignant ✅
              </div>
            ) : validationRequest?.status === 'pending' ? (
              <div className="flex items-center justify-center gap-2 py-2 text-amber-600 dark:text-amber-400 font-medium">
                <Clock className="h-5 w-5" />
                Validation en attente...
              </div>
            ) : (
              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={() => onRequestValidation(invocation.id)}
                disabled={isRequestingValidation}
              >
                <Send className="h-4 w-4" />
                Demander la validation
              </Button>
            )}
          </div>
        </div>

        <ScrollButtons
          showTop={showTop}
          showBottom={showBottom}
          onScrollTop={scrollToTop}
          onScrollBottom={scrollToBottom}
          position="absolute"
        />
      </DialogContent>
    </Dialog>
  );
};

const Invocations = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const isOver20 = useIsOver20();
  const [selectedInvocation, setSelectedInvocation] = useState<any>(null);

  const { data: invocations = [], isLoading } = useQuery({
    queryKey: ['invocations-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invocations')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: contents = [] } = useQuery({
    queryKey: ['invocation-contents-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invocation_content')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['user-invocation-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_invocation_progress')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch validation requests
  const { data: validationRequests = [] } = useQuery({
    queryKey: ['user-invocation-validation-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('invocation_validation_requests')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Realtime subscription for validation requests & progress
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('invocation-unlock-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invocation_validation_requests',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-invocation-validation-requests', user.id] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_invocation_progress',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-invocation-progress', user.id] });
        queryClient.invalidateQueries({ queryKey: ['user-progress'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const toggleMemorizedMutation = useMutation({
    mutationFn: async ({ invocationId, isMemorized }: { invocationId: number; isMemorized: boolean }) => {
      if (!user) throw new Error('Non connecté');
      const existing = progress.find((p: any) => p.invocation_id === invocationId);
      if (existing) {
        const { error } = await supabase
          .from('user_invocation_progress')
          .update({ is_memorized: isMemorized })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_invocation_progress')
          .insert({ user_id: user.id, invocation_id: invocationId, is_memorized: isMemorized });
        if (error) throw error;
      }
    },
    onSuccess: (_, { isMemorized }) => {
      queryClient.invalidateQueries({ queryKey: ['user-invocation-progress', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
      toast.success(isMemorized ? '✅ Invocation mémorisée !' : 'Marqué comme non mémorisé');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const requestValidationMutation = useMutation({
    mutationFn: async (invocationId: number) => {
      if (!user) throw new Error('Non connecté');

      if (isOver20) {
        // Auto-validation pour les +20 ans
        const existing = progress.find((p: any) => p.invocation_id === invocationId);
        if (existing) {
          const { error } = await supabase
            .from('user_invocation_progress')
            .update({ is_validated: true })
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('user_invocation_progress')
            .insert({ user_id: user.id, invocation_id: invocationId, is_memorized: true, is_validated: true });
          if (error) throw error;
        }
        return { autoValidated: true };
      }

      // Validation par l'admin pour les -20 ans
      await supabase
        .from('invocation_validation_requests')
        .delete()
        .eq('user_id', user.id)
        .eq('invocation_id', invocationId)
        .eq('status', 'refused');
      const { error } = await supabase
        .from('invocation_validation_requests')
        .insert({ user_id: user.id, invocation_id: invocationId });
      if (error) throw error;

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle();
      const { data: invoc } = await supabase.from('invocations').select('title_french').eq('id', invocationId).maybeSingle();
      const firstName = profile?.full_name?.split(' ')[0] || 'Un élève';
      const invocName = invoc?.title_french || 'une invocation';
      sendPushNotification({
        title: '📝 Nouvelle demande de validation',
        body: `${firstName} demande la validation de ${invocName}`,
        type: 'admin',
      });
      return { autoValidated: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['user-invocation-progress', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-invocation-validation-requests', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
      if (result?.autoValidated) {
        toast.success('✅ Invocation validée !');
      } else {
        toast.success('📩 Demande de validation envoyée !');
      }
    },
    onError: () => toast.error('Erreur lors de la validation'),
  });

  // Build the set of validated invocation IDs for determining unlock state
  const validatedInvocationIds = new Set(
    progress.filter((p: any) => p.is_validated).map((p: any) => p.invocation_id)
  );

  // Determine which cards are unlocked:
  // Card at index 0 is always unlocked.
  // Card at index N is unlocked if invocation at index N-1 is validated.
  const isCardUnlocked = (index: number) => {
    if (isAdmin || isOver20) return true;
    if (index === 0) return true;
    const prevInvocation = invocations[index - 1];
    if (!prevInvocation) return false;
    return validatedInvocationIds.has(prevInvocation.id);
  };

  const getCardValidationRequest = (invocationId: number) => {
    // Return the most recent relevant request
    const reqs = validationRequests.filter((r: any) => r.invocation_id === invocationId);
    const pending = reqs.find((r: any) => r.status === 'pending');
    if (pending) return pending;
    const refused = reqs.find((r: any) => r.status === 'refused');
    if (refused) return refused;
    return reqs[0] || null;
  };

  const validatedCount = progress.filter((p: any) => p.is_validated).length;

  const handleCardClick = (invocation: any, index: number) => {
    if (!isCardUnlocked(index)) {
      toast.info('🔒 Cette invocation sera débloquée après validation de l\'invocation précédente par l\'admin.');
      return;
    }
    setSelectedInvocation(invocation);
  };

  return (
    <AppLayout title="Invocations">
      <div className="p-4 space-y-4">
        {/* Header stats */}
        <div className="bg-card rounded-2xl p-4 border border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-foreground text-lg">Mes Invocations</h2>
            <p className="text-sm text-muted-foreground font-arabic">أذكاري</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{validatedCount}/{invocations.length}</p>
            <p className="text-xs text-muted-foreground">mémorisées</p>
          </div>
        </div>

        {/* Bouton admin déverrouillage en masse */}
        {isAdmin && (
          <div className="flex justify-end">
            <AdminUnlockAllDialog moduleType="invocations" />
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {invocations.map((invocation, index) => {
              const invProgress = progress.find((p: any) => p.invocation_id === invocation.id);
              const isValidated = invProgress?.is_validated ?? false;
              const unlocked = isCardUnlocked(index);
              const valReq = getCardValidationRequest(invocation.id);
              const isPending = valReq?.status === 'pending';
              const isRefused = valReq?.status === 'refused' && !isValidated;

              return (
                <button
                  key={invocation.id}
                  onClick={() => handleCardClick(invocation, index)}
                  className={`relative flex flex-col items-center justify-between bg-card border border-border rounded-2xl p-3 transition-all min-h-[110px] ${
                    unlocked
                      ? 'hover:shadow-md active:scale-95'
                      : 'opacity-50 grayscale cursor-not-allowed'
                  }`}
                >
                  {/* Number badge */}
                  <span className="absolute top-1.5 left-2 text-[10px] text-muted-foreground font-semibold">
                    #{index + 1}
                  </span>

                  {/* Top-right indicator */}
                  {!unlocked ? (
                    <span className="absolute top-1.5 right-1.5">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </span>
                  ) : isValidated ? (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  ) : isPending ? (
                    <span className="absolute top-1.5 right-1.5">
                      <Clock className="h-4 w-4 text-amber-500" />
                    </span>
                  ) : isRefused ? (
                    <span className="absolute top-1.5 right-1.5">
                      <XCircle className="h-4 w-4 text-destructive" />
                    </span>
                  ) : null}

                  {/* Scène animée */}
                  <div className="mt-3 flex-1 flex items-center justify-center">
                    {invocation.image_url ? (
                      <img src={invocation.image_url} alt={invocation.title_french} className="w-14 h-14 object-contain" />
                    ) : (
                      <div className="w-14 h-14">
                        <InvocationSceneSVG title={invocation.title_french} />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <p className="text-xs font-semibold text-foreground text-center mt-2 leading-tight">
                    {invocation.title_french}
                  </p>

                  {/* Refused label */}
                  {isRefused && unlocked && (
                    <span className="text-[9px] text-destructive font-medium mt-0.5">Refusé</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {invocations.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Hand className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Aucune invocation disponible.</p>
          </div>
        )}
      </div>

      {selectedInvocation && (
        <InvocationDetailDialog
          invocation={selectedInvocation}
          contents={contents.filter((c: any) => c.invocation_id === selectedInvocation.id)}
          progress={progress.find((p: any) => p.invocation_id === selectedInvocation.id)}
          validationRequest={getCardValidationRequest(selectedInvocation.id)}
          onClose={() => setSelectedInvocation(null)}
          onMarkMemorized={(id, mem) => toggleMemorizedMutation.mutate({ invocationId: id, isMemorized: mem })}
          onRequestValidation={(id) => requestValidationMutation.mutate(id)}
          isRequestingValidation={requestValidationMutation.isPending}
        />
      )}
    </AppLayout>
  );
};

export default Invocations;
