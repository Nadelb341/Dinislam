import { Fragment, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, errorMessage } from '@/lib/utils';
import { groupColorProps, groupStudents } from '@/lib/studentGroups';
import { attendanceDates, cycleAttendance, fetchAttendanceSessions, markAllPresent, todayIso } from '@/lib/attendanceSessions';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { AttendanceDateDialog } from '@/components/attendance/AttendanceDateDialog';

type AttendanceStatus = 'present' | 'absent' | 'late';

const STATUS_DISPLAY: Record<AttendanceStatus, { color: string; label: string }> = {
  present: { color: 'bg-green-500', label: 'Présent' },
  absent: { color: 'bg-red-500', label: 'Absent' },
  late: { color: 'bg-yellow-400', label: 'En retard' },
};

const Attendance = () => {
  const { user, isAdmin } = useAuth();
  // Enseignante : date à modifier (string), ajout (null) ou fenêtre fermée (undefined)
  const [editDate, setEditDate] = useState<string | null | undefined>(undefined);

  // Personal attendance
  const { data: myRecords = [] } = useQuery({
    queryKey: ['my-attendance', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // All records for class overview
  const { data: allRecords = [] } = useQuery({
    queryKey: ['all-attendance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch student names
  const { data: students = [] } = useQuery({
    queryKey: ['attendance-students-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('is_approved', true)
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  // Groupes (Groupe 0, 1, 2…) et appartenance de chaque élève — la fonction ne donne que « qui est dans quel groupe »
  const { data: groupData, isError: groupsFailed, refetch: refetchGroups } = useQuery({
    queryKey: ['attendance-groups-overview', user?.id],
    enabled: !!user,
    retry: 3,
    queryFn: async () => {
      const [g, m] = await Promise.all([
        supabase.from('student_groups').select('id, name, color, position'),
        supabase.rpc('attendance_student_groups'),
      ]);
      // Une erreur ne doit plus donner une liste « sans groupes » : on réessaie, puis on le dit
      if (g.error) throw g.error;
      if (m.error) throw m.error;
      return { groups: g.data || [], members: m.data || [] };
    },
  });
  const grouped = useMemo(
    () => groupStudents(students, groupData?.groups ?? [], groupData?.members ?? []),
    [students, groupData],
  );

  // Personal stats
  const myStats = useMemo(() => {
    const present = myRecords.filter(r => r.status === 'present').length;
    const absent = myRecords.filter(r => r.status === 'absent').length;
    const late = myRecords.filter(r => r.status === 'late').length;
    return { present, absent, late, total: myRecords.length };
  }, [myRecords]);

  // Séances enregistrées (une date peut exister sans présence notée)
  const { data: sessions = [] } = useQuery({ queryKey: ['attendance-sessions'], queryFn: fetchAttendanceSessions });

  // Class overview data : pour l'enseignante, la date du jour est toujours là (2026-10-07)
  const savedDates = useMemo(() => attendanceDates(sessions, allRecords, false), [sessions, allRecords]);
  const dates = useMemo(() => attendanceDates(sessions, allRecords, isAdmin), [sessions, allRecords, isAdmin]);
  const today = todayIso();

  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    allRecords.forEach(r => map.set(`${r.user_id}-${r.date}`, r.status as AttendanceStatus));
    return map;
  }, [allRecords]);
  const recordIds = useMemo(() => new Map(allRecords.map(r => [`${r.user_id}-${r.date}`, r.id])), [allRecords]);

  // Enseignante : toucher un rond note la présence (même règle que le Registre)
  const queryClient = useQueryClient();
  const [busyCell, setBusyCell] = useState<string | null>(null);
  const markCell = async (studentId: string, date: string) => {
    const key = `${studentId}-${date}`;
    if (busyCell) return;
    setBusyCell(key);
    try {
      const status = recordMap.get(key);
      await cycleAttendance(studentId, date, status ? { id: recordIds.get(key)!, status } : undefined, user?.id);
      await queryClient.invalidateQueries({ queryKey: ['all-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusyCell(null);
    }
  };

  // Idée 3 : « ✅ Tous présents » pour un groupe, sur la date du jour (seulement les élèves pas encore notés)
  const { askValidation, validationDialog } = useConfirmValidation();
  const allPresent = (groupName: string, ids: string[]) => {
    const todo = ids.filter((id) => !recordMap.has(`${id}-${today}`));
    if (!todo.length) { toast.info('Tous les élèves de ce groupe sont déjà notés aujourd\'hui'); return; }
    askValidation(`Tous présents · ${groupName} ?`, `${todo.length} élève${todo.length > 1 ? 's' : ''} pas encore noté${todo.length > 1 ? 's' : ''} aujourd'hui passe${todo.length > 1 ? 'nt' : ''} en « présent ». Tu changes ensuite les absents et les retards d'un toucher.`, async () => {
      try {
        await markAllPresent(todo, today, user?.id);
        await queryClient.invalidateQueries({ queryKey: ['all-attendance'] });
        queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
        toast.success(`✅ ${todo.length} élève${todo.length > 1 ? 's' : ''} marqué${todo.length > 1 ? 's' : ''} présent${todo.length > 1 ? 's' : ''}`);
      } catch (e) {
        toast.error(errorMessage(e));
      }
    });
  };

  // Deux élèves avec le même prénom (ex. 2 « Lina ») : on ajoute l'initiale du nom
  const displayName = useMemo(() => {
    const first = (n: string | null) => (n || 'Sans nom').trim().split(/\s+/)[0];
    const counts = new Map<string, number>();
    students.forEach(s => counts.set(first(s.full_name).toLowerCase(), (counts.get(first(s.full_name).toLowerCase()) ?? 0) + 1));
    return (full: string | null) => {
      const parts = (full || 'Sans nom').trim().split(/\s+/);
      return (counts.get(parts[0].toLowerCase()) ?? 0) > 1 && parts[1] ? `${parts[0]} ${parts[1][0].toUpperCase()}.` : parts[0];
    };
  }, [students]);

  return (
    <AppLayout title="Ma Présence">
      <div className="p-4 space-y-6">
        {/* Personal Summary */}
        <div className="text-center py-4 animate-fade-in">
          <span className="text-4xl">📋</span>
          <h2 className="text-xl font-bold text-foreground mt-2">Ma Présence</h2>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{myStats.present}</p>
              <p className="text-xs text-muted-foreground">Présent</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{myStats.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{myStats.late}</p>
              <p className="text-xs text-muted-foreground">En retard</p>
            </CardContent>
          </Card>
        </div>

        {myStats.total > 0 && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-foreground font-medium">
                🎉 Tu as été présent <span className="text-green-600 font-bold">{myStats.present}</span> fois sur <span className="font-bold">{myStats.total}</span> séances !
              </p>
            </CardContent>
          </Card>
        )}

        {/* Personal History */}
        {myRecords.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-foreground mb-3">📅 Mon historique</h3>
              {myRecords.slice(0, 10).map(record => {
                const status = record.status as AttendanceStatus;
                const display = STATUS_DISPLAY[status];
                return (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-foreground">
                      {format(parseISO(record.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-5 h-5 rounded-full', display.color)} />
                      <span className="text-xs text-muted-foreground">{display.label}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Class Overview */}
        {dates.length > 0 && students.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">👥 Vue de la classe</h3>

              {isAdmin && <p className="text-xs text-muted-foreground mb-2">Touche un rond pour noter : vide → 🟢 présent → 🔴 absent → 🟡 en retard → vide.</p>}
              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                {Object.entries(STATUS_DISPLAY).map(([key, val]) => (
                  <span key={key} className="flex items-center gap-1">
                    <span className={cn('w-3 h-3 rounded-full inline-block', val.color)} />
                    {val.label}
                  </span>
                ))}
              </div>

              {groupsFailed && (
                <div className="mb-3 rounded-xl bg-amber-100 dark:bg-amber-950/40 p-2 text-sm flex items-center gap-2">
                  <span className="flex-1">Les groupes n'ont pas pu être chargés.</span>
                  <button type="button" className="font-bold underline" onClick={() => refetchGroups()}>Réessayer</button>
                </div>
              )}
              {!groupData && !groupsFailed ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Chargement des groupes…</p>
              ) : (
              <ScrollArea className="w-full">
                <div className="min-w-max">
                  {/* Header */}
                  <div className="flex border-b border-border">
                    <div className="w-32 shrink-0 px-2 py-2 font-semibold text-foreground text-xs sticky left-0 bg-card z-10">
                      Élève
                    </div>
                    {dates.slice(-7).map(date => isAdmin ? (
                      <button
                        key={date}
                        type="button"
                        onClick={() => setEditDate(date)}
                        title="Modifier ou supprimer cette date"
                        className={cn('w-12 shrink-0 text-center py-1 text-[10px] border-l border-border hover:bg-muted/40', date === today ? 'font-bold text-primary bg-primary/10' : 'text-muted-foreground')}
                      >
                        {format(parseISO(date), 'dd/MM', { locale: fr })}
                        <span className="block text-[9px] leading-none">✏️</span>
                      </button>
                    ) : (
                      <div key={date} className="w-12 shrink-0 text-center py-2 text-[10px] text-muted-foreground border-l border-border">
                        {format(parseISO(date), 'dd/MM', { locale: fr })}
                      </div>
                    ))}
                    {isAdmin && (
                      <button type="button" onClick={() => setEditDate(null)} title="Ajouter une date de cours"
                        className="w-12 shrink-0 text-center py-2 text-base font-bold text-primary border-l border-border hover:bg-primary/10">＋</button>
                    )}
                  </div>

                  {/* Rows : par groupe (0, 1, 2…), élèves par ordre alphabétique dans chaque groupe */}
                  {grouped.map((group) => (
                  <Fragment key={group.groupId ?? '__ungrouped__'}>
                  {group.groupName && (
                    <div
                      className={`sticky left-0 flex items-center gap-2 px-2 py-1 text-[11px] font-bold text-white ${groupColorProps(group.groupColor).className}`}
                      style={groupColorProps(group.groupColor).style}
                    >
                      <span>👥 {group.groupName}</span>
                      <span className="opacity-80">— {group.members.length}</span>
                      {isAdmin && (
                        <button type="button" onClick={() => allPresent(group.groupName ?? 'groupe', group.members.map((m) => m.user_id))}
                          className="rounded-full bg-white/25 hover:bg-white/35 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap">
                          ✅ Tous présents aujourd'hui
                        </button>
                      )}
                    </div>
                  )}
                  {group.members.map((student, idx) => (
                    <div
                      key={student.user_id}
                      className={cn(
                        'flex border-b border-border last:border-0',
                        student.user_id === user?.id ? 'bg-yellow-50 dark:bg-yellow-900/20' : idx % 2 === 0 ? 'bg-card' : 'bg-muted/10'
                      )}
                    >
                      <div className="w-32 shrink-0 px-2 py-2 text-xs text-foreground [overflow-wrap:anywhere] sticky left-0 bg-inherit z-10 flex items-center gap-1">
                        {student.user_id === user?.id && <span className="text-yellow-500">⭐</span>}
                        {displayName(student.full_name)}
                      </div>
                      {dates.slice(-7).map(date => {
                        const status = recordMap.get(`${student.user_id}-${date}`);
                        const display = status ? STATUS_DISPLAY[status] : null;
                        return (
                          isAdmin ? (
                            <button
                              key={date}
                              type="button"
                              onClick={() => markCell(student.user_id, date)}
                              disabled={busyCell === `${student.user_id}-${date}`}
                              aria-label={`${student.full_name || 'Élève'} le ${format(parseISO(date), 'dd/MM')} : ${display ? display.label : 'pas noté'}`}
                              className="w-12 shrink-0 flex items-center justify-center border-l border-border py-2 hover:bg-muted/40 active:scale-95"
                            >
                              {display ? (
                                <div className={cn('w-5 h-5 rounded-full', display.color)} />
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-muted-foreground/30" />
                              )}
                            </button>
                          ) : (
                          <div key={date} className="w-12 shrink-0 flex items-center justify-center border-l border-border py-2">
                            {display ? (
                              <div className={cn('w-5 h-5 rounded-full', display.color)} />
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-muted-foreground/20" />
                            )}
                          </div>
                          )
                        );
                      })}
                      {isAdmin && <div className="w-12 shrink-0 border-l border-border" />}
                    </div>
                  ))}
                  </Fragment>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}
        {validationDialog}
        {isAdmin && (
          <AttendanceDateDialog open={editDate !== undefined} date={editDate ?? null} existing={savedDates} onClose={() => setEditDate(undefined)} />
        )}
      </div>
    </AppLayout>
  );
};

export default Attendance;
