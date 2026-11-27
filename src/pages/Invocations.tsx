import { LecteurVideo } from '@/components/video/LecteurVideo';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { untypedDb } from '@/lib/untypedDb';
import { ZonesContenu } from '@/components/shared/ZonesContenu';
import { useTitreCarte } from '@/hooks/useTitreCarte';
import { useState, useEffect, useRef } from 'react';
import { ActionsEnregistrement, BlocEnregistrer, BoutonEnregistrer } from '@/components/shared/BoutonEnregistrer';
import { AudioApercu } from '@/components/shared/AudioApercu';
import { audioExt, useAudioRecorder } from '@/hooks/useAudioRecorder';
import { logEchecAudio } from '@/lib/crashLog';
import { errorMessage } from '@/lib/utils';
import { withName } from '@/lib/encouragements';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, Video, FileText, Volume2, Image as ImageIcon, X, Send, Clock, XCircle, BookOpen, Hand, Film, Undo2 } from 'lucide-react';
import { sendPushNotification } from '@/lib/pushHelper';
import { useIsOver20, useIsOver20Ready } from '@/hooks/useIsOver20';
import { useOpenItemFromUrl, MISSING_ITEM_MESSAGE } from '@/hooks/useOpenItemFromUrl';
import { getInvocationEnrichment } from '@/data/invocationsData';
import { PastilleSource } from '@/components/shared/DegreAuthenticite';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { SafeYoutubeEmbed } from '@/components/SafeYoutubeEmbed';
import { InvocationSceneSVG } from '@/components/invocations/InvocationSceneSVG';
import InvocationTextes from '@/components/invocations/InvocationTextes';
import { BandeauNonValide } from '@/components/invocations/BandeauNonValide';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import type { Tables } from '@/integrations/supabase/types';

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
  invocation: Tables<'invocations'>;
  contents: Tables<'invocation_content'>[];
  progress: Tables<'user_invocation_progress'> | undefined;
  validationRequest: Tables<'invocation_validation_requests'> | null | undefined;
  onClose: () => void;
  onRequestValidation: (invocationId: number, audio: Blob | null) => void;
  isRequestingValidation: boolean;
  /** 🎙️ Élève de moins de 20 ans : un audio de sa récitation est obligatoire pour demander la validation (Nadia, 2026-11-18) */
  audioObligatoire: boolean;
  /** Compte admin : montre ce que voit un enfant (l'enregistreur), pour que Nadia sache où il est */
  apercuAdmin: boolean;
}

const getYoutubeEmbedUrl = (watchUrl: string): string | null => {
  try {
    const videoId = new URL(watchUrl).searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
};

const InvocationDetailDialog = ({ invocation, contents, progress, validationRequest, onClose, onRequestValidation, isRequestingValidation, audioObligatoire, apercuAdmin }: InvocationDetailDialogProps) => {
  // Enregistrement de la récitation (gardé tant que la demande n'est pas partie ; effacé quand elle change d'état)
  const rec = useAudioRecorder();
  const resetRec = rec.reset;
  useEffect(() => { resetRec(); }, [invocation.id, validationRequest?.status, resetRec]);
  const isValidated = progress?.is_validated ?? false;
  const isRefused = validationRequest?.status === 'refused';
  const enrichment = getInvocationEnrichment(invocation.title_french);
  const { askValidation, validationDialog } = useConfirmValidation();
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  // Vidéo de l'appli (canal Telegram, 2026-11-08) en priorité ; YouTube seulement pour les cartes qui n'en ont pas
  // ✏️ Vertu, « À savoir » et vidéo de départ modifiables par l'enseignante (table invocation_extras, 2026-11-21)
  const { data: extras } = useQuery({
    queryKey: ['invocation-extras', invocation.id],
    queryFn: async () => {
      const { data, error } = await untypedDb.from('invocation_extras').select('vertu, a_savoir, masquer_video').eq('invocation_id', invocation.id).maybeSingle();
      if (error) throw error;
      return data as { vertu: string | null; a_savoir: string | null; masquer_video: boolean } | null;
    },
  });
  const [reglerExtras, setReglerExtras] = useState(false);
  const videoMasquee = !!extras?.masquer_video;
  const vertu = extras?.vertu ?? enrichment?.virtue ?? '';
  const aSavoir = extras?.a_savoir ?? enrichment?.extra ?? '';
  // 🕌 27/11 : pastille du degré sous la vertu / « À savoir » de l'appli (pas quand Nadia a écrit son propre texte)
  const vertuSource = extras?.vertu ? null : enrichment?.virtueSource ?? null;
  const aSavoirSource = extras?.a_savoir ? null : enrichment?.extraSource ?? null;
  const videoAppli = videoMasquee ? null : enrichment?.video ?? null;
  const videoEntiere = videoMasquee ? null : enrichment?.videoEntiere ?? null;
  const embedUrl = !videoMasquee && !videoAppli && enrichment?.videoUrl ? getYoutubeEmbedUrl(enrichment.videoUrl) : null;
  const [voirEntiere, setVoirEntiere] = useState(false);
  const lecteurRef = useRef<HTMLDivElement>(null);
  const basculerVideo = () => {
    setVoirEntiere((v) => !v);
    lecteurRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };


  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[88vh] overflow-y-auto">

          {/* En-tête */}
          <div className="pl-5 pr-14 pt-5 pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-base text-foreground leading-snug">{invocation.title_french}</h2>
                {videoEntiere && (
                  <button
                    type="button"
                    onClick={basculerVideo}
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${voirEntiere ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                  >
                    {voirEntiere
                      ? <><Undo2 className="h-3.5 w-3.5 flex-shrink-0" /> Revenir à l'extrait</>
                      : <><Film className="h-3.5 w-3.5 flex-shrink-0" /> Vidéo entière</>}
                  </button>
                )}
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
            {/* ⚠️ Pas encore validée et pas de récitation en attente : bandeau rouge qui clignote (Nadia, 24/11) */}
            {!isValidated && validationRequest?.status !== 'pending' && !apercuAdmin && <BandeauNonValide audioObligatoire={audioObligatoire} />}

            {/* 🎙️ Envoi de la récitation / validation EN HAUT, juste sous le titre : même place que dans les sourates (Nadia, 2026-11-19) */}
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
            ) : audioObligatoire ? (
              <BlocEnregistrer titre="Envoyer ma récitation" sousTitre="Ton professeur l'écoutera pour valider l'invocation.">
                {!rec.blob ? (
                  <BoutonEnregistrer enregistrement={rec.recording} secondes={rec.seconds} onCommencer={() => void rec.start()} onArreter={rec.stop} />
                ) : (
                  <ActionsEnregistrement
                    apercu={<AudioApercu blob={rec.blob} dataUrl={rec.previewUrl} className="h-10 w-full" />}
                    onEnvoyer={() => onRequestValidation(invocation.id, rec.blob)}
                    onRefaire={rec.reset}
                    envoi={isRequestingValidation}
                    libelleEnvoyer="Envoyer ma récitation"
                  />
                )}
              </BlocEnregistrer>
            ) : (
              <div className="space-y-2">
              {apercuAdmin && (
                <div className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/60 dark:bg-orange-950/20 p-2.5 text-xs text-orange-900 dark:text-orange-200 space-y-1">
                  <p className="font-bold">👀 Ce que voit ici un élève de moins de 20 ans :</p>
                  <p>🎙️ « Enregistre ta récitation » → réécouter / refaire → « Envoyer ma récitation ». Tu l'écoutes dans bouclier › Invocations à valider.</p>
                  <p className="opacity-80">Toi et les élèves de 20 ans et plus, vous validez directement avec le bouton ci-dessous.</p>
                </div>
              )}
              <Button
                className="w-full gap-2"
                variant="outline"
                onClick={() => askValidation('Valider cette invocation ?', `« ${invocation.title_french} » sera validée.`, () => onRequestValidation(invocation.id, null))}
                disabled={isRequestingValidation}
              >
                <Send className="h-4 w-4" />
                Valider l'invocation
              </Button>
              </div>
            )}

            {/* Vidéo de l'appli (extrait ou vidéo entière) — gardée sur l'appareil après la 1re lecture */}
            {videoAppli && (
              <div ref={lecteurRef} className="rounded-2xl overflow-hidden border border-border shadow-sm">
                <div className={`${voirEntiere ? 'bg-amber-600' : 'bg-teal-700'} px-3 py-1.5 flex items-center gap-2 transition-colors`}>
                  <Video className="h-3.5 w-3.5 text-white/80 flex-shrink-0" />
                  <p className="text-xs text-white/90 font-medium">{voirEntiere ? 'Vidéo entière' : "Apprendre l'invocation"}</p>
                </div>
                <LecteurVideo
                  key={voirEntiere ? 'entiere' : 'extrait'}
                  src={voirEntiere && videoEntiere ? videoEntiere : videoAppli}
                  autoPlay={voirEntiere}
                  controlsList="nodownload"
                  className="aspect-video rounded-none"
                  videoClassName="h-full"
                />
              </div>
            )}

            {/* Vidéo YouTube d'apprentissage (cartes sans vidéo de l'appli) */}
            {embedUrl && (
              <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
                <div className="bg-teal-700 px-3 py-1.5 flex items-center gap-2">
                  <Video className="h-3.5 w-3.5 text-white/80 flex-shrink-0" />
                  <p className="text-xs text-white/90 font-medium">Apprendre l'invocation</p>
                </div>
                <div className="aspect-video">
                  <SafeYoutubeEmbed
                    embedUrl={embedUrl}
                    title={`Invocation — ${invocation.title_french}`}
                    className="w-full h-full relative overflow-hidden bg-black"
                  />
                </div>
              </div>
            )}

            {/* Textes : celui de la vidéo + « autre invocation » — modifiables / supprimables par l'enseignante */}
            <InvocationTextes invocation={invocation} enrichment={enrichment} />

            {/* ✏️ Enseignante : vertu, « À savoir » et vidéo de départ */}
            {apercuAdmin && (
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setReglerExtras(true)}>✏️ Vertu, « À savoir » et vidéo de départ</Button>
            )}
            {reglerExtras && (
              <ReglagesInvocation invocationId={invocation.id} defaut={{ vertu: enrichment?.virtue ?? '', aSavoir: enrichment?.extra ?? '', aUneVideo: !!(enrichment?.video || enrichment?.videoUrl) }}
                actuel={extras ?? null} onClose={() => setReglerExtras(false)} />
            )}

            {/* Vertu */}
            {vertu && (
              <div className="rounded-xl p-4 border" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  ✨ Vertu
                </p>
                <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">{vertu}</p>
                {vertuSource && (
                  <p className="mt-2 text-xs text-green-900/80 flex flex-wrap items-center gap-1.5">
                    <BookOpen className="h-3 w-3 flex-shrink-0" /><span className="[overflow-wrap:anywhere]">{vertuSource}</span>
                    <PastilleSource source={vertuSource} degre={enrichment?.virtueDegre} />
                  </p>
                )}
              </div>
            )}

            {/* Info complémentaire (ex: si on oublie) */}
            {aSavoir && (
              <div className="rounded-xl p-4 border" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  💡 À savoir
                </p>
                <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">{aSavoir}</p>
                {aSavoirSource && (
                  <p className="mt-2 text-xs text-blue-900/80 flex flex-wrap items-center gap-1.5">
                    <BookOpen className="h-3 w-3 flex-shrink-0" /><span className="[overflow-wrap:anywhere]">{aSavoirSource}</span>
                    <PastilleSource source={aSavoirSource} degre={enrichment?.extraDegre} />
                  </p>
                )}
              </div>
            )}

            {/* ✏️ Zones de contenu (texte, images, vidéos, PDF) — 2026-11-21 */}
            <ZonesContenu cible={`invocation:${invocation.id}`} isAdmin={apercuAdmin} libelle={invocation.title_french || 'Invocation'} />

            {/* Médias ajoutés par l'admin */}
            {contents.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Ressources</h4>
                {contents.map((content) => (
                  <div key={content.id} className="border border-border rounded-xl overflow-hidden">
                    {content.content_type === 'video' && (
                      <LecteurVideo src={content.file_url} preload="none" controlsList="nodownload" className="aspect-video" videoClassName="h-full" />
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

          </div>
        </div>

        <ScrollButtons
          showTop={showTop}
          showBottom={showBottom}
          onScrollTop={scrollToTop}
          onScrollBottom={scrollToBottom}
          position="absolute"
        />
        {validationDialog}
      </DialogContent>
    </Dialog>
  );
};

const Invocations = () => {
  const titrePage = useTitreCarte('/invocations', 'Invocations');
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const isOver20 = useIsOver20();
  const ageReady = useIsOver20Ready();
  const [selectedInvocation, setSelectedInvocation] = useState<Tables<'invocations'> | null>(null);

  const { data: invocations = [], isLoading, isFetched: invocationsFetched } = useQuery({
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

  const { data: progress = [], isFetched: progressFetched } = useQuery({
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

  const requestValidationMutation = useMutation({
    mutationFn: async ({ invocationId, audio }: { invocationId: number; audio: Blob | null }) => {
      if (!user) throw new Error('Non connecté');

      if (isOver20) {
        // Auto-validation pour les +20 ans
        const existing = progress.find((p) => p.invocation_id === invocationId);
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
      // Une seule demande en attente à la fois (pas de nouvelle notification si elle existe déjà)
      const { data: alreadyPending } = await supabase
        .from('invocation_validation_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('invocation_id', invocationId)
        .eq('status', 'pending')
        .limit(1);
      if (alreadyPending && alreadyPending.length > 0) throw new Error('Demande déjà envoyée');
      // 🎙️ Audio obligatoire (Nadia, 2026-11-18) : déposé dans l'espace privé des récitations (dossier de l'élève)
      if (!audio) throw new Error('Audio manquant');
      const chemin = `${user.id}/invocation-${invocationId}/${Date.now()}.${audioExt(audio)}`;
      const { error: upErr } = await supabase.storage.from('recitations').upload(chemin, audio, { contentType: audio.type || 'audio/mp4', upsert: false });
      if (upErr) { void logEchecAudio('envoi', upErr, `invocation ${invocationId}`); throw upErr; }
      const audioUrl = supabase.storage.from('recitations').getPublicUrl(chemin).data.publicUrl;
      const { error } = await supabase
        .from('invocation_validation_requests')
        .insert({ user_id: user.id, invocation_id: invocationId, audio_url: audioUrl });
      if (error) throw error;

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle();
      const { data: invoc } = await supabase.from('invocations').select('title_french').eq('id', invocationId).maybeSingle();
      const firstName = profile?.full_name?.split(' ')[0] || 'Un élève';
      const invocName = invoc?.title_french || 'une invocation';
      sendPushNotification({
        title: '🎙️ Nouvelle récitation d\'invocation', category: 'adm_valid',
        body: `${firstName} t'a envoyé sa récitation de ${invocName}`,
        type: 'admin',
        data: { url: '/admin?section=invocations-validations' },
      });
      return { autoValidated: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['user-invocation-progress', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-invocation-validation-requests', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
      if (result?.autoValidated) {
        toast.success(withName(user, '✅ Invocation validée, bravo {prenom} !'));
      } else {
        toast.success(withName(user, '✅ Bravo {prenom}, ta récitation est envoyée à ton professeur ! Il va l\'écouter 🎧'));
      }
    },
    onError: (err: Error) => {
      if (err.message === 'Demande déjà envoyée') toast.info('Ta demande est déjà envoyée, ton enseignant va la regarder.');
      else if (err.message === 'Audio manquant') toast.error('Enregistre d\'abord ta récitation 🎙️ : elle est obligatoire.');
      else toast.error(`${navigator.onLine ? '' : '📡 Pas de connexion Internet. '}Ta récitation n'est pas partie : ${errorMessage(err) || 'erreur inconnue'}. Ton enregistrement est gardé, réessaie.`, { duration: 12000 });
    },
  });

  // Build the set of validated invocation IDs for determining unlock state
  const validatedInvocationIds = new Set(
    progress.filter((p) => p.is_validated).map((p) => p.invocation_id)
  );

  // 🔓 Toutes les invocations sont ouvertes (Nadia, 24/11) : pas encore validée = en noir et blanc + bandeau rouge ;
  // la validation par le prof (ou l'élève de 20 ans et plus) remet la carte en couleur.

  const getCardValidationRequest = (invocationId: number) => {
    // Return the most recent relevant request
    const reqs = validationRequests.filter((r) => r.invocation_id === invocationId);
    const pending = reqs.find((r) => r.status === 'pending');
    if (pending) return pending;
    const refused = reqs.find((r) => r.status === 'refused');
    if (refused) return refused;
    return reqs[0] || null;
  };

  const validatedCount = progress.filter((p) => p.is_validated).length;

  const handleCardClick = (invocation) => setSelectedInvocation(invocation);

  // « Commencer mon travail » d'un devoir : ?item=<id de l'invocation> → l'invocation s'ouvre (une fois)
  useOpenItemFromUrl(invocationsFetched && ageReady && (!user || progressFetched), (item) => {
    const index = invocations.findIndex((inv) => String(inv.id) === item.trim());
    if (index < 0) { toast.info(MISSING_ITEM_MESSAGE); return; }
    setSelectedInvocation(invocations[index]);
  });

  return (
    <AppLayout title={titrePage}>
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
              const invProgress = progress.find((p) => p.invocation_id === invocation.id);
              const isValidated = invProgress?.is_validated ?? false;
              const valReq = getCardValidationRequest(invocation.id);
              const isPending = valReq?.status === 'pending';
              const isRefused = valReq?.status === 'refused' && !isValidated;
              const aValider = !isValidated && !isPending && !isAdmin;

              return (
                <button
                  key={invocation.id}
                  onClick={() => handleCardClick(invocation)}
                  className={`relative flex flex-col items-center justify-between border rounded-2xl p-3 transition-all min-h-[110px] hover:shadow-md active:scale-95 ${
                    isValidated || isAdmin ? 'bg-card border-border' : 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700'
                  } ${aValider ? 'pt-0' : ''}`}
                >
                  {/* ⚠️ Pas encore validée : bandeau rouge qui clignote, le toucher dit quoi faire (Nadia, 24/11) */}
                  {aValider && <span className="-mx-3 mb-1 self-stretch"><BandeauNonValide compact audioObligatoire={!isOver20} /></span>}
                  {/* Number badge */}
                  <span className={`absolute ${aValider ? 'top-8' : 'top-1.5'} left-2 text-[10px] text-muted-foreground font-semibold`}>
                    #{index + 1}
                  </span>

                  {/* Top-right indicator */}
                  {isValidated ? (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  ) : isPending ? (
                    <span className="absolute top-1.5 right-1.5">
                      <Clock className="h-4 w-4 text-amber-500" />
                    </span>
                  ) : isRefused ? (
                    <span className={`absolute ${aValider ? 'top-8' : 'top-1.5'} right-1.5`}>
                      <XCircle className="h-4 w-4 text-destructive" />
                    </span>
                  ) : null}

                  {/* Scène animée */}
                  {/* ⚫️ Noir et blanc tant que ce n'est pas validé ; la validation la remet en couleur */}
                  <div className={`mt-3 flex-1 flex items-center justify-center transition-[filter] duration-700 ${isValidated || isAdmin ? '' : 'grayscale opacity-80'}`}>
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
                  {isRefused && (
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
          invocation={invocations.find((i) => i.id === selectedInvocation.id) ?? selectedInvocation}
          contents={contents.filter((c) => c.invocation_id === selectedInvocation.id)}
          progress={progress.find((p) => p.invocation_id === selectedInvocation.id)}
          validationRequest={getCardValidationRequest(selectedInvocation.id)}
          onClose={() => setSelectedInvocation(null)}
          onRequestValidation={(id, audio) => requestValidationMutation.mutate({ invocationId: id, audio })}
          isRequestingValidation={requestValidationMutation.isPending}
          audioObligatoire={!isAdmin && !isOver20}
          apercuAdmin={isAdmin}
        />
      )}
    </AppLayout>
  );
};

export default Invocations;

/** ✏️ Réglages d'une invocation (2026-11-21) : vertu, « À savoir », vidéo de départ montrée ou non ; « ↩️ Textes de départ » */
function ReglagesInvocation({ invocationId, defaut, actuel, onClose }: {
  invocationId: number; defaut: { vertu: string; aSavoir: string; aUneVideo: boolean };
  actuel: { vertu: string | null; a_savoir: string | null; masquer_video: boolean } | null; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [vertu, setVertu] = useState(actuel?.vertu ?? defaut.vertu);
  const [aSavoir, setASavoir] = useState(actuel?.a_savoir ?? defaut.aSavoir);
  const [video, setVideo] = useState(!actuel?.masquer_video);
  const enregistrer = async (depart = false) => {
    const row = depart
      ? { invocation_id: invocationId, vertu: null, a_savoir: null, masquer_video: false, updated_at: new Date().toISOString() }
      : { invocation_id: invocationId, vertu: vertu.trim() === defaut.vertu.trim() ? null : vertu.trim(), a_savoir: aSavoir.trim() === defaut.aSavoir.trim() ? null : aSavoir.trim(), masquer_video: !video, updated_at: new Date().toISOString() };
    try {
      const r = await ecrireOuGarder({ table: 'invocation_extras', op: 'upsert', rows: [row] });
      toast.success(r === 'en_attente' ? '📡 Gardé, envoyé au retour du réseau' : depart ? '↩️ Textes de départ remis' : 'Enregistré ✅');
      void queryClient.invalidateQueries({ queryKey: ['invocation-extras', invocationId] });
      onClose();
    } catch (e) { toast.error(errorMessage(e)); }
  };
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm" level="nested">
        <DialogHeader><DialogTitle>✏️ Vertu, « À savoir » et vidéo</DialogTitle></DialogHeader>
        <label className="text-xs font-semibold">✨ Vertu (vide = cachée)</label>
        <TextareaDictee rows={3} value={vertu} onChange={(e) => setVertu(e.target.value)} />
        <label className="text-xs font-semibold">💡 À savoir (vide = caché)</label>
        <TextareaDictee rows={3} value={aSavoir} onChange={(e) => setASavoir(e.target.value)} />
        {defaut.aUneVideo && (
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={video} onChange={(e) => setVideo(e.target.checked)} /> Montrer la vidéo de départ</label>
        )}
        <p className="text-[11px] text-muted-foreground">Pour ajouter d'autres vidéos, images ou textes : « 📎 Image, vidéo, PDF… » plus bas dans la fiche.</p>
        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="ghost" onClick={() => void enregistrer(true)}>↩️ Textes de départ</Button>
          <Button onClick={() => void enregistrer()}>Enregistrer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
