import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChoixQuiVoit } from '@/components/admin/ChoixQuiVoit';
import { useCartesAcces } from '@/hooks/useCartesAcces';
import { elevesQuiVoient, type Mode } from '@/lib/cartesAcces';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { accesOnglet, ONGLETS_ALPHABET, type LigneOnglet, type OngletAlphabet } from '@/lib/alphabetOnglets';

/**
 * ✏️ « Affiché à » d'un onglet de l'Alphabet (Nadia, 2026-11-21) : mêmes choix que « Qui voit » d'une carte
 * (Tout le monde / Certains : groupes + élèves / Personne). Hors ligne : gardé et envoyé au retour du réseau.
 */
export function AccesOngletDialog({ cle, lignes, onClose }: { cle: OngletAlphabet | null; lignes: LigneOnglet[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { groupes, eleves, isLoading } = useCartesAcces(!!cle);
  const [mode, setMode] = useState<Mode>('tous');
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const onglet = ONGLETS_ALPHABET.find((o) => o.cle === cle);

  // Rempli une seule fois à l'ouverture
  useEffect(() => {
    if (!cle) return;
    const a = accesOnglet(lignes.find((l) => l.cle === cle));
    setMode(a.mode); setGroupIds(a.groupes); setUserIds(a.eleves);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seulement à l'ouverture (le direct n'écrase pas les cases cochées)
  }, [cle]);

  const apres = mode === 'certains' && !groupIds.length && !userIds.length ? { mode: 'personne' as Mode, groupes: [], eleves: [] }
    : { mode, groupes: mode === 'certains' ? groupIds : [], eleves: mode === 'certains' ? userIds : [] };
  const verront = elevesQuiVoient({ is_active: apres.mode === 'tous' }, apres, eleves).size;

  const enregistrer = async () => {
    if (!cle) return;
    if (mode === 'certains' && !groupIds.length && !userIds.length) { toast.error('Coche au moins un groupe ou un élève'); return; }
    setSaving(true);
    const ligne = { cle, mode: apres.mode, group_ids: apres.groupes, user_ids: apres.eleves, updated_at: new Date().toISOString() };
    // Affichage tout de suite (même sans réseau)
    queryClient.setQueryData<LigneOnglet[]>(['alphabet-onglets'], (old) => [...(old || []).filter((l) => l.cle !== cle), ligne]);
    try {
      const r = await ecrireOuGarder({ table: 'alphabet_onglets', op: 'upsert', rows: [ligne] });
      toast.success(r === 'en_attente' ? '📡 Hors connexion : gardé sur cet appareil, envoyé au retour du réseau' : 'Enregistré ✅');
      onClose();
    } catch (e) {
      toast.error(`Pas enregistré : ${(e as Error).message}`);
      void queryClient.invalidateQueries({ queryKey: ['alphabet-onglets'] });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={!!cle} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md w-full rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Onglet <span className="text-primary">{onglet?.emoji} {onglet?.titre}</span> : affiché à…</DialogTitle>
          <DialogDescription className="sr-only">Choisir les groupes et les élèves qui voient cet onglet</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Chargement…</div>
        ) : (
          <div className="space-y-4">
            <ChoixQuiVoit mode={mode} setMode={setMode} groupIds={groupIds} setGroupIds={setGroupIds} userIds={userIds} setUserIds={setUserIds}
              groupes={groupes} eleves={eleves} quoi="l'onglet" />
            <p className="text-sm bg-muted rounded-xl px-4 py-3">
              👀 <strong>{verront}</strong> élève{verront > 1 ? 's' : ''} sur {eleves.length} le voi{verront > 1 ? 'ent' : 't'}.
            </p>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => void enregistrer()} disabled={saving || isLoading}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
