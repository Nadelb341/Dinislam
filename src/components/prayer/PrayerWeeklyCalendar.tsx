import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface DayPrayerData {
  date: string; // YYYY-MM-DD
  count: number; // 0-5
}

interface PrayerWeeklyCalendarProps {
  prayerData: DayPrayerData[];
}

function getColorForCount(count: number): string {
  if (count === 5) return 'bg-blue-500 text-white';
  if (count === 4) return 'bg-green-500 text-white';
  if (count === 3) return 'bg-yellow-400 text-white';
  if (count === 2) return 'bg-orange-500 text-white';
  if (count === 1) return 'bg-red-300 text-white';
  return 'bg-red-600 text-white';
}

function getLegendColor(count: number): string {
  if (count === 5) return 'bg-blue-500';
  if (count === 4) return 'bg-green-500';
  if (count === 3) return 'bg-yellow-400';
  if (count === 2) return 'bg-orange-500';
  if (count === 1) return 'bg-red-300';
  return 'bg-red-600';
}

const DAYS_FR = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];

const PrayerWeeklyCalendar = ({ prayerData }: PrayerWeeklyCalendarProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build the 7-day week (Mon to Sun of current week)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    // Monday offset
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const prayerMap = useMemo(() => {
    const map: Record<string, number> = {};
    prayerData.forEach(({ date, count }) => { map[date] = count; });
    return map;
  }, [prayerData]);

  const todayKey = toKey(today);

  return (
    <div className="bg-card rounded-2xl p-4 space-y-3 border border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Suivi de la semaine</h3>
        <p className="text-xs text-muted-foreground">
          {today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS_FR.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {weekDays.map((day) => {
          const key = toKey(day);
          const count = prayerMap[key] ?? -1; // -1 = no data
          const isToday = key === todayKey;
          const isFuture = day > today;

          return (
            <div key={key} className="flex flex-col items-center gap-0.5">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  isFuture
                    ? 'bg-muted/40 text-muted-foreground/50'
                    : count >= 0
                    ? getColorForCount(count)
                    : 'bg-muted text-muted-foreground',
                  isToday && 'ring-2 ring-offset-1 ring-primary'
                )}
              >
                {day.getDate()}
              </div>
              {!isFuture && count >= 0 && (
                <span className="text-[9px] text-muted-foreground">{count}/5</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
        {[
          { count: 5, label: '5 prières' },
          { count: 4, label: '4' },
          { count: 3, label: '3' },
          { count: 2, label: '2' },
          { count: 1, label: '1' },
          { count: 0, label: '0' },
        ].map(({ count, label }) => (
          <div key={count} className="flex items-center gap-1">
            <div className={cn('w-3 h-3 rounded-full', getLegendColor(count))} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrayerWeeklyCalendar;
