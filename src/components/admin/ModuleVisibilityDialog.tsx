import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { rafraichirCartes, useCartesAcces } from '@/hooks/useCartesAcces';
import { elevesQuiVoient, type Acces, type Mode } from '@/lib/cartesAcces';
import { ChoixQuiVoit } from '@/components/admin/ChoixQuiVoit';
import { enregistrerAcces } from '@/lib/cartesAccesEnregistrer';

/**
 * « Afficher à… » d'une carte (menu ⋮ de l'accueil et page 🗂️ Qui voit quoi).
 * 2026-11-11 (Nadia, idées 1 et 5) : 🌍 Tout le monde / 🎯 Certains (groupes ET élèves ensemble) / 🔒 Personne,
 * + ⏰ dates d'ouverture facultatives. Enregistrement : `enregistrerAcces` (journal, notification, hors ligne).
 */
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  module: { id: string; title: string } | null;
  onSaved?: () => void;
}

/** 'AAAA-MM-JJ' (jour local) ↔ date ISO ; la fin est exclue : « jusqu'au 20 » = fermée le 21 à 0 h */
const versJour = (iso: string | null | undefined, fin = false) => {
  if (!iso) return '';
  const d = new Date(Date.parse(iso) - (fin ? 1 : 0));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const versIso = (jour: string, fin = false) => {
  if (!jour) return null;
  const d = new Date(`${jour}T00:00:00`);
  if (fin) d.setDate(d.getDate() + 1);
  return d.toISOString();
};

const ModuleVisibilityDialog = ({ open, onOpenChange, module, onSaved }: Props) => {
  const queryClient = useQueryClient();
  const { cartes, groupes, eleves, isLoading, nomGroupe, nomEleve } = useCartesAcces(open);
  const carte = cartes.find((c) => c.id === module?.id);
  const [mode, setMode] = useState<Mode>('tous');
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [du, setDu] = useState('');
  const [jusqua, setJusqua] = useState('');
  const [saving, setSaving] = useState(false);
  const [pret, setPret] = useState(false);

  // Remplir une seule fois à l'ouverture (les cases cochées ne sont jamais écrasées par le direct)
  useEffect(() => { if (!open) setPret(false); }, [open]);
  useEffect(() => {
    if (!open || pret || !carte) return;
    setMode(carte.acces.mode); setGroupIds(carte.acces.groupes); setUserIds(carte.acces.eleves);
    setDu(versJour(carte.ouverte_du)); setJusqua(versJour(carte.ouverte_jusquau, true)); setPret(true);
  }, [open, pret, carte]);

  const apres: Acces = mode === 'certains'
    ? (groupIds.length || userIds.length ? { mode, groupes: groupIds, eleves: userIds } : { mode: 'personne', groupes: [], eleves: [] })
    : { mode, groupes: [], eleves: [] };
  const periode = { ouverte_du: versIso(du), ouverte_jusquau: versIso(jusqua, true) };
  const verront = carte ? elevesQuiVoient({ is_active: apres.mode === 'tous', ...periode }, apres, eleves).size : 0;
  const verraientSansDate = carte ? elevesQuiVoient({ is_active: apres.mode === 'tous' }, apres, eleves).size : 0;

  const handleSave = async () => {
    if (!carte) return;
    if (mode === 'certains' && !groupIds.length && !userIds.length) { toast.error('Coche au moins un groupe ou un élève'); return; }
    if (du && jusqua && jusqua < du) { toast.error('La date de fermeture est avant la date d\'ouverture'); return; }
    setSaving(true);
    try {
      const r = await enregistrerAcces({ carte, avant: carte.acces, apres, periode, eleves, nomGroupe, nomEleve });
      if (r === 'en_attente') toast.info('📡 Hors connexion : changement gardé sur cet appareil, il partira au retour du réseau');
      else if (r === 'ok') toast.success('Enregistré ✅');
      rafraichirCartes(queryClient);
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(`Pas enregistré : ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Qui voit <span className="text-primary">{module?.title}</span> ?</DialogTitle>
          <DialogDescription className="sr-only">Choisir les groupes et les élèves qui voient cette carte</DialogDescription>
        </DialogHeader>

        {isLoading || !carte ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Chargement…</div>
        ) : (
          <div className="space-y-4">
            <ChoixQuiVoit mode={mode} setMode={setMode} groupIds={groupIds} setGroupIds={setGroupIds} userIds={userIds} setUserIds={setUserIds}
              groupes={groupes} eleves={eleves} />

            {mode !== 'personne' && (
              <div className="border rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">⏰ Dates (facultatif)</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs space-y-1"><span>Ouvrir le</span>
                    <Input id="visibilite-du" type="date" value={du} onChange={(e) => setDu(e.target.value)} className="h-9" /></label>
                  <label className="text-xs space-y-1"><span>Ouverte jusqu'au</span>
                    <Input id="visibilite-jusqua" type="date" value={jusqua} onChange={(e) => setJusqua(e.target.value)} className="h-9" /></label>
                </div>
                {(du || jusqua) && <button type="button" className="text-xs text-muted-foreground underline" onClick={() => { setDu(''); setJusqua(''); }}>Effacer les dates</button>}
                <p className="text-[11px] text-muted-foreground">Le jour d'ouverture, les élèves concernés reçoivent une notification.</p>
              </div>
            )}

            <p className="text-sm bg-muted rounded-xl px-4 py-3">
              👀 <strong>{verront}</strong> élève{verront > 1 ? 's' : ''} sur {eleves.length} la voi{verront > 1 ? 'ent' : 't'} aujourd'hui
              {verront !== verraientSansDate && <> (<strong>{verraientSansDate}</strong> pendant la période choisie)</>}.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving || isLoading || !carte}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleVisibilityDialog;
