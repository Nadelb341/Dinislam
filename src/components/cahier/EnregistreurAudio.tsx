import { useEffect } from 'react';
import { Mic, Square, RotateCcw } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

/**
 * 🎙️ Petit enregistreur du professeur (2026-10-26) : consigne audio d'un devoir (idée 3) ou correction audio (idée 4).
 * Enregistrer → réécouter → recommencer. L'audio est déposé seulement quand le devoir / la correction est envoyé.
 */
export function EnregistreurAudio({ label, onChange }: { label: string; onChange: (blob: Blob | null) => void }) {
  const rec = useAudioRecorder();
  useEffect(() => { onChange(rec.blob); }, [rec.blob, onChange]);
  return (
    <div className="rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800 p-2.5 space-y-2">
      <p className="text-xs font-bold text-orange-800 dark:text-orange-200">🎙️ {label}</p>
      {!rec.blob ? (
        rec.recording
          ? <button type="button" onClick={rec.stop} className="w-full rounded-lg bg-red-600 text-white py-2 text-sm font-bold flex items-center justify-center gap-2"><Square className="h-4 w-4" /> Arrêter ({rec.seconds} s)</button>
          : <button type="button" onClick={() => void rec.start()} className="w-full rounded-lg bg-orange-500 text-white py-2 text-sm font-bold flex items-center justify-center gap-2"><Mic className="h-4 w-4" /> Enregistrer</button>
      ) : (
        <div className="flex items-center gap-2">
          {rec.previewUrl && <audio src={rec.previewUrl} controls className="flex-1 h-9 min-w-0" />}
          <button type="button" onClick={rec.reset} className="shrink-0 rounded-lg border px-2 py-1.5 text-xs font-bold flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" /> Refaire</button>
        </div>
      )}
    </div>
  );
}
