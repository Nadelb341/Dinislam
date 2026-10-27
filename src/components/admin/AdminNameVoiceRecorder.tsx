import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Mic, Square, RotateCcw, Loader2 } from 'lucide-react';
import { useAudioRecorder, audioExt } from '@/hooks/useAudioRecorder';
import { AudioApercu } from '@/components/shared/AudioApercu';

interface Props {
  nameLabel: string;
  hasAudio: boolean;
  /** Envoie le fichier comme audio du nom (l'ancien part dans la corbeille) */
  onSave: (file: File) => Promise<void>;
}

const GOLD = 'linear-gradient(135deg, hsl(38 92% 50%), hsl(32 98% 44%))';

/** Enseignante : s'enregistrer directement au micro pour l'audio d'un nom (2026-10-24). Noir, or et blanc comme la carte. */
export function AdminNameVoiceRecorder({ nameLabel, hasAudio, onSave }: Props) {
  const rec = useAudioRecorder();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!rec.blob) return;
    setSaving(true);
    try {
      // « Ma voix » : le nom ne commence pas par « Prononciation », donc la pastille « 🎙️ ta voix » s'allume
      const file = new File([rec.blob], `Ma voix - ${nameLabel}.${audioExt(rec.blob)}`, { type: rec.blob.type || 'audio/mp4' });
      await onSave(file);
      rec.reset();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold text-white shadow-sm active:scale-[0.98] transition-transform"
        style={{ background: GOLD }}>
        🎙️ M'enregistrer
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl p-3 space-y-2" style={{ background: 'hsl(222 47% 9%)', border: '1px solid rgba(217,119,6,0.45)' }}>
      <p className="text-sm font-bold [overflow-wrap:anywhere]" style={{ color: 'hsl(38 92% 62%)' }}>🎙️ Ta voix : {nameLabel}</p>
      {!rec.blob ? (
        <div className="flex flex-wrap items-center gap-2">
          {rec.recording ? (
            <Button size="sm" variant="destructive" onClick={rec.stop} className="gap-1">
              <Square className="h-4 w-4" /> Arrêter ({rec.seconds} s)
            </Button>
          ) : (
            <Button size="sm" onClick={rec.start} className="gap-1 text-white" style={{ background: GOLD }}>
              <Mic className="h-4 w-4" /> Enregistrer
            </Button>
          )}
          {rec.recording && <span className="text-xs font-semibold animate-pulse" style={{ color: 'hsl(0 85% 65%)' }}>● En cours…</span>}
          <Button size="sm" variant="ghost" disabled={rec.recording} onClick={() => setOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10">Fermer</Button>
        </div>
      ) : (
        <>
          <AudioApercu blob={rec.blob} dataUrl={rec.previewUrl} className="w-full h-9" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={saving} onClick={() => setConfirm(true)} className="gap-1 text-white" style={{ background: GOLD }}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} ✨ {hasAudio ? 'Remplacer l\'audio' : 'Garder cet audio'}
            </Button>
            <Button size="sm" variant="outline" disabled={saving} onClick={rec.reset} className="gap-1 bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white">
              <RotateCcw className="h-4 w-4" /> Recommencer
            </Button>
          </div>
        </>
      )}
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{hasAudio ? 'Remplacer l\'audio de ce nom ?' : 'Garder cet audio ?'}</AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">
              {nameLabel}. Les élèves entendront ta voix. {hasAudio ? "L'ancien audio ira dans la corbeille de Paramètres." : ''}
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
