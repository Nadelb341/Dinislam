import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { entrerFantome } from '@/lib/modeFantome';
import { toast } from 'sonner';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { ScrollButtons } from '@/components/ui/ScrollButtons';

type Compte = { user_id: string; full_name: string | null };

/** 👻 Choisir le compte dans lequel entrer (tous les comptes validés sauf les admins), rangés par groupe */
export function ChoixFantomeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [cherche, setCherche] = useState('');
  const [choisi, setChoisi] = useState<Compte | null>(null);
  const [busy, setBusy] = useState(false);
  const sc = useScrollToTop();

  const { data, isLoading } = useQuery({
    queryKey: ['mode-fantome', 'comptes'],
    enabled: open,
    queryFn: async () => {
      const [{ data: profils, error }, { data: admins }, { data: groupes }, { data: membres }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').eq('is_approved', true).order('full_name'),
        supabase.from('user_roles').select('user_id').eq('role', 'admin'),
        supabase.from('student_groups').select('id, name, position').order('position'),
        supabase.from('student_group_members').select('group_id, user_id'),
      ]);
      if (error) throw error;
      const exclus = new Set((admins || []).map((a) => a.user_id));
      return { comptes: (profils || []).filter((p) => !exclus.has(p.user_id)) as Compte[], groupes: groupes || [], membres: membres || [] };
    },
  });

  const sections = useMemo(() => {
    if (!data) return [];
    const q = cherche.trim().toLowerCase();
    const garde = (c: Compte) => !q || (c.full_name || '').toLowerCase().includes(q);
    const dansUnGroupe = new Set<string>();
    const res = data.groupes.map((g) => {
      const ids = new Set(data.membres.filter((m) => m.group_id === g.id).map((m) => m.user_id));
      ids.forEach((id) => dansUnGroupe.add(id));
      return { titre: g.name, comptes: data.comptes.filter((c) => ids.has(c.user_id) && garde(c)) };
    });
    res.push({ titre: 'Sans groupe (parents, adultes…)', comptes: data.comptes.filter((c) => !dansUnGroupe.has(c.user_id) && garde(c)) });
    return res.filter((s) => s.comptes.length);
  }, [data, cherche]);

  const entrer = async () => {
    if (!choisi) return;
    setBusy(true);
    const err = await entrerFantome(choisi.user_id, choisi.full_name || 'cet élève');
    if (err) { toast.error(err); setBusy(false); setChoisi(null); }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent level="nested" className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-center">👻 Mode fantôme</DialogTitle>
            <DialogDescription className="text-center">Choisis le compte dans lequel entrer : tu feras tout comme si c'était lui ou elle.</DialogDescription>
          </DialogHeader>
          <Input autoFocus placeholder="🔎 Chercher un prénom…" value={cherche} onChange={(e) => setCherche(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { const premier = sections[0]?.comptes[0]; if (premier) setChoisi(premier); } }} />
          <div ref={sc.scrollRef} onScroll={sc.handleScroll} className="flex-1 overflow-y-auto space-y-3 pr-1">
            {isLoading && <p className="text-sm text-center text-muted-foreground py-4">⏳ Chargement…</p>}
            {!isLoading && !sections.length && <p className="text-sm text-center text-muted-foreground py-4">Aucun compte trouvé</p>}
            {sections.map((s) => (
              <section key={s.titre} className="space-y-1.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-violet-700 dark:text-violet-300">{s.titre}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {s.comptes.map((c) => (
                    <button key={`${s.titre}-${c.user_id}`} type="button" onClick={() => setChoisi(c)}
                      className="rounded-xl border-2 border-violet-200 bg-violet-50 px-2 py-2 text-sm font-semibold text-violet-950 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-50 [overflow-wrap:anywhere]">
                      {c.full_name || 'Sans nom'}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <ScrollButtons showTop={sc.showTop} showBottom={sc.showBottom} onScrollTop={sc.scrollToTop} onScrollBottom={sc.scrollToBottom} position="absolute" />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!choisi} onOpenChange={(o) => !o && !busy && setChoisi(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>👻 Entrer dans le compte de {choisi?.full_name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tout ce que tu feras (cocher, envoyer un audio, valider un devoir…) comptera pour {choisi?.full_name}, comme si c'était lui ou elle.
              Un bandeau violet en haut te permet de revenir à ton compte à tout moment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void entrer(); }}>
              {busy ? '⏳ Ouverture…' : '👻 Entrer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
