import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Pencil, Check, X } from 'lucide-react';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { generateFromTemplate } from '@/data/flashcard-templates';

interface Props {
  cardId: string;
  cardTitle: string;
  moduleTitle: string;
  description?: string;
  contentType?: string;
  contentUrl?: string;
}

const FlashcardManager = ({ cardId, cardTitle, moduleTitle }: Props) => {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [front, setFront] = useState('');
  const [arabic, setArabic] = useState('');
  const [translit, setTranslit] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editArabic, setEditArabic] = useState('');
  const [editTranslit, setEditTranslit] = useState('');

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

  const list = flashcards as any[];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-flashcards', cardId] });
    queryClient.invalidateQueries({ queryKey: ['flashcards', cardId] });
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!front.trim()) throw new Error('Le texte français est requis');
      const maxOrder = list.reduce((max: number, f: any) => Math.max(max, f.display_order ?? 0), -1);
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, front_text, back_arabic, back_transliteration }: any) => {
      if (!front_text.trim()) throw new Error('Le texte français est requis');
      const { error } = await (supabase as any).from('module_flashcards').update({
        front_text: front_text.trim(),
        back_arabic: back_arabic?.trim() || null,
        back_transliteration: back_transliteration?.trim() || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      toast.success('Flashcard modifiée ✅');
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

  const moveMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const idx = list.findIndex((f: any) => f.id === id);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= list.length) return;
      const current = list[idx];
      const swap = list[swapIdx];
      await (supabase as any).from('module_flashcards').update({ display_order: swap.display_order }).eq('id', current.id);
      await (supabase as any).from('module_flashcards').update({ display_order: current.display_order }).eq('id', swap.id);
    },
    onSuccess: invalidate,
    onError: () => toast.error('Erreur lors du déplacement'),
  });

  const startEdit = (f: any) => {
    setEditingId(f.id);
    setEditFront(f.front_text);
    setEditArabic(f.back_arabic || '');
    setEditTranslit(f.back_transliteration || '');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const templates = generateFromTemplate(cardTitle, moduleTitle);
      if (!templates) {
        toast.error('Aucun modèle disponible pour ce sujet — ajoute les flashcards manuellement.');
        return;
      }
      const maxOrder = list.reduce((max: number, f: any) => Math.max(max, f.display_order ?? 0), -1);
      const rows = templates.map((t, i) => ({
        module_card_id: cardId,
        front_text: t.front_text,
        back_arabic: t.back_arabic || null,
        back_transliteration: t.back_transliteration || null,
        display_order: maxOrder + 1 + i,
      }));
      const { error } = await (supabase as any).from('module_flashcards').insert(rows);
      if (error) throw error;
      toast.success(`✨ ${rows.length} flashcards générées !`);
      invalidate();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const count = expanded ? list.length : null;

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
          {/* Bouton génération */}
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

          {/* Formulaire d'ajout */}
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

          {/* Liste */}
          {list.length > 0 && (
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {list.map((f: any, i: number) => (
                editingId === f.id ? (
                  /* Mode édition */
                  <div key={f.id} className="bg-violet-50 dark:bg-violet-950/30 border border-violet-300 dark:border-violet-700 rounded-lg p-2 space-y-1.5">
                    <Input
                      value={editFront}
                      onChange={e => setEditFront(e.target.value)}
                      placeholder="Texte français"
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); updateMutation.mutate({ id: editingId, front_text: editFront, back_arabic: editArabic, back_transliteration: editTranslit }); }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <div className="flex gap-1.5">
                      <Input
                        value={editArabic}
                        onChange={e => setEditArabic(e.target.value)}
                        placeholder="Arabe"
                        className="h-8 text-sm font-arabic text-right"
                        dir="rtl"
                      />
                      <Input
                        value={editTranslit}
                        onChange={e => setEditTranslit(e.target.value)}
                        placeholder="Translittération"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => updateMutation.mutate({ id: editingId, front_text: editFront, back_arabic: editArabic, back_transliteration: editTranslit })}
                        disabled={!editFront.trim() || updateMutation.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" /> Enregistrer
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3 mr-1" /> Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Mode affichage */
                  <div key={f.id} className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2 py-2">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.front_text}</p>
                      <p className="text-xs text-muted-foreground font-arabic">
                        {f.back_arabic || '—'}
                        {f.back_transliteration ? ` (${f.back_transliteration})` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground"
                        onClick={() => moveMutation.mutate({ id: f.id, direction: 'up' })}
                        disabled={i === 0 || moveMutation.isPending}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground"
                        onClick={() => moveMutation.mutate({ id: f.id, direction: 'down' })}
                        disabled={i === list.length - 1 || moveMutation.isPending}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon" variant="ghost" className="h-6 w-6 text-blue-500 hover:text-blue-600"
                        onClick={() => startEdit(f)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(f.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          {list.length === 0 && (
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
