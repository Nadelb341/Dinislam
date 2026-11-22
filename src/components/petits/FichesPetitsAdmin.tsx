import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import { SortableCardList } from '@/components/shared/SortableCardList';
import { untypedDb } from '@/lib/untypedDb';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { collectChildren, trashThenDelete } from '@/lib/trash';
import { enregistrerOrdre, envoyerFichierAlphabet, horsLigne } from '@/lib/alphabetMedias';
import { errorMessage } from '@/lib/utils';
import { ecouterFiche, RUBRIQUES, type CleRubrique } from '@/lib/petits';
import type { FichePetit } from '@/hooks/usePetits';

/**
 * ✏️ Côté enseignante : les fiches d'une rubrique des petits. Ajouter, modifier (titre, arabe, petite phrase, emoji,
 * image, ta voix, versets), ranger (✋ appui long + glisser), supprimer (corbeille, avec ses zones de contenu).
 */
export function GererFichesPetits({ rubrique, fiches, userId }: { rubrique: CleRubrique; fiches: FichePetit[]; userId: string | null }) {
  const queryClient = useQueryClient();
  const [edition, setEdition] = useState<FichePetit | 'nouvelle' | null>(null);
  const rafraichir = () => void queryClient.invalidateQueries({ queryKey: ['petits-fiches'] });
  return (
    <details className="rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white p-3 shadow">
      <summary className="font-bold cursor-pointer">✏️ Gérer les fiches ({fiches.length})</summary>
      <p className="text-xs text-muted-foreground mt-1">✋ Appui long puis glisser pour ranger. Les enfants voient le même ordre.</p>
      <div className="mt-2 space-y-1.5">
        <SortableCardList items={fiches} onReorder={(n) => {
          queryClient.setQueryData<FichePetit[]>(['petits-fiches'], (old) => old?.map((f) => { const i = n.findIndex((x) => x.id === f.id); return i < 0 ? f : { ...f, position: (i + 1) * 10 }; }));
          void enregistrerOrdre('petits_fiches', n.map((f) => f.id)).then(rafraichir, (e) => toast.error(errorMessage(e)));
        }}
          renderItem={(f, drag) => {
            const { ref, style, isDragging, ...attrs } = drag;
            return (
              <div key={f.id} ref={ref} style={style} {...attrs} className={`flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 touch-manipulation ${isDragging ? 'opacity-50 ring-2 ring-sky-400' : ''}`}>
                <span className="text-2xl">{f.emoji || '⭐'}</span>
                <span className="flex-1 min-w-0 text-sm font-semibold [overflow-wrap:anywhere]">{f.titre}</span>
                <Button size="sm" variant="outline" onClick={() => setEdition(f)} onPointerDown={(e) => e.stopPropagation()} aria-label={`Modifier ${f.titre}`}>✏️</Button>
              </div>
            );
          }} />
        <Button variant="outline" className="w-full" onClick={() => setEdition('nouvelle')}>➕ Ajouter une fiche</Button>
      </div>
      {edition && <EditionFichePetit rubrique={rubrique} fiche={edition === 'nouvelle' ? null : edition} fiches={fiches} userId={userId}
        onClose={() => setEdition(null)} rafraichir={rafraichir} />}
    </details>
  );
}

export function EditionFichePetit({ rubrique, fiche, fiches, userId, onClose, rafraichir }: {
  rubrique: CleRubrique; fiche: FichePetit | null; fiches: FichePetit[]; userId: string | null; onClose: () => void; rafraichir: () => void;
}) {
  const [titre, setTitre] = useState(fiche?.titre ?? '');
  const [arabe, setArabe] = useState(fiche?.arabe ?? '');
  const [texte, setTexte] = useState(fiche?.texte ?? '');
  const [emoji, setEmoji] = useState(fiche?.emoji ?? '⭐');
  const [versets, setVersets] = useState((fiche?.versets ?? []).join('\n'));
  const [image, setImage] = useState(fiche?.image_url ?? null);
  const [audio, setAudio] = useState(fiche?.audio_url ?? null);
  const [envoi, setEnvoi] = useState<'image' | 'audio' | null>(null);
  const [saving, setSaving] = useState(false);
  const [supprimer, setSupprimer] = useState(false);
  const fichierImage = useRef<HTMLInputElement>(null);
  const fichierSon = useRef<HTMLInputElement>(null);
  useEffect(() => { document.getElementById('pf-titre')?.focus(); }, []);

  const envoyer = async (f: File, genre: 'image' | 'audio') => {
    if (horsLigne()) { toast.error('📡 Nécessite Internet pour envoyer un fichier'); return; }
    setEnvoi(genre);
    try {
      const r = await envoyerFichierAlphabet(f, `petits/${rubrique}`);
      if (genre === 'image' && r.kind !== 'image') throw new Error('Choisis une image');
      if (genre === 'audio' && r.kind !== 'audio') throw new Error('Choisis un fichier son');
      if (genre === 'image') setImage(r.url); else setAudio(r.url);
      toast.success(genre === 'image' ? '🖼️ Image prête : touche Enregistrer' : '🎙️ Son prêt : touche Enregistrer');
    } catch (e) { toast.error(errorMessage(e)); } finally { setEnvoi(null); }
  };

  const enregistrer = async () => {
    if (!titre.trim()) { toast.error('Écris un titre'); return; }
    setSaving(true);
    try {
      const valeurs = {
        titre: titre.trim(), arabe: arabe.trim() || null, texte: texte.trim() || null, emoji: emoji.trim() || null,
        image_url: image, audio_url: audio, updated_at: new Date().toISOString(),
        ...(rubrique === 'coran' ? { versets: versets.split('\n').map((v) => v.trim()).filter(Boolean) } : {}),
      };
      const r = fiche
        ? await ecrireOuGarder({ table: 'petits_fiches', op: 'update', id: fiche.id, values: valeurs })
        : await ecrireOuGarder({ table: 'petits_fiches', op: 'insert', rows: [{ ...valeurs, rubrique, position: Math.max(0, ...fiches.map((f) => f.position)) + 10 }] });
      toast.success(r === 'en_attente' ? '📡 Gardé sur cet appareil, envoyé au retour du réseau' : fiche ? 'Modifiée ✅' : 'Fiche ajoutée ✅');
      rafraichir(); onClose();
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };

  const mettreCorbeille = async () => {
    if (!fiche || !userId) return;
    try {
      const zones = await collectChildren('zones_contenu', 'cible', [`petits:${fiche.id}`]);
      const quiz = await collectChildren('petits_quiz', 'fiche_id', [fiche.id]);
      const videos = await collectChildren('histoires_videos', 'fiche_id', [fiche.id]);
      await trashThenDelete({ userId, type: 'petits_fiche', id: fiche.id, label: `${fiche.titre} (${RUBRIQUES[rubrique].titre}, accueil des petits)`, data: fiche,
        children: [zones, quiz, videos], remove: () => untypedDb.from('petits_fiches').delete().eq('id', fiche.id) });
      toast.success('🗑️ Dans la corbeille (Paramètres)');
      rafraichir(); onClose();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto" level="nested">
        <DialogHeader>
          <DialogTitle>{fiche ? '✏️ Modifier la fiche' : '➕ Nouvelle fiche'} · {RUBRIQUES[rubrique].titre}</DialogTitle>
          <DialogDescription>Ta voix est prioritaire : sans fichier son, l'appareil lit le texte arabe (ou le titre).</DialogDescription>
        </DialogHeader>
        <label className="text-xs font-semibold" htmlFor="pf-titre">Titre</label>
        <Input id="pf-titre" value={titre} maxLength={80} onChange={(e) => setTitre(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('pf-arabe')?.focus(); } }} />
        <label className="text-xs font-semibold" htmlFor="pf-arabe">En arabe (facultatif)</label>
        <Input id="pf-arabe" dir="rtl" className="font-arabic text-xl" value={arabe} maxLength={300} onChange={(e) => setArabe(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('pf-emoji')?.focus(); } }} />
        <label className="text-xs font-semibold" htmlFor="pf-emoji">Emoji (si pas d'image)</label>
        <Input id="pf-emoji" value={emoji} maxLength={12} onChange={(e) => setEmoji(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void enregistrer(); } }} />
        <label className="text-xs font-semibold" htmlFor="pf-texte">Petite phrase / histoire</label>
        <TextareaDictee id="pf-texte" rows={rubrique === 'histoires' ? 8 : 3} value={texte} onChange={(e) => setTexte(e.target.value)} />
        {rubrique === 'coran' && (
          <>
            <label className="text-xs font-semibold" htmlFor="pf-versets">Versets (un par ligne)</label>
            <textarea id="pf-versets" dir="rtl" rows={6} className="w-full rounded-lg border bg-background p-2 font-arabic text-lg" value={versets} onChange={(e) => setVersets(e.target.value)} />
          </>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {image ? <img src={image} alt="" className="h-14 w-14 rounded-xl object-cover" /> : <span className="h-14 w-14 rounded-xl bg-muted grid place-items-center text-3xl">{emoji || '⭐'}</span>}
          <Button type="button" size="sm" variant="outline" disabled={!!envoi} onClick={() => fichierImage.current?.click()}>{envoi === 'image' ? 'Envoi…' : image ? '🔁 Image' : '🖼️ Image'}</Button>
          {image && <Button type="button" size="sm" variant="outline" onClick={() => setImage(null)}>Retirer l'image</Button>}
          <input ref={fichierImage} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void envoyer(f, 'image'); }} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={!!envoi} onClick={() => fichierSon.current?.click()}>{envoi === 'audio' ? 'Envoi…' : audio ? '🔁 Changer ta voix' : '🎙️ Ajouter ta voix'}</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => ecouterFiche({ audio_url: audio, arabe: arabe || null, titre })}>🔊 Écouter</Button>
          {audio && <Button type="button" size="sm" variant="outline" onClick={() => setAudio(null)}>Retirer ta voix</Button>}
          <input ref={fichierSon} type="file" accept="audio/*" capture className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void envoyer(f, 'audio'); }} />
        </div>
        <div className="flex flex-wrap justify-between gap-2 pt-1">
          {fiche && <Button type="button" variant="ghost" className="text-destructive" onClick={() => setSupprimer(true)}>🗑️ Supprimer</Button>}
          <Button type="button" className="ms-auto" disabled={saving || !!envoi} onClick={() => void enregistrer()}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </div>
        <p className="text-[11px] text-muted-foreground">Pour ajouter une vidéo, d'autres images ou un PDF : ouvre la fiche, en bas « Ajouter ».</p>
        <ConfirmDeleteDialog open={supprimer} onOpenChange={setSupprimer} onConfirm={() => { setSupprimer(false); void mettreCorbeille(); }}
          title={`Supprimer « ${fiche?.titre ?? ''} » ?`} description="Elle ira dans la corbeille de Paramètres avec son contenu ; tu pourras la restaurer." />
      </DialogContent>
    </Dialog>
  );
}
