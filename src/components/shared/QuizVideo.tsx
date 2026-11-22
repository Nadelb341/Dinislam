import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { untypedDb } from '@/lib/untypedDb';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { trashThenDelete } from '@/lib/trash';
import { horsLigne } from '@/lib/alphabetMedias';
import { errorMessage } from '@/lib/utils';
import { preparerQuiz, type QuestionVideo } from '@/lib/quizVideo';
import { confettiLettres } from '@/lib/confettiLettres';
import { sonHarpeEtoiles } from '@/lib/sonSaison';
import { sonErreur } from '@/lib/sonsErreur';
import { parler } from '@/lib/petits';

/**
 * 🎯 Le quiz de 10 questions d'une vidéo, n'importe où dans l'appli (Nadia, 22/11 : « je ne veux pas avoir à le redemander »).
 * Dès qu'une vidéo est là, l'IA gratuite prépare le quiz (elle regarde la vidéo si c'est YouTube ; sinon elle part du sujet).
 * Il reste un BROUILLON caché aux élèves : l'enseignante l'essaie, retire les questions qui ne vont pas, puis « ✅ Montrer ».
 * Tout-petits : questions et réponses DITES à voix haute, grandes images. Une erreur = son doux, on continue jusqu'à la bonne réponse.
 * Table `quiz_videos` (une ligne par vidéo : `cible` = « histoire_video:<id> », « zone:<id> »…).
 */
interface QuizRow { id: string; cible: string; questions: QuestionVideo[]; statut: 'brouillon' | 'valide'; source: string | null }

export function QuizVideo({ cible, sujet, video, isAdmin, petits = false }: {
  cible: string; sujet: string; video?: string | null; isAdmin: boolean; petits?: boolean;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const cle = ['quiz-video', cible];
  const { data: quiz = null, isFetched } = useQuery({
    queryKey: cle,
    queryFn: async () => {
      const { data, error } = await untypedDb.from('quiz_videos').select('id, cible, questions, statut, source').eq('cible', cible).maybeSingle();
      if (error) throw error;
      return (data as QuizRow | null) ?? null;
    },
  });
  const rafraichir = () => void queryClient.invalidateQueries({ queryKey: cle });
  const [prepa, setPrepa] = useState<'non' | 'encours' | 'erreur'>('non');
  const [jeu, setJeu] = useState(false);
  const [relire, setRelire] = useState(false);
  const [refaire, setRefaire] = useState(false);
  const tente = useRef(false);

  const preparer = async () => {
    if (horsLigne()) { toast.error('📡 Nécessite Internet pour préparer le quiz'); return; }
    setPrepa('encours');
    try {
      const { questions, source } = await preparerQuiz({ sujet, video, public: petits ? 'petits' : 'grands' });
      const r = await ecrireOuGarder({ table: 'quiz_videos', op: 'upsert', rows: [{ cible, questions, statut: 'brouillon', source, updated_at: new Date().toISOString() }] });
      if (r === 'ok') toast.success(`🪄 Quiz de ${questions.length} questions préparé ${source === 'video' ? 'd\'après la vidéo' : 'd\'après le sujet'} : relis-le avant de le montrer`);
      setPrepa('non'); rafraichir();
    } catch (e) { setPrepa('erreur'); toast.error(`Quiz pas préparé : ${errorMessage(e)}`); }
  };
  // 🪄 Une vidéo sans quiz : il se prépare tout seul (une fois), côté enseignante
  useEffect(() => {
    if (!isAdmin || !isFetched || quiz || tente.current) return;
    tente.current = true;
    void preparer();
  }, [isAdmin, isFetched, quiz]); // eslint-disable-line react-hooks/exhaustive-deps

  const changer = async (values: Partial<QuizRow>) => {
    if (!quiz) return;
    queryClient.setQueryData<QuizRow | null>(cle, { ...quiz, ...values });
    try { await ecrireOuGarder({ table: 'quiz_videos', op: 'update', id: quiz.id, values: { ...values, updated_at: new Date().toISOString() } }); }
    catch (e) { toast.error(errorMessage(e)); rafraichir(); }
  };
  const recommencer = async () => {
    if (!quiz || !user) return;
    try {
      await trashThenDelete({ userId: user.id, type: 'quiz_video', id: quiz.id, label: `Quiz de la vidéo « ${sujet} »`, data: quiz,
        remove: () => untypedDb.from('quiz_videos').delete().eq('id', quiz.id) });
      queryClient.setQueryData(cle, null);
      await preparer();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const visibleEleves = quiz?.statut === 'valide';
  if (!isAdmin && !visibleEleves) return null;
  return (
    <div className="space-y-2">
      {quiz && (visibleEleves || isAdmin) && (
        <button type="button" onClick={() => setJeu(true)}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-white font-extrabold shadow-md flex items-center gap-3 active:scale-[0.98] transition-transform">
          <span className="text-3xl">🎯</span>
          <span className="flex-1 text-start">{petits ? 'Le quiz qu\'on écoute' : 'Le quiz de la vidéo'} <span className="block text-xs font-semibold opacity-90">{quiz.questions.length} questions</span></span>
          <span className="text-2xl">▶</span>
        </button>
      )}
      {isAdmin && (
        <div className={`rounded-2xl border-2 p-2.5 space-y-2 text-sm ${visibleEleves ? 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20' : 'border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/30'}`}>
          {prepa === 'encours' ? <p className="font-semibold">🪄 Je prépare 10 questions sur cette vidéo… (quelques secondes)</p>
            : !quiz ? (
              <Button size="sm" variant="outline" onClick={() => void preparer()}>🪄 Préparer le quiz (10 questions){prepa === 'erreur' ? ' : réessayer' : ''}</Button>
            ) : (
              <>
                <p className="font-bold">{visibleEleves ? '✅ Quiz visible par les élèves' : '🪄 Quiz préparé automatiquement : caché aux élèves tant que tu ne valides pas'}
                  {quiz.source === 'sujet' && <span className="block text-xs font-normal text-muted-foreground">Préparé d'après le sujet (l'IA ne peut pas regarder une vidéo envoyée en fichier) : relis-le bien.</span>}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setRelire((v) => !v)}>{relire ? 'Fermer' : '✏️ Relire les questions'}</Button>
                  {visibleEleves
                    ? <Button size="sm" variant="outline" onClick={() => void changer({ statut: 'brouillon' })}>🙈 Cacher aux élèves</Button>
                    : <Button size="sm" onClick={() => void changer({ statut: 'valide' })}>✅ Montrer aux élèves</Button>}
                  <Button size="sm" variant="ghost" onClick={() => setRefaire(true)}>🔁 Refaire</Button>
                </div>
                {relire && (
                  <ol className="space-y-1.5 list-decimal ps-5">
                    {quiz.questions.map((q, i) => (
                      <li key={i} className="[overflow-wrap:anywhere]">
                        <span className="font-semibold">{q.question}</span>{q.arabe && <span className="font-arabic ms-1" dir="rtl">{q.arabe}</span>}
                        <span className="block text-xs text-muted-foreground">✅ {q.choix[q.bonne]} · ✖️ {q.choix.filter((_, j) => j !== q.bonne).join(' · ')}</span>
                        <button type="button" className="text-xs text-destructive font-bold" onClick={() => void changer({ questions: quiz.questions.filter((_, j) => j !== i) })}>✕ retirer cette question</button>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )}
        </div>
      )}
      {jeu && quiz && <Partie questions={quiz.questions} petits={petits} titre={sujet} onClose={() => setJeu(false)} />}
      <ConfirmDeleteDialog open={refaire} onOpenChange={setRefaire} onConfirm={() => { setRefaire(false); void recommencer(); }}
        title="Refaire ce quiz ?" description="L'ancien quiz ira dans la corbeille de Paramètres, et l'IA en prépare un nouveau." />
    </div>
  );
}

const melanger = <T,>(t: T[]) => [...t].sort(() => Math.random() - 0.5);

function Partie({ questions, petits, titre, onClose }: { questions: QuestionVideo[]; petits: boolean; titre: string; onClose: () => void }) {
  const [n, setN] = useState(0);
  const [rates, setRates] = useState<number[]>([]);
  const [trouve, setTrouve] = useState(false);
  const q = questions[n];
  const fini = n >= questions.length;
  const ordre = useMemo(() => (q ? melanger(q.choix.map((_, i) => i)) : []), [q]);
  useEffect(() => { if (petits && q) parler(q.question, 'fr'); }, [petits, q]);

  const toucher = (i: number) => {
    if (!q || trouve) return;
    if (petits) parler(q.choix[i], 'fr');
    if (i === q.bonne) {
      setTrouve(true); sonHarpeEtoiles();
      setTimeout(() => { setN((x) => x + 1); setRates([]); setTrouve(false); if (n + 1 >= questions.length) confettiLettres(['⭐']); }, 1300);
    } else { sonErreur(); setRates((r) => [...r, i]); }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto" level="nested">
        <DialogHeader>
          <DialogTitle className="[overflow-wrap:anywhere]">🎯 {titre}</DialogTitle>
          <DialogDescription>{fini ? 'Bravo !' : `Question ${n + 1} sur ${questions.length}`}</DialogDescription>
        </DialogHeader>
        <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-violet-500 transition-all" style={{ width: `${(Math.min(n, questions.length) / questions.length) * 100}%` }} /></div>
        {fini ? (
          <div className="text-center space-y-3 py-3">
            <p className="text-6xl">🏆</p>
            <p className="text-xl font-extrabold">Tu as trouvé toutes les réponses !</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => { setN(0); setRates([]); }}>🔁 Recommencer</Button>
              <Button onClick={onClose}>Fermer</Button>
            </div>
          </div>
        ) : q && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              {petits && <button type="button" onClick={() => parler(q.question, 'fr')} aria-label="Réécouter la question" className="h-12 w-12 shrink-0 rounded-full bg-violet-100 text-2xl">🔊</button>}
              <p className="flex-1 font-bold [overflow-wrap:anywhere]">{q.question}</p>
            </div>
            {q.arabe && <p className="font-arabic text-3xl text-center" dir="rtl">{q.arabe}</p>}
            <div className="space-y-2">
              {ordre.map((i) => {
                const rate = rates.includes(i), bon = trouve && i === q.bonne;
                return (
                  <button key={i} type="button" onClick={() => toucher(i)} aria-label={q.choix[i]}
                    className={`w-full rounded-2xl border-2 transition-all active:scale-95 text-start font-semibold ${petits ? 'px-4 py-4 text-2xl' : 'px-3 py-2.5'} ${bon ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : rate ? 'border-border opacity-40' : 'border-border bg-card'}`}>
                    <span dir="auto" className="[overflow-wrap:anywhere]">{q.choix[i]}</span>
                  </button>
                );
              })}
            </div>
            {trouve && q.explication && <p className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-2 text-sm">✅ {q.explication}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
