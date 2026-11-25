import { untypedDb } from '@/lib/untypedDb';
import { prevenirNouveauContenu } from '@/lib/notifNouveauContenu';
import { errorMessage } from '@/lib/utils';
import { collectChildren, trashThenDelete } from '@/lib/trash';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableCardList, type DragItemProps } from '@/components/shared/SortableCardList';
import { ZonesContenu } from '@/components/shared/ZonesContenu';
import { LecteurVideo } from '@/components/video/LecteurVideo';
import { ImageCadree } from '@/components/shared/ImageCadree';
import { Cadreur } from '@/components/shared/Cadreur';
import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useOpenItemFromUrl, MISSING_ITEM_MESSAGE } from '@/hooks/useOpenItemFromUrl';
import { Plus, Trash2, Upload, Edit2, Eye, Download, FileText, Play, Music, Image, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { compressDocument } from '@/lib/compressImage';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

const GROUPS = [
  { key: 'petits', label: 'Petits', labelAr: 'الصغار' },
  { key: 'jeunes', label: 'Jeunes', labelAr: 'الشباب' },
  { key: 'adultes', label: 'Adultes', labelAr: 'الكبار' },
];

const getContentIcon = (type: string) => {
  if (type.includes('video')) return <Play className="h-4 w-4" />;
  if (type.includes('audio')) return <Music className="h-4 w-4" />;
  if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
  if (type.includes('image')) return <Image className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
};

const calculateAge = (dateOfBirth: string | null): number | null => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
};

const getGroupForAge = (age: number | null): string | null => {
  if (age === null) return null;
  if (age <= 6) return 'petits';
  if (age <= 10) return 'jeunes';
  return 'adultes';
};

const getGroupLabel = (key: string): string => {
  return GROUPS.find(g => g.key === key)?.label || key;
};

const PrayerModuleCards = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<Tables<'prayer_cards'> | null>(null);
  const [editingCard, setEditingCard] = useState<Tables<'prayer_cards'> | null>(null);
  const [aCadrer, setACadrer] = useState<Tables<'prayer_cards'> | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteContentId, setDeleteContentId] = useState<string | null>(null);
  const [renommage, setRenommage] = useState<{ id: string; nom: string } | null>(null);
  const [supprimerCarteOuverte, setSupprimerCarteOuverte] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile for age/prayer_group
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-prayer', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('date_of_birth, prayer_group')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as { date_of_birth: string | null; prayer_group: string | null } | null;
    },
    enabled: !!user?.id,
  });

  // Determine which group(s) to show
  const allowedGroup = useMemo(() => {
    if (isAdmin) return null; // admin sees all
    if (!userProfile) return null;
    // Manual override takes priority
    if (userProfile.prayer_group) return userProfile.prayer_group;
    // Calculate from age
    const age = calculateAge(userProfile.date_of_birth);
    return getGroupForAge(age);
  }, [isAdmin, userProfile]);

  const visibleGroups = useMemo(() => {
    if (isAdmin || !allowedGroup) return GROUPS;
    return GROUPS.filter(g => g.key === allowedGroup);
  }, [isAdmin, allowedGroup]);

  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Set initial active group when visibleGroups change
  const effectiveActiveGroup = activeGroup && visibleGroups.some(g => g.key === activeGroup)
    ? activeGroup
    : visibleGroups[0]?.key || 'petits';

  const { data: cards = [], isFetched: cardsFetched } = useQuery({
    queryKey: ['prayer-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prayer_cards')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: cardContent = [] } = useQuery({
    queryKey: ['prayer-card-content', selectedCard?.id],
    queryFn: async () => {
      if (!selectedCard?.id) return [];
      const { data, error } = await supabase
        .from('prayer_card_content')
        .select('*')
        .eq('card_id', selectedCard.id)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCard?.id,
  });

  // 🗂️ Sous-cartes (Nadia, 2026-11-25 : LODO › Introduction, Affaires à avoir, 1…11) : une carte avec parent_id vit DANS sa carte parente
  const groupCards = cards.filter(c => c.group_key === effectiveActiveGroup && !c.parent_id);
  const sousCartesDe = (id: string | undefined) => (id ? cards.filter((c) => c.parent_id === id) : [])
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const sousCartes = sousCartesDe(selectedCard?.id);
  const carteParente = selectedCard?.parent_id ? cards.find((c) => c.id === selectedCard.parent_id) ?? null : null;
  // La carte ouverte suit la version à jour (titre modifié, image…) — en direct
  const carteOuverte = selectedCard ? cards.find((c) => c.id === selectedCard.id) ?? selectedCard : null;

  // « Commencer mon travail » d'un devoir : /priere?item=<id de la carte> → la carte s'ouvre (une fois).
  // Pas de verrou ici : la carte s'ouvre même si elle est rangée dans un autre groupe d'âge.
  useOpenItemFromUrl(cardsFetched, (item) => {
    const card = cards.find((c) => c.id === item.trim());
    if (!card) { toast.info(MISSING_ITEM_MESSAGE); return; }
    if (visibleGroups.some((g) => g.key === card.group_key)) setActiveGroup(card.group_key);
    setSelectedCard(card);
  });

  const uploadContentMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedCard?.id || !user?.id) throw new Error('Missing data');
      const ext = file.name.split('.').pop();
      const path = `${selectedCard.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('prayer-cards').upload(path, await compressDocument(file));
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('prayer-cards').getPublicUrl(path);
      const maxOrder = cardContent.length > 0 ? Math.max(...cardContent.map(c => c.display_order)) : 0;
      const { error } = await supabase.from('prayer_card_content').insert({
        card_id: selectedCard.id, content_type: file.type, file_url: urlData.publicUrl,
        file_name: file.name, display_order: maxOrder + 1, uploaded_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-card-content', selectedCard?.id] }); toast.success('Fichier ajouté !');
      void prevenirNouveauContenu({ carte: { chemin: '/priere' }, quoi: `${selectedCard?.title || 'Une carte'} : un nouveau contenu` });
    },
    onError: () => toast.error('Erreur lors de l\'upload'),
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const content = cardContent.find((c) => c.id === contentId);
      if (!content || !user?.id) throw new Error('Contenu introuvable');
      await trashThenDelete({ userId: user.id, type: 'prayer_card_content', id: contentId, label: content.file_name || 'Contenu', data: content,
        remove: () => supabase.from('prayer_card_content').delete().eq('id', contentId) });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['prayer-card-content', selectedCard?.id] }); toast.success('Contenu supprimé'); },
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, title, image_url }: { id: string; title?: string; image_url?: string }) => {
      // prayer_cards n'a pas de colonne updated_at : l'envoyer faisait échouer toute modification (corrigé le 2026-10-01)
      const updates: TablesUpdate<'prayer_cards'> = {};
      if (title !== undefined) updates.title = title;
      if (image_url !== undefined) updates.image_url = image_url;
      const { error } = await supabase.from('prayer_cards').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['prayer-cards'] }); setEditingCard(null); toast.success('Carte mise à jour'); },
  });

  const uploadCardImage = async (file: File, cardId: string) => {
    const ext = file.name.split('.').pop();
    const path = `card-images/${cardId}.${ext}`;
    await supabase.storage.from('prayer-cards').upload(path, await compressDocument(file), { upsert: true });
    const { data } = supabase.storage.from('prayer-cards').getPublicUrl(path);
    updateCardMutation.mutate({ id: cardId, image_url: data.publicUrl });
  };

  const rangerCartes = async (n: Tables<'prayer_cards'>[]) => {
    queryClient.setQueryData<Tables<'prayer_cards'>[]>(['prayer-cards'], (old) => (old || []).map((c) => { const i = n.findIndex((x) => x.id === c.id); return i === -1 ? c : { ...c, display_order: (i + 1) * 10 }; }));
    try {
      for (const [i, c] of n.entries()) await ecrireOuGarder({ table: 'prayer_cards', op: 'update', id: c.id, values: { display_order: (i + 1) * 10 } });
      toast.success('✋ Ordre enregistré (les élèves voient le même)');
    } catch (e) { toast.error(errorMessage(e)); }
    queryClient.invalidateQueries({ queryKey: ['prayer-cards'] });
  };

  // ➕ Nouvelle carte : même catégorie et même groupe que ses voisines, placée à la fin ; la fenêtre « Modifier » s'ouvre tout de suite
  // `parent` = la carte dans laquelle on ajoute une SOUS-carte (sinon carte du groupe affiché)
  const nouvelleCarte = async (parent?: Tables<'prayer_cards'>) => {
    const freres = parent ? sousCartesDe(parent.id) : groupCards;
    let categorie = parent?.category_id ?? freres[0]?.category_id ?? cards[0]?.category_id;
    if (!categorie) {
      // Aucune carte encore : on prend la 1re catégorie de la Prière (avant, le ➕ échouait sur une page vide)
      const { data: cat } = await supabase.from('prayer_categories').select('id').order('display_order').limit(1).maybeSingle();
      categorie = cat?.id;
    }
    if (!categorie) { toast.error('📡 Impossible de créer la carte pour l\'instant (réseau ?)'); return; }
    const ordre = Math.max(0, ...freres.map((c) => c.display_order ?? 0)) + 10;
    const titre = parent ? 'Nouvelle sous-carte' : 'Nouvelle carte';
    const { data, error } = await supabase.from('prayer_cards').insert({
      category_id: categorie, group_key: parent?.group_key ?? effectiveActiveGroup, parent_id: parent?.id ?? null,
      title: titre, title_french: titre, title_arabic: '', display_order: ordre,
    }).select('*').single();
    if (error || !data) { toast.error(errorMessage(error)); return; }
    await queryClient.invalidateQueries({ queryKey: ['prayer-cards'] });
    setEditingCard(data); setEditTitle(data.title ?? '');
    toast.success(parent ? '➕ Sous-carte ajoutée : donne-lui un titre et une image' : '➕ Carte ajoutée : donne-lui un titre et une image');
  };

  // 🗑️ Supprimer une carte : elle va dans la corbeille avec ses fichiers, ses zones ET ses sous-cartes (restaurable d'un coup)
  const supprimerCarte = async (card: Tables<'prayer_cards'>) => {
    if (!user) return;
    try {
      // Toute la descendance (sous-cartes, et leurs propres sous-cartes)
      const descendants: Tables<'prayer_cards'>[] = [];
      let niveau = [card.id];
      while (niveau.length) {
        const enfants = cards.filter((c) => c.parent_id && niveau.includes(c.parent_id));
        descendants.push(...enfants);
        niveau = enfants.map((c) => c.id);
      }
      const ids = [card.id, ...descendants.map((c) => c.id)];
      const cibles = ids.map((id) => `priere:${id}`);
      const fichiers = await collectChildren('prayer_card_content', 'card_id', ids);
      const zones = await collectChildren('zones_contenu', 'cible', cibles);
      // Ordre de restauration : sous-cartes d'abord (parents avant enfants), puis fichiers et zones
      await trashThenDelete({ userId: user.id, type: 'prayer_card', id: card.id, label: `${card.title || 'Carte'} (Prière)`, data: card,
        children: [{ table: 'prayer_cards', rows: descendants as unknown as Record<string, unknown>[] }, fichiers, zones],
        remove: async () => {
          if (zones.rows.length) { const z = await untypedDb.from('zones_contenu').delete().in('cible', cibles); if (z.error) return z; }
          return supabase.from('prayer_cards').delete().eq('id', card.id);
        } });
      setEditingCard(null);
      if (selectedCard && ids.includes(selectedCard.id)) setSelectedCard(carteParente && !ids.includes(carteParente.id) ? carteParente : null);
      queryClient.invalidateQueries({ queryKey: ['prayer-cards'] });
      toast.success(descendants.length ? `🗑️ Carte et ses ${descendants.length} sous-cartes dans la corbeille (Paramètres)` : '🗑️ Carte dans la corbeille (Paramètres)');
    } catch (e) { toast.error(errorMessage(e)); }
  };

  // ✏️ Renommer un fichier d'une carte
  const renommerFichier = async (id: string, nom: string) => {
    if (!nom.trim()) return;
    try {
      const r = await ecrireOuGarder({ table: 'prayer_card_content', op: 'update', id, values: { file_name: nom.trim() } });
      toast.success(r === 'en_attente' ? '📡 Gardé, envoyé au retour du réseau' : 'Renommé ✅');
      queryClient.invalidateQueries({ queryKey: ['prayer-card-content', selectedCard?.id] });
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const handleViewContent = (url: string) => window.open(url, '_blank');
  const handleDownloadContent = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = filename; a.click();
      URL.revokeObjectURL(blobUrl);
    } catch { toast.error('Erreur de téléchargement'); }
  };

  // Une tuile de carte (grille du groupe ET grille des sous-cartes) — ✋ enseignante : appui long + glisser pour ranger
  const tuile = (card: Tables<'prayer_cards'>, index: number, drag?: DragItemProps) => {
    const { ref, style, isDragging, ...attrs } = drag ?? ({} as Partial<DragItemProps>);
    const nbSous = sousCartesDe(card.id).length;
    return (
      <div
        key={card.id}
        ref={ref} {...attrs}
        className={cn('module-card rounded-xl overflow-hidden cursor-pointer hover:shadow-elevated transition-all animate-slide-up touch-manipulation', isDragging && 'opacity-50')}
        style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both', ...style }}
        onClick={() => setSelectedCard(card)}
      >
        {card.image_url ? (
          <div className="aspect-[4/3] bg-white">
            <ImageCadree src={card.image_url} alt={card.title ?? ''} cadrages={card.image_cadrage} emplacement="carte" className="w-full h-full" />
          </div>
        ) : (
          <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <FileText className="h-8 w-8 text-primary/40" />
          </div>
        )}
        <div className="p-2.5 space-y-0.5">
          <p className="text-xs font-semibold text-foreground [overflow-wrap:anywhere] leading-tight">{card.title || card.title_arabic || 'Sans titre'}</p>
          {nbSous > 0 && <p className="text-[11px] text-muted-foreground">🗂️ {nbSous} parties</p>}
        </div>
        {isAdmin && (
          <div className="flex justify-center gap-1 pb-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setEditingCard(card); setEditTitle(card.title ?? ''); }} aria-label="Modifier la carte" className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground"><Edit2 className="h-3 w-3 inline" /></button>
            {card.image_url && <button onClick={() => setACadrer(card)} aria-label="Cadrer la photo" className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground">📐</button>}
          </div>
        )}
      </div>
    );
  };

  const grille = (liste: Tables<'prayer_cards'>[]) => isAdmin
    ? <SortableCardList items={liste} strategy={rectSortingStrategy} onReorder={(n) => void rangerCartes(n)} renderItem={(c, d) => tuile(c, liste.indexOf(c), d)} />
    : liste.map((c, i) => tuile(c, i));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Modules de prière</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Group tabs */}
      <div className="flex gap-2">
        {visibleGroups.map(g => (
          <button
            key={g.key}
            onClick={() => setActiveGroup(g.key)}
            className={cn(
              'flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all',
              effectiveActiveGroup === g.key
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Age group message for non-admin */}
      {!isAdmin && allowedGroup && (
        <p className="text-center text-sm text-muted-foreground">
          Ton espace <span className="font-semibold text-foreground">{getGroupLabel(allowedGroup)}</span> 🌟
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {grille([...groupCards].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)))}
        {/* ➕ Nouvelle carte, pré-remplie d'après les cartes voisines du même groupe (2026-11-21) */}
        {isAdmin && (
          <button type="button" onClick={() => void nouvelleCarte()}
            className="rounded-xl border-2 border-dashed border-primary/50 text-primary font-bold text-sm min-h-[120px] grid place-items-center hover:bg-primary/5">
            ➕ Nouvelle carte
          </button>
        )}
      </div>

      {/* 📐 Cadrer la photo d'une carte (2026-11-18) */}
      {aCadrer?.image_url && (
        <Cadreur open onClose={() => setACadrer(null)} src={aCadrer.image_url} table="prayer_cards" id={aCadrer.id} valeur={aCadrer.image_cadrage}
          emplacements={[{ cle: 'carte', nom: 'Carte', classeCadre: 'w-56 max-w-full aspect-[4/3] rounded-xl' }]}
          onEnregistre={() => queryClient.invalidateQueries({ queryKey: ['prayer-cards'] })} />
      )}

      {/* Fenêtre d'une carte : ses sous-cartes (ex. LODO › 1 - AVOIR L'INTENTION), puis ses zones (fiche, vidéo…) */}
      <Dialog open={!!carteOuverte} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            {carteParente && (
              <button type="button" onClick={() => setSelectedCard(carteParente)}
                className="self-start text-sm font-semibold text-primary hover:underline [overflow-wrap:anywhere] text-left">
                ← {carteParente.title || 'Retour'}
              </button>
            )}
            <DialogTitle className="text-lg pr-8 [overflow-wrap:anywhere]">{carteOuverte?.title}</DialogTitle>
          </DialogHeader>
          {carteOuverte && (sousCartes.length > 0 || isAdmin) && (
            <div className="grid grid-cols-2 gap-3">
              {grille(sousCartes)}
              {isAdmin && (
                <button type="button" onClick={() => void nouvelleCarte(carteOuverte)}
                  className="rounded-xl border-2 border-dashed border-primary/40 text-primary font-semibold text-xs min-h-[80px] grid place-items-center hover:bg-primary/5 px-2">
                  ➕ Nouvelle sous-carte
                </button>
              )}
            </div>
          )}
          {/* ✏️ Zones de contenu (texte, images, vidéos, PDF) — 2026-11-21 */}
          {carteOuverte && <ZonesContenu cible={`priere:${carteOuverte.id}`} isAdmin={isAdmin} libelle={carteOuverte.title ?? 'Prière'}
            vide={sousCartes.length === 0 && cardContent.length === 0 ? '🛠️ En cours de mise à jour pour cette leçon' : undefined} />}
          {isAdmin && (
            <div className="space-y-2">
              <input ref={fileInputRef} type="file" className="hidden" accept="video/*,audio/*,application/pdf,image/*"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadContentMutation.mutate(file); e.target.value = ''; }} />
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploadContentMutation.isPending}>
                <Upload className="h-4 w-4" /> {uploadContentMutation.isPending ? 'Upload en cours...' : 'Ajouter un fichier'}
              </Button>
            </div>
          )}
          {cardContent.length > 0 ? (
            <div className="space-y-3">
              {cardContent.map((item) => (
                <div key={item.id} className="bg-muted/50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getContentIcon(item.content_type)}
                      {renommage?.id === item.id ? (
                        <Input autoFocus value={renommage.nom} className="h-8" aria-label="Nom du fichier"
                          onChange={(e) => setRenommage({ id: item.id, nom: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void renommerFichier(item.id, renommage.nom); setRenommage(null); } if (e.key === 'Escape') setRenommage(null); }}
                          onBlur={() => { void renommerFichier(item.id, renommage.nom); setRenommage(null); }} />
                      ) : <span className="text-sm font-medium [overflow-wrap:anywhere]">{item.file_name}</span>}
                    </div>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Renommer"
                        onClick={() => setRenommage({ id: item.id, nom: item.file_name })}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => setDeleteContentId(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {item.content_type.includes('video') && <LecteurVideo className="rounded-lg" src={item.file_url} />}
                  {item.content_type.includes('audio') && <audio controls className="w-full" src={item.file_url} />}
                  {item.content_type.includes('image') && <img src={item.file_url} alt={item.file_name} className="w-full rounded-lg" />}
                  {(item.content_type.includes('pdf') || item.file_name.endsWith('.pdf')) && <iframe src={item.file_url} className="w-full aspect-[3/4] rounded-lg" />}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => handleViewContent(item.file_url)}><Eye className="h-3 w-3" /> Voir</Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => handleDownloadContent(item.file_url, item.file_name)}><Download className="h-3 w-3" /> Télécharger</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : isAdmin && sousCartes.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground">Ajoute des sous-cartes, un texte, une image, une vidéo ou un PDF.</p>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit card dialog */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCard?.parent_id ? 'Modifier la sous-carte' : 'Modifier la carte'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium">Titre</label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && editingCard) { e.preventDefault(); updateCardMutation.mutate({ id: editingCard.id, title: editTitle }); } }} />
            </div>
            <div>
              <label className="text-sm font-medium">Image de la carte</label>
              <input ref={imageInputRef} type="file" className="hidden" accept="image/*"
                onChange={(e) => { const file = e.target.files?.[0]; if (file && editingCard) uploadCardImage(file, editingCard.id); e.target.value = ''; }} />
              <Button variant="outline" size="sm" className="w-full gap-2 mt-1" onClick={() => imageInputRef.current?.click()}>
                <Image className="h-4 w-4" /> Changer l'image
              </Button>
            </div>
            <Button className="w-full" onClick={() => editingCard && updateCardMutation.mutate({ id: editingCard.id, title: editTitle })} disabled={updateCardMutation.isPending}>
              Enregistrer
            </Button>
            <Button variant="ghost" className="w-full text-destructive" onClick={() => setSupprimerCarteOuverte(true)}>
              🗑️ {editingCard?.parent_id ? 'Supprimer cette sous-carte' : 'Supprimer cette carte'}
            </Button>
            <ConfirmDeleteDialog open={supprimerCarteOuverte} onOpenChange={setSupprimerCarteOuverte}
              onConfirm={() => { setSupprimerCarteOuverte(false); if (editingCard) void supprimerCarte(editingCard); }}
              title={editingCard?.parent_id ? 'Supprimer cette sous-carte ?' : 'Supprimer cette carte ?'}
              description={editingCard && sousCartesDe(editingCard.id).length
                ? `Elle ira dans la corbeille de Paramètres avec ses ${sousCartesDe(editingCard.id).length} sous-cartes, ses fiches et ses vidéos ; tu pourras tout restaurer d'un coup.`
                : 'Elle ira dans la corbeille de Paramètres avec ses fichiers ; tu pourras la restaurer.'} />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteContentId}
        onOpenChange={(open) => !open && setDeleteContentId(null)}
        onConfirm={() => { if (deleteContentId) deleteContentMutation.mutate(deleteContentId); setDeleteContentId(null); }}
        description="Ce fichier ira dans la corbeille de Paramètres."
      />
    </div>
  );
};

export default PrayerModuleCards;
