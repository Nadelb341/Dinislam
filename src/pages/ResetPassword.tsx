import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Mail, KeyRound, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { authErrorFr, rememberPassword } from '@/lib/rememberPassword';

/**
 * Page « Nouveau mot de passe » (lien de l'e-mail « Mot de passe oublié »). Trois façons d'arriver ici :
 *  1. lien avec `?token_hash=…&type=recovery` (modèle d'e-mail Dinislam) → vérifié ici, marche même si l'e-mail
 *     est ouvert sur un autre appareil et même si Outlook/Hotmail « pré-ouvre » les liens ;
 *  2. ancien lien Supabase (session déjà ouverte en arrivant) ;
 *  3. le code à 6 chiffres de l'e-mail, tapé à la main avec l'adresse e-mail (secours si le lien ne marche pas).
 * Ensuite : nouveau mot de passe + confirmation, enregistré et gardé pour l'enseignante.
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const [step, setStep] = useState<'wait' | 'code' | 'password'>('wait');
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const confirmRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let done = false;
    const ok = () => { if (!done) { done = true; setStep('password'); } };
    const tokenHash = params.get('token_hash');
    if (tokenHash) {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error }) => {
        if (error) { toast.error(authErrorFr(error.message)); setStep('code'); } else ok();
      });
      return;
    }
    if (params.get('mode') === 'code') { setStep('code'); return; }
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) ok();
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) ok(); });
    const t = setTimeout(() => setStep((s) => (s === 'wait' ? 'code' : s)), 5000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
    // Lecture de l'adresse une seule fois à l'ouverture de la page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkCode = async () => {
    const token = code.replace(/\D/g, '');
    if (!email.trim() || token.length < 6) { toast.error("Tape ton adresse e-mail et le code reçu par e-mail"); return; }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'recovery' });
    setBusy(false);
    if (error) { toast.error(authErrorFr(error.message)); return; }
    setStep('password');
  };

  const save = async () => {
    if (password.length < 6) { toast.error('Le mot de passe doit contenir au moins 6 caractères'); return; }
    if (password !== confirm) { toast.error('Les deux mots de passe ne sont pas identiques'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(authErrorFr(error.message)); return; }
    rememberPassword(password, 'oubli');
    toast.success('Nouveau mot de passe enregistré ✓ Bienvenue !');
    navigate('/', { replace: true });
  };

  const same = confirm.length > 0 && password === confirm;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">Nouveau mot de passe</CardTitle>
          <CardDescription>
            {step === 'code' ? 'Tape le code à 6 chiffres reçu dans l\'e-mail de Dinislam.' : 'Choisis un nouveau mot de passe pour ton compte Dinislam.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'wait' && (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          )}

          {step === 'code' && (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); checkCode(); }}>
              <div className="space-y-2">
                <Label htmlFor="reset-code-email" className="flex items-center gap-2"><Mail className="h-4 w-4" /> Adresse e-mail</Label>
                <Input
                  id="reset-code-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com" autoComplete="email"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); codeRef.current?.focus(); } }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-code" className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Code reçu par e-mail</Label>
                <Input
                  id="reset-code" ref={codeRef} value={code} onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric" autoComplete="one-time-code" placeholder="123456"
                  className="text-center text-2xl tracking-[0.4em]"
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Valider le code
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Pas d'e-mail ? Regarde dans les courriers indésirables (expéditeur : appdinislam@gmail.com), ou redemande-le.
              </p>
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/auth?forgot=1', { replace: true })}>
                Redemander un e-mail
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Nouveau mot de passe</Label>
                <PasswordInput
                  id="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 6 caractères" autoFocus autoComplete="new-password"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmRef.current?.focus(); } }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <PasswordInput
                  id="confirm-password" ref={confirmRef} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Retape le même mot de passe" autoComplete="new-password"
                />
                {confirm.length > 0 && (
                  <p className={`flex items-center gap-1 text-sm ${same ? 'text-emerald-600' : 'text-destructive'}`}>
                    {same ? <><Check className="h-4 w-4" /> Les deux mots de passe sont identiques</> : <><X className="h-4 w-4" /> Les deux mots de passe ne sont pas identiques</>}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={busy || password.length < 6 || !same}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer mon nouveau mot de passe
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
