import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sendPushNotification } from '@/lib/pushHelper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChoixEleveParGroupe } from '@/components/shared/ChoixEleveParGroupe';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * ✅ Valider / ↩️ invalider pour un élève, depuis « Gérer le contenu » d'une carte (Nadia, 2026-11-17 et 2026-11-18 :
 * « exactement la même carte que pour les sourates » puis « je dois pouvoir invalider une action faite par les élèves »).
 * Sert à Nourania (leçons) et aux Invocations. Valider = VRAIE validation dans l'avancement de l'élève (verte chez lui, la suite
 * s'ouvre, points recalculés tout seuls par le déclencheur `recalculate_points`) ; une demande en attente passe « acceptée ».
 * Annuler / invalider (confirmation) = l'élément n'est plus validé, MÊME s'il avait été validé par l'élève ; ses points baissent.
 * Nourania : la validation d'une leçon valide aussi ses lignes (déclencheur `nourania_lecon_valide_lignes`).
 * Différent du 🔓 d'une leçon (nourania_admin_unlocks) qui OUVRE seulement la leçon.
 */
export type ElementAValider = { id: string; libelle: string };
type Eleve = { user_id: string; full_name: string | null; email: string | null };
export type GenreValidation = 'nourania' | 'invocation';
const CONFIG = {
  nourania: { table: 'user_nourania_progress', cle: 'lesson_id', demandes: 'nourania_validation_requests', titre: 'Valider des leçons pour un élève', nom: 'leçon', une: 'cette leçon', valide: (t: string) => ({ is_validated: true, is_completed: true, progress_percentage: 100, completed_at: t }), annule: { is_validated: false } },
  invocation: { table: 'user_invocation_progress', cle: 'invocation_id', demandes: 'invocation_validation_requests', titre: 'Valider des invocations pour un élève', nom: 'invocation', une: 'cette invocation', valide: (t: string) => ({ is_validated: true, is_memorized: true, is_completed: true, completed_at: t }), annule: { is_validated: false, is_memorized: false } },
} as const;

export default function ValiderPourEleve({ genre, elements, profiles }: { genre: GenreValidation; elements: ElementAValider[]; profiles: Eleve[] }) {
  const cfg = CONFIG[genre];
  // Tables choisies par la carte : on passe par un client non typé (mêmes colonnes user_id + clé de l'élément)
  const db = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> };
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [eleve, setEleve] = useState<string | null>(null);
  const [nomChoisi, setNomChoisi] = useState('');
  const [aValider, setAValider] = useState<ElementAValider | null>(null);
  const [aAnnuler, setAAnnuler] = useState<ElementAValider | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: validees = [], refetch } = useQuery({
    queryKey: [genre === 'nourania' ? 'nourania-progress' : 'invocation-progress', eleve, 'admin-validation'],
    enabled: !!eleve,
    queryFn: async () => {
      const { data, error } = await db.from(cfg.table).select(cfg.cle).eq('user_id', eleve!).eq('is_validated', true);
      if (error) throw error;
      return ((data || []) as unknown as Record<string, string | number>[]).map((d) => String(d[cfg.cle]));
    },
  });

  const nomEleve = nomChoisi || profiles.find((p) => p.user_id === eleve)?.full_name || 'Élève';
  const rafraichir = () => {
    void refetch();
    queryClient.invalidateQueries({ queryKey: [genre === 'nourania' ? 'nourania-progress' : 'invocation-progress'] });
    queryClient.invalidateQueries({ queryKey: [genre === 'nourania' ? 'admin-nourania-validations' : 'admin-invocation-validations'] });
  };

  const idDe = (e: ElementAValider) => (genre === 'invocation' ? Number(e.id) : e.id);

  const valider = async () => {
    const v = aValider; setAValider(null);
    if (!v || !eleve) return;
    setBusy(true);
    try {
      const maintenant = new Date().toISOString();
      const { data: ligne } = await db.from(cfg.table).select('id').eq('user_id', eleve).eq(cfg.cle, idDe(v)).maybeSingle();
      const id = (ligne as { id?: string } | null)?.id;
      const { error } = id
        ? await db.from(cfg.table).update(cfg.valide(maintenant) as never).eq('id', id)
        : await db.from(cfg.table).insert({ user_id: eleve, [cfg.cle]: idDe(v), ...cfg.valide(maintenant) } as never);
      if (error) throw error;
      // Une demande de validation encore en attente pour cet élément : acceptée (elle ne reste pas dans « à corriger »)
      await db.from(cfg.demandes).update({ status: 'approved', reviewed_at: maintenant, reviewed_by: user?.id } as never)
        .eq('user_id', eleve).eq(cfg.cle, idDe(v)).eq('status', 'pending');
      // 🔔 2026-11-18 (Nadia : tout ce que j'envoie aux élèves doit les prévenir)
      sendPushNotification({ userId: eleve, category: 'rec', title: '✅ {prenom}, ton professeur a validé !',
        body: `${genre === 'nourania' ? 'Nourania' : 'Invocation'} : ${v.libelle} ✨`, data: { url: genre === 'nourania' ? '/nourania' : '/invocations' } });
      toast.success(`✅ ${v.libelle} : validée pour ${nomEleve} (verte chez lui, points ajoutés)`);
      rafraichir();
    } catch {
      toast.error(`📡 ${v.libelle} n'a pas été validée : vérifie ta connexion`);
    } finally { setBusy(false); }
  };

  const annuler = async () => {
    const v = aAnnuler; setAAnnuler(null);
    if (!v || !eleve) return;
    setBusy(true);
    const { error } = await db.from(cfg.table).update(cfg.annule as never).eq('user_id', eleve).eq(cfg.cle, idDe(v));
    setBusy(false);
    if (error) { toast.error('📡 La validation n\'a pas été annulée : vérifie ta connexion'); return; }
    toast.success(`${v.libelle} : n'est plus validée pour ${nomEleve}`);
    rafraichir();
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h4 className="font-bold flex items-center gap-2"><Unlock className="h-4 w-4" /> {cfg.titre}</h4>
        <ChoixEleveParGroupe value={eleve} onChange={(id, nom) => { setEleve(id); setNomChoisi(nom); }} />
        {eleve && (
          <div className="max-h-[65vh] overflow-y-auto space-y-1">
            {elements.map((l) => {
              const ok = validees.includes(l.id);
              return (
                <div key={l.id} className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded">
                  <span className="text-sm min-w-0 [overflow-wrap:anywhere]">{l.libelle}</span>
                  <Button size="sm" disabled={busy} variant={ok ? 'default' : 'outline'} className={ok ? 'shrink-0 bg-emerald-600 hover:bg-emerald-700' : 'shrink-0'}
                    onClick={() => (ok ? setAAnnuler : setAValider)(l)}>
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
            <AlertDialogTitle>Valider {cfg.une} ?</AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">{aValider ? `« ${aValider.libelle} » sera validée pour ${nomEleve} comme si l'élève l'avait validée : verte chez lui, la suite s'ouvre, et elle compte dans ses points.` : ''}</AlertDialogDescription>
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
            <AlertDialogTitle>Invalider {cfg.une} ?</AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">{aAnnuler ? `« ${aAnnuler.libelle} » ne sera plus validée pour ${nomEleve}, même si c'est l'élève qui l'avait validée (ses points baissent de la même valeur). Tu pourras la revalider à tout moment.` : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Garder validée</AlertDialogCancel>
            <AlertDialogAction onClick={() => void annuler()}>↩️ Invalider</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
