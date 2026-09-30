import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';

/**
 * Page ouverte par le bouton de l'e-mail « Mot de passe oublié » (Supabase redirige vers /reset-password
 * avec une session de récupération). Avant le 2026-09-30 cette page n'existait pas : le lien menait à
 * « page introuvable » et l'élève ne pouvait jamais choisir un nouveau mot de passe.
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState<'wait' | 'ok' | 'expired'>('wait');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const confirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // La session de récupération est lue dans l'adresse par le client Supabase ; on attend qu'elle soit prête
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) setReady('ok');
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady('ok'); });
    const t = setTimeout(() => setReady(r => (r === 'wait' ? 'expired' : r)), 6000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  const save = async () => {
    if (password.length < 8) { toast.error('Le mot de passe doit contenir au moins 8 caractères'); return; }
    if (password !== confirm) { toast.error('Les deux mots de passe ne sont pas identiques'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) { toast.error(error.message || 'Impossible de changer le mot de passe'); return; }
    toast.success('Nouveau mot de passe enregistré ✓');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">Nouveau mot de passe</CardTitle>
          <CardDescription>Choisis un nouveau mot de passe pour ton compte Dinislam.</CardDescription>
        </CardHeader>
        <CardContent>
          {ready === 'wait' && (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          )}
          {ready === 'expired' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Ce lien n'est plus valable (il a peut-être déjà servi ou il est trop ancien).
                Redemande un e-mail depuis « Mot de passe oublié ? » sur la page de connexion.
              </p>
              <Button className="w-full" onClick={() => navigate('/auth', { replace: true })}>Retour à la connexion</Button>
            </div>
          )}
          {ready === 'ok' && (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Nouveau mot de passe</Label>
                <PasswordInput
                  id="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 8 caractères"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmRef.current?.focus(); } }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <PasswordInput
                  id="confirm-password"
                  ref={confirmRef}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Retape le même mot de passe"
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving || !password || !confirm}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
