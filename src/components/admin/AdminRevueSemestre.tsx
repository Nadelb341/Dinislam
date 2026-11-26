import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn, errorMessage } from '@/lib/utils';

type Ligne = Tables<'revue_semestre'>;
const CLE = ['revue-semestre'];

/**
 * 🔄 2026-11-26 (Nadia : mises à jour de janvier et de juin, M2/M4) — bouclier › « 🔄 À revoir chaque semestre » :
 * tout ce qui peut changer d'une année à l'autre, avec sa source officielle (lien), la date « vérifié le » (modifiable)
 * et une case « fait ». Rappel automatique le 2 janvier et le 2 juin (fonction taches-automatiques).
 * Données en base (table revue_semestre, lecture et écriture réservées à l'enseignante). Hors ligne : la liste déjà vue
 * reste lisible, les changements sont gardés sur l'appareil puis envoyés au retour du réseau.
 * Une ligne cochée descend en bas, barrée ; elle ne part PAS à la corbeille (la liste resert chaque semestre) :
 * « Nouveau semestre » remet tout « à faire ».
 */
export function AdminRevueSemestre({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const { askValidation, validationDialog } = useConfirmValidation();
  const [edition, setEdition] = useState<Ligne | null>(null);
  const [nouveauSemestre, setNouveauSemestre] = useState(false);
  const { data: lignes = [], isLoading, error } = useQuery({
    queryKey: CLE,
    queryFn: async () => {
      const { data, error } = await supabase.from('revue_semestre').select('*').order('position');
      if (error) throw error;
      return data ?? [];
    },
  });

  const changer = async (l: Ligne, valeurs: Partial<Ligne>) => {
    const v = { ...valeurs, updated_at: new Date().toISOString() };
    queryClient.setQueryData<Ligne[]>(CLE, (old) => (old ?? []).map((x) => (x.id === l.id ? { ...x, ...v } : x)));
    try {
      const r = await ecrireOuGarder({ table: 'revue_semestre', op: 'update', id: l.id, values: v });
      if (r === 'en_attente') toast.info('📡 Gardé sur cet appareil : envoyé au retour du réseau');
      else void queryClient.invalidateQueries({ queryKey: CLE });
    } catch (e) { toast.error(errorMessage(e)); void queryClient.invalidateQueries({ queryKey: CLE }); }
  };
  const aujourdhui = new Date().toLocaleDateString('en-CA');
  const cocher = (l: Ligne) => {
    // Valider demande confirmation ; décocher, jamais (règle de Nadia)
    if (l.fait) { void changer(l, { fait: false }); return; }
    askValidation('C\'est vérifié ?', `« ${l.titre} » passe en « fait », vérifié le ${new Date(`${aujourdhui}T12:00:00`).toLocaleDateString('fr-FR')}.`,
      () => void changer(l, { fait: true, verifie_le: aujourdhui }));
  };
  const toutRemettre = async () => {
    for (const l of lignes.filter((x) => x.fait)) await changer(l, { fait: false });
    toast.success('🔄 Nouveau semestre : tout est « à faire »');
  };

  const triees = [...lignes].sort((a, b) => Number(a.fait) - Number(b.fait) || a.position - b.position);
  const faites = lignes.filter((l) => l.fait).length;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Button>
      <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-4 shadow">
        <h2 className="text-xl font-extrabold">🔄 À revoir chaque semestre</h2>
        <p className="text-sm opacity-90">En janvier et en juin, on relit chaque ligne sur sa source officielle. Rappel automatique le 2 janvier et le 2 juin.</p>
        <p className="text-sm font-bold mt-1">{faites} / {lignes.length} fait{faites > 1 ? 's' : ''}</p>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground text-center">Un instant…</p>}
      {error && <p className="text-sm text-destructive">{errorMessage(error)}</p>}
      <div className="space-y-2">
        {triees.map((l) => (
          <div key={l.id} className={cn('rounded-xl border-2 p-3 space-y-2', l.fait ? 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 opacity-80' : 'border-border bg-card')}>
            <div className="flex items-start gap-2">
              <button type="button" onClick={() => cocher(l)} aria-pressed={l.fait} aria-label={l.fait ? `Remettre « ${l.titre} » à faire` : `Marquer « ${l.titre} » comme fait`}
                className={cn('mt-0.5 h-6 w-6 shrink-0 rounded-md border-2 grid place-items-center text-sm font-black', l.fait ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/50')}>
                {l.fait ? '✓' : ''}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn('font-bold [overflow-wrap:anywhere]', l.fait && 'line-through')}>{l.titre}</p>
                {l.quoi && <p className="text-xs text-muted-foreground whitespace-pre-line [overflow-wrap:anywhere]">{l.quoi}</p>}
                {l.fichier && <p className="text-[11px] text-muted-foreground [overflow-wrap:anywhere]">📁 {l.fichier}</p>}
              </div>
              <button type="button" onClick={() => setEdition(l)} aria-label={`Modifier « ${l.titre} »`}
                className="h-8 w-8 shrink-0 grid place-items-center rounded-full border bg-card"><Pencil className="h-3.5 w-3.5" /></button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {l.source_url && (
                <a href={l.source_url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200 px-2.5 py-1 font-semibold [overflow-wrap:anywhere]">
                  🔗 {l.source_nom || 'Source officielle'} <span className="opacity-70">(📡 Internet)</span>
                </a>
              )}
              <label className="flex items-center gap-1.5 font-semibold">
                Vérifié le
                <input type="date" value={l.verifie_le ?? ''} onChange={(e) => void changer(l, { verifie_le: e.target.value || null })}
                  className="rounded-lg border bg-background px-2 py-1" />
              </label>
            </div>
          </div>
        ))}
      </div>
      {faites > 0 && (
        <Button variant="outline" className="w-full" onClick={() => setNouveauSemestre(true)}>↩️ Nouveau semestre : tout remettre « à faire »</Button>
      )}
      {validationDialog}
      <AlertDialog open={nouveauSemestre} onOpenChange={setNouveauSemestre}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tout remettre « à faire » ?</AlertDialogTitle>
            <AlertDialogDescription>{faites} ligne{faites > 1 ? 's' : ''} cochée{faites > 1 ? 's' : ''} redevien{faites > 1 ? 'nent' : 't'} « à faire ». Les dates « vérifié le » sont gardées.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => void toutRemettre()}>Tout remettre</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {edition && <EditionLigne ligne={edition} onClose={() => setEdition(null)} onSave={(v) => { void changer(edition, v); setEdition(null); }} />}
    </div>
  );
}

function EditionLigne({ ligne, onClose, onSave }: { ligne: Ligne; onClose: () => void; onSave: (v: Partial<Ligne>) => void }) {
  const [titre, setTitre] = useState(ligne.titre);
  const [quoi, setQuoi] = useState(ligne.quoi);
  const [sourceNom, setSourceNom] = useState(ligne.source_nom ?? '');
  const [sourceUrl, setSourceUrl] = useState(ligne.source_url ?? '');
  const enregistrer = () => {
    if (!titre.trim()) { toast.error('Écris un titre'); return; }
    const url = sourceUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) { toast.error('Le lien doit commencer par https://'); return; }
    onSave({ titre: titre.trim(), quoi: quoi.trim(), source_nom: sourceNom.trim() || null, source_url: url || null });
  };
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" level="nested">
        <DialogHeader>
          <DialogTitle>✏️ Modifier la ligne</DialogTitle>
          <DialogDescription>Titre, ce qu'il faut vérifier, et la source officielle.</DialogDescription>
        </DialogHeader>
        <label className="text-xs font-semibold" htmlFor="rs-titre">Titre</label>
        <Input id="rs-titre" value={titre} onChange={(e) => setTitre(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('rs-quoi')?.focus(); } }} />
        <label className="text-xs font-semibold" htmlFor="rs-quoi">Ce qu'il faut vérifier</label>
        <Textarea id="rs-quoi" rows={4} value={quoi} onChange={(e) => setQuoi(e.target.value)} />
        <label className="text-xs font-semibold" htmlFor="rs-snom">Nom de la source</label>
        <Input id="rs-snom" value={sourceNom} onChange={(e) => setSourceNom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('rs-surl')?.focus(); } }} />
        <label className="text-xs font-semibold" htmlFor="rs-surl">Lien de la source</label>
        <Input id="rs-surl" inputMode="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); enregistrer(); } }} />
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Fermer</Button>
          <Button className="flex-1" onClick={enregistrer}>Enregistrer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
