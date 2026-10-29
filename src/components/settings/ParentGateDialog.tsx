import { useEffect, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PasswordInput } from '@/components/ui/password-input';
import { CodeInput } from '@/components/parents/CodeInput';

/**
 * Fenêtre « Espace parents » qui protège les Paramètres (élèves de moins de 12 ans).
 * Réunie avec le nouvel Espace parents (2026-10-28) : si les parents ont créé leur code (6 chiffres), c'est lui qui est demandé ;
 * sinon, comme avant, le mot de passe de connexion de l'enfant (puis on propose de créer le code dans l'Espace parents).
 */
const ParentGateDialog = ({ open, onOpenChange, onUnlock, onUnlockCode, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlock: (password: string) => Promise<boolean>;
  onUnlockCode: (code: string) => Promise<boolean>;
  onSuccess: () => void;
}) => {
  const { user } = useAuth();
  const [valeur, setValeur] = useState('');
  const [checking, setChecking] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [avecCode, setAvecCode] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    supabase.rpc('parent_space_info', { p_child: user.id }).then(({ data }) => setAvecCode(((data as { labels?: string[] } | null)?.labels ?? []).length > 0));
  }, [open, user]);

  const submit = async () => {
    if (!valeur) return;
    setChecking(true);
    const ok = avecCode ? await onUnlockCode(valeur) : await onUnlock(valeur);
    setChecking(false);
    if (ok) { setValeur(''); setWrong(false); onOpenChange(false); onSuccess(); }
    else setWrong(true);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setValeur(''); setWrong(false); } onOpenChange(o); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Espace parents</DialogTitle>
          <DialogDescription>
            {avecCode
              ? 'Les paramètres sont réservés aux parents. Entrez votre code parents (6 chiffres).'
              : "Les paramètres sont réservés aux parents. Entrez le mot de passe de l'enfant (le même que pour se connecter à l'appli). Vous pourrez ensuite créer votre code parents dans l'Espace parents."}
          </DialogDescription>
        </DialogHeader>
        {avecCode === null ? <p className="py-3 text-center"><Loader2 className="inline h-4 w-4 animate-spin" /></p> : (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            {avecCode ? (
              <CodeInput value={valeur} onChange={(v) => { setValeur(v); setWrong(false); }} placeholder="Code parents" aria-label="Code parents" autoFocus />
            ) : (
              <PasswordInput value={valeur} onChange={(e) => { setValeur(e.target.value); setWrong(false); }} placeholder="Mot de passe" autoFocus aria-label="Mot de passe de connexion" />
            )}
            {wrong && <p className="text-sm text-destructive">{avecCode ? 'Code incorrect' : 'Mot de passe incorrect'}</p>}
            <Button type="submit" className="w-full" disabled={checking || !valeur}>
              {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ouvrir les paramètres
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ParentGateDialog;
