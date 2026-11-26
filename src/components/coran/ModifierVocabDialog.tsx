import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { supabase } from '@/integrations/supabase/client';
import { untypedDb } from '@/lib/untypedDb';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { collectChildren, moveToTrash, trashThenDelete } from '@/lib/trash';
import { envoyerFichierAlphabet, horsLigne } from '@/lib/alphabetMedias';
import { errorMessage } from '@/lib/utils';
import { cibleZones, type CarteVocab } from '@/lib/coranVocabulaire';
import { CLE_VOCAB } from '@/hooks/useCoranVocabulaire';
import { COULEURS_VOCAB } from '@/components/coran/couleursVocab';

/**
 * ✏️ Créer / modifier une sous-carte (titre, emoji, couleur, PDF entier) ou une partie (titre, pages, PDF) du
 * Vocabulaire du Coran, ou un chapitre d'une partie (titre + page dans le PDF de la partie, 2026-11-26) ;
 * 🗑️ la mettre à la corbeille avec ses parties, leurs chapitres et ses zones (restaurés d'un coup).
 * Hors ligne : titre / pages gardés et envoyés au retour du réseau ; un nouveau PDF demande Internet.
 */
export function ModifierVocabDialog({ carte, parentId, freres, userId, chapitre = false, onClose, onSupprimee }: {
  /** null = nouvelle carte */
  carte: CarteVocab | null;
  /** null = sous-carte du haut ; sinon l'id de la sous-carte (nouvelle partie) */
  parentId: string | null;
  freres: CarteVocab[];
  userId: string | null;
  /** true = un chapitre (enfant d'une partie) : titre + page dans le PDF de la partie, pas de PDF à lui */
  chapitre?: boolean;
  onClose: () => void;
  onSupprimee?: () => void;
}) {
  const queryClient = useQueryClient();
  const estSousCarte = (carte ? carte.parent_id : parentId) === null;
  const [titre, setTitre] = useState(carte?.titre ?? '');
  const [emoji, setEmoji] = useState(carte?.emoji ?? '📘');
  const [couleur, setCouleur] = useState(carte?.couleur ?? 'sky');
  const [debut, setDebut] = useState(carte?.page_debut ? String(carte.page_debut) : '');
  const [fin, setFin] = useState(carte?.page_fin ? String(carte.page_fin) : '');
  const [fichier, setFichier] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [supprimer, setSupprimer] = useState(false);
  const rafraichir = () => { void queryClient.invalidateQueries({ queryKey: CLE_VOCAB }); };

  const enregistrer = async () => {
    if (!titre.trim()) { toast.error('Écris un titre'); return; }
    if (chapitre && !debut.trim()) { toast.error('Écris la page du chapitre'); return; }
    const a = debut.trim() ? Number(debut) : null;
    const b = !chapitre && fin.trim() ? Number(fin) : null;
    if ((a !== null && (!Number.isInteger(a) || a < 1)) || (b !== null && (!Number.isInteger(b) || b < 1)) || (a !== null && b !== null && b < a)) {
      toast.error('Les pages ne sont pas bonnes (ex. : de 3 à 21)'); return;
    }
    if (fichier && !chapitre && horsLigne()) { toast.error('📡 Nécessite Internet pour envoyer un PDF'); return; }
    setSaving(true);
    try {
      let pdfUrl = carte?.pdf_url ?? null;
      if (fichier && !chapitre) {
        pdfUrl = (await envoyerFichierAlphabet(fichier, 'coran-vocabulaire')).url;
        // L'ancien PDF n'est jamais perdu : il part dans la corbeille (« Restaurer » le remet)
        if (carte?.pdf_url && userId) {
          const ok = await moveToTrash(userId, 'coran_vocabulaire_pdf', carte.id, `PDF de « ${carte.titre} » (Vocabulaire du Coran)`, { id: carte.id, pdf_url: carte.pdf_url });
          if (!ok) throw new Error("Mise en corbeille de l'ancien PDF impossible : rien n'a été changé");
        }
      }
      const valeurs: Record<string, unknown> = { titre: titre.trim(), pdf_url: pdfUrl, page_debut: a, page_fin: b, updated_at: new Date().toISOString() };
      if (estSousCarte) { valeurs.emoji = emoji.trim() || null; valeurs.couleur = couleur; }
      const r = carte
        ? await ecrireOuGarder({ table: 'coran_vocabulaire', op: 'update', id: carte.id, values: valeurs })
        : await ecrireOuGarder({ table: 'coran_vocabulaire', op: 'insert', rows: [{
          ...valeurs, id: crypto.randomUUID(), parent_id: parentId, position: (freres.at(-1)?.position ?? 0) + 10,
          // Une nouvelle sous-carte naît cachée aux élèves (Nadia l'ouvre avec « Afficher à »)
          ...(estSousCarte ? { mode: 'personne' } : {}),
        }] });
      toast.success(r === 'en_attente' ? '📡 Gardé sur cet appareil, envoyé au retour du réseau' : carte ? 'Modifié ✅' : 'Ajouté ✅');
      rafraichir(); onClose();
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };

  const mettreCorbeille = async () => {
    if (!carte || !userId) return;
    try {
      // Enfants (parties ou chapitres) PUIS petits-enfants (chapitres des parties) : la base les efface en cascade,
      // la corbeille doit donc tout garder, dans l'ordre où la restauration les remet (parent avant enfant).
      const parties = await collectChildren('coran_vocabulaire', 'parent_id', [carte.id]);
      const chapitres = await collectChildren('coran_vocabulaire', 'parent_id', parties.rows.map((r) => String(r.id)));
      const ids = [carte.id, ...parties.rows.map((r) => String(r.id)), ...chapitres.rows.map((r) => String(r.id))];
      const zones = await collectChildren('zones_contenu', 'cible', ids.map(cibleZones));
      await trashThenDelete({
        userId, type: 'coran_vocabulaire', id: carte.id, label: `${carte.titre} (Vocabulaire du Coran)`, data: carte,
        children: [parties, chapitres, zones],
        remove: async () => {
          const r1 = await supabase.from('coran_vocabulaire').delete().eq('id', carte.id);
          if (r1.error) return r1;
          // Les zones ne sont pas reliées par la base : on les retire nous-mêmes (elles sont déjà dans la corbeille)
          return zones.rows.length ? await untypedDb.from('zones_contenu').delete().in('cible', ids.map(cibleZones)) : { error: null };
        },
      });
      toast.success('🗑️ Dans la corbeille (Paramètres › Corbeille pour la remettre)');
      rafraichir(); onClose(); onSupprimee?.();
    } catch (e) { toast.error(horsLigne() ? '📡 Nécessite Internet pour supprimer' : errorMessage(e)); }
  };

  const focus = (id: string) => (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById(id)?.focus(); } };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{carte ? '✏️ Modifier' : estSousCarte ? '➕ Nouvelle sous-carte' : chapitre ? '➕ Nouveau chapitre' : '➕ Nouvelle partie'}</DialogTitle>
          <DialogDescription>{estSousCarte ? 'Le titre, l’emoji, la couleur et le PDF entier.' : chapitre ? 'Le titre du chapitre et sa page dans le PDF de la partie.' : 'Le titre, les pages et le PDF de cette partie.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-xs font-semibold" htmlFor="vocab-titre">Titre</label>
          <Input id="vocab-titre" value={titre} maxLength={140} onChange={(e) => setTitre(e.target.value)} onKeyDown={focus(estSousCarte ? 'vocab-emoji' : 'vocab-debut')} />
          {estSousCarte && (
            <>
              <label className="text-xs font-semibold" htmlFor="vocab-emoji">Emoji</label>
              <Input id="vocab-emoji" value={emoji} maxLength={8} onChange={(e) => setEmoji(e.target.value)} className="w-24 text-xl"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
              <p className="text-xs font-semibold">Couleur</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(COULEURS_VOCAB).map(([k, c]) => (
                  <button key={k} type="button" onClick={() => setCouleur(k)} aria-label={`Couleur ${k}`} aria-pressed={couleur === k}
                    className={`h-8 w-8 rounded-full bg-gradient-to-br ${c.degrade} ${couleur === k ? 'ring-4 ring-offset-2 ring-primary' : ''}`} />
                ))}
              </div>
            </>
          )}
          {chapitre ? (
            <>
              <label className="text-xs font-semibold pt-1 block" htmlFor="vocab-debut">Page dans le PDF de la partie (1 = première page)</label>
              <Input id="vocab-debut" inputMode="numeric" value={debut} onChange={(e) => setDebut(e.target.value.replace(/\D/g, ''))} className="w-24"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void enregistrer(); } }} />
            </>
          ) : (
          <>
          <p className="text-xs font-semibold pt-1">{estSousCarte ? 'Pages du PDF entier (facultatif)' : 'Pages dans le PDF entier (facultatif)'}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm">de</span>
            <Input id="vocab-debut" inputMode="numeric" value={debut} onChange={(e) => setDebut(e.target.value.replace(/\D/g, ''))} className="w-20" onKeyDown={focus('vocab-fin')} />
            <span className="text-sm">à</span>
            <Input id="vocab-fin" inputMode="numeric" value={fin} onChange={(e) => setFin(e.target.value.replace(/\D/g, ''))} className="w-20"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void enregistrer(); } }} />
          </div>
          <p className="text-xs font-semibold pt-1">{estSousCarte ? 'PDF entier' : 'PDF de la partie'}</p>
          {carte?.pdf_url && !fichier && <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">📄 {decodeURIComponent(carte.pdf_url.split('/').pop() || '')}</p>}
          <label className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-primary/50 px-3 py-2 text-sm font-semibold text-primary cursor-pointer hover:bg-primary/5">
            📎 {fichier ? fichier.name : carte?.pdf_url ? 'Remplacer le PDF' : 'Choisir un PDF'}
            <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => setFichier(e.target.files?.[0] ?? null)} />
          </label>
          {fichier && <p className="text-[11px] text-muted-foreground">📡 L’envoi du PDF nécessite Internet{carte?.pdf_url ? ' ; l’ancien PDF ira dans la corbeille.' : '.'}</p>}
          </>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {carte ? (
            <Button variant="outline" className="text-destructive border-destructive/40" onClick={() => setSupprimer(true)}>
              <Trash2 className="h-4 w-4 mr-1" /> Supprimer
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={() => void enregistrer()} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </DialogFooter>
        <ConfirmDeleteDialog open={supprimer} onOpenChange={setSupprimer} onConfirm={() => { setSupprimer(false); void mettreCorbeille(); }}
          title={`Supprimer « ${carte?.titre ?? ''} » ?`}
          description={estSousCarte ? 'La sous-carte, toutes ses parties, leurs chapitres et leurs contenus vont dans la corbeille de Paramètres (restaurables d’un coup).' : chapitre ? 'Le chapitre va dans la corbeille de Paramètres (restaurable).' : 'La partie, ses chapitres et son contenu vont dans la corbeille de Paramètres (restaurables d’un coup).'} />
      </DialogContent>
    </Dialog>
  );
}
