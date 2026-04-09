import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Search, User, MoreVertical, Eye, EyeOff, KeyRound, BarChart2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import AdminStudentGroups from './AdminStudentGroups';
import { toast } from 'sonner';

interface StudentProgress {
  sourates: { validated: number; total: number };
  ramadan: { completed: number; total: number };
  nourania: { validated: number; total: number };
  prayer: { validated: number; total: number };
  alphabet: { validated: number; total: number };
  invocations: { memorized: number; total: number };
}

const AdminStudents = () => {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; email: string; full_name: string | null } | null>(null);
  const [passwordStudent, setPasswordStudent] = useState<{ id: string; full_name: string | null; plain_password: string | null } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const [{ data: profiles, error: profilesError }, { data: studentRoles, error: rolesError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, email, full_name, created_at, plain_password')
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
    queryKey: ['student-progress', selectedStudent?.id],
    enabled: !!selectedStudent,
    queryFn: async () => {
      if (!selectedStudent) return null;

      const [
        { data: sourateProgress },
        { data: ramadanProgress },
        { data: nouraniaProgress },
        { data: prayerProgress },
        { data: alphabetProgress },
        { data: invocationProgress },
        { count: totalSourates },
        { count: totalRamadanDays },
        { count: totalNouraniaLessons },
        { count: totalPrayerCategories },
        { count: totalAlphabetLetters },
        { count: totalInvocations },
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
        ramadan: { completed: ramadanProgress?.filter(p => p.video_watched && p.quiz_completed && p.pdf_read).length || 0, total: totalRamadanDays || 0 },
        nourania: { validated: nouraniaProgress?.filter(p => p.is_validated).length || 0, total: totalNouraniaLessons || 0 },
        prayer: { validated: prayerProgress?.filter(p => p.is_validated).length || 0, total: totalPrayerCategories || 0 },
        alphabet: { validated: alphabetProgress?.filter(p => p.is_validated).length || 0, total: totalAlphabetLetters || 0 },
        invocations: { memorized: invocationProgress?.filter(p => p.is_memorized).length || 0, total: totalInvocations || 0 },
      } as StudentProgress;
    },
  });

  const filteredStudents = students?.filter((s) =>
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSavePassword = async () => {
    if (!passwordStudent || !newPassword) return;
    if (newPassword.length < 6) { toast.error('Le mot de passe doit contenir au moins 6 caractères'); return; }
    setSavingPassword(true);
    try {
      const response = await supabase.functions.invoke('update-user-password', {
        body: { user_id: passwordStudent.id, new_password: newPassword },
      });
      if (response.error) throw new Error(response.error.message);
      toast.success(`Mot de passe de ${passwordStudent.full_name || "l'élève"} modifié ✅`);
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      setPasswordStudent(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la modification');
    } finally {
      setSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse"><CardContent className="h-20 bg-muted/50" /></Card>
        ))}
      </div>
    );
  }

  const progressBar = (value: number, total: number) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <div className="flex items-center gap-2">
        <Progress value={percentage} className="flex-1 h-2" />
        <span className="text-xs text-muted-foreground w-12">{value}/{total}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <AdminStudentGroups />

      <div className="border-t pt-4">
        <h3 className="text-base font-semibold text-foreground mb-3">📋 Liste des élèves</h3>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un élève..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="space-y-2">
        {filteredStudents?.map((student) => (
          <Card key={student.user_id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{student.full_name || 'Élève sans nom'}</p>
                  <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedStudent({ id: student.user_id, email: student.email || '', full_name: student.full_name })}>
                    <BarChart2 className="h-4 w-4 mr-2" />
                    Voir la progression
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setPasswordStudent({ id: student.user_id, full_name: student.full_name, plain_password: (student as any).plain_password || null }); setNewPassword(''); setShowCurrent(false); setShowNew(false); }}>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Modifier le mot de passe
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ))}
        {filteredStudents?.length === 0 && <div className="text-center py-8 text-muted-foreground">Aucun élève trouvé</div>}
      </div>

      {/* Dialog progression */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto" level="nested">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><User className="h-5 w-5" />{selectedStudent?.full_name || 'Élève sans nom'}</DialogTitle>
          </DialogHeader>
          {studentProgress && (
            <div className="space-y-4 mt-4">
              <div><p className="text-sm text-muted-foreground mb-1">Email</p><p className="font-medium">{selectedStudent?.email}</p></div>
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Progression par module</h4>
                <div className="space-y-4">
                  {[
                    { label: 'Sourates', v: studentProgress.sourates.validated, t: studentProgress.sourates.total },
                    { label: 'Ramadan', v: studentProgress.ramadan.completed, t: studentProgress.ramadan.total },
                    { label: 'Nourania', v: studentProgress.nourania.validated, t: studentProgress.nourania.total },
                    { label: 'Prière', v: studentProgress.prayer.validated, t: studentProgress.prayer.total },
                    { label: 'Alphabet', v: studentProgress.alphabet.validated, t: studentProgress.alphabet.total },
                    { label: 'Invocations', v: studentProgress.invocations.memorized, t: studentProgress.invocations.total },
                  ].map(({ label, v, t }) => (
                    <div key={label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{label}</span>
                        <Badge variant="outline">{Math.round((v / Math.max(t, 1)) * 100)}%</Badge>
                      </div>
                      {progressBar(v, t)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog mot de passe */}
      <Dialog open={!!passwordStudent} onOpenChange={() => setPasswordStudent(null)}>
        <DialogContent className="max-w-sm" level="nested">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Mot de passe — {passwordStudent?.full_name || 'Élève'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Mot de passe actuel</p>
              <div className="relative">
                <Input type={showCurrent ? 'text' : 'password'} value={passwordStudent?.plain_password || ''} readOnly className="pr-10 bg-muted/50" placeholder={passwordStudent?.plain_password ? '' : 'Non enregistré'} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowCurrent(v => !v)}>
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Nouveau mot de passe</p>
              <div className="relative">
                <Input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-10" placeholder="Minimum 6 caractères" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowNew(v => !v)}>
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button className="w-full" onClick={handleSavePassword} disabled={!newPassword || savingPassword}>
              {savingPassword ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudents;
