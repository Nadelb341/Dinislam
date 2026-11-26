import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChoixQuiVoit } from '@/components/admin/ChoixQuiVoit';
import { useCartesAcces } from '@/hooks/useCartesAcces';
import { elevesQuiVoient, type Mode } from '@/lib/cartesAcces';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { accesVocab, type CarteVocab } from '@/lib/coranVocabulaire';
import { CLE_VOCAB } from '@/hooks/useCoranVocabulaire';

/**
 * 👁️ « Afficher à : » d'une sous-carte du Vocabulaire du Coran (Nadia, 2026-11-26) : EXACTEMENT les choix de
 * « Qui voit <carte> ? » (🌍 Tout le monde / 🎯 Certains : groupes + élèves en plus / 🔒 Personne), même composant
 * `ChoixQuiVoit`, même stockage que les onglets de l'Alphabet (mode + group_ids + user_ids).
 * Hors ligne : gardé sur l'appareil et envoyé au retour du réseau.
 */
export function AccesVocabDialog({ carte, onClose }: { carte: CarteVocab | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { groupes, eleves, isLoading } = useCartesAcces(!!carte);
  const [mode, setMode] = useState<Mode>('tous');
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Rempli une seule fois à l'ouverture (le direct n'écrase pas les cases cochées)
  useEffect(() => {
    if (!carte) return;
    const a = accesVocab(carte);
    setMode(a.mode); setGroupIds(a.groupes); setUserIds(a.eleves);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seulement à l'ouverture
  }, [carte?.id]);

  const apres = mode === 'certains' && !groupIds.length && !userIds.length ? { mode: 'personne' as Mode, groupes: [], eleves: [] }
    : { mode, groupes: mode === 'certains' ? groupIds : [], eleves: mode === 'certains' ? userIds : [] };
  const verront = elevesQuiVoient({ is_active: apres.mode === 'tous' }, apres, eleves).size;

  const enregistrer = async () => {
    if (!carte) return;
    if (mode === 'certains' && !groupIds.length && !userIds.length) { toast.error('Coche au moins un groupe ou un élève'); return; }
    setSaving(true);
    const valeurs = { mode: apres.mode, group_ids: apres.groupes, user_ids: apres.eleves, updated_at: new Date().toISOString() };
    // Affichage tout de suite (même sans réseau)
    queryClient.setQueriesData<CarteVocab[]>({ queryKey: CLE_VOCAB }, (old) => (old || []).map((c) => (c.id === carte.id ? { ...c, ...valeurs } : c)));
    try {
      const r = await ecrireOuGarder({ table: 'coran_vocabulaire', op: 'update', id: carte.id, values: valeurs });
      toast.success(r === 'en_attente' ? '📡 Hors connexion : gardé sur cet appareil, envoyé au retour du réseau' : 'Enregistré ✅');
      onClose();
    } catch (e) {
      toast.error(`Pas enregistré : ${(e as Error).message}`);
      void queryClient.invalidateQueries({ queryKey: CLE_VOCAB });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={!!carte} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md w-full rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base [overflow-wrap:anywhere]">Qui voit <span className="text-primary">{carte?.emoji} {carte?.titre}</span> ?</DialogTitle>
          <DialogDescription className="sr-only">Choisir les groupes et les élèves qui voient cette sous-carte</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Chargement…</div>
        ) : (
          <div className="space-y-4">
            <ChoixQuiVoit mode={mode} setMode={setMode} groupIds={groupIds} setGroupIds={setGroupIds} userIds={userIds} setUserIds={setUserIds}
              groupes={groupes} eleves={eleves} quoi="la sous-carte" />
            <p className="text-sm bg-muted rounded-xl px-4 py-3">
              👀 <strong>{verront}</strong> élève{verront > 1 ? 's' : ''} sur {eleves.length} la voi{verront > 1 ? 'ent' : 't'}.
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
