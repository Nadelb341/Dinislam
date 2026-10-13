import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { loadDraft, clearDraft } from '@/hooks/useDraftRecovery';
import type { CreationDraft } from '@/hooks/useCreationDraft';
import { moveToTrash } from '@/lib/trash';
import { draftDefFor } from '@/lib/pendingDrafts';

/**
 * Bandeau « 📝 Brouillon repris » en haut du formulaire, avec « Effacer » :
 * le brouillon part dans la corbeille (Paramètres), jamais supprimé directement.
 */
export function DraftRestoredBanner({ draft, onCleared }: { draft: CreationDraft; onCleared: () => void }) {
  const { user } = useAuth();
  const [confirm, setConfirm] = useState(false);
  if (!draft.restored || !draft.key) return null;
  const key = draft.key;
  const def = draftDefFor(key);
  const data = loadDraft<unknown>(key);
  const label = (def?.labelOf(data) || 'brouillon').slice(0, 120);

  const clear = async () => {
    setConfirm(false);
    if (!user) return;
    const ok = await moveToTrash(user.id, 'draft', key, `Brouillon — ${def?.noun ?? 'formulaire'} « ${label} »`, { key, data });
    if (!ok) { toast.error('Mise en corbeille impossible — le brouillon est conservé'); return; }
    clearDraft(key);
    draft.forget();
    onCleared();
    toast.success('Brouillon mis dans la corbeille (Paramètres)');
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
        <span className="flex-1 min-w-[10rem]">📝 Brouillon repris : tu peux continuer là où tu t'étais arrêtée.</span>
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => setConfirm(true)}>
          Effacer
        </Button>
      </div>
      <ConfirmDeleteDialog
        open={confirm}
        onOpenChange={setConfirm}
        onConfirm={clear}
        title="Effacer ce brouillon ?"
        description={`Le brouillon « ${label.slice(0, 80)} » ira dans la corbeille (Paramètres), d'où tu pourras le restaurer.`}
      />
    </>
  );
}

