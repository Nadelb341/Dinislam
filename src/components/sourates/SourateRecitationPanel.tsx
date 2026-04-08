import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mic, Square, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  sourateId: string;
  dbId: string;
  user: any;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '⏳ En attente', variant: 'secondary' },
  validated: { label: '✅ Validé', variant: 'default' },
  corrected: { label: '🔄 Corrigé', variant: 'outline' },
};

export default function SourateRecitationPanel({ sourateId, dbId, user }: Props) {
  const [open, setOpen] = useState(false);
  const [recitation, setRecitation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Recording state
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRecitation = useCallback(async () => {
    if (!user?.id || !dbId) return;
    setLoading(true);
    const { data } = await supabase
      .from('sourate_recitations')
      .select('*')
      .eq('sourate_id', dbId)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    setRecitation(data?.[0] || null);
    setLoading(false);
  }, [user?.id, dbId]);

  useEffect(() => {
    if (open) fetchRecitation();
  }, [open, fetchRecitation]);

  // Cleanup preview URL
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setAudioBlob(blob);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(blob));
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      toast.error("Impossible d'accéder au microphone");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleSend = async () => {
    if (!audioBlob || !user?.id) return;
    setSending(true);
    try {
      const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const filePath = `${user.id}/${dbId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('recitations').upload(filePath, audioBlob, { upsert: false });
      if (upErr) { toast.error('Erreur upload : ' + upErr.message); return; }
      const { data: urlData } = supabase.storage.from('recitations').getPublicUrl(filePath);

      const { error: insErr } = await supabase.from('sourate_recitations').insert({
        sourate_id: dbId,
        student_id: user.id,
        audio_url: urlData.publicUrl,
        student_comment: comment || null,
        status: 'pending',
      });
      if (insErr) { toast.error('Erreur : ' + insErr.message); return; }

      toast.success('Récitation envoyée ✅');
      setAudioBlob(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setComment('');
      setShowNew(false);
      fetchRecitation();
    } catch { toast.error('Erreur inattendue'); }
    finally { setSending(false); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const statusInfo = STATUS_MAP[recitation?.status] || STATUS_MAP.pending;

  return (
    <div className="mt-3">
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-between"
        onClick={() => setOpen(o => !o)}
      >
        <span>🎙️ Ma récitation</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {open && (
        <div className="mt-2 space-y-3 p-3 bg-muted/30 rounded-lg border">
          {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}

          {/* Existing recitation */}
          {!loading && recitation && !showNew && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(recitation.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <audio src={recitation.audio_url} controls className="w-full" style={{ height: 36 }} />
              {recitation.student_comment && (
                <p className="text-sm text-muted-foreground italic">"{recitation.student_comment}"</p>
              )}

              {/* Admin response */}
              {(recitation.admin_audio_url || recitation.admin_comment) && (
                <div className="bg-primary/5 rounded-lg p-2 space-y-1 border border-primary/20">
                  <p className="text-xs font-semibold text-primary">📝 Réponse de l'enseignant</p>
                  {recitation.admin_audio_url && (
                    <audio src={recitation.admin_audio_url} controls className="w-full" style={{ height: 32 }} />
                  )}
                  {recitation.admin_comment && (
                    <p className="text-sm">{recitation.admin_comment}</p>
                  )}
                </div>
              )}

              <Button variant="outline" size="sm" className="w-full" onClick={() => setShowNew(true)}>
                🎙️ Nouvelle récitation
              </Button>
            </div>
          )}

          {/* New recitation form */}
          {!loading && (showNew || !recitation) && (
            <div className="space-y-3">
              {recitation && (
                <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>
                  ← Retour
                </Button>
              )}

              {/* Recorder */}
              <div className="flex items-center gap-2">
                {!recording ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startRecording}
                    className="gap-2"
                    disabled={sending}
                  >
                    <Mic className="h-4 w-4" /> Enregistrer
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={stopRecording}
                      className="gap-2 animate-pulse"
                    >
                      <Square className="h-3 w-3" /> Stop
                    </Button>
                    <span className="text-sm font-mono text-destructive">{formatTime(seconds)}</span>
                  </>
                )}
              </div>

              {/* Preview */}
              {previewUrl && (
                <audio src={previewUrl} controls className="w-full" style={{ height: 36 }} />
              )}

              {/* Comment */}
              <textarea
                className="w-full border rounded-lg p-2 text-sm bg-background resize-none"
                rows={2}
                placeholder="Commentaire (optionnel)…"
                value={comment}
                onChange={e => setComment(e.target.value)}
              />

              {/* Send */}
              <Button
                size="sm"
                className="w-full gap-2"
                disabled={!audioBlob || sending}
                onClick={handleSend}
              >
                <Send className="h-4 w-4" />
                {sending ? 'Envoi…' : 'Envoyer'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
