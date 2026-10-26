import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useConfetti } from '@/hooks/useConfetti';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { useOpenItemFromUrl, MISSING_ITEM_MESSAGE } from '@/hooks/useOpenItemFromUrl';
import { useCoranProgress, type Bookmark, type BookmarkNote } from '@/hooks/useCoranProgress';
import { moveToTrash } from '@/lib/trash';
import { REVIEW_NEXT_DAYS } from '@/lib/coranPages';
import type { Json } from '@/integrations/supabase/types';
import { CoranReader, type ReaderMode } from '@/components/coran/CoranReader';
import { BookmarkButton, SommaireButton, ListenButton } from '@/components/coran/CoranTools';
import { CoranJuzTab } from '@/components/coran/CoranJuzTab';
import { CoranRevelationTab } from '@/components/coran/CoranRevelationTab';
import { CoranProgrammeTab } from '@/components/coran/CoranProgrammeTab';
import { CoranStudentsTab } from '@/components/coran/CoranStudentsTab';
import { JUZ, A_SAVOIR, indexOfPage, pageOfIndex } from '@/data/coranMeta';
import { SOURATES_DATA } from '@/data/sourates';
import { pagesForDay, localDay, dateOfDay, type Programme } from '@/lib/coranPlan';
import { errorMessage, cn } from '@/lib/utils';
import { pickEncouragement } from '@/lib/coranEncouragements';
import { withName } from '@/lib/encouragements';
import { percentRead } from '@/lib/coranPlan';
import { describeIndex, BOOKMARK_COLORS } from '@/lib/coranPages';

/**
 * Carte « Coran » (refaite le 2026-10-25, ancienne carte retirée à la demande de Nadia) :
 * le Coran Al-Tajwid à feuilleter + un en-tête à onglets. Les onglets ouvrent les MÊMES pages, mais chacun
 * garde sa propre progression (bande de couleur en haut de la page : vert Lire, or Juz', bleu Programme).
 */
type Tab = 'lire' | 'juz' | 'lieu' | 'programme' | 'savoir' | 'eleves';
type Reading = { kind: 'free' } | { kind: 'juz'; juz: number; sura: number } | { kind: 'prog'; day: number };

const TABS: { id: Tab; emoji: string; label: string; admin?: boolean }[] = [
  { id: 'lire', emoji: '📖', label: 'Lire' },
  { id: 'juz', emoji: '📚', label: "Juz'" },
  { id: 'lieu', emoji: '🕋', label: 'Lieu révélation' },
  { id: 'programme', emoji: '🗓️', label: 'Programme' },
  { id: 'savoir', emoji: '💡', label: 'À savoir' },
  { id: 'eleves', emoji: '👀', label: 'Élèves', admin: true },
];
const nameOf = (n: number) => SOURATES_DATA.find((s) => s.number === n)?.name_french.split(' (')[0] ?? '';

const CoranPage = () => {
  const { isAdmin, user } = useAuth();
  const [params, setParams] = useSearchParams();
  // « Commencer mon travail » d'un devoir : ?item=<page du Coran 1..604> → lecteur ouvert sur cette page, onglet Lire
  const itemIndex = (() => { const p = Number(params.get('item')); return Number.isInteger(p) && p >= 1 && p <= 604 ? indexOfPage(p) : null; })();
  const initialTab = itemIndex !== null ? 'lire' : (params.get('tab') === 'programme' ? 'programme' : (params.get('tab') as Tab)) || 'lire';
  const [tab, setTabState] = useState<Tab>(TABS.some((t) => t.id === initialTab) ? initialTab : 'lire');
  const setTab = useCallback((t: Tab) => {
    setTabState(t);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setParams((p) => { const n = new URLSearchParams(p); if (t === 'lire') n.delete('tab'); else n.set('tab', t); return n; }, { replace: true });
  }, [setParams]);

  const { lecture, juzDone, programme, save, remove } = useCoranProgress();
  const { fireConfetti, fireSuccess } = useConfetti();
  const { askValidation, validationDialog } = useConfirmValidation();

  // La carte s'ouvre sur la couverture ; « Reprendre » ramène à la dernière page lue (lecture libre)
  const [reading, setReading] = useState<Reading>({ kind: 'free' });
  const [index, setIndex] = useState(() => { if (itemIndex !== null) return itemIndex; const n = Number(params.get('page')); return n >= 1 && n <= 676 ? n : 1; });
  const [juzSel, setJuzSel] = useState(30);

  // Lecture libre : la page est retenue (enregistrée 1 s après le dernier changement)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lectureRef = useRef(lecture);
  lectureRef.current = lecture;
  const changeIndex = useCallback((i: number) => {
    setIndex(i);
    if (reading.kind !== 'free') return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      save('lecture', 'main', { ...lectureRef.current, index: i }).catch(() => { /* réessayé au prochain changement */ });
    }, 1000);
  }, [reading.kind, save]);
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const saveBookmarks = (bookmarks: Bookmark[]) =>
    save('lecture', 'main', { ...lectureRef.current, bookmarks }).catch((e) => toast.error(errorMessage(e)));
  const [bmOpen, setBmOpen] = useState(false);
  // Retirer une note : copie dans la corbeille d'abord (règle « rien sans la corbeille »)
  const removeNote = async (i: number, note: BookmarkNote) => {
    if (!user) return;
    const ok = await moveToTrash(user.id, 'coran_note', String(i), `Note « ${note.text.slice(0, 40)} » (${describeIndex(i).title})`, { index: i, note } as unknown as Json);
    if (!ok) { toast.error("Mise en corbeille impossible : la note n'a pas été retirée"); return; }
    await saveBookmarks(lectureRef.current.bookmarks.map((b) => (b.index === i ? { ...b, notes: (b.notes || []).filter((n) => n.id !== note.id) } : b)));
    toast.success('Note retirée (elle est dans la corbeille de Paramètres)');
  };
  // Rappel de révision : pages « À réviser » arrivées à leur date
  const today = localDay();
  const toReview = lecture.bookmarks.filter((b) => b.color === 'rouge' && b.reviewAt && b.reviewAt <= today);
  const markReviewed = (b: Bookmark) => {
    void saveBookmarks(lecture.bookmarks.map((x) => (x.index === b.index ? { ...x, reviewAt: dateOfDay(today, REVIEW_NEXT_DAYS + 1) } : x)))
      .then(() => { fireSuccess(); toast.success(withName(user, `✅ Bravo {prenom} ! Prochaine révision dans ${REVIEW_NEXT_DAYS} jours`)); });
  };

  const readFreeNoSave = (i: number) => { setReading({ kind: 'free' }); setIndex(i); setTab('lire'); };

  // Lien de devoir qui change alors que la carte est déjà ouverte (le 1er affichage est réglé plus haut)
  useOpenItemFromUrl(true, (item) => {
    const p = Number(item);
    if (!Number.isInteger(p) || p < 1 || p > 604) { toast.info(MISSING_ITEM_MESSAGE); return; }
    const i = indexOfPage(p);
    if (reading.kind === 'free' && index === i && tab === 'lire') return;
    readFreeNoSave(i);
  });

  // Juz' : coche / décoche une sourate du parcours (confirmation pour cocher seulement)
  const toggleSura = async (juz: number, sura: number) => {
    const done = juzDone(juz);
    const isDone = done.includes(sura);
    const next = isDone ? done.filter((n) => n !== sura) : [...done, sura];
    try {
      await save('juz', String(juz), { done: next });
      if (!isDone) {
        const full = JUZ[juz - 1].sourates.every((s) => next.includes(s.n));
        if (full) { fireConfetti(); toast.success(withName(user, pickEncouragement('juzDone')), { description: `Juz' ${juz} terminé 🎉` }); }
        else { fireSuccess(); toast.success(withName(user, pickEncouragement('suraDone')), { description: `${nameOf(sura)} terminée` }); }
      }
    } catch (e) { toast.error(errorMessage(e)); }
  };

  // Programme : coche la lecture d'un jour (confirmation pour cocher seulement)
  const toggleDay = async (p: Programme, day: number) => {
    const isDone = p.doneDays.includes(day);
    const doneDays = isDone ? p.doneDays.filter((d) => d !== day) : [...p.doneDays, day].sort((a, b) => a - b);
    const finished = doneDays.length >= p.totalDays;
    try {
      await save('programme', 'active', { ...p, doneDays, finished, finishedOn: finished ? (p.finishedOn || localDay()) : undefined });
      if (!isDone) {
        if (finished) { setTab('programme'); toast.success('🏆 Tu as lu tout le Coran, ma shā\' Allah !'); }
        else {
          fireSuccess();
          const half = percentRead(p) < 50 && percentRead({ ...p, doneDays }) >= 50;
          toast.success(withName(user, pickEncouragement(half ? 'halfway' : 'dayDone')), { description: `Lecture du jour ${day} faite ✅` });
        }
      }
    } catch (e) { toast.error(errorMessage(e)); }
  };

  let mode: ReaderMode = { kind: 'free', label: '📖 Ma lecture', sub: lecture.index > 1 ? `🔖 Dernière page lue : ${describeIndex(lecture.index).title}` : undefined };
  let action: ReactNode = null;
  let range: { from: number; to: number } | undefined;
  if (reading.kind === 'juz') {
    const done = juzDone(reading.juz).includes(reading.sura);
    mode = { kind: 'juz', label: `📚 Juz' ${reading.juz} · ${nameOf(reading.sura)}`, sub: 'ne change pas « Ma lecture »' };
    action = (
      <button type="button" onClick={() => done ? void toggleSura(reading.juz, reading.sura) : askValidation('Sourate terminée ?', `${nameOf(reading.sura)} sera cochée dans le parcours du Juz' ${reading.juz}.`, () => void toggleSura(reading.juz, reading.sura))}
        className={cn('rounded-full px-3 py-1.5 text-xs font-extrabold text-white active:scale-95 transition-transform', done ? 'bg-[#7a1d22]' : 'bg-[#c39a3e]')}>
        {done ? '✓ Terminée' : '✅ Sourate terminée'}
      </button>
    );
  } else if (reading.kind === 'prog' && programme) {
    range = pagesForDay(programme, reading.day);
    const done = programme.doneDays.includes(reading.day);
    mode = { kind: 'prog', label: `🗓️ Programme · jour ${reading.day}`, sub: `pages ${range.from} à ${range.to}` };
    action = (
      <button type="button" onClick={() => done ? void toggleDay(programme, reading.day) : askValidation('Lecture du jour faite ?', `Le jour ${reading.day} (pages ${range!.from} à ${range!.to}) sera coché dans ton programme.`, () => void toggleDay(programme, reading.day))}
        className={cn('rounded-full px-3 py-1.5 text-xs font-extrabold text-white active:scale-95 transition-transform', done ? 'bg-[#183e7c]' : 'bg-[#2457a5]')}>
        {done ? '✓ Jour fait' : '✅ Lecture du jour faite'}
      </button>
    );
  }

  const tools = (
    <>
      <BookmarkButton index={index} bookmarks={lecture.bookmarks} onChange={(b) => void saveBookmarks(b)} onRemoveNote={(i, n) => void removeNote(i, n)} open={bmOpen} onOpenChange={setBmOpen} />
      <SommaireButton bookmarks={lecture.bookmarks} onGo={(i) => (reading.kind === 'free' ? changeIndex(i) : setIndex(i))} />
      <ListenButton index={index} />
    </>
  );

  return (
    <AppLayout title="Coran">
      <div className="p-3 md:p-6 space-y-4 max-w-5xl mx-auto">
        {/* En-tête de la carte : couleurs de la couverture (bordeaux et or) */}
        <div className="rounded-2xl overflow-hidden shadow-sm bg-gradient-to-br from-[#7a1d22] to-[#561216] text-white">
          <div className="flex items-center justify-between gap-3 px-4 pt-3">
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold leading-tight">Coran Al-Tajwid</h1>
              <p className="text-[11px] text-white/80">Avec la traduction des sens en français</p>
            </div>
            <span className="font-arabic text-xl text-[#f3d38b] shrink-0">مصحف التجويد</span>
          </div>
          <div role="tablist" className="mt-2 grid grid-flow-col auto-cols-fr overflow-x-auto">
            {TABS.filter((t) => !t.admin || isAdmin).map((t) => (
              <button key={t.id} role="tab" type="button" aria-selected={tab === t.id}
                onClick={() => { if (t.id === 'lire' && reading.kind !== 'free') { setReading({ kind: 'free' }); setIndex(lecture.index > 1 ? lecture.index : 1); } setTab(t.id); }}
                className={cn('px-1 pt-1.5 pb-2 text-center text-[11px] sm:text-xs font-bold leading-tight border-b-[3px] transition-colors min-w-[64px]',
                  tab === t.id ? 'text-white border-[#f3d38b]' : 'text-white/70 border-transparent hover:text-white')}>
                <span className="block text-lg leading-none mb-0.5">{t.emoji}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'lire' && (
          <div className="space-y-3">
            {toReview.length > 0 && (
              <div className="rounded-2xl border-2 border-[#c0392b]/60 bg-[#c0392b]/5 p-3 space-y-2">
                <p className="text-sm font-extrabold text-[#c0392b]">🔁 À réviser aujourd'hui</p>
                {toReview.map((b) => (
                  <div key={b.index} className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => (reading.kind === 'free' ? changeIndex(b.index) : setIndex(b.index))} className="flex-1 min-w-0 text-left text-sm font-bold [overflow-wrap:anywhere]">
                      📖 {describeIndex(b.index).title} · {describeIndex(b.index).sub}
                    </button>
                    <button type="button" onClick={() => markReviewed(b)} className="rounded-full bg-[#c0392b] text-white px-3 py-1 text-xs font-bold">✅ Révisée</button>
                  </div>
                ))}
              </div>
            )}
            {reading.kind === 'free' && lecture.index > 1 && index !== lecture.index && (
              <button type="button" onClick={() => setIndex(lecture.index)}
                className="w-full rounded-2xl bg-gradient-to-br from-[#c39a3e] to-[#a77a1c] text-white px-4 py-3 text-left font-bold shadow-sm active:scale-[0.99] transition-transform">
                ▶️ Reprendre où j'en étais
                <span className="block text-xs font-semibold opacity-90">{describeIndex(lecture.index).title} · {describeIndex(lecture.index).sub}</span>
              </button>
            )}
            {reading.kind !== 'free' && (
              <button type="button" onClick={() => setTab(reading.kind === 'juz' ? 'juz' : 'programme')} className="text-sm font-bold text-[#7a1d22] dark:text-[#e08a8f]">
                ← Retour {reading.kind === 'juz' ? `au Juz' ${reading.juz}` : 'à mon programme'}
              </button>
            )}
            {lecture.bookmarks.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1" aria-label="Mes marque-pages">
                <span className="shrink-0 text-xs font-extrabold text-[#8a6512] dark:text-[#e0bb62]">🔖 Mes marque-pages :</span>
                {[...lecture.bookmarks].sort((a, b) => a.index - b.index).map((b) => (
                  <button key={b.index} type="button" onClick={() => (reading.kind === 'free' ? changeIndex(b.index) : setIndex(b.index))}
                    className={cn('shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold bg-white dark:bg-[#221413]', b.index === index ? 'border-[#c39a3e] ring-2 ring-[#c39a3e]/50' : 'border-[#e6d9cc] dark:border-[#3a2523]')}>
                    <span className={cn('h-2.5 w-2.5 rounded-full', BOOKMARK_COLORS[b.color].dot)} />
                    {describeIndex(b.index).title} · {b.label}
                  </button>
                ))}
              </div>
            )}
            <CoranReader index={index} onIndexChange={changeIndex} mode={mode} action={action} tools={tools} range={range}
              onOpenBookmark={() => setBmOpen(true)}
              bookmarkOf={(i) => { const b = lecture.bookmarks.find((x) => x.index === i); return b ? { hex: BOOKMARK_COLORS[b.color].hex, emoji: BOOKMARK_COLORS[b.color].emoji, label: BOOKMARK_COLORS[b.color].label, notes: b.notes || [] } : null; }} />
            <p className="text-center text-[11px] text-muted-foreground">Glisse le doigt vers la droite pour tourner la page · deux doigts pour zoomer · tablette à l'horizontale : double page</p>
          </div>
        )}

        {tab === 'juz' && (
          <CoranJuzTab selected={juzSel} onSelect={setJuzSel} juzDone={juzDone}
            onOpen={(juz, sura, page) => { setReading({ kind: 'juz', juz, sura }); setIndex(indexOfPage(page)); setTab('lire'); }} />
        )}

        {tab === 'lieu' && <CoranRevelationTab initialOpen={Number(params.get('sourate')) || undefined} onRead={(page) => readFreeNoSave(indexOfPage(page))} />}

        {tab === 'programme' && (
          <CoranProgrammeTab programme={programme}
            onSave={(p) => {
              const isNew = !programme;
              return save('programme', 'active', p)
                .then(() => { if (isNew) { fireSuccess(); toast.success(withName(user, pickEncouragement('start'))); } })
                .catch((e) => { toast.error(errorMessage(e)); });
            }}
            onStop={() => remove('programme', 'active', 'Programme de lecture du Coran').then(() => { toast.success('Programme arrêté (il est dans la corbeille de Paramètres)'); }).catch((e) => { toast.error(errorMessage(e)); })}
            onReadDay={(day) => { if (!programme) return; setReading({ kind: 'prog', day }); setIndex(indexOfPage(pagesForDay(programme, day).from)); setTab('lire'); }} />
        )}

        {tab === 'savoir' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Les pages de la fin du livre : index des thèmes, piliers de l'islam, croyance et règles du tajwid.</p>
            {A_SAVOIR.map((a) => (
              <button key={a.index} type="button" onClick={() => readFreeNoSave(a.index)}
                className="w-full flex items-center gap-3 rounded-xl border border-[#e6d9cc] dark:border-[#3a2523] bg-white dark:bg-[#221413] px-4 py-3 text-left">
                <span className="text-2xl">{a.emoji}</span>
                <span className="flex-1 font-bold text-sm">{a.title}</span>
                <span className="text-xs text-muted-foreground">{pageOfIndex(a.index) ? `page ${pageOfIndex(a.index)}` : 'fin du livre'}</span>
              </button>
            ))}
          </div>
        )}

        {tab === 'eleves' && isAdmin && <CoranStudentsTab />}
      </div>
      {validationDialog}
    </AppLayout>
  );
};

export default CoranPage;
