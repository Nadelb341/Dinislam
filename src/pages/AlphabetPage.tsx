import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, Lock } from 'lucide-react';
import { FitText } from '@/components/shared/FitText';
import { useIsOver20 } from '@/hooks/useIsOver20';
import { AlphabetLetterSheet } from '@/components/alphabet/AlphabetLetterSheet';
import { ReadingGameDialog, type ReadingMode } from '@/components/alphabet/ReadingGameDialog';
import type { AlphabetSubmission } from '@/components/alphabet/AlphabetLineRow';
import { ALPHABET_WORDS } from '@/data/alphabetWords';
import { buildLines } from '@/lib/alphabetLines';
import { AlphabetGameDialog } from '@/components/alphabet/AlphabetGameDialog';
import { AlphabetUnlockDialog } from '@/components/alphabet/AlphabetUnlockDialog';
import AdminUnlockAllDialog from '@/components/admin/AdminUnlockAllDialog';
import { computeUnlocked, gameStatus, GAMES, READING_GAMES, type GameKey, type AlphabetLetterLite } from '@/lib/alphabetProgress';
import type { Tables } from '@/integrations/supabase/types';

type Tab = 'apprendre' | 'jouer' | 'progres';
const TAB_KEY = 'dinislam_alphabet_tab';
const readTab = (): Tab => {
  try {
    const v = localStorage.getItem(TAB_KEY);
    return v === 'jouer' || v === 'progres' ? v : 'apprendre';
  } catch { return 'apprendre'; }
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'apprendre', label: '📖 Apprendre' },
  { key: 'jouer', label: '🎮 Jouer' },
  { key: 'progres', label: '📈 Mes progrès' },
];

const AlphabetPage = () => {
  const { user, isAdmin } = useAuth();
  const isOver20 = useIsOver20();
  const queryClient = useQueryClient();
  const [selectedLetter, setSelectedLetter] = useState<Tables<'alphabet_letters'> | null>(null);
  const [tab, setTabState] = useState<Tab>(readTab);
  const [game, setGame] = useState<GameKey | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [reading, setReading] = useState<{ mode: ReadingMode; letters: AlphabetLetterLite[] } | null>(null);

  const setTab = (t: Tab) => {
    setTabState(t);
    try { localStorage.setItem(TAB_KEY, t); } catch { /* stockage indisponible : on garde l'onglet en mémoire seulement */ }
  };

  const { data: letters = [], isLoading } = useQuery({
    queryKey: ['alphabet-letters-page'],
    queryFn: async () => {
      const { data, error } = await supabase.from('alphabet_letters').select('*').order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: contents = [] } = useQuery({
    queryKey: ['alphabet-contents-page'],
    queryFn: async () => {
      const { data, error } = await supabase.from('alphabet_content').select('*').order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['user-alphabet-progress-page', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('user_alphabet_progress').select('*').eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: adminUnlocks = [] } = useQuery({
    queryKey: ['alphabet-admin-unlocks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('alphabet_admin_unlocks').select('letter_id').eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: scores = [] } = useQuery({
    queryKey: ['alphabet-game-scores', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('alphabet_game_scores')
        .select('game, score, total, missed, played_on, created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: pointValues } = useQuery({
    queryKey: ['alphabet-point-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('point_settings').select('action_key, points, is_active')
        .in('action_key', ['alphabet_lettre_apprise', 'alphabet_bonne_reponse']);
      const get = (k: string, d: number) => {
        const row = (data || []).find((r) => r.action_key === k);
        return row ? (row.is_active ? row.points : 0) : d;
      };
      return { lettre: get('alphabet_lettre_apprise', 5), reponse: get('alphabet_bonne_reponse', 1) };
    },
  });

  // Envois de l'élève (exercices par ligne + demandes de validation), du plus récent au plus ancien
  const { data: submissions = [] } = useQuery({
    queryKey: ['alphabet-submissions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('alphabet_submissions').select('*')
        .eq('student_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AlphabetSubmission[];
    },
    enabled: !!user && !isAdmin,
  });

  // Modèles audio de l'enseignante (« écoute ton prof et répète ») : clé « idLettre:ligne »
  const { data: models = new Map<string, string>() } = useQuery({
    queryKey: ['alphabet-line-models'],
    queryFn: async () => {
      const { data, error } = await supabase.from('alphabet_line_models').select('letter_id, line_key, audio_url');
      if (error) throw error;
      return new Map((data || []).map((m) => [`${m.letter_id}:${m.line_key}`, m.audio_url]));
    },
  });

  // Réponse ou validation de l'enseignante : mise à jour en direct
  useEffect(() => {
    if (!user || isAdmin) return;
    const channel = supabase
      .channel(`alphabet-submissions-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alphabet_submissions', filter: `student_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['alphabet-submissions', user.id] });
        queryClient.invalidateQueries({ queryKey: ['user-alphabet-progress-page', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, isAdmin, queryClient]);

  // ── Paliers ────────────────────────────────────────────────────────────────
  const everythingOpen = isAdmin || isOver20;
  const learned = useMemo(() => new Set(progress.filter((p) => p.is_validated).map((p) => p.letter_id)), [progress]);
  const adminSet = useMemo(() => new Set(adminUnlocks.map((u) => u.letter_id)), [adminUnlocks]);
  const { unlocked, currentId } = useMemo(
    () => computeUnlocked(letters.map((l) => l.id), learned, adminSet, everythingOpen),
    [letters, learned, adminSet, everythingOpen],
  );
  const currentLetter = letters.find((l) => l.id === currentId);
  // Admin et 20 ans et plus : tout est ouvert, les jeux utilisent les 28 lettres
  const learnedForGames = useMemo(() => (everythingOpen ? new Set(letters.map((l) => l.id)) : learned), [everythingOpen, letters, learned]);
  // Onglet Jouer = révision : seulement les lettres déjà validées
  const reviewPool = useMemo(() => letters.filter((l) => learnedForGames.has(l.id)), [letters, learnedForGames]);

  // Étoiles par lettre (idée 3) : une par ligne corrigée par l'enseignante
  const starsByLetter = useMemo(() => {
    const seen = new Set<string>();
    const m = new Map<number, number>();
    for (const s of submissions) {
      if (s.kind !== 'exercise' || !s.line_key) continue;
      const k = `${s.letter_id}:${s.line_key}`;
      if (seen.has(k)) continue; // seul le dernier envoi de chaque ligne compte
      seen.add(k);
      if (s.status === 'corrected') m.set(s.letter_id, (m.get(s.letter_id) ?? 0) + 1);
    }
    return m;
  }, [submissions]);
  const pendingFinal = useMemo(() => {
    const seen = new Set<number>();
    const out = new Set<number>();
    for (const s of submissions) {
      if (s.kind !== 'final' || seen.has(s.letter_id)) continue;
      seen.add(s.letter_id);
      if (s.status === 'pending') out.add(s.letter_id);
    }
    return out;
  }, [submissions]);

  // Défi du jour (idée 8) : série de jours joués d'affilée
  const dailyStreak = useMemo(() => {
    const days = new Set(scores.filter((s) => s.game === 'defi_jour').map((s) => s.played_on));
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
    const d = new Date(`${today}T12:00:00`);
    if (!days.has(today)) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days.has(d.toLocaleDateString('en-CA'))) { n++; d.setDate(d.getDate() - 1); }
    return { n, playedToday: days.has(today) };
  }, [scores]);

  // ── Progrès ────────────────────────────────────────────────────────────────
  const missedCount = useMemo(() => {
    const m = new Map<number, number>();
    for (const s of scores) for (const id of s.missed) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
  }, [scores]);
  const toReview = [...missedCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id]) => letters.find((l) => l.id === id)).filter((l): l is NonNullable<typeof l> => !!l);

  const bestByGame = (key: GameKey) => {
    const mine = scores.filter((s) => s.game === key);
    if (!mine.length) return null;
    const best = mine.reduce((b, s) => (s.score / s.total > b.score / b.total ? s : b), mine[0]);
    return { ...best, count: mine.length };
  };
  const starsOf = (score: number, total: number) => {
    const r = score / total;
    return r >= 1 ? 3 : r >= 0.8 ? 2 : r >= 0.5 ? 1 : 0;
  };
  const alphabetPoints = useMemo(() => {
    const best = new Map<string, number>();
    for (const s of scores) {
      const k = `${s.game}|${s.played_on}`;
      best.set(k, Math.max(best.get(k) ?? 0, s.score));
    }
    const gamePts = [...best.values()].reduce((a, b) => a + b, 0) * (pointValues?.reponse ?? 1);
    return learned.size * (pointValues?.lettre ?? 5) + gamePts;
  }, [scores, learned, pointValues]);

  const openLetter = (letter: Tables<'alphabet_letters'>) => {
    if (!unlocked.has(letter.id)) {
      toast(`🔒 Apprends d'abord ${currentLetter ? `${currentLetter.name_french} (${currentLetter.letter_arabic})` : 'les lettres précédentes'}`);
      return;
    }
    setSelectedLetter(letter);
  };

  return (
    <AppLayout title="Alphabet Arabe">
      <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-foreground text-lg">Alphabet Arabe</h2>
              <p className="text-sm text-muted-foreground font-arabic">الحروف العربية</p>
            </div>
            <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-950/40 px-3 py-1 text-sm font-bold">
              ⭐ {learned.size} / {letters.length}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-500"
              style={{ width: `${letters.length ? (learned.size / letters.length) * 100 : 0}%` }}
            />
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setUnlockOpen(true)}>🔓 Débloquer des lettres</Button>
              <AdminUnlockAllDialog moduleType="alphabet" />
            </div>
          )}
        </div>

        {/* Onglets */}
        <div role="tablist" className="grid grid-cols-3 gap-1 rounded-2xl bg-muted/60 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`min-w-0 rounded-xl px-1 py-2 font-semibold transition-colors ${tab === t.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <FitText className="text-sm w-full">{t.label}</FitText>
            </button>
          ))}
        </div>

        {/* ── Apprendre ── */}
        {tab === 'apprendre' && (
          <div className="space-y-3">
            {currentLetter && !isAdmin && (
              <button
                type="button"
                onClick={() => openLetter(currentLetter)}
                className="w-full flex items-center gap-3 rounded-2xl p-3 text-start bg-gradient-to-br from-sky-100 to-violet-100 dark:from-sky-950/40 dark:to-violet-950/40"
              >
                <span className="shrink-0 w-16 h-16 rounded-2xl bg-card grid place-items-center font-arabic text-4xl">{currentLetter.letter_arabic}</span>
                <span className="min-w-0">
                  <span className="block text-xs text-muted-foreground">Ta prochaine lettre</span>
                  <span className="block font-bold [overflow-wrap:anywhere]">{currentLetter.name_french}</span>
                  <span className="block text-xs text-muted-foreground">Touche pour l'écouter et l'apprendre</span>
                </span>
              </button>
            )}

            {isLoading ? (
              <div className="grid grid-cols-4 gap-2">
                {[...Array(28)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)}
              </div>
            ) : (
              <div dir="rtl" className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7">
                {letters.map((letter, index) => {
                  const isLearned = learned.has(letter.id);
                  const isOpen = unlocked.has(letter.id);
                  const isCurrent = letter.id === currentId && !isAdmin;
                  const hasContent = contents.some((c) => c.letter_id === letter.id);
                  return (
                    <button
                      key={letter.id}
                      onClick={() => openLetter(letter)}
                      className={`relative flex flex-col items-center justify-between rounded-2xl p-2 border-2 transition-all active:scale-95 min-h-[84px] ${
                        (starsByLetter.get(letter.id) ?? 0) >= buildLines(letter).length ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.55)]'
                          : isLearned ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700'
                          : isCurrent ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-400'
                          : isOpen ? 'bg-card border-border hover:shadow-md'
                          : 'bg-muted/40 border-transparent opacity-60'
                      }`}
                    >
                      <span className="absolute top-1 start-1.5 text-[9px] text-muted-foreground">#{index + 1}</span>
                      {isLearned && (
                        <span className="absolute top-1 end-1 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-2 w-2 text-white" />
                        </span>
                      )}
                      {!isOpen && <Lock className="absolute top-1 end-1 h-3 w-3 text-muted-foreground" />}
                      {hasContent && isOpen && !isLearned && !pendingFinal.has(letter.id) && <span className="absolute top-1 end-1 w-2 h-2 bg-primary rounded-full" />}
                      {pendingFinal.has(letter.id) && <span className="absolute top-0.5 end-0.5 text-[11px]" aria-label="En attente de validation">⏳</span>}
                      <div className="flex-1 flex items-center justify-center">
                        <span className="font-arabic text-3xl text-foreground">{letter.letter_arabic}</span>
                      </div>
                      <FitText className="text-[10px] font-semibold text-muted-foreground w-full">{letter.name_french}</FitText>
                      {(starsByLetter.get(letter.id) ?? 0) > 0 && (
                        <span className="text-[9px] leading-none text-amber-500">{'★'.repeat(starsByLetter.get(letter.id) ?? 0)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Jouer ── */}
        {tab === 'jouer' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground px-1">🔁 Révision : les jeux utilisent toutes les lettres que ton prof a déjà validées.</p>
            <div className="grid grid-cols-2 gap-2.5">
              {GAMES.filter((g) => g.key !== 'lettre').map((g, i, list) => {
                const st = gameStatus(g.key, letters, learnedForGames, false);
                const best = bestByGame(g.key);
                const last = i === list.length - 1;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => {
                      if (!st.open) { toast(`🔒 ${st.hint}`); return; }
                      if (READING_GAMES.includes(g.key)) setReading({ mode: g.key as ReadingMode, letters: reviewPool });
                      else setGame(g.key);
                    }}
                    className={`rounded-2xl border-2 p-3 text-start flex flex-col gap-0.5 min-w-0 transition-all active:scale-95 ${last ? 'col-span-2' : ''} ${
                      st.open ? g.tile : 'border-dashed border-border bg-transparent opacity-70'
                    }`}
                  >
                    <span className="text-2xl">{st.open ? g.icon : '🔒'}</span>
                    <span className="font-bold text-sm [overflow-wrap:anywhere]">{g.title}</span>
                    <span className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                      {!st.open ? st.hint
                        : g.key === 'defi_jour' ? (dailyStreak.n > 0 ? `🔥 ${dailyStreak.n} jour${dailyStreak.n > 1 ? 's' : ''} de suite${dailyStreak.playedToday ? ' · fait aujourd\'hui ✓' : ''}` : 'Joue chaque jour !')
                        : best ? `Record : ${best.score}/${best.total} ${'★'.repeat(starsOf(best.score, best.total))}`
                        : 'Nouveau !'}
                    </span>
                  </button>
                );
              })}
            </div>

            {toReview.length > 0 && (
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 p-3">
                <p className="font-semibold text-sm">À revoir</p>
                <div dir="rtl" className="flex flex-wrap gap-3 mt-1">
                  {toReview.map((l) => (
                    <button key={l.id} type="button" onClick={() => openLetter(l)} className="font-arabic text-3xl" aria-label={`Revoir ${l.name_french}`}>
                      {l.letter_arabic}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">Les lettres que tu as le plus ratées dans les jeux</p>
              </div>
            )}
          </div>
        )}

        {/* ── Mes progrès ── */}
        {tab === 'progres' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Lettres apprises', value: `${learned.size}/${letters.length}`, cls: 'bg-emerald-50 dark:bg-emerald-950/20' },
                { label: 'Points Alphabet', value: String(alphabetPoints), cls: 'bg-amber-50 dark:bg-amber-950/20' },
                { label: 'Parties jouées', value: String(scores.length), cls: 'bg-sky-50 dark:bg-sky-950/20' },
              ].map((s) => (
                <div key={s.label} className={`rounded-2xl p-3 text-center min-w-0 ${s.cls}`}>
                  <p className="text-xl font-bold tabular-nums">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground [overflow-wrap:anywhere]">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Album d'autocollants (idée 7) : un autocollant par lettre validée */}
            <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
              <p className="font-semibold text-sm">📒 Mon album d'autocollants · {learned.size}/{letters.length}</p>
              <div dir="rtl" className="grid grid-cols-7 gap-1.5">
                {letters.map((l) => {
                  const got = learned.has(l.id);
                  const w = ALPHABET_WORDS[l.letter_arabic];
                  return (
                    <div
                      key={l.id}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center ${got ? 'bg-amber-50 dark:bg-amber-950/30 animate-scale-in' : 'bg-muted/40'}`}
                      title={got && w ? `${l.name_french} · ${w.fr}` : l.name_french}
                    >
                      {got ? (
                        <>
                          <span className="text-xl leading-none">{w?.emoji ?? '⭐'}</span>
                          <span className="font-arabic text-sm leading-none mt-0.5">{l.letter_arabic}</span>
                        </>
                      ) : (
                        <span className="font-arabic text-base text-muted-foreground/40">{l.letter_arabic}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
              <p className="font-semibold text-sm">Mes étoiles</p>
              {GAMES.map((g) => {
                const best = bestByGame(g.key);
                const stars = best ? starsOf(best.score, best.total) : 0;
                return (
                  <div key={g.key} className="flex items-center justify-between gap-2">
                    <span className="text-sm min-w-0 [overflow-wrap:anywhere]">{g.icon} {g.title}</span>
                    <span className="shrink-0 text-amber-500 tracking-wider">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</span>
                  </div>
                );
              })}
            </div>

            {toReview.length > 0 && (
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/20 p-3">
                <p className="font-semibold text-sm">À revoir</p>
                <p dir="rtl" className="font-arabic text-3xl mt-1">{toReview.map((l) => l.letter_arabic).join('  ')}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Chaque lettre apprise rapporte {pointValues?.lettre ?? 5} points, et chaque bonne réponse {pointValues?.reponse ?? 1} point (ta meilleure partie du jour dans chaque jeu). Ils comptent dans le Classement 🏆
            </p>
          </div>
        )}

        {/* Fiche d'une lettre */}
        {selectedLetter && (
          <AlphabetLetterSheet
            letter={selectedLetter}
            isLearned={learned.has(selectedLetter.id)}
            directValidation={everythingOpen}
            isAdmin={isAdmin}
            submissions={submissions}
            models={models}
            contents={contents}
            position={letters.findIndex((l) => l.id === selectedLetter.id) + 1}
            prevLetter={(() => { const i = letters.findIndex((l) => l.id === selectedLetter.id); const l = letters[i - 1]; return l && unlocked.has(l.id) ? l : null; })()}
            nextLetter={(() => { const i = letters.findIndex((l) => l.id === selectedLetter.id); const l = letters[i + 1]; return l && unlocked.has(l.id) ? l : null; })()}
            onLetterChange={setSelectedLetter}
            onPlay={(l) => setReading({ mode: 'lettre', letters: [l] })}
            onClose={() => setSelectedLetter(null)}
          />
        )}

        <ReadingGameDialog mode={reading?.mode ?? null} letters={reading?.letters ?? []} allLetters={letters} onClose={() => setReading(null)} />
        <AlphabetGameDialog game={game} letters={letters} pool={reviewPool} learned={learnedForGames} onClose={() => setGame(null)} />
        {isAdmin && <AlphabetUnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} letters={letters} />}
      </div>
    </AppLayout>
  );
};

export default AlphabetPage;
