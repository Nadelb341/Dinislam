import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import { Cadreur } from '@/components/shared/Cadreur';
import { ImageCadree } from '@/components/shared/ImageCadree';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { compressPhoto } from '@/lib/compressImage';
import { moveToTrash } from '@/lib/trash';
import { horsLigne } from '@/lib/alphabetMedias';
import { errorMessage } from '@/lib/utils';

/**
 * ✏️ « Modifier la carte » (menu ⋮ de l'accueil, Nadia 2026-11-21, proposition 1 du crayon) : titre, titre arabe,
 * petite phrase et image de la carte (avec 📐 cadrage). La barre du haut de la page suit le titre (useTitreCarte).
 * Une image remplacée ou retirée va dans la corbeille (type « carte_image ») : rien n'est perdu.
 */
export interface CarteAModifier {
  id: string; title: string; title_arabic: string | null; description: string | null; image_url: string | null; image_cadrage?: unknown;
}

export function ModifierCarteDialog({ carte, onClose }: { carte: CarteAModifier | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [titre, setTitre] = useState('');
  const [arabe, setArabe] = useState('');
  const [phrase, setPhrase] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cadrer, setCadrer] = useState(false);
  const [retirer, setRetirer] = useState(false);
  const fichier = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!carte) return;
    setTitre(carte.title); setArabe(carte.title_arabic ?? ''); setPhrase(carte.description ?? ''); setImage(carte.image_url);
  }, [carte]);

  const rafraichir = () => { for (const k of ['learning-modules', 'admin-learning-modules', 'cartes-acces']) void queryClient.invalidateQueries({ queryKey: [k] }); };

  // L'ancienne image part dans la corbeille avant d'être remplacée ou retirée
  const ancienneImageALaCorbeille = async () => {
    if (!carte?.image_url || !user) return true;
    return moveToTrash(user.id, 'carte_image', carte.id, `Image de la carte « ${carte.title} »`,
      { module_id: carte.id, image_url: carte.image_url, image_cadrage: carte.image_cadrage ?? null });
  };

  const envoyerImage = async (f: File) => {
    if (!carte) return;
    if (horsLigne()) { toast.error('📡 Nécessite Internet pour envoyer une image'); return; }
    setEnvoi(true);
    try {
      const pret = await compressPhoto(f);
      const ext = (pret.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `cartes/${carte.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('module-cards').upload(path, pret, { cacheControl: '31536000', upsert: false });
      if (error) throw error;
      const url = supabase.storage.from('module-cards').getPublicUrl(path).data.publicUrl;
      if (!(await ancienneImageALaCorbeille())) throw new Error('L\'ancienne image n\'a pas pu aller dans la corbeille : rien n\'est changé');
      const { error: e2 } = await supabase.from('learning_modules').update({ image_url: url, image_cadrage: null } as never).eq('id', carte.id);
      if (e2) throw e2;
      setImage(url);
      toast.success('🖼️ Image changée');
      rafraichir();
    } catch (e) { toast.error(errorMessage(e)); } finally { setEnvoi(false); }
  };

  const retirerImage = async () => {
    if (!carte) return;
    try {
      if (!(await ancienneImageALaCorbeille())) throw new Error('Corbeille indisponible : rien n\'est retiré');
      const { error } = await supabase.from('learning_modules').update({ image_url: null, image_cadrage: null } as never).eq('id', carte.id);
      if (error) throw error;
      setImage(null);
      toast.success('🗑️ Image dans la corbeille (Paramètres)');
      rafraichir();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const enregistrer = async () => {
    if (!carte) return;
    if (!titre.trim()) { toast.error('Le titre ne peut pas être vide'); return; }
    setSaving(true);
    const valeurs = { title: titre.trim(), title_arabic: arabe.trim() || null, description: phrase.trim() || null };
    // Affiché tout de suite (même sans réseau)
    queryClient.setQueriesData<{ id: string }[]>({ queryKey: ['learning-modules'] }, (old) => Array.isArray(old) ? old.map((m) => (m.id === carte.id ? { ...m, ...valeurs } : m)) : old);
    try {
      const r = await ecrireOuGarder({ table: 'learning_modules', op: 'update', id: carte.id, values: valeurs });
      toast.success(r === 'en_attente' ? '📡 Gardé sur cet appareil, envoyé au retour du réseau' : '✏️ Carte modifiée');
      rafraichir();
      onClose();
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };

  return (
    <Dialog open={!!carte} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>✏️ Modifier la carte</DialogTitle>
          <DialogDescription>Le titre change aussi en haut de la page de la carte.</DialogDescription>
        </DialogHeader>
        <label className="text-xs font-semibold" htmlFor="carte-titre">Titre</label>
        <Input id="carte-titre" value={titre} maxLength={50} onChange={(e) => setTitre(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('carte-arabe')?.focus(); } }} />
        <label className="text-xs font-semibold" htmlFor="carte-arabe">Titre en arabe (facultatif)</label>
        <Input id="carte-arabe" dir="rtl" className="font-arabic text-lg" value={arabe} maxLength={60} onChange={(e) => setArabe(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('carte-phrase')?.focus(); } }} />
        <label className="text-xs font-semibold" htmlFor="carte-phrase">Petite phrase sous le titre (facultatif)</label>
        <TextareaDictee id="carte-phrase" rows={2} maxLength={120} value={phrase} onChange={(e) => setPhrase(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void enregistrer(); } }} />

        <p className="text-xs font-semibold">Image de la carte</p>
        <div className="flex items-center gap-3">
          {image
            ? <ImageCadree src={image} alt={titre} cadrages={carte?.image_cadrage} emplacement="carte" className="w-14 h-14 rounded-2xl shadow" />
            : <div className="w-14 h-14 rounded-2xl bg-muted grid place-items-center text-xs text-muted-foreground">Emoji</div>}
          <div className="flex flex-wrap gap-1.5">
            <Button type="button" size="sm" variant="outline" disabled={envoi} onClick={() => fichier.current?.click()}>{envoi ? 'Envoi…' : image ? '🔁 Changer' : '🖼️ Ajouter'}</Button>
            {image && <Button type="button" size="sm" variant="outline" onClick={() => setCadrer(true)}>📐 Cadrer</Button>}
            {image && <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={() => setRetirer(true)}>🗑️</Button>}
          </div>
          <input ref={fichier} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void envoyerImage(f); }} />
        </div>

        <Button type="button" disabled={saving} onClick={() => void enregistrer()}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>

        {cadrer && carte && image && (
          <Cadreur open onClose={() => setCadrer(false)} src={image} table="learning_modules" id={carte.id} valeur={carte.image_cadrage}
            emplacements={[{ cle: 'carte', nom: 'Carte de l\'accueil', classeCadre: 'w-28 h-28 rounded-3xl' }]} onEnregistre={rafraichir} />
        )}
        <ConfirmDeleteDialog open={retirer} onOpenChange={setRetirer} onConfirm={() => { setRetirer(false); void retirerImage(); }}
          title="Retirer l'image de la carte ?" description="Elle ira dans la corbeille de Paramètres ; la carte reprend son emoji." />
      </DialogContent>
    </Dialog>
  );
}
