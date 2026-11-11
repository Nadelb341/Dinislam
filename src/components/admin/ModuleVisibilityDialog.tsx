import { useEffect, useState } from 'react';
import { groupColorProps } from '@/lib/studentGroups';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { rafraichirCartes, useCartesAcces } from '@/hooks/useCartesAcces';
import { elevesQuiVoient, raisonAcces, type Acces, type Mode } from '@/lib/cartesAcces';
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
  const [cherche, setCherche] = useState('');
  const [saving, setSaving] = useState(false);
  const [pret, setPret] = useState(false);

  // Remplir une seule fois à l'ouverture (les cases cochées ne sont jamais écrasées par le direct)
  useEffect(() => { if (!open) setPret(false); }, [open]);
  useEffect(() => {
    if (!open || pret || !carte) return;
    setMode(carte.acces.mode); setGroupIds(carte.acces.groupes); setUserIds(carte.acces.eleves);
    setDu(versJour(carte.ouverte_du)); setJusqua(versJour(carte.ouverte_jusquau, true)); setCherche(''); setPret(true);
  }, [open, pret, carte]);

  const apres: Acces = mode === 'certains'
    ? (groupIds.length || userIds.length ? { mode, groupes: groupIds, eleves: userIds } : { mode: 'personne', groupes: [], eleves: [] })
    : { mode, groupes: [], eleves: [] };
  const periode = { ouverte_du: versIso(du), ouverte_jusquau: versIso(jusqua, true) };
  const verront = carte ? elevesQuiVoient({ is_active: apres.mode === 'tous', ...periode }, apres, eleves).size : 0;
  const verraientSansDate = carte ? elevesQuiVoient({ is_active: apres.mode === 'tous' }, apres, eleves).size : 0;
  const listeEleves = eleves.filter((e) => !cherche.trim() || e.nom.toLowerCase().includes(cherche.trim().toLowerCase()));

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

  const ONGLET = (actif: boolean) =>
    `flex-1 min-w-0 flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
      actif ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80'}`;

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
            <div className="flex gap-2">
              <button type="button" className={ONGLET(mode === 'tous')} onClick={() => setMode('tous')}><span className="text-lg">🌍</span>Tout le monde</button>
              <button type="button" className={ONGLET(mode === 'certains')} onClick={() => setMode('certains')}><span className="text-lg">🎯</span>Certains</button>
              <button type="button" className={ONGLET(mode === 'personne')} onClick={() => setMode('personne')}><span className="text-lg">🔒</span>Personne</button>
            </div>

            {mode === 'certains' && (
              <>
                <p className="text-xs text-muted-foreground">Un élève voit la carte s'il est coché <strong>ou</strong> s'il est dans un groupe coché.</p>
                <div className="border rounded-xl p-3 space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">👥 Groupes</p>
                  {groupes.length === 0 && <p className="text-sm text-muted-foreground py-1">Aucun groupe créé</p>}
                  {groupes.map((g) => (
                    <label key={g.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted cursor-pointer">
                      <Checkbox checked={groupIds.includes(g.id)} onCheckedChange={() => setGroupIds((l) => l.includes(g.id) ? l.filter((x) => x !== g.id) : [...l, g.id])} />
                      <span className={`w-3 h-3 rounded-full shrink-0 ${groupColorProps(g.color).className}`} style={groupColorProps(g.color).style} />
                      <span className="text-sm font-medium">{g.name}</span>
                    </label>
                  ))}
                </div>
                <div className="border rounded-xl p-3 space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">👤 Élèves en plus</p>
                  <Input id="visibilite-cherche" value={cherche} onChange={(e) => setCherche(e.target.value)} placeholder="Chercher un élève…" className="h-8 mb-1" />
                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {listeEleves.map((e) => {
                      const viaGroupe = !userIds.includes(e.id) && raisonAcces({ mode: 'certains', groupes: groupIds, eleves: [] }, e.id, e.groupes) === 'groupe';
                      return (
                        <label key={e.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted cursor-pointer">
                          <Checkbox checked={userIds.includes(e.id)} onCheckedChange={() => setUserIds((l) => l.includes(e.id) ? l.filter((x) => x !== e.id) : [...l, e.id])} />
                          <span className="text-sm font-medium flex-1 min-w-0">{e.nom}</span>
                          {viaGroupe && <span className="text-[11px] text-amber-700 dark:text-amber-300 shrink-0">déjà via son groupe</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

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
