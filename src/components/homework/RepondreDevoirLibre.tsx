import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { useConfetti } from '@/hooks/useConfetti';
import { loadDraft, saveDraft, clearDraft } from '@/hooks/useDraftRecovery';
import { envoyerDevoir } from '@/lib/devoirTravail';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { withName } from '@/lib/encouragements';
import { errorMessage, cn } from '@/lib/utils';
import { CLE_REPONSE_LIBRE, formesManquantes, LIBELLE_FORME, phraseReponse, type RegleReponse } from '@/lib/devoirsLibres';
import { BoutonEnregistrer } from '@/components/shared/BoutonEnregistrer';
import { AudioApercu } from '@/components/shared/AudioApercu';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import { AudioProf } from './AudioProf';

/**
 * 📝 L'élève répond à un devoir libre (2026-11-26) selon le modèle choisi par Nadia : texte écrit, photo(s), audio,
 * réponses aux questions. Le bouton « 📨 J'envoie mon devoir » ne s'allume que quand il ne manque rien.
 * Ce qu'il écrit est gardé sur l'appareil (brouillon) ; sans réseau, une réponse ÉCRITE part au retour du réseau
 * (photos et audio : 📡 Internet nécessaire).
 */
export function RepondreDevoirLibre({ devoir, onSent }: {
  devoir: {
    id: string; titre: string; statut: string | null; commentaire?: string | null; correction_audio_url?: string | null;
    regle: RegleReponse; questions: string[]; renduId?: string | null; reponseTexte?: string | null; reponses?: string[];
  };
  onSent?: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const rec = useAudioRecorder();
  const { askValidation, validationDialog } = useConfirmValidation();
  const { fireSuccess } = useConfetti();
  const cle = `${CLE_REPONSE_LIBRE}${devoir.id}`;
  const brouillon = loadDraft<{ texte?: string; reponses?: string[] }>(cle);
  const [texte, setTexte] = useState(brouillon?.texte ?? devoir.reponseTexte ?? '');
  const [reponses, setReponses] = useState<string[]>(() => devoir.questions.map((_, i) => brouillon?.reponses?.[i] ?? devoir.reponses?.[i] ?? ''));
  const [photos, setPhotos] = useState<File[]>([]);
  const [apercus, setApercus] = useState<string[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const veut = (f: string) => devoir.regle.formes.includes(f as never);

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setApercus(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);
  // 💾 Ce qu'il écrit reste sur l'appareil tant que ce n'est pas envoyé
  useEffect(() => {
    if (texte.trim() || reponses.some((r) => r.trim())) saveDraft(cle, { texte, reponses, titre: devoir.titre }); else clearDraft(cle);
  }, [texte, reponses, cle, devoir.titre]);

  const manque = formesManquantes(devoir.regle, { texte, nbPhotos: photos.length, audio: !!rec.blob, reponses }, devoir.questions.length);

  const envoyer = async () => {
    if (!user) return;
    setEnvoi(true);
    const reponsesEnvoyees = devoir.questions.length ? reponses.map((r) => r.trim()) : [];
    const sansFichier = !photos.length && !rec.blob;
    try {
      await envoyerDevoir({ devoirId: devoir.id, userId: user.id, userName: (user.user_metadata?.full_name as string) || '', titre: devoir.titre,
        audio: rec.blob, photos, reponse_texte: veut('texte') ? texte : null, reponses: reponsesEnvoyees });
      clearDraft(cle);
      fireSuccess();
      toast.success(withName(user, '📨 Bravo {prenom}, ton devoir est envoyé à ton professeur ! Ton diamant attend sa validation 🟠'));
      rec.reset(); setPhotos([]);
      queryClient.invalidateQueries({ queryKey: ['weekly-program', user.id] });
      onSent?.();
    } catch (e) {
      // 📡 Sans réseau : une réponse seulement ÉCRITE est gardée sur l'appareil et part au retour du réseau
      const horsLigne = !navigator.onLine || /fetch|network|load failed|timeout|aborted/i.test(errorMessage(e));
      if (horsLigne && sansFichier) {
        const valeurs = { statut: 'rendu', commentaire_admin: null, rendu_at: new Date().toISOString(), audio_url: null, photos: [],
          reponse_texte: veut('texte') ? texte.trim() || null : null, reponses: reponsesEnvoyees };
        try {
          await (devoir.renduId
            ? ecrireOuGarder({ table: 'devoirs_rendus', op: 'update', id: devoir.renduId, values: valeurs })
            : ecrireOuGarder({ table: 'devoirs_rendus', op: 'insert', rows: [{ id: crypto.randomUUID(), devoir_id: devoir.id, student_id: user.id, ...valeurs }] }));
          clearDraft(cle);
          toast.info('📡 Hors connexion : ton devoir est gardé sur ton téléphone, il partira tout seul au retour d\'Internet');
          onSent?.();
        } catch (e2) { toast.error(errorMessage(e2)); }
      } else {
        toast.error(`${navigator.onLine ? '' : '📡 Il faut Internet pour envoyer une photo ou un audio. '}${errorMessage(e)}`);
      }
    } finally { setEnvoi(false); }
  };

  return (
    <div className="space-y-2">
      {devoir.statut === 'a_refaire' && (
        <p className="rounded-xl bg-red-100 dark:bg-red-950/40 px-3 py-2 text-sm font-semibold text-red-800 dark:text-red-200 [overflow-wrap:anywhere]">
          🔄 À refaire{devoir.commentaire ? ` : « ${devoir.commentaire} »` : ''}
        </p>
      )}
      {devoir.statut === 'a_refaire' && <AudioProf url={devoir.correction_audio_url} kind="correction" />}
      <p className="rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/40 px-3 py-1.5 text-sm font-bold text-fuchsia-900 dark:text-fuchsia-100">📨 {phraseReponse(devoir.regle)}</p>

      {devoir.questions.length > 0 && (
        <div className="rounded-xl border-2 border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-2.5 space-y-2">
          <p className="text-xs font-extrabold text-indigo-900 dark:text-indigo-100">❓ Réponds aux questions</p>
          {devoir.questions.map((q, i) => (
            <label key={i} className="block text-sm font-semibold [overflow-wrap:anywhere]">{i + 1}. {q}
              <TextareaDictee value={reponses[i] ?? ''} rows={2} className="mt-1 cahier-main text-base" aria-label={`Ma réponse à la question ${i + 1}`}
                onChange={(e) => setReponses((x) => x.map((y, k) => (k === i ? e.target.value : y)))} />
            </label>
          ))}
        </div>
      )}

      {veut('texte') && (
        <label className="block rounded-xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 text-xs font-extrabold text-emerald-900 dark:text-emerald-100">
          ✏️ J'écris ici{!devoir.regle.toutes && veut('photo') ? ' (ou j\'envoie une photo juste dessous)' : ''}
          <TextareaDictee value={texte} onChange={(e) => setTexte(e.target.value)} rows={4} className="mt-1 cahier-main text-base font-normal" />
        </label>
      )}

      {veut('photo') && (
        <div className="rounded-xl border-2 border-dashed border-pink-300 dark:border-pink-800 bg-pink-50/60 dark:bg-pink-950/20 p-2 space-y-2">
          <button type="button" onClick={() => photoRef.current?.click()} disabled={envoi}
            className="w-full rounded-lg bg-white dark:bg-card px-3 py-2 text-sm font-extrabold text-pink-800 dark:text-pink-200 border border-pink-200 dark:border-pink-900">
            📷 {photos.length ? 'Ajouter une autre photo' : 'Prendre une photo de mon travail'}
          </button>
          <input ref={photoRef} type="file" accept="image/*" capture="environment" multiple className="hidden"
            onChange={(e) => { const f = [...(e.target.files || [])]; if (f.length) setPhotos((p) => [...p, ...f].slice(0, 6)); e.target.value = ''; }} />
          {apercus.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {apercus.map((u, i) => (
                <span key={u} className="relative">
                  <img src={u} alt="" className="h-16 w-16 rounded-lg object-cover border" />
                  <button type="button" aria-label="Enlever cette photo" onClick={() => setPhotos((p) => p.filter((_, k) => k !== i))}
                    className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-[#EF4444] text-white text-[11px] font-extrabold grid place-items-center">✕</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {veut('audio') && (
        <div className="rounded-xl border-2 border-emerald-500 p-2.5 space-y-2">
          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">🎙️ Je m'enregistre</p>
          {!rec.blob
            ? <BoutonEnregistrer enregistrement={rec.recording} secondes={rec.seconds} onCommencer={() => void rec.start()} onArreter={rec.stop} className="w-full" />
            : (
              <div className="flex items-center gap-2">
                <AudioApercu blob={rec.blob} dataUrl={rec.previewUrl} className="flex-1 min-w-0 h-10" />
                <button type="button" onClick={rec.reset} className="shrink-0 rounded-lg border px-2 py-1.5 text-xs font-bold">🔁 Refaire</button>
              </div>
            )}
        </div>
      )}

      {manque.length > 0 && (
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 [overflow-wrap:anywhere]">
          Encore {devoir.regle.toutes ? '' : 'une de ces choses '}: {manque.map((f) => LIBELLE_FORME[f]).join(devoir.regle.toutes ? ', ' : ' ou ')}
        </p>
      )}
      <button type="button" disabled={envoi || manque.length > 0}
        onClick={() => askValidation('Envoyer ton devoir ?', `« ${devoir.titre} » part chez ton professeur.`, () => void envoyer())}
        className={cn('w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-extrabold flex items-center justify-center gap-2 disabled:opacity-50')}>
        {envoi ? <Loader2 className="h-4 w-4 animate-spin" /> : null}📨 J'envoie mon devoir
      </button>
      {validationDialog}
    </div>
  );
}
