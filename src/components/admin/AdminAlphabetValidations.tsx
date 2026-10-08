import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Mic, Square, RotateCcw, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useAudioRecorder, audioExt } from '@/hooks/useAudioRecorder';
import { uploadAlphabetAudio, playableUrl } from '@/lib/alphabetAudio';
import { sendPushNotification } from '@/lib/pushHelper';
import { errorMessage } from '@/lib/utils';
import { LINE_TITLES, LINE_TONES, type LineKey } from '@/lib/alphabetLines';
import { SignedAudio, type AlphabetSubmission } from '@/components/alphabet/AlphabetLineRow';
import { AlphabetProgressGrid } from '@/components/admin/AlphabetProgressGrid';

/** Réponses rapides (idée bonus 4) : un clic les ajoute au commentaire */
const QUICK_REPLIES = [
  'Bravo, machaAllah ! 🌟',
  'Très bien, continue comme ça !',
  'Écoute encore le modèle et répète.',
  'Parle un peu plus fort 🔊',
  'Attention aux voyelles longues : tiens le son plus longtemps.',
  'Attention à la lettre emphatique : la bouche bien arrondie.',
  'Presque ! Recommence une fois 💪',
];

interface Letter { id: number; letter_arabic: string; name_french: string }

function SubmissionItem({ sub, name, letter, onDone }: { sub: AlphabetSubmission; name: string; letter?: Letter; onDone: () => void }) {
  const rec = useAudioRecorder();
  const [comment, setComment] = useState(sub.admin_comment ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmValidate, setConfirmValidate] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const isFinal = sub.kind === 'final';
  const title = isFinal ? 'Lettre apprise ? (validation de la lettre)' : LINE_TITLES[sub.line_key as LineKey] ?? 'Exercice';
  const letterLabel = letter ? `${letter.letter_arabic} ${letter.name_french}` : 'Lettre';
  const pending = sub.status === 'pending';

  const decide = async (status: 'corrected' | 'redo' | 'validated' | 'to_review') => {
    setSaving(true);
    try {
      let adminAudio = sub.admin_audio_url;
      if (rec.blob) adminAudio = await uploadAlphabetAudio(`admin/alphabet/${sub.id}-${Date.now()}.${audioExt(rec.blob)}`, rec.blob);
      if (status === 'validated') {
        const { error: pErr } = await supabase.from('user_alphabet_progress').upsert(
          { user_id: sub.student_id, letter_id: sub.letter_id, is_validated: true, is_completed: true, completed_at: new Date().toISOString() },
          { onConflict: 'user_id,letter_id' },
        );
        if (pErr) throw pErr;
      }
      const { error } = await supabase.from('alphabet_submissions').update({
        status, admin_comment: comment.trim() || null, admin_audio_url: adminAudio, reviewed_at: new Date().toISOString(),
      }).eq('id', sub.id);
      if (error) throw error;
      const messages: Record<typeof status, { title: string; body: string }> = {
        corrected: { title: '⭐ {prenom}, ton prof a corrigé ton exercice', body: `${letterLabel} · ${title}${comment.trim() ? ` : ${comment.trim()}` : ''}` },
        redo: { title: '🔁 {prenom}, exercice à refaire', body: `${letterLabel} · ${title}${comment.trim() ? ` : ${comment.trim()}` : ''}` },
        validated: { title: '🎉 Lettre validée !', body: `Bravo {prenom}, ${letterLabel} est validée. La lettre suivante est ouverte !` },
        to_review: { title: '💪 Encore un petit effort, {prenom}', body: `Retravaille ${letterLabel}, tu vas y arriver ! Puis redemande la validation.` },
      };
      sendPushNotification({ userId: sub.student_id, category: 'rec', ...messages[status], data: { url: '/alphabet' } });
      toast.success(status === 'validated' ? `✅ ${letterLabel} validée pour ${name}` : 'Réponse envoyée ✓');
      rec.reset();
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-3 space-y-2 ${pending ? 'border-border bg-card' : 'border-transparent bg-muted/40'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-sm [overflow-wrap:anywhere]">{name} · <span className="font-arabic text-lg">{letter?.letter_arabic}</span> {letter?.name_french}</p>
          <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
            {title} · {new Date(sub.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10.5px] font-bold ${isFinal ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200' : `${LINE_TONES[sub.line_key as LineKey] ?? 'bg-sky-50'} text-foreground`}`}>
          {isFinal ? 'Validation' : 'Exercice'}
        </span>
      </div>

      {sub.audio_url && <SignedAudio url={sub.audio_url} />}

      {!pending && (
        <p className="text-xs font-semibold">
          {{ corrected: '⭐ Corrigé', redo: '🔁 À refaire', validated: '✅ Lettre validée', to_review: '🔁 À revoir', pending: '' }[sub.status]}
          {sub.admin_comment ? ` · 💬 ${sub.admin_comment}` : ''}
        </p>
      )}

      {pending && (
        <>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="💬 Ton commentaire (facultatif)" className="min-h-[64px] text-sm" />
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map((q) => (
              <button key={q} type="button" onClick={() => setComment((c) => (c.trim() ? `${c.trim()} ${q}` : q))}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold">
                {q}
              </button>
            ))}
          </div>

          {!isFinal && (
            !showRecorder ? (
              <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => setShowRecorder(true)}>
                <Mic className="h-4 w-4" /> Répondre par un audio
              </Button>
            ) : (
              <div className="rounded-xl bg-muted/50 p-2 space-y-2">
                {!rec.blob ? (
                  rec.recording
                    ? <Button size="sm" variant="destructive" className="w-full gap-1" onClick={rec.stop}><Square className="h-4 w-4" /> Arrêter ({rec.seconds} s)</Button>
                    : <Button size="sm" className="w-full gap-1" onClick={rec.start}><Mic className="h-4 w-4" /> Enregistrer ma réponse</Button>
                ) : (
                  <>
                    {rec.previewUrl && <audio src={rec.previewUrl} controls className="w-full h-9" />}
                    <Button size="sm" variant="outline" className="gap-1" onClick={rec.reset}><RotateCcw className="h-4 w-4" /> Recommencer</Button>
                  </>
                )}
              </div>
            )
          )}

          {isFinal ? (
            <div className="grid grid-cols-2 gap-2">
              <Button disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setConfirmValidate(true)}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '✅ Valider la lettre'}
              </Button>
              <Button disabled={saving} variant="outline" onClick={() => decide('to_review')}>🔁 À revoir</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button disabled={saving || rec.recording} className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => decide('corrected')}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '⭐ Corrigé'}
              </Button>
              <Button disabled={saving || rec.recording} variant="outline" onClick={() => decide('redo')}>🔁 À refaire</Button>
            </div>
          )}
        </>
      )}

      <AlertDialog open={confirmValidate} onOpenChange={setConfirmValidate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider {letterLabel} pour {name} ?</AlertDialogTitle>
            <AlertDialogDescription>La lettre sera marquée comme apprise et la suivante s'ouvrira pour {name}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => decide('validated')}>✅ Valider</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Bouclier › « 🔤 Alphabet à valider » : exercices et demandes de validation des élèves */
export function AdminAlphabetValidations({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'pending' | 'done' | 'grid'>('pending');
  const [studentFilter, setStudentFilter] = useState('');
  const [playingAll, setPlayingAll] = useState(false);
  const stopRef = useRef(false);

  const { data } = useQuery({
    queryKey: ['admin-alphabet-submissions'],
    queryFn: async () => {
      const [{ data: subs, error }, { data: profiles }, { data: letters }] = await Promise.all([
        supabase.from('alphabet_submissions').select('*').order('created_at', { ascending: false }).limit(400),
        supabase.from('profiles').select('user_id, full_name'),
        supabase.from('alphabet_letters').select('id, letter_arabic, name_french').order('display_order'),
      ]);
      if (error) throw error;
      return {
        subs: (subs || []) as AlphabetSubmission[],
        names: new Map((profiles || []).map((p) => [p.user_id, p.full_name || 'Élève'])),
        letters: new Map((letters || []).map((l) => [l.id, l as Letter])),
      };
    },
  });

  const subs = useMemo(() => {
    const all = data?.subs ?? [];
    const filtered = studentFilter ? all.filter((s) => s.student_id === studentFilter) : all;
    // À traiter : les plus anciens d'abord (premier arrivé, premier corrigé)
    return view === 'pending' ? filtered.filter((s) => s.status === 'pending').reverse() : filtered.filter((s) => s.status !== 'pending');
  }, [data, studentFilter, view]);

  const studentsWithSubs = useMemo(() => {
    const ids = [...new Set((data?.subs ?? []).map((s) => s.student_id))];
    return ids.map((id) => ({ id, name: data?.names.get(id) ?? 'Élève' })).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [data]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-alphabet-submissions'] });
    queryClient.invalidateQueries({ queryKey: ['admin-pending-breakdown'] });
  };

  // Idée 10 : écouter tous les envois affichés, l'un après l'autre
  const playAll = async () => {
    if (playingAll) { stopRef.current = true; return; }
    const list = subs.filter((s) => s.audio_url);
    if (!list.length) { toast('Aucun audio à écouter'); return; }
    stopRef.current = false;
    setPlayingAll(true);
    const audio = new Audio();
    for (const s of list) {
      if (stopRef.current) break;
      const url = await playableUrl(s.audio_url);
      if (!url) continue;
      toast(`▶ ${data?.names.get(s.student_id) ?? 'Élève'} · ${data?.letters.get(s.letter_id)?.name_french ?? ''} · ${LINE_TITLES[s.line_key as LineKey] ?? ''}`);
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.src = url;
        audio.play().catch(() => resolve());
      });
      await new Promise((r) => setTimeout(r, 600));
    }
    audio.pause();
    setPlayingAll(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1"><ArrowLeft className="h-4 w-4" /> Retour</Button>
        <h3 className="font-bold text-lg">🔤 Alphabet à valider</h3>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted/60 p-1">
        {([['pending', 'À traiter'], ['done', 'Déjà traités'], ['grid', '📊 Suivi']] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setView(k)}
            className={`rounded-xl py-2 text-sm font-semibold ${view === k ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
            {label}{k === 'pending' && (data?.subs.filter((s) => s.status === 'pending').length ?? 0) > 0 ? ` (${data?.subs.filter((s) => s.status === 'pending').length})` : ''}
          </button>
        ))}
      </div>

      {view === 'grid' ? (
        <AlphabetProgressGrid />
      ) : (
        <>
          <div className="flex gap-2">
            <select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} className="flex-1 min-w-0 h-10 rounded-xl border border-border bg-background px-3 text-sm" aria-label="Élève">
              <option value="">Tous les élèves</option>
              {studentsWithSubs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Button variant="outline" className="shrink-0 gap-1" onClick={playAll}>
              {playingAll ? <><Square className="h-4 w-4" /> Arrêter</> : <><Play className="h-4 w-4" /> Tout écouter</>}
            </Button>
          </div>
          {subs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">{view === 'pending' ? 'Rien à corriger pour le moment 🎉' : 'Aucun envoi traité.'}</p>
          ) : (
            <div className="space-y-2.5">
              {subs.map((s) => (
                <SubmissionItem key={s.id} sub={s} name={data?.names.get(s.student_id) ?? 'Élève'} letter={data?.letters.get(s.letter_id)} onDone={refresh} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
