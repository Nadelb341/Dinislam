import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { trashThenDelete } from '@/lib/trash';
import { proposerFiche, refuserFiche, relierFiche, useFichesAttente, type FicheAttente } from '@/lib/fichesAttente';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const resume = (f: FicheAttente) => [
  f.role === 'eleve_parent' ? 'élève et parent' : f.role === 'parent' ? 'parent' : 'élève',
  f.telephone ? `📱 ${f.telephone}` : '',
  f.parent_nom ? `parent : ${f.parent_nom}${f.parent2_nom ? ` et ${f.parent2_nom}` : ''}` : f.parent_user_id ? 'parent : un compte de l\'appli' : '',
  f.enfants ? `enfants : ${f.enfants}` : '',
].filter(Boolean).join(' · ');

/**
 * 🔗 Sous une inscription : « C'est peut-être la fiche X ? » → ✅ relier (numéros, groupe, lien parent copiés) / ✖️ non.
 * Rien si aucune fiche ne ressemble. Nadia décide toujours (Nadia, 2026-11-15 : « me demander confirmation pour chacun »).
 */
export function PropositionFiche({ userId, nom }: { userId: string; nom: string | null }) {
  const queryClient = useQueryClient();
  const { data: fiches = [] } = useFichesAttente();
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const fiche = proposerFiche(nom, userId, fiches);
  if (!fiche) return null;
  const agir = async (oui: boolean) => {
    setEnvoi(true);
    try {
      if (oui) await relierFiche(fiche, userId); else await refuserFiche(fiche, userId);
      queryClient.invalidateQueries({ queryKey: ['fiches-attente'] });
      queryClient.invalidateQueries({ queryKey: ['convocations'] });
      toast.success(oui ? `🔗 ${nom || 'Ce compte'} est relié à la fiche « ${fiche.prenom} »` : '✖️ Noté : c\'est un nouvel élève (la fiche reste en attente)');
    } catch (e) { toast.error(/fetch|network/i.test((e as Error).message) ? '📡 Nécessite Internet' : (e as Error).message); }
    finally { setEnvoi(false); }
  };
  return (
    <div className="mt-3 rounded-xl border-2 border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 p-3 space-y-2">
      <p className="text-sm font-bold text-sky-900 dark:text-sky-100">🔗 C'est peut-être la fiche « {fiche.prenom}{fiche.nom ? ` ${fiche.nom}` : ''} » ?</p>
      <p className="text-xs text-sky-900/80 dark:text-sky-100/80 [overflow-wrap:anywhere]">{resume(fiche)}{fiche.notes ? ` — ${fiche.notes}` : ''}</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={envoi} onClick={() => setConfirmer(true)} className="rounded-lg bg-emerald-600 text-white py-1.5 text-sm font-bold disabled:opacity-60">✅ Oui, relier</button>
        <button type="button" disabled={envoi} onClick={() => void agir(false)} className="rounded-lg border bg-card py-1.5 text-sm font-bold disabled:opacity-60">✖️ Non, nouvel élève</button>
      </div>
      <AlertDialog open={confirmer} onOpenChange={setConfirmer}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Relier {nom || 'ce compte'} à la fiche « {fiche.prenom} » ?</AlertDialogTitle>
            <AlertDialogDescription>Ses numéros, son groupe et son lien parent seront ajoutés à son compte (rien de déjà rempli n'est remplacé).</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => void agir(true)}>Relier</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Liste des fiches pas encore reliées (en bas de « Validation d'inscription ») */
export function ListeFichesAttente() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: fiches = [] } = useFichesAttente();
  const [aSupprimer, setASupprimer] = useState<FicheAttente | null>(null);
  const attente = fiches.filter((f) => f.statut === 'attente');
  if (!attente.length) return null;
  const supprimer = async (f: FicheAttente) => {
    if (!user) return;
    try {
      await trashThenDelete({ userId: user.id, type: 'fiche_attente', id: f.id, label: `🗂️ Fiche en attente « ${f.prenom} »`, data: f as never, remove: () => supabase.from('fiches_attente').delete().eq('id', f.id) });
      queryClient.invalidateQueries({ queryKey: ['fiches-attente'] });
      toast.success('Fiche supprimée (dans la corbeille de Paramètres)');
    } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="space-y-2 pt-2">
      <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">🗂️ Fiches en attente d'inscription ({attente.length})</p>
      <p className="text-xs text-muted-foreground">Quand l'une de ces personnes s'inscrit, l'appli te propose de relier son compte à sa fiche.</p>
      {attente.map((f) => (
        <div key={f.id} className="flex items-start gap-2 rounded-xl border bg-card px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">{f.prenom}{f.nom ? ` ${f.nom}` : ''}</p>
            <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{resume(f)}{f.notes ? ` — ${f.notes}` : ''}</p>
          </div>
          <button type="button" aria-label={`Supprimer la fiche ${f.prenom}`} onClick={() => setASupprimer(f)} className="h-8 w-8 shrink-0 rounded-lg text-destructive hover:bg-destructive/10">🗑️</button>
        </div>
      ))}
      <AlertDialog open={!!aSupprimer} onOpenChange={(o) => { if (!o) setASupprimer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Supprimer la fiche « {aSupprimer?.prenom} » ?</AlertDialogTitle><AlertDialogDescription>Elle ira dans la corbeille de Paramètres.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => { if (aSupprimer) void supprimer(aSupprimer); setASupprimer(null); }}>Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
