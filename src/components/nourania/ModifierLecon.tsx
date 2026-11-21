import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

/** Ce qu'il faut d'une leçon Nourania pour la modifier */
export type LeconAModifier = Pick<Tables<'nourania_lessons'>, 'id' | 'lesson_number' | 'title_french' | 'title_arabic' | 'description'>;

/** Clés react-query qui affichent les leçons Nourania (page élève + gestionnaire admin) */
const CLES_LECONS = [['nourania-lessons'], ['admin-nourania-lessons']] as const;

/**
 * ✏️ Modifier une leçon Nourania (titre, titre arabe, description), directement depuis Nourania (2026-11-21).
 * Même écriture que l'ancien écran « Gérer le contenu » : table nourania_lessons, colonnes title_french, title_arabic, description.
 * Sans réseau : gardé sur l'appareil, envoyé au retour du réseau (et affiché tout de suite sur cet appareil).
 */
export function ModifierLeconDialog({ lecon, onClose }: { lecon: LeconAModifier | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [titre, setTitre] = useState('');
  const [titreArabe, setTitreArabe] = useState('');
  const [description, setDescription] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const refArabe = useRef<HTMLInputElement>(null);
  const refDescription = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!lecon) return;
    setTitre(lecon.title_french || '');
    setTitreArabe(lecon.title_arabic || '');
    setDescription(lecon.description || '');
  }, [lecon]);

  if (!lecon) return null;

  const enregistrer = async () => {
    const values = { title_french: titre.trim(), title_arabic: titreArabe.trim(), description: description.trim() || null };
    if (!values.title_french) { toast.error('Écris un titre pour la leçon'); return; }
    setEnvoi(true);
    try {
      const r = await ecrireOuGarder({ table: 'nourania_lessons', op: 'update', id: lecon.id, values });
      // Affiché tout de suite sur cet appareil (même sans réseau), puis relu depuis la base
      CLES_LECONS.forEach((cle) => {
        queryClient.setQueryData<Tables<'nourania_lessons'>[]>([...cle], (liste) => liste?.map((l) => (l.id === lecon.id ? { ...l, ...values } : l)));
        void queryClient.invalidateQueries({ queryKey: [...cle] });
      });
      if (r === 'en_attente') toast.info('📡 Gardé sur cet appareil, envoyé au retour du réseau');
      else toast.success(`✏️ Leçon ${lecon.lesson_number} modifiée`);
      onClose();
    } catch (e) {
      toast.error('Erreur : ' + (e as Error).message);
    } finally { setEnvoi(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto" level="nested">
        <DialogTitle>✏️ Modifier la leçon {lecon.lesson_number}</DialogTitle>
        <DialogDescription>Le changement se voit chez tous les élèves.</DialogDescription>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="lecon-titre">Titre (français)</Label>
            <Input id="lecon-titre" value={titre} autoFocus onChange={(e) => setTitre(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); refArabe.current?.focus(); } }} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lecon-titre-arabe">Titre (arabe)</Label>
            <Input id="lecon-titre-arabe" ref={refArabe} value={titreArabe} dir="rtl" className="font-arabic text-right"
              onChange={(e) => setTitreArabe(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); refDescription.current?.focus(); } }} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lecon-description">Description</Label>
            <TextareaDictee id="lecon-description" ref={refDescription} value={description} rows={4}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void enregistrer(); } }} />
            <p className="text-[11px] text-muted-foreground">Entrée = enregistrer · Maj + Entrée = aller à la ligne</p>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button className="flex-1" disabled={envoi} onClick={() => void enregistrer()}>{envoi ? '⏳ …' : '✅ Enregistrer'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Petit bouton ✏️ « Modifier la leçon » (réservé à l'enseignante : à n'afficher que pour l'admin) */
export function BoutonModifierLecon({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button type="button" aria-label="Modifier la leçon" title="Modifier la leçon"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground', className)}>
      <Pencil className="h-4 w-4" />
    </button>
  );
}
