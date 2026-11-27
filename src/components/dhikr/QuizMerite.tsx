import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useDeuxChances } from '@/hooks/useDeuxChances';
import { MessageReponse } from '@/components/shared/MessageReponse';
import { useConfetti } from '@/hooks/useConfetti';
import { cn } from '@/lib/utils';
import { degreAffiche, texteDegre } from '@/lib/degreAuthenticite';
import { PastilleSource } from '@/components/shared/DegreAuthenticite';
import type { DhikrQuestion } from '@/data/dhikrContenu';
import type { Couleurs } from './Ambiance';
import { BadgeStatut } from './Series';

/**
 * ❓ IDÉE 6 · Le mini-quiz du mérite (« Quel dhikr est un trésor du Paradis ? »…) : vraies réponses et leurs sources.
 * Règle des quiz de Nadia (22/11) : juste du 1er coup → question suivante ; erreur → 2e chance ; puis la bonne réponse expliquée.
 * Rien à gagner (pas de points). ✏️ l'enseignante ajoute / modifie / supprime (corbeille) les questions.
 */
const melanger = <T,>(l: T[]) => { const a = [...l]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function QuizMerite({ questions, isAdmin, ambiance, onEditer, onNouveau }: {
  questions: DhikrQuestion[]; isAdmin: boolean; ambiance: Couleurs;
  onEditer: (q: DhikrQuestion) => void; onNouveau: () => void;
}) {
  const [partie, setPartie] = useState(0);
  const jouables = useMemo(() => questions.filter((q) => q.visible && q.choix.length >= 2), [questions]);
  const ordre = useMemo(
    () => melanger(jouables).slice(0, 8).map((q) => ({ q, choix: melanger(q.choix.map((t, i) => ({ t, bon: i === q.bonne }))) })),
    // Nouvelle partie = nouveau tirage
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jouables, partie],
  );
  const j = useDeuxChances({
    nb: ordre.length,
    estBonne: (e, i) => !!ordre[e]?.choix[i]?.bon,
    texteBonne: (e) => ordre[e]?.choix.find((c) => c.bon)?.t ?? '',
    explication: (e) => {
      const q = ordre[e]?.q; if (!q) return null;
      const d = degreAffiche(q.source, q.degre).degre; // 🕌 27/11 : le degré avec la source
      return [q.explication, q.source ? `📚 ${q.source}${d ? ` · ${texteDegre(d)}` : ''}` : null].filter(Boolean).join(' ');
    },
  });
  const { fireConfetti } = useConfetti();
  useEffect(() => { if (j.fini && ordre.length) fireConfetti(); }, [j.fini, ordre.length, fireConfetti]);
  const nuit = ambiance.nom === 'nuit';
  const carte = nuit ? 'bg-white/10 border-white/20' : 'bg-white/85 border-white';
  const cur = ordre[j.etape];

  return (
    <div className="space-y-3">
      {!ordre.length && <p className="text-center font-bold">🛠️ En cours de mise à jour</p>}
      {cur && !j.fini && (
        <div className={cn('rounded-3xl border p-4 space-y-3', carte)}>
          <p className="text-xs font-bold" style={{ color: ambiance.doux }}>Question {j.etape + 1}/{ordre.length}</p>
          <h3 className="text-lg font-extrabold [overflow-wrap:anywhere]">{cur.q.question}</h3>
          <div className="grid gap-2">
            {cur.choix.map((c, i) => {
              const rate = j.rates.includes(i), trouve = j.trouve === i;
              return (
                <button key={i} type="button" onClick={() => j.toucher(i)} disabled={rate}
                  className={cn('rounded-2xl border-2 px-3 py-3 text-left font-bold transition active:scale-[0.99] [overflow-wrap:anywhere]',
                    trouve ? 'bg-emerald-500 border-emerald-600 text-white' : rate ? 'bg-rose-100 border-rose-300 text-rose-900 line-through opacity-70' : 'bg-white border-amber-200 text-slate-900 hover:border-amber-400')}>
                  {c.t}
                </button>
              );
            })}
          </div>
          {j.message && <MessageReponse m={j.message} onPasser={j.passer} />}
        </div>
      )}
      {j.fini && ordre.length > 0 && (
        <div className={cn('rounded-3xl border p-4 text-center space-y-2', carte)}>
          <p className="text-2xl font-black">🌟 {Math.round(j.score * 10) / 10} / {ordre.length}</p>
          <p className="font-bold">Ma shâ' Allah ! Chaque dhikr a son trésor 🤍</p>
          <button type="button" onClick={() => { setPartie((p) => p + 1); j.recommencer(); }} className="rounded-full bg-amber-500 text-amber-950 px-5 py-2 font-extrabold shadow">🔁 Rejouer</button>
        </div>
      )}
      {isAdmin && (
        <details className={cn('rounded-3xl border p-3', carte)}>
          <summary className="cursor-pointer font-extrabold">✏️ Les questions du quiz ({questions.length})</summary>
          <div className="mt-2 space-y-1.5">
            {questions.map((q) => (
              <div key={q.id} className="flex items-start gap-2 rounded-xl border p-2 bg-white/70 text-slate-900">
                <div className="flex-1 min-w-0"><p className="text-sm font-bold [overflow-wrap:anywhere]">{q.question}</p><p className="text-xs">✅ {q.choix[q.bonne]} · {q.source} <PastilleSource source={q.source} degre={q.degre} divergence={q.degre_divergence} aVerifier interactif={false} /></p>
                  <div className="flex gap-1 mt-0.5"><BadgeStatut g={{ statut: 'ok', visible: q.visible }} /></div></div>
                <button type="button" onClick={() => onEditer(q)} aria-label="Modifier la question" className="h-8 w-8 shrink-0 grid place-items-center rounded-full bg-white border"><Pencil className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" onClick={onNouveau} className="w-full rounded-xl border-2 border-dashed border-amber-400 py-2 font-bold inline-flex items-center justify-center gap-1"><Plus className="h-4 w-4" /> Nouvelle question</button>
          </div>
        </details>
      )}
    </div>
  );
}
