import { useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { useReglage } from '@/hooks/usePetits';
import { useDeuxChances } from '@/hooks/useDeuxChances';
import { useConfetti } from '@/hooks/useConfetti';
import { MessageReponse } from '@/components/shared/MessageReponse';
import { ZonesContenu } from '@/components/shared/ZonesContenu';
import { DegreAuthenticite } from '@/components/shared/DegreAuthenticite';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DEGRES } from '@/lib/degreAuthenticite';
import { cn } from '@/lib/utils';
import { NIVEAUX_DEPART, contenuNiveaux, quizNiveaux, type ContenuNiveaux } from '@/data/niveauxAuthenticite';

/**
 * 📊 « Niveaux d'authenticité » (dans la carte Hadiths, 27/11, règle n°1 de Nadia) : les 4 niveaux en arabe et en français,
 * la phrase de Nadia, un exemple avec sa référence, la divergence, la remarque des Fada'il al-A'mal, l'ordre des sources,
 * et un petit quiz (4 questions, 2 chances). Mêmes couleurs que la pastille. ✏️ Nadia change tous les textes
 * (réglage `niveaux_authenticite`) + zones de contenu (images, vidéos, PDF…) sous la carte. Hors ligne : dernière copie,
 * sinon le texte de départ (`src/data/niveauxAuthenticite.ts`).
 */
export function NiveauxAuthenticite({ isAdmin }: { isAdmin: boolean }) {
  const { valeur, changer } = useReglage<unknown>('niveaux_authenticite', NIVEAUX_DEPART);
  const c = useMemo(() => contenuNiveaux(valeur), [valeur]);
  const [edition, setEdition] = useState(false);

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl border-2 border-violet-300 bg-gradient-to-br from-violet-100 via-white to-amber-50 p-4 text-violet-950 shadow-sm dark:border-violet-700 dark:from-violet-950 dark:via-slate-900 dark:to-slate-900 dark:text-violet-50">
        <h2 className="text-xl font-black">📊 Niveaux d'authenticité</h2>
        <p className="font-arabic text-lg" dir="rtl">درجات الحديث</p>
        <p className="mt-1 text-sm leading-relaxed [overflow-wrap:anywhere]">{c.intro}</p>
        {isAdmin && (
          <Button type="button" size="sm" variant="outline" onClick={() => setEdition(true)} className="mt-2 bg-white text-violet-900 dark:bg-slate-800 dark:text-violet-100">
            <Pencil className="h-4 w-4 mr-1" /> Modifier les textes
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {c.niveaux.map((n, i) => {
          const d = DEGRES[n.cle];
          return (
            <section key={n.cle} className={cn('rounded-2xl border-2 bg-gradient-to-br p-4 shadow-sm space-y-2', d.carte)}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-2xl" aria-hidden>{i + 1}</span>
                <h3 className="text-2xl font-black tracking-wide">{d.nom}</h3>
                <span className="font-arabic text-2xl font-bold" dir="rtl">{d.ar}</span>
                <span className="text-lg font-extrabold">· {d.fr}</span>
              </div>
              <p className="font-semibold [overflow-wrap:anywhere]">{n.phrase}</p>
              {n.exemple && (
                <div className="rounded-xl bg-white/80 p-3 text-slate-900 ring-1 ring-black/5 dark:bg-slate-900/70 dark:text-slate-50">
                  <p className="text-xs font-bold uppercase tracking-wide opacity-80">Exemple</p>
                  <p className="text-sm [overflow-wrap:anywhere]">{n.exemple}</p>
                  {n.exemple_source && (
                    <p className="mt-1 flex flex-wrap items-center gap-1 text-xs opacity-90">
                      <span className="[overflow-wrap:anywhere]">📚 {n.exemple_source}</span>
                      <DegreAuthenticite degre={n.cle} compact interactif={false} />
                    </p>
                  )}
                </div>
              )}
              {n.note && <p className="text-sm [overflow-wrap:anywhere]">💡 {n.note}</p>}
            </section>
          );
        })}
      </div>

      <section className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50">
        <h3 className="font-black">⚖️ Quand les spécialistes ne sont pas d'accord</h3>
        <p className="mt-1 text-sm [overflow-wrap:anywhere]">{c.divergence}</p>
        <div className="mt-2"><DegreAuthenticite degre="hasan" divergence="Exemple : jugé bon par un savant, faible par un autre." /></div>
      </section>

      <section className="rounded-2xl border-2 border-teal-300 bg-teal-50 p-4 text-teal-950 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-50">
        <h3 className="font-black">🌿 Le hadith faible et les mérites des œuvres (Fada'il al-A'mal)</h3>
        <p className="mt-1 text-sm [overflow-wrap:anywhere]">{c.fadail}</p>
      </section>

      <section className="rounded-2xl border-2 border-indigo-300 bg-indigo-50 p-4 text-indigo-950 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-50">
        <h3 className="font-black">🪜 {c.ordre_titre}</h3>
        <ol className="mt-2 space-y-1.5">
          {c.ordre.map((o, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-xs font-black text-white">{i + 1}</span>
              <span className="pt-0.5 [overflow-wrap:anywhere]">{o}</span>
            </li>
          ))}
        </ol>
        {c.ordre_note && <p className="mt-2 text-xs font-semibold [overflow-wrap:anywhere]">{c.ordre_note}</p>}
      </section>

      <ZonesContenu cible="carte:niveaux-authenticite" isAdmin={isAdmin} libelle="Niveaux d'authenticité" />

      <QuizNiveaux c={c} />

      {isAdmin && edition && (
        <EditionNiveaux c={c} onClose={() => setEdition(false)} onSave={async (v) => { await changer(v); setEdition(false); }} />
      )}
    </div>
  );
}

/** ❓ 4 questions, règle des quiz de Nadia (1er coup → suivante ; erreur → 2e chance ; puis la bonne réponse expliquée) */
function QuizNiveaux({ c }: { c: ContenuNiveaux }) {
  const questions = useMemo(() => quizNiveaux(c), [c]);
  const j = useDeuxChances({
    nb: questions.length,
    estBonne: (e, i) => questions[e]?.bonne === i,
    texteBonne: (e) => questions[e]?.choix[questions[e].bonne] ?? '',
    explication: (e) => questions[e]?.explication ?? null,
  });
  const { fireConfetti } = useConfetti();
  useEffect(() => { if (j.fini) fireConfetti(); }, [j.fini, fireConfetti]);
  const q = questions[j.etape];
  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-950 space-y-3 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-50">
      <h3 className="font-black">❓ Petit quiz : 4 questions</h3>
      {q && !j.fini && (
        <>
          <p className="text-xs font-bold">Question {j.etape + 1}/{questions.length}</p>
          <p className="text-lg font-extrabold [overflow-wrap:anywhere]">{q.question}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.choix.map((t, i) => {
              const rate = j.rates.includes(i), trouve = j.trouve === i;
              return (
                <button key={i} type="button" onClick={() => j.toucher(i)} disabled={rate}
                  className={cn('rounded-2xl border-2 px-3 py-3 text-left font-bold transition active:scale-[0.99] [overflow-wrap:anywhere]',
                    trouve ? 'bg-emerald-500 border-emerald-600 text-white' : rate ? 'bg-rose-100 border-rose-300 text-rose-900 line-through opacity-70' : 'bg-white border-amber-200 text-slate-900 hover:border-amber-400')}>
                  {t}
                </button>
              );
            })}
          </div>
          {j.message && <MessageReponse m={j.message} onPasser={j.passer} />}
        </>
      )}
      {j.fini && (
        <div className="text-center space-y-2">
          <p className="text-2xl font-black">🌟 {Math.round(j.score * 10) / 10} / {questions.length}</p>
          <p className="font-bold">Bravo ! Tu connais les niveaux des hadiths 🤍</p>
          <button type="button" onClick={j.recommencer} className="rounded-full bg-amber-500 px-5 py-2 font-extrabold text-amber-950 shadow">🔁 Rejouer</button>
        </div>
      )}
    </section>
  );
}

/** ✏️ Tous les textes de la carte (enseignante). « Revenir au texte de départ » demande confirmation. */
function EditionNiveaux({ c, onClose, onSave }: { c: ContenuNiveaux; onClose: () => void; onSave: (v: ContenuNiveaux) => Promise<void> }) {
  const [v, setV] = useState<ContenuNiveaux>(c);
  const [saving, setSaving] = useState(false);
  const [depart, setDepart] = useState(false);
  const champNiveau = (i: number, k: 'phrase' | 'exemple' | 'exemple_source' | 'note', val: string) =>
    setV((x) => ({ ...x, niveaux: x.niveaux.map((n, j) => (j === i ? { ...n, [k]: val } : n)) }));
  const zone = (label: string, val: string, set: (s: string) => void, rows = 3) => (
    <label className="block space-y-1">
      <span className="text-xs font-semibold">{label}</span>
      <Textarea rows={rows} value={val} onChange={(e) => set(e.target.value)} />
    </label>
  );
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>✏️ Niveaux d'authenticité</DialogTitle>
          <DialogDescription>Change les textes de la carte. Les images, vidéos et PDF s'ajoutent dans les zones sous la carte.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {zone('Introduction', v.intro, (s) => setV({ ...v, intro: s }))}
          {v.niveaux.map((n, i) => (
            <fieldset key={n.cle} className={cn('rounded-xl border-2 bg-gradient-to-br p-2.5 space-y-2', DEGRES[n.cle].carte)}>
              <legend className="px-1 font-black">{DEGRES[n.cle].nom} · {DEGRES[n.cle].fr}</legend>
              {zone('Phrase', n.phrase, (s) => champNiveau(i, 'phrase', s), 2)}
              {zone('Exemple', n.exemple, (s) => champNiveau(i, 'exemple', s), 2)}
              <label className="block space-y-1">
                <span className="text-xs font-semibold">Référence de l'exemple</span>
                <Input value={n.exemple_source} onChange={(e) => champNiveau(i, 'exemple_source', e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
              </label>
              {zone('Petite remarque (facultatif)', n.note, (s) => champNiveau(i, 'note', s), 2)}
            </fieldset>
          ))}
          {zone('Divergence', v.divergence, (s) => setV({ ...v, divergence: s }))}
          {zone("Hadith faible et Fada'il al-A'mal", v.fadail, (s) => setV({ ...v, fadail: s }), 4)}
          {zone("L'ordre des sources (une par ligne)", v.ordre.join('\n'), (s) => setV({ ...v, ordre: s.split('\n') }), 5)}
          {zone('Remarque sous l\'ordre des sources', v.ordre_note, (s) => setV({ ...v, ordre_note: s }), 2)}
          <div className="flex flex-wrap justify-between gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setDepart(true)}>↩️ Revenir au texte de départ</Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
              <Button type="button" disabled={saving} onClick={async () => {
                setSaving(true);
                try { await onSave({ ...v, ordre: v.ordre.map((o) => o.trim()).filter(Boolean) }); } finally { setSaving(false); }
              }}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
            </div>
          </div>
        </div>
        <AlertDialog open={depart} onOpenChange={setDepart}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revenir au texte de départ ?</AlertDialogTitle>
              <AlertDialogDescription>Les textes de cette fenêtre reprennent le texte de départ. Rien n'est enregistré tant que tu n'appuies pas sur « Enregistrer ».</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => setV(NIVEAUX_DEPART)}>↩️ Revenir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
