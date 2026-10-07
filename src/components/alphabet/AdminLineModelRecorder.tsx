import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Mic, Square, Upload, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAudioRecorder, audioExt } from '@/hooks/useAudioRecorder';
import { moveToTrash } from '@/lib/trash';
import { errorMessage } from '@/lib/utils';

interface Props {
  letterId: number;
  letterName: string;
  lineKey: 'formes' | 'courtes' | 'longues' | 'tanouines' | 'soukoune' | 'chadda' | 'mot';
  lineTitle: string;
  currentUrl: string | null;
}

/** Admin : enregistrer (ou importer) son modèle « écoute ton prof et répète » pour une ligne. L'ancien va à la corbeille. */
export function AdminLineModelRecorder({ letterId, letterName, lineKey, lineTitle, currentUrl }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const rec = useAudioRecorder();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!rec.blob || !user) return;
    setSaving(true);
    try {
      const path = `lignes/${letterId}-${lineKey}-${Date.now()}.${audioExt(rec.blob)}`;
      const { error: upErr } = await supabase.storage.from('alphabet-content').upload(path, rec.blob, { contentType: rec.blob.type || 'audio/mp4' });
      if (upErr) throw upErr;
      const url = supabase.storage.from('alphabet-content').getPublicUrl(path).data.publicUrl;
      if (currentUrl) {
        const ok = await moveToTrash(user.id, 'alphabet_line_model', `${letterId}-${lineKey}`,
          `Modèle « ${lineTitle} » de la lettre ${letterName}`, { letter_id: letterId, line_key: lineKey, audio_url: currentUrl });
        if (!ok) throw new Error("L'ancien modèle n'a pas pu être mis dans la corbeille, rien n'a été changé");
      }
      const { error } = await supabase.from('alphabet_line_models')
        .upsert({ letter_id: letterId, line_key: lineKey, audio_url: url, updated_at: new Date().toISOString() }, { onConflict: 'letter_id,line_key' });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['alphabet-line-models'] });
      rec.reset(); setOpen(false);
      toast.success(currentUrl ? 'Modèle remplacé (l\'ancien est dans la corbeille)' : 'Modèle ajouté ✓');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-primary">
        🎙️ {currentUrl ? 'Changer mon modèle' : 'Enregistrer mon modèle'} (visible par toi seule)
      </button>
    );
  }
  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-card p-2.5 space-y-2">
      <p className="text-xs font-semibold text-primary">🎙️ Ton modèle : {lineTitle}</p>
      {!rec.blob ? (
        <div className="flex flex-wrap gap-2">
          {rec.recording
            ? <Button size="sm" variant="destructive" onClick={rec.stop} className="gap-1"><Square className="h-4 w-4" /> Arrêter ({rec.seconds} s)</Button>
            : <Button size="sm" onClick={rec.start} className="gap-1"><Mic className="h-4 w-4" /> Enregistrer</Button>}
          <Button size="sm" variant="outline" disabled={rec.recording} onClick={() => fileRef.current?.click()} className="gap-1"><Upload className="h-4 w-4" /> Importer</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Fermer</Button>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) rec.keep(f); e.target.value = ''; }} />
        </div>
      ) : (
        <>
          {rec.previewUrl && <audio src={rec.previewUrl} controls className="w-full h-9" />}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={saving} onClick={() => setConfirm(true)}>{currentUrl ? 'Remplacer' : 'Enregistrer ce modèle'}</Button>
            <Button size="sm" variant="outline" disabled={saving} onClick={rec.reset} className="gap-1"><RotateCcw className="h-4 w-4" /> Recommencer</Button>
          </div>
        </>
      )}
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{currentUrl ? 'Remplacer ton modèle ?' : 'Enregistrer ce modèle ?'}</AlertDialogTitle>
            <AlertDialogDescription>
              Lettre {letterName} · {lineTitle}. {currentUrl ? "L'ancien ira dans la corbeille de Paramètres." : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={save}>Valider</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
