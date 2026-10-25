import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PLAN_LABELS, OFFERED_PLANS, totalDaysFor, pagesForDay, dayNumber, dateOfDay, daysBetween, lateDays, percentRead, localDay, type PlanKind, type Programme } from '@/lib/coranPlan';
import { pickEncouragement } from '@/lib/coranEncouragements';
import { withName } from '@/lib/encouragements';
import { cn } from '@/lib/utils';
import { CoranCertificate } from './CoranCertificate';

interface Props {
  programme: Programme | null;
  onSave: (p: Programme) => Promise<void>;
  onStop: () => Promise<void>;
  /** Ouvre le lecteur en mode Programme sur la lecture d'un jour */
  onReadDay: (day: number) => void;
}

const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/** 🗓️ Programme de lecture (2026-10-25) : Ramadan ou À mon rythme (pages par jour ou date de fin). */
export function CoranProgrammeTab({ programme, onSave, onStop, onReadDay }: Props) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanKind>('ramadan');
  const [ppd, setPpd] = useState(5);
  const [start, setStart] = useState(localDay());
  // « À mon rythme » : par nombre de pages par jour, ou par date de fin (demande de Nadia, 2026-10-25)
  const [by, setBy] = useState<'pages' | 'date'>('date');
  const [end, setEnd] = useState(() => dateOfDay(localDay(), 120));
  const [confirmStop, setConfirmStop] = useState(false);

  if (!programme) {
    const maxEnd = dateOfDay(start, 604); // au moins 1 page par jour
    const endOk = end >= start ? (end > maxEnd ? maxEnd : end) : start;
    const byDate = plan === 'rythme' && by === 'date';
    const total = byDate ? daysBetween(start, endOk) : totalDaysFor(plan, ppd);
    const perDay = Math.ceil(604 / total);
    return (
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#c39a3e] mb-2">Choisis ton programme</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OFFERED_PLANS.map((k) => (
              <button key={k} type="button" aria-pressed={plan === k} onClick={() => setPlan(k)}
                className={cn('rounded-2xl border px-4 py-3 text-left transition-colors',
                  plan === k ? 'border-2 border-[#2457a5] bg-blue-50 dark:bg-blue-950/30' : 'border-[#e6d9cc] bg-white dark:bg-[#221413] dark:border-[#3a2523]')}>
                <b className="block text-base">{PLAN_LABELS[k].emoji} {PLAN_LABELS[k].title}</b>
                <span className="text-xs text-muted-foreground">{PLAN_LABELS[k].hint}</span>
              </button>
            ))}
          </div>
        </div>
        {plan === 'rythme' && (
          <div className="rounded-2xl border border-[#e6d9cc] dark:border-[#3a2523] bg-white dark:bg-[#221413] p-4 space-y-3">
            <div className="flex rounded-xl bg-[#f1e5da] dark:bg-[#33201e] p-1">
              {([['date', '🏁 Je choisis ma date de fin'], ['pages', '📄 Je choisis mes pages par jour']] as const).map(([id, label]) => (
                <button key={id} type="button" aria-pressed={by === id} onClick={() => setBy(id)}
                  className={cn('flex-1 rounded-lg py-2 px-1 text-xs sm:text-sm font-bold', by === id ? 'bg-white text-[#2457a5] shadow-sm dark:bg-[#221413]' : 'text-[#75605a] dark:text-[#bfa79f]')}>
                  {label}
                </button>
              ))}
            </div>
            {by === 'date' ? (
              <>
                <label htmlFor="end" className="text-sm font-bold">🏁 Je veux finir le Coran le</label>
                <input id="end" type="date" value={endOk} min={start} max={maxEnd} onChange={(e) => setEnd(e.target.value || endOk)}
                  className="block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
                <p className="text-sm text-muted-foreground">Environ <b className="text-foreground">{perDay} page{perDay > 1 ? 's' : ''} par jour</b> pendant {total} jours</p>
              </>
            ) : (
              <>
                <label htmlFor="ppd" className="text-sm font-bold">📄 {ppd} page{ppd > 1 ? 's' : ''} par jour</label>
                <input id="ppd" type="range" min={1} max={20} value={ppd} onChange={(e) => setPpd(Number(e.target.value))} className="w-full accent-[#2457a5]" />
              </>
            )}
          </div>
        )}
        <div className="rounded-2xl border border-[#e6d9cc] dark:border-[#3a2523] bg-white dark:bg-[#221413] p-4 space-y-2">
          <label htmlFor="start" className="text-sm font-bold">📅 Je commence le</label>
          <input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value || localDay())}
            className="block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
          <p className="text-sm text-muted-foreground">
            {total} jours de lecture · tout le Coran lu le <b className="text-foreground">{fmt(dateOfDay(start, total))}</b> in shā' Allah
          </p>
        </div>
        <Button className="w-full bg-[#2457a5] hover:bg-[#183e7c] text-white text-base py-6"
          onClick={() => void onSave({ plan, start, totalDays: total, pagesPerDay: plan === 'rythme' && !byDate ? ppd : undefined, endDate: byDate ? endOk : undefined, doneDays: [], reminder: true })}>
          🚀 Commencer mon programme
        </Button>
      </div>
    );
  }

  const p = programme;
  const today = Math.min(Math.max(dayNumber(p.start), 1), p.totalDays);
  const notStarted = dayNumber(p.start) < 1;
  const todayRange = pagesForDay(p, today);
  const late = lateDays(p);
  const pct = percentRead(p);
  const finished = p.doneDays.length >= p.totalDays;
  // Calendrier : 30 cases autour d'aujourd'hui
  const first = Math.max(1, Math.min(today - 14, p.totalDays - 29));
  const days = Array.from({ length: Math.min(30, p.totalDays) }, (_, i) => first + i);

  return (
    <div className="space-y-4">
      {finished ? (
        <CoranCertificate name={(user?.user_metadata?.full_name as string | undefined) || ''} plan={p} />
      ) : (
        <button type="button" onClick={() => onReadDay(today)} disabled={notStarted}
          className="w-full rounded-2xl bg-gradient-to-br from-[#2457a5] to-[#183e7c] text-white px-4 py-4 text-left shadow active:scale-[0.99] transition-transform disabled:opacity-70">
          <span className="text-xs font-bold opacity-90">
            {notStarted ? `⏳ Ton programme commence le ${fmt(p.start)}` : `▶️ Aujourd'hui · jour ${today} sur ${p.totalDays}${p.doneDays.includes(today) ? ' · ✅ fait' : ''}`}
          </span>
          <b className="block text-lg">Pages {todayRange.from} à {todayRange.to}</b>
          <span className="text-xs opacity-90">Touche pour ouvrir la lecture du jour</span>
        </button>
      )}

      {!finished && (
        <p className="rounded-2xl bg-[#f5ead1] dark:bg-[#3b2e14] px-4 py-3 text-sm font-semibold text-[#6d4f0e] dark:text-[#f3d38b]">
          {withName(user, pickEncouragement(late.length > 0 ? 'late' : pct >= 50 && pct < 60 ? 'halfway' : 'today', today))}
        </p>
      )}

      <div>
        <div className="flex justify-between text-sm font-bold mb-1"><span>{pct} % du Coran lu</span><span>{PLAN_LABELS[p.plan].emoji} {PLAN_LABELS[p.plan].title}</span></div>
        <div className="h-2.5 rounded-full bg-[#f1e5da] dark:bg-[#33201e] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#2457a5] to-[#c39a3e] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {late.length > 0 && !finished && (
        <div className="rounded-2xl border border-[#c39a3e]/50 bg-[#f5ead1] dark:bg-[#3b2e14] p-3 space-y-2">
          <p className="text-sm font-bold">⏰ À rattraper : {late.length} jour{late.length > 1 ? 's' : ''}</p>
          <div className="flex flex-wrap gap-1.5">
            {late.slice(0, 8).map((d) => {
              const r = pagesForDay(p, d);
              return <button key={d} type="button" onClick={() => onReadDay(d)} className="rounded-full bg-white dark:bg-[#221413] border px-3 py-1 text-xs font-bold">Jour {d} · p. {r.from}-{r.to}</button>;
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#c39a3e] mb-2">Mon calendrier</p>
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
          {days.map((d) => (
            <button key={d} type="button" onClick={() => onReadDay(d)}
              aria-label={`Jour ${d}${p.doneDays.includes(d) ? ', fait' : ''}`}
              className={cn('aspect-square rounded-lg border text-xs font-bold tabular-nums grid place-items-center',
                p.doneDays.includes(d) ? 'bg-[#2457a5] border-[#2457a5] text-white'
                  : d === today && !notStarted ? 'border-2 border-[#c39a3e] text-[#8a6512] dark:text-[#e0bb62]'
                    : 'border-[#e6d9cc] bg-white text-muted-foreground dark:bg-[#221413] dark:border-[#3a2523]')}>
              {p.doneDays.includes(d) ? '✓' : d}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#e6d9cc] dark:border-[#3a2523] bg-white dark:bg-[#221413] px-4 py-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={p.reminder} onChange={(e) => void onSave({ ...p, reminder: e.target.checked })} className="h-4 w-4 accent-[#2457a5]" />
          🔔 Me rappeler à 20 h si je n'ai pas lu
        </label>
        <button type="button" onClick={() => setConfirmStop(true)} className="text-xs font-bold text-destructive">Arrêter ce programme</button>
      </div>

      <AlertDialog open={confirmStop} onOpenChange={setConfirmStop}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arrêter ce programme ?</AlertDialogTitle>
            <AlertDialogDescription>Ton programme {PLAN_LABELS[p.plan].title} ({p.doneDays.length} jour{p.doneDays.length > 1 ? 's' : ''} lus) ira dans la corbeille de Paramètres, d'où tu pourras le restaurer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onStop()}>Arrêter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
