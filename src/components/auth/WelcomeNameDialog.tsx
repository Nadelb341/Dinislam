import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Star } from 'lucide-react';

interface WelcomeNameDialogProps {
  open: boolean;
  onComplete: () => void;
}

const WelcomeNameDialog = ({ open, onComplete }: WelcomeNameDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState('');

  const saveNameMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Non connecté');

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: `Bienvenue ${firstName} ! 🌟`,
        description: 'Ton prénom a été enregistré. Bismillah !',
      });
      onComplete();
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: "Impossible d'enregistrer le prénom",
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim()) {
      saveNameMutation.mutate(firstName.trim());
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
      
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mb-4">
            <Star className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl text-center">
            Bienvenue ! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Comment t'appelles-tu ? Dis-nous ton prénom pour personnaliser ton expérience.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="first-name">Ton prénom</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="first-name"
                type="text"
                placeholder="Entre ton prénom..."
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="pl-10 text-lg"
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={!firstName.trim() || saveNameMutation.isPending}
            >
              {saveNameMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Continuer'
              )}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={handleSkip}
            >
              Plus tard
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeNameDialog;
