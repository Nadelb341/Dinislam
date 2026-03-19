import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, RotateCcw, Loader2, Tag, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const VersionTab = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [newVersion, setNewVersion] = useState({ version_number: '', label: '', description: '' });

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['app-versions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const currentVersion = versions.find((v: any) => v.is_current);

  const createVersion = useMutation({
    mutationFn: async () => {
      if (!newVersion.version_number.trim() || !newVersion.label.trim()) {
        throw new Error('Numéro de version et label requis');
      }

      // Capture snapshot
      const [modulesRes, ramadanRes, pointsRes] = await Promise.all([
        supabase.from('learning_modules').select('id, title, is_active, display_order'),
        supabase.from('ramadan_settings').select('*'),
        supabase.from('point_settings').select('*'),
      ]);

      const snapshot = {
        learning_modules: modulesRes.data || [],
        ramadan_settings: ramadanRes.data || [],
        point_settings: pointsRes.data || [],
      };

      // Unset current
      await supabase.from('app_versions').update({ is_current: false }).eq('is_current', true);

      // Create new version
      const { error } = await supabase.from('app_versions').insert({
        version_number: newVersion.version_number,
        label: newVersion.label,
        description: newVersion.description,
        is_current: true,
        snapshot,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-versions'] });
      setShowCreate(false);
      setNewVersion({ version_number: '', label: '', description: '' });
      toast({ title: '✅ Version créée' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  const restoreVersion = useMutation({
    mutationFn: async (versionId: string) => {
      const target = versions.find((v: any) => v.id === versionId);
      if (!target?.snapshot) throw new Error('Pas de snapshot pour cette version');

      const snapshot = target.snapshot as any;

      // Restore learning_modules
      if (snapshot.learning_modules) {
        for (const mod of snapshot.learning_modules) {
          await supabase.from('learning_modules')
            .update({ is_active: mod.is_active, display_order: mod.display_order })
            .eq('id', mod.id);
        }
      }

      // Restore settings
      if (snapshot.ramadan_settings) {
        for (const s of snapshot.ramadan_settings) {
          await supabase.from('ramadan_settings').upsert(s);
        }
      }
      if (snapshot.point_settings) {
        for (const s of snapshot.point_settings) {
          await supabase.from('point_settings').upsert(s);
        }
      }

      // Set as current
      await supabase.from('app_versions').update({ is_current: false }).eq('is_current', true);
      await supabase.from('app_versions').update({ is_current: true }).eq('id', versionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-versions'] });
      setRestoreId(null);
      toast({ title: '✅ Version restaurée' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Version */}
      {currentVersion && (
        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Version actuelle
              <Badge className="bg-emerald-500">{currentVersion.version_number}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{currentVersion.label}</p>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{currentVersion.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Create new version */}
      <Button onClick={() => setShowCreate(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Créer une nouvelle version
      </Button>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle version</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Numéro de version</Label>
              <Input
                placeholder="Ex: 1.1.0"
                value={newVersion.version_number}
                onChange={(e) => setNewVersion(v => ({ ...v, version_number: e.target.value }))}
              />
            </div>
            <div>
              <Label>Label</Label>
              <Input
                placeholder="Ex: Ajout du module Ramadan"
                value={newVersion.label}
                onChange={(e) => setNewVersion(v => ({ ...v, label: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description des changements</Label>
              <Textarea
                placeholder="Décris les changements de cette version..."
                value={newVersion.description}
                onChange={(e) => setNewVersion(v => ({ ...v, description: e.target.value }))}
                rows={4}
              />
            </div>
            <Button onClick={() => createVersion.mutate()} disabled={createVersion.isPending} className="w-full">
              {createVersion.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Créer la version
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version history */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Historique des versions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {versions.map((v: any) => (
            <div
              key={v.id}
              className={`rounded-lg border p-3 ${v.is_current ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={v.is_current ? 'default' : 'secondary'}>
                    {v.version_number}
                  </Badge>
                  <span className="font-medium text-sm">{v.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(v.created_at), 'dd MMM yyyy', { locale: fr })}
                </span>
              </div>
              {v.description && (
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{v.description}</p>
              )}
              {!v.is_current && v.snapshot && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setRestoreId(v.id)}
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Restaurer
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Restore confirmation */}
      <AlertDialog open={!!restoreId} onOpenChange={(open) => { if (!open) setRestoreId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer cette version ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va rétablir les paramètres (modules, réglages Ramadan, points) tels qu'ils étaient lors de cette version. Les données utilisateurs ne seront pas affectées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreId && restoreVersion.mutate(restoreId)}
              disabled={restoreVersion.isPending}
            >
              {restoreVersion.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VersionTab;
