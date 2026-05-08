import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft, User, Search,
  Moon, Sparkles, BookOpen, Hand, BookMarked,
  MessageSquare, MoreVertical, CalendarIcon, KeyRound, Eye, EyeOff,
  TrendingDown, Loader2, Trash2,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import AdminStudentGroups from './AdminStudentGroups';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';

interface StudentProgress {
  sourates: { validated: number; total: number };
  ramadan: { completed: number; total: number };
  nourania: { validated: number; total: number };
  prayer: { validated: number; total: number };
  alphabet: { validated: number; total: number };
  invocations: { memorized: number; total: number };
}

interface AdminStudentDetailsProps {
  onBack: () => void;
}

const AdminStudentDetails = ({ onBack }: AdminStudentDetailsProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string; email: string; full_name: string | null;
  } | null>(null);

  // DOB dialog state
  const [dobDialogStudent, setDobDialogStudent] = useState<{ id: string; full_name: string | null } | null>(null);
  const [dobValue, setDobValue] = useState('');
  const [savingDob, setSavingDob] = useState(false);

  // Password dialog state
  const [pwdDialogStudent, setPwdDialogStudent] = useState<{ id: string; full_name: string | null; plain_password: string | null } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; userId: string; name: string }>({ open: false, userId: '', name: '' });

  // Retrograde confirm state
  const [retrogradeTarget, setRetrogradeTarget] = useState<{
    table: 'user_sourate_progress' | 'user_nourania_progress' | 'user_invocation_progress';
    requestTable: 'sourate_validation_requests' | 'nourania_validation_requests' | 'invocation_validation_requests';
    itemIdField: string;
    itemId: string | number;
    label: string;
  } | null>(null);

  const { data: students, isLoading } = useQuery({
    queryKey: ['admin-students-details'],
    queryFn: async () => {
      const [{ data: profiles, error: profilesError }, { data: studentRoles, error: rolesError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, email, full_name, created_at, date_of_birth, gender, plain_password')
          .eq('is_approved', true),
        supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'student'),
      ]);

      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;

      const studentIds = new Set((studentRoles || []).map((role) => role.user_id));
      return (profiles || []).filter((profile) => studentIds.has(profile.user_id));
    },
  });

  const { data: studentProgress } = useQuery({
    queryKey: ['student-progress-details', selectedStudent?.id],
    enabled: !!selectedStudent,
    queryFn: async () => {
      if (!selectedStudent) return null;

      const [
        { data: sourateProgress }, { data: ramadanProgress },
        { data: nouraniaProgress }, { data: prayerProgress },
        { data: alphabetProgress }, { data: invocationProgress },
        { count: totalSourates }, { count: totalRamadanDays },
        { count: totalNouraniaLessons }, { count: totalPrayerCategories },
        { count: totalAlphabetLetters }, { count: totalInvocations },
      ] = await Promise.all([
        supabase.from('user_sourate_progress').select('is_validated').eq('user_id', selectedStudent.id),
        supabase.from('user_ramadan_progress').select('video_watched, quiz_completed, pdf_read').eq('user_id', selectedStudent.id),
        supabase.from('user_nourania_progress').select('is_validated').eq('user_id', selectedStudent.id),
        supabase.from('user_prayer_progress').select('is_validated').eq('user_id', selectedStudent.id),
        supabase.from('user_alphabet_progress').select('is_validated').eq('user_id', selectedStudent.id),
        supabase.from('user_invocation_progress').select('is_memorized').eq('user_id', selectedStudent.id),
        supabase.from('sourates').select('*', { count: 'exact', head: true }),
        supabase.from('ramadan_days').select('*', { count: 'exact', head: true }),
        supabase.from('nourania_lessons').select('*', { count: 'exact', head: true }),
        supabase.from('prayer_categories').select('*', { count: 'exact', head: true }),
        supabase.from('alphabet_letters').select('*', { count: 'exact', head: true }),
        supabase.from('invocations').select('*', { count: 'exact', head: true }),
      ]);
      return {
        sourates: { validated: sourateProgress?.filter(p => p.is_validated).length || 0, total: totalSourates || 0 },
        ramadan: { completed: ramadanProgress?.filter(p => p.quiz_completed).length || 0, total: totalRamadanDays || 0 },
        nourania: { validated: nouraniaProgress?.filter(p => p.is_validated).length || 0, total: totalNouraniaLessons || 0 },
        prayer: { validated: prayerProgress?.filter(p => p.is_validated).length || 0, total: totalPrayerCategories || 0 },
        alphabet: { validated: alphabetProgress?.filter(p => p.is_validated).length || 0, total: totalAlphabetLetters || 0 },
        invocations: { memorized: invocationProgress?.filter(p => p.is_memorized).length || 0, total: totalInvocations || 0 },
      } as StudentProgress;
    },
  });

  // Detailed validated items for retrograde
  const { data: validatedDetails } = useQuery({
    queryKey: ['student-validated-details', selectedStudent?.id],
    enabled: !!selectedStudent,
    queryFn: async () => {
      if (!selectedStudent) return null;
      const uid = selectedStudent.id;

      const [
        { data: sourateRows },
        { data: nouraniaRows },
        { data: invocationRows },
      ] = await Promise.all([
        supabase
          .from('user_sourate_progress')
          .select('id, sourate_id, sourates(number, name_french)')
          .eq('user_id', uid)
          .eq('is_validated', true),
        supabase
          .from('user_nourania_progress')
          .select('id, lesson_id, nourania_lessons(lesson_number, title_french)')
          .eq('user_id', uid)
          .eq('is_validated', true),
        supabase
          .from('user_invocation_progress')
          .select('id, invocation_id, invocations(title_french)')
          .eq('user_id', uid)
          .eq('is_validated', true),
      ]);

      return {
        sourates: (sourateRows || []).map((r: any) => ({
          progressId: r.id,
          itemId: r.sourate_id,
          label: `${r.sourates?.number} — ${r.sourates?.name_french}`,
        })),
        nourania: (nouraniaRows || []).map((r: any) => ({
          progressId: r.id,
          itemId: r.lesson_id,
          label: `Leçon ${r.nourania_lessons?.lesson_number} — ${r.nourania_lessons?.title_french}`,
        })),
        invocations: (invocationRows || []).map((r: any) => ({
          progressId: r.id,
          itemId: r.invocation_id,
          label: r.invocations?.title_french,
        })),
      };
    },
  });

  const retrogradeMutation = useMutation({
    mutationFn: async (target: NonNullable<typeof retrogradeTarget>) => {
      if (!selectedStudent) throw new Error('Aucun élève sélectionné');

      // 1. Mettre is_validated = false dans la table de progression
      const { error: progressError } = await (supabase as any)
        .from(target.table)
        .update({ is_validated: false })
        .eq('user_id', selectedStudent.id)
        .eq(target.itemIdField, target.itemId);
      if (progressError) throw progressError;

      // 2. Supprimer la demande de validation (pour que l'élève puisse re-soumettre)
      await (supabase as any)
        .from(target.requestTable)
        .delete()
        .eq('user_id', selectedStudent.id)
        .eq(target.itemIdField, target.itemId);
    },
    onSuccess: (_, target) => {
      toast.success(`🔓 "${target.label}" rétrogradé — l'élève devra re-soumettre`);
      queryClient.invalidateQueries({ queryKey: ['student-progress-details', selectedStudent?.id] });
      queryClient.invalidateQueries({ queryKey: ['student-validated-details', selectedStudent?.id] });
      setRetrogradeTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erreur lors de la rétrogradation');
    },
  });

  const filteredStudents = students?.filter((s) =>
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  // DOB helpers
  const handleDobInputChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '';
    if (digits.length <= 2) formatted = digits;
    else if (digits.length <= 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
    else formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
    setDobValue(formatted);
  };

  const parseDobToISO = (dob: string): string | null => {
    const match = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, day, month, year] = match;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(d.getTime()) || d.getDate() !== parseInt(day) || d.getMonth() !== parseInt(month) - 1) return null;
    return `${year}-${month}-${day}`;
  };

  const openDobDialog = (student: any) => {
    setDobDialogStudent({ id: student.user_id, full_name: student.full_name });
    if (student.date_of_birth) {
      const [y, m, d] = student.date_of_birth.split('-');
      setDobValue(`${d}/${m}/${y}`);
    } else {
      setDobValue('');
    }
  };

  const handleSaveDob = async () => {
    if (!dobDialogStudent) return;
    const iso = parseDobToISO(dobValue);
    if (!iso) {
      toast.error('Date invalide. Format : JJ/MM/AAAA');
      return;
    }
    setSavingDob(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ date_of_birth: iso })
        .eq('user_id', dobDialogStudent.id);
      if (error) throw error;
      toast.success('Date de naissance mise à jour ✓');
      queryClient.invalidateQueries({ queryKey: ['admin-students-details'] });
      setDobDialogStudent(null);
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setSavingDob(false);
    }
  };

  const openPasswordDialog = (student: any) => {
    setPwdDialogStudent({ id: student.user_id, full_name: student.full_name, plain_password: student.plain_password || null });
    setNewPassword('');
    setShowCurrentPwd(false);
    setShowNewPwd(false);
  };

  const handleSavePassword = async () => {
    if (!pwdDialogStudent || newPassword.length < 6) return;
    setSavingPwd(true);
    try {
      const res = await supabase.functions.invoke('update-user-password', {
        body: { user_id: pwdDialogStudent.id, new_password: newPassword },
      });
      if (res.error) throw new Error(res.error.message || 'Erreur');
      const body = res.data as any;
      if (body?.error) throw new Error(body.error);

      toast.success('Mot de passe mis à jour ✓');
      queryClient.invalidateQueries({ queryKey: ['admin-students-details'] });
      setPwdDialogStudent(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setSavingPwd(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success('Élève supprimé ✅');
      queryClient.invalidateQueries({ queryKey: ['admin-students-details'] });
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    }
    setDeleteConfirm({ open: false, userId: '', name: '' });
  };

  const progressBar = (value: number, total: number, label: string, icon: React.ReactNode) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </div>
          <Badge variant={percentage >= 100 ? 'default' : 'outline'}>{percentage}%</Badge>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">{value}/{total}</p>
      </div>
    );
  };

  const RetrogradeList = ({
    items,
    table,
    requestTable,
    itemIdField,
    emptyLabel,
  }: {
    items: { progressId: string; itemId: string | number; label: string }[];
    table: NonNullable<typeof retrogradeTarget>['table'];
    requestTable: NonNullable<typeof retrogradeTarget>['requestTable'];
    itemIdField: string;
    emptyLabel: string;
  }) => {
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-4">{emptyLabel}</p>;
    }
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.progressId}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border"
          >
            <span className="text-sm text-foreground flex-1 min-w-0 [overflow-wrap:anywhere]">{item.label}</span>
            <Button
              size="sm"
              variant="ghost"
              className="flex-shrink-0 h-7 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              onClick={() => setRetrogradeTarget({ table, requestTable, itemIdField, itemId: item.itemId, label: item.label })}
            >
              <TrendingDown className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Rétrograder</span>
            </Button>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse"><CardContent className="h-20 bg-muted/50" /></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Élèves</h2>
          <p className="text-sm text-muted-foreground">{students?.length || 0} élève(s)</p>
        </div>
      </div>

      <AdminStudentGroups />

      <div className="border-t pt-4 mt-2">
        <h3 className="text-base font-semibold text-foreground mb-3">📋 Liste des élèves</h3>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un élève..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="space-y-3">
        {filteredStudents?.map((student) => (
          <Card key={student.user_id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => setSelectedStudent({ id: student.user_id, email: student.email || '', full_name: student.full_name })}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{student.full_name || 'Élève'}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                  {student.created_at && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      📅 Inscrit le {new Date(student.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[600]">
                  <DropdownMenuItem onClick={() => setSelectedStudent({ id: student.user_id, email: student.email || '', full_name: student.full_name })}>
                    <BookOpen className="h-4 w-4 mr-2" /> Voir la progression
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openDobDialog(student)}>
                    <CalendarIcon className="h-4 w-4 mr-2" /> 📅 Changer Date Naissance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openPasswordDialog(student)}>
                    <KeyRound className="h-4 w-4 mr-2" /> 🔑 Modifier le mot de passe
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setDeleteConfirm({ open: true, userId: student.user_id, name: student.full_name || 'cet élève' })}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Supprimer l'élève
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex gap-1 ml-1">
                <Button
                  type="button"
                  size="sm"
                  variant={(student as any).gender === 'garcon' ? 'default' : 'outline'}
                  className="text-xs px-2 py-1 h-7"
                  onClick={async () => {
                    await supabase.from('profiles').update({ gender: 'garcon' } as any).eq('user_id', student.user_id);
                    queryClient.invalidateQueries({ queryKey: ['admin-students-details'] });
                    toast.success('Genre mis à jour : Garçon ✓');
                  }}
                >
                  👦
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={(student as any).gender === 'fille' ? 'default' : 'outline'}
                  className="text-xs px-2 py-1 h-7"
                  onClick={async () => {
                    await supabase.from('profiles').update({ gender: 'fille' } as any).eq('user_id', student.user_id);
                    queryClient.invalidateQueries({ queryKey: ['admin-students-details'] });
                    toast.success('Genre mis à jour : Fille ✓');
                  }}
                >
                  👧
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredStudents?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">Aucun élève trouvé</div>
        )}
      </div>

      {/* Progress dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" level="nested">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> {selectedStudent?.full_name || 'Élève'}
            </DialogTitle>
          </DialogHeader>
          {studentProgress && (
            <div className="space-y-6 mt-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{selectedStudent?.email}</p>
              </div>

              {/* Barres de progression */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Progression par module</h4>
                {progressBar(studentProgress.ramadan.completed, studentProgress.ramadan.total, 'Ramadan', <Moon className="h-4 w-4 text-gold" />)}
                {progressBar(studentProgress.nourania.validated, studentProgress.nourania.total, 'Nourania', <Sparkles className="h-4 w-4 text-primary" />)}
                {progressBar(studentProgress.alphabet.validated, studentProgress.alphabet.total, 'Alphabet', <BookOpen className="h-4 w-4 text-gold" />)}
                {progressBar(studentProgress.invocations.memorized, studentProgress.invocations.total, 'Invocations', <MessageSquare className="h-4 w-4 text-primary" />)}
                {progressBar(studentProgress.sourates.validated, studentProgress.sourates.total, 'Sourates', <BookMarked className="h-4 w-4 text-gold" />)}
                {progressBar(studentProgress.prayer.validated, studentProgress.prayer.total, 'Prière', <Hand className="h-4 w-4 text-primary" />)}
              </div>

              {/* Section Rétrograder */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                  <h4 className="font-semibold text-foreground">Rétrograder une leçon</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Annule la validation d'une leçon — l'élève devra re-soumettre pour passer à la suivante.
                </p>

                <Tabs defaultValue="sourates">
                  <TabsList className="w-full grid grid-cols-3 mb-3">
                    <TabsTrigger value="sourates" className="text-xs">
                      Sourates ({validatedDetails?.sourates.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="nourania" className="text-xs">
                      Nourania ({validatedDetails?.nourania.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="invocations" className="text-xs">
                      Invocations ({validatedDetails?.invocations.length ?? 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="sourates">
                    <RetrogradeList
                      items={validatedDetails?.sourates ?? []}
                      table="user_sourate_progress"
                      requestTable="sourate_validation_requests"
                      itemIdField="sourate_id"
                      emptyLabel="Aucune sourate validée"
                    />
                  </TabsContent>

                  <TabsContent value="nourania">
                    <RetrogradeList
                      items={validatedDetails?.nourania ?? []}
                      table="user_nourania_progress"
                      requestTable="nourania_validation_requests"
                      itemIdField="lesson_id"
                      emptyLabel="Aucune leçon Nourania validée"
                    />
                  </TabsContent>

                  <TabsContent value="invocations">
                    <RetrogradeList
                      items={validatedDetails?.invocations ?? []}
                      table="user_invocation_progress"
                      requestTable="invocation_validation_requests"
                      itemIdField="invocation_id"
                      emptyLabel="Aucune invocation validée"
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog de confirmation — rétrograder */}
      <AlertDialog open={!!retrogradeTarget} onOpenChange={(open) => { if (!open) setRetrogradeTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rétrograder cette leçon ?</AlertDialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              « {retrogradeTarget?.label} »
              <br />
              La validation sera annulée. L'élève devra re-soumettre sa demande avant de passer à la leçon suivante.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => retrogradeTarget && retrogradeMutation.mutate(retrogradeTarget)}
              disabled={retrogradeMutation.isPending}
            >
              {retrogradeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Oui, rétrograder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DOB dialog */}
      <Dialog open={!!dobDialogStudent} onOpenChange={() => setDobDialogStudent(null)}>
        <DialogContent className="max-w-xs rounded-2xl" level="nested">
          <DialogHeader>
            <DialogTitle>📅 Date de naissance</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{dobDialogStudent?.full_name || 'Élève'}</p>
          <div className="space-y-3 mt-2">
            <Label>Date (JJ/MM/AAAA)</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                inputMode="numeric"
                placeholder="JJ/MM/AAAA"
                value={dobValue}
                onChange={(e) => handleDobInputChange(e.target.value)}
                className="pl-10"
                maxLength={10}
              />
            </div>
            <Button onClick={handleSaveDob} disabled={savingDob || !dobValue} className="w-full">
              {savingDob && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <ConfirmDeleteDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        onConfirm={() => handleDeleteUser(deleteConfirm.userId)}
        title="Supprimer cet élève ?"
        description={`Supprimer définitivement ${deleteConfirm.name} ? Toutes ses données seront effacées. Il devra se réinscrire pour accéder à l'application.`}
      />

      {/* Password dialog */}
      <Dialog open={!!pwdDialogStudent} onOpenChange={() => { setPwdDialogStudent(null); setNewPassword(''); setShowCurrentPwd(false); setShowNewPwd(false); }}>
        <DialogContent className="max-w-xs rounded-2xl" level="nested">
          <DialogHeader>
            <DialogTitle>🔑 Modifier le mot de passe</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{pwdDialogStudent?.full_name || 'Élève'}</p>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Mot de passe actuel</Label>
              <div className="relative mt-1">
                <Input
                  type={showCurrentPwd ? 'text' : 'password'}
                  value={pwdDialogStudent?.plain_password || '(non défini)'}
                  readOnly
                  className="pr-10 bg-muted/50"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                >
                  {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label>Nouveau mot de passe</Label>
              <div className="relative mt-1">
                <Input
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 caractères"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                >
                  {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={handleSavePassword} disabled={savingPwd || newPassword.length < 6} className="w-full">
              {savingPwd && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudentDetails;
