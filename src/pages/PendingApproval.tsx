import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

const PendingApproval = () => {
  const { user, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  const checkApproval = async () => {
    if (!user) return;
    setChecking(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.is_approved) {
        // Force full reload to re-init auth state
        window.location.reload();
      }
    } catch (err) {
      console.error('Check approval error:', err);
    }
    setChecking(false);
  };

  // Poll every 5 seconds + realtime subscription
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(checkApproval, 5000);

    const channel = supabase
      .channel(`pending-approval-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new?.is_approved) {
          window.location.reload();
        }
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-primary via-royal-dark to-primary pattern-islamic">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-gold">
        <span className="font-arabic text-4xl text-primary-foreground">﷽</span>
      </div>

      <Card className="w-full max-w-md shadow-elevated border-gold/20">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Inscription en attente
          </h1>
          <p className="text-muted-foreground">
            Votre inscription a bien été enregistrée. L'enseignant doit valider votre demande avant que vous puissiez accéder à l'application.
          </p>
          <p className="text-sm text-muted-foreground">
            بارك الله فيك — Qu'Allah vous bénisse pour votre patience.
          </p>
          <p className="text-xs text-muted-foreground/70 animate-pulse">
            Vérification automatique en cours...
          </p>
          <div className="flex flex-col gap-2 mt-4">
            <Button
              variant="outline"
              onClick={checkApproval}
              disabled={checking}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              Vérifier maintenant
            </Button>
            <Button
              variant="ghost"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
