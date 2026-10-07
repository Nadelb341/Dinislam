import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/utils';

/** Admin : renommer un élève (fiche + compte, via la fonction rename-user). L'élève peut aussi le faire dans ses Paramètres. */
export function RenameStudentDialog({ student, onClose }: { student: { id: string; full_name: string | null } | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setName(student?.full_name ?? ''); }, [student]);

  const save = async () => {
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!student || !clean || clean === (student.full_name ?? '').trim()) { onClose(); return; }
    setSaving(true);
    try {
      const res = await supabase.functions.invoke('rename-user', { body: { user_id: student.id, full_name: clean } });
      const body = res.data as { error?: string } | null;
      if (res.error || body?.error) throw new Error(body?.error || res.error?.message);
      // Le nom apparaît dans beaucoup d'écrans (listes, classement, messagerie, suivi…) : on rafraîchit tout
      await queryClient.invalidateQueries();
      toast.success(`Élève renommé : ${clean} ✓`);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!student} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xs rounded-2xl" level="nested">
        <DialogHeader>
          <DialogTitle>✏️ Renommer l'élève</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="rename-student">Nom affiché</Label>
          <Input
            id="rename-student"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
            maxLength={60}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">Le nouveau nom apparaîtra partout dans l'appli. L'élève peut aussi le changer lui-même dans ses Paramètres.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={save} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
