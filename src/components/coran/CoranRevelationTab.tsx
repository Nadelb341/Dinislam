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
import type { Tables, Json } from '@/integrations/supabase/types';

type Story = Tables<'sourate_stories'>;
type Source = { ref: string; url?: string; porte_sur?: string };

interface Props {
  /** Ouvre le lecteur sur la page de la sourate */
  onRead: (page: number) => void;
}

/**
 * 🕋 Lieu de révélation (2026-10-25) : sourates mecquoises / médinoises, et la fiche-histoire de chacune
 * (versets, page, Juz', ordre de révélation, circonstances, mérite, sources authentiques).
 * Les élèves ne voient une fiche qu'après sa validation par l'enseignante ; l'enseignante peut la corriger ici.
 */
export function CoranRevelationTab({ onRead }: Props) {
  const { isAdmin } = useAuth();
  const [place, setPlace] = useState<'Mecquoise' | 'Médinoise'>('Mecquoise');
  const [byRevelation, setByRevelation] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

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
                  {isAdmin && st && !st.validated ? ' · 📝 à relire' : ''}
                </span>
              </span>
              <span className="font-arabic text-lg text-[#7a1d22] dark:text-[#e08a8f]">{s.name_arabic}</span>
            </button>
          );
        })}
      </div>
      {open !== null && <StoryDialog n={open} story={storyOf(open)} onClose={() => setOpen(null)} onRead={onRead} />}
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
          <p className="rounded-xl bg-[#f5ead1] dark:bg-[#3b2e14] px-3 py-3 text-sm">✨ L'histoire de cette sourate est en préparation par ta maîtresse. Reviens bientôt !</p>
        )}

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
