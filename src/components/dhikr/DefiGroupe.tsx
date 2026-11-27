import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { useGroupes } from '@/hooks/usePetits';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useDefis, useParticipations, noterDhikr, type DefiDhikr } from '@/hooks/useDhikr';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { collectChildren, trashThenDelete } from '@/lib/trash';
import { untypedDb } from '@/lib/untypedDb';
import { cleJour } from '@/lib/dhikr';
import { cn, errorMessage } from '@/lib/utils';
import type { DhikrItem } from '@/data/dhikrContenu';
import type { Couleurs } from './Ambiance';

/**
 * 🤝 I · Défi du groupe (Nadia, 27/11) : l'enseignante lance un défi (ex. 5 000 Soubhâna-llâh cette semaine) pour un ou des groupes ;
 * chaque élève ajoute ses dhikr ; le compteur du groupe monte EN DIRECT (total tenu par la base) ; l'élève ne voit jamais
 * combien chaque autre a fait ; l'enseignante voit qui a participé. ✏️ modifier, 🗑️ corbeille (avec tous les ajouts).
 * Sans réseau : l'ajout est gardé et envoyé au retour ; seul le compteur en direct dit « 📡 Nécessite Internet ».
 */
const MSG_ATTENTE = '📡 Gardé sur cet appareil, envoyé au retour du réseau';
const enCours = (d: DefiDhikr, auj: string) => d.debut <= auj && auj <= d.fin;
const dateFr = (k: string) => { const [a, m, j] = k.split('-').map(Number); return new Date(a, m - 1, j).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }); };

function Barre({ total, objectif }: { total: number; objectif: number }) {
  const p = Math.min(100, Math.round((total / Math.max(1, objectif)) * 100));
  return (
    <div className="space-y-1">
      <div className="h-5 rounded-full bg-white/60 border border-amber-300 overflow-hidden" role="progressbar" aria-valuenow={total} aria-valuemax={objectif}>
        <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 transition-[width] duration-700" style={{ width: `${p}%` }} />
      </div>
      <p className="text-sm font-black tabular-nums text-center">{total.toLocaleString('fr-FR')} / {objectif.toLocaleString('fr-FR')} <span className="font-bold">({p} %)</span>{total >= objectif ? ' 🎉' : ''}</p>
    </div>
  );
}

export function DefiGroupe({ isAdmin, userId, items, ambiance, onFaireDefi }: {
  isAdmin: boolean; userId: string | null; items: DhikrItem[]; ambiance: Couleurs;
  /** Faire le dhikr du défi au chapelet : le nombre est ajouté au défi à la fin */
  onFaireDefi: (d: DefiDhikr, item: DhikrItem | null) => void;
}) {
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();
  const { data: defis = [], isError } = useDefis();
  const { data: parts = [] } = useParticipations();
  const { data: groupes = [] } = useGroupes();
  const auj = cleJour(new Date());
  const [edition, setEdition] = useState<DefiDhikr | 'nouveau' | null>(null);
  const [aSupprimer, setASupprimer] = useState<DefiDhikr | null>(null);
  const [saisie, setSaisie] = useState<Record<string, string>>({});
  const nuit = ambiance.nom === 'nuit';
  const carte = nuit ? 'bg-white/10 border-white/20' : 'bg-white/80 border-white';
  const nomsGroupes = Object.fromEntries(groupes.map((g) => [g.id, g.name]));
  const visibles = isAdmin ? defis : defis.filter((d) => enCours(d, auj));

  // 👀 Enseignante : qui a participé (prénoms)
  const ids = useMemo(() => [...new Set(parts.map((p) => p.user_id))], [parts]);
  const { data: noms = {} } = useQuery({
    queryKey: ['dhikr-defi-noms', ids.join(',')], enabled: isAdmin && ids.length > 0,
    queryFn: async () => {
      const { data } = await untypedDb.from('profiles').select('user_id, full_name').in('user_id', ids);
      return Object.fromEntries(((data || []) as { user_id: string; full_name: string | null }[]).map((p) => [p.user_id, p.full_name || 'Élève']));
    },
  });

  const ajouter = async (d: DefiDhikr, nombre: number) => {
    if (!userId || !(nombre > 0)) return;
    try {
      const r = await ecrireOuGarder({ table: 'dhikr_defi_participations', op: 'insert', rows: [{ id: crypto.randomUUID(), defi_id: d.id, user_id: userId, nombre: Math.round(nombre) }] });
      await noterDhikr(userId, { moment: 'defi', nombre, dhikr: { cle: d.dhikr_cle ?? `defi:${d.id}`, titre: d.dhikr_titre ?? d.titre } });
      toast.success(r === 'en_attente' ? MSG_ATTENTE : `🤝 +${nombre} pour le groupe, qu'Allah l'accepte !`);
      setSaisie((s) => ({ ...s, [d.id]: '' }));
      void queryClient.invalidateQueries({ queryKey: ['dhikr-defis'] });
      void queryClient.invalidateQueries({ queryKey: ['dhikr-participations'] });
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const supprimer = async (d: DefiDhikr) => {
    if (!userId) return;
    try {
      const enfants = await collectChildren('dhikr_defi_participations', 'defi_id', [d.id]);
      await trashThenDelete({ userId, type: 'dhikr_defi', id: d.id, label: `Défi « ${d.titre} »`, data: d, children: [enfants], remove: () => untypedDb.from('dhikr_defis').delete().eq('id', d.id) });
      toast.success('Défi mis dans la corbeille de Paramètres 🗑️');
      void queryClient.invalidateQueries({ queryKey: ['dhikr-defis'] });
    } catch (e) { toast.error(navigator.onLine === false ? '📡 Nécessite Internet' : errorMessage(e)); }
  };

  return (
    <div className="space-y-3">
      {!isOnline && <p className="rounded-2xl bg-amber-100 text-amber-950 border border-amber-300 px-3 py-2 text-sm font-bold">📡 Nécessite Internet pour voir le compteur du groupe en direct. Tes ajouts sont gardés et envoyés au retour du réseau.</p>}
      {isAdmin && (
        <button type="button" onClick={() => setEdition('nouveau')} className="w-full rounded-2xl border-2 border-dashed border-amber-400 py-2.5 font-bold inline-flex items-center justify-center gap-1">
          <Plus className="h-4 w-4" /> Lancer un défi
        </button>
      )}
      {isError && !defis.length && <p className="text-center text-sm font-bold">📡 Nécessite Internet</p>}
      {!visibles.length && !isError && <p className="text-center font-bold py-3">{isAdmin ? 'Aucun défi pour l\'instant.' : 'Pas de défi en ce moment. Ton professeur en lancera un bientôt, in shâ\' Allah 🤍'}</p>}
      {visibles.map((d) => {
        const miens = parts.filter((p) => p.defi_id === d.id && p.user_id === userId).reduce((s, p) => s + p.nombre, 0);
        const item = items.find((i) => i.cle === d.dhikr_cle) ?? null;
        const parEleve = isAdmin ? Object.entries(parts.filter((p) => p.defi_id === d.id).reduce<Record<string, number>>((a, p) => ({ ...a, [p.user_id]: (a[p.user_id] ?? 0) + p.nombre }), {})).sort((a, b) => b[1] - a[1]) : [];
        const actif = enCours(d, auj);
        return (
          <div key={d.id} className={cn('rounded-3xl border p-3 space-y-2', carte)}>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base sm:text-lg [overflow-wrap:anywhere]">🤝 {d.titre}</h3>
                <p className="text-xs" style={{ color: ambiance.doux }}>
                  {d.dhikr_titre ?? item?.titre ?? 'Dhikr'} · du {dateFr(d.debut)} au {dateFr(d.fin)}{!actif && (d.fin < auj ? ' · terminé' : ' · pas encore commencé')}
                  {isAdmin && <> · {d.group_ids.length ? d.group_ids.map((g) => nomsGroupes[g] ?? 'un groupe').join(', ') : 'tous les élèves'}</>}
                </p>
              </div>
              {isAdmin && <>
                <button type="button" onClick={() => setEdition(d)} aria-label="Modifier le défi" className="h-8 w-8 grid place-items-center rounded-full bg-white text-slate-800 border"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => setASupprimer(d)} aria-label="Supprimer le défi" className="h-8 w-8 grid place-items-center rounded-full bg-white text-destructive border"><Trash2 className="h-4 w-4" /></button>
              </>}
            </div>
            <Barre total={d.total} objectif={d.objectif} />
            {!isAdmin && actif && (
              <div className="space-y-2">
                <p className="text-sm text-center font-bold">Toi : {miens.toLocaleString('fr-FR')} 🤍</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button type="button" onClick={() => onFaireDefi(d, item)} className="rounded-full bg-amber-500 text-amber-950 px-4 py-2 font-extrabold shadow">📿 Faire avec le chapelet</button>
                  {[33, 100].map((n) => <button key={n} type="button" onClick={() => ajouter(d, n)} className="rounded-full border-2 border-amber-400 bg-white text-slate-900 px-3 py-2 font-bold">+{n}</button>)}
                  <span className="inline-flex items-center gap-1">
                    <Input type="number" min={1} inputMode="numeric" placeholder="Autre" value={saisie[d.id] ?? ''} className="w-24 bg-white text-slate-900"
                      onChange={(e) => setSaisie((s) => ({ ...s, [d.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void ajouter(d, Number(saisie[d.id])); } }} />
                    <Button type="button" variant="outline" className="bg-white text-slate-900" onClick={() => ajouter(d, Number(saisie[d.id]))}>Ajouter</Button>
                  </span>
                </div>
              </div>
            )}
            {isAdmin && (
              <details className="rounded-2xl border p-2">
                <summary className="cursor-pointer text-sm font-bold">👥 Qui a participé ({parEleve.length})</summary>
                {parEleve.length ? <ul className="mt-1 grid sm:grid-cols-2 gap-1 text-sm">{parEleve.map(([u, n]) => <li key={u} className="flex justify-between gap-2"><span className="[overflow-wrap:anywhere]">{noms[u] ?? '…'}</span><b className="tabular-nums">{n}</b></li>)}</ul>
                  : <p className="text-sm mt-1">Personne pour l'instant.</p>}
                <p className="text-[11px] mt-1 opacity-80">Les élèves voient seulement le total du groupe, jamais ces chiffres.</p>
              </details>
            )}
          </div>
        );
      })}
      {edition && <FormulaireDefi defi={edition === 'nouveau' ? null : edition} items={items} groupes={groupes} userId={userId} onFermer={() => setEdition(null)} />}
      <ConfirmDeleteDialog open={!!aSupprimer} onOpenChange={(o) => { if (!o) setASupprimer(null); }} onConfirm={() => { if (aSupprimer) void supprimer(aSupprimer); setASupprimer(null); }}
        title={`Supprimer le défi « ${aSupprimer?.titre ?? ''} » ?`} description="Il part dans la corbeille de Paramètres avec tous les ajouts des élèves : tu pourras le restaurer." />
    </div>
  );
}

function FormulaireDefi({ defi, items, groupes, userId, onFermer }: { defi: DefiDhikr | null; items: DhikrItem[]; groupes: { id: string; name: string }[]; userId: string | null; onFermer: () => void }) {
  const queryClient = useQueryClient();
  const auj = new Date();
  const dans7 = new Date(auj.getFullYear(), auj.getMonth(), auj.getDate() + 6);
  const [titre, setTitre] = useState(defi?.titre ?? '5 000 Soubhâna-llâh cette semaine');
  const [cle, setCle] = useState(defi?.dhikr_cle ?? 'subhanallah');
  const [objectif, setObjectif] = useState(String(defi?.objectif ?? 5000));
  const [grp, setGrp] = useState<string[]>(defi?.group_ids ?? []);
  const [debut, setDebut] = useState(defi?.debut ?? cleJour(auj));
  const [fin, setFin] = useState(defi?.fin ?? cleJour(dans7));
  const entree = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } };

  const enregistrer = async () => {
    const n = Math.round(Number(objectif));
    if (!titre.trim() || !(n > 0) || fin < debut) { toast.error('Il faut un titre, un objectif et une date de fin après le début.'); return; }
    const item = items.find((i) => i.cle === cle);
    const valeurs = { titre: titre.trim(), dhikr_cle: cle, dhikr_titre: item?.titre ?? null, objectif: n, group_ids: grp, debut, fin };
    try {
      const r = defi
        ? await ecrireOuGarder({ table: 'dhikr_defis', op: 'update', id: defi.id, values: valeurs })
        : await ecrireOuGarder({ table: 'dhikr_defis', op: 'insert', rows: [{ id: crypto.randomUUID(), ...valeurs, created_by: userId }] });
      toast.success(r === 'en_attente' ? MSG_ATTENTE : defi ? 'Défi modifié ✅' : 'Défi lancé 🤝');
      void queryClient.invalidateQueries({ queryKey: ['dhikr-defis'] });
      onFermer();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onFermer(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{defi ? '✏️ Modifier le défi' : '🤝 Lancer un défi'}</DialogTitle><DialogDescription>Le compteur du groupe monte en direct.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <label className="block"><span className="text-sm font-bold">Titre</span><Input value={titre} onChange={(e) => setTitre(e.target.value)} onKeyDown={entree} /></label>
          <label className="block"><span className="text-sm font-bold">Le dhikr</span>
            <select value={cle ?? ''} onChange={(e) => setCle(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2">
              {items.filter((i) => i.cle).map((i) => <option key={i.id} value={i.cle!}>{i.titre}</option>)}
            </select></label>
          <label className="block"><span className="text-sm font-bold">Objectif du groupe</span><Input type="number" min={1} value={objectif} onChange={(e) => setObjectif(e.target.value)} onKeyDown={entree} className="w-40" /></label>
          <div><span className="text-sm font-bold">Pour qui ?</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <button type="button" aria-pressed={!grp.length} onClick={() => setGrp([])} className={cn('rounded-full border px-3 py-1 text-sm font-semibold', !grp.length && 'bg-amber-400 border-amber-500 text-amber-950')}>Tous les élèves</button>
              {groupes.map((g) => { const on = grp.includes(g.id); return <button key={g.id} type="button" aria-pressed={on} onClick={() => setGrp(on ? grp.filter((x) => x !== g.id) : [...grp, g.id])} className={cn('rounded-full border px-3 py-1 text-sm font-semibold', on && 'bg-amber-400 border-amber-500 text-amber-950')}>{g.name}</button>; })}
            </div></div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><span className="text-sm font-bold">Début</span><Input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} /></label>
            <label className="block"><span className="text-sm font-bold">Fin</span><Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} /></label>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onFermer}>Annuler</Button>
          <Button type="button" onClick={enregistrer} className="bg-[#d92d20] hover:bg-[#b42318] text-white">{defi ? 'Enregistrer' : 'Lancer le défi'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Ajoute au défi le nombre fait au chapelet (appelé par la page à la fin du chapelet) */
export async function ajouterAuDefi(defiId: string, userId: string, nombre: number) {
  return ecrireOuGarder({ table: 'dhikr_defi_participations', op: 'insert', rows: [{ id: crypto.randomUUID(), defi_id: defiId, user_id: userId, nombre: Math.round(nombre) }] });
}
