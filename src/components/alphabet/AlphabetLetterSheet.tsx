import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { audioExt } from '@/hooks/useAudioRecorder';
import { toast } from 'sonner';
import { Check, FileText, Volume2 } from 'lucide-react';
import { AdminLineModelRecorder } from './AdminLineModelRecorder';
import { AlphabetLineRow, type AlphabetSubmission } from './AlphabetLineRow';
import { LetterTracer } from './LetterTracer';
import { buildLines, type LineKey } from '@/lib/alphabetLines';
import { uploadAlphabetAudio } from '@/lib/alphabetAudio';
import { sendPushNotification } from '@/lib/pushHelper';
import { errorMessage } from '@/lib/utils';
import { ALPHABET_WORDS } from '@/data/alphabetWords';
import type { Tables } from '@/integrations/supabase/types';

type Letter = Tables<'alphabet_letters'>;

interface Props {
  letter: Letter;
  isLearned: boolean;
  /** Admin ou élève de 20 ans et plus : validation directe, sans attendre l'enseignante */
  directValidation: boolean;
  isAdmin: boolean;
  submissions: AlphabetSubmission[];
  models: Map<string, string>;
  contents: Tables<'alphabet_content'>[];
  onLetterChange: (l: Letter) => void;
  onPlay: (l: Letter) => void;
  onClose: () => void;
}

/** Fiche d'une lettre : 6 lignes à s'enregistrer (exercices libres), puis demande de validation à l'enseignante. */
export function AlphabetLetterSheet({
  letter, isLearned, directValidation, isAdmin, submissions, models, contents, onLetterChange, onPlay, onClose,
}: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { askValidation, validationDialog } = useConfirmValidation();
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  const [sendingLine, setSendingLine] = useState<LineKey | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [showTracer, setShowTracer] = useState(false);

  const lines = useMemo(() => buildLines(letter), [letter]);
  const word = ALPHABET_WORDS[letter.letter_arabic];
  const mine = submissions.filter((s) => s.letter_id === letter.id);
  const latestOf = (key: LineKey) => mine.find((s) => s.kind === 'exercise' && s.line_key === key) ?? null;
  const lastFinal = mine.find((s) => s.kind === 'final') ?? null;
  const lastComment = mine.find((s) => s.admin_comment)?.admin_comment ?? null;
  const stars = lines.filter((l) => latestOf(l.key)?.status === 'corrected').length;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['alphabet-submissions', user?.id] });

  const sendExercise = async (key: LineKey, title: string, blob: Blob) => {
    if (!user) return false;
    setSendingLine(key);
    try {
      const url = await uploadAlphabetAudio(`${user.id}/alphabet/${letter.id}-${key}-${Date.now()}.${audioExt(blob)}`, blob);
      const { error } = await supabase.from('alphabet_submissions').insert({
        student_id: user.id, letter_id: letter.id, kind: 'exercise', line_key: key, audio_url: url,
      });
      if (error) throw error;
      sendPushNotification({
        type: 'admin', category: 'adm_valid', title: '🔤 Alphabet à valider', data: { url: '/?admin=alphabet-validations' },
        body: `Nouvel exercice : ${letter.name_french} (${letter.letter_arabic}) · ${title}`,
      });
      toast.success('Envoyé à ton prof ✓ Tu peux continuer les autres lignes');
      refresh();
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    } finally {
      setSendingLine(null);
    }
  };

  const requestValidation = async () => {
    if (!user) return;
    setRequesting(true);
    try {
      if (directValidation) {
        if (isAdmin) {
          const { error } = await supabase.from('user_alphabet_progress')
            .upsert({ user_id: user.id, letter_id: letter.id, is_validated: true, is_completed: true, completed_at: new Date().toISOString() }, { onConflict: 'user_id,letter_id' });
          if (error) throw error;
        } else {
          const { error } = await supabase.rpc('alphabet_self_validate', { p_letter_id: letter.id });
          if (error) throw error;
        }
        queryClient.invalidateQueries({ queryKey: ['user-alphabet-progress-page', user.id] });
        toast.success('✅ Lettre apprise !');
      } else {
        const { error } = await supabase.from('alphabet_submissions').insert({ student_id: user.id, letter_id: letter.id, kind: 'final' });
        if (error) throw error;
        sendPushNotification({
          type: 'admin', category: 'adm_valid', title: '🔤 Alphabet à valider', data: { url: '/?admin=alphabet-validations' },
          body: `Lettre apprise ? ${letter.name_french} (${letter.letter_arabic}) attend ta validation`,
        });
        toast.success('Demande envoyée à ton prof ⏳');
        refresh();
      }
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setRequesting(false);
    }
  };

  const finalBlock = (() => {
    if (isLearned) {
      return <div className="w-full rounded-xl bg-emerald-100 dark:bg-emerald-950/40 py-3 text-center font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-center gap-2"><Check className="h-4 w-4" /> Lettre validée 🎉</div>;
    }
    if (!directValidation && lastFinal?.status === 'pending') {
      return <div className="w-full rounded-xl bg-sky-100 dark:bg-sky-950/40 py-3 text-center font-semibold">⏳ En attente de ton prof</div>;
    }
    return (
      <div className="space-y-2">
        {!directValidation && lastFinal?.status === 'to_review' && (
          <div className="rounded-xl bg-amber-100 dark:bg-amber-950/40 p-3 text-sm space-y-1">
            <p className="font-bold">🔁 À revoir : retravaille encore un peu cette lettre, tu vas y arriver ! 💪</p>
            {lastFinal.admin_comment && <p className="[overflow-wrap:anywhere]">💬 {lastFinal.admin_comment}</p>}
            <p className="text-xs text-muted-foreground">Quand tu es prêt(e), redemande la validation.</p>
          </div>
        )}
        <Button
          className="w-full gap-2"
          disabled={requesting}
          onClick={() => askValidation(
            directValidation ? 'Valider cette lettre ?' : 'Demander la validation ?',
            directValidation
              ? `${letter.name_french} (${letter.letter_arabic}) sera marquée comme apprise.`
              : `Ton prof va vérifier ${letter.name_french} (${letter.letter_arabic}). La lettre suivante s'ouvrira quand il l'aura validée.`,
            requestValidation,
          )}
        >
          ✏️ Marquer comme apprise
        </Button>
      </div>
    );
  })();

  const selectedContents = contents.filter((c) => c.letter_id === letter.id);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[88vh] overflow-y-auto p-5 space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 pe-8">
              <span className="font-arabic text-5xl leading-[1.4]">{letter.letter_arabic}</span>
              <div className="min-w-0">
                <p className="text-lg font-bold">{letter.name_french} {stars > 0 && <span className="text-amber-500 text-sm">{'⭐'.repeat(stars)}</span>}</p>
                <p className="text-sm text-muted-foreground font-arabic">{letter.name_arabic}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Audio de la lettre (les 2 enregistreurs de l'enseignante « Ta voix… » retirés à sa demande le 2026-10-07) */}
          {([
            { field: 'audio_url' as const, label: 'La lettre', url: letter.audio_url },
            { field: 'audio_vowels_url' as const, label: 'Avec les voyelles (a, i, ou)', url: letter.audio_vowels_url },
          ]).filter(({ url }) => !!url).map(({ field, label, url }) => (
            <div key={field} className="bg-sky-50 dark:bg-sky-950/20 rounded-xl p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">{label}</p>
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-primary shrink-0" />
                <audio key={url} src={url ?? undefined} controls className="flex-1 min-w-0 h-8" />
              </div>
            </div>
          ))}

          {/* Mot exemple (idée 6) */}
          {word && (
            <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/20 p-3 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-4xl shrink-0">{word.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-arabic text-3xl leading-[1.5]" dir="rtl">{word.word}</p>
                  <p className="text-sm"><span className="font-semibold">« {word.tr} »</span> <span className="text-muted-foreground">· {word.fr}</span></p>
                </div>
                {models.get(`${letter.id}:mot`) && (
                  <Button type="button" size="icon" variant="secondary" className="rounded-full shrink-0" aria-label="Écouter le mot"
                    onClick={() => new Audio(models.get(`${letter.id}:mot`)).play().catch(() => {})}>
                    🔊
                  </Button>
                )}
              </div>
              {isAdmin && (
                <AdminLineModelRecorder letterId={letter.id} letterName={letter.name_french} lineKey="mot"
                  lineTitle={`Mot exemple ${word.word}`} currentUrl={models.get(`${letter.id}:mot`) ?? null} />
              )}
            </div>
          )}

          {/* Les 6 lignes */}
          <div className="space-y-2.5">
            {lines.map((line, i) => (
              <AlphabetLineRow
                key={line.key}
                line={line}
                index={i}
                modelUrl={models.get(`${letter.id}:${line.key}`) ?? null}
                latest={latestOf(line.key)}
                canRecord={!isAdmin}
                sending={sendingLine === line.key}
                onSend={(blob) => sendExercise(line.key, line.title, blob)}
                adminSlot={isAdmin ? (
                  <AdminLineModelRecorder letterId={letter.id} letterName={letter.name_french} lineKey={line.key}
                    lineTitle={line.title} currentUrl={models.get(`${letter.id}:${line.key}`) ?? null} />
                ) : undefined}
              />
            ))}
            {letter.letter_arabic === 'ا' && (
              <p className="text-xs text-muted-foreground px-1">Pour le Alif, ce sont les hamzas (أ إ) qui portent les voyelles : la soukoune et la chadda ne se posent pas sur lui.</p>
            )}
          </div>

          {/* Tracer (idée 5) et jeu de la lettre */}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => setShowTracer((s) => !s)}>✍️ Tracer la lettre</Button>
            <Button type="button" variant="outline" onClick={() => onPlay(letter)}>🎮 Jouer avec {letter.letter_arabic}</Button>
          </div>
          {showTracer && <LetterTracer forms={lines[0].cells} />}

          {/* Ressources ajoutées par l'enseignante */}
          {selectedContents.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ressources</h4>
              {selectedContents.map((content) => (
                <div key={content.id} className="border border-border rounded-xl overflow-hidden">
                  {content.content_type === 'video' && <video src={content.file_url} controls className="w-full" controlsList="nodownload" />}
                  {content.content_type === 'image' && <img src={content.file_url} alt={content.file_name} className="w-full object-cover max-h-64" />}
                  {(content.content_type === 'pdf' || content.content_type === 'document') && (
                    <a href={content.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 hover:bg-muted/50">
                      <FileText className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium [overflow-wrap:anywhere]">{content.file_name}</span>
                    </a>
                  )}
                  {content.content_type === 'audio' && (
                    <div className="p-3 flex items-center gap-3">
                      <Volume2 className="h-5 w-5 text-primary" />
                      <audio src={content.file_url} controls className="flex-1 h-8" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Mot du prof */}
          {lastComment && !isAdmin && lastFinal?.status !== 'to_review' && (
            <div className="rounded-xl bg-card border-s-4 border-amber-400 px-3 py-2 text-sm">
              <p className="text-xs font-semibold text-muted-foreground">💬 Mot de ton prof</p>
              <p className="[overflow-wrap:anywhere]">{lastComment}</p>
            </div>
          )}

          {finalBlock}
        </div>
        <ScrollButtons showTop={showTop} showBottom={showBottom} onScrollTop={scrollToTop} onScrollBottom={scrollToBottom} position="absolute" />
        {validationDialog}
      </DialogContent>
    </Dialog>
  );
}
