import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/utils';

/**
 * Carte élève (admin) : l'élève n'a jamais confirmé son e-mail → Supabase refuse toutes ses connexions,
 * même avec le bon mot de passe. Un bouton permet à l'enseignante de le confirmer à sa place.
 */
export function UnconfirmedEmailBadge({ userId, name }: { userId: string; name: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const confirm = async () => {
    try {
      const res = await supabase.functions.invoke('confirm-user-email', { body: { user_id: userId } });
      const body = res.data as { error?: string } | null;
      if (res.error || body?.error) throw new Error(body?.error || res.error?.message);
      toast.success(`E-mail de ${name} confirmé ✓ Il peut se connecter.`);
      queryClient.invalidateQueries({ queryKey: ['admin-students-auth-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-login-trouble'] });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  // Les clics dans la fenêtre de confirmation « remontent » jusqu'à la carte élève (qui ouvrirait sa fiche) : on les arrête ici
  return (
    <span onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center gap-1 mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium bg-destructive text-destructive-foreground text-start"
      >
        📧 E-mail jamais confirmé : ne peut pas se connecter · Confirmer
      </button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'e-mail de {name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {name} n'a jamais cliqué sur le lien de l'e-mail « Confirmation d'inscription ». Tant que ce n'est pas fait, il ne peut pas se connecter, même avec le bon mot de passe. Confirme-le à sa place seulement si tu es sûre que l'adresse est la bonne.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}>Confirmer l'e-mail</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </span>
  );
}
