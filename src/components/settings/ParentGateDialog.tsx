import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PasswordInput } from '@/components/ui/password-input';

/** Fenêtre « Espace parents » : demande le mot de passe de connexion de l'enfant (élèves de moins de 12 ans) */
const ParentGateDialog = ({ open, onOpenChange, onUnlock, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlock: (password: string) => Promise<boolean>;
  onSuccess: () => void;
}) => {
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);
  const [wrong, setWrong] = useState(false);

  const submit = async () => {
    if (!password) return;
    setChecking(true);
    const ok = await onUnlock(password);
    setChecking(false);
    if (ok) { setPassword(''); setWrong(false); onOpenChange(false); onSuccess(); }
    else setWrong(true);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setPassword(''); setWrong(false); } onOpenChange(o); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Espace parents</DialogTitle>
          <DialogDescription>
            Les paramètres sont réservés aux parents. Entre le mot de passe de l'enfant (le même que pour se connecter à l'appli).
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <PasswordInput
            value={password}
            onChange={(e) => { setPassword(e.target.value); setWrong(false); }}
            placeholder="Mot de passe"
            autoFocus
            aria-label="Mot de passe de connexion"
          />
          {wrong && <p className="text-sm text-destructive">Mot de passe incorrect</p>}
          <Button type="submit" className="w-full" disabled={checking || !password}>
            {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ouvrir les paramètres
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ParentGateDialog;
