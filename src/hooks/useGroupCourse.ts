import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { nextCourse, type GroupSchedule, type Holiday } from '@/lib/groupCourse';

/** Vacances scolaires (zone C) enregistrées dans l'appli */
export function useHolidays() {
  return useQuery({
    queryKey: ['group-course', 'holidays'],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from('school_holidays').select('label, start_date, end_date').order('start_date');
      if (error) throw error;
      return (data || []) as Holiday[];
    },
  });
}

/** Horaire d'un groupe + date de son prochain cours (vacances sautées) */
export function useGroupCourse(groupId: string | null | undefined) {
  const { data: holidays = [] } = useHolidays();
  const { data: schedule = null, isLoading } = useQuery({
    queryKey: ['group-course', 'schedule', groupId ?? null],
    enabled: !!groupId,
    queryFn: async () => {
      const { data, error } = await supabase.from('group_schedules').select('group_id, weekday, start_time').eq('group_id', groupId!).maybeSingle();
      if (error) throw error;
      return (data as GroupSchedule | null) ?? null;
    },
  });
  const next = schedule ? nextCourse(schedule, holidays) : null;
  return { schedule, holidays, next, isLoading };
}
