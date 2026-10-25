/**
 * AdminAllahNamesManager — Gestion admin des 99 Noms d'Allah
 * Design: Bleu profond & Ambre/Doré — selon capture
 */
import { DraftDot } from '@/components/shared/DraftDot';
import { editDraftKey } from '@/lib/pendingDrafts';
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCreationDraft, useEditDraft, useEditDraftResume } from '@/hooks/useCreationDraft';
import { DraftRestoredBanner } from '@/components/shared/DraftRestoredBanner';
import { trashThenDelete } from '@/lib/trash';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import {
  Pencil, Trash2, ArrowLeft, Loader2, Image as ImageIcon,
  Play, Music, FileText, ChevronDown, ChevronUp, Upload, Plus, type LucideIcon } from 'lucide-react';
import AdminUnlockAllDialog from '@/components/admin/AdminUnlockAllDialog';
import { AdminNameVoiceRecorder } from '@/components/admin/AdminNameVoiceRecorder';
import { SortableCardList } from '@/components/shared/SortableCardList';
import { compressDocument } from '@/lib/compressImage';
import { errorMessage } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

interface Props { onBack: () => void; }

const AdminAllahNamesManager = ({ onBack }: Props) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editingName, setEditingName] = useState<Tables<'allah_names'> | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState<{ nameId: number; type: string } | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<{ id: string; file_name: string | null } | null>(null);

  const [formNameAr, setFormNameAr] = useState('');
  const [formNameFr, setFormNameFr] = useState('');
  const [formTranslit, setFormTranslit] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const draft = useCreationDraft('dinislam_allah_name', {
    active: formOpen && !editingName,
    value: { nameAr: formNameAr, nameFr: formNameFr, translit: formTranslit, explanation: formExplanation },
    isEmpty: (v) => !v.nameAr.trim() && !v.nameFr.trim() && !v.translit.trim() && !v.explanation.trim(),
    restore: (v) => { setEditingName(null); setFormNameAr(v.nameAr); setFormNameFr(v.nameFr); setFormTranslit(v.translit); setFormExplanation(v.explanation); setFormOpen(true); },
  });
  // Modification pas enregistrée d'un nom existant : gardée comme brouillon (2026-10-19)
  const nameFields = (n: Tables<'allah_names'> | null) => n && ({ nameAr: n.name_arabic || '', nameFr: n.name_french || '', translit: n.transliteration || '', explanation: n.explanation || '' });
  const editDraft = useEditDraft('dinislam_allah_name', editingName?.id, {
    active: formOpen,
    value: { nameAr: formNameAr, nameFr: formNameFr, translit: formTranslit, explanation: formExplanation },
    original: nameFields(editingName),
    restore: (v) => { setFormNameAr(v.nameAr); setFormNameFr(v.nameFr); setFormTranslit(v.translit); setFormExplanation(v.explanation); },
  });

  const { data: names = [], isLoading } = useQuery({
    queryKey: ['admin-allah-names'],
    queryFn: async () => {
      const { data, error } = await supabase.from('allah_names').select('*').order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allMedia = [] } = useQuery({
    queryKey: ['admin-allah-name-media'],
    queryFn: async () => {
      const { data, error } = await supabase.from('allah_name_media').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Même chose ouverte sur un autre appareil : mise à jour en direct (2026-10-25)
  useEffect(() => {
    const channel = supabase
      .channel('admin-allah-names-content')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'allah_name_media' },
        () => queryClient.invalidateQueries({ queryKey: ['admin-allah-name-media'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'allah_names' },
        () => queryClient.invalidateQueries({ queryKey: ['admin-allah-names'] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const getNameMedia = (nameId: number) => allMedia.filter((m) => m.name_id === nameId);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formNameAr.trim() || !formNameFr.trim()) throw new Error('Les noms arabe et français sont requis');
      const payload = {
        name_arabic: formNameAr,
        name_french: formNameFr,
        transliteration: formTranslit || null,
        explanation: formExplanation || null,
      };
      if (editingName) {
        const { error } = await supabase.from('allah_names').update(payload).eq('id', editingName.id);
        if (error) throw error;
      } else {
        const maxOrder = names.reduce((max: number, n) => Math.max(max, n.display_order ?? 0), 0);
        const { error } = await supabase.from('allah_names').insert({ ...payload, display_order: maxOrder + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-allah-names'] });
      queryClient.invalidateQueries({ queryKey: ['allah-names'] });
      toast.success(editingName ? 'Nom modifié ✅' : 'Nom ajouté ✅');
      if (editingName) editDraft.done(); else draft.done();
      setFormOpen(false);
      setEditingName(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // Les 99 noms ne se suppriment jamais : ils sont dans l'ordre (décision de Nadia, 2026-10-19)

  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const media = allMedia.find((m) => m.id === mediaId);
      if (!media || !user?.id) throw new Error('Média introuvable');
      // Corbeille d'abord, fichier gardé : on peut toujours le restaurer (2026-10-19)
      await trashThenDelete({ userId: user.id, type: 'allah_name_media', id: mediaId, label: media.file_name || 'Média', data: media,
        remove: () => supabase.from('allah_name_media').delete().eq('id', mediaId) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-allah-name-media'] });
      toast.success('Média mis dans la corbeille (Paramètres)');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const reorderMutation = useMutation({
    // display_order est affiché tel quel à l'écran (#1, #2...) — on garde une numérotation
    // continue à partir de 1 (pas le pas de 10 habituel de withResequencedOrder) pour rester cohérent visuellement.
    mutationFn: async (newList: Tables<'allah_names'>[]) => {
      const resequenced = newList.map((n, i) => ({ ...n, display_order: i + 1 }));
      await Promise.all(
        resequenced.map((n) => supabase.from('allah_names').update({ display_order: n.display_order }).eq('id', n.id))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-allah-names'] });
      queryClient.invalidateQueries({ queryKey: ['allah-names'] });
    },
  });

  const handleUploadImage = useCallback(async (nameId: number, file: File) => {
    try {
      const ext = file.name.split('.').pop();
      const path = `allah-names/${nameId}-img.${ext}`;
      const { error: upErr } = await supabase.storage.from('module-cards').upload(path, await compressDocument(file), { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('module-cards').getPublicUrl(path);
      const { error } = await supabase.from('allah_names').update({ image_url: urlData.publicUrl }).eq('id', nameId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-allah-names'] });
      queryClient.invalidateQueries({ queryKey: ['allah-names'] });
      toast.success('Image mise à jour ✅');
    } catch (e) { toast.error(errorMessage(e)); }
  }, [queryClient]);

  const handleUploadMedia = useCallback(async (nameId: number, type: 'video' | 'audio' | 'pdf', file: File) => {
    setUploadingMedia({ nameId, type });
    try {
      const ext = file.name.split('.').pop();
      // Nom de fichier unique : l'ancien fichier n'est jamais écrasé, il reste restaurable depuis la corbeille (2026-10-19)
      const path = `allah-names/${nameId}-${type}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('module-cards').upload(path, await compressDocument(file));
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('module-cards').getPublicUrl(path);
      const { error } = await supabase.from('allah_name_media').insert({
        name_id: nameId,
        media_type: type,
        file_url: urlData.publicUrl,
        file_name: file.name,
      });
      if (error) throw error;
      // Le nouveau est en place : l'ancien part dans la corbeille
      const olds = allMedia.filter((m) => m.name_id === nameId && m.media_type === type);
      for (const old of olds) {
        if (!user?.id) break;
        await trashThenDelete({ userId: user.id, type: 'allah_name_media', id: old.id, label: `${old.file_name || 'Média'} (remplacé)`, data: old,
          remove: () => supabase.from('allah_name_media').delete().eq('id', old.id) });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-allah-name-media'] });
      queryClient.invalidateQueries({ queryKey: ['allah-name-media', nameId] });
      toast.success(`${type === 'video' ? 'Vidéo' : type === 'audio' ? 'Audio' : 'PDF'} mis à jour ✅`);
    } catch (e) { toast.error(errorMessage(e)); }
    finally { setUploadingMedia(null); }
  }, [queryClient, allMedia, user]);

  useEditDraftResume('dinislam_allah_name', names, (n) => openEdit(n));

  const openAdd = () => {
    setEditingName(null);
    setFormNameAr(''); setFormNameFr(''); setFormTranslit(''); setFormExplanation('');
    setFormOpen(true);
  };

  const openEdit = (name: Tables<'allah_names'>) => {
    setEditingName(name);
    setFormNameAr(name.name_arabic || '');
    setFormNameFr(name.name_french || '');
    setFormTranslit(name.transliteration || '');
    setFormExplanation(name.explanation || '');
    setFormOpen(true);
  };

  const MediaUploadRow = ({ nameId, type, label, icon: Icon }: { nameId: number; type: 'video' | 'audio' | 'pdf'; label: string; icon: LucideIcon }) => {
    const existing = getNameMedia(nameId).find((m) => m.media_type === type);
    const isUploading = uploadingMedia?.nameId === nameId && uploadingMedia?.type === type;
    return (
      <div className="flex items-center gap-3 py-1.5">
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'rgba(217, 119, 6, 0.15)' }}>
          <Icon className="h-3 w-3" style={{ color: 'hsl(38 92% 50%)' }} />
        </div>
        <span className="text-xs font-medium w-10 shrink-0" style={{ color: 'hsl(220 30% 40%)' }}>{label}</span>
        {existing ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-xs truncate flex-1" style={{ color: 'hsl(220 30% 30%)' }}>{existing.file_name}</span>
            <label className="cursor-pointer">
              <input type="file" accept={type === 'video' ? 'video/*' : type === 'audio' ? 'audio/*' : '.pdf'} className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadMedia(nameId, type, f); e.target.value = ''; }}
              />
              <span className="text-[10px] underline" style={{ color: 'hsl(220 70% 45%)' }}>Remplacer</span>
            </label>
            <button onClick={() => setMediaToDelete(existing)} className="text-destructive hover:text-destructive/80" aria-label="Supprimer ce média">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <label className="flex-1 cursor-pointer">
            <input type="file" accept={type === 'video' ? 'video/*' : type === 'audio' ? 'audio/*' : '.pdf'} className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadMedia(nameId, type, f); e.target.value = ''; }}
            />
            <span className={`flex items-center gap-1 text-xs ${isUploading ? 'opacity-60' : ''}`}
              style={{ color: 'hsl(220 70% 45%)' }}>
              {isUploading ? <><Loader2 className="h-3 w-3 animate-spin" /> Envoi…</> : <><Upload className="h-3 w-3" /> Ajouter</>}
            </span>
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: 'hsl(220 70% 45%)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <div className="flex items-center gap-2">
          <AdminUnlockAllDialog moduleType="allah-names" />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{ background: 'hsl(220 70% 45%)' }}
          >
            <Plus className="h-4 w-4" /> Ajouter un nom <DraftDot draftKey="dinislam_allah_name" />
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold" style={{ color: 'hsl(220 70% 25%)' }}>99 Noms d'Allah</h2>
        <p className="text-sm" style={{ color: 'hsl(220 20% 55%)' }}>
          {names.length} noms • Glissez pour réordonner
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-2">
          <SortableCardList
            items={names}
            onReorder={(newList) => reorderMutation.mutate(newList)}
            renderItem={(name, { ref, style, isDragging, ...dragAttrs }) => (
                <div
                  key={name.id}
                  ref={ref}
                  style={style}
                  {...dragAttrs}
                  className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${isDragging ? 'opacity-60' : ''}`}
                >
                    <div className="flex items-center gap-3 p-3">
                      {/* Amber number badge with optional image */}
                      <div className="relative shrink-0">
                        {name.image_url ? (
                          <img src={name.image_url} alt={name.name_french} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                            style={{ background: 'linear-gradient(135deg, hsl(38 92% 50%), hsl(32 98% 44%))' }}
                          >
                            {name.display_order}
                          </div>
                        )}
                        {/* Image upload overlay */}
                        <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 rounded-xl opacity-0 hover:opacity-100 transition-opacity" onPointerDown={(e) => e.stopPropagation()}>
                          <input type="file" accept="image/*" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadImage(name.id, f); e.target.value = ''; }}
                          />
                          <ImageIcon className="h-4 w-4 text-white" />
                        </label>
                      </div>

                      {/* Name info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium" style={{ color: 'hsl(220 20% 55%)' }}>
                            #{name.display_order}
                          </span>
                          <span className="font-arabic text-base font-bold" style={{ color: 'hsl(220 70% 25%)' }}>
                            {name.name_arabic}
                          </span>
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'hsl(220 40% 35%)' }}>{name.name_french}</p>
                        {name.transliteration && (
                          <p className="text-xs italic" style={{ color: 'hsl(220 20% 55%)' }}>{name.transliteration}</p>
                        )}
                        {/* Media badges */}
                        {getNameMedia(name.id).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {/* « ta voix » : audio enregistré par l'enseignante (les audios importés s'appellent « Prononciation … »), 2026-10-23 */}
                            {getNameMedia(name.id).some((m) => m.media_type === 'audio' && !(m.file_name || '').startsWith('Prononciation ')) && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                                style={{ background: 'linear-gradient(135deg, hsl(38 92% 50%), hsl(32 98% 44%))', color: 'white' }}>
                                🎙️ ta voix
                              </span>
                            )}
                            {getNameMedia(name.id).map((m) => (
                              <span
                                key={m.id}
                                className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: 'rgba(217,119,6,0.12)', color: 'hsl(38 92% 35%)' }}
                              >
                                {m.media_type}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEdit(name)}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center relative transition-colors hover:bg-blue-50"
                          style={{ borderColor: 'hsl(220 20% 85%)', color: 'hsl(220 30% 50%)' }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <DraftDot draftKey={editDraftKey('dinislam_allah_name', name.id)} tiny className="absolute -top-1 -right-1 text-[10px]" />
                        </button>
                        <button
                          onClick={() => setExpandedId(expandedId === name.id ? null : name.id)}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors hover:bg-blue-50"
                          style={{ borderColor: 'hsl(220 20% 85%)', color: 'hsl(220 30% 50%)' }}
                        >
                          {expandedId === name.id
                            ? <ChevronUp className="h-3.5 w-3.5" />
                            : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded media section */}
                    {expandedId === name.id && (
                      <div
                        className="px-4 pb-3 pt-2 border-t"
                        style={{ borderColor: 'hsl(220 20% 92%)', background: 'hsl(220 30% 98%)' }}
                      >
                        <p className="text-xs font-bold mb-2" style={{ color: 'hsl(220 70% 30%)' }}>
                          Médias associés
                        </p>
                        <MediaUploadRow nameId={name.id} type="video" label="Vidéo" icon={Play} />
                        <MediaUploadRow nameId={name.id} type="audio" label="Audio" icon={Music} />
                        {/* Hors de MediaUploadRow (recréé à chaque affichage) pour ne pas perdre l'enregistrement en cours */}
                        <div onPointerDown={(e) => e.stopPropagation()}>
                        <AdminNameVoiceRecorder
                          nameLabel={`n°${name.display_order} ${name.transliteration || name.name_french}`}
                          hasAudio={getNameMedia(name.id).some((m) => m.media_type === 'audio')}
                          onSave={(file) => handleUploadMedia(name.id, 'audio', file)}
                        />
                        </div>
                        <MediaUploadRow nameId={name.id} type="pdf" label="PDF" icon={FileText} />
                      </div>
                    )}
                </div>
            )}
          />
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingName(null); }}>
        <DialogContent className="max-w-md" level="nested">
          <DialogHeader>
            <DialogTitle style={{ color: 'hsl(220 70% 25%)' }}>
              {editingName ? 'Modifier le nom' : 'Nouveau nom'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingName && <DraftRestoredBanner draft={draft} onCleared={() => { setFormNameAr(''); setFormNameFr(''); setFormTranslit(''); setFormExplanation(''); }} />}
            {editingName && <DraftRestoredBanner draft={editDraft} onCleared={() => openEdit(editingName)} />}
            <div>
              <Label>Nom en arabe *</Label>
              <Input value={formNameAr} onChange={(e) => setFormNameAr(e.target.value)} className="font-arabic text-right text-lg" dir="rtl" />
            </div>
            <div>
              <Label>Nom en français *</Label>
              <Input value={formNameFr} onChange={(e) => setFormNameFr(e.target.value)} />
            </div>
            <div>
              <Label>Translittération (phonétique)</Label>
              <Input value={formTranslit} onChange={(e) => setFormTranslit(e.target.value)} placeholder="Ex: Ar-Rahmân" />
            </div>
            <div>
              <Label>Explication</Label>
              <Textarea value={formExplanation} onChange={(e) => setFormExplanation(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setFormOpen(false); setEditingName(null); }}>Annuler</Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                style={{ background: 'hsl(220 70% 45%)' }}
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingName ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!mediaToDelete}
        onOpenChange={(o) => { if (!o) setMediaToDelete(null); }}
        onConfirm={() => { if (mediaToDelete) deleteMediaMutation.mutate(mediaToDelete.id); setMediaToDelete(null); }}
        title="Supprimer ce média ?"
        description={mediaToDelete ? `« ${mediaToDelete.file_name || 'Média'} » ira dans la corbeille (Paramètres), d'où tu pourras le restaurer.` : ''}
      />
    </div>
  );
};

export default AdminAllahNamesManager;
