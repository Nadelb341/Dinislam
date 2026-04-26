import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Upload, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface SourateRecitationPanelProps {
  sourateId: string;
  sourateName: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  validated: { label: 'Validée ✅', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  corrected: { label: 'Corrigée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
};

const SourateRecitationPanel = ({ sourateId, sourateName }: SourateRecitationPanelProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [comment, setComment] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const extractStoragePath = (url: string): string | null => {
    const m = url?.match(/\/storage\/v1\/object\/(?:public|sign)\/recitations\/(.+?)(?:\?|$)/);
    return m ? decodeURIComponent(m[1]) : null;
  };

  const toSignedUrl = async (url: string | null): Promise<string | null> => {
    if (!url) return null;
    const path = extractStoragePath(url);
    if (!path) return url;
    const { data } = await supabase.storage.from('recitations').createSignedUrl(path, 7200);
    return data?.signedUrl ?? url;
  };

  const { data: recitations } = useQuery({
    queryKey: ['student-recitations', sourateId, user?.id],
    enabled: !!user && !!sourateId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sourate_recitations')
        .select('*')
        .eq('sourate_id', sourateId)
        .eq('student_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return Promise.all((data || []).map(async (r: any) => ({
        ...r,
        audio_url: await toSignedUrl(r.audio_url),
        admin_audio_url: await toSignedUrl(r.admin_audio_url),
      })));
    },
  });

  // Realtime updates
  useEffect(() => {
    if (!user || !sourateId) return;
    const channel = supabase
      .channel(`recitations-${sourateId}-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sourate_recitations',
        filter: `student_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['student-recitations', sourateId, user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sourateId, user, queryClient]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecorded(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      toast.error('Impossible d\'accéder au microphone');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetRecording = () => {
    setRecorded(null);
    setRecordedUrl(null);
    setSeconds(0);
    setComment('');
  };

  const uploadRecitation = async () => {
    if (!recorded || !user) return;
    setUploading(true);
    try {
      const filename = `${user.id}/${sourateId}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('recitations')
        .upload(filename, recorded, { contentType: 'audio/webm', upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('recitations').getPublicUrl(filename);

      const { error: insertError } = await (supabase as any)
        .from('sourate_recitations')
        .insert({
          sourate_id: sourateId,
          student_id: user.id,
          audio_url: publicUrl,
          student_comment: comment || null,
          status: 'pending',
        });
      if (insertError) throw insertError;

      toast.success('Récitation envoyée à l\'enseignant ✅');
      queryClient.invalidateQueries({ queryKey: ['student-recitations', sourateId, user.id] });
      resetRecording();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de l\'envoi');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        🎙️ Envoyer ma récitation
      </p>

      {/* Recorder */}
      {!recorded ? (
        <div className="flex items-center gap-3">
          {!recording ? (
            <Button
              size="sm"
              onClick={startRecording}
              className="bg-rose-500 hover:bg-rose-600 text-white gap-2"
            >
              <Mic className="h-4 w-4" />
              Commencer l'enregistrement
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono text-red-600">{formatTime(seconds)}</span>
              <Button size="sm" variant="outline" onClick={stopRecording} className="gap-2">
                <MicOff className="h-4 w-4" />
                Arrêter
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <audio src={recordedUrl!} controls className="w-full" style={{ height: '40px' }} />
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Un commentaire pour l'enseignant ? (optionnel)"
            className="w-full text-sm border rounded-lg p-2 resize-none bg-background"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={uploadRecitation}
              disabled={uploading}
              className="gap-2 flex-1"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Envoi...' : 'Envoyer à l\'enseignant'}
            </Button>
            <Button size="sm" variant="outline" onClick={resetRecording} disabled={uploading}>
              Recommencer
            </Button>
          </div>
        </div>
      )}

      {/* Past recitations */}
      {recitations && recitations.length > 0 && (
        <div className="space-y-2 mt-2 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">Mes récitations envoyées</p>
          {recitations.map((r: any) => {
            const st = STATUS_LABELS[r.status] || STATUS_LABELS.pending;
            return (
              <div key={r.id} className="bg-background rounded-lg p-3 space-y-2 border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                    {st.label}
                  </span>
                </div>
                <audio src={r.audio_url} controls className="w-full" style={{ height: '36px' }} />
                {r.student_comment && (
                  <p className="text-xs text-muted-foreground italic">"{r.student_comment}"</p>
                )}
                {/* Admin response */}
                {(r.admin_comment || r.admin_audio_url) && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 space-y-1 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Réponse de l'enseignant
                    </p>
                    {r.admin_comment && (
                      <p className="text-xs text-blue-800 dark:text-blue-200">{r.admin_comment}</p>
                    )}
                    {r.admin_audio_url && (
                      <audio src={r.admin_audio_url} controls className="w-full" style={{ height: '32px' }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SourateRecitationPanel;
