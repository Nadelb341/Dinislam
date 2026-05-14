import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';

interface Props {
  cardId: string;
  cardTitle: string;
  moduleTitle: string;
  description?: string;
  contentType?: string;
  contentUrl?: string;
}

const FlashcardManager = ({ cardId, cardTitle, moduleTitle, description, contentType, contentUrl }: Props) => {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [front, setFront] = useState('');
  const [arabic, setArabic] = useState('');
  const [translit, setTranslit] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: flashcards = [] } = useQuery({
    queryKey: ['admin-flashcards', cardId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('module_flashcards')
        .select('*')
        .eq('module_card_id', cardId)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
    enabled: expanded,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-flashcards', cardId] });
    queryClient.invalidateQueries({ queryKey: ['flashcards', cardId] });
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!front.trim()) throw new Error('Le texte français est requis');
      const maxOrder = (flashcards as any[]).reduce(
        (max: number, f: any) => Math.max(max, f.display_order ?? 0), -1
      );
      const { error } = await (supabase as any).from('module_flashcards').insert({
        module_card_id: cardId,
        front_text: front.trim(),
        back_arabic: arabic.trim() || null,
        back_transliteration: translit.trim() || null,
        display_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setFront(''); setArabic(''); setTranslit('');
      toast.success('Flashcard ajoutée ✅');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('module_flashcards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Flashcard supprimée');
      setDeleteId(null);
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    const toastId = `fc-gen-${cardId}-${Date.now()}`;
    toast.loading('✨ Génération des flashcards…', { id: toastId, duration: 20000 });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          card_id: cardId,
          card_title: cardTitle,
          module_title: moduleTitle,
          description: description || '',
          content_type: contentType || '',
          file_url: contentUrl || '',
        }),
      });

      let result: any = {};
      try {
        result = await res.json();
      } catch {
        toast.error(`Erreur ${res.status} — réponse inattendue du serveur`, { id: toastId });
        return;
      }

      if (result.success) {
        toast.success(`✨ ${result.count} flashcards générées !`, { id: toastId });
        invalidate();
      } else {
        const msg = result.error || result.message || result.msg || `Erreur ${res.status}`;
        toast.error(msg, { id: toastId });
        console.error('[generate-flashcards] réponse complète :', result);
      }
    } catch (e: any) {
      toast.error(`Erreur réseau : ${e.message}`, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const count = expanded ? (flashcards as any[]).length : null;

  return (
    <div className="border border-dashed border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
      >
        <span>🃏 Flashcards{count !== null && count > 0 ? ` (${count})` : ''}</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="p-3 space-y-3 border-t border-dashed border-border">
          {/* Bouton génération IA */}
          <Button
            size="sm"
            variant="outline"
            className="w-full border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            {isGenerating ? 'Génération en cours…' : '✨ Générer avec l\'IA'}
          </Button>

          {/* Formulaire d'ajout manuel */}
          <div className="space-y-2">
            <Input
              placeholder="Texte français (recto) *"
              value={front}
              onChange={e => setFront(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMutation.mutate(); } }}
            />
            <div className="flex gap-2">
              <Input
                placeholder="أ ب ت (verso arabe)"
                value={arabic}
                onChange={e => setArabic(e.target.value)}
                className="font-arabic text-right"
                dir="rtl"
              />
              <Input
                placeholder="Translittération"
                value={translit}
                onChange={e => setTranslit(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={() => addMutation.mutate()}
              disabled={!front.trim() || addMutation.isPending}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Ajouter une flashcard
            </Button>
          </div>

          {/* Liste des flashcards */}
          {(flashcards as any[]).length > 0 && (
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {(flashcards as any[]).map((f: any, i: number) => (
                <div key={f.id} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
                  <span className="text-xs text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.front_text}</p>
                    <p className="text-xs text-muted-foreground font-arabic">
                      {f.back_arabic || '—'}
                      {f.back_transliteration ? ` (${f.back_transliteration})` : ''}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                    onClick={() => setDeleteId(f.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {(flashcards as any[]).length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Aucune flashcard — génère-en avec l'IA ou ajoute-en manuellement.
            </p>
          )}
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Supprimer cette flashcard ?"
        description="Cette flashcard sera définitivement supprimée."
      />
    </div>
  );
};

export default FlashcardManager;
