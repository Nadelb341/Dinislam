import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useEngagement } from '@/hooks/useEngagement';
import { dropoutLevel, dropoutReason } from '@/lib/engagement';
import { EncourageDialog } from '@/components/home/DropoutAlerts';

/**
 * 📈 Fiche « suivi » d'un élève (idée 4, 2026-10-08), dans bouclier › Élèves › un élève :
 * frise des 10 dernières semaines (🟩 tout fait · 🟨 en partie · 🟥 rien), présences, encouragements déjà envoyés.
 */
export function StudentFollowUp({ userId }: { userId: string }) {
  const { data: engagement = [] } = useEngagement();
  const [encourage, setEncourage] = useState(false);
  const eng = engagement.find((e) => e.student_id === userId);

  const { data } = useQuery({
    queryKey: ['student-followup', userId],
    queryFn: async () => {
      const [att, logs] = await Promise.all([
        supabase.from('attendance_records').select('date, status').eq('user_id', userId).order('date', { ascending: false }).limit(20),
        supabase.from('encouragement_logs').select('message, automatic, sent_at').eq('student_id', userId).order('sent_at', { ascending: false }).limit(10),
      ]);
      return { att: att.data || [], logs: logs.data || [] };
    },
  });

  if (!eng) return null;
  const level = dropoutLevel(eng);
  const weeks = [...eng.weeks].slice(0, 10).reverse(); // de la plus ancienne à la plus récente
  const att = data?.att ?? [];
  const present = att.filter((a) => a.status === 'present' || a.status === 'late').length;
  let absentRow = 0;
  for (const a of att) { if (a.status === 'absent') absentRow += 1; else break; }
  const short = (d: string) => new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

  return (
    <div className={`rounded-2xl border-2 p-3 space-y-3 ${level === 'red' ? 'border-red-400 bg-red-50/60 dark:bg-red-950/20' : level === 'orange' ? 'border-orange-300 bg-orange-50/60 dark:bg-orange-950/20' : 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">📈 Suivi</p>
        <span className="text-xs font-bold">{level === 'red' ? '🔴 décroche' : level === 'orange' ? '🟠 à surveiller' : '🟢 ça avance'}</span>
      </div>
      {level && <p className="text-xs">{dropoutReason(eng)}</p>}

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Chemin de la semaine (10 dernières semaines)</p>
        {weeks.length === 0 ? <p className="text-xs text-muted-foreground">Pas encore de chemin.</p> : (
          <div className="flex flex-wrap gap-1">
            {weeks.map((w) => (
              <span key={w.week} title={`${short(w.week)} : ${w.done}/${w.total} diamant(s)`}
                className={`h-7 min-w-[2.6rem] px-1 rounded-md grid place-items-center text-[10px] font-bold text-white ${w.done === 0 ? 'bg-red-500' : w.done === w.total ? 'bg-emerald-600' : 'bg-yellow-500'}`}>
                {short(w.week)}
              </span>
            ))}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">🟩 tout fait · 🟨 en partie · 🟥 aucun diamant</p>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        <span className="rounded-full bg-card px-2.5 py-1 font-semibold">📋 Présences : {present}/{att.length}</span>
        {absentRow >= 2 && <span className="rounded-full bg-red-100 dark:bg-red-950/40 px-2.5 py-1 font-semibold">{absentRow} absences de suite</span>}
        <span className="rounded-full bg-card px-2.5 py-1 font-semibold">✅ Dernière validation : {eng.last_validation ? short(eng.last_validation) : 'aucune'}</span>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">✉️ Encouragements envoyés</p>
        {(data?.logs ?? []).length === 0 ? <p className="text-xs text-muted-foreground">Aucun pour l'instant.</p> : (data?.logs ?? []).map((l) => (
          <p key={l.sent_at} className="text-xs rounded-lg bg-card px-2 py-1.5 [overflow-wrap:anywhere]">
            <b>{short(l.sent_at)} {l.automatic ? '🤖' : '✉️'}</b> {l.message}
          </p>
        ))}
      </div>
      <Button size="sm" variant="outline" className="w-full" onClick={() => setEncourage(true)}>✉️ Encourager</Button>
      <EncourageDialog student={encourage ? eng : null} onClose={() => setEncourage(false)} />
    </div>
  );
}
