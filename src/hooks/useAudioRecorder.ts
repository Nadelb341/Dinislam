import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const pickMimeType = (): string => {
  const candidates = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
};

/**
 * Enregistrement au micro (même méthode que les récitations : mp4 sur iPhone, format lu APRÈS start(),
 * aperçu en data URL car les liens blob ne se lisent pas toujours sur iPhone).
 */
export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef('audio/mp4');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  const keep = useCallback((b: Blob) => {
    setBlob(b);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(b);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const preferred = pickMimeType();
      let mr: MediaRecorder;
      try { mr = preferred ? new MediaRecorder(stream, { mimeType: preferred }) : new MediaRecorder(stream); }
      catch { mr = new MediaRecorder(stream); }
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        keep(new Blob(chunksRef.current, { type: mimeRef.current }));
      };
      recorderRef.current = mr;
      mr.start();
      mimeRef.current = mr.mimeType || preferred || 'audio/mp4';
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Impossible d'accéder au micro");
    }
  }, [keep]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }, []);

  const reset = useCallback(() => { setBlob(null); setPreviewUrl(null); setSeconds(0); }, []);

  return { recording, seconds, blob, previewUrl, start, stop, reset, keep };
}

/** Extension de fichier selon le format enregistré */
export function audioExt(b: Blob): string {
  const t = b.type || '';
  return t.includes('mp4') || t.includes('m4a') ? 'm4a' : t.includes('mpeg') ? 'mp3' : t.includes('ogg') ? 'ogg' : 'webm';
}
