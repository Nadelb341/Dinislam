import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Users, Globe, UsersRound } from 'lucide-react';

interface Module { id: string; title: string; }
interface Member { user_id: string; full_name: string | null; email: string | null; }
interface Group  { id: string; name: string; color: string | null; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  module: Module | null;
  onSaved: () => void;
}

type VisType = 'all' | 'users' | 'groups';

const ModuleVisibilityDialog = ({ open, onOpenChange, module, onSaved }: Props) => {
  const [visType,    setVisType]    = useState<VisType>('all');
  const [userIds,    setUserIds]    = useState<string[]>([]);
  const [groupIds,   setGroupIds]   = useState<string[]>([]);
  const [members,    setMembers]    = useState<Member[]>([]);
  const [groups,     setGroups]     = useState<Group[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    if (!open || !module) return;
    setLoading(true);
    Promise.all([
      supabase.from('profiles').select('user_id, full_name, email').eq('is_approved', true).order('full_name'),
      supabase.from('student_groups').select('id, name, color').order('name'),
      (supabase as any).from('module_visibility').select('*').eq('module_id', module.id).maybeSingle(),
    ]).then(([{ data: mbrs }, { data: grps }, { data: vis }]) => {
      setMembers((mbrs || []) as Member[]);
      setGroups((grps || []) as Group[]);
      if (vis) {
        setVisType(vis.visibility_type as VisType);
        setUserIds(vis.user_ids || []);
        setGroupIds(vis.group_ids || []);
      } else {
        setVisType('all');
        setUserIds([]);
        setGroupIds([]);
      }
    }).finally(() => setLoading(false));
  }, [open, module]);

  const toggleUser = (uid: string) =>
    setUserIds(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);

  const toggleGroup = (gid: string) =>
    setGroupIds(prev => prev.includes(gid) ? prev.filter(x => x !== gid) : [...prev, gid]);

  const handleSave = async () => {
    if (!module) return;
    if (visType === 'users' && userIds.length === 0) {
      toast.error('Sélectionne au moins une personne');
      return;
    }
    if (visType === 'groups' && groupIds.length === 0) {
      toast.error('Sélectionne au moins un groupe');
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from('module_visibility').upsert({
      module_id: module.id,
      visibility_type: visType,
      user_ids: visType === 'users' ? userIds : [],
      group_ids: visType === 'groups' ? groupIds : [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'module_id' });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Visibilité enregistrée ✅');
    onSaved();
    onOpenChange(false);
  };

  const TAB_CLASS = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border-2 ${
      active ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80'
    }`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            Visibilité — <span className="text-primary">{module?.title}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Chargement…</div>
        ) : (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
              <button className={TAB_CLASS(visType === 'all')} onClick={() => setVisType('all')}>
                <Globe className="h-4 w-4" /> Tout le monde
              </button>
              <button className={TAB_CLASS(visType === 'users')} onClick={() => setVisType('users')}>
                <Users className="h-4 w-4" /> Personnes
              </button>
              <button className={TAB_CLASS(visType === 'groups')} onClick={() => setVisType('groups')}>
                <UsersRound className="h-4 w-4" /> Groupes
              </button>
            </div>

            {/* Personnes */}
            {visType === 'users' && (
              <div className="max-h-64 overflow-y-auto space-y-1 border rounded-xl p-3">
                {members.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Aucun membre</p>}
                {members.map(m => (
                  <label key={m.user_id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted cursor-pointer">
                    <Checkbox
                      checked={userIds.includes(m.user_id)}
                      onCheckedChange={() => toggleUser(m.user_id)}
                    />
                    <span className="text-sm font-medium">{m.full_name || m.email || 'Sans nom'}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Groupes */}
            {visType === 'groups' && (
              <div className="max-h-64 overflow-y-auto space-y-1 border rounded-xl p-3">
                {groups.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Aucun groupe créé</p>}
                {groups.map(g => (
                  <label key={g.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted cursor-pointer">
                    <Checkbox
                      checked={groupIds.includes(g.id)}
                      onCheckedChange={() => toggleGroup(g.id)}
                    />
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: g.color || '#94a3b8' }}
                    />
                    <span className="text-sm font-medium">{g.name}</span>
                  </label>
                ))}
              </div>
            )}

            {visType === 'all' && (
              <p className="text-sm text-muted-foreground bg-muted rounded-xl px-4 py-3">
                Cette carte sera visible par <strong>tous les élèves</strong> (comportement par défaut).
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleVisibilityDialog;
