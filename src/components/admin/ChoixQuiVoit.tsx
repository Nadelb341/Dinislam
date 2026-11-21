import { useState } from 'react';
import { groupColorProps } from '@/lib/studentGroups';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { raisonAcces, type Eleve, type Mode } from '@/lib/cartesAcces';
import type { GroupeAcces } from '@/hooks/useCartesAcces';

/**
 * 🌍 Tout le monde / 🎯 Certains (groupes + élèves en plus) / 🔒 Personne — le choix « Qui voit » commun
 * à la fenêtre des cartes (ModuleVisibilityDialog) et aux onglets de l'Alphabet (2026-11-21).
 */
export function ChoixQuiVoit({ mode, setMode, groupIds, setGroupIds, userIds, setUserIds, groupes, eleves, quoi = 'la carte' }: {
  mode: Mode; setMode: (m: Mode) => void;
  groupIds: string[]; setGroupIds: (f: (l: string[]) => string[]) => void;
  userIds: string[]; setUserIds: (f: (l: string[]) => string[]) => void;
  groupes: GroupeAcces[]; eleves: Eleve[];
  /** « la carte », « l'onglet »… */
  quoi?: string;
}) {
  const [cherche, setCherche] = useState('');
  const listeEleves = eleves.filter((e) => !cherche.trim() || e.nom.toLowerCase().includes(cherche.trim().toLowerCase()));
  const ONGLET = (actif: boolean) =>
    `flex-1 min-w-0 flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
      actif ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80'}`;
  return (
    <>
      <div className="flex gap-2">
        <button type="button" className={ONGLET(mode === 'tous')} onClick={() => setMode('tous')}><span className="text-lg">🌍</span>Tout le monde</button>
        <button type="button" className={ONGLET(mode === 'certains')} onClick={() => setMode('certains')}><span className="text-lg">🎯</span>Certains</button>
        <button type="button" className={ONGLET(mode === 'personne')} onClick={() => setMode('personne')}><span className="text-lg">🔒</span>Personne</button>
      </div>

      {mode === 'certains' && (
        <>
          <p className="text-xs text-muted-foreground">Un élève voit {quoi} s'il est coché <strong>ou</strong> s'il est dans un groupe coché.</p>
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
    </>
  );
}
