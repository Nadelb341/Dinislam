import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CORAN_ORDERED } from '@/data/sourates';
import { SURA_PAGE, SURA_REVELATION_ORDER, juzOfPage } from '@/data/coranMeta';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { useEditDraft } from '@/hooks/useCreationDraft';
import { DraftRestoredBanner } from '@/components/shared/DraftRestoredBanner';
import { toast } from 'sonner';
import { errorMessage, cn } from '@/lib/utils';
import { useConfetti } from '@/hooks/useConfetti';
import { STORIES_WITH_DOUBT } from '@/lib/coranPages';
import type { Tables, Json } from '@/integrations/supabase/types';

type Story = Tables<'sourate_stories'>;
type Source = { ref: string; url?: string; porte_sur?: string };

interface Props {
  /** Ouvre le lecteur sur la page de la sourate */
  onRead: (page: number) => void;
  /** Fiche à ouvrir tout de suite (lien « Sourate du jour » de l'accueil) */
  initialOpen?: number;
}


/**
 * 🕋 Lieu de révélation (2026-10-25) : sourates mecquoises / médinoises, et la fiche-histoire de chacune
 * (versets, page, Juz', ordre de révélation, circonstances, mérite, sources authentiques).
 * Les élèves ne voient une fiche qu'après sa validation par l'enseignante ; l'enseignante peut la corriger ici.
 */
export function CoranRevelationTab({ onRead, initialOpen }: Props) {
  const { isAdmin } = useAuth();
  const [place, setPlace] = useState<'Mecquoise' | 'Médinoise'>('Mecquoise');
  const [byRevelation, setByRevelation] = useState(false);
  const [open, setOpen] = useState<number | null>(initialOpen && initialOpen >= 1 && initialOpen <= 114 ? initialOpen : null);
  const queryClient = useQueryClient();
  const { askValidation, validationDialog } = useConfirmValidation();

  const { data: stories = [] } = useQuery({
    queryKey: ['sourate-stories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sourate_stories').select('*');
      if (error) throw error;
      return data || [];
    },
  });
  const storyOf = (n: number) => stories.find((s) => s.sourate_number === n);

  const list = useMemo(() => {
    const l = CORAN_ORDERED.filter((s) => s.revelation_type === place);
    return byRevelation ? [...l].sort((a, b) => SURA_REVELATION_ORDER[a.number - 1] - SURA_REVELATION_ORDER[b.number - 1]) : l;
  }, [place, byRevelation]);
  const toReview = isAdmin ? stories.filter((s) => !s.validated).length : 0;
  const noDoubtToValidate = isAdmin ? stories.filter((s) => !s.validated && !STORIES_WITH_DOUBT.includes(s.sourate_number)) : [];
  const validateNoDoubt = async () => {
    const ids = noDoubtToValidate.map((s) => s.sourate_number);
    const { error } = await supabase.from('sourate_stories').update({ validated: true, updated_at: new Date().toISOString() }).in('sourate_number', ids);
    if (error) { toast.error(errorMessage(error)); return; }
    queryClient.invalidateQueries({ queryKey: ['sourate-stories'] });
    toast.success(`✅ ${ids.length} fiches validées : les élèves les voient maintenant`);
  };

  return (
    <div className="space-y-3">
      <div className="flex rounded-xl bg-[#f1e5da] dark:bg-[#33201e] p-1">
        {(['Mecquoise', 'Médinoise'] as const).map((p) => (
          <button key={p} type="button" aria-pressed={place === p} onClick={() => setPlace(p)}
            className={cn('flex-1 rounded-lg py-2 text-sm font-bold transition-colors',
              place === p ? 'bg-white text-[#7a1d22] shadow-sm dark:bg-[#221413] dark:text-[#e08a8f]' : 'text-[#75605a] dark:text-[#bfa79f]')}>
            {p === 'Mecquoise' ? '🕋 Mecquoises · 86' : '🕌 Médinoises · 28'}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setByRevelation((v) => !v)}
          className="rounded-full border border-[#c39a3e] px-3 py-1 text-xs font-bold text-[#8a6512] dark:text-[#e0bb62]">
          {byRevelation ? '📖 Ranger dans l\'ordre du Coran' : '⏳ Ranger dans l\'ordre de révélation'}
        </button>
        {isAdmin && toReview > 0 && (
          <span className="rounded-full bg-[#c0392b] text-white text-xs font-bold px-3 py-1">📝 {toReview} fiche{toReview > 1 ? 's' : ''} à relire</span>
        )}
      </div>
      {isAdmin && noDoubtToValidate.length > 0 && (
        <div className="rounded-2xl border border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-3 space-y-2">
          <p className="text-xs text-green-900 dark:text-green-100">
            {noDoubtToValidate.length} fiche{noDoubtToValidate.length > 1 ? 's' : ''} sans point de doute attend{noDoubtToValidate.length > 1 ? 'ent' : ''} ta validation.
            Les {STORIES_WITH_DOUBT.length} fiches à doute (marquées ⚠️) restent à valider une par une.
          </p>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => askValidation(`Valider ${noDoubtToValidate.length} fiches ?`, 'Toutes les fiches sans point de doute seront visibles par les élèves. Les fiches marquées ⚠️ ne sont pas concernées.', () => void validateNoDoubt())}>
            ✅ Valider toutes les fiches sans doute ({noDoubtToValidate.length})
          </Button>
        </div>
      )}
      <div className="space-y-1.5">
        {list.map((s) => {
          const st = storyOf(s.number);
          const page = SURA_PAGE[s.number - 1];
          return (
            <button key={s.number} type="button" onClick={() => setOpen(s.number)}
              className="w-full flex items-center gap-2.5 rounded-xl border border-[#e6d9cc] dark:border-[#3a2523] bg-white dark:bg-[#221413] px-3 py-2.5 text-left">
              <span className="h-8 w-8 shrink-0 rounded-lg bg-[#f5ead1] text-[#8a6512] dark:bg-[#3b2e14] dark:text-[#e0bb62] grid place-items-center text-xs font-extrabold tabular-nums">{s.number}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-[#2a1414] dark:text-[#f3e9e4] [overflow-wrap:anywhere]">{s.name_french}</span>
                <span className="block text-[11px] text-[#75605a] dark:text-[#bfa79f]">
                  {s.verses_count} versets · page {page}{byRevelation ? ` · révélée en ${SURA_REVELATION_ORDER[s.number - 1]}ᵉ` : ''}
                  {isAdmin && st && !st.validated ? (STORIES_WITH_DOUBT.includes(s.number) ? ' · ⚠️ à relire avec attention' : ' · 📝 à relire') : ''}
                </span>
              </span>
              <span className="font-arabic text-lg text-[#7a1d22] dark:text-[#e08a8f]">{s.name_arabic}</span>
            </button>
          );
        })}
      </div>
      {open !== null && <StoryDialog n={open} story={storyOf(open)} onClose={() => setOpen(null)} onRead={onRead} />}
      {validationDialog}
    </div>
  );
}

function StoryDialog({ n, story, onClose, onRead }: { n: number; story?: Story; onClose: () => void; onRead: (page: number) => void }) {
  const { isAdmin } = useAuth();
  const s = CORAN_ORDERED.find((x) => x.number === n)!;
  const page = SURA_PAGE[n - 1];
  const [editing, setEditing] = useState(false);
  const visible = story && (story.validated || isAdmin);
  const sources = (story?.sources as unknown as Source[]) || [];

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[88dvh] overflow-y-auto" level="nested">
        <DialogHeader>
          <DialogTitle className="flex items-baseline justify-between gap-3 pe-8">
            <span className="[overflow-wrap:anywhere]">{s.name_french}</span>
            <span className="font-arabic text-2xl text-[#7a1d22] dark:text-[#e08a8f] shrink-0">{s.name_arabic}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[[s.verses_count, 'versets'], [`p. ${page}`, 'dans le Coran'], [juzOfPage(page), "Juz'"], [`${SURA_REVELATION_ORDER[n - 1]}ᵉ`, 'révélée']].map(([v, l]) => (
            <div key={String(l)} className="rounded-xl bg-[#f1e5da] dark:bg-[#33201e] px-2 py-2 text-center">
              <b className="block text-base tabular-nums">{v}</b><span className="text-[11px] text-[#75605a] dark:text-[#bfa79f]">{l}</span>
            </div>
          ))}
        </div>
        <p className="text-xs font-bold text-[#8a6512] dark:text-[#e0bb62]">{s.revelation_type === 'Mecquoise' ? '🕋 Révélée à La Mecque' : '🕌 Révélée à Médine'}</p>

        {editing && story ? (
          <StoryEditor story={story} onDone={() => setEditing(false)} />
        ) : visible ? (
          <div className="space-y-3">
            {isAdmin && !story!.validated && (
              <p className="rounded-xl bg-[#c0392b]/10 text-[#c0392b] text-xs font-bold px-3 py-2">📝 Pas encore visible par les élèves : relis la fiche puis valide-la.</p>
            )}
            {story!.titre && <h3 className="text-base font-extrabold text-[#2a1414] dark:text-[#f3e9e4]">{story!.titre}</h3>}
            <p className="text-sm leading-relaxed whitespace-pre-line">{story!.texte}</p>
            {story!.merite && (
              <div className="rounded-xl bg-[#f5ead1] dark:bg-[#3b2e14] px-3 py-2">
                <p className="text-xs font-extrabold text-[#8a6512] dark:text-[#e0bb62] mb-1">✨ Mérite</p>
                <p className="text-sm whitespace-pre-line">{story!.merite}</p>
              </div>
            )}
            {sources.length > 0 && (
              <div className="rounded-xl border border-[#c39a3e]/40 px-3 py-2 space-y-1">
                <p className="text-xs font-extrabold text-[#8a6512] dark:text-[#e0bb62]">📚 Sources</p>
                {sources.map((src, i) => (
                  <p key={i} className="text-xs [overflow-wrap:anywhere]">
                    {src.url ? <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline font-semibold">{src.ref}</a> : <b>{src.ref}</b>}
                    {src.porte_sur ? <span className="text-muted-foreground"> · {src.porte_sur}</span> : null}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-xl bg-[#f5ead1] dark:bg-[#3b2e14] px-3 py-3 text-sm">✨ L'histoire de cette sourate est en préparation par ton professeur. Reviens bientôt !</p>
        )}

        {!editing && <SourateQuiz n={n} />}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { onRead(page); onClose(); }} className="bg-[#7a1d22] hover:bg-[#561216] text-white">📖 Lire la sourate (page {page})</Button>
          {isAdmin && story && !editing && <Button variant="outline" onClick={() => setEditing(true)}>✏️ Corriger la fiche</Button>}
          {isAdmin && story && !editing && <ValidateButton story={story} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ValidateButton({ story }: { story: Story }) {
  const queryClient = useQueryClient();
  const { askValidation, validationDialog } = useConfirmValidation();
  const set = async (validated: boolean) => {
    const { error } = await supabase.from('sourate_stories').update({ validated, updated_at: new Date().toISOString() }).eq('sourate_number', story.sourate_number);
    if (error) { toast.error(errorMessage(error)); return; }
    queryClient.invalidateQueries({ queryKey: ['sourate-stories'] });
    toast.success(validated ? 'Fiche validée ✅ Les élèves la voient maintenant' : 'Fiche cachée aux élèves');
  };
  return (
    <>
      {story.validated
        ? <Button variant="outline" onClick={() => void set(false)}>🙈 Cacher aux élèves</Button>
        : <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => askValidation('Valider cette fiche ?', 'Les élèves pourront la lire dans « Lieu révélation ».', () => void set(true))}>✅ Valider la fiche</Button>}
      {validationDialog}
    </>
  );
}

function StoryEditor({ story, onDone }: { story: Story; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [titre, setTitre] = useState(story.titre);
  const [texte, setTexte] = useState(story.texte);
  const [merite, setMerite] = useState(story.merite || '');
  const [sources, setSources] = useState(((story.sources as unknown as Source[]) || []).map((s) => [s.ref, s.url].filter(Boolean).join(' | ')).join('\n'));
  const [saving, setSaving] = useState(false);
  // Correction pas enregistrée : gardée comme brouillon (règle des brouillons, 2026-10-25)
  const original = { titre: story.titre, texte: story.texte, merite: story.merite || '', sources: ((story.sources as unknown as Source[]) || []).map((s) => [s.ref, s.url].filter(Boolean).join(' | ')).join('\n') };
  const draft = useEditDraft('dinislam_sourate_story', story.sourate_number, {
    active: true,
    value: { titre, texte, merite, sources },
    original,
    restore: (v) => { setTitre(v.titre); setTexte(v.texte); setMerite(v.merite); setSources(v.sources); },
  });
  const save = async () => {
    setSaving(true);
    try {
      const src = sources.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
        const [ref, url] = l.split('|').map((x) => x.trim());
        return url ? { ref, url } : { ref };
      });
      const { error } = await supabase.from('sourate_stories').update({
        titre: titre.trim(), texte: texte.trim(), merite: merite.trim() || null, sources: src as unknown as Json, updated_at: new Date().toISOString(),
      }).eq('sourate_number', story.sourate_number);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['sourate-stories'] });
      toast.success('Fiche enregistrée ✅');
      draft.done();
      onDone();
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };
  return (
    <div className="space-y-2">
      <DraftRestoredBanner draft={draft} onCleared={() => { setTitre(original.titre); setTexte(original.texte); setMerite(original.merite); setSources(original.sources); }} />
      <label className="text-xs font-bold" htmlFor="st-titre">Titre</label>
      <Input id="st-titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
      <label className="text-xs font-bold" htmlFor="st-texte">Histoire</label>
      <Textarea id="st-texte" value={texte} onChange={(e) => setTexte(e.target.value)} rows={7} />
      <label className="text-xs font-bold" htmlFor="st-merite">Mérite (facultatif)</label>
      <Textarea id="st-merite" value={merite} onChange={(e) => setMerite(e.target.value)} rows={3} />
      <label className="text-xs font-bold" htmlFor="st-sources">Sources (une par ligne : référence | lien)</label>
      <Textarea id="st-sources" value={sources} onChange={(e) => setSources(e.target.value)} rows={3} />
      <div className="flex gap-2">
        <Button variant="outline" onClick={onDone}>Annuler</Button>
        <Button onClick={() => void save()} disabled={saving} className="bg-[#7a1d22] hover:bg-[#561216] text-white">Enregistrer</Button>
      </div>
    </div>
  );
}

/** 🧠 Petit quiz après la fiche (idée acceptée le 2026-10-25) : 3 questions tirées des vraies données de la sourate */
function SourateQuiz({ n }: { n: number }) {
  const { fireConfetti, fireSuccess } = useConfetti();
  const s = CORAN_ORDERED.find((x) => x.number === n)!;
  const page = SURA_PAGE[n - 1];
  const juz = juzOfPage(page);
  const questions = useMemo(() => {
    // Mauvaises réponses proches et toujours différentes de la bonne
    const near = (good: number, steps: number[], min: number, max: number) => {
      const out = new Set<number>([good]);
      for (const st of steps) { const v = good + st; if (v >= min && v <= max) out.add(v); if (out.size === 4) break; }
      for (let v = min; out.size < 4 && v <= max; v++) out.add(v);
      return [...out].sort((a, b) => ((a * 7 + n) % 11) - ((b * 7 + n) % 11));
    };
    return [
      { q: 'Où a-t-elle été révélée ?', choices: ['🕋 À La Mecque', '🕌 À Médine'], good: s.revelation_type === 'Mecquoise' ? '🕋 À La Mecque' : '🕌 À Médine' },
      { q: 'Combien a-t-elle de versets ?', choices: near(s.verses_count, [1, -1, 2, -2, 3, 5, -3, 10], 3, 286).map(String), good: String(s.verses_count) },
      { q: "Dans quel Juz' commence-t-elle ?", choices: near(juz, [1, -1, 2, -2, 3], 1, 30).map((v) => `Juz' ${v}`), good: `Juz' ${juz}` },
    ];
  }, [n, s.revelation_type, s.verses_count, juz]);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<(string | null)[]>([null, null, null]);
  const score = answers.filter((a, i) => a === questions[i].good).length;
  const allAnswered = answers.every((a) => a !== null);
  const answer = (i: number, c: string) => {
    if (answers[i] !== null) return;
    const next = answers.map((a, j) => (j === i ? c : a));
    setAnswers(next);
    if (next.every((a) => a !== null)) {
      const sc = next.filter((a, j) => a === questions[j].good).length;
      if (sc === 3) fireConfetti(); else if (sc >= 2) fireSuccess();
    }
  };
  if (!started) {
    return (
      <button type="button" onClick={() => setStarted(true)}
        className="w-full rounded-xl border-2 border-dashed border-[#c39a3e] px-3 py-2.5 text-sm font-bold text-[#8a6512] dark:text-[#e0bb62]">
        🧠 Petit quiz sur cette sourate (3 questions)
      </button>
    );
  }
  return (
    <div className="rounded-2xl border border-[#c39a3e]/50 bg-[#fbf7ef] dark:bg-[#2a1918] p-3 space-y-3">
      {questions.map((qu, i) => (
        <div key={qu.q} className="space-y-1.5">
          <p className="text-sm font-bold">{i + 1}. {qu.q}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {qu.choices.map((c) => {
              const chosen = answers[i] === c;
              const reveal = answers[i] !== null;
              return (
                <button key={c} type="button" onClick={() => answer(i, c)} disabled={reveal}
                  className={cn('rounded-xl border px-2 py-2 text-sm font-semibold transition-colors',
                    reveal && c === qu.good ? 'bg-green-600 border-green-600 text-white'
                      : chosen ? 'bg-[#c0392b] border-[#c0392b] text-white'
                        : 'bg-white dark:bg-[#221413] border-[#e6d9cc] dark:border-[#3a2523]')}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {allAnswered && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-extrabold">{score === 3 ? '🏆 3 sur 3, ma shā\' Allah !' : score === 2 ? '🌟 2 sur 3, presque parfait !' : `💪 ${score} sur 3, relis la fiche et réessaie !`}</p>
          <button type="button" onClick={() => setAnswers([null, null, null])} className="text-xs font-bold text-[#7a1d22] dark:text-[#e08a8f]">🔄 Recommencer</button>
        </div>
      )}
    </div>
  );
}
