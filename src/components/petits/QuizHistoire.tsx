import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { SortableCardList } from '@/components/shared/SortableCardList';
import { untypedDb } from '@/lib/untypedDb';
import { useAuth } from '@/contexts/AuthContext';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { trashThenDelete } from '@/lib/trash';
import { enregistrerOrdre, envoyerFichierAlphabet, horsLigne } from '@/lib/alphabetMedias';
import { errorMessage } from '@/lib/utils';
import { audioExt, useAudioRecorder } from '@/hooks/useAudioRecorder';
import { confettiLettres } from '@/lib/confettiLettres';
import { sonCristal } from '@/lib/sonSaison';
import { sonErreur } from '@/lib/sonsErreur';
import { cleJour, parler } from '@/lib/petits';

/**
 * 🎧 Quiz AUDIO des histoires (Nadia, 22/11) : beaucoup de petits ne savent pas encore lire → la question est DITE (ta voix,
 * sinon la voix de l'appareil) et chaque réponse est une grande image avec son 🔊. Un toucher sur une image = on l'entend et on
 * répond. Erreur = son doux, on continue jusqu'à la bonne réponse. Fin = bravo + ⭐ (une par jour et par histoire).
 * Table `petits_quiz` (choix en jsonb) ; ✏️ enseignante : ajouter, modifier, ranger, supprimer (corbeille), enregistrer sa voix.
 */
export interface Choix { texte: string; emoji: string | null; image_url?: string | null; audio_url?: string | null; juste: boolean }
export interface QuestionQuiz { id: string; fiche_id: string; question: string; audio_url: string | null; choix: Choix[]; position: number }

const jouer = (url: string | null | undefined, texte: string) => {
  if (url) { try { void new Audio(url).play().catch(() => parler(texte, 'fr')); return; } catch { /* son indisponible */ } }
  parler(texte, 'fr');
};

function useQuizHistoire(ficheId: string) {
  return useQuery({
    queryKey: ['petits-quiz', ficheId],
    queryFn: async () => {
      const { data, error } = await untypedDb.from('petits_quiz').select('id, fiche_id, question, audio_url, choix, position').eq('fiche_id', ficheId).order('position').order('created_at');
      if (error) throw error;
      return (data || []) as QuestionQuiz[];
    },
  });
}

const melanger = <T,>(t: T[]) => [...t].sort(() => Math.random() - 0.5);

export function QuizHistoire({ ficheId, titre, isAdmin, aEtoile, gagnerEtoile }: {
  ficheId: string; titre: string; isAdmin: boolean;
  aEtoile: (source: string, ref: string) => boolean; gagnerEtoile: (source: string, ref: string) => Promise<boolean>;
}) {
  const { data: questions = [] } = useQuizHistoire(ficheId);
  const [enCours, setEnCours] = useState(false);
  const [n, setN] = useState(0);
  const [rates, setRates] = useState<number[]>([]);
  const [trouve, setTrouve] = useState(false);
  const [fini, setFini] = useState(false);
  const q = questions[n];
  const ordre = useMemo(() => (q ? melanger(q.choix.map((_, i) => i)) : []), [q]);
  const ref = `quiz:${ficheId}:${cleJour()}`;

  useEffect(() => { if (enCours && q) jouer(q.audio_url, q.question); }, [enCours, q]);

  const commencer = () => { setN(0); setRates([]); setTrouve(false); setFini(false); setEnCours(true); };
  const toucher = (i: number) => {
    if (!q || trouve) return;
    const c = q.choix[i];
    if (c.juste) {
      jouer(c.audio_url, c.texte);
      setTrouve(true); sonCristal(); confettiLettres(['⭐']);
      setTimeout(() => {
        if (n + 1 < questions.length) { setN(n + 1); setRates([]); setTrouve(false); }
        else { setFini(true); void gagnerEtoile('quiz', ref); }
      }, 1800);
    } else {
      sonErreur();
      setTimeout(() => jouer(c.audio_url, c.texte), 500);
      setRates((r) => [...r, i]);
    }
  };

  if (!questions.length && !isAdmin) return null;
  return (
    <section className="rounded-[28px] border-[6px] border-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/40 shadow-xl overflow-hidden text-start">
      <p className="bg-fuchsia-500 px-4 py-2 text-lg font-extrabold text-white">🎧 Le quiz qu'on écoute</p>
      <div className="p-3 space-y-3">
        {!enCours ? (
          questions.length > 0 && (
            <button type="button" onClick={commencer} className="w-full h-20 rounded-3xl bg-gradient-to-br from-fuchsia-400 to-purple-600 text-white text-3xl font-extrabold shadow-lg active:scale-95 transition-transform">
              ▶️ {aEtoile('quiz', ref) ? '⭐' : '🎧'}
            </button>
          )
        ) : fini ? (
          <div className="text-center space-y-2 py-2">
            <p className="text-6xl animate-bounce">🌟👏🌟</p>
            <p className="text-2xl font-extrabold">Bravo !</p>
            <Button variant="outline" onClick={commencer}>🔁 Encore</Button>
          </div>
        ) : q && (
          <>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => jouer(q.audio_url, q.question)} aria-label="Réécouter la question"
                className="h-16 w-16 shrink-0 rounded-full bg-white text-4xl shadow-lg grid place-items-center active:scale-95">🔊</button>
              <p className="flex-1 min-w-0 text-base font-bold [overflow-wrap:anywhere]">{q.question}</p>
              <span className="text-sm font-bold text-muted-foreground">{n + 1}/{questions.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ordre.map((i) => {
                const c = q.choix[i];
                const rate = rates.includes(i);
                const bon = trouve && c.juste;
                return (
                  <div key={i} className="relative">
                    <button type="button" onClick={() => toucher(i)} aria-label={c.texte}
                      className={`w-full aspect-square rounded-3xl bg-white dark:bg-slate-900 shadow-lg grid place-items-center p-1 transition-all active:scale-95 ${bon ? 'ring-8 ring-emerald-400 scale-105' : rate ? 'opacity-40 animate-[wiggle_0.4s_ease-in-out]' : ''}`}>
                      {c.image_url ? <img src={c.image_url} alt="" className="max-h-full max-w-full object-contain rounded-2xl" /> : <span className="text-5xl sm:text-6xl leading-none">{c.emoji || '❓'}</span>}
                    </button>
                    <button type="button" onClick={() => jouer(c.audio_url, c.texte)} aria-label={`Écouter : ${c.texte}`}
                      className="absolute -bottom-2 start-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-fuchsia-500 text-white text-xl shadow grid place-items-center">🔊</button>
                  </div>
                );
              })}
            </div>
            <div className="h-2" />
          </>
        )}
        {isAdmin && <GererQuiz ficheId={ficheId} titre={titre} questions={questions} />}
      </div>
    </section>
  );
}

/** 🎙️ Ta voix : enregistrer au micro ou choisir un fichier son */
function Voix({ url, onUrl, dossier }: { url: string | null; onUrl: (u: string | null) => void; dossier: string }) {
  const rec = useAudioRecorder();
  const [envoi, setEnvoi] = useState(false);
  const fichier = useRef<HTMLInputElement>(null);
  const envoyer = async (f: File) => {
    if (horsLigne()) { toast.error('📡 Nécessite Internet pour envoyer ta voix'); return; }
    setEnvoi(true);
    try { const r = await envoyerFichierAlphabet(f, dossier); if (r.kind !== 'audio') throw new Error('Choisis un fichier son'); onUrl(r.url); rec.reset(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setEnvoi(false); }
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!rec.recording ? <Button type="button" size="sm" variant="outline" disabled={envoi} onClick={() => void rec.start()}>🎙️ {url ? 'Réenregistrer' : 'Ma voix'}</Button>
        : <Button type="button" size="sm" variant="destructive" onClick={rec.stop}>⏹️ Stop ({rec.seconds} s)</Button>}
      {rec.blob && !rec.recording && <Button type="button" size="sm" disabled={envoi} onClick={() => void envoyer(new File([rec.blob!], `voix.${audioExt(rec.blob!)}`, { type: rec.blob!.type || 'audio/mp4' }))}>{envoi ? 'Envoi…' : '✅ Garder'}</Button>}
      <Button type="button" size="sm" variant="ghost" disabled={envoi} onClick={() => fichier.current?.click()}>📎</Button>
      {url && <Button type="button" size="sm" variant="ghost" onClick={() => jouer(url, '')}>▶️</Button>}
      {url && <Button type="button" size="sm" variant="ghost" onClick={() => onUrl(null)} aria-label="Retirer la voix">✕</Button>}
      <input ref={fichier} type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void envoyer(f); }} />
    </div>
  );
}

function GererQuiz({ ficheId, titre, questions }: { ficheId: string; titre: string; questions: QuestionQuiz[] }) {
  const queryClient = useQueryClient();
  const [edition, setEdition] = useState<QuestionQuiz | 'nouvelle' | null>(null);
  const rafraichir = () => void queryClient.invalidateQueries({ queryKey: ['petits-quiz', ficheId] });
  return (
    <details className="rounded-2xl bg-white/90 dark:bg-slate-900/90 p-2.5">
      <summary className="font-bold cursor-pointer">✏️ Gérer le quiz ({questions.length})</summary>
      <p className="text-xs text-muted-foreground mt-1">✋ Appui long puis glisser pour ranger. Sans ta voix, l'appareil lit le texte.</p>
      <div className="mt-2 space-y-1.5">
        <SortableCardList items={questions} onReorder={(l) => { void enregistrerOrdre('petits_quiz', l.map((x) => x.id)).then(rafraichir, (e) => toast.error(errorMessage(e))); }}
          renderItem={(x, drag) => {
            const { ref, style, isDragging, ...attrs } = drag;
            return (
              <div key={x.id} ref={ref} style={style} {...attrs} className={`flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 touch-manipulation ${isDragging ? 'opacity-50 ring-2 ring-sky-400' : ''}`}>
                <span className="text-lg">{x.choix.map((c) => c.emoji).join('')}</span>
                <span className="flex-1 min-w-0 text-sm font-semibold [overflow-wrap:anywhere]">{x.question}{x.audio_url ? ' 🎙️' : ''}</span>
                <Button size="sm" variant="outline" onPointerDown={(e) => e.stopPropagation()} onClick={() => setEdition(x)} aria-label={`Modifier ${x.question}`}>✏️</Button>
              </div>
            );
          }} />
        <Button variant="outline" className="w-full" onClick={() => setEdition('nouvelle')}>➕ Ajouter une question</Button>
      </div>
      {edition && <EditionQuestion ficheId={ficheId} titre={titre} q={edition === 'nouvelle' ? null : edition}
        maxPos={Math.max(0, ...questions.map((x) => x.position))} onClose={() => setEdition(null)} rafraichir={rafraichir} />}
    </details>
  );
}

function EditionQuestion({ ficheId, titre, q, maxPos, onClose, rafraichir }: {
  ficheId: string; titre: string; q: QuestionQuiz | null; maxPos: number; onClose: () => void; rafraichir: () => void;
}) {
  const [question, setQuestion] = useState(q?.question ?? '');
  const [audio, setAudio] = useState<string | null>(q?.audio_url ?? null);
  const [choix, setChoix] = useState<Choix[]>(q?.choix.length ? q.choix : [
    { texte: '', emoji: '⭐', juste: true }, { texte: '', emoji: '🌙', juste: false }, { texte: '', emoji: '☀️', juste: false }]);
  const [supprimer, setSupprimer] = useState(false);
  const { user } = useAuth();
  const dossier = `petits/quiz/${ficheId}`;
  const maj = (i: number, v: Partial<Choix>) => setChoix((l) => l.map((c, j) => (j === i ? { ...c, ...v } : v.juste ? { ...c, juste: false } : c)));

  const enregistrer = async () => {
    if (!question.trim()) { toast.error('Écris la question'); return; }
    const propres = choix.filter((c) => c.texte.trim() || c.emoji || c.image_url).map((c) => ({ ...c, texte: c.texte.trim() }));
    if (propres.length < 2) { toast.error('Il faut au moins 2 réponses'); return; }
    if (!propres.some((c) => c.juste)) { toast.error('Coche la bonne réponse ✅'); return; }
    try {
      const values = { question: question.trim(), audio_url: audio, choix: propres, updated_at: new Date().toISOString() };
      const r = q ? await ecrireOuGarder({ table: 'petits_quiz', op: 'update', id: q.id, values })
        : await ecrireOuGarder({ table: 'petits_quiz', op: 'insert', rows: [{ ...values, fiche_id: ficheId, position: maxPos + 10 }] });
      toast.success(r === 'en_attente' ? '📡 Gardé, envoyé au retour du réseau' : 'Enregistré ✅');
      rafraichir(); onClose();
    } catch (e) { toast.error(errorMessage(e)); }
  };
  const retirer = async () => {
    if (!q) return;
    try {
      if (!user) throw new Error('Reconnecte-toi');
      await trashThenDelete({ userId: user.id, type: 'petits_quiz', id: q.id, label: `Question « ${q.question} » (quiz de ${titre})`, data: q,
        remove: () => untypedDb.from('petits_quiz').delete().eq('id', q.id) });
      toast.success('🗑️ Dans la corbeille (Paramètres)');
      rafraichir(); onClose();
    } catch (e) { toast.error(errorMessage(e)); }
  };
  const envoyerImage = async (i: number, f: File) => {
    if (horsLigne()) { toast.error('📡 Nécessite Internet pour envoyer une image'); return; }
    try { const r = await envoyerFichierAlphabet(f, dossier); maj(i, { image_url: r.url }); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{q ? '✏️ Modifier la question' : '➕ Nouvelle question'}</DialogTitle>
          <DialogDescription>Les enfants entendent la question et les réponses (ta voix, sinon celle de l'appareil).</DialogDescription>
        </DialogHeader>
        <label className="text-xs font-semibold" htmlFor="quiz-question">Question</label>
        <Input id="quiz-question" value={question} maxLength={160} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
        <Voix url={audio} onUrl={setAudio} dossier={dossier} />
        <p className="text-xs font-semibold pt-1">Réponses (✅ = la bonne)</p>
        {choix.map((c, i) => (
          <div key={i} className={`rounded-xl border-2 p-2 space-y-1.5 ${c.juste ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : 'border-border'}`}>
            <div className="flex items-center gap-1.5">
              <Input value={c.emoji ?? ''} maxLength={8} onChange={(e) => maj(i, { emoji: e.target.value })} className="w-16 text-center text-xl" aria-label="Emoji" />
              <Input value={c.texte} maxLength={80} placeholder="Ce que dit la voix" onChange={(e) => maj(i, { texte: e.target.value })} className="flex-1 min-w-0" aria-label="Texte de la réponse"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
              <button type="button" onClick={() => maj(i, { juste: true })} aria-pressed={c.juste} aria-label="Bonne réponse" className={`h-9 w-9 shrink-0 rounded-full text-lg ${c.juste ? 'bg-emerald-500' : 'bg-muted'}`}>✅</button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Voix url={c.audio_url ?? null} onUrl={(u) => maj(i, { audio_url: u })} dossier={dossier} />
              <label className="cursor-pointer rounded-md border px-2 py-1 text-xs font-semibold">🖼️ {c.image_url ? 'Changer' : 'Image'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void envoyerImage(i, f); }} />
              </label>
              {c.image_url && <button type="button" className="text-xs underline" onClick={() => maj(i, { image_url: null })}>retirer l'image</button>}
              {choix.length > 2 && <button type="button" className="ms-auto text-xs text-destructive" onClick={() => setChoix((l) => l.filter((_, j) => j !== i))}>✕ retirer</button>}
            </div>
          </div>
        ))}
        {choix.length < 4 && <Button type="button" variant="outline" size="sm" onClick={() => setChoix((l) => [...l, { texte: '', emoji: '❓', juste: false }])}>➕ Une réponse</Button>}
        <Button onClick={() => void enregistrer()}>💾 Enregistrer</Button>
        {q && <Button variant="ghost" className="text-destructive" onClick={() => setSupprimer(true)}>🗑️ Supprimer la question</Button>}
        <ConfirmDeleteDialog open={supprimer} onOpenChange={setSupprimer} onConfirm={() => { setSupprimer(false); void retirer(); }}
          title="Supprimer cette question ?" description="Elle ira dans la corbeille de Paramètres ; tu pourras la restaurer." />
      </DialogContent>
    </Dialog>
  );
}
