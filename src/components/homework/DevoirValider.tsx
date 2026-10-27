import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mic, Square, RotateCcw, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { useConfetti } from '@/hooks/useConfetti';
import { envoyerDevoir, lienTravail } from '@/lib/devoirTravail';
import { withName } from '@/lib/encouragements';
import { errorMessage, cn } from '@/lib/utils';
import { AudioProf } from './AudioProf';
import { AudioApercu } from '@/components/shared/AudioApercu';

export interface DevoirAValider {
  id: string; titre: string; type: string;
  cible_id?: string | null; audio_requis?: boolean;
  /** null = pas encore envoyé ; 'rendu' = en attente ; 'corrige' = validé ; 'a_refaire' = à refaire */
  statut: string | null;
  commentaire?: string | null;
  /** 🎧 Correction audio du professeur (devoirs_rendus.correction_audio_url) */
  correction_audio_url?: string | null;
}

/**
 * Boutons d'un devoir côté élève (2026-10-26) : « ▶️ Commencer mon travail » (ouvre le bon élément)
 * puis « ✅ Je valide mon devoir » (avec un audio si l'enseignante l'a demandé). Ils réapparaissent pour chaque nouveau devoir.
 * `dansLaCarte` : affiché dans la leçon elle-même (pas de bouton « Commencer », on y est déjà).
 */
export function DevoirValider({ devoir, dansLaCarte = false, onSent }: { devoir: DevoirAValider; dansLaCarte?: boolean; onSent?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const rec = useAudioRecorder();
  const { askValidation, validationDialog } = useConfirmValidation();
  const { fireSuccess } = useConfetti();
  const [sending, setSending] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const lien = lienTravail(devoir);

  const envoyer = async (audio: Blob | null) => {
    if (!user) return;
    setSending(true);
    try {
      await envoyerDevoir({ devoirId: devoir.id, userId: user.id, userName: (user.user_metadata?.full_name as string) || '', titre: devoir.titre, audio });
      fireSuccess();
      toast.success(withName(user, '📨 Bravo {prenom}, ton devoir est envoyé à ton professeur ! Ton diamant attend sa validation 🟠'));
      rec.reset(); setRecordOpen(false);
      queryClient.invalidateQueries({ queryKey: ['weekly-program', user.id] });
      queryClient.invalidateQueries({ queryKey: ['devoir-en-cours', devoir.id] });
      onSent?.();
    } catch (e) { toast.error(errorMessage(e)); } finally { setSending(false); }
  };

  if (devoir.statut === 'corrige') {
    return (
      <div className="space-y-2">
        <p className="rounded-xl bg-green-100 dark:bg-green-950/40 px-3 py-2 text-sm font-bold text-green-800 dark:text-green-200">✅ Devoir validé par ton professeur · ton diamant brille 💎</p>
        <AudioProf url={devoir.correction_audio_url} kind="correction" />
      </div>
    );
  }
  if (devoir.statut === 'rendu') {
    return <p className="rounded-xl bg-orange-100 dark:bg-orange-950/40 px-3 py-2 text-sm font-bold text-orange-800 dark:text-orange-200">⏳ Devoir envoyé · ton professeur va le valider (diamant orange 🟠)</p>;
  }

  return (
    <div className="space-y-2">
      {devoir.statut === 'a_refaire' && (
        <p className="rounded-xl bg-red-100 dark:bg-red-950/40 px-3 py-2 text-sm font-semibold text-red-800 dark:text-red-200">
          🔄 À refaire{devoir.commentaire ? ` : « ${devoir.commentaire} »` : ''}
        </p>
      )}
      {devoir.statut === 'a_refaire' && <AudioProf url={devoir.correction_audio_url} kind="correction" />}
      {!dansLaCarte && lien && (
        <button type="button" onClick={() => navigate(lien)}
          className="w-full rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 text-sm font-extrabold active:scale-[0.98] transition-transform">
          ▶️ Commencer mon travail
        </button>
      )}
      {devoir.audio_requis ? (
        !recordOpen ? (
          <button type="button" onClick={() => setRecordOpen(true)}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-extrabold">
            ✅ Je valide mon devoir · 🎙️ avec mon audio
          </button>
        ) : (
          <div className="rounded-xl border-2 border-emerald-500 p-2.5 space-y-2">
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">🎙️ Ton professeur demande un audio pour ce devoir</p>
            {!rec.blob ? (
              rec.recording
                ? <button type="button" onClick={rec.stop} className="w-full rounded-xl bg-red-600 text-white px-4 py-2 text-sm font-bold flex items-center justify-center gap-2"><Square className="h-4 w-4" /> Arrêter ({rec.seconds} s)</button>
                : <button type="button" onClick={() => void rec.start()} className="w-full rounded-xl bg-orange-500 text-white px-4 py-2 text-sm font-bold flex items-center justify-center gap-2"><Mic className="h-4 w-4" /> Enregistrer</button>
            ) : (
              <>
                <AudioApercu blob={rec.blob} dataUrl={rec.previewUrl} className="w-full h-9" />
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={rec.reset} disabled={sending} className="rounded-xl border px-3 py-2 text-sm font-bold flex items-center justify-center gap-1"><RotateCcw className="h-4 w-4" /> Recommencer</button>
                  <button type="button" disabled={sending} onClick={() => askValidation('Envoyer ton devoir ?', `« ${devoir.titre} » et ton audio partent chez ton professeur.`, () => void envoyer(rec.blob))}
                    className="rounded-xl bg-emerald-600 text-white px-3 py-2 text-sm font-bold flex items-center justify-center gap-1">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : '📨'} Envoyer
                  </button>
                </div>
              </>
            )}
          </div>
        )
      ) : (
        <button type="button" disabled={sending}
          onClick={() => askValidation('Tu as fini ton devoir ?', `« ${devoir.titre} » sera envoyé à ton professeur pour validation.`, () => void envoyer(null))}
          className={cn('w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-extrabold flex items-center justify-center gap-2', sending && 'opacity-60')}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}✅ Je valide mon devoir
        </button>
      )}
      {validationDialog}
    </div>
  );
}
