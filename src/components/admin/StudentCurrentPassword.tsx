import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Copy } from 'lucide-react';
import { toast } from 'sonner';

const SOURCE_LABEL: Record<string, string> = {
  connexion: 'à sa dernière connexion',
  oubli: 'avec « mot de passe oublié »',
  parametres: 'dans ses Paramètres',
  admin: 'par toi',
};

/** Admin : mot de passe actuel d'un élève (table student_passwords, lisible par l'admin seulement) */
export function StudentCurrentPassword({ userId }: { userId: string }) {
  const [show, setShow] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['student-password', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('student_passwords').select('password, source, updated_at').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const copy = async () => {
    if (!data) return;
    try { await navigator.clipboard.writeText(data.password); toast.success('Mot de passe copié'); }
    catch { toast.error('Copie impossible : affiche-le avec l\'œil et recopie-le'); }
  };

  if (isLoading) return <div className="h-16 rounded-lg bg-muted/50 animate-pulse" />;
  if (!data) {
    return (
      <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">
        Mot de passe actuel pas encore connu : il s'affichera ici dès que l'élève se connectera. Tu peux aussi en choisir un nouveau ci-dessous et le lui donner.
      </p>
    );
  }
  return (
    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 space-y-1">
      <p className="text-xs font-semibold text-muted-foreground">Mot de passe actuel</p>
      <div className="flex items-center gap-1">
        <span className="flex-1 min-w-0 font-mono text-base [overflow-wrap:anywhere]">{show ? data.password : '••••••••'}</span>
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => setShow(!show)} aria-label={show ? 'Masquer' : 'Afficher'}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={copy} aria-label="Copier">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Enregistré {SOURCE_LABEL[data.source] ?? ''} le {new Date(data.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
}
