import { sendPushNotification } from '@/lib/pushHelper';
import { ChoixEleveParGroupe } from '@/components/shared/ChoixEleveParGroupe';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Unlock, Lock, Upload, Trash2, Eye, EyeOff, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { moveToTrash, trashThenDelete } from '@/lib/trash';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import ContentUploadTabs from './ContentUploadTabs';
import ContentItemCard, { ContentType } from './ContentItemCard';
import AdminSourateVersets from './AdminSourateVersets';
import { compressDocument } from '@/lib/compressImage';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

interface SourateAdminCardProps {
  sourate: Tables<'sourates'>;
  sourateContents: Tables<'sourate_content'>[];
  mapContentType: (type: string) => ContentType;
  setDeleteContentId: (id: string | null) => void;
  updateTitleMutation: { mutate: (vars: { id: string; title: string }) => void };
  deleteMutation: { isPending: boolean };
  handleAddYoutube: (id: string, embedUrl: string, targetUserId?: string) => Promise<void>;
  isUploading: boolean;
  profiles: { user_id: string; full_name: string | null; email: string | null }[];
  uploadToStorage: (sourateId: string, file: File, contentType: string, targetUserId?: string) => Promise<void>;
  handleUploadAudioComplet: (sourateId: string, sourateNumber: number, file: File) => Promise<void>;
  handleDeleteAudioComplet: (sourateId: string, filePath: string | null) => Promise<void>;
  chargerSourates: () => void;
}

function SourateAdminCard({ sourate, sourateContents, mapContentType, setDeleteContentId, updateTitleMutation, deleteMutation, uploadToStorage, handleAddYoutube, handleUploadAudioComplet, handleDeleteAudioComplet, chargerSourates, isUploading, profiles }: SourateAdminCardProps) {
  const [lienVideo, setLienVideo] = useState(sourate.video_url || '');
  const [targetStudent, setTargetStudent] = useState<string>('');

  const extraireYoutubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const sauvegarderVideo = async (sourateId: string) => {
    const videoId = extraireYoutubeId(lienVideo);
    if (!videoId && lienVideo) {
      toast.error('Lien YouTube invalide');
      return;
    }
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    const { error } = await supabase.from('sourates').update({ video_url: embedUrl }).eq('id', sourateId);
    if (error) { toast.error('Erreur: ' + error.message); return; }
    toast.success('✅ Vidéo sauvegardée');
    chargerSourates();
  };

  return (
    <Card key={sourate.id}>
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="font-bold">{sourate.number}. {sourate.name_french}</p>
          <p className="text-sm text-muted-foreground font-arabic">{sourate.name_arabic}</p>
        </div>
        {/* Vidéo YouTube */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            🎬 Vidéo de la sourate (YouTube)
          </p>
          <input
            placeholder="https://www.youtube.com/watch?v=..."
            value={lienVideo}
            onChange={e => setLienVideo(e.target.value)}
            className="w-full border rounded-xl p-2 text-sm mb-2 bg-background"
          />
          <button
            onClick={() => sauvegarderVideo(sourate.id)}
            className="w-full py-2 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: '#3b82f6' }}
          >
            💾 Sauvegarder
          </button>
          {sourate.video_url && (
            <button
              onClick={async () => {
                await supabase.from('sourates').update({ video_url: null }).eq('id', sourate.id);
                setLienVideo('');
                chargerSourates();
              }}
              className="w-full py-2 rounded-xl text-sm font-semibold mt-1"
              style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}
            >
              🗑️ Supprimer la vidéo
            </button>
          )}
        </div>
        {/* Audio complet */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            🎵 Audio complet de la sourate
          </p>
          {sourate.audio_complet_url ? (
            <div className="flex items-center gap-2">
              <audio src={sourate.audio_complet_url} controls className="flex-1" style={{ height: '32px' }} />
              <button
                onClick={() => handleDeleteAudioComplet(sourate.id, sourate.audio_complet_path)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#fee2e2' }}
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            </div>
          ) : (
            <div>
              <input
                type="file" accept="audio/*"
                className="hidden"
                id={`audio-complet-${sourate.id}`}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadAudioComplet(sourate.id, sourate.number, file);
                  e.target.value = '';
                }}
              />
              <label htmlFor={`audio-complet-${sourate.id}`}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-white text-sm font-semibold cursor-pointer"
                style={{ backgroundColor: '#3b82f6' }}
              >
                <Upload className="w-4 h-4" />
                Uploader l'audio complet
              </label>
            </div>
          )}
        </div>
        {sourateContents.length > 0 && (
          <div className="space-y-1.5">
            {sourateContents.map((content) => {
              const studentName = content.target_user_id
                ? (profiles || []).find((p) => p.user_id === content.target_user_id)?.full_name || 'Élève'
                : null;
              return (
                <div key={content.id}>
                  <ContentItemCard
                    id={content.id}
                    title={content.file_name}
                    contentType={mapContentType(content.content_type)}
                    url={content.file_url}
                    onDelete={(id: string) => setDeleteContentId(id)}
                    onUpdateTitle={(id: string, title: string) => updateTitleMutation.mutate({ id, title })}
                    deleteDisabled={deleteMutation.isPending}
                  />
                  {studentName && (
                    <div className="flex items-center gap-2 ml-8 mt-0.5 text-xs">
                      <UserCheck className="h-3 w-3 text-blue-500" />
                      <span className="text-blue-600 font-medium">→ {studentName}</span>
                      {content.viewed_at ? (
                        <span className="flex items-center gap-1 text-green-600"><Eye className="h-3 w-3" />Vu</span>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-500"><EyeOff className="h-3 w-3" />Non vu</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {sourateContents.length === 0 && <p className="text-xs text-muted-foreground italic">Aucun contenu</p>}
        <AdminSourateVersets sourate={sourate} />
        {/* Student selector for targeted upload */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">
            📩 Destinataire du prochain contenu
          </p>
          <select
            className="w-full p-2 border rounded-lg bg-background text-foreground text-sm"
            value={targetStudent}
            onChange={(e) => setTargetStudent(e.target.value)}
          >
            <option value="">Tous les élèves (global)</option>
            {(profiles || []).map((p) => (
              <option key={p.user_id} value={p.user_id}>{p.full_name || p.email || 'Élève'}</option>
            ))}
          </select>
        </div>
        <ContentUploadTabs
          onUploadFile={(file: File) => uploadToStorage(sourate.id, file, 'fichier', targetStudent || undefined)}
          onAddYoutubeLink={(url: string) => handleAddYoutube(sourate.id, url, targetStudent || undefined)}
          onUploadAudio={(file: File) => uploadToStorage(sourate.id, file, 'audio', targetStudent || undefined)}
          isUploading={isUploading}
        />
      </CardContent>
    </Card>
  );
}

const AdminSourateContent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [deleteContentId, setDeleteContentId] = useState<string | null>(null);

  const { data: sourates = [] } = useQuery({
    queryKey: ['admin-sourates-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sourates').select('*').order('number', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: contents = [], refetch: refetchContents } = useQuery({
    queryKey: ['admin-sourate-contents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sourate_content').select('*').order('display_order');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles-for-unlock'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, full_name, email').order('full_name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: unlocks = [], refetch: refetchUnlocks } = useQuery({
    queryKey: ['admin-sourate-unlocks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sourate_admin_unlocks').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const uploadToStorage = useCallback(async (sourateId: string, file: File, contentType: string, targetUserId?: string) => {
    if (!user?.id) { toast.error('Vous devez être connecté'); return; }
    setIsUploading(true);
    try {
      const existingCount = contents.filter(c => c.sourate_id === sourateId).length;
      const ext = file.name.split('.').pop();
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `sourate-${sourateId}/${uniqueName}`;
      const { error: uploadError } = await supabase.storage.from('sourate-content').upload(filePath, await compressDocument(file), { cacheControl: '3600', upsert: false });
      if (uploadError) { toast.error(`Erreur upload: ${uploadError.message}`); return; }
      const { data: urlData } = supabase.storage.from('sourate-content').getPublicUrl(filePath);
      const defaultTitle = contentType === 'audio' ? 'Audio' : file.name;
      const insertData: TablesInsert<'sourate_content'> = {
        sourate_id: sourateId, content_type: contentType, file_url: urlData.publicUrl,
        file_name: defaultTitle, display_order: existingCount, uploaded_by: user.id,
      };
      if (targetUserId) insertData.target_user_id = targetUserId;
      const { error: insertError } = await supabase.from('sourate_content').insert(insertData);
      if (insertError) { toast.error(`Erreur: ${insertError.message}`); return; }
      await refetchContents();
      const studentName = targetUserId ? profiles.find((p) => p.user_id === targetUserId)?.full_name : null;
      toast.success(studentName ? `Contenu envoyé à ${studentName} ✅` : 'Contenu ajouté ✅');
    } catch (error) { console.error(error); }
    finally { setIsUploading(false); }
  }, [user, contents, profiles, refetchContents]);

  const handleAddYoutube = useCallback(async (sourateId: string, embedUrl: string, targetUserId?: string) => {
    if (!user?.id) return;
    setIsUploading(true);
    try {
      const existingCount = contents.filter(c => c.sourate_id === sourateId).length;
      const insertData: TablesInsert<'sourate_content'> = {
        sourate_id: sourateId, content_type: 'youtube', file_url: embedUrl,
        file_name: 'Vidéo YouTube', display_order: existingCount, uploaded_by: user.id,
      };
      if (targetUserId) insertData.target_user_id = targetUserId;
      const { error } = await supabase.from('sourate_content').insert(insertData);
      if (error) { toast.error(error.message); return; }
      await refetchContents();
      const studentName = targetUserId ? profiles.find((p) => p.user_id === targetUserId)?.full_name : null;
      toast.success(studentName ? `Lien envoyé à ${studentName} ✅` : 'Lien YouTube ajouté ✅');
    } catch (error) { console.error(error); }
    finally { setIsUploading(false); }
  }, [user, contents, profiles, refetchContents]);

  const updateTitleMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from('sourate_content').update({ file_name: title }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-sourate-contents'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const content = contents.find(c => c.id === contentId);
      if (!content) return;
      // Corbeille d'abord ; le fichier est gardé pour pouvoir le restaurer (règle « ne jamais rien perdre », 2026-10-19)
      if (!content || !user?.id) throw new Error('Contenu introuvable');
      await trashThenDelete({ userId: user.id, type: 'sourate_content', id: contentId, label: content.file_name || 'Contenu sourate', data: content,
        remove: () => supabase.from('sourate_content').delete().eq('id', contentId) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sourate-contents'] });
      toast.success('Contenu supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  // Reverrouiller : confirmation, puis le déblocage part dans la corbeille (restaurable), jamais effacé directement
  const [toRelock, setToRelock] = useState<{ unlock: (typeof unlocks)[number]; label: string } | null>(null);

  // ✅ Valider une sourate pour un élève (Nadia, 2026-11-17) : la base l'écrit aussi dans SON avancement (déclencheur
  // sync_sourate_deblocage) → verte chez lui, comptée dans ses points. Confirmation avant de valider (règle), pas pour annuler.
  const [toValidate, setToValidate] = useState<{ userId: string; sourateId: string; label: string } | null>(null);
  const toggleUnlock = async (userId: string, sourateId: string, label: string) => {
    const existing = unlocks.find(u => u.user_id === userId && u.sourate_id === sourateId);
    if (existing) { setToRelock({ unlock: existing, label }); return; }
    setToValidate({ userId, sourateId, label });
  };
  // ↩️ Invalider une sourate que l'élève a validée lui-même (Nadia, 2026-11-18) : elle redevient « à faire », ses points baissent
  const [toInvalidate, setToInvalidate] = useState<{ sourateId: string; label: string } | null>(null);
  const confirmInvalidate = async () => {
    const v = toInvalidate;
    setToInvalidate(null);
    if (!v || !selectedStudent) return;
    const { error } = await supabase.from('user_sourate_progress')
      .update({ is_validated: false, is_memorized: false, progress_percentage: 0, validated_at: null })
      .eq('user_id', selectedStudent).eq('sourate_id', v.sourateId).eq('context', 'sourates');
    if (error) { toast.error('📡 La sourate n\'a pas été invalidée : vérifie ta connexion'); return; }
    void refetchValidees();
    toast.success('↩️ Sourate invalidée : elle est de nouveau à faire pour l\'élève');
  };
  const confirmValidate = async () => {
    const v = toValidate;
    setToValidate(null);
    if (!v) return;
    const { error } = await supabase.from('sourate_admin_unlocks').insert({ user_id: v.userId, sourate_id: v.sourateId, unlocked_by: user?.id });
    if (error) { toast.error('📡 La sourate n\'a pas été validée : vérifie ta connexion'); return; }
    refetchUnlocks();
    void refetchValidees();
    // 🔔 2026-11-18 : l'élève est prévenu
    sendPushNotification({ userId: v.userId, category: 'rec', title: '✅ {prenom}, ton professeur a validé !', body: 'Une sourate vient d\'être validée ✨', data: { url: '/sourates' } });
    toast.success('✅ Sourate validée pour l\'élève (verte chez lui, points ajoutés)');
  };

  const confirmRelock = async () => {
    const r = toRelock;
    setToRelock(null);
    if (!r || !user?.id) return;
    const ok = await moveToTrash(user.id, 'sourate_admin_unlock', r.unlock.id, r.label, r.unlock);
    if (!ok) { toast.error('Mise en corbeille impossible — la sourate reste débloquée'); return; }
    const { error } = await supabase.from('sourate_admin_unlocks').delete().eq('id', r.unlock.id);
    if (error) { toast.error('Erreur : la sourate est toujours débloquée'); return; }
    refetchUnlocks();
    void refetchValidees();
    toast.success('Validation annulée (elle est dans la corbeille de Paramètres)');
  };

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  // Sourates que l'élève a validées LUI-MÊME (récitation acceptée, mode fantôme…) : affichées « ✅ Validée par l'élève »
  const { data: valideesEleve = [], refetch: refetchValidees } = useQuery({
    queryKey: ['admin-sourates-validees', selectedStudent],
    enabled: !!selectedStudent,
    queryFn: async () => {
      const { data } = await supabase.from('user_sourate_progress').select('sourate_id').eq('user_id', selectedStudent!).eq('context', 'sourates').eq('is_validated', true);
      return (data || []).map((d) => d.sourate_id);
    },
  });

  const chargerSourates = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-sourates-list'] });
  };

  const handleUploadAudioComplet = async (sourateId: string, sourateNumber: number, file: File) => {
    const fileName = `complet/sourate-${sourateNumber}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
      .from('sourates-versets')
      .upload(fileName, await compressDocument(file), { upsert: true });
    if (uploadError) { toast.error('Erreur: ' + uploadError.message); return; }
    const { data: urlData } = supabase.storage
      .from('sourates-versets')
      .getPublicUrl(fileName);
    await supabase.from('sourates')
      .update({ audio_complet_url: urlData.publicUrl, audio_complet_path: fileName })
      .eq('id', sourateId);
    toast.success('✅ Audio complet uploadé');
    chargerSourates();
  };

  const handleDeleteAudioComplet = async (sourateId: string, filePath: string | null) => {
    if (filePath) {
      await supabase.storage.from('sourates-versets').remove([filePath]);
    }
    await supabase.from('sourates')
      .update({ audio_complet_url: null, audio_complet_path: null })
      .eq('id', sourateId);
    toast.success('Audio supprimé');
    chargerSourates();
  };

  const mapContentType = (type: string): ContentType => {
    if (type === 'youtube') return 'youtube';
    if (type === 'audio') return 'audio';
    return 'fichier';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">Gestion du contenu Sourates</h3>
      <p className="text-sm text-muted-foreground">Ajoutez des fichiers, vidéos YouTube ou audio pour chaque sourate. Validez des sourates pour vos élèves.</p>

      {/* Student unlock section */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="font-bold flex items-center gap-2">
            <Unlock className="h-4 w-4" />
            Valider des sourates pour un élève
          </h4>
          <ChoixEleveParGroupe value={selectedStudent} onChange={(id) => setSelectedStudent(id)} />
          {selectedStudent && (
            <div className="max-h-[65vh] overflow-y-auto space-y-1">
              {sourates.map(s => {
                const isUnlocked = unlocks.some(u => u.user_id === selectedStudent && u.sourate_id === s.id);
                const parEleve = !isUnlocked && valideesEleve.includes(s.id);
                return (
                  <div key={s.id} className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded">
                    <span className="text-sm min-w-0 [overflow-wrap:anywhere]">{s.number}. {s.name_french}</span>
                    {parEleve
                      ? (
                        <Button size="sm" variant="outline" className="shrink-0 border-emerald-300 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200"
                          onClick={() => setToInvalidate({ sourateId: s.id, label: `${s.number}. ${s.name_french} — ${(profiles || []).find((p) => p.user_id === selectedStudent)?.full_name || 'Élève'}` })}>
                          ✅ Validée par l'élève
                        </Button>
                      )
                      : (
                        <Button variant={isUnlocked ? 'default' : 'outline'} size="sm" className={isUnlocked ? 'shrink-0 bg-emerald-600 hover:bg-emerald-700' : 'shrink-0'}
                          onClick={() => toggleUnlock(selectedStudent, s.id, `${s.number}. ${s.name_french} — ${(profiles || []).find((p) => p.user_id === selectedStudent)?.full_name || 'Élève'}`)}>
                          {isUnlocked ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                          {isUnlocked ? '✅ Validée' : 'Valider'}
                        </Button>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content per sourate */}
      <div className="space-y-3">
        {sourates.map((sourate) => {
          const sourateContents = contents.filter(c => c.sourate_id === sourate.id);
          return (
            <SourateAdminCard
              key={sourate.id}
              sourate={sourate}
              sourateContents={sourateContents}
              mapContentType={mapContentType}
              setDeleteContentId={setDeleteContentId}
              updateTitleMutation={updateTitleMutation}
              deleteMutation={deleteMutation}
              uploadToStorage={uploadToStorage}
              handleAddYoutube={handleAddYoutube}
              handleUploadAudioComplet={handleUploadAudioComplet}
              handleDeleteAudioComplet={handleDeleteAudioComplet}
              chargerSourates={chargerSourates}
              isUploading={isUploading}
              profiles={profiles}
            />
          );
        })}
      </div>
      <ConfirmDeleteDialog
        open={!!deleteContentId}
        onOpenChange={(open) => !open && setDeleteContentId(null)}
        onConfirm={() => { if (deleteContentId) deleteMutation.mutate(deleteContentId); setDeleteContentId(null); }}
        description="Ce contenu ira dans la corbeille (Paramètres), d'où tu pourras le restaurer."
      />
      <ConfirmDeleteDialog
        open={!!toRelock}
        onOpenChange={(open) => !open && setToRelock(null)}
        onConfirm={confirmRelock}
        title="Annuler la validation de cette sourate ?"
        description={toRelock ? `« ${toRelock.label} » ne sera plus validée pour cet élève (ses points baissent de la même valeur). La validation ira dans la corbeille (Paramètres), d'où tu pourras la restaurer.` : ''}
      />
      <AlertDialog open={!!toInvalidate} onOpenChange={(o) => !o && setToInvalidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invalider cette sourate ?</AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">{toInvalidate ? `« ${toInvalidate.label} » a été validée par l'élève. Elle redeviendra « à faire » sur son chemin (les sourates d'après se referment si elles ne sont pas validées) et ses points baissent de la même valeur.` : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Garder validée</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmInvalidate()}>↩️ Invalider</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!toValidate} onOpenChange={(o) => !o && setToValidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valider cette sourate ?</AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">{toValidate ? `« ${toValidate.label} » sera validée comme si l'élève l'avait validée lui-même : verte sur son chemin et comptée dans ses points.` : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmValidate()}>✅ Valider</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSourateContent;
