import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SafeYoutubeEmbed } from '@/components/SafeYoutubeEmbed';
import { getHoussaryEmbedUrl } from '@/data/houssaryVideos';
import { CORAN_ORDERED } from '@/data/sourates';
import { SURA_PAGE, A_SAVOIR, QURAN_PAGES, indexOfPage, pageOfIndex, suraOfPage, juzOfPage } from '@/data/coranMeta';
import { describeIndex, BOOKMARK_COLORS, REVIEW_FIRST_DAYS } from '@/lib/coranPages';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { askTeacher } from '@/lib/coranQuestions';
import { withName } from '@/lib/encouragements';
import { localDay, dateOfDay } from '@/lib/coranPlan';
import { errorMessage } from '@/lib/utils';
import type { Bookmark, BookmarkColor, BookmarkNote } from '@/hooks/useCoranProgress';
import { cn } from '@/lib/utils';


const toolBtn = 'rounded-full px-3 py-1.5 text-xs font-extrabold bg-[#f1e5da] text-[#2a1414] dark:bg-[#33201e] dark:text-[#f3e9e4] active:scale-95 transition-transform';

/** 🔖 Marque-page de la page affichée : couleur, notes datées (notes rapides, dictée), « Pose une question » */
export function BookmarkButton({ index, bookmarks, onChange, onRemoveNote, open, onOpenChange }: {
  index: number; bookmarks: Bookmark[];
  onChange: (b: Bookmark[]) => void;
  /** Retirer une note : elle passe d'abord par la corbeille */
  onRemoveNote: (index: number, note: BookmarkNote) => void;
  open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const { user } = useAuth();
  const current = bookmarks.find((b) => b.index === index);
  const [color, setColor] = useState<BookmarkColor | null>(null);
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  useEffect(() => { if (open) { setColor(current?.color ?? null); setDraft(''); } }, [open, current?.color]);
  const chosen = color ?? current?.color ?? null;
  const notes = current?.notes ?? [];
  const where = `${describeIndex(index).title} · ${describeIndex(index).sub}`;

  const save = (extraNote?: string) => {
    if (!chosen) { toast.error('Choisis d\'abord une couleur 🙂'); return; }
    const text = (extraNote ?? draft).trim();
    const nextNotes = text ? [...notes, { id: `${Date.now()}`, text, date: localDay() }] : notes;
    const reviewAt = chosen === 'rouge' ? (current?.color === 'rouge' && current.reviewAt ? current.reviewAt : dateOfDay(localDay(), REVIEW_FIRST_DAYS + 1)) : undefined;
    onChange([...bookmarks.filter((b) => b.index !== index), { index, color: chosen, label: BOOKMARK_COLORS[chosen].label, notes: nextNotes, reviewAt }]);
    setDraft('');
  };
  const dictate = () => {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Api = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Api) { toast.error('La dictée ne marche pas sur cet appareil'); return; }
    const r = new Api();
    r.lang = 'fr-FR'; r.interimResults = false;
    r.onresult = (e) => { const t = e.results[0]?.[0]?.transcript || ''; setDraft((d) => (d ? `${d} ${t}` : t)); };
    r.onend = () => setListening(false);
    setListening(true);
    r.start();
  };
  const send = async () => {
    if (!user || !question.trim()) return;
    setSending(true);
    try {
      await askTeacher(user.id, question, where, index);
      toast.success(withName(user, '✉️ Question envoyée à ton professeur, merci {prenom} !'));
      setQuestion(''); setAskOpen(false);
    } catch (e) { toast.error(errorMessage(e)); } finally { setSending(false); }
  };

  return (
    <>
      <button type="button" className={cn(toolBtn, current && 'ring-2 ring-[#c39a3e]')} onClick={() => onOpenChange(true)} aria-label="Marque-page">
        🔖 Marque-page{current && <span className={cn('ml-1 inline-block h-2.5 w-2.5 rounded-full align-middle', BOOKMARK_COLORS[current.color].dot)} />}
      </button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[88dvh] overflow-y-auto" level="nested">
          <DialogHeader><DialogTitle className="pe-8">🔖 Marque-page · {describeIndex(index).title}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(BOOKMARK_COLORS) as BookmarkColor[]).map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-pressed={chosen === c}
                className={cn('flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold text-left', chosen === c ? 'border-2 text-white' : 'border-border')}
                style={chosen === c ? { background: BOOKMARK_COLORS[c].hex, borderColor: BOOKMARK_COLORS[c].hex } : undefined}>
                <span className={cn('h-4 w-4 rounded-full shrink-0 border-2 border-white/70', BOOKMARK_COLORS[c].dot)} />{BOOKMARK_COLORS[c].label}
              </button>
            ))}
          </div>
          {chosen === 'rouge' && <p className="text-xs text-muted-foreground">🔁 Cette page reviendra comme rappel de révision dans {REVIEW_FIRST_DAYS} jours.</p>}

          {notes.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#c39a3e]">📝 Mes notes</p>
              {notes.map((n) => (
                <div key={n.id} className="flex items-start gap-2 rounded-xl bg-[#fff3a8] text-[#4a3b00] px-3 py-2">
                  <p className="flex-1 text-sm whitespace-pre-line [overflow-wrap:anywhere]">{n.text}<span className="block text-[10px] font-bold opacity-70">{fmtNoteDate(n.date)}</span></p>
                  <button type="button" onClick={() => onRemoveNote(index, n)} className="text-destructive font-extrabold shrink-0" aria-label="Retirer cette note">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="bm-note" className="text-sm font-bold">✏️ Ajouter une note (facultatif)</label>
            <div className="flex gap-2">
              <Textarea id="bm-note" value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder="Ex. : revoir les versets 5 à 8 avant jeudi" />
              <button type="button" onClick={dictate} aria-label="Dicter la note"
                className={cn('shrink-0 h-11 w-11 rounded-xl grid place-items-center text-lg', listening ? 'bg-destructive text-white animate-pulse' : 'bg-[#f1e5da] dark:bg-[#33201e]')}>🎙️</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_NOTES.map((q) => (
                <button key={q} type="button" onClick={() => setDraft((d) => (d ? `${d} ${q}` : q))} className="rounded-full bg-[#f1e5da] dark:bg-[#33201e] px-3 py-1 text-xs font-bold">{q}</button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { save(); if (chosen) { toast.success('🔖 Marque-page enregistré'); onOpenChange(false); } }}
              className="flex-1 rounded-xl bg-[#7a1d22] text-white px-4 py-2.5 text-sm font-bold">Enregistrer</button>
            {current && (
              <button type="button" onClick={() => { onChange(bookmarks.filter((b) => b.index !== index)); onOpenChange(false); }}
                className="rounded-xl border border-destructive text-destructive px-3 py-2.5 text-xs font-bold">Retirer le marque-page</button>
            )}
          </div>

          {/* ❔ Pose une question : envoyée au professeur dans la messagerie */}
          <div className="rounded-2xl border border-[#2457a5]/40 bg-blue-50 dark:bg-blue-950/30 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setAskOpen((v) => !v)} className="rounded-full bg-[#2457a5] text-white px-4 py-1.5 text-sm font-bold">❔ Pose une question</button>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" aria-label="À quoi sert ce bouton ?" className="h-6 w-6 rounded-full border-2 border-[#2457a5] text-[#2457a5] text-xs font-extrabold grid place-items-center">?</button>
                </PopoverTrigger>
                <PopoverContent className="z-[800] max-w-xs text-sm">
                  Si tu as une question ou que quelque chose n'est pas clair sur cette page, n'hésite pas à la poser à ton professeur : il essaiera de te répondre au plus vite ! 😊
                </PopoverContent>
              </Popover>
            </div>
            {askOpen && (
              <>
                <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} placeholder="Écris ta question ici…" aria-label="Ma question" />
                <p className="text-[11px] text-muted-foreground">Elle arrivera dans la messagerie de ton professeur, avec cette page ({where}).</p>
                <button type="button" disabled={sending || !question.trim()} onClick={() => void send()}
                  className="rounded-xl bg-[#2457a5] text-white px-4 py-2 text-sm font-bold disabled:opacity-50">✉️ Envoyer ma question</button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type SpeechRec = { lang: string; interimResults: boolean; start: () => void; onresult: (e: { results: { 0?: { transcript?: string } }[] }) => void; onend: () => void };
const QUICK_NOTES = ['🔁 À réviser', '✅ Je la connais', '⭐ Belle page', '📅 Pour le prochain cours'];
const fmtNoteDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-'ʿ’]/g, '').toLowerCase();

/** 📑 Sommaire : aller à une page ou à une sourate, marque-pages, pages « À savoir » */
export function SommaireButton({ bookmarks, onGo }: { bookmarks: Bookmark[]; onGo: (index: number) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [page, setPage] = useState('');
  const list = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return CORAN_ORDERED;
    return CORAN_ORDERED.filter((s) => norm(s.name_french).includes(n) || s.name_arabic.includes(q.trim()) || String(s.number) === n);
  }, [q]);
  const go = (index: number) => { onGo(index); setOpen(false); setQ(''); setPage(''); };
  const goPage = () => { const p = Number(page); if (p >= 1 && p <= QURAN_PAGES) go(indexOfPage(p)); };
  return (
    <>
      <button type="button" className={toolBtn} onClick={() => setOpen(true)}>📑 Sommaire</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85dvh] overflow-y-auto" level="nested">
          <DialogHeader><DialogTitle>📑 Sommaire</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <Input inputMode="numeric" placeholder="Aller à la page (1 à 604)" value={page} onChange={(e) => setPage(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); goPage(); } }} aria-label="Numéro de page" />
            <button type="button" onClick={goPage} className="rounded-xl bg-[#7a1d22] text-white px-4 text-sm font-bold shrink-0">Aller</button>
          </div>
          {bookmarks.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#c39a3e]">Mes marque-pages</p>
              {[...bookmarks].sort((a, b) => a.index - b.index).map((b) => (
                <button key={b.index} type="button" onClick={() => go(b.index)} className="w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm">
                  <span className={cn('h-3 w-3 rounded-full shrink-0', BOOKMARK_COLORS[b.color].dot)} />
                  <span className="font-bold">{describeIndex(b.index).title}</span>
                  <span className="text-muted-foreground text-xs [overflow-wrap:anywhere]">{b.label} · {describeIndex(b.index).sub}</span>
                </button>
              ))}
            </div>
          )}
          <Input placeholder="🔎 Chercher une sourate (nom, numéro…)" value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && list[0]) { e.preventDefault(); go(indexOfPage(SURA_PAGE[list[0].number - 1])); } }} aria-label="Chercher une sourate" />
          <div className="space-y-1.5">
            {list.map((s) => (
              <button key={s.number} type="button" onClick={() => go(indexOfPage(SURA_PAGE[s.number - 1]))}
                className="w-full flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left">
                <span className="h-7 w-7 shrink-0 rounded-lg bg-[#f5ead1] text-[#8a6512] dark:bg-[#3b2e14] dark:text-[#e0bb62] grid place-items-center text-xs font-extrabold tabular-nums">{s.number}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold [overflow-wrap:anywhere]">{s.name_french}</span>
                  <span className="block text-[11px] text-muted-foreground">page {SURA_PAGE[s.number - 1]} · Juz' {juzOfPage(SURA_PAGE[s.number - 1])}</span>
                </span>
                <span className="font-arabic text-lg text-[#7a1d22] dark:text-[#e08a8f]">{s.name_arabic}</span>
              </button>
            ))}
            {!list.length && <p className="text-sm text-muted-foreground text-center py-4">Aucune sourate ne correspond 🤔</p>}
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#c39a3e]">📚 À savoir</p>
            {A_SAVOIR.map((a) => (
              <button key={a.index} type="button" onClick={() => go(a.index)} className="w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold">{a.emoji} {a.title}</button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** 🎧 Écouter la sourate de la page avec la récitation de Cheikh Al-Houssary (lecteur sans sortie vers YouTube) */
export function ListenButton({ index }: { index: number }) {
  const [open, setOpen] = useState(false);
  const page = pageOfIndex(index);
  const sura = page ? suraOfPage(page) : null;
  const embed = sura ? getHoussaryEmbedUrl(sura) : null;
  if (!embed || !sura) return null;
  const name = CORAN_ORDERED.find((s) => s.number === sura)?.name_french.split(' (')[0];
  return (
    <>
      <button type="button" className={toolBtn} onClick={() => setOpen(true)}>🎧 Écouter</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" level="nested">
          <DialogHeader><DialogTitle>🎧 {name} · Cheikh Al-Houssary</DialogTitle></DialogHeader>
          {open && <SafeYoutubeEmbed embedUrl={embed} title={`Récitation de ${name}`} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
