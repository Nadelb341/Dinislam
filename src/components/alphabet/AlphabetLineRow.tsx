import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, RotateCcw, Send, Loader2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { playableUrl } from '@/lib/alphabetAudio';
import { LINE_TONES, hasLowHamza, type LetterLine } from '@/lib/alphabetLines';
import type { Tables } from '@/integrations/supabase/types';

export type AlphabetSubmission = Tables<'alphabet_submissions'>;

/** Lecteur d'un audio d'exercice (lien signé, fiable sur iPhone) */
export function SignedAudio({ url, className = '' }: { url: string | null; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    playableUrl(url).then((u) => { if (alive) setSrc(u); });
    return () => { alive = false; };
  }, [url]);
  if (!src) return null;
  return <audio src={src} controls className={`w-full h-9 ${className}`} />;
}

interface Props {
  line: LetterLine;
  index: number;
  modelUrl: string | null;
  latest: AlphabetSubmission | null;
  /** Élève : peut s'enregistrer. Admin : voit l'enregistreur de modèle à la place. */
  canRecord: boolean;
  sending: boolean;
  onSend: (blob: Blob) => Promise<boolean>;
  adminSlot?: React.ReactNode;
}

const STATUS: Record<string, { text: string; cls: string }> = {
  pending: { text: '📨 Envoyé, en attente de ton prof', cls: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200' },
  corrected: { text: '⭐ Corrigé par ton prof', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' },
  redo: { text: '🔁 À refaire : réenregistre-toi', cls: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200' },
};

/** Une ligne de la fiche d'une lettre : titre, modèle du prof, micro, cases, état du dernier envoi */
export function AlphabetLineRow({ line, index, modelUrl, latest, canRecord, sending, onSend, adminSlot }: Props) {
  const rec = useAudioRecorder();
  const [open, setOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = (url: string | null, then?: () => void) => {
    if (!url) { then?.(); return; }
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    a.onended = then ? () => then() : null;
    a.src = url;
    a.play().catch(() => then?.());
  };
  // Idée 2 : le modèle du prof, puis mon dernier enregistrement
  const compare = async () => {
    const mine = await playableUrl(latest?.audio_url ?? null);
    play(modelUrl, () => setTimeout(() => play(mine), 400));
  };

  const send = async () => {
    if (!rec.blob) return;
    const ok = await onSend(rec.blob);
    if (ok) { rec.reset(); setOpen(false); }
  };

  const st = latest ? STATUS[latest.status] : null;

  return (
    <div className={`rounded-2xl p-3 space-y-2 ${LINE_TONES[line.key]}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm [overflow-wrap:anywhere]">
            {index + 1}. {line.title} {latest?.status === 'corrected' && <span aria-label="étoile gagnée">⭐</span>}
          </p>
          <p className="text-[11px] text-muted-foreground">{line.subtitle}</p>
        </div>
        {modelUrl && (
          <Button type="button" size="sm" variant="secondary" className="shrink-0 h-9 rounded-full px-3 text-xs" onClick={() => play(modelUrl)}>
            🔊 Écoute ton prof et répète
          </Button>
        )}
        {canRecord && (
          <Button
            type="button" size="icon" className="shrink-0 h-9 w-9 rounded-full"
            onClick={() => setOpen((o) => !o)} aria-label={`M'enregistrer : ${line.title}`}
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div dir="rtl" className="flex flex-wrap gap-1.5">
        {line.cells.map((c, i) => (
          <div key={i} className="flex-1 min-w-[56px] rounded-xl bg-card px-1 py-1.5 text-center">
            <span className={`block font-arabic text-3xl ${hasLowHamza(c.text) ? 'leading-[2.4] pb-1' : 'leading-[1.6]'}`}>{c.text}</span>
            <span className="block text-[10.5px] text-muted-foreground">{c.label}</span>
          </div>
        ))}
      </div>

      {open && canRecord && (
        <div className="rounded-xl bg-card p-2.5 space-y-2">
          {!rec.blob ? (
            rec.recording ? (
              <Button type="button" variant="destructive" className="w-full gap-2" onClick={rec.stop}>
                <Square className="h-4 w-4" /> Arrêter ({rec.seconds} s)
              </Button>
            ) : (
              <Button type="button" className="w-full gap-2" onClick={rec.start}>
                <Mic className="h-4 w-4" /> Lis la ligne à voix haute
              </Button>
            )
          ) : (
            <>
              {rec.previewUrl && <audio src={rec.previewUrl} controls className="w-full h-9" />}
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" className="gap-1" onClick={rec.reset} disabled={sending}>
                  <RotateCcw className="h-4 w-4" /> Recommencer
                </Button>
                <Button type="button" className="gap-1" onClick={send} disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Envoyer
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {st && (
        <div className="space-y-1.5">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.cls}`}>{st.text}</span>
          {latest?.admin_comment && (
            <p className="rounded-xl bg-card px-3 py-2 text-sm border-s-4 border-amber-400 [overflow-wrap:anywhere]">💬 {latest.admin_comment}</p>
          )}
          {latest?.admin_audio_url && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground">🎧 La réponse de ton prof</p>
              <SignedAudio url={latest.admin_audio_url} />
            </div>
          )}
          {latest?.audio_url && modelUrl && (
            <button type="button" onClick={compare} className="text-xs font-semibold text-primary">
              🔁 Comparer : le prof puis moi
            </button>
          )}
        </div>
      )}

      {adminSlot}
    </div>
  );
}
