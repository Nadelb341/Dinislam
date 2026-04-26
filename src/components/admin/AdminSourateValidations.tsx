import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sendPushNotification } from '@/lib/pushHelper';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, ArrowLeft, User } from 'lucide-react';

interface AdminSourateValidationsProps {
  onBack: () => void;
}

const AdminSourateValidations = ({ onBack }: AdminSourateValidationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-sourate-validations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sourate_validation_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((data || []).map(r => r.user_id))];
      const sourateIds = [...new Set((data || []).map(r => r.sourate_id))];

      const [{ data: profiles }, { data: sourates }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds),
        supabase.from('sourates').select('id, number, name_arabic, name_french').in('id', sourateIds),
      ]);

      return (data || []).map(req => ({
        ...req,
        profile: profiles?.find(p => p.user_id === req.user_id),
        sourate: sourates?.find(s => s.id === req.sourate_id),
      }));
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin-validation-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sourate_validation_requests' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-sourate-validations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const approveMutation = useMutation({
    mutationFn: async (request: any) => {
      const { error: updateError } = await supabase
        .from('sourate_validation_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
        .eq('id', request.id);
      if (updateError) throw updateError;

      const { error: progressError } = await supabase
        .from('user_sourate_progress')
        .upsert({ user_id: request.user_id, sourate_id: request.sourate_id, is_validated: true, progress_percentage: 100 },
          { onConflict: 'user_id,sourate_id' });
      if (progressError) throw progressError;
    },
    onMutate: async (request) => {
      setProcessingId(request.id);
      await queryClient.cancelQueries({ queryKey: ['admin-sourate-validations'] });
      const previous = queryClient.getQueryData(['admin-sourate-validations']);
      queryClient.setQueryData(['admin-sourate-validations'], (old: any) =>
        (old || []).filter((r: any) => r.id !== request.id)
      );
      return { previous };
    },
    onSuccess: (_, request) => {
      toast({ title: `✅ Sourate ${request.sourate?.name_french || ''} validée pour ${request.profile?.full_name || 'l\'élève'}` });
      sendPushNotification({
        title: '⭐ Félicitations !',
        body: `Ton professeur a validé ${request.sourate?.name_french || 'ta sourate'} ! Continue comme ça !`,
        type: 'user',
        userId: request.user_id,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-sourate-validations'] });
    },
    onError: (_, __, context: any) => {
      if (context?.previous) queryClient.setQueryData(['admin-sourate-validations'], context.previous);
      toast({ title: 'Erreur lors de la validation', variant: 'destructive' });
    },
    onSettled: () => setProcessingId(null),
  });

  const refuseMutation = useMutation({
    mutationFn: async (request: any) => {
      const { error } = await supabase
        .from('sourate_validation_requests')
        .update({ status: 'refused', reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
        .eq('id', request.id);
      if (error) throw error;
    },
    onMutate: async (request) => {
      setProcessingId(request.id);
      await queryClient.cancelQueries({ queryKey: ['admin-sourate-validations'] });
      const previous = queryClient.getQueryData(['admin-sourate-validations']);
      queryClient.setQueryData(['admin-sourate-validations'], (old: any) =>
        (old || []).filter((r: any) => r.id !== request.id)
      );
      return { previous };
    },
    onSuccess: (_, request) => {
      toast({ title: '❌ Sourate refusée', description: `${request.sourate?.name_french || ''} refusée pour ${request.profile?.full_name || 'l\'élève'}` });
      sendPushNotification({
        title: '📖 Sourate à retravailler',
        body: `Ton professeur t'invite à retravailler ${request.sourate?.name_french || 'ta sourate'}. Continue tes efforts !`,
        type: 'user',
        userId: request.user_id,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-sourate-validations'] });
    },
    onError: (_, __, context: any) => {
      if (context?.previous) queryClient.setQueryData(['admin-sourate-validations'], context.previous);
      toast({ title: 'Erreur lors du refus', variant: 'destructive' });
    },
    onSettled: () => setProcessingId(null),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Validations en attente</h2>
          <p className="text-sm text-muted-foreground">{requests?.length || 0} demande(s)</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="h-20 bg-muted/50" /></Card>
          ))}
        </div>
      ) : requests?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
          <p>Aucune validation en attente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests?.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {req.profile?.full_name || req.profile?.email || 'Élève'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Sourate {req.sourate?.number} - {req.sourate?.name_french}
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
                      <XCircle className="h-4 w-4 mr-1" /> Refuser
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => approveMutation.mutate(req)}
                      disabled={processingId === req.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Valider
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

export default AdminSourateValidations;
