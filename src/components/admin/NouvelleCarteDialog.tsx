import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { errorMessage } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

/**
 * ➕ Nouvelle carte de l'accueil (Nadia, 2026-11-21, proposition 3 du crayon) : PRÉ-REMPLIE d'après une carte modèle
 * (par défaut la dernière carte) : même icône, mêmes couleurs, même petite phrase, et si on veut ses sous-cartes recopiées
 * (titres, sections, titres arabes, images, descriptions). Elle naît CACHÉE (🔒 Personne) : on la remplit, puis « Afficher à… ».
 * Une nouvelle carte a : zones de contenu (texte, images, vidéos, PDF), sous-cartes, flashcards.
 */
type Module = Tables<'learning_modules'>;

export function NouvelleCarteDialog({ open, modules, onClose, onCreee }: {
  open: boolean; modules: Module[]; onClose: () => void; onCreee: (m: Module) => void;
}) {
  const queryClient = useQueryClient();
  const [modeleId, setModeleId] = useState<string>('');
  const [titre, setTitre] = useState('Nouvelle carte');
  const [recopier, setRecopier] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setModeleId(modules.at(-1)?.id ?? ''); setTitre('Nouvelle carte'); setRecopier(true); } }, [open, modules]);
  const modele = modules.find((m) => m.id === modeleId) ?? null;

  const { data: sousCartes = [] } = useQuery({
    queryKey: ['nouvelle-carte-modele', modeleId],
    enabled: open && !!modeleId,
    queryFn: async () => {
      const { data, error } = await supabase.from('module_cards').select('*').eq('module_id', modeleId).order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const creer = async () => {
    if (!titre.trim()) { toast.error('Donne un titre à la carte'); return; }
    setBusy(true);
    try {
      const ordre = Math.max(0, ...modules.map((m) => m.display_order ?? 0)) + 1;
      const { data: m, error } = await supabase.from('learning_modules').insert({
        title: titre.trim(), title_arabic: null, description: modele?.description ?? null,
        module_type: 'generic', is_builtin: false, builtin_path: null, is_active: false,
        icon: modele?.icon ?? 'BookOpen', gradient: modele?.gradient ?? null, icon_color: modele?.icon_color ?? null,
        display_order: ordre,
      }).select('*').single();
      if (error || !m) throw error || new Error('Carte non créée');
      if (recopier && sousCartes.length) {
        const { error: e2 } = await supabase.from('module_cards').insert(sousCartes.map((c) => ({
          module_id: m.id, title: c.title, title_arabic: c.title_arabic, description: c.description, section: c.section,
          image_url: c.image_url, display_order: c.display_order, is_locked: c.is_locked,
        })));
        if (e2) throw e2;
      }
      for (const k of ['learning-modules', 'admin-learning-modules', 'cartes-acces']) void queryClient.invalidateQueries({ queryKey: [k] });
      toast.success('➕ Carte créée, cachée aux élèves pour l\'instant : remplis-la, puis ⋮ › « Afficher à… »');
      onCreee(m);
      onClose();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>➕ Nouvelle carte</DialogTitle>
          <DialogDescription>Elle reprend le style d'une carte modèle. Elle reste cachée aux élèves tant que tu ne l'as pas ouverte.</DialogDescription>
        </DialogHeader>
        <label className="text-xs font-semibold" htmlFor="nc-titre">Titre</label>
        <Input id="nc-titre" value={titre} maxLength={50} onChange={(e) => setTitre(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void creer(); } }} />
        <label className="text-xs font-semibold" htmlFor="nc-modele">Sur le modèle de…</label>
        <select id="nc-modele" value={modeleId} onChange={(e) => setModeleId(e.target.value)} className="w-full rounded-lg border bg-background px-2 py-2 text-sm">
          {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
        {sousCartes.length > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" checked={recopier} onChange={(e) => setRecopier(e.target.checked)} />
            Recopier ses {sousCartes.length} sous-carte{sousCartes.length > 1 ? 's' : ''} (titres, images, descriptions)
          </label>
        )}
        <p className="text-[11px] text-muted-foreground">Dans la nouvelle carte : zones de contenu (texte, images, vidéos, PDF), sous-cartes et flashcards. Les écrans spéciaux d'une carte (ex. récitation des sourates) ne se recopient pas.</p>
        <Button disabled={busy} onClick={() => void creer()}>{busy ? 'Création…' : 'Créer la carte'}</Button>
      </DialogContent>
    </Dialog>
  );
}
