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
 * Pas de correction, pas de « À refaire » : juste ✅ Valider (avec confirmation). Validée → éclaircie chez l'élève.
 * Rangées par élève et par leçon ; « Valider les N lignes » pour aller vite.
 */
type LigneAttente = { id: string; user_id: string; lesson_id: string; ligne: number; created_at: string };
function LignesAValider() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { askValidation, validationDialog } = useConfirmValidation();
  const [envoi, setEnvoi] = useState(false);
  const { toast } = useToast();
  const { data: groupes = [], isLoading } = useQuery({
    queryKey: ['admin-nourania-lignes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('nourania_lignes_faites').select('id, user_id, lesson_id, ligne, created_at').is('valide_le', null).order('created_at');
      if (error) throw error;
      const lignes = (data || []) as LigneAttente[];
      const uids = [...new Set(lignes.map((l) => l.user_id))], lids = [...new Set(lignes.map((l) => l.lesson_id))];
      const [{ data: profils }, { data: lecons }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').in('user_id', uids.length ? uids : ['00000000-0000-0000-0000-000000000000']),
        supabase.from('nourania_lessons').select('id, lesson_number, title_french').in('id', lids.length ? lids : ['00000000-0000-0000-0000-000000000000']),
      ]);
      const parCle = new Map<string, { cle: string; user_id: string; lesson_id: string; nom: string; lecon: { id: string; lesson_number: number; title_french: string | null } | undefined; lignes: LigneAttente[] }>();
      for (const l of lignes) {
        const cle = `${l.user_id}|${l.lesson_id}`;
        if (!parCle.has(cle)) parCle.set(cle, { cle, user_id: l.user_id, lesson_id: l.lesson_id, nom: profils?.find((p) => p.user_id === l.user_id)?.full_name || 'Élève', lecon: lecons?.find((x) => x.id === l.lesson_id), lignes: [] });
        parCle.get(cle)!.lignes.push(l);
      }
      return [...parCle.values()].map((g) => ({ ...g, lignes: g.lignes.sort((a, b) => a.ligne - b.ligne) }));
    },
  });
  const valider = async (ids: string[], qui: string, quoi: string, eleveId: string, lessonId: string) => {
    setEnvoi(true);
    try {
      const { error } = await supabase.from('nourania_lignes_faites').update({ valide_le: new Date().toISOString(), valide_par: user?.id ?? null }).in('id', ids);
      if (error) throw error;
      toast({ title: `✅ ${quoi} validée${ids.length > 1 ? 's' : ''}`, description: qui });
      sendPushNotification({ title: '⭐ Bravo {prenom} !', category: 'rec', body: `Ton professeur a validé ${quoi} de Nourania.`, type: 'user', data: { url: `/nourania?item=${lessonId}` }, userId: eleveId });
    } catch (e) {
      toast({ title: /fetch|network/i.test((e as Error).message) ? '📡 Nécessite Internet' : 'Erreur : pas validé', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setEnvoi(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-nourania-lignes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-pending-breakdown'] });
    }
  };
  const total = groupes.reduce((n, g) => n + g.lignes.length, 0);
  return (
    <div className="space-y-2">
      {validationDialog}
      <p className="text-sm font-bold text-foreground">☑️ Lignes cochées par les élèves {total > 0 && <span className="ms-1 rounded-full bg-destructive text-destructive-foreground px-2 text-xs">{total}</span>}</p>
      {isLoading ? <div className="h-16 rounded-xl bg-muted/50 animate-pulse" />
        : !groupes.length ? <p className="text-sm text-muted-foreground py-2">Aucune ligne à valider.</p>
        : groupes.map((g) => {
          const lecon = `Leçon ${g.lecon?.lesson_number ?? '?'}${g.lecon?.title_french ? ` – ${g.lecon.title_french}` : ''}`;
          return (
            <Card key={g.cle}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center"><User className="h-4 w-4 text-sky-600 dark:text-sky-400" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground [overflow-wrap:anywhere]">{g.nom}</p>
                    <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{lecon}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.lignes.map((l) => (
                    <button key={l.id} type="button" disabled={envoi}
                      onClick={() => askValidation(`Valider la ligne ${l.ligne} ?`, `${g.nom} : ${lecon}, ligne ${l.ligne}. Elle s'éclaircira chez l'élève.`, () => void valider([l.id], g.nom, `la ligne ${l.ligne} (leçon ${g.lecon?.lesson_number ?? ''})`, g.user_id, g.lesson_id))}
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 text-sm font-bold text-emerald-800 dark:text-emerald-200 disabled:opacity-60">
                      <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[#10b981] px-1 text-xs text-white">{l.ligne}</span>
                      ✅ Valider
                    </button>
                  ))}
                </div>
                {g.lignes.length > 1 && (
                  <Button size="sm" disabled={envoi} className="w-full bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => askValidation(`Valider les ${g.lignes.length} lignes ?`, `${g.nom} : ${lecon}, lignes ${g.lignes.map((l) => l.ligne).join(', ')}.`, () => void valider(g.lignes.map((l) => l.id), g.nom, `les lignes ${g.lignes.map((l) => l.ligne).join(', ')} (leçon ${g.lecon?.lesson_number ?? ''})`, g.user_id, g.lesson_id))}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Valider les {g.lignes.length} lignes
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}

