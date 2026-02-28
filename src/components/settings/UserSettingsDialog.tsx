import { useState, useEffect } from 'react';
import { Settings, Loader2, LogOut, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const UserSettingsDialog = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // DOB state
  const [dobDisplay, setDobDisplay] = useState(''); // JJ/MM/AAAA
  const [dobSetByUser, setDobSetByUser] = useState(false);
  const [loadingDob, setLoadingDob] = useState(false);

  const handleOpen = async () => {
    const currentName = user?.user_metadata?.full_name || '';
    setNewName(currentName);
    setNewPassword('');
    setConfirmPassword('');
    setOpen(true);

    // Load DOB from profile
    if (user) {
      setLoadingDob(true);
      const { data } = await supabase
        .from('profiles')
        .select('date_of_birth, dob_set_by_user')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setDobSetByUser(data.dob_set_by_user || false);
        if (data.date_of_birth) {
          // Convert YYYY-MM-DD to JJ/MM/AAAA
          const [y, m, d] = data.date_of_birth.split('-');
          setDobDisplay(`${d}/${m}/${y}`);
        } else {
          setDobDisplay('');
        }
      }
      setLoadingDob(false);
    }
  };

  const handleDobChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '';
    if (digits.length <= 2) formatted = digits;
    else if (digits.length <= 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
    else formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
    setDobDisplay(formatted);
  };

  const parseDobToISO = (dob: string): string | null => {
    const match = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, day, month, year] = match;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(d.getTime()) || d.getDate() !== parseInt(day) || d.getMonth() !== parseInt(month) - 1) return null;
    return `${year}-${month}-${day}`;
  };

  const calculateAge = (dob: string): number | null => {
    const iso = parseDobToISO(dob);
    if (!iso) return null;
    const birth = new Date(iso);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleSaveName = async () => {
    if (!newName.trim() || !user) return;
    setSavingName(true);
    try {
      // Also save DOB if it's set and not yet locked
      const updateData: any = { full_name: newName.trim() };
      
      if (dobDisplay && !dobSetByUser) {
        const iso = parseDobToISO(dobDisplay);
        if (iso) {
          updateData.date_of_birth = iso;
          updateData.dob_set_by_user = true;
          setDobSetByUser(true);
        }
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: newName.trim() },
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);
      if (profileError) throw profileError;

      toast.success('Profil mis à jour ✓');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSavingName(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Mot de passe mis à jour ✓');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    navigate('/auth');
  };

  const computedAge = dobDisplay ? calculateAge(dobDisplay) : null;
  const isDobLocked = dobSetByUser;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        className="text-primary-foreground hover:bg-primary-foreground/10"
      >
        <Settings className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Paramètres du profil</DialogTitle>
            <DialogDescription>Modifier votre nom ou votre mot de passe</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Change name + DOB */}
            <div className="space-y-2">
              <Label htmlFor="settings-name" className="font-semibold">Changer le nom</Label>
              <Input
                id="settings-name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Votre nom"
              />

              {/* Date of birth */}
              <Label htmlFor="settings-dob" className="font-semibold">Date de naissance</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="settings-dob"
                  type="text"
                  inputMode="numeric"
                  placeholder="JJ/MM/AAAA"
                  value={dobDisplay}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className="pl-10"
                  maxLength={10}
                  disabled={isDobLocked}
                />
              </div>
              {isDobLocked && (
                <p className="text-xs text-muted-foreground italic">(modifiable par le professeur)</p>
              )}
              {computedAge !== null && computedAge >= 0 && (
                <p className="text-xs text-muted-foreground">
                  Âge : <span className="font-semibold">{computedAge} ans</span>
                </p>
              )}

              <Button
                onClick={handleSaveName}
                disabled={savingName || !newName.trim()}
                className="w-full"
                size="sm"
              >
                {savingName ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enregistrer le nom
              </Button>
            </div>

            {/* Change password */}
            <div className="space-y-2">
              <Label htmlFor="settings-pw" className="font-semibold">Changer le mot de passe</Label>
              <Input
                id="settings-pw"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe (min. 8 car.)"
              />
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
              />
              <Button
                onClick={handleSavePassword}
                disabled={savingPassword || !newPassword || !confirmPassword}
                className="w-full"
                size="sm"
              >
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enregistrer le mot de passe
              </Button>
            </div>

            {/* Logout section */}
            <Separator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                  <LogOut className="h-4 w-4 mr-2" />
                  Se déconnecter
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Se déconnecter ?</AlertDialogTitle>
                  <AlertDialogDescription>Êtes-vous sûr de vouloir quitter l'application ?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">Quitter</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserSettingsDialog;
