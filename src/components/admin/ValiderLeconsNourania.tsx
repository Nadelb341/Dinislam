import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * ✅ Valider des leçons Nourania pour un élève (Nadia, 2026-11-17 : « exactement la même carte que pour les sourates, dans la
 * carte Nourania, et n'oublie pas de le comptabiliser dans le classement »).
 * Valider = VRAIE validation dans l'avancement de l'élève (`user_nourania_progress.is_validated`) : verte chez lui, la suivante
 * s'ouvre, ses lignes sont validées (déclencheur `nourania_lecon_valide_lignes`) et ses points recalculés tout seuls
 * (déclencheur `recalculate_points`, 10 pts par leçon selon le barème). Une demande de validation en attente pour cette leçon
 * passe en « acceptée ». Annuler (confirmation) remet la leçon « non validée » et retire ses points.
 * Différent du déblocage « 🔓 » d'une leçon (nourania_admin_unlocks) qui OUVRE seulement la leçon.
 */
type Lecon = { id: string; lesson_number: number; title_french?: string | null };
type Eleve = { user_id: string; full_name: string | null; email: string | null };

export default function ValiderLeconsNourania({ lessons, profiles }: { lessons: Lecon[]; profiles: Eleve[] }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [eleve, setEleve] = useState<string | null>(null);
  const [aValider, setAValider] = useState<{ lecon: Lecon; label: string } | null>(null);
  const [aAnnuler, setAAnnuler] = useState<{ lecon: Lecon; label: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: validees = [], refetch } = useQuery({
    queryKey: ['nourania-progress', eleve, 'admin-validation'],
    enabled: !!eleve,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_nourania_progress').select('lesson_id').eq('user_id', eleve!).eq('is_validated', true);
      if (error) throw error;
      return (data || []).map((d) => d.lesson_id);
    },
  });

  const nomEleve = profiles.find((p) => p.user_id === eleve)?.full_name || 'Élève';
  const libelle = (l: Lecon) => `Leçon ${l.lesson_number}${l.title_french ? ` – ${l.title_french}` : ''}`;
  const rafraichir = () => {
    void refetch();
    queryClient.invalidateQueries({ queryKey: ['nourania-progress'] });
    queryClient.invalidateQueries({ queryKey: ['admin-nourania-validations'] });
  };

  const valider = async () => {
    const v = aValider; setAValider(null);
    if (!v || !eleve) return;
    setBusy(true);
    try {
      const maintenant = new Date().toISOString();
      const { data: ligne } = await supabase.from('user_nourania_progress').select('id').eq('user_id', eleve).eq('lesson_id', v.lecon.id).maybeSingle();
      const { error } = ligne
        ? await supabase.from('user_nourania_progress').update({ is_validated: true, is_completed: true, progress_percentage: 100, completed_at: maintenant }).eq('id', ligne.id)
        : await supabase.from('user_nourania_progress').insert({ user_id: eleve, lesson_id: v.lecon.id, is_validated: true, is_completed: true, progress_percentage: 100, completed_at: maintenant });
      if (error) throw error;
      // Une demande de validation encore en attente pour cette leçon : acceptée (elle ne reste pas dans « à corriger »)
      await supabase.from('nourania_validation_requests').update({ status: 'approved', reviewed_at: maintenant, reviewed_by: user?.id })
        .eq('user_id', eleve).eq('lesson_id', v.lecon.id).eq('status', 'pending');
      toast.success(`✅ ${v.label} validée pour ${nomEleve} (verte chez lui, points ajoutés)`);
      rafraichir();
    } catch {
      toast.error('📡 La leçon n\'a pas été validée : vérifie ta connexion');
    } finally { setBusy(false); }
  };

  const annuler = async () => {
    const v = aAnnuler; setAAnnuler(null);
    if (!v || !eleve) return;
    setBusy(true);
    const { error } = await supabase.from('user_nourania_progress').update({ is_validated: false }).eq('user_id', eleve).eq('lesson_id', v.lecon.id);
    setBusy(false);
    if (error) { toast.error('📡 La validation n\'a pas été annulée : vérifie ta connexion'); return; }
    toast.success(`${v.label} n'est plus validée pour ${nomEleve}`);
    rafraichir();
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h4 className="font-bold flex items-center gap-2"><Unlock className="h-4 w-4" /> Valider des leçons pour un élève</h4>
        <select className="w-full p-2 border rounded-lg bg-background text-foreground" value={eleve || ''} onChange={(e) => setEleve(e.target.value || null)} aria-label="Élève">
          <option value="">Sélectionner un élève...</option>
          {profiles.map((p) => <option key={p.user_id} value={p.user_id}>{p.full_name || p.email || 'Élève'}</option>)}
        </select>
        {eleve && (
          <div className="max-h-60 overflow-y-auto space-y-1">
            {lessons.map((l) => {
              const ok = validees.includes(l.id);
              return (
                <div key={l.id} className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded">
                  <span className="text-sm min-w-0 [overflow-wrap:anywhere]">{libelle(l)}</span>
                  <Button size="sm" disabled={busy} variant={ok ? 'default' : 'outline'} className={ok ? 'shrink-0 bg-emerald-600 hover:bg-emerald-700' : 'shrink-0'}
                    onClick={() => (ok ? setAAnnuler : setAValider)({ lecon: l, label: libelle(l) })}>
                    {ok ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                    {ok ? '✅ Validée' : 'Valider'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <AlertDialog open={!!aValider} onOpenChange={(o) => !o && setAValider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider cette leçon ?</AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">{aValider ? `« ${aValider.label} » sera validée pour ${nomEleve} comme si l'élève l'avait validée : verte chez lui, la suivante s'ouvre, et elle compte dans ses points.` : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void valider()}>✅ Valider</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!aAnnuler} onOpenChange={(o) => !o && setAAnnuler(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la validation de cette leçon ?</AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">{aAnnuler ? `« ${aAnnuler.label} » ne sera plus validée pour ${nomEleve} (ses points baissent de la même valeur). Tu pourras la revalider à tout moment.` : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Garder validée</AlertDialogCancel>
            <AlertDialogAction onClick={() => void annuler()}>Annuler la validation</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
