import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Volume2 } from 'lucide-react';
import { untypedDb } from '@/lib/untypedDb';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import ContentUploadTabs from '@/components/admin/ContentUploadTabs';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import { SortableCardList } from '@/components/shared/SortableCardList';
import { LecteurVideo } from '@/components/video/LecteurVideo';
import { SafeYoutubeEmbed } from '@/components/SafeYoutubeEmbed';
import { QuizVideo } from '@/components/shared/QuizVideo';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { trashThenDelete } from '@/lib/trash';
import { enregistrerOrdre, envoyerFichierAlphabet, horsLigne, type KindMedia } from '@/lib/alphabetMedias';
import { errorMessage } from '@/lib/utils';

/**
 * ✏️ Zones de contenu communes (Nadia, 2026-11-21, proposition 4 du crayon) : à poser dans n'importe quelle carte ou fiche.
 * Élèves : les zones s'affichent dans l'ordre choisi. Enseignante : 📝 texte, 📎 image / vidéo / PDF / audio, lien YouTube,
 * ✏️ modifier un texte, ✋ appui long + glisser pour ranger, 🗑️ retirer (corbeille). Hors ligne : textes gardés puis envoyés.
 * `cible` = l'endroit (ex. 'sourate:12'). Table `zones_contenu`.
 */
export interface Zone { id: string; cible?: string; kind: KindMedia; texte: string | null; url: string | null; nom: string | null; position: number }

export function VueZone({ b }: { b: Pick<Zone, 'kind' | 'texte' | 'url' | 'nom'> }) {
  if (b.kind === 'texte') return <p className="whitespace-pre-wrap text-[15px] leading-relaxed [overflow-wrap:anywhere]">{b.texte}</p>;
  if (b.kind === 'youtube' && b.url) return <div className="rounded-xl overflow-hidden"><SafeYoutubeEmbed embedUrl={b.url} title={b.nom || 'Vidéo'} /></div>;
  if (b.kind === 'video' && b.url) return <LecteurVideo src={b.url} controlsList="nodownload" />;
  if (b.kind === 'image' && b.url) return <img src={b.url} alt={b.nom || ''} loading="lazy" className="w-full rounded-xl object-contain max-h-80 bg-muted/30" />;
  if (b.kind === 'audio' && b.url) return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3"><Volume2 className="h-5 w-5 text-primary shrink-0" /><audio src={b.url} controls className="flex-1 min-w-0 h-9" /></div>
  );
  if (b.kind === 'pdf' && b.url) return (
    <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50">
      <FileText className="h-5 w-5 text-red-500 shrink-0" /><span className="text-sm font-medium [overflow-wrap:anywhere]">{b.nom || 'Document'}</span>
    </a>
  );
  return null;
}

export function ZonesContenu({ cible, isAdmin, libelle, vide }: {
  cible: string; isAdmin: boolean;
  /** Pour la corbeille et les messages (ex. « Sourate Al-Fatiha ») */
  libelle: string;
  /** Message aux élèves quand il n'y a rien (sinon rien ne s'affiche) */
  vide?: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [ajout, setAjout] = useState<'texte' | 'fichier' | null>(null);
  const [texte, setTexte] = useState('');
  const [modif, setModif] = useState<Zone | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [aRetirer, setARetirer] = useState<Zone | null>(null);

  const { data: zones = [] } = useQuery({
    queryKey: ['zones-contenu', cible],
    queryFn: async () => {
      const { data, error } = await untypedDb.from('zones_contenu').select('id, kind, texte, url, nom, position').eq('cible', cible).order('position').order('created_at');
      if (error) throw error;
      return (data || []) as Zone[];
    },
  });
  const rafraichir = () => void queryClient.invalidateQueries({ queryKey: ['zones-contenu', cible] });
  const maxPos = Math.max(0, ...zones.map((z) => z.position));

  const ajouter = async (row: Partial<Zone>) => {
    const r = await ecrireOuGarder({ table: 'zones_contenu', op: 'insert', rows: [{ cible, position: maxPos + 10, ...row }] });
    toast.success(r === 'en_attente' ? '📡 Gardé sur cet appareil, envoyé au retour du réseau' : 'Ajouté ✅');
    rafraichir();
  };
  const envoyer = async (f: File) => {
    if (horsLigne()) { toast.error('📡 Nécessite Internet pour envoyer un fichier'); return; }
    setEnvoi(true);
    try {
      const r = await envoyerFichierAlphabet(f, `zones/${cible.replace(/[^a-z0-9-]/gi, '_')}`);
      await ajouter({ kind: r.kind, url: r.url, nom: r.nom });
      setAjout(null);
    } catch (e) { toast.error(errorMessage(e)); } finally { setEnvoi(false); }
  };
  const enregistrerTexte = async () => {
    if (!texte.trim()) return;
    try {
      if (modif) {
        const r = await ecrireOuGarder({ table: 'zones_contenu', op: 'update', id: modif.id, values: { texte: texte.trim() } });
        toast.success(r === 'en_attente' ? '📡 Gardé, envoyé au retour du réseau' : 'Modifié ✅');
        rafraichir();
      } else await ajouter({ kind: 'texte', texte: texte.trim() });
      setTexte(''); setModif(null); setAjout(null);
    } catch (e) { toast.error(errorMessage(e)); }
  };
  const retirer = async (z: Zone) => {
    if (!user) return;
    try {
      await trashThenDelete({ userId: user.id, type: 'zone_contenu', id: z.id, label: `${z.kind === 'texte' ? 'Texte' : z.nom || 'Fichier'} (${libelle})`,
        data: { ...z, cible }, remove: () => untypedDb.from('zones_contenu').delete().eq('id', z.id) });
      toast.success('🗑️ Dans la corbeille (Paramètres)');
      rafraichir();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  if (!isAdmin) {
    if (!zones.length) return vide ? <p className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 text-center font-semibold">{vide}</p> : null;
    return (
      <div className="space-y-3">{zones.map((z) => (
        <div key={z.id} className="space-y-2">
          <VueZone b={z} />
          {(z.kind === 'video' || z.kind === 'youtube') && <QuizVideo cible={`zone:${z.id}`} sujet={`${libelle}${z.nom ? ` : ${z.nom}` : ''}`} video={z.kind === 'youtube' ? z.url : null} isAdmin={false} />}
        </div>
      ))}</div>
    );
  }

  return (
    <div className="space-y-3">
      {zones.length > 0 && (
        <SortableCardList items={zones} onReorder={(n) => { void enregistrerOrdre('zones_contenu', n.map((z) => z.id)).then(rafraichir, (e) => toast.error(errorMessage(e))); }}
          renderItem={(z, drag) => {
            const { ref, style, isDragging, ...attrs } = drag;
            return (
              <div key={z.id} ref={ref} style={style} {...attrs} className={`space-y-1.5 rounded-xl touch-manipulation ${isDragging ? 'opacity-50 ring-2 ring-sky-400' : ''}`}>
                <VueZone b={z} />
                {(z.kind === 'video' || z.kind === 'youtube') && (
                  <div onPointerDown={(e) => e.stopPropagation()}>
                    <QuizVideo cible={`zone:${z.id}`} sujet={`${libelle}${z.nom ? ` : ${z.nom}` : ''}`} video={z.kind === 'youtube' ? z.url : null} isAdmin />
                  </div>
                )}
                <div className="flex flex-wrap gap-1 justify-end">
                  {z.kind === 'texte' && <Button size="sm" variant="outline" onClick={() => { setModif(z); setTexte(z.texte || ''); setAjout('texte'); }}>✏️ Modifier</Button>}
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => setARetirer(z)} aria-label="Retirer">🗑️</Button>
                </div>
              </div>
            );
          }} />
      )}
      {ajout ? (
        <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <p className="flex-1 text-sm font-bold">{ajout === 'texte' ? (modif ? '✏️ Modifier le texte' : '📝 Ajouter un texte') : '📎 Ajouter une image, une vidéo, un PDF…'}</p>
            <button type="button" onClick={() => { setAjout(null); setModif(null); setTexte(''); }} className="text-xs font-semibold text-muted-foreground">Fermer</button>
          </div>
          {ajout === 'texte' ? (
            <>
              <TextareaDictee value={texte} onChange={(e) => setTexte(e.target.value)} rows={4} placeholder="Écris ici…" />
              <Button type="button" onClick={() => void enregistrerTexte()} disabled={!texte.trim()}>💾 Enregistrer</Button>
            </>
          ) : (
            <>
              <ContentUploadTabs isUploading={envoi} accept="image/*,video/*,application/pdf,.pdf,.doc,.docx" libelleFichier="Image, vidéo, PDF…"
                onUploadFile={(f) => void envoyer(f)} onAddYoutubeLink={(u) => void ajouter({ kind: 'youtube', url: u, nom: 'Vidéo YouTube' }).then(() => setAjout(null), (e) => toast.error(errorMessage(e)))}
                onUploadAudio={(f) => void envoyer(f)} />
              <p className="text-[11px] text-muted-foreground">Un fichier envoyé reste visible sans Internet une fois vu ; un lien YouTube a besoin d'Internet.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={() => setAjout('texte')}>📝 Ajouter un texte</Button>
          <Button type="button" variant="outline" onClick={() => setAjout('fichier')}>📎 Image, vidéo, PDF…</Button>
        </div>
      )}
      <ConfirmDeleteDialog open={!!aRetirer} onOpenChange={(o) => !o && setARetirer(null)}
        onConfirm={() => { const z = aRetirer; setARetirer(null); if (z) void retirer(z); }}
        title="Retirer cette zone ?" description="Elle ira dans la corbeille de Paramètres, tu pourras la restaurer." />
    </div>
  );
}
