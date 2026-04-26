import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mic, MicOff, Send, CheckCircle, User } from 'lucide-react';
import { toast } from 'sonner';

interface AdminRecitationReviewProps {
  onBack: () => void;
}

const AdminRecitationReview = ({ onBack }: AdminRecitationReviewProps) => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'corrected' | 'validated'>('pending');
  const [responding, setResponding] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [recording, setRecording] = useState(false);
  const [adminAudio, setAdminAudio] = useState<Blob | null>(null);
  const [adminAudioUrl, setAdminAudioUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const { data: recitations, isLoading } = useQuery({
    queryKey: ['admin-recitations', filter],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sourate_recitations')
        .select('*')
        .eq('status', filter)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const recs = data || [];
      if (recs.length === 0) return [];

      const studentIds = [...new Set(recs.map((r: any) => r.student_id))];
      const sourateIds = [...new Set(recs.map((r: any) => r.sourate_id))];

      const [{ data: profiles }, { data: sourates }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, email').in('user_id', studentIds as string[]),
        supabase.from('sourates').select('id, number, name_arabic, name_french').in('id', sourateIds as string[]),
      ]);

      return recs.map((r: any) => ({
        ...r,
        profile: profiles?.find((p: any) => p.user_id === r.student_id),
        sourate: sourates?.find((s: any) => s.id === r.sourate_id),
      }));
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

  const sendResponse = async (recitationId: string, studentId: string, newStatus: 'validated' | 'corrected') => {
    // Optimistic: fermer le panneau et retirer l'item immédiatement
    const previousData = queryClient.getQueryData(['admin-recitations', filter]);
    const savedComment = adminComment;
    const savedAudio = adminAudio;
    setResponding(null);
    setAdminComment('');
    setAdminAudio(null);
    setAdminAudioUrl(null);
    queryClient.setQueryData(['admin-recitations', filter], (old: any) =>
      (old || []).filter((r: any) => r.id !== recitationId)
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

      const { error } = await (supabase as any)
        .from('sourate_recitations')
        .update({
          status: newStatus,
          admin_comment: savedComment || null,
          admin_audio_url: audioPublicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recitationId);
      if (error) throw error;

      toast.success(newStatus === 'validated' ? 'Récitation validée ✅' : 'Correction envoyée 📝');
      queryClient.invalidateQueries({ queryKey: ['admin-recitations'] });
    } catch (e: any) {
      // Rollback en cas d'erreur
      queryClient.setQueryData(['admin-recitations', filter], previousData);
      setResponding(recitationId);
      setAdminComment(savedComment);
      setAdminAudio(savedAudio);
      toast.error(e.message || 'Erreur');
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
        {recitations?.map((r: any) => (
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
                      {r.sourate?.name_french} ({r.sourate?.name_arabic}) •{' '}
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
                      onClick={() => sendResponse(r.id, r.student_id, 'corrected')}
                      disabled={saving || (!adminComment && !adminAudio)}
                      variant="outline"
                      className="flex-1 gap-1"
                    >
                      <Send className="h-3 w-3" />
                      Envoyer correction
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => sendResponse(r.id, r.student_id, 'validated')}
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
    </div>
  );
};

export default AdminRecitationReview;
