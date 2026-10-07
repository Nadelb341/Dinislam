import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeUnlocked } from '@/lib/alphabetProgress';

/** Idée bonus 9 : grille élèves × 28 lettres (validée, demandée, en cours, débloquée par toi, fermée) */
export function AlphabetProgressGrid() {
  const { data } = useQuery({
    queryKey: ['admin-alphabet-grid'],
    queryFn: async () => {
      const [{ data: profiles }, { data: admins }, { data: letters }, { data: progress }, { data: unlocks }, { data: finals }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').eq('is_approved', true).order('full_name'),
        supabase.from('user_roles').select('user_id').eq('role', 'admin'),
        supabase.from('alphabet_letters').select('id, letter_arabic, name_french').order('display_order'),
        supabase.from('user_alphabet_progress').select('user_id, letter_id').eq('is_validated', true),
        supabase.from('alphabet_admin_unlocks').select('user_id, letter_id'),
        supabase.from('alphabet_submissions').select('student_id, letter_id').eq('kind', 'final').eq('status', 'pending'),
      ]);
      const adminIds = new Set((admins || []).map((a) => a.user_id));
      return {
        students: (profiles || []).filter((p) => !adminIds.has(p.user_id)),
        letters: letters || [],
        progress: progress || [],
        unlocks: unlocks || [],
        finals: finals || [],
      };
    },
  });
  if (!data) return <div className="h-40 rounded-2xl bg-muted/50 animate-pulse" />;
  const ids = data.letters.map((l) => l.id);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span>🟩 validée</span><span>🟨 demandée</span><span>🟦 en cours</span><span>🟪 débloquée par toi</span><span>⬜ fermée</span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="text-xs border-separate border-spacing-0.5 p-1">
          <thead>
            <tr>
              <th className="sticky start-0 bg-card text-start px-2 font-semibold">Élève</th>
              {[...data.letters].reverse().map((l) => (
                <th key={l.id} className="font-arabic text-base font-bold w-7" title={l.name_french}>{l.letter_arabic}</th>
              ))}
              <th className="px-1">✓</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((s) => {
              const learned = new Set(data.progress.filter((p) => p.user_id === s.user_id).map((p) => p.letter_id));
              const admin = new Set(data.unlocks.filter((u) => u.user_id === s.user_id).map((u) => u.letter_id));
              const asked = new Set(data.finals.filter((f) => f.student_id === s.user_id).map((f) => f.letter_id));
              const { currentId } = computeUnlocked(ids, learned, new Set(), false);
              return (
                <tr key={s.user_id}>
                  <td className="sticky start-0 bg-card px-2 py-1 font-semibold whitespace-nowrap">{s.full_name || 'Élève'}</td>
                  {[...data.letters].reverse().map((l) => {
                    const cls = learned.has(l.id) ? 'bg-emerald-400'
                      : asked.has(l.id) ? 'bg-amber-300'
                      : l.id === currentId ? 'bg-sky-400'
                      : admin.has(l.id) ? 'bg-violet-300'
                      : 'bg-muted';
                    return <td key={l.id} className={`h-6 w-7 rounded ${cls}`} title={`${s.full_name ?? 'Élève'} · ${l.name_french}`} />;
                  })}
                  <td className="px-1 text-center font-bold tabular-nums">{learned.size}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">Lecture de droite à gauche, comme l'alphabet. Fais glisser le tableau sur le côté pour tout voir.</p>
    </div>
  );
}
