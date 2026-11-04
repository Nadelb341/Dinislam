import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { deposerAudioProf } from '@/lib/audioProf';
import { deposerFichierDevoir, type PieceJointe } from '@/lib/devoirFichiers';
import { moveToTrash } from '@/lib/trash';
import { errorMessage, cn } from '@/lib/utils';
import { PiecesJointesVue } from '@/components/shared/PiecesJointesVue';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * 📎 📷 🎙️ Proposition A (choix de Nadia, 2026-11-04) : au bout de chaque ligne du formulaire de devoir,
 * des documents (plusieurs), une photo prise avec le téléphone et la consigne en audio.
 * Les fichiers sont déposés tout de suite (ils restent dans le brouillon si l'appli se ferme) ;
 * retirer un fichier ou l'audio = confirmation + corbeille (la restauration le remet dans le brouillon du nouveau devoir).
 */
export function IconesLigne({ ouvert, nbPJ, aAudio, onToggle, onFichiers, onPhoto, disabled }: {
  ouvert: boolean; nbPJ: number; aAudio: boolean; onToggle: () => void; onFichiers: () => void; onPhoto: () => void; disabled?: boolean;
}) {
  const ic = (on: boolean) => cn('relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-base', on ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40' : 'border-border bg-card', disabled && 'opacity-40');
  return (
    <span className="flex shrink-0 gap-1">
      <button type="button" disabled={disabled} onClick={onFichiers} aria-label="Ajouter des documents" title="Documents (PDF, Word, photos…)" className={ic(nbPJ > 0)}>📎
        {nbPJ > 0 && <span className="absolute -right-1 -top-1 min-w-4 h-4 rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white grid place-items-center">{nbPJ}</span>}
      </button>
      <button type="button" disabled={disabled} onClick={onPhoto} aria-label="Prendre une photo" title="Prendre une photo" className={ic(false)}>📷</button>
      <button type="button" disabled={disabled} onClick={onToggle} aria-pressed={ouvert} aria-label="Consigne audio" title="Consigne en audio" className={ic(aAudio || ouvert)}>🎙️</button>
    </span>
  );
}

export function OutilsLigneDevoir({ ligneKey, ligneNom, pj, audio, enregistreurOuvert, setPJ, setAudio, fermerEnregistreur, fichierRef, photoRef }: {
  ligneKey: string; ligneNom: string; pj: PieceJointe[]; audio: string | null; enregistreurOuvert: boolean;
  setPJ: (next: PieceJointe[]) => void; setAudio: (url: string | null) => void; fermerEnregistreur: () => void;
  fichierRef: React.RefObject<HTMLInputElement>; photoRef: React.RefObject<HTMLInputElement>;
}) {
  const { user } = useAuth();
  const rec = useAudioRecorder();
  const [envoi, setEnvoi] = useState(false);
  const [aRetirer, setARetirer] = useState<{ pj?: PieceJointe; audio?: string } | null>(null);
  const pjRef = useRef(pj); pjRef.current = pj;

  // L'audio enregistré est déposé tout de suite (une seule consigne par ligne)
  useEffect(() => {
    if (!rec.blob || !user) return;
    let fini = false;
    setEnvoi(true);
    deposerAudioProf(user.id, rec.blob, 'consignes')
      .then((url) => { if (!fini) { setAudio(url); rec.reset(); fermerEnregistreur(); toast.success('🎙️ Consigne audio ajoutée'); } })
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setEnvoi(false));
    return () => { fini = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on dépose seulement quand un nouvel enregistrement est fini
  }, [rec.blob]);

  const ajouter = async (files: File[]) => {
    if (!user || !files.length) return;
    setEnvoi(true);
    try {
      const nouveaux: PieceJointe[] = [];
      for (const f of files) nouveaux.push(await deposerFichierDevoir(`prof/${user.id}`, f));
      setPJ([...pjRef.current, ...nouveaux]);
    } catch (e) { toast.error(errorMessage(e)); } finally { setEnvoi(false); }
  };

  const retirer = async () => {
    if (!user || !aRetirer) return;
    const quoi = aRetirer.pj ? `« ${aRetirer.pj.name} »` : 'la consigne audio';
    const ok = await moveToTrash(user.id, 'devoir_piece_jointe', ligneKey, `${aRetirer.pj ? aRetirer.pj.name : '🎙️ Consigne audio'} (nouveau devoir · ${ligneNom})`,
      { key: ligneKey, attachment: aRetirer.pj ?? null, audio_url: aRetirer.audio ?? null });
    if (!ok) { toast.error('Mise en corbeille impossible : rien n\'a été retiré'); return; }
    if (aRetirer.pj) setPJ(pjRef.current.filter((x) => x.path !== aRetirer.pj!.path)); else setAudio(null);
    toast.success(`${quoi} retiré (dans la corbeille de Paramètres)`);
  };

  const rien = !pj.length && !audio && !enregistreurOuvert && !envoi;
  return (
    <>
      <input ref={fichierRef} type="file" multiple className="hidden" accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,audio/*,video/*"
        onChange={(e) => { void ajouter([...(e.target.files || [])]); e.target.value = ''; }} />
      <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { void ajouter([...(e.target.files || [])]); e.target.value = ''; }} />
      {!rien && (
        <div className="mt-1.5 space-y-1.5">
          {enregistreurOuvert && !audio && (
            rec.recording
              ? <button type="button" onClick={rec.stop} className="w-full rounded-lg bg-red-600 text-white py-2 text-sm font-bold flex items-center justify-center gap-2"><Square className="h-4 w-4" /> Arrêter ({rec.seconds} s)</button>
              : <button type="button" onClick={() => void rec.start()} disabled={envoi} className="w-full rounded-lg bg-orange-500 text-white py-2 text-sm font-bold flex items-center justify-center gap-2"><Mic className="h-4 w-4" /> Enregistrer la consigne</button>
          )}
          {audio && (
            <div className="flex items-center gap-2 rounded-xl border border-sky-300 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-800 px-2 py-1">
              <span className="text-xs font-bold shrink-0">🎧 Consigne</span>
              <audio src={audio} controls preload="none" className="h-8 min-w-0 flex-1" />
              <button type="button" onClick={() => setARetirer({ audio })} aria-label="Retirer la consigne audio"
                className="h-6 w-6 shrink-0 rounded-full bg-[#EF4444] text-white text-xs font-extrabold grid place-items-center">✕</button>
            </div>
          )}
          {envoi && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Envoi…</p>}
          <PiecesJointesVue items={pj} onRemove={(a) => setARetirer({ pj: a })} />
        </div>
      )}
      <AlertDialog open={!!aRetirer} onOpenChange={(o) => { if (!o) setARetirer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer {aRetirer?.pj ? 'ce fichier' : 'la consigne audio'} ?</AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">{aRetirer?.pj ? `« ${aRetirer.pj.name} »` : 'La consigne'} ira dans la corbeille de Paramètres, d'où tu pourras la remettre.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void retirer()}>Retirer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Assemble les icônes (placées au bout de la ligne par `children`) et leurs outils (sous la ligne) */
export function OutilsDeLigne({ ligneKey, ligneNom, pj, audio, setPJ, setAudio, children }: {
  ligneKey: string; ligneNom: string; pj: PieceJointe[]; audio: string | null;
  setPJ: (next: PieceJointe[]) => void; setAudio: (url: string | null) => void;
  children: (icones: React.ReactNode) => React.ReactNode;
}) {
  const fichierRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [micro, setMicro] = useState(false);
  return (
    <>
      {children(<IconesLigne ouvert={micro} nbPJ={pj.length} aAudio={!!audio} onToggle={() => setMicro((v) => !v)}
        onFichiers={() => fichierRef.current?.click()} onPhoto={() => photoRef.current?.click()} />)}
      <OutilsLigneDevoir ligneKey={ligneKey} ligneNom={ligneNom} pj={pj} audio={audio} enregistreurOuvert={micro}
        setPJ={setPJ} setAudio={setAudio} fermerEnregistreur={() => setMicro(false)} fichierRef={fichierRef} photoRef={photoRef} />
    </>
  );
}
