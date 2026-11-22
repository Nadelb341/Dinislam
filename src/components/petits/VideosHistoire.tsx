import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { SafeYoutubeEmbed } from '@/components/SafeYoutubeEmbed';
import { SortableCardList } from '@/components/shared/SortableCardList';
import { useAuth } from '@/contexts/AuthContext';
import { untypedDb } from '@/lib/untypedDb';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { trashThenDelete } from '@/lib/trash';
import { enregistrerOrdre } from '@/lib/alphabetMedias';
import { errorMessage } from '@/lib/utils';
import { idYoutube } from '@/lib/youtube';
import { QuizVideo } from '@/components/shared/QuizVideo';

/**
 * 🎬 Les vidéos d'une histoire (Nadia, 22/11) : vidéos YouTube choisies par l'enseignante, CACHÉES aux élèves au départ ;
 * elle choisit celles qui sont visibles (👁️), en ajoute, les renomme, les range (✋ appui long) ou les retire (corbeille).
 * Lecteur protégé : aucune sortie vers YouTube. Internet nécessaire pour les regarder.
 */
interface VideoHistoire { id: string; youtube_id: string; titre: string | null; chaine: string | null; a_revoir: boolean; visible: boolean; position: number }

export function VideosHistoire({ ficheId, rubrique, titreFiche, isAdmin, entete = '🎬 Les vidéos', petits = false }: {
  /** Une histoire… */ ficheId?: string;
  /** …ou toute une carte des tout-petits (ex. « ramadan ») */ rubrique?: string;
  titreFiche: string; isAdmin: boolean; entete?: string;
  /** Quiz sonore (tout-petits) */ petits?: boolean;
}) {
  const cible = ficheId ? { col: 'fiche_id', val: ficheId } : { col: 'rubrique', val: rubrique ?? '' };
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const cle = ['histoires-videos', cible.val];
  const { data: videos = [] } = useQuery({
    queryKey: cle,
    queryFn: async () => {
      const { data, error } = await untypedDb.from('histoires_videos').select('id, youtube_id, titre, chaine, a_revoir, visible, position').eq(cible.col, cible.val).order('position').order('created_at');
      if (error) throw error;
      return (data || []) as VideoHistoire[];
    },
  });
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [ajout, setAjout] = useState(false);
  const [lien, setLien] = useState('');
  const [titre, setTitre] = useState('');
  const [modif, setModif] = useState<VideoHistoire | null>(null);
  const [aRetirer, setARetirer] = useState<VideoHistoire | null>(null);
  const rafraichir = () => void queryClient.invalidateQueries({ queryKey: cle });
  const visibles = videos.filter((v) => v.visible);

  const maj = async (v: VideoHistoire, values: Partial<VideoHistoire>) => {
    queryClient.setQueryData<VideoHistoire[]>(cle, (old) => (old || []).map((x) => (x.id === v.id ? { ...x, ...values } : x)));
    try {
      const r = await ecrireOuGarder({ table: 'histoires_videos', op: 'update', id: v.id, values });
      if (r === 'en_attente') toast('📡 Gardé, envoyé au retour du réseau');
    } catch (e) { toast.error(errorMessage(e)); rafraichir(); }
  };
  const enregistrer = async () => {
    const id = idYoutube(lien);
    if (!id) { toast.error('Colle un lien YouTube (youtube.com/watch?v=… ou youtu.be/…)'); return; }
    try {
      if (modif) await maj(modif, { youtube_id: id, titre: titre.trim() || null });
      else {
        const r = await ecrireOuGarder({ table: 'histoires_videos', op: 'insert', rows: [{ [cible.col]: cible.val, youtube_id: id, titre: titre.trim() || null, visible: false, position: Math.max(0, ...videos.map((v) => v.position)) + 10 }] });
        toast.success(r === 'en_attente' ? '📡 Gardé, envoyé au retour du réseau' : '🎬 Vidéo ajoutée (cachée aux élèves : touche 👁️ pour la montrer)');
        rafraichir();
      }
      setAjout(false); setModif(null); setLien(''); setTitre('');
    } catch (e) { toast.error(errorMessage(e)); }
  };
  const retirer = async (v: VideoHistoire) => {
    if (!user) return;
    try {
      await trashThenDelete({ userId: user.id, type: 'histoire_video', id: v.id, label: `Vidéo « ${v.titre || v.youtube_id} » (${titreFiche})`, data: { ...v, [cible.col]: cible.val },
        remove: () => untypedDb.from('histoires_videos').delete().eq('id', v.id) });
      toast.success('🗑️ Dans la corbeille (Paramètres)');
      rafraichir();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  if (!isAdmin && !visibles.length) return null;
  return (
    <section className="rounded-[28px] border-[6px] border-sky-400 bg-sky-50 dark:bg-sky-950/40 shadow-xl overflow-hidden text-start">
      <p className="bg-sky-500 px-4 py-2 text-lg font-extrabold text-white">{entete}{isAdmin ? ` (${visibles.length} visible${visibles.length > 1 ? 's' : ''} sur ${videos.length})` : ''}</p>
      <div className="p-3 space-y-3">
        {!isAdmin ? visibles.map((v) => (
          <div key={v.id} className="space-y-1">
            {v.titre && <p className="font-bold text-sm text-slate-800 dark:text-white [overflow-wrap:anywhere]">{v.titre}</p>}
            <SafeYoutubeEmbed embedUrl={`https://www.youtube.com/embed/${v.youtube_id}`} title={v.titre || titreFiche} />
            <QuizVideo cible={`histoire_video:${v.id}`} sujet={`${titreFiche} : ${v.titre || 'vidéo'}`} video={v.youtube_id} isAdmin={false} petits={petits} />
          </div>
        )) : (
          <>
            <p className="text-xs text-muted-foreground">👁️ = visible par les élèves. Au départ, tout est caché : regarde chaque vidéo (▶️) avant de la montrer. ✋ Appui long puis glisser pour ranger.</p>
            <SortableCardList items={videos} onReorder={(l) => {
              queryClient.setQueryData<VideoHistoire[]>(cle, l.map((v, i) => ({ ...v, position: (i + 1) * 10 })));
              void enregistrerOrdre('histoires_videos', l.map((v) => v.id)).then(rafraichir, (e) => toast.error(errorMessage(e)));
            }}
              renderItem={(v, drag) => {
                const { ref, style, isDragging, ...attrs } = drag;
                return (
                  <div key={v.id} ref={ref} style={style} {...attrs} className={`rounded-2xl border-2 bg-card p-2 space-y-2 touch-manipulation ${v.visible ? 'border-emerald-400' : 'border-border'} ${isDragging ? 'opacity-50 ring-2 ring-sky-400' : ''}`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold [overflow-wrap:anywhere]">{v.titre || v.youtube_id}</p>
                        <p className="text-[11px] text-muted-foreground [overflow-wrap:anywhere]">{v.chaine ?? 'YouTube'}{v.a_revoir ? ' · ⏳ « Plus tard »' : ''}</p>
                      </div>
                      <label className="flex items-center gap-1 text-[11px] font-bold shrink-0" onPointerDown={(e) => e.stopPropagation()}>
                        {v.visible ? '👁️ Visible' : '🙈 Cachée'}
                        <Switch checked={v.visible} onCheckedChange={(on) => void maj(v, { visible: on })} aria-label={`Montrer ${v.titre ?? 'la vidéo'} aux élèves`} />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" onClick={() => setOuverte(ouverte === v.id ? null : v.id)}>{ouverte === v.id ? '⏹️ Fermer' : '▶️ Regarder'}</Button>
                      <Button size="sm" variant="outline" onClick={() => { setModif(v); setLien(`https://www.youtube.com/watch?v=${v.youtube_id}`); setTitre(v.titre ?? ''); setAjout(true); }}>✏️ Modifier</Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => setARetirer(v)} aria-label="Retirer la vidéo">🗑️</Button>
                    </div>
                    {ouverte === v.id && <SafeYoutubeEmbed embedUrl={`https://www.youtube.com/embed/${v.youtube_id}`} title={v.titre || titreFiche} />}
                    <div onPointerDown={(e) => e.stopPropagation()}>
                      <QuizVideo cible={`histoire_video:${v.id}`} sujet={`${titreFiche} : ${v.titre || 'vidéo'}`} video={v.youtube_id} isAdmin petits={petits} />
                    </div>
                  </div>
                );
              }} />
            {ajout ? (
              <div className="rounded-xl border-2 border-dashed border-sky-400 p-3 space-y-2">
                <p className="text-sm font-bold">{modif ? '✏️ Modifier la vidéo' : '➕ Ajouter une vidéo YouTube'}</p>
                <Input id={`video-lien-${cible.val}`} value={lien} onChange={(e) => setLien(e.target.value)} placeholder="Lien YouTube"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById(`video-titre-${cible.val}`)?.focus(); } }} />
                <Input id={`video-titre-${cible.val}`} value={titre} maxLength={120} onChange={(e) => setTitre(e.target.value)} placeholder="Titre (facultatif)"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void enregistrer(); } }} />
                <div className="flex gap-2">
                  <Button onClick={() => void enregistrer()}>💾 Enregistrer</Button>
                  <Button variant="ghost" onClick={() => { setAjout(false); setModif(null); setLien(''); setTitre(''); }}>Annuler</Button>
                </div>
              </div>
            ) : <Button variant="outline" className="w-full" onClick={() => setAjout(true)}>➕ Ajouter une vidéo YouTube</Button>}
          </>
        )}
      </div>
      <ConfirmDeleteDialog open={!!aRetirer} onOpenChange={(o) => !o && setARetirer(null)} onConfirm={() => { const v = aRetirer; setARetirer(null); if (v) void retirer(v); }}
        title="Retirer cette vidéo ?" description="Elle ira dans la corbeille de Paramètres ; tu pourras la restaurer." />
    </section>
  );
}
