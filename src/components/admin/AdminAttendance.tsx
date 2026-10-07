import { useState, useMemo, Fragment } from 'react';
import { CourseModeDialog } from '@/components/home/NextCourse';
import { groupColorProps, groupStudents } from '@/lib/studentGroups';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, errorMessage } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { attendanceDates, cycleAttendance, fetchAttendanceSessions, todayIso } from '@/lib/attendanceSessions';
import { AttendanceDateDialog } from '@/components/attendance/AttendanceDateDialog';

interface AdminAttendanceProps {
  onBack: () => void;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

const STATUS_DISPLAY: Record<AttendanceStatus, { color: string; label: string }> = {
  present: { color: '#22c55e', label: 'Présent' },
  absent: { color: '#ef4444', label: 'Absent' },
  late: { color: '#f59e0b', label: 'En retard' },
};

const AdminAttendance = ({ onBack }: AdminAttendanceProps) => {
  const { user } = useAuth();
  // Date à modifier (string), ajout (null) ou fenêtre fermée (undefined)
  const [editDate, setEditDate] = useState<string | null | undefined>(undefined);
  // Idée 5 (2026-10-07) : mode où toucher une case coupe / remet le message envoyé à l'élève après le cours
  const [msgMode, setMsgMode] = useState(false);
  // Idée 5 : depuis le Registre, ouvrir le « mode cours » du groupe (carte À FAIRE)
  const [courseGroup, setCourseGroup] = useState<{ id: string; name: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: students = [] } = useQuery({
    queryKey: ['attendance-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('is_approved', true)
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: groupData } = useQuery({
    queryKey: ['attendance-group-members', user?.id],
    enabled: !!user,
    retry: 3,
    queryFn: async () => {
      const [g, m] = await Promise.all([
        supabase.from('student_groups').select('id, name, color, position').order('name'),
        supabase.from('student_group_members').select('group_id, user_id'),
      ]);
      if (g.error) throw g.error;
      if (m.error) throw m.error;
      return { groups: g.data || [], members: m.data || [] };
    },
  });

  const { data: records = [], refetch: refetchRecords } = useQuery({
    queryKey: ['attendance-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Séances enregistrées + la date du jour toujours présente (2026-10-07)
  const { data: sessions = [] } = useQuery({ queryKey: ['attendance-sessions'], queryFn: fetchAttendanceSessions });
  const savedDates = useMemo(() => attendanceDates(sessions, records, false), [sessions, records]);
  const dates = useMemo(() => attendanceDates(sessions, records, true), [sessions, records]);
  const today = todayIso();

  const recordMap = useMemo(() => {
    const map = new Map<string, { id: string; status: AttendanceStatus; sendMessage: boolean }>();
    records.forEach(r => {
      map.set(`${r.user_id}-${r.date}`, { id: r.id, status: r.status as AttendanceStatus, sendMessage: r.send_message });
    });
    return map;
  }, [records]);

  // Regroupe les élèves par groupe (0, 1, 2…), par ordre alphabétique dans chaque groupe, sans groupe à la fin
  const groupedStudents = useMemo(
    () => groupStudents(students, groupData?.groups ?? [], groupData?.members ?? []),
    [students, groupData],
  );

  const toggleMessage = async (userId: string, date: string) => {
    const record = recordMap.get(`${userId}-${date}`);
    if (!record) { toast.info("Note d'abord la présence de l'élève pour ce cours"); return; }
    const { error } = await supabase.from('attendance_records').update({ send_message: !record.sendMessage }).eq('id', record.id);
    if (error) { toast.error(error.message); return; }
    toast.success(record.sendMessage ? "🔕 Cet élève ne recevra pas le message pour ce cours" : '💬 Le message sera envoyé à cet élève');
    refetchRecords();
  };

  const handleClickPresence = async (userId: string, date: string, currentStatus?: AttendanceStatus) => {
    if (msgMode) { await toggleMessage(userId, date); return; }
    try {
      const record = recordMap.get(`${userId}-${date}`);
      await cycleAttendance(userId, date, currentStatus && record ? { id: record.id, status: currentStatus } : undefined, user?.id);
    } catch (e) {
      toast.error(errorMessage(e));
      return;
    }
    refetchRecords();
    queryClient.invalidateQueries({ queryKey: ['all-attendance'] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <h2 className="text-xl font-bold text-foreground">📋 Registre de Présence</h2>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {Object.entries(STATUS_DISPLAY).map(([key, val]) => (
          <span key={key} className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: val.color }} />
            {val.label}
          </span>
        ))}
      </div>

      {/* Message envoyé à l'élève après le cours (présent / en retard / absent) */}
      <div className={cn('rounded-xl border p-2.5 text-sm flex flex-wrap items-center gap-2', msgMode ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/30' : 'border-border')}>
        <span className="flex-1 min-w-0">
          {msgMode
            ? '🔕 Touche la case d\'un élève pour couper (ou remettre) le message qu\'il reçoit après ce cours. Ex. : absence justifiée.'
            : '💬 Après chaque cours, l\'élève reçoit une fois un petit message selon sa présence.'}
        </span>
        <Button size="sm" variant={msgMode ? 'default' : 'outline'} onClick={() => setMsgMode((m) => !m)}>
          {msgMode ? 'Terminé' : '🔕 Choisir les messages'}
        </Button>
      </div>

      {/* Tableau */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-max">
            {/* Header */}
            <div className="flex border-b border-border bg-muted/30">
              <div className="w-48 shrink-0 px-4 py-3 font-semibold text-foreground text-sm sticky left-0 bg-muted/30 z-10">
                Élève
              </div>
              {dates.map(date => (
                <button
                  key={date}
                  type="button"
                  onClick={() => setEditDate(date)}
                  title="Modifier ou supprimer cette séance"
                  className={cn('w-20 shrink-0 text-center py-2 text-xs border-l border-border hover:bg-muted/50', date === today ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}
                >
                  <div className="font-semibold">{date === today ? "Aujourd'hui" : format(parseISO(date), 'EEE', { locale: fr })}</div>
                  <div>{format(parseISO(date), 'dd/MM', { locale: fr })}</div>
                  <div className="text-[10px] mt-0.5">✏️</div>
                </button>
              ))}
              <div className="w-16 shrink-0 flex items-center justify-center border-l border-border">
                <Button variant="ghost" size="icon" onClick={() => setEditDate(null)} className="h-8 w-8" title="Ajouter une date de cours">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Rows groupés */}
            {groupedStudents.map(group => (
              <Fragment key={group.groupId ?? '__ungrouped__'}>
                {/* Ligne d'en-tête de groupe */}
                {group.groupName && (
                  <div
                    className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white select-none ${groupColorProps(group.groupColor).className}`}
                    style={groupColorProps(group.groupColor).style}
                  >
                    <span>👥 {group.groupName}</span>
                    <span className="opacity-70">— {group.members.length} élève{group.members.length > 1 ? 's' : ''}</span>
                    {group.groupId && (
                      <button
                        type="button"
                        onClick={() => setCourseGroup({ id: group.groupId, name: group.groupName ?? '' })}
                        className="ms-auto rounded-full bg-white/25 hover:bg-white/35 px-2.5 py-0.5 text-[11px] font-bold"
                      >
                        🎒 Prochain cours
                      </button>
                    )}
                  </div>
                )}
                {group.members.map((student, idx) => (
                  <div
                    key={student.user_id}
                    className={cn(
                      'flex border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors',
                      idx % 2 === 0 ? 'bg-card' : 'bg-muted/10'
                    )}
                  >
                    <div className="w-48 shrink-0 px-4 py-3 text-sm font-medium text-foreground [overflow-wrap:anywhere] sticky left-0 bg-inherit z-10 flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">{idx + 1}.</span>
                      {student.full_name || student.email || 'Sans nom'}
                    </div>
                    {dates.map(date => {
                      const record = recordMap.get(`${student.user_id}-${date}`);
                      const status = record?.status;
                      const display = status ? STATUS_DISPLAY[status] : null;
                      return (
                        <div
                          key={date}
                          className="w-20 shrink-0 flex items-center justify-center border-l border-border cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => handleClickPresence(student.user_id, date, status)}
                        >
                          {display ? (
                            <div className="relative w-7 h-7 rounded-full" style={{ backgroundColor: display.color }}>
                              {record && !record.sendMessage && <span className="absolute -top-1.5 -right-2 text-xs" title="Message coupé">🔕</span>}
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/30" />
                          )}
                        </div>
                      );
                    })}
                    <div className="w-16 shrink-0 border-l border-border" />
                  </div>
                ))}
              </Fragment>
            ))}

            {students.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Aucun élève inscrit
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Résumé */}
      {dates.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-card p-4">
          <h3 className="font-semibold text-foreground mb-3">📊 Résumé</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                {records.filter(r => r.status === 'present').length}
              </div>
              <p className="text-xs text-muted-foreground">Présences</p>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                {records.filter(r => r.status === 'absent').length}
              </div>
              <p className="text-xs text-muted-foreground">Absences</p>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                {records.filter(r => r.status === 'late').length}
              </div>
              <p className="text-xs text-muted-foreground">Retards</p>
            </div>
          </div>
        </div>
      )}

      <AttendanceDateDialog open={editDate !== undefined} date={editDate ?? null} existing={savedDates} level="nested" onClose={() => setEditDate(undefined)} />
      <CourseModeDialog groupId={courseGroup?.id ?? null} groupName={courseGroup?.name ?? ''} open={!!courseGroup} onClose={() => setCourseGroup(null)} />
    </div>
  );
};

export default AdminAttendance;
