import { useCallback, useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * Confirmation avant de VALIDER (cocher « mémorisé », « fait », « jeûné »…) — règle globale, choix de Nadia
 * du 2026-09-30 pour les trackers fréquents aussi. Dévalider (décocher) ne demande jamais de confirmation.
 *   const { askValidation, validationDialog } = useConfirmValidation();
 *   askValidation('Valider ce verset ?', 'Verset 3 marqué comme mémorisé.', () => doIt());
 *   ... {validationDialog}
 */
export function useConfirmValidation() {
  const [pending, setPending] = useState<{ title: string; description: string; run: () => void } | null>(null);

  const askValidation = useCallback((title: string, description: string, run: () => void) => {
    setPending({ title, description, run });
  }, []);

  const validationDialog = (
    <AlertDialog open={!!pending} onOpenChange={(open) => { if (!open) setPending(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
          <AlertDialogDescription className="[overflow-wrap:anywhere]">{pending?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={() => { const run = pending?.run; setPending(null); run?.(); }}>
            ✅ Valider
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { askValidation, validationDialog };
}
