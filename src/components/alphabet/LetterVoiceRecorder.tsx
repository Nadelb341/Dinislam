import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Mic, Square, Upload, RotateCcw } from 'lucide-react';
import { moveToTrash } from '@/lib/trash';
import { errorMessage } from '@/lib/utils';

interface Props {
  letter: { id: number; name_french: string; letter_arabic: string; audio_url: string | null };
  /** Champ de la lettre à remplacer : voix de la lettre seule, ou lettre avec ses voyelles */
  field?: 'audio_url' | 'audio_vowels_url';
  currentUrl: string | null;
  onReplaced: (url: string) => void;
}

const pickMimeType = (): string => {
  const candidates = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
  return candidates.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
};

/** Admin : enregistrer sa voix (ou importer un fichier) pour remplacer l'audio d'une lettre. L'ancien audio va dans la corbeille. */
export function LetterVoiceRecorder({ letter, field = 'audio_url', currentUrl, onReplaced }: Props) {
  const { user } = useAuth();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recorded, setRecorded] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef('audio/mp4');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach(t => t.stop());
  }, []);

  const keepBlob = (blob: Blob) => {
    setRecorded(blob);
    // data URL : seul format lisible à coup sûr sur iPhone
    const reader = new FileReader();
    reader.onload = e => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(blob);
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const preferred = pickMimeType();
      let mr: MediaRecorder;
      try { mr = preferred ? new MediaRecorder(stream, { mimeType: preferred }) : new MediaRecorder(stream); }
      catch { mr = new MediaRecorder(stream); }
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        keepBlob(new Blob(chunksRef.current, { type: mimeRef.current }));
      };
      recorderRef.current = mr;
      mr.start();
      mimeRef.current = mr.mimeType || preferred || 'audio/mp4';
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      toast.error("Impossible d'accéder au micro");
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  const reset = () => { setRecorded(null); setPreviewUrl(null); };

  const replace = async () => {
    if (!recorded || !user) return;
    setSaving(true);
    try {
      const mime = recorded.type || 'audio/mp4';
      const ext = mime.includes('mp4') || mime.includes('m4a') ? 'm4a' : mime.includes('mpeg') ? 'mp3' : mime.includes('ogg') ? 'ogg' : 'webm';
      const path = `lettres/${field === 'audio_url' ? 'voix' : 'voyelles'}-${letter.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('alphabet-content').upload(path, recorded, { contentType: mime });
      if (upErr) throw upErr;
      const url = supabase.storage.from('alphabet-content').getPublicUrl(path).data.publicUrl;
      if (currentUrl) {
        const ok = await moveToTrash(user.id, 'alphabet_letter_audio', String(letter.id),
          `Audio ${field === 'audio_url' ? 'de la lettre' : 'avec voyelles de la lettre'} ${letter.name_french} (${letter.letter_arabic})`,
          { letter_id: letter.id, field, audio_url: currentUrl });
        if (!ok) throw new Error("L'ancien audio n'a pas pu être mis dans la corbeille, rien n'a été changé");
      }
      const { error } = await supabase.from('alphabet_letters').update({ [field]: url }).eq('id', letter.id);
      if (error) throw error;
      onReplaced(url);
      reset();
      toast.success(currentUrl ? 'Audio remplacé (l\'ancien est dans la corbeille)' : 'Audio ajouté');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
      <p className="text-xs font-semibold text-primary">
        🎙️ {field === 'audio_url' ? 'Ta voix pour cette lettre' : 'Ta voix : lettre avec ses voyelles'} (visible par toi seulement)
      </p>
      {!recorded ? (
        <div className="flex flex-wrap gap-2">
          {recording ? (
            <Button size="sm" variant="destructive" onClick={stop} className="gap-1">
              <Square className="h-4 w-4" /> Arrêter ({seconds} s)
            </Button>
          ) : (
            <Button size="sm" onClick={start} className="gap-1"><Mic className="h-4 w-4" /> Enregistrer</Button>
          )}
          <Button size="sm" variant="outline" disabled={recording} onClick={() => fileRef.current?.click()} className="gap-1">
            <Upload className="h-4 w-4" /> Importer un fichier
          </Button>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) keepBlob(f); e.target.value = ''; }} />
        </div>
      ) : (
        <div className="space-y-2">
          {previewUrl && <audio src={previewUrl} controls className="w-full h-8" />}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={saving} onClick={() => setConfirmOpen(true)}>
              {currentUrl ? 'Remplacer l\'audio' : 'Ajouter cet audio'}
            </Button>
            <Button size="sm" variant="outline" disabled={saving} onClick={reset} className="gap-1">
              <RotateCcw className="h-4 w-4" /> Recommencer
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{currentUrl ? 'Remplacer l\'audio ?' : 'Ajouter cet audio ?'}</AlertDialogTitle>
            <AlertDialogDescription>
              Lettre {letter.name_french} ({letter.letter_arabic}). {currentUrl ? 'L\'ancien audio ira dans la corbeille de Paramètres, tu pourras le restaurer.' : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={replace}>Valider</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
