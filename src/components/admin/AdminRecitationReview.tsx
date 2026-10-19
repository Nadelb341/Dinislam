import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mic, MicOff, Send, CheckCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/utils';
import { sendPushNotification } from '@/lib/pushHelper';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';

interface AdminRecitationReviewProps {
  onBack: () => void;
}

const AdminRecitationReview = ({ onBack }: AdminRecitationReviewProps) => {
  const queryClient = useQueryClient();
  const { askValidation, validationDialog } = useConfirmValidation();
  const [filter, setFilter] = useState<'pending' | 'corrected' | 'validated'>('pending');
  const [responding, setResponding] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [recording, setRecording] = useState(false);
  const [adminAudio, setAdminAudio] = useState<Blob | null>(null);
  const [adminAudioUrl, setAdminAudioUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Extrait le path Supabase Storage depuis une URL publique ou signée
  const extractStoragePath = (url: string): string | null => {
    const m = url?.match(/\/storage\/v1\/object\/(?:public|sign)\/recitations\/(.+?)(?:\?|$)/);
    return m ? decodeURIComponent(m[1]) : null;
  };

  // Génère une URL signée valide 2h (contourne cache SW, restrictions iOS, CORS)
  const toSignedUrl = async (url: string | null): Promise<string | null> => {
    if (!url) return null;
    const path = extractStoragePath(url);
    if (!path) return url;
    const { data } = await supabase.storage.from('recitations').createSignedUrl(path, 7200);
    return data?.signedUrl ?? url;
  };

  const { data: recitations, isLoading } = useQuery({
    queryKey: ['admin-recitations', filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sourate_recitations')
        .select('*')
        .eq('status', filter)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const recs = data || [];
      if (recs.length === 0) return [];

      const studentIds = [...new Set(recs.map((r) => r.student_id))];
      const sourateIds = [...new Set(recs.map((r) => r.sourate_id).filter((x): x is string => !!x))];
      const nameIds = [...new Set(recs.map((r) => r.allah_name_id).filter((x): x is number => x != null))];

      const [{ data: profiles }, { data: sourates }, { data: allahNames }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, email').in('user_id', studentIds as string[]),
        supabase.from('sourates').select('id, number, name_arabic, name_french').in('id', sourateIds as string[]),
        // Audios des 99 noms d'Allah (même circuit que les sourates, 2026-10-19)
        nameIds.length
          ? supabase.from('allah_names').select('id, name_arabic, name_french, transliteration').in('id', nameIds)
          : Promise.resolve({ data: [] as { id: number; name_arabic: string; name_french: string; transliteration: string | null }[] }),
      ]);

      // Génère des URLs signées pour tous les audios (contourne cache et restrictions iOS)
      return Promise.all(recs.map(async (r) => ({
        ...r,
        profile: profiles?.find((p) => p.user_id === r.student_id),
        sourate: sourates?.find((s) => s.id === r.sourate_id),
        allahName: allahNames?.find((n) => n.id === r.allah_name_id),
        audio_url: await toSignedUrl(r.audio_url),
        admin_audio_url: await toSignedUrl(r.admin_audio_url),
      })));
    },
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('admin-recitations-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sourate_recitations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-recitations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAdminAudio(blob);
        setAdminAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      toast.error('Impossible d\'accéder au microphone');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  type Rec = NonNullable<typeof recitations>[number];
  const sendResponse = async (rec: Rec, newStatus: 'validated' | 'corrected') => {
    const recitationId = rec.id;
    const studentId = rec.student_id;
    const isName = rec.allah_name_id != null;
    const sourateName = isName
      ? (rec.allahName?.transliteration || rec.allahName?.name_french || 'ce nom')
      : (rec.sourate?.name_french || 'ta sourate');
    // Optimistic: fermer le panneau et retirer l'item immédiatement
    const previousData = queryClient.getQueryData(['admin-recitations', filter]);
    const savedComment = adminComment;
    const savedAudio = adminAudio;
    setResponding(null);
    setAdminComment('');
    setAdminAudio(null);
    setAdminAudioUrl(null);
    queryClient.setQueryData<NonNullable<typeof recitations>>(['admin-recitations', filter], (old) =>
      (old || []).filter((r) => r.id !== recitationId)
    );

    setSaving(true);
    try {
      let audioPublicUrl: string | null = null;

      if (savedAudio) {
        const filename = `admin/${studentId}/${recitationId}-response.webm`;
        const { error: uploadError } = await supabase.storage
          .from('recitations')
          .upload(filename, savedAudio, { contentType: 'audio/webm', upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('recitations').getPublicUrl(filename);
        audioPublicUrl = publicUrl;
      }

      const { error } = await supabase
        .from('sourate_recitations')
        .update({
          status: newStatus,
          admin_comment: savedComment || null,
          admin_audio_url: audioPublicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recitationId);
      if (error) throw error;

      // Chemin unique des sourates (2026-10-19) : « Valider » = sourate validée → la suivante s'ouvre pour l'élève
      if (newStatus === 'validated' && isName) {
        // 99 noms : « Valider » = nom validé → le nom suivant s'ouvre pour l'élève
        const { error: progressError } = await supabase
          .from('user_allah_name_progress')
          .upsert({ user_id: studentId, name_id: rec.allah_name_id!, is_validated: true, validated_at: new Date().toISOString() },
            { onConflict: 'user_id,name_id' });
        if (progressError) throw progressError;
      } else if (newStatus === 'validated') {
        const { error: progressError } = await supabase
          .from('user_sourate_progress')
          .upsert({ user_id: studentId, sourate_id: rec.sourate_id, is_validated: true, progress_percentage: 100, context: 'sourates' },
            { onConflict: 'user_id,sourate_id,context' });
        if (progressError) throw progressError;
      }
      if (isName) {
        sendPushNotification(newStatus === 'validated'
          ? { title: '🌟 Bravo {prenom} !', category: 'rec', type: 'user', userId: studentId, data: { url: '/allah-names' },
              body: `Ta maîtresse a validé ton audio de ${sourateName} 🥳 N'oublie pas de le retenir par cœur avant de passer au suivant ✨` }
          : { title: '📝 {prenom}, une correction pour toi', category: 'rec', type: 'user', userId: studentId, data: { url: '/allah-names' },
              body: `Écoute la correction de ${sourateName}, puis refais ton audio 🎙️ Tu vas y arriver 💪` });
      } else sendPushNotification(newStatus === 'validated'
        ? { title: '⭐ Félicitations {prenom} !', category: 'rec', type: 'user', userId: studentId, data: { url: '/sourates' },
            body: `Ta maîtresse a validé ta récitation de ${sourateName} 🥳 La sourate suivante est ouverte ✨` }
        : { title: '📝 {prenom}, une correction pour toi', category: 'rec', type: 'user', userId: studentId, data: { url: '/sourates' },
            body: `Écoute la correction de ${sourateName}, puis refais ton audio 🎙️ Tu vas y arriver 💪` });

      toast.success(newStatus === 'validated' ? 'Récitation validée ✅' : 'Correction envoyée 📝');
      queryClient.invalidateQueries({ queryKey: ['admin-recitations'] });
    } catch (e) {
      // Rollback en cas d'erreur
      queryClient.setQueryData(['admin-recitations', filter], previousData);
      setResponding(recitationId);
      setAdminComment(savedComment);
      setAdminAudio(savedAudio);
      toast.error(errorMessage(e) || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const openResponse = (id: string) => {
    setResponding(id);
    setAdminComment('');
    setAdminAudio(null);
    setAdminAudioUrl(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </Button>
        <h2 className="text-lg font-bold">🎙️ Récitations reçues</h2>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['pending', 'corrected', 'validated'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f === 'pending' ? '⏳ En attente' : f === 'corrected' ? '📝 Corrigées' : '✅ Validées'}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="h-24 bg-muted/50" /></Card>
          ))}
        </div>
      )}

      {!isLoading && recitations?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Aucune récitation {filter === 'pending' ? 'en attente' : filter === 'corrected' ? 'corrigée' : 'validée'}</p>
        </div>
      )}

      <div className="space-y-3">
        {recitations?.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.profile?.full_name || 'Élève'}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.allahName
                        ? <>✨ Nom d'Allah : {r.allahName.transliteration || r.allahName.name_french} ({r.allahName.name_arabic})</>
                        : <>{r.sourate?.name_french} ({r.sourate?.name_arabic})</>} •{' '}
                      {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  r.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  r.status === 'validated' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {r.status === 'pending' ? 'En attente' : r.status === 'validated' ? 'Validée' : 'Corrigée'}
                </span>
              </div>

              {/* Student audio */}
              <audio src={r.audio_url} controls className="w-full" style={{ height: '36px' }} />

              {/* Student comment */}
              {r.student_comment && (
                <p className="text-xs text-muted-foreground italic bg-muted/40 rounded p-2">
                  "{r.student_comment}"
                </p>
              )}

              {/* Existing admin response */}
              {(r.admin_comment || r.admin_audio_url) && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 space-y-1 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Ma réponse précédente</p>
                  {r.admin_comment && <p className="text-xs">{r.admin_comment}</p>}
                  {r.admin_audio_url && (
                    <audio src={r.admin_audio_url} controls className="w-full" style={{ height: '32px' }} />
                  )}
                </div>
              )}

              {/* Response panel */}
              {responding === r.id ? (
                <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
                  <textarea
                    value={adminComment}
                    onChange={e => setAdminComment(e.target.value)}
                    placeholder="Votre commentaire pour l'élève..."
                    className="w-full text-sm border rounded-lg p-2 resize-none bg-background"
                    rows={2}
                  />

                  {/* Admin audio recording */}
                  <div>
                    {!adminAudio ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={recording ? stopRecording : startRecording}
                        className="gap-2"
                      >
                        {recording ? <><MicOff className="h-3 w-3" />Arrêter l'enregistrement</> : <><Mic className="h-3 w-3" />Enregistrer une réponse audio</>}
                      </Button>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Votre réponse audio :</p>
                        <audio src={adminAudioUrl!} controls className="w-full" style={{ height: '32px' }} />
                        <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => { setAdminAudio(null); setAdminAudioUrl(null); }}>
                          Supprimer
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => sendResponse(r, 'corrected')}
                      disabled={saving || (!adminComment && !adminAudio)}
                      variant="outline"
                      className="flex-1 gap-1"
                    >
                      <Send className="h-3 w-3" />
                      Envoyer correction
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => askValidation('Valider cette récitation ?', r.allahName
                        ? `${r.profile?.full_name || 'L\'élève'} : le nom ${r.allahName.transliteration || r.allahName.name_french} sera validé, et le nom suivant s'ouvrira.`
                        : `${r.profile?.full_name || 'L\'élève'} : ${r.sourate?.name_french || 'sourate'} sera validée, et la sourate suivante s'ouvrira.`, () => sendResponse(r, 'validated'))}
                      disabled={saving}
                      className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Valider
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setResponding(null)} disabled={saving}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                r.status !== 'validated' && (
                  <Button size="sm" variant="outline" onClick={() => openResponse(r.id)} className="w-full">
                    Répondre à cet élève
                  </Button>
                )
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {validationDialog}
    </div>
  );
};

export default AdminRecitationReview;
