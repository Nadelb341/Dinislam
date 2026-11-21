import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Pencil, Volume2 } from 'lucide-react';
import { untypedDb } from '@/lib/untypedDb';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import ContentUploadTabs from '@/components/admin/ContentUploadTabs';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import { LecteurVideo } from '@/components/video/LecteurVideo';
import { SafeYoutubeEmbed } from '@/components/SafeYoutubeEmbed';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { collectChildren, trashThenDelete } from '@/lib/trash';
import { enregistrerOrdre, envoyerFichierAlphabet, horsLigne, type KindMedia } from '@/lib/alphabetMedias';
import { rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableCardList, type DragItemProps } from '@/components/shared/SortableCardList';
import { errorMessage } from '@/lib/utils';
import { QuizParticularite } from './QuizParticularite';
import { CommentairesParticularite } from './CommentairesParticularite';

/**
 * ✨ Onglet « Particularités » de l'Alphabet (Nadia, 2026-11-21, choix P2) : des tuiles (Tanouine, Chadda, Soukoune…)
 * comme la grille des lettres ; la fiche s'ouvre avec une VIDÉO en haut (à la place de la grande lettre + « Écoute »).
 * ✏️ Nadia garde la main sur TOUT : ajouter / modifier / supprimer une particularité (titre, titre arabe, emoji, couleur ; ✋ appui long + glisser pour ranger)
 * et, dans la fiche, des zones de contenu (texte, images, vidéos, lien YouTube, PDF, audio) à ranger par appui long + glisser.
 * Toute suppression passe par la corbeille (Paramètres). Hors ligne : textes gardés et envoyés au retour du réseau.
 */
export interface Particularite { id: string; titre: string; titre_arabe: string | null; emoji: string | null; couleur: string | null; position: number }
export interface Bloc { id: string; particularite_id: string; kind: KindMedia; texte: string | null; url: string | null; nom: string | null; position: number }

const COULEURS: Record<string, { tuile: string; bandeau: string; pastille: string }> = {
  sky: { tuile: 'bg-sky-50 border-sky-300 dark:bg-sky-950/30 dark:border-sky-800', bandeau: 'from-sky-400 to-blue-600', pastille: 'bg-sky-400' },
  rose: { tuile: 'bg-rose-50 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800', bandeau: 'from-rose-400 to-red-600', pastille: 'bg-rose-400' },
  indigo: { tuile: 'bg-indigo-50 border-indigo-300 dark:bg-indigo-950/30 dark:border-indigo-800', bandeau: 'from-indigo-400 to-indigo-700', pastille: 'bg-indigo-400' },
  amber: { tuile: 'bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800', bandeau: 'from-amber-400 to-orange-600', pastille: 'bg-amber-400' },
  emerald: { tuile: 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800', bandeau: 'from-emerald-400 to-teal-600', pastille: 'bg-emerald-400' },
  violet: { tuile: 'bg-violet-50 border-violet-300 dark:bg-violet-950/30 dark:border-violet-800', bandeau: 'from-violet-400 to-purple-700', pastille: 'bg-violet-400' },
  pink: { tuile: 'bg-pink-50 border-pink-300 dark:bg-pink-950/30 dark:border-pink-800', bandeau: 'from-pink-400 to-fuchsia-600', pastille: 'bg-pink-400' },
  teal: { tuile: 'bg-teal-50 border-teal-300 dark:bg-teal-950/30 dark:border-teal-800', bandeau: 'from-teal-400 to-cyan-700', pastille: 'bg-teal-400' },
  orange: { tuile: 'bg-orange-50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800', bandeau: 'from-orange-400 to-red-500', pastille: 'bg-orange-400' },
  yellow: { tuile: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800', bandeau: 'from-yellow-400 to-amber-600', pastille: 'bg-yellow-400' },
  slate: { tuile: 'bg-slate-50 border-slate-300 dark:bg-slate-900/40 dark:border-slate-700', bandeau: 'from-slate-500 to-indigo-900', pastille: 'bg-slate-500' },
};
const couleurDe = (c: string | null) => COULEURS[c || ''] ?? COULEURS.sky;
const estVideo = (b: Bloc) => b.kind === 'video' || b.kind === 'youtube';

function VueBloc({ b }: { b: Bloc }) {
  if (b.kind === 'texte') return <p className="whitespace-pre-wrap text-[15px] leading-relaxed [overflow-wrap:anywhere]">{b.texte}</p>;
  if (b.kind === 'youtube' && b.url) return <div className="rounded-xl overflow-hidden"><SafeYoutubeEmbed embedUrl={b.url} title={b.nom || 'Vidéo'} /></div>;
  if (b.kind === 'video' && b.url) return <LecteurVideo src={b.url} controlsList="nodownload" />;
  if (b.kind === 'image' && b.url) return <img src={b.url} alt={b.nom || ''} className="w-full rounded-xl object-contain max-h-80 bg-muted/30" />;
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

export function AlphabetParticularites({ isAdmin }: { isAdmin: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [ouverte, setOuverte] = useState<Particularite | null>(null);
  const [edition, setEdition] = useState<Particularite | 'nouvelle' | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['alphabet-particularites'],
    queryFn: async () => {
      const { data, error } = await untypedDb.from('alphabet_particularites').select('id, titre, titre_arabe, emoji, couleur, position').order('position').order('created_at');
      if (error) throw error;
      return (data || []) as Particularite[];
    },
  });
  const { data: blocs = [] } = useQuery({
    queryKey: ['alphabet-particularite-blocs'],
    queryFn: async () => {
      const { data, error } = await untypedDb.from('alphabet_particularite_blocs').select('id, particularite_id, kind, texte, url, nom, position').order('position').order('created_at');
      if (error) throw error;
      return (data || []) as Bloc[];
    },
  });
  const rafraichir = () => {
    void queryClient.invalidateQueries({ queryKey: ['alphabet-particularites'] });
    void queryClient.invalidateQueries({ queryKey: ['alphabet-particularite-blocs'] });
  };
  const courante = ouverte ? items.find((i) => i.id === ouverte.id) ?? null : null;
  const contenuDe = (id: string) => blocs.some((b) => b.particularite_id === id);

  const ranger = async (n: Particularite[]) => {
    queryClient.setQueryData(['alphabet-particularites'], n.map((p, i) => ({ ...p, position: (i + 1) * 10 })));
    try {
      const r = await enregistrerOrdre('alphabet_particularites', n.map((p) => p.id));
      toast.success(r === 'en_attente' ? '📡 Ordre gardé, envoyé au retour du réseau' : '✋ Ordre enregistré (les élèves voient le même)');
    } catch (e) { toast.error(errorMessage(e)); rafraichir(); }
  };

  const tuile = (p: Particularite, drag?: DragItemProps) => {
    const { ref, style, isDragging, ...attrs } = drag ?? ({} as Partial<DragItemProps>);
    return (
      <div key={p.id} ref={ref} style={style} {...attrs} className={`relative touch-manipulation ${isDragging ? 'opacity-40' : ''}`}>
        <button type="button" onClick={() => setOuverte(p)}
          className={`w-full min-h-[112px] rounded-2xl border-2 p-2.5 flex flex-col items-center justify-center gap-1 text-center transition-all active:scale-95 ${couleurDe(p.couleur).tuile}`}>
          <span className="text-2xl leading-none">{p.emoji || '✨'}</span>
          {p.titre_arabe && <span className="font-arabic text-2xl leading-snug" dir="rtl">{p.titre_arabe}</span>}
          <span className="text-xs font-bold [overflow-wrap:anywhere]">{p.titre}</span>
          {!contenuDe(p.id) && <span className="text-[10px] text-muted-foreground">🛠️ En cours de mise à jour</span>}
        </button>
        {isAdmin && (
          <button type="button" onClick={() => setEdition(p)} onPointerDown={(e) => e.stopPropagation()} aria-label={`Modifier ${p.titre}`}
            className="absolute top-1 end-1 h-8 w-8 grid place-items-center rounded-full bg-card/90 shadow-sm border border-border">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground px-1">
        {isAdmin ? '👆 Touche une particularité pour la voir · ✏️ pour la modifier · ✋ appui long puis glisser pour la ranger.' : '👆 Touche une particularité pour regarder sa vidéo.'}
      </p>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />)}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {isAdmin ? (
            // ✋ Appui long + glisser pour ranger (enseignante seulement) : les élèves voient le même ordre
            <SortableCardList items={items} strategy={rectSortingStrategy} onReorder={(n) => void ranger(n)}
              onDragStart={() => { try { navigator.vibrate?.(15); } catch { /* rien */ } }}
              renderItem={(p, drag) => tuile(p, drag)} />
          ) : items.map((p) => tuile(p))}
          {isAdmin && (
            <button type="button" onClick={() => setEdition('nouvelle')}
              className="min-h-[112px] rounded-2xl border-2 border-dashed border-primary/50 text-primary font-bold text-sm grid place-items-center hover:bg-primary/5">
              ➕ Ajouter une particularité
            </button>
          )}
        </div>
      )}
      {!isLoading && !items.length && !isAdmin && <p className="text-sm text-center text-muted-foreground py-6">Ton professeur va bientôt ajouter les particularités. 🤲</p>}

      {courante && (
        <FicheParticularite p={courante} items={items} blocs={blocs.filter((b) => b.particularite_id === courante.id)} isAdmin={isAdmin}
          userId={user?.id ?? null} onChange={setOuverte} onClose={() => setOuverte(null)} rafraichir={rafraichir} />
      )}
      {isAdmin && edition && (
        <EditionParticularite p={edition === 'nouvelle' ? null : edition} items={items} blocs={blocs} userId={user?.id ?? null}
          onClose={() => setEdition(null)} rafraichir={rafraichir} />
      )}
    </div>
  );
}

/** ✏️ Créer / modifier une particularité : titre, titre arabe, emoji, couleur, ordre ; supprimer (corbeille) */
function EditionParticularite({ p, items, blocs, userId, onClose, rafraichir }: {
  p: Particularite | null; items: Particularite[]; blocs: Bloc[]; userId: string | null; onClose: () => void; rafraichir: () => void;
}) {
  const [titre, setTitre] = useState(p?.titre ?? '');
  const [arabe, setArabe] = useState(p?.titre_arabe ?? '');
  const [emoji, setEmoji] = useState(p?.emoji ?? '✨');
  const [couleur, setCouleur] = useState(p?.couleur ?? 'sky');
  const [saving, setSaving] = useState(false);
  const [supprimer, setSupprimer] = useState(false);

  const enregistrer = async () => {
    if (!titre.trim()) { toast.error('Écris un titre'); return; }
    setSaving(true);
    try {
      const valeurs = { titre: titre.trim(), titre_arabe: arabe.trim() || null, emoji: emoji.trim() || null, couleur, updated_at: new Date().toISOString() };
      const r = p
        ? await ecrireOuGarder({ table: 'alphabet_particularites', op: 'update', id: p.id, values: valeurs })
        : await ecrireOuGarder({ table: 'alphabet_particularites', op: 'insert', rows: [{ ...valeurs, position: (items.at(-1)?.position ?? 0) + 10 }] });
      toast.success(r === 'en_attente' ? '📡 Gardé sur cet appareil, envoyé au retour du réseau' : p ? 'Modifiée ✅' : 'Particularité ajoutée ✅');
      rafraichir(); onClose();
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };

  const mettreCorbeille = async () => {
    if (!p || !userId) return;
    try {
      const enfants = await collectChildren('alphabet_particularite_blocs', 'particularite_id', [p.id]);
      const questions = await collectChildren('alphabet_quiz_questions', 'particularite_id', [p.id]);
      // Les messages : d'abord les questions, puis leurs réponses (ordre de restauration)
      const messages = await collectChildren('alphabet_commentaires', 'particularite_id', [p.id]);
      const messagesPremiers = { table: messages.table, rows: messages.rows.filter((m) => !m.parent_id) };
      const messagesReponses = { table: messages.table, rows: messages.rows.filter((m) => m.parent_id) };
      await trashThenDelete({ userId, type: 'alphabet_particularite', id: p.id, label: `${p.titre} (particularité de l'Alphabet)`, data: p,
        children: [enfants, questions, messagesPremiers, messagesReponses], remove: () => untypedDb.from('alphabet_particularites').delete().eq('id', p.id) });
      toast.success('🗑️ Dans la corbeille (Paramètres › Corbeille pour la remettre)');
      rafraichir(); onClose();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm" level="nested">
        <DialogHeader>
          <DialogTitle>{p ? '✏️ Modifier la particularité' : '➕ Nouvelle particularité'}</DialogTitle>
          <DialogDescription>Le contenu (vidéo, textes, images, PDF…) se modifie dans la fiche, en la touchant.</DialogDescription>
        </DialogHeader>
        <label className="text-xs font-semibold" htmlFor="part-titre">Titre</label>
        <Input id="part-titre" value={titre} maxLength={60} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. : La chadda"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('part-arabe')?.focus(); } }} />
        <label className="text-xs font-semibold" htmlFor="part-arabe">Titre en arabe (facultatif)</label>
        <Input id="part-arabe" dir="rtl" className="font-arabic text-lg" value={arabe} maxLength={60} onChange={(e) => setArabe(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('part-emoji')?.focus(); } }} />
        <label className="text-xs font-semibold" htmlFor="part-emoji">Emoji</label>
        <Input id="part-emoji" value={emoji} maxLength={8} onChange={(e) => setEmoji(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void enregistrer(); } }} />
        <p className="text-xs font-semibold">Couleur</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(COULEURS).map(([k, c]) => (
            <button key={k} type="button" onClick={() => setCouleur(k)} aria-label={`Couleur ${k}`} aria-pressed={couleur === k}
              className={`h-8 w-8 rounded-full ${c.pastille} ${couleur === k ? 'ring-4 ring-offset-2 ring-primary' : ''}`} />
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-2 pt-1">
          {p && <Button type="button" variant="ghost" className="text-destructive" onClick={() => setSupprimer(true)}>🗑️ Supprimer</Button>}
          <Button type="button" className="ms-auto" disabled={saving} onClick={() => void enregistrer()}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </div>
        <ConfirmDeleteDialog open={supprimer} onOpenChange={setSupprimer} onConfirm={() => { setSupprimer(false); void mettreCorbeille(); }}
          title={`Supprimer « ${p?.titre ?? ''} » ?`}
          description={`Elle ira dans la corbeille de Paramètres avec tout son contenu (${blocs.filter((b) => b.particularite_id === p?.id).length} zone(s)), tu pourras la restaurer.`} />
      </DialogContent>
    </Dialog>
  );
}

/** Fiche d'une particularité : vidéo en haut, puis les zones de contenu ; ✏️ tout modifiable pour l'enseignante */
function FicheParticularite({ p, items, blocs, isAdmin, userId, onChange, onClose, rafraichir }: {
  p: Particularite; items: Particularite[]; blocs: Bloc[]; isAdmin: boolean; userId: string | null;
  onChange: (p: Particularite) => void; onClose: () => void; rafraichir: () => void;
}) {
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  const [ajout, setAjout] = useState<'texte' | 'fichier' | 'video_haut' | null>(null);
  const [texte, setTexte] = useState('');
  const [modifTexte, setModifTexte] = useState<Bloc | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [aSupprimer, setASupprimer] = useState<Bloc | null>(null);
  const rang = items.findIndex((i) => i.id === p.id);
  const avant = items[rang - 1], apres = items[rang + 1];
  const c = couleurDe(p.couleur);
  // La 1re zone vidéo s'affiche en haut, à la place de la grande lettre
  const videoHaut = useMemo(() => blocs.find(estVideo) ?? null, [blocs]);
  const reste = blocs.filter((b) => b.id !== videoHaut?.id);
  const minPos = Math.min(0, ...blocs.map((b) => b.position));
  const maxPos = Math.max(0, ...blocs.map((b) => b.position));

  const ajouterLigne = async (row: Partial<Bloc>, enHaut = false) => {
    const r = await ecrireOuGarder({ table: 'alphabet_particularite_blocs', op: 'insert', rows: [{ particularite_id: p.id, position: enHaut ? minPos - 10 : maxPos + 10, ...row }] });
    toast.success(r === 'en_attente' ? '📡 Gardé sur cet appareil, envoyé au retour du réseau' : 'Ajouté ✅');
    rafraichir();
  };
  const envoyerFichier = async (file: File, enHaut = false) => {
    if (horsLigne()) { toast.error('📡 Nécessite Internet pour envoyer un fichier'); return; }
    setEnvoi(true);
    try {
      const f = await envoyerFichierAlphabet(file, `particularites/${p.id}`);
      if (enHaut && f.kind !== 'video') { toast.error('Choisis un fichier vidéo pour la vidéo du haut'); return; }
      await ajouterLigne({ kind: f.kind, url: f.url, nom: f.nom }, enHaut);
      setAjout(null);
    } catch (e) { toast.error(errorMessage(e)); } finally { setEnvoi(false); }
  };
  const ajouterYoutube = async (url: string, enHaut = false) => {
    try { await ajouterLigne({ kind: 'youtube', url, nom: 'Vidéo YouTube' }, enHaut); setAjout(null); } catch (e) { toast.error(errorMessage(e)); }
  };
  const enregistrerTexte = async () => {
    if (!texte.trim()) return;
    try {
      if (modifTexte) {
        const r = await ecrireOuGarder({ table: 'alphabet_particularite_blocs', op: 'update', id: modifTexte.id, values: { texte: texte.trim() } });
        toast.success(r === 'en_attente' ? '📡 Gardé, envoyé au retour du réseau' : 'Modifié ✅');
        rafraichir();
      } else await ajouterLigne({ kind: 'texte', texte: texte.trim() });
      setTexte(''); setModifTexte(null); setAjout(null);
    } catch (e) { toast.error(errorMessage(e)); }
  };
  const rangerZones = async (n: Bloc[]) => {
    // La vidéo du haut garde sa place en tête
    const ids = [...(videoHaut ? [videoHaut.id] : []), ...n.map((b) => b.id)];
    try { await enregistrerOrdre('alphabet_particularite_blocs', ids); rafraichir(); } catch (e) { toast.error(errorMessage(e)); }
  };
  const mettreCorbeille = async (b: Bloc) => {
    if (!userId) return;
    try {
      await trashThenDelete({ userId, type: 'alphabet_particularite_bloc', id: b.id,
        label: `${b.kind === 'texte' ? 'Texte' : b.nom || 'Fichier'} (${p.titre})`, data: b,
        remove: () => untypedDb.from('alphabet_particularite_blocs').delete().eq('id', b.id) });
      toast.success('🗑️ Dans la corbeille (Paramètres)');
      rafraichir();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const outils = (b: Bloc) => isAdmin && (
    <div className="flex flex-wrap gap-1 justify-end">
      {b.kind === 'texte' && <Button size="sm" variant="outline" onClick={() => { setModifTexte(b); setTexte(b.texte || ''); setAjout('texte'); }}>✏️ Modifier</Button>}
      <Button size="sm" variant="outline" className="text-destructive" onClick={() => setASupprimer(b)} aria-label="Supprimer">🗑️</Button>
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[88vh] overflow-y-auto p-5 space-y-4">
          <DialogHeader className="mt-6 space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1">
              <div className="flex justify-start">
                {avant && <button type="button" onClick={() => onChange(avant)} className="rounded-full bg-muted px-2.5 py-1.5 text-xs font-bold [overflow-wrap:anywhere]">‹ {avant.titre}</button>}
              </div>
              <DialogTitle className="text-center text-lg font-extrabold [overflow-wrap:anywhere]">{p.emoji} {p.titre}</DialogTitle>
              <div className="flex justify-end">
                {apres && <button type="button" onClick={() => onChange(apres)} className="rounded-full bg-muted px-2.5 py-1.5 text-xs font-bold [overflow-wrap:anywhere]">{apres.titre} ›</button>}
              </div>
            </div>
            <DialogDescription className="sr-only">Vidéo et explications de la particularité</DialogDescription>
          </DialogHeader>

          {/* 🎬 La vidéo à la place de la grande lettre et du bouton « Écoute la lettre » */}
          {videoHaut ? (
            <div className="space-y-1.5">
              <VueBloc b={videoHaut} />
              {isAdmin && (
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="outline" onClick={() => setAjout('video_haut')}>🔁 Changer la vidéo</Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => setASupprimer(videoHaut)}>🗑️ Retirer</Button>
                </div>
              )}
            </div>
          ) : (
            <div className={`rounded-3xl bg-gradient-to-br ${c.bandeau} text-white p-5 text-center shadow-md space-y-1`}>
              <p className="text-5xl">{p.emoji || '✨'}</p>
              {p.titre_arabe && <p className="font-arabic text-4xl leading-snug" dir="rtl">{p.titre_arabe}</p>}
              {!isAdmin && reste.length > 0 && <p className="text-sm text-white/90">La vidéo arrive bientôt 🎬</p>}
              {isAdmin && <button type="button" onClick={() => setAjout('video_haut')} className="mt-2 rounded-full bg-white/90 text-slate-900 px-4 py-2 text-sm font-bold">🎬 Ajouter la vidéo du haut</button>}
            </div>
          )}

          {p.titre_arabe && videoHaut && <p className="font-arabic text-3xl text-center" dir="rtl">{p.titre_arabe}</p>}

          {isAdmin ? (
            // ✋ Appui long + glisser pour ranger les zones
            <SortableCardList items={reste} onReorder={(n) => void rangerZones(n)}
              renderItem={(b, drag) => {
                const { ref, style, isDragging, ...attrs } = drag;
                return (
                  <div key={b.id} ref={ref} style={style} {...attrs} className={`space-y-1.5 rounded-xl touch-manipulation ${isDragging ? 'opacity-50 ring-2 ring-sky-400' : ''}`}>
                    <VueBloc b={b} />
                    {outils(b)}
                  </div>
                );
              }} />
          ) : reste.map((b) => <div key={b.id}><VueBloc b={b} /></div>)}
          {/* 🎯 Évaluation (quiz modifiable) */}
          <QuizParticularite key={p.id} particuliereId={p.id} titre={p.titre} isAdmin={isAdmin} userId={userId} />

          {!reste.length && !isAdmin && !videoHaut && (
            <p className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 text-center font-semibold">🛠️ En cours de mise à jour pour cette leçon</p>
          )}

          {isAdmin && (ajout ? (
            <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <p className="flex-1 text-sm font-bold">{ajout === 'texte' ? (modifTexte ? '✏️ Modifier le texte' : '📝 Ajouter un texte') : ajout === 'video_haut' ? '🎬 Vidéo du haut' : '📎 Ajouter un fichier ou une vidéo'}</p>
                <button type="button" onClick={() => { setAjout(null); setModifTexte(null); setTexte(''); }} className="text-xs font-semibold text-muted-foreground">Fermer</button>
              </div>
              {ajout === 'texte' ? (
                <>
                  <TextareaDictee value={texte} onChange={(e) => setTexte(e.target.value)} rows={4} placeholder="Explication, exemple en arabe…" />
                  <Button type="button" onClick={() => void enregistrerTexte()} disabled={!texte.trim()}>💾 Enregistrer</Button>
                </>
              ) : (
                <>
                  {ajout === 'video_haut' && videoHaut && <p className="text-[11px] text-muted-foreground">La nouvelle vidéo passe en haut ; l'ancienne reste plus bas (retire-la si tu n'en veux plus, elle ira dans la corbeille).</p>}
                  <ContentUploadTabs isUploading={envoi}
                    accept={ajout === 'video_haut' ? 'video/*' : 'image/*,video/*,application/pdf,.pdf,.doc,.docx'}
                    libelleFichier={ajout === 'video_haut' ? 'Choisir une vidéo' : 'Image, vidéo, PDF…'}
                    onUploadFile={(f) => void envoyerFichier(f, ajout === 'video_haut')}
                    onAddYoutubeLink={(u) => void ajouterYoutube(u, ajout === 'video_haut')}
                    onUploadAudio={(f) => void envoyerFichier(f)} />
                  <p className="text-[11px] text-muted-foreground">Une vidéo envoyée en fichier reste visible sans Internet une fois regardée ; un lien YouTube a besoin d'Internet.</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setAjout('texte')}>📝 Ajouter un texte</Button>
              <Button type="button" variant="outline" onClick={() => setAjout('fichier')}>📎 Image, vidéo, PDF…</Button>
            </div>
          ))}

          {/* 💬 Commentaires / questions de la leçon (élèves et enseignante) */}
          <CommentairesParticularite key={`c-${p.id}`} particuliereId={p.id} titre={p.titre} isAdmin={isAdmin} userId={userId} />
        </div>
        <ScrollButtons showTop={showTop} showBottom={showBottom} onScrollTop={scrollToTop} onScrollBottom={scrollToBottom} position="absolute" />
        <ConfirmDeleteDialog open={!!aSupprimer} onOpenChange={(o) => !o && setASupprimer(null)}
          onConfirm={() => { const b = aSupprimer; setASupprimer(null); if (b) void mettreCorbeille(b); }}
          title="Retirer cette zone ?" description="Elle ira dans la corbeille de Paramètres, tu pourras la restaurer." />
      </DialogContent>
    </Dialog>
  );
}
