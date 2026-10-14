import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, LogOut, RefreshCw } from 'lucide-react';

/**
 * L'appli n'a pas pu vérifier que le compte est validé (réseau, navigateur…).
 * Remplace « Inscription en attente », qui s'affichait à tort à des élèves déjà acceptés (2026-10-14).
 */
const ApprovalCheckFailed = () => {
  const { recheckApproval, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  const retry = async () => {
    setChecking(true);
    try { await recheckApproval(); } finally { setChecking(false); }
  };

  // Nouvel essai tout seul toutes les 15 secondes
  useEffect(() => {
    const id = setInterval(() => { recheckApproval(); }, 15_000);
    return () => clearInterval(id);
  }, [recheckApproval]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-primary via-royal-dark to-primary pattern-islamic">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-gold">
        <span className="font-arabic text-4xl text-primary-foreground">﷽</span>
      </div>

      <Card className="w-full max-w-md shadow-elevated border-gold/20">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-sky-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Connexion à vérifier</h1>
          <p className="text-muted-foreground">
            Tu es bien connecté(e), mais l'appli n'arrive pas à lire ton compte pour le moment.
          </p>
          <p className="text-sm text-muted-foreground">
            Si ça continue, ouvre l'appli dans <strong>Google Chrome</strong> à l'adresse <strong>dinislam-app.vercel.app</strong>.
          </p>
          <p className="text-xs text-muted-foreground/70 animate-pulse">Nouvel essai automatique en cours...</p>
          <div className="flex flex-col gap-2 mt-4">
            <Button variant="outline" onClick={retry} disabled={checking}>
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              Réessayer
            </Button>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalCheckFailed;
