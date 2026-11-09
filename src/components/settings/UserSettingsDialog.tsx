import { useState, useEffect, useRef } from 'react';
import { authErrorFr, rememberPassword } from '@/lib/rememberPassword';
import { Settings, Loader2, LogOut, CalendarIcon, Bell, Trash2, Lock } from 'lucide-react';
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
import { PasswordInput } from '@/components/ui/password-input';
import { useParentLock } from '@/hooks/useParentLock';
import ParentGateDialog from '@/components/settings/ParentGateDialog';
import { errorMessage } from '@/lib/utils';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { EspaceParentsCarte } from '@/components/parents/EspaceParents';
import { SilentBoundary } from '@/components/shared/SilentBoundary';
import { useBilansNonLus } from '@/hooks/useBilansNonLus';
import { EVENT_ESPACE_PARENTS } from '@/lib/espaceParents';
import { PASSWORD_HINT, PASSWORD_MAX, passwordError } from '@/lib/passwordRules';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { ScrollButtons } from '@/components/ui/ScrollButtons';

const UserSettingsDialog = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const confirmPwRef = useRef<HTMLInputElement>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // DOB state
  const [dobDisplay, setDobDisplay] = useState(''); // JJ/MM/AAAA
  const [dobSetByUser, setDobSetByUser] = useState(false);
  const [loadingDob, setLoadingDob] = useState(false);

  const { locked, ready: lockReady, unlock, unlockWithCode } = useParentLock();
  const [gateOpen, setGateOpen] = useState(false);

  // Moins de 12 ans : mot de passe demandé avant d'ouvrir les paramètres
  const requestOpen = () => { if (locked) setGateOpen(true); else handleOpen(); };

  // 📊 Bilans pas encore ouverts par un parent → pastille rouge sur la roue dentée (2026-11-02)
  const { total: bilansNonLus } = useBilansNonLus();
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  // 👨‍👩‍👧 Ouvrir directement sur l'Espace parents : message jaune de l'accueil, ou lien d'une notification (/?espace=parents)
  const [allerEspaceParents, setAllerEspaceParents] = useState(false);
  const [ouvertureDemandee, setOuvertureDemandee] = useState(false);
  const requestOpenRef = useRef(requestOpen);
  useEffect(() => { requestOpenRef.current = requestOpen; });
  // On attend de savoir si le code parents est exigé (moins de 12 ans) avant d'ouvrir
  useEffect(() => {
    if (!ouvertureDemandee || !lockReady) return;
    setOuvertureDemandee(false);
    requestOpenRef.current();
  }, [ouvertureDemandee, lockReady, locked]);
  useEffect(() => {
    const ouvrir = () => { setAllerEspaceParents(true); setOuvertureDemandee(true); };
    window.addEventListener(EVENT_ESPACE_PARENTS, ouvrir);
    const params = new URLSearchParams(window.location.search);
    // Sur /settings, c'est la page qui renvoie d'abord vers l'accueil (une seule demande de code à la fois)
    if (params.get('espace') === 'parents' && window.location.pathname !== '/settings') {
      params.delete('espace');
      const reste = params.toString();
      navigate(`${window.location.pathname}${reste ? `?${reste}` : ''}`, { replace: true });
      ouvrir();
    }
    return () => window.removeEventListener(EVENT_ESPACE_PARENTS, ouvrir);
  }, [navigate]);
  useEffect(() => {
    if (!open || !allerEspaceParents) return;
    // La carte se charge après l'ouverture de la fenêtre : on attend qu'elle apparaisse
    let essais = 0;
    const iv = setInterval(() => {
      const carte = document.getElementById('espace-parents');
      if (carte || ++essais > 20) {
        clearInterval(iv);
        carte?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        setAllerEspaceParents(false);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [open, allerEspaceParents]);

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
      const updateData: TablesUpdate<'profiles'> = { full_name: newName.trim() };
      
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
    } catch (err) {
      toast.error(errorMessage(err) || 'Erreur lors de la mise à jour');
    } finally {
      setSavingName(false);
    }
  };

  const handleSavePassword = async () => {
    const erreur = passwordError(newPassword);
    if (erreur) {
      toast.error(erreur);
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
      rememberPassword(newPassword, 'parametres');
      toast.success('Mot de passe mis à jour ✓');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(authErrorFr(errorMessage(err)) || 'Erreur lors de la mise à jour du mot de passe');
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
        onClick={requestOpen}
        className={`relative text-primary-foreground hover:bg-primary-foreground/10 ${locked ? 'opacity-60' : ''}`}
        aria-label={locked ? 'Paramètres (réservé aux parents)' : 'Paramètres'}
      >
        <Settings className="h-5 w-5" />
        {locked && <Lock className="absolute bottom-0.5 right-0.5 h-3 w-3" />}
        {bilansNonLus > 0 && !isAdmin && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1" aria-label={`${bilansNonLus} nouveau bilan`}>
            {bilansNonLus > 99 ? '99+' : bilansNonLus}
          </span>
        )}
      </Button>
      <ParentGateDialog open={gateOpen} onOpenChange={setGateOpen} onUnlock={unlock} onUnlockCode={unlockWithCode} onSuccess={handleOpen} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
          <div ref={scrollRef} onScroll={handleScroll} className="max-h-[85vh] overflow-y-auto p-6 space-y-4">
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
              <PasswordInput
                id="settings-pw"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                maxLength={PASSWORD_MAX}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmPwRef.current?.focus(); } }}
              />
              <PasswordInput
                value={confirmPassword}
                ref={confirmPwRef}
                maxLength={PASSWORD_MAX}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
                onKeyDown={e => { if (e.key === 'Enter' && newPassword && confirmPassword && !savingPassword) { e.preventDefault(); handleSavePassword(); } }}
              />
              <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
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

            {/* 👨‍👩‍👧 Espace parents, déplacé ici depuis la page Paramètres (demande de Nadia, 2026-11-02), contenu inchangé */}
            <SilentBoundary name="Espace parents"><EspaceParentsCarte /></SilentBoundary>

            {/* Accès à la page Paramètres (notifications, corbeille) — avant le 2026-09-30, aucun bouton n'y menait */}
            <Separator />
            <div className="grid gap-2 grid-cols-2">
              {/* L'enseignante aussi (2026-11-09) : ses rappels de prière ; ses alertes d'enseignante restent dans le bouclier */}
              <Button variant="outline" className="h-auto min-h-11 py-2 whitespace-normal" onClick={() => { setOpen(false); navigate('/settings#notifications'); }}>
                <Bell className="h-4 w-4 mr-2 shrink-0" />
                {isAdmin ? '🕌 Rappels de prière' : 'Notifications'}
              </Button>
              <Button variant="outline" className="h-auto min-h-11 py-2 whitespace-normal" onClick={() => { setOpen(false); navigate('/settings#corbeille'); }}>
                <Trash2 className="h-4 w-4 mr-2 shrink-0" />
                Corbeille
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
          </div>
          <ScrollButtons showTop={showTop} showBottom={showBottom} onScrollTop={scrollToTop} onScrollBottom={scrollToBottom} position="absolute" />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserSettingsDialog;
