import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { loadDraft, clearDraft } from '@/hooks/useDraftRecovery';
import { moveToTrash } from '@/lib/trash';
import { scanPendingDrafts, requestDraftResume, type PendingDraft } from '@/lib/pendingDrafts';

// Chaque brouillon n'est proposé qu'une fois par ouverture de l'appli (pas à chaque changement de page).
// Le rôle admin arrive un peu après la connexion : un 2ᵉ passage ajoute alors les brouillons réservés à l'admin.
const alreadyProposed = new Set<string>();

/** Message « ⏳ Actions inachevées » affiché dès l'ouverture de l'appli (règle globale du 2026-09-26). */
const PendingDraftsCenter = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<PendingDraft[]>([]);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<PendingDraft | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    const found = scanPendingDrafts(user.id, isAdmin).filter(d => !alreadyProposed.has(d.key));
    if (found.length === 0) return;
    found.forEach(d => alreadyProposed.add(d.key));
    setItems(prev => [...prev, ...found]);
    setOpen(true);
  }, [user, isAdmin, loading]);

  const remove = (d: PendingDraft) => {
    const next = items.filter(x => x.key !== d.key);
    setItems(next);
    if (next.length === 0) setOpen(false);
  };

  const cont = (d: PendingDraft) => {
    remove(d);
    setOpen(false);
    requestDraftResume(d.key);
    navigate(d.def.route);
  };

  const confirmDelete = async () => {
    const d = toDelete;
    setToDelete(null);
    if (!d || !user) return;
    // Rien ne disparaît sans passer par la corbeille
    const ok = await moveToTrash(user.id, 'draft', d.key, `Brouillon — ${d.def.noun} « ${d.label} »`, { key: d.key, data: loadDraft(d.key) });
    if (!ok) { toast.error('Mise en corbeille impossible — le brouillon est conservé'); return; }
    clearDraft(d.key);
    remove(d);
    toast.success('Brouillon mis dans la corbeille (Paramètres)');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>⏳ Action pas terminée</DialogTitle>
            <DialogDescription>
              {items.length > 1 ? 'Tu avais commencé ces actions sans les terminer :' : 'Tu avais commencé cette action sans la terminer :'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {items.map(d => (
              <div key={d.key} className="rounded-xl border border-border p-3 space-y-2">
                <p className="text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
                  📝 {d.def.noun} : « {d.label.length > 120 ? d.label.slice(0, 120) + '…' : d.label} »
                </p>
                <p className="text-xs text-muted-foreground">📍 {d.def.place}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => cont(d)}>Continuer</Button>
                  <Button size="sm" variant="outline" onClick={() => remove(d)}>Plus tard</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setToDelete(d)}>Supprimer</Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!toDelete}
        onOpenChange={(o) => { if (!o) setToDelete(null); }}
        onConfirm={confirmDelete}
        title="Supprimer ce brouillon ?"
        description={toDelete ? `Le brouillon « ${toDelete.label.slice(0, 80)} » ira dans la corbeille (Paramètres), d'où tu pourras le restaurer.` : ''}
      />
    </>
  );
};

export default PendingDraftsCenter;
