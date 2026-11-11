import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { matiereOf } from '@/lib/devoirMatieres';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { titreEtEtapes } from '@/lib/devoirsEleve';
import { BoutonDictee } from '@/components/shared/BoutonDictee';
import { ajouterDicte } from '@/lib/dictee';

/** Ce qu'il faut d'un devoir déjà donné pour le modifier */
export interface DevoirAModifier {
  id: string; titre: string; type: string; etapes: unknown; date_limite: string | null; audio_requis: boolean | null; matiere_label: string | null;
}

const versJour = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-CA') : '');

/**
 * ✏️ Modifier un devoir déjà donné (Nadia, 2026-11-11) : ses lignes, l'audio demandé, la date à rendre.
 * L'élève voit le changement tout de suite (en direct). Sans réseau : gardé sur l'appareil, envoyé au retour.
 */
export function ModifierDevoirDialog({ devoir, nomEleve, onClose }: { devoir: DevoirAModifier | null; nomEleve: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [lignes, setLignes] = useState<string[]>([]);
  const [audio, setAudio] = useState(false);
  const [jour, setJour] = useState('');
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!devoir) return;
    const etapes = Array.isArray(devoir.etapes) ? (devoir.etapes as unknown[]).map(String) : [];
    setLignes(etapes.length ? etapes : [devoir.titre]);
    setAudio(!!devoir.audio_requis);
    setJour(versJour(devoir.date_limite));
  }, [devoir]);

  if (!devoir) return null;
  const nomMatiere = devoir.matiere_label || matiereOf(devoir.type).label;
  const avant = Array.isArray(devoir.etapes) ? (devoir.etapes as unknown[]).length : 0;
  const pleines = lignes.filter((l) => l.trim()).length;

  const enregistrer = async () => {
    const { titre, etapes } = titreEtEtapes(lignes, nomMatiere);
    if (!titre) { toast.error('Écris au moins une ligne'); return; }
    // La date garde l'heure d'origine (heure du cours) ; seule la journée change
    let date_limite = devoir.date_limite;
    if (jour && jour !== versJour(devoir.date_limite)) {
      const d = devoir.date_limite ? new Date(devoir.date_limite) : new Date(`${jour}T18:00:00`);
      const [a, m, j] = jour.split('-').map(Number);
      d.setFullYear(a, m - 1, j);
      date_limite = d.toISOString();
    } else if (!jour) date_limite = null;
    setEnvoi(true);
    try {
      const r = await ecrireOuGarder({ table: 'devoirs', op: 'update', id: devoir.id, values: { titre, etapes, audio_requis: audio, date_limite } });
      // Moins d'étapes qu'avant : les cases cochées en trop n'ont plus de ligne (sinon le diamant compterait faux)
      if (r === 'ok' && etapes.length < avant) {
        await supabase.from('devoir_steps').delete().eq('devoir_id', devoir.id).gt('step', etapes.length);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs'] });
      toast.success(r === 'ok' ? `✏️ Devoir de ${nomEleve} modifié` : '📡 Modifié sur cet appareil : envoyé dès le retour du réseau');
      onClose();
    } catch (e) {
      toast.error('Erreur : ' + (e as Error).message);
    } finally { setEnvoi(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto" level="nested">
        <DialogTitle>✏️ Modifier le devoir</DialogTitle>
        <DialogDescription>{matiereOf(devoir.type).emoji} {nomMatiere} · {nomEleve}</DialogDescription>
        <div className="space-y-2">
          {lignes.map((l, i) => (
            <div key={i} className="flex items-start gap-2">
              {lignes.length > 1 && <span className="pt-2 text-sm font-bold text-muted-foreground">{i + 1}.</span>}
              <Textarea value={l} rows={2} className="flex-1" aria-label={`Ligne ${i + 1}`}
                onChange={(e) => setLignes((x) => x.map((y, k) => (k === i ? e.target.value : y)))} />
              <BoutonDictee className="mt-1" onTexte={(t) => setLignes((x) => x.map((y, k) => (k === i ? ajouterDicte(y, t) : y)))} />
              {lignes.length > 1 && (
                <button type="button" aria-label={`Retirer la ligne ${i + 1}`} onClick={() => setLignes((x) => x.filter((_, k) => k !== i))}
                  className="mt-1 h-8 w-8 shrink-0 rounded-full bg-[#EF4444] text-white font-bold">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setLignes((x) => [...x, ''])}
            className="rounded-full border border-sky-300 bg-sky-50 dark:bg-sky-950/40 px-3 py-1 text-xs font-extrabold text-sky-800 dark:text-sky-200">➕ Une autre ligne</button>
          <p className="text-[11px] font-semibold text-sky-800 dark:text-sky-300">
            💎 {pleines > 1 ? `1 diamant « ${nomMatiere} » avec ${pleines} étapes à cocher` : `1 diamant « ${nomMatiere} »`}
          </p>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={audio} onChange={(e) => setAudio(e.target.checked)} className="h-5 w-5 accent-orange-500" /> 🎙️ Audio demandé
          </label>
          <label className="block text-sm font-semibold">📅 À rendre pour le
            <Input type="date" value={jour} onChange={(e) => setJour(e.target.value)} className="mt-1" />
          </label>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button className="flex-1" disabled={envoi} onClick={() => void enregistrer()}>{envoi ? '⏳ …' : '✅ Enregistrer'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
