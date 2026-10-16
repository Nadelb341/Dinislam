import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingDrafts } from '@/hooks/useDrafts';
import { DRAFT_MAX_AGE_DAYS, trashDraft, type PendingDraft } from '@/lib/pendingDrafts';

const DAY = 24 * 60 * 60 * 1000;

function whenText(t: number | null): string {
  if (!t) return '';
  const d = new Date(t);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const hour = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (t >= today.getTime()) return `aujourd'hui à ${hour}`;
  if (t >= today.getTime() - DAY) return `hier à ${hour}`;
  return `le ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à ${hour}`;
}

/** Jours restants avant le rangement automatique dans la corbeille */
function daysLeft(t: number | null): number | null {
  if (!t) return null;
  return Math.max(0, Math.ceil((t + DRAFT_MAX_AGE_DAYS * DAY - Date.now()) / DAY));
}

/** « 📝 Mes brouillons » dans le bouclier (idée B, 2026-10-16) : tous les brouillons de cet appareil au même endroit. */
export default function AdminMyDrafts({ onContinue }: { onContinue: (d: PendingDraft) => void }) {
  const { user, isAdmin } = useAuth();
  const drafts = usePendingDrafts(user?.id, isAdmin);
  const [toDelete, setToDelete] = useState<PendingDraft | null>(null);

  const confirmDelete = async () => {
    const d = toDelete;
    setToDelete(null);
    if (!d || !user) return;
    if (await trashDraft(user.id, d)) toast.success('Brouillon mis dans la corbeille (Paramètres)');
    else toast.error('Mise en corbeille impossible — le brouillon est conservé');
  };

  if (drafts.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <p className="text-3xl">✨</p>
        <p className="text-sm text-muted-foreground">Aucun brouillon en cours : tout ce que tu as commencé est enregistré.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Ce que tu as commencé sans l'enregistrer, sur cet appareil. Un brouillon pas touché pendant {DRAFT_MAX_AGE_DAYS} jours part tout seul dans la corbeille.
      </p>
      {drafts.map(d => {
        const left = daysLeft(d.savedAt);
        return (
          <div key={d.key} className="rounded-xl border border-amber-300 bg-amber-50/60 p-3 space-y-2 dark:border-amber-700 dark:bg-amber-950/30">
            <p className="text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
              📝 {d.def.noun} : « {d.label.length > 120 ? d.label.slice(0, 120) + '…' : d.label} »
            </p>
            <p className="text-xs text-muted-foreground">📍 {d.def.place}</p>
            {d.savedAt && (
              <p className="text-xs text-muted-foreground">
                🕒 Modifié {whenText(d.savedAt)}
                {left !== null && left <= 7 && <span className="text-amber-700 dark:text-amber-300"> · part dans la corbeille dans {left <= 1 ? 'moins d\'un jour' : `${left} jours`}</span>}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onContinue(d)}>Continuer</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setToDelete(d)}>Effacer</Button>
            </div>
          </div>
        );
      })}

      <ConfirmDeleteDialog
        open={!!toDelete}
        onOpenChange={(o) => { if (!o) setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Effacer ce brouillon ?"
        description={toDelete ? `Le brouillon « ${toDelete.label.slice(0, 80)} » ira dans la corbeille (Paramètres), d'où tu pourras le restaurer.` : ''}
      />
    </div>
  );
}
