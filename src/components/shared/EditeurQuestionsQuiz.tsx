import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { QuestionVideo } from '@/lib/quizVideo';

/**
 * ✏️ Modifier un quiz de vidéo, même déjà montré aux élèves (Nadia, 26/11 : « pouvoir toujours modifier les questions et
 * les réponses, et ça se met à jour instantanément »). Une question à la fois en édition ; « Enregistrer » écrit tout le quiz
 * (table `quiz_videos`, en direct chez les élèves par le temps réel ; hors ligne : gardé puis envoyé).
 */
const vide = (): QuestionVideo => ({ question: '', choix: ['', '', ''], bonne: 0, explication: '', emoji: null, arabe: null });
const entree = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } };

export function EditeurQuestionsQuiz({ questions, onEnregistrer }: { questions: QuestionVideo[]; onEnregistrer: (q: QuestionVideo[]) => void | Promise<void> }) {
  const [ouverte, setOuverte] = useState<number | null>(null);
  const [brouillon, setBrouillon] = useState<QuestionVideo | null>(null);
  const ouvrir = (i: number) => { setOuverte(i); setBrouillon(i < questions.length ? structuredClone(questions[i]) : vide()); };
  const fermer = () => { setOuverte(null); setBrouillon(null); };
  const valable = !!brouillon && brouillon.question.trim() && brouillon.choix.filter((c) => c.trim()).length >= 2 && brouillon.choix[brouillon.bonne]?.trim();
  const enregistrer = async () => {
    if (!brouillon || ouverte === null || !valable) return;
    const propre = { ...brouillon, question: brouillon.question.trim(), explication: brouillon.explication?.trim() || null };
    // Retirer les réponses vides en gardant la bonne réponse
    const bonneTexte = propre.choix[propre.bonne];
    propre.choix = propre.choix.map((c) => c.trim()).filter(Boolean);
    propre.bonne = Math.max(0, propre.choix.indexOf(bonneTexte.trim()));
    const liste = [...questions];
    if (ouverte < liste.length) liste[ouverte] = propre; else liste.push(propre);
    await onEnregistrer(liste);
    fermer();
  };
  const maj = (v: Partial<QuestionVideo>) => setBrouillon((b) => (b ? { ...b, ...v } : b));

  const formulaire = brouillon && (
    <div className="space-y-2 rounded-xl border bg-card p-2.5">
      <label className="block text-xs font-bold">Question</label>
      <Textarea value={brouillon.question} onChange={(e) => maj({ question: e.target.value })} rows={2} />
      <p className="text-xs font-bold">Réponses : touche le rond de la BONNE réponse</p>
      {brouillon.choix.map((c, j) => (
        <div key={j} className="flex items-center gap-2">
          <input type="radio" name="bonne" aria-label={`Réponse ${j + 1} est la bonne`} checked={brouillon.bonne === j} onChange={() => maj({ bonne: j })} className="h-5 w-5 accent-emerald-600 shrink-0" />
          <Input value={c} onKeyDown={entree} onChange={(e) => maj({ choix: brouillon.choix.map((x, k) => (k === j ? e.target.value : x)) })}
            className={brouillon.bonne === j ? 'border-emerald-500' : ''} placeholder={`Réponse ${j + 1}`} />
          {brouillon.choix.length > 2 && (
            <button type="button" aria-label="Retirer cette réponse" className="text-destructive font-bold px-1"
              onClick={() => maj({ choix: brouillon.choix.filter((_, k) => k !== j), bonne: brouillon.bonne === j ? 0 : brouillon.bonne > j ? brouillon.bonne - 1 : brouillon.bonne })}>✕</button>
          )}
        </div>
      ))}
      {brouillon.choix.length < 4 && <Button size="sm" variant="ghost" onClick={() => maj({ choix: [...brouillon.choix, ''] })}>➕ Une réponse</Button>}
      <label className="block text-xs font-bold">Explication (montrée après la réponse)</label>
      <Textarea value={brouillon.explication ?? ''} onChange={(e) => maj({ explication: e.target.value })} rows={2} />
      <div className="flex gap-2">
        <Button size="sm" disabled={!valable} onClick={() => void enregistrer()}>💾 Enregistrer</Button>
        <Button size="sm" variant="outline" onClick={fermer}>Annuler</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-1.5">
      <ol className="space-y-1.5 list-decimal ps-5">
        {questions.map((q, i) => (
          <li key={i} className="[overflow-wrap:anywhere]">
            {ouverte === i ? formulaire : (
              <>
                <span className="font-semibold">{q.question}</span>{q.arabe && <span className="font-arabic ms-1" dir="rtl">{q.arabe}</span>}
                <span className="block text-xs text-muted-foreground">✅ {q.choix[q.bonne]} · ✖️ {q.choix.filter((_, j) => j !== q.bonne).join(' · ')}</span>
                <span className="flex gap-3">
                  <button type="button" className="text-xs text-primary font-bold" onClick={() => ouvrir(i)}>✏️ modifier</button>
                  <button type="button" className="text-xs text-destructive font-bold" onClick={() => void onEnregistrer(questions.filter((_, j) => j !== i))}>✕ retirer cette question</button>
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
      {ouverte === questions.length ? formulaire : <Button size="sm" variant="outline" onClick={() => ouvrir(questions.length)}>➕ Ajouter une question</Button>}
    </div>
  );
}
