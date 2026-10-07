import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GAMES } from '@/lib/alphabetProgress';
import { AlphabetUnlockDialog } from './AlphabetUnlockDialog';

/** Fiche élève (admin) : où en est l'élève dans l'Alphabet, ses scores et les lettres qu'il rate le plus */
export function AlphabetStudentSummary({ userId }: { userId: string }) {
  const [unlockOpen, setUnlockOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['alphabet-student-summary', userId],
    queryFn: async () => {
      const [{ data: letters }, { data: progress }, { data: scores }, { data: unlocks }, { count: traced }] = await Promise.all([
        supabase.from('alphabet_letters').select('id, letter_arabic, name_french, audio_url, position_isolated, position_initial, position_medial, position_final').order('display_order'),
        supabase.from('user_alphabet_progress').select('letter_id').eq('user_id', userId).eq('is_validated', true),
        supabase.from('alphabet_game_scores').select('game, score, total, missed, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),
        supabase.from('alphabet_admin_unlocks').select('letter_id').eq('user_id', userId),
        supabase.from('alphabet_trace_stars').select('letter_id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);
      return { letters: letters || [], learned: progress?.length ?? 0, scores: scores || [], unlocks: unlocks?.length ?? 0, traced: traced ?? 0 };
    },
  });

  if (!data) return null;
  const { letters, learned, scores, unlocks, traced } = data;

  const missedCount = new Map<number, number>();
  for (const s of scores) for (const id of s.missed) missedCount.set(id, (missedCount.get(id) ?? 0) + 1);
  const mostMissed = [...missedCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, n]) => ({ letter: letters.find((l) => l.id === id), n }));

  return (
    <div className="rounded-2xl border border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/20 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">🔤 Alphabet</p>
        <span className="text-sm font-bold text-primary">{learned} / {letters.length} lettres</span>
      </div>
      <p className="text-xs text-muted-foreground">✍️ Étoiles de tracé : <b className="text-foreground">{traced} / {letters.length * 4}</b> formes bien tracées</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {GAMES.map((g) => {
          const mine = scores.filter((s) => s.game === g.key);
          const best = mine.reduce((m, s) => Math.max(m, s.score / s.total), 0);
          return (
            <div key={g.key} className={`rounded-xl border p-2 min-w-0 ${g.tile}`}>
              <p className="text-xs font-semibold [overflow-wrap:anywhere]">{g.icon} {g.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {mine.length ? `${mine.length} partie(s) · record ${Math.round(best * 100)} %` : 'Pas encore joué'}
              </p>
            </div>
          );
        })}
      </div>

      {mostMissed.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground">Lettres les plus ratées</p>
          <div dir="rtl" className="flex flex-wrap gap-2 mt-1">
            {mostMissed.map(({ letter, n }) => letter && (
              <span key={letter.id} className="rounded-lg bg-rose-100 dark:bg-rose-950/40 px-2 py-1">
                <span className="font-arabic text-xl">{letter.letter_arabic}</span>
                <span className="text-[10px] text-muted-foreground ms-1">×{n}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <Button size="sm" variant="outline" className="w-full" onClick={() => setUnlockOpen(true)}>
        🔓 Débloquer des lettres{unlocks ? ` (${unlocks} déjà débloquée${unlocks > 1 ? 's' : ''})` : ''}
      </Button>
      <AlphabetUnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} letters={letters} initialStudentId={userId} />
    </div>
  );
}
