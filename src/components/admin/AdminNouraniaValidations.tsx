import { envoyerMessageCorrection } from '@/lib/messageCorrection';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sendPushNotification } from '@/lib/pushHelper';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, ArrowLeft, User } from 'lucide-react';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';

interface AdminNouraniaValidationsProps {
  onBack: () => void;
}

const AdminNouraniaValidations = ({ onBack }: AdminNouraniaValidationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  // Valider demande confirmation (règle de Nadia) ; « À refaire » non
  const { askValidation, validationDialog } = useConfirmValidation();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-nourania-validations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nourania_validation_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((data || []).map(r => r.user_id))];
      const lessonIds = [...new Set((data || []).map(r => r.lesson_id))];

      const [{ data: profiles }, { data: lessons }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds.length ? userIds : ['none']),
        supabase.from('nourania_lessons').select('id, lesson_number, title_arabic, title_french').in('id', lessonIds.length ? lessonIds as string[] : ['none']),
      ]);

      return (data || []).map(req => ({
        ...req,
        profile: profiles?.find(p => p.user_id === req.user_id),
        lesson: lessons?.find(l => l.id === req.lesson_id),
      }));
    },
  });

  type PendingRequest = NonNullable<typeof requests>[number];

  useEffect(() => {
    const channel = supabase
      .channel('admin-nourania-validation-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'nourania_validation_requests',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-nourania-validations'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const approveMutation = useMutation({
    mutationFn: async (request: PendingRequest) => {
      // 1. Mark request as approved
      const { error: updateError } = await supabase
        .from('nourania_validation_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // 2. Validate the nourania progress
      const existing = await supabase
        .from('user_nourania_progress')
        .select('id')
        .eq('user_id', request.user_id)
        .eq('lesson_id', request.lesson_id)
        .maybeSingle();

      if (existing.data) {
        const { error } = await supabase
          .from('user_nourania_progress')
          .update({ is_validated: true })
          .eq('id', existing.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_nourania_progress')
          .insert({ user_id: request.user_id, lesson_id: request.lesson_id, is_validated: true });
        if (error) throw error;
      }
    },
    onMutate: async (request: PendingRequest) => {
      setProcessingId(request.id);
      await queryClient.cancelQueries({ queryKey: ['admin-nourania-validations'] });
      const previous = queryClient.getQueryData(['admin-nourania-validations']);
      queryClient.setQueryData<PendingRequest[]>(['admin-nourania-validations'], (old) =>
        (old || []).filter((r) => r.id !== request.id)
      );
      return { previous };
    },
    onSuccess: (_, request) => {
      toast({
        title: '✅ Leçon validée, niveau suivant débloqué !',
        description: `Leçon ${request.lesson?.lesson_number || ''} validée pour ${request.profile?.full_name || 'l\'élève'}`,
      });
      sendPushNotification({
        title: '⭐ Félicitations {prenom} !', category: 'rec',
        body: `Ton professeur a validé ${request.lesson?.title_french || 'ta leçon'} ! Continue comme ça !`,
        type: 'user',
        data: { url: '/nourania' },
        userId: request.user_id,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-nourania-validations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-nourania-count'] });
    },
    onError: (err, __, context) => {
      if (context?.previous) queryClient.setQueryData(['admin-nourania-validations'], context.previous);
      toast({ title: 'Erreur lors de la validation', description: err?.message || 'Veuillez réessayer.', variant: 'destructive' });
    },
    onSettled: () => setProcessingId(null),
  });

  const refuseMutation = useMutation({
    mutationFn: async (request: PendingRequest) => {
      const { error } = await supabase
        .from('nourania_validation_requests')
        .update({
          status: 'refused',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', request.id);
      if (error) throw error;
    },
    onMutate: async (request: PendingRequest) => {
      setProcessingId(request.id);
      await queryClient.cancelQueries({ queryKey: ['admin-nourania-validations'] });
      const previous = queryClient.getQueryData(['admin-nourania-validations']);
      queryClient.setQueryData<PendingRequest[]>(['admin-nourania-validations'], (old) =>
        (old || []).filter((r) => r.id !== request.id)
      );
      return { previous };
    },
    onSuccess: (_, request) => {
      toast({
        title: `🔁 Leçon à refaire`,
        description: `Leçon ${request.lesson?.lesson_number || ''} à refaire pour ${request.profile?.full_name || 'l\'élève'}`,
      });
      sendPushNotification({
        title: '📖 {prenom}, leçon à retravailler', category: 'rec',
        body: `Ton professeur t'invite à retravailler ${request.lesson?.title_french || 'ta leçon'}. Continue tes efforts !`,
        type: 'user',
        data: { url: '/nourania' },
        userId: request.user_id,
      });
      // 📝 Aussi dans la messagerie de l'élève, avec le lien direct vers la leçon (2026-11-04)
      void envoyerMessageCorrection({ studentId: request.user_id, notifier: false, sorte: 'retravailler', lien: `/nourania?item=${request.lesson_id}`,
        quoi: `ta leçon ${request.lesson?.lesson_number ?? ''} de Nourania${request.lesson?.title_french ? ` (${request.lesson.title_french})` : ''}` });
      queryClient.invalidateQueries({ queryKey: ['admin-nourania-validations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-nourania-count'] });
    },
    onError: (err, __, context) => {
      if (context?.previous) queryClient.setQueryData(['admin-nourania-validations'], context.previous);
      toast({ title: 'Erreur : pas envoyé', description: err?.message || 'Veuillez réessayer.', variant: 'destructive' });
    },
    onSettled: () => setProcessingId(null),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Validation Nourania</h2>
          <p className="text-sm text-muted-foreground">{requests?.length || 0} leçon(s) · lignes en dessous</p>
        </div>
      </div>
      {validationDialog}
      <LignesAValider />
      <p className="text-sm font-bold text-foreground pt-2">📘 Leçons entières</p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20 bg-muted/50" />
            </Card>
          ))}
        </div>
      ) : requests?.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
          <p>Aucune leçon en attente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests?.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                      <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {req.profile?.full_name || req.profile?.email || 'Élève'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Leçon {req.lesson?.lesson_number} - {req.lesson?.title_french}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(req.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => refuseMutation.mutate(req)}
                      disabled={processingId === req.id}
                    >
                      🔁 À refaire
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => askValidation(`Valider la leçon ${req.lesson?.lesson_number ?? ''} ?`, `${req.profile?.full_name || 'L\'élève'} : leçon ${req.lesson?.lesson_number ?? ''}${req.lesson?.title_french ? ` (${req.lesson.title_french})` : ''} validée, la suivante s'ouvre et toutes ses lignes s'éclaircissent.`, () => approveMutation.mutate(req))}
                      disabled={processingId === req.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Valider
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNouraniaValidations;

/**
 * ☑️ Lignes Nourania cochées par les élèves (Nadia, 2026-11-15) : chaque ligne = une demande de validation.
 * 2026-11-18 : validation en 2 temps.
 *  - « ✅ Valider » = RÉVISION : la ligne devient orange clair chez l'élève, à revoir avec lui au cours du mercredi ;
 *  - « ⭐ Valider définitivement » = la vraie validation : la ligne s'éclaircit (comme quand l'enseignante valide elle-même).
 * Les lignes en révision restent listées dans « 🟠 À revoir au cours » jusqu'à la validation définitive.
 */
type LigneAttente = { id: string; user_id: string; lesson_id: string; ligne: number; created_at: string; valide_le: string | null };
type Groupe = { cle: string; user_id: string; lesson_id: string; nom: string; lecon: { id: string; lesson_number: number; title_french: string | null } | undefined; lignes: LigneAttente[] };
function LignesAValider() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { askValidation, validationDialog } = useConfirmValidation();
  const [envoi, setEnvoi] = useState(false);
  const { toast } = useToast();
  const { data = { attente: [] as Groupe[], revoir: [] as Groupe[] }, isLoading } = useQuery({
    queryKey: ['admin-nourania-lignes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('nourania_lignes_faites').select('id, user_id, lesson_id, ligne, created_at, valide_le').eq('definitif', false).order('created_at');
      if (error) throw error;
      const lignes = (data || []) as LigneAttente[];
      const uids = [...new Set(lignes.map((l) => l.user_id))], lids = [...new Set(lignes.map((l) => l.lesson_id))];
      const [{ data: profils }, { data: lecons }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').in('user_id', uids.length ? uids : ['00000000-0000-0000-0000-000000000000']),
        supabase.from('nourania_lessons').select('id, lesson_number, title_french').in('id', lids.length ? lids : ['00000000-0000-0000-0000-000000000000']),
      ]);
      const grouper = (liste: LigneAttente[]) => {
        const parCle = new Map<string, Groupe>();
        for (const l of liste) {
          const cle = `${l.user_id}|${l.lesson_id}`;
          if (!parCle.has(cle)) parCle.set(cle, { cle, user_id: l.user_id, lesson_id: l.lesson_id, nom: profils?.find((p) => p.user_id === l.user_id)?.full_name || 'Élève', lecon: lecons?.find((x) => x.id === l.lesson_id), lignes: [] });
          parCle.get(cle)!.lignes.push(l);
        }
        return [...parCle.values()].map((g) => ({ ...g, lignes: g.lignes.sort((a, b) => a.ligne - b.ligne) }));
      };
      return { attente: grouper(lignes.filter((l) => !l.valide_le)), revoir: grouper(lignes.filter((l) => !!l.valide_le)) };
    },
  });
  const valider = async (lignes: LigneAttente[], definitif: boolean, qui: string, quoi: string, eleveId: string, lessonId: string) => {
    setEnvoi(true);
    try {
      const maintenant = new Date().toISOString();
      // Les lignes déjà validées en révision gardent leur date ; les autres prennent celle d'aujourd'hui
      const sansDate = lignes.filter((l) => !l.valide_le).map((l) => l.id), avecDate = lignes.filter((l) => !!l.valide_le).map((l) => l.id);
      if (sansDate.length) {
        const { error } = await supabase.from('nourania_lignes_faites').update({ valide_le: maintenant, valide_par: user?.id ?? null, definitif }).in('id', sansDate);
        if (error) throw error;
      }
      if (avecDate.length) {
        const { error } = await supabase.from('nourania_lignes_faites').update({ valide_par: user?.id ?? null, definitif }).in('id', avecDate);
        if (error) throw error;
      }
      const pluriel = lignes.length > 1 ? 's' : '';
      toast({ title: definitif ? `⭐ ${quoi} validée${pluriel} définitivement` : `✅ ${quoi} validée${pluriel} (à revoir au cours)`, description: qui });
      sendPushNotification(definitif
        ? { title: '⭐ Bravo {prenom} !', category: 'rec', body: `Ton professeur a validé ${quoi} de Nourania.`, type: 'user', data: { url: `/nourania?item=${lessonId}` }, userId: eleveId }
        : { title: '✅ Bravo {prenom} !', category: 'rec', body: `Ton professeur a vu ${quoi} de Nourania : vous la revoyez ensemble au prochain cours 🟠`, type: 'user', data: { url: `/nourania?item=${lessonId}` }, userId: eleveId });
    } catch (e) {
      toast({ title: /fetch|network/i.test((e as Error).message) ? '📡 Nécessite Internet' : 'Erreur : pas validé', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setEnvoi(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-nourania-lignes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-pending-breakdown'] });
    }
  };
  const nomLecon = (g: Groupe) => `Leçon ${g.lecon?.lesson_number ?? '?'}${g.lecon?.title_french ? ` – ${g.lecon.title_french}` : ''}`;
  const carte = (g: Groupe, revoir: boolean) => {
    const lecon = nomLecon(g);
    const num = g.lecon?.lesson_number ?? '';
    const liste = g.lignes.map((l) => l.ligne).join(', ');
    const definitivement = (lignes: LigneAttente[], quoi: string, titre: string) =>
      askValidation(titre, `${g.nom} : ${lecon}, ${quoi}. Validation définitive : la ligne s'éclaircit chez l'élève.`, () => void valider(lignes, true, g.nom, quoi, g.user_id, g.lesson_id));
    return (
      <Card key={g.cle} className={revoir ? 'border-orange-300 dark:border-orange-800' : undefined}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${revoir ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-sky-100 dark:bg-sky-900/30'}`}><User className={`h-4 w-4 ${revoir ? 'text-orange-600 dark:text-orange-400' : 'text-sky-600 dark:text-sky-400'}`} /></div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground [overflow-wrap:anywhere]">{g.nom}</p>
              <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{lecon}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {g.lignes.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-2">
                <span className={`grid h-7 min-w-7 place-items-center rounded-full px-1 text-xs font-bold ${revoir ? 'bg-orange-200 text-orange-800' : 'bg-[#10b981] text-white'}`}>{l.ligne}</span>
                {!revoir && (
                  <button type="button" disabled={envoi}
                    onClick={() => askValidation(`Valider la ligne ${l.ligne} ?`, `${g.nom} : ${lecon}, ligne ${l.ligne}. Elle devient orange clair chez l'élève : vous la revoyez ensemble au cours du mercredi.`, () => void valider([l], false, g.nom, `la ligne ${l.ligne} (leçon ${num})`, g.user_id, g.lesson_id))}
                    className="inline-flex items-center gap-1 rounded-xl border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 text-sm font-bold text-emerald-800 dark:text-emerald-200 disabled:opacity-60">
                    ✅ Valider
                  </button>
                )}
                <button type="button" disabled={envoi}
                  onClick={() => definitivement([l], `la ligne ${l.ligne} (leçon ${num})`, `Valider définitivement la ligne ${l.ligne} ?`)}
                  className="inline-flex items-center gap-1 rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 text-sm font-bold text-amber-800 dark:text-amber-200 disabled:opacity-60">
                  ⭐ Valider définitivement
                </button>
              </div>
            ))}
          </div>
          {g.lignes.length > 1 && (
            <div className="flex flex-col gap-2">
              {!revoir && (
                <Button size="sm" disabled={envoi} className="w-full bg-green-500 hover:bg-green-600 text-white h-auto min-h-9 whitespace-normal"
                  onClick={() => askValidation(`Valider les ${g.lignes.length} lignes ?`, `${g.nom} : ${lecon}, lignes ${liste}. Elles deviennent orange clair : à revoir au cours du mercredi.`, () => void valider(g.lignes, false, g.nom, `les lignes ${liste} (leçon ${num})`, g.user_id, g.lesson_id))}>
                  <CheckCircle className="h-4 w-4 mr-1 shrink-0" /> Valider les {g.lignes.length} lignes
                </Button>
              )}
              <Button size="sm" disabled={envoi} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-auto min-h-9 whitespace-normal"
                onClick={() => definitivement(g.lignes, `les lignes ${liste} (leçon ${num})`, `Valider définitivement les ${g.lignes.length} lignes ?`)}>
                ⭐ Valider définitivement les {g.lignes.length} lignes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  const total = data.attente.reduce((n, g) => n + g.lignes.length, 0);
  const totalRevoir = data.revoir.reduce((n, g) => n + g.lignes.length, 0);
  return (
    <div className="space-y-2">
      {validationDialog}
      <p className="text-sm font-bold text-foreground">☑️ Lignes cochées par les élèves {total > 0 && <span className="ms-1 rounded-full bg-destructive text-destructive-foreground px-2 text-xs">{total}</span>}</p>
      {isLoading ? <div className="h-16 rounded-xl bg-muted/50 animate-pulse" />
        : !data.attente.length ? <p className="text-sm text-muted-foreground py-2">Aucune ligne à valider.</p>
        : data.attente.map((g) => carte(g, false))}
      {data.revoir.length > 0 && (
        <>
          <p className="pt-2 text-sm font-bold text-foreground">🟠 À revoir au cours du mercredi <span className="ms-1 rounded-full bg-orange-200 text-orange-800 px-2 text-xs">{totalRevoir}</span></p>
          <p className="text-xs text-muted-foreground">Lignes déjà validées en révision : après les avoir revues avec l'élève, valide-les définitivement.</p>
          {data.revoir.map((g) => carte(g, true))}
        </>
      )}
    </div>
  );
}
