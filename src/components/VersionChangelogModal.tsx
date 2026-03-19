import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const VersionChangelogModal = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState<{ version_number: string; label: string; description: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const checkVersion = async () => {
      const { data } = await supabase
        .from('app_versions')
        .select('version_number, label, description')
        .eq('is_current', true)
        .maybeSingle();

      if (!data) return;

      const lastSeen = localStorage.getItem('dinislam_last_version');
      if (lastSeen !== data.version_number) {
        setVersion(data);
        setOpen(true);
      }
    };

    checkVersion();
  }, [user]);

  const handleClose = () => {
    if (version) {
      localStorage.setItem('dinislam_last_version', version.version_number);
    }
    setOpen(false);
  };

  if (!version) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else setOpen(true); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎉 Nouvelle version !
            <Badge className="bg-primary">{version.version_number}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">{version.label}</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{version.description}</p>
        </div>
        <Button onClick={handleClose} className="w-full mt-2">
          Compris !
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default VersionChangelogModal;
