import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { untypedDb } from '@/lib/untypedDb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { SortableCardList } from '@/components/shared/SortableCardList';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { trashThenDelete } from '@/lib/trash';
import { enregistrerOrdre, horsLigne } from '@/lib/alphabetMedias';
import { preparerQuiz } from '@/lib/quizVideo';
import { useDeuxChances } from '@/hooks/useDeuxChances';
import { MessageReponse } from '@/components/shared/MessageReponse';
import { confettiLettres } from '@/lib/confettiLettres';
import { sonHarpeEtoiles } from '@/lib/sonSaison';
import { errorMessage } from '@/lib/utils';

/**
 * 🎯 Évaluation d'une particularité (Nadia, 2026-11-21) : une question à la fois, réponses mélangées, correction tout de suite.
 * Enseignante : ➕ ajouter, ✏️ modifier, ✋ appui long + glisser pour ranger, 🗑️ retirer (corbeille). Table `alphabet_quiz_questions`.
 * Hors ligne : les questions déjà vues restent jouables ; les modifications sont gardées et envoyées au retour du réseau.
 */
export interface Question { id: string; question: string; arabe: string | null; choix: string[]; bonne: number; explication: string | null; position: number; valide?: boolean }

const melanger = <T,>(t: T[]) => [...t].sort(() => Math.random() - 0.5);

export function QuizParticularite({ particuliereId, titre, titreArabe, video, isAdmin, userId }: {
  particuliereId: string; titre: string; titreArabe?: string | null;
  /** La vidéo de la leçon (lien ou fichier) : s'il y en a une et aucune question, le quiz se prépare tout seul (22/11) */
  video?: string | null;
  isAdmin: boolean; userId: string | null;
}) {
  const queryClient = useQueryClient();
  const [jeu, setJeu] = useState(false);
  const [edition, setEdition] = useState<Question | 'nouvelle' | null>(null);
  const [aRetirer, setARetirer] = useState<Question | null>(null);
  const cle = ['alphabet-quiz', particuliereId];
  const { data: questions = [], isFetched: charge } = useQuery({
    queryKey: cle,
    queryFn: async () => {
      const { data, error } = await untypedDb.from('alphabet_quiz_questions').select('id, question, arabe, choix, bonne, explication, position, valide')
        .eq('particularite_id', particuliereId).order('position').order('created_at');
      if (error) throw error;
      return (data || []) as Question[];
    },
  });
  const rafraichir = () => void queryClient.invalidateQueries({ queryKey: cle });
  // Élèves : seulement les questions validées ; enseignante : toutes (les brouillons sont signalés)
  const jouables = isAdmin ? questions : questions.filter((q) => q.valide !== false);
  const brouillons = questions.filter((q) => q.valide === false);

  // 🪄 Une vidéo et aucune question : l'IA prépare 10 questions (brouillon caché aux élèves), une seule fois par ouverture
  const [prepa, setPrepa] = useState<'non' | 'encours' | 'erreur'>('non');
  const tente = useRef(false);
  const preparer = async () => {
    if (horsLigne()) { toast.error('📡 Nécessite Internet pour préparer le quiz'); return; }
    setPrepa('encours');
    try {
      const { questions: qs, source } = await preparerQuiz({ sujet: `Leçon de lecture arabe « ${titre}${titreArabe ? ` (${titreArabe})` : ''} » (lettres particulières, tajwid de base)`, video });
      await ecrireOuGarder({ table: 'alphabet_quiz_questions', op: 'insert', rows: qs.map((q, i) => ({
        particularite_id: particuliereId, question: q.question, arabe: q.arabe ?? null, choix: q.choix, bonne: q.bonne,
        explication: q.explication ?? null, position: Math.max(0, ...questions.map((x) => x.position)) + (i + 1) * 10, valide: false })) });
      toast.success(`🪄 ${qs.length} questions préparées ${source === 'video' ? 'd\'après la vidéo' : 'd\'après le sujet de la leçon'} : relis-les, puis montre-les aux élèves`);
      setPrepa('non'); rafraichir();
    } catch (e) { setPrepa('erreur'); toast.error(`Quiz pas préparé : ${errorMessage(e)}`); }
  };
  useEffect(() => {
    if (!isAdmin || !video || !charge || questions.length || tente.current) return;
    tente.current = true;
    void preparer();
  }, [isAdmin, video, charge, questions.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const toutValider = async () => {
    queryClient.setQueryData<Question[]>(cle, (old) => (old || []).map((q) => ({ ...q, valide: true })));
    try {
      for (const q of brouillons) await ecrireOuGarder({ table: 'alphabet_quiz_questions', op: 'update', id: q.id, values: { valide: true } });
      toast.success('✅ Le quiz est visible par les élèves');
    } catch (e) { toast.error(errorMessage(e)); rafraichir(); }
  };

  const retirer = async (q: Question) => {
    if (!userId) return;
    try {
      await trashThenDelete({ userId, type: 'alphabet_quiz_question', id: q.id, label: `Question « ${q.question} » (${titre})`,
        data: { ...q, particularite_id: particuliereId }, remove: () => untypedDb.from('alphabet_quiz_questions').delete().eq('id', q.id) });
      toast.success('🗑️ Question dans la corbeille (Paramètres)');
      rafraichir();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  if (!jouables.length && !isAdmin) return null;

  return (
    <div className="space-y-2">
      {/* 🎯 Un gros bouton qui donne envie (Nadia, 2026-11-21) */}
      {isAdmin && brouillons.length > 0 && (
        <div className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
          <p className="text-sm font-bold">🪄 {brouillons.length} question{brouillons.length > 1 ? 's' : ''} préparée{brouillons.length > 1 ? 's' : ''} automatiquement : cachée{brouillons.length > 1 ? 's' : ''} aux élèves tant que tu ne valides pas.</p>
          <p className="text-xs text-muted-foreground">Relis-les (▶ « Teste-toi » ou ✏️ Gérer les questions), corrige si besoin, puis :</p>
          <Button size="sm" onClick={() => void toutValider()}>✅ Montrer ce quiz aux élèves</Button>
        </div>
      )}
      {isAdmin && prepa === 'encours' && <p className="rounded-2xl bg-violet-50 dark:bg-violet-950/30 p-3 text-sm font-semibold">🪄 Je prépare 10 questions sur la vidéo… (quelques secondes)</p>}
      {isAdmin && !questions.length && prepa !== 'encours' && (
        <Button size="sm" variant="outline" className="w-full" onClick={() => void preparer()}>🪄 Préparer 10 questions automatiquement{prepa === 'erreur' ? ' (réessayer)' : ''}</Button>
      )}
      {jouables.length > 0 ? (
        <button type="button" onClick={() => setJeu(true)}
          className="group relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 p-[3px] shadow-lg transition-transform active:scale-[0.98]">
          <span className="flex items-center gap-3 rounded-[22px] bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-white">
            <span className="text-4xl drop-shadow animate-bounce [animation-duration:2s]">🎯</span>
            <span className="flex-1 text-start">
              <span className="block text-lg font-extrabold leading-tight">Teste-toi !</span>
              <span className="block text-xs font-semibold text-white/85">{jouables.length} question{jouables.length > 1 ? 's' : ''} · une étape à la fois · ⭐ score à la fin</span>
            </span>
            <span className="h-12 w-12 shrink-0 rounded-full bg-white text-violet-700 grid place-items-center text-2xl font-black shadow-md group-hover:scale-110 transition-transform ps-1">▶</span>
          </span>
          <span aria-hidden className="pointer-events-none absolute inset-y-0 -start-1/3 w-1/3 skew-x-[-20deg] bg-white/25 animate-[reflet_3s_ease-in-out_infinite]" />
        </button>
      ) : isAdmin && <p className="text-sm font-bold">🎯 Évaluation : pas encore de question</p>}

      {isAdmin && (
        <details className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/20 p-2 [&_summary]:cursor-pointer">
          <summary className="text-sm font-semibold px-1">✏️ Gérer les questions ({questions.length})</summary>
          <div className="space-y-2 pt-2">
          <SortableCardList items={questions}
            onReorder={(n) => { void enregistrerOrdre('alphabet_quiz_questions', n.map((q) => q.id)).then(rafraichir, (e) => toast.error(errorMessage(e))); }}
            renderItem={(q, drag) => {
              const { ref, style, isDragging, ...attrs } = drag;
              return (
                <div key={q.id} ref={ref} style={style} {...attrs} className={`flex items-center gap-2 rounded-xl bg-card border border-border p-2 touch-manipulation ${isDragging ? 'opacity-50 ring-2 ring-sky-400' : ''}`}>
                  <p className="flex-1 min-w-0 text-sm [overflow-wrap:anywhere]">{q.valide === false && <span className="me-1 rounded-full bg-amber-200 px-1.5 text-[10px] font-extrabold text-amber-900">brouillon</span>}{q.question} {q.arabe && <span className="font-arabic text-base" dir="rtl">{q.arabe}</span>}</p>
                  <Button size="sm" variant="outline" onClick={() => setEdition(q)} aria-label="Modifier">✏️</Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => setARetirer(q)} aria-label="Retirer">🗑️</Button>
                </div>
              );
            }} />
          <Button size="sm" variant="outline" className="w-full" onClick={() => setEdition('nouvelle')}>➕ Ajouter une question</Button>
          </div>
        </details>
      )}

      {jeu && <Passage questions={jouables} titre={titre} onClose={() => setJeu(false)} />}
      {edition && <EditionQuestion q={edition === 'nouvelle' ? null : edition} particuliereId={particuliereId}
        position={Math.max(0, ...questions.map((q) => q.position)) + 10} onClose={() => setEdition(null)} rafraichir={rafraichir} />}
      <ConfirmDeleteDialog open={!!aRetirer} onOpenChange={(o) => !o && setARetirer(null)}
        onConfirm={() => { const q = aRetirer; setARetirer(null); if (q) void retirer(q); }}
        title="Retirer cette question ?" description="Elle ira dans la corbeille de Paramètres, tu pourras la restaurer." />
    </div>
  );
}

/** Le passage de l'évaluation : 2 chances par question, passage automatique, score à la fin (règle des quiz du 22/11) */
function Passage({ questions, titre, onClose }: { questions: Question[]; titre: string; onClose: () => void }) {
  const ordre = useMemo(() => questions.map((q) => ({ q, choix: melanger(q.choix.map((texte, i) => ({ texte, bon: i === q.bonne }))) })), [questions]);
  const j = useDeuxChances({
    nb: ordre.length,
    estBonne: (e, i) => !!ordre[e]?.choix[i]?.bon,
    texteBonne: (e) => ordre[e]?.choix.find((c) => c.bon)?.texte ?? '',
    explication: (e) => ordre[e]?.q.explication ?? null,
  });
  useEffect(() => { if (j.fini && ordre.length) { confettiLettres(); sonHarpeEtoiles(); } }, [j.fini, ordre.length]);
  const cur = ordre[j.etape];
  const score = Math.round(j.score * 10) / 10;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md" level="nested">
        <DialogHeader>
          <DialogTitle>🎯 {titre}</DialogTitle>
          <DialogDescription>{j.fini ? 'Résultat' : `Étape ${j.etape + 1} sur ${ordre.length}${j.rates.length && !j.message ? ' · 2e chance !' : ''}`}</DialogDescription>
        </DialogHeader>
        <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-violet-500 transition-all" style={{ width: `${(Math.min(j.etape, ordre.length) / ordre.length) * 100}%` }} /></div>
        {j.fini ? (
          <div className="text-center space-y-3 py-2">
            <p className="text-6xl">{score === ordre.length ? '🏆' : score >= ordre.length / 2 ? '🌟' : '💪'}</p>
            <p className="text-2xl font-extrabold">{score} / {ordre.length}</p>
            <p className="text-sm text-muted-foreground">{score === ordre.length ? 'Parfait, bravo !' : score >= ordre.length / 2 ? 'Très bien ! Encore un petit effort.' : 'Regarde encore la vidéo, puis réessaie.'}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={j.recommencer}>🔁 Recommencer</Button>
              <Button onClick={onClose}>Fermer</Button>
            </div>
          </div>
        ) : cur && (
          <div className="space-y-3">
            <p className="font-bold text-lg [overflow-wrap:anywhere]">{cur.q.question}</p>
            {cur.q.arabe && <p className="font-arabic text-5xl text-center leading-snug" dir="rtl">{cur.q.arabe}</p>}
            <div className="grid gap-2">
              {cur.choix.map((c, i) => {
                const montreBonne = (j.trouve !== null || !!j.message) && c.bon;
                const rate = j.rates.includes(i);
                const etat = montreBonne ? 'bg-emerald-100 border-emerald-500 dark:bg-emerald-950/40' : rate ? 'bg-red-100 border-red-500 dark:bg-red-950/40 opacity-70' : '';
                return (
                  <button key={i} type="button" onClick={() => j.toucher(i)} dir="auto" disabled={rate}
                    className={`rounded-xl border-2 border-border p-3 text-start font-semibold transition-all [overflow-wrap:anywhere] ${/[؀-ۿ]/.test(c.texte) ? 'font-arabic text-2xl text-center' : ''} ${etat}`}>
                    {montreBonne ? '✅ ' : rate ? '❌ ' : ''}{c.texte}
                  </button>
                );
              })}
            </div>
            {j.message && <MessageReponse m={j.message} onPasser={j.passer} />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** ✏️ Ajouter / modifier une question (2 à 4 réponses, on coche la bonne) */
function EditionQuestion({ q, particuliereId, position, onClose, rafraichir }: {
  q: Question | null; particuliereId: string; position: number; onClose: () => void; rafraichir: () => void;
}) {
  const [question, setQuestion] = useState(q?.question ?? '');
  const [arabe, setArabe] = useState(q?.arabe ?? '');
  const [choix, setChoix] = useState<string[]>(q?.choix ?? ['', '', '', '']);
  const [bonne, setBonne] = useState(q?.bonne ?? 0);
  const [explication, setExplication] = useState(q?.explication ?? '');
  const [saving, setSaving] = useState(false);

  const enregistrer = async () => {
    const remplis = choix.map((c, i) => ({ c: c.trim(), i })).filter((x) => x.c);
    if (!question.trim()) { toast.error('Écris la question'); return; }
    if (remplis.length < 2) { toast.error('Il faut au moins 2 réponses'); return; }
    if (!remplis.some((x) => x.i === bonne)) { toast.error('Coche la bonne réponse'); return; }
    const values = { question: question.trim(), arabe: arabe.trim() || null, choix: remplis.map((x) => x.c), bonne: remplis.findIndex((x) => x.i === bonne), explication: explication.trim() || null };
    setSaving(true);
    try {
      const r = q
        ? await ecrireOuGarder({ table: 'alphabet_quiz_questions', op: 'update', id: q.id, values })
        : await ecrireOuGarder({ table: 'alphabet_quiz_questions', op: 'insert', rows: [{ ...values, particularite_id: particuliereId, position }] });
      toast.success(r === 'en_attente' ? '📡 Gardé sur cet appareil, envoyé au retour du réseau' : q ? 'Question modifiée ✅' : 'Question ajoutée ✅');
      rafraichir(); onClose();
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto" level="nested">
        <DialogHeader>
          <DialogTitle>{q ? '✏️ Modifier la question' : '➕ Nouvelle question'}</DialogTitle>
          <DialogDescription>Coche la bonne réponse. Les réponses sont mélangées pour les élèves.</DialogDescription>
        </DialogHeader>
        <label className="text-xs font-semibold" htmlFor="qz-q">Question</label>
        <Input id="qz-q" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <label className="text-xs font-semibold" htmlFor="qz-a">Mot ou signe en arabe, en grand (facultatif)</label>
        <Input id="qz-a" dir="rtl" className="font-arabic text-xl" value={arabe} onChange={(e) => setArabe(e.target.value)} />
        <p className="text-xs font-semibold">Réponses (2 à 4)</p>
        {choix.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name="qz-bonne" className="h-5 w-5" checked={bonne === i} onChange={() => setBonne(i)} aria-label={`Bonne réponse ${i + 1}`} />
            <Input dir="auto" value={c} placeholder={`Réponse ${i + 1}${i >= 2 ? ' (facultatif)' : ''}`}
              onChange={(e) => setChoix((t) => t.map((x, j) => (j === i ? e.target.value : x)))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void enregistrer(); } }} />
          </div>
        ))}
        {choix.length < 4 && <Button size="sm" variant="ghost" onClick={() => setChoix((t) => [...t, ''])}>➕ Une réponse de plus</Button>}
        <label className="text-xs font-semibold" htmlFor="qz-e">Petite explication après la réponse (facultatif)</label>
        <Input id="qz-e" value={explication} onChange={(e) => setExplication(e.target.value)} />
        <Button disabled={saving} onClick={() => void enregistrer()}>{saving ? 'Enregistrement…' : '💾 Enregistrer'}</Button>
      </DialogContent>
    </Dialog>
  );
}
