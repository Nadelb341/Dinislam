import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TextareaDictee } from '@/components/shared/TextareaDictee';
import ConfirmDeleteDialog from '@/components/ui/confirm-delete-dialog';
import { ecrireOuGarder } from '@/lib/fileHorsLigne';
import { trashThenDelete, type TrashItemType } from '@/lib/trash';
import { untypedDb } from '@/lib/untypedDb';
import { errorMessage } from '@/lib/utils';
import type { EtapeCompteur } from '@/data/dhikrContenu';
import { ChoixDegre } from '@/components/shared/ChoixDegre';

/**
 * ✏️ Le crayon de la carte Dhikr (règle de Nadia du 21/11) : une seule fenêtre pour modifier un dhikr de la bibliothèque,
 * un geste d'une série ou une question du quiz. Enregistrer = tout de suite en base (sans réseau : gardé puis envoyé) ;
 * 🗑️ = corbeille de Paramètres (copie complète, restaurable). Les textes religieux : Nadia les relit (règle n°1).
 */
export type TypeChamp = 'texte' | 'long' | 'arabe' | 'nombre' | 'moments' | 'statut' | 'visible' | 'choix' | 'bonne' | 'compteur' | 'serie' | 'genre' | 'degre';
export interface Champ { cle: string; label: string; type: TypeChamp; aide?: string }

export const MOMENTS: { cle: string; titre: string; emoji: string }[] = [
  { cle: 'reveil', titre: 'Réveil', emoji: '🌅' }, { cle: 'matin', titre: 'Matin', emoji: '☀️' },
  { cle: 'soir', titre: 'Soir / Avant de dormir', emoji: '🌙' }, { cle: 'apres_priere', titre: 'Après la prière', emoji: '🕌' },
  { cle: 'pardon', titre: 'Pardon', emoji: '🤲' }, { cle: 'force', titre: 'Force', emoji: '💪' }, { cle: 'repas', titre: 'Repas', emoji: '🍽️' },
];
export const STATUTS: Record<string, string> = {
  ok: '✅ Vérifié', a_verifier: '🔎 À relire par Nadia', a_confirmer: '⏳ À confirmer par Nadia (hors de ses sources)', proposition: '💡 Proposition (cachée)',
};
const MSG_ATTENTE = '📡 Gardé sur cet appareil, envoyé au retour du réseau';

type Ligne = Record<string, unknown> & { id?: string };

export function EditeurFiche({ ouvert, titre, table, ligne, defaut, champs, onFermer, corbeille, userId, libelle }: {
  ouvert: boolean; titre: string; table: string;
  /** null = nouvelle fiche */
  ligne: Ligne | null; defaut: Ligne; champs: Champ[];
  onFermer: () => void;
  corbeille: TrashItemType; userId: string | null; libelle: (l: Ligne) => string;
}) {
  const queryClient = useQueryClient();
  const [v, setV] = useState<Ligne>(defaut);
  const [envoi, setEnvoi] = useState(false);
  const [aSupprimer, setASupprimer] = useState(false);
  // Rempli à l'ouverture seulement (une mise à jour en direct ne doit pas effacer ce que Nadia est en train de taper)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (ouvert) setV(ligne ? { ...ligne } : { ...defaut }); }, [ouvert, ligne?.id]);
  const enBase = !!ligne?.id && !String(ligne.id).startsWith('secours-');
  const maj = (cle: string, val: unknown) => setV((x) => ({ ...x, [cle]: val }));
  const rafraichir = () => void queryClient.invalidateQueries({ queryKey: [table.replace('_', '-')] }); // dhikr_items → ['dhikr-items']

  const enregistrer = async () => {
    const valeurs: Record<string, unknown> = {};
    for (const c of champs) valeurs[c.cle] = v[c.cle] ?? null;
    // 🕌 27/11 : le degré va avec sa phrase « avis divergents »
    if (champs.some((c) => c.type === 'degre')) valeurs.degre_divergence = String(v.degre_divergence ?? '').trim() || null;
    if (!String(valeurs.titre ?? valeurs.question ?? '').trim()) { toast.error('Il faut au moins un titre.'); return; }
    setEnvoi(true);
    try {
      const r = enBase
        ? await ecrireOuGarder({ table, op: 'update', id: String(ligne!.id), values: valeurs })
        : await ecrireOuGarder({ table, op: 'insert', rows: [{ ...defaut, ...valeurs, id: crypto.randomUUID(), cle: (ligne?.cle as string) ?? null }] });
      toast.success(r === 'en_attente' ? MSG_ATTENTE : 'Enregistré ✅');
      rafraichir();
      onFermer();
    } catch (e) { toast.error(errorMessage(e)); } finally { setEnvoi(false); }
  };
  const supprimer = async () => {
    if (!enBase || !userId) return;
    try {
      await trashThenDelete({
        userId, type: corbeille, id: String(ligne!.id), label: libelle(ligne!), data: ligne,
        remove: () => untypedDb.from(table).delete().eq('id', String(ligne!.id)),
      });
      toast.success('Mis dans la corbeille de Paramètres 🗑️');
      rafraichir();
      onFermer();
    } catch (e) {
      toast.error(navigator.onLine === false ? '📡 Nécessite Internet' : errorMessage(e));
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={(o) => { if (!o) onFermer(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>✏️ {titre}</DialogTitle>
          <DialogDescription>Les textes religieux : Coran, Al-Boukhârî et Mouslim seulement, avec leur source exacte.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {champs.map((c) => <ChampEdite key={c.cle} c={c} valeur={v[c.cle]} toutes={v}
            onChange={(x) => (c.type === 'degre'
              ? setV((o) => ({ ...o, degre: (x as { degre: string | null }).degre, degre_divergence: (x as { divergence: string | null }).divergence }))
              : maj(c.cle, x))} />)}
        </div>
        <div className="flex flex-wrap justify-between gap-2 pt-2">
          {enBase ? (
            <Button type="button" variant="outline" className="text-destructive border-destructive/40" onClick={() => setASupprimer(true)}>
              <Trash2 className="h-4 w-4 mr-1" /> Supprimer
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onFermer}>Annuler</Button>
            <Button type="button" onClick={enregistrer} disabled={envoi} className="bg-[#d92d20] hover:bg-[#b42318] text-white">Enregistrer</Button>
          </div>
        </div>
        <ConfirmDeleteDialog open={aSupprimer} onOpenChange={setASupprimer} onConfirm={supprimer}
          title={`Supprimer « ${libelle(v).slice(0, 60)} » ?`} description="Il part dans la corbeille de Paramètres : tu pourras le restaurer." />
      </DialogContent>
    </Dialog>
  );
}

const entree = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } };

function ChampEdite({ c, valeur, onChange, toutes }: { c: Champ; valeur: unknown; onChange: (v: unknown) => void; toutes: Ligne }) {
  const label = <span className="block text-sm font-bold mb-1">{c.label}{c.aide && <span className="block text-xs font-normal text-muted-foreground">{c.aide}</span>}</span>;
  switch (c.type) {
    case 'texte':
      return <label className="block">{label}<Input value={String(valeur ?? '')} onChange={(e) => onChange(e.target.value)} onKeyDown={entree} /></label>;
    case 'nombre':
    case 'bonne':
      return <label className="block">{label}<Input type="number" min={c.type === 'bonne' ? 1 : 1} value={c.type === 'bonne' ? Number(valeur ?? 0) + 1 : Number(valeur ?? 1)} onKeyDown={entree}
        onChange={(e) => { const n = Math.max(1, Math.round(Number(e.target.value) || 1)); onChange(c.type === 'bonne' ? n - 1 : n); }} className="w-32" /></label>;
    case 'long':
      return <label className="block">{label}<TextareaDictee value={String(valeur ?? '')} onChange={(e) => onChange(e.target.value)} rows={3} /></label>;
    case 'arabe':
      return <label className="block">{label}<textarea dir="rtl" lang="ar" value={String(valeur ?? '')} onChange={(e) => onChange(e.target.value)} rows={3}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-arabic text-xl leading-loose" /></label>;
    case 'moments': {
      const l = Array.isArray(valeur) ? (valeur as string[]) : [];
      return (<div>{label}<div className="flex flex-wrap gap-1.5">{MOMENTS.map((m) => {
        const on = l.includes(m.cle);
        return <button key={m.cle} type="button" aria-pressed={on} onClick={() => onChange(on ? l.filter((x) => x !== m.cle) : [...l, m.cle])}
          className={`rounded-full border px-3 py-1 text-sm font-semibold ${on ? 'bg-amber-400 border-amber-500 text-amber-950' : 'bg-background'}`}>{m.emoji} {m.titre}</button>;
      })}</div></div>);
    }
    case 'statut':
      return <label className="block">{label}<select value={String(valeur ?? 'ok')} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2">
        {Object.entries(STATUTS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></label>;
    case 'serie':
      return <label className="block">{label}<select value={String(valeur ?? 'matin')} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2">
        <option value="matin">🌅 Série du matin</option><option value="soir">🌙 Série du soir</option><option value="reveil">☀️ Réveil</option><option value="apres_priere">🕌 Après la prière</option></select></label>;
    case 'genre':
      return <label className="block">{label}<select value={String(valeur ?? 'geste')} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2">
        <option value="geste">Un geste</option><option value="final">L'invocation de la fin</option><option value="bonus">Bonus</option><option value="intro">Titre de la série</option></select></label>;
    case 'degre':
      return <ChoixDegre degre={(valeur as string | null) ?? null} divergence={(toutes.degre_divergence as string | null) ?? null}
        source={(toutes.source as string | null) ?? null} onChange={onChange} />;
    case 'visible':
      return <label className="flex items-center justify-between gap-3 rounded-xl border p-3"><span className="font-bold text-sm">{c.label}<span className="block text-xs font-normal text-muted-foreground">{valeur ? '👁️ Les élèves le voient' : '🙈 Caché aux élèves'}</span></span>
        <Switch checked={!!valeur} onCheckedChange={onChange} /></label>;
    case 'choix': {
      const l = Array.isArray(valeur) ? (valeur as string[]) : [];
      const bonne = Number(toutes.bonne ?? 0);
      return (<div>{label}<div className="space-y-1.5">{l.map((x, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={`text-xs font-bold w-16 shrink-0 ${i === bonne ? 'text-emerald-700' : 'text-muted-foreground'}`}>{i === bonne ? '✅ Bonne' : `Choix ${i + 1}`}</span>
          <Input value={x} onKeyDown={entree} onChange={(e) => onChange(l.map((y, j) => (j === i ? e.target.value : y)))} />
          {l.length > 2 && <button type="button" aria-label="Retirer ce choix" onClick={() => onChange(l.filter((_, j) => j !== i))} className="text-destructive p-1"><X className="h-4 w-4" /></button>}
        </div>))}
        {l.length < 5 && <Button type="button" variant="outline" size="sm" onClick={() => onChange([...l, ''])}><Plus className="h-4 w-4 mr-1" /> Un choix</Button>}
      </div></div>);
    }
    case 'compteur': {
      const l = Array.isArray(valeur) ? (valeur as EtapeCompteur[]) : [];
      const maj = (i: number, k: keyof EtapeCompteur, x: string | number) => onChange(l.map((e, j) => (j === i ? { ...e, [k]: x } : e)));
      return (<div>{label}
        {!l.length && <p className="text-xs text-muted-foreground mb-1">Aucune étape : l'élève coche « C'est fait » (pas de chapelet).</p>}
        <div className="space-y-2">{l.map((e, i) => (
          <div key={i} className="rounded-xl border p-2 space-y-1.5 bg-amber-50/50 dark:bg-amber-900/10">
            <div className="flex items-center gap-2"><span className="text-xs font-bold">Étape {i + 1}</span>
              <button type="button" aria-label="Retirer cette étape" onClick={() => onChange(l.filter((_, j) => j !== i))} className="ml-auto text-destructive p-1"><X className="h-4 w-4" /></button></div>
            <Input placeholder="Titre (ex. Soubhâna-llâh)" value={e.titre} onKeyDown={entree} onChange={(x) => maj(i, 'titre', x.target.value)} />
            <textarea dir="rtl" lang="ar" placeholder="Arabe" value={e.arabe} onChange={(x) => maj(i, 'arabe', x.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-1 font-arabic text-lg" />
            <Input placeholder="Phonétique" value={e.phonetique} onKeyDown={entree} onChange={(x) => maj(i, 'phonetique', x.target.value)} />
            <Input placeholder="Sens en français" value={e.sens} onKeyDown={entree} onChange={(x) => maj(i, 'sens', x.target.value)} />
            <label className="flex items-center gap-2 text-sm">Nombre de fois <Input type="number" min={1} value={e.nombre} onKeyDown={entree} className="w-24"
              onChange={(x) => maj(i, 'nombre', Math.max(1, Math.round(Number(x.target.value) || 1)))} /></label>
          </div>))}
          <Button type="button" variant="outline" size="sm" onClick={() => onChange([...l, { titre: '', arabe: '', phonetique: '', sens: '', nombre: 33 }])}><Plus className="h-4 w-4 mr-1" /> Une étape au chapelet</Button>
        </div></div>);
    }
  }
}

/** ✋ Ranger par appui long + glisser : nouvelles positions 10, 20, 30… (sans réseau : gardé puis envoyé) */
export async function rangerLignes(table: string, ids: string[]) {
  let attente = false;
  for (const [i, id] of ids.entries()) {
    if (id.startsWith('secours-')) continue;
    const r = await ecrireOuGarder({ table, op: 'update', id, values: { position: (i + 1) * 10 } });
    if (r === 'en_attente') attente = true;
  }
  toast.success(attente ? MSG_ATTENTE : 'Rangé ✅');
}

export const CHAMPS_ITEM: Champ[] = [
  { cle: 'titre', label: 'Titre', type: 'texte' },
  { cle: 'arabe', label: 'Arabe (vocalisé)', type: 'arabe' },
  { cle: 'phonetique', label: 'Phonétique', type: 'long', aide: 'Simple, comme « Soubhâna-llâhi wa bihamdihi »' },
  { cle: 'sens', label: 'Sens en français', type: 'long' },
  { cle: 'nombre', label: 'Nombre de fois au chapelet', type: 'nombre' },
  { cle: 'nombre_texte', label: 'Nombre écrit sur la fiche', type: 'texte', aide: 'Ex. « 100 fois dans la journée »' },
  { cle: 'merite', label: 'Mérite (phrase courte, fidèle au hadith)', type: 'long' },
  { cle: 'source', label: 'Source exacte', type: 'texte', aide: 'Ex. « Boukhari 6405 ; Mouslim 2691 »' },
  { cle: 'degre', label: "Degré d'authenticité", type: 'degre' },
  { cle: 'moments', label: 'Moments', type: 'moments' },
  { cle: 'statut', label: 'Vérification', type: 'statut' },
  { cle: 'visible', label: 'Montrer aux élèves', type: 'visible' },
];
export const CHAMPS_GESTE: Champ[] = [
  { cle: 'titre', label: 'Titre', type: 'texte' },
  { cle: 'genre', label: 'Sorte', type: 'genre' },
  { cle: 'consigne', label: 'Consigne', type: 'long' },
  { cle: 'arabe', label: 'Arabe (vocalisé)', type: 'arabe' },
  { cle: 'phonetique', label: 'Phonétique', type: 'long' },
  { cle: 'sens', label: 'Sens en français', type: 'long' },
  { cle: 'compteur', label: 'Au chapelet', type: 'compteur' },
  { cle: 'merite', label: 'Mérite', type: 'long' },
  { cle: 'source', label: 'Source exacte', type: 'texte' },
  { cle: 'degre', label: "Degré d'authenticité", type: 'degre' },
  { cle: 'lien', label: 'Lien dans l\'appli (facultatif)', type: 'texte', aide: 'Ex. « /coran?item=42 » ou « /priere?carte=LODO »' },
  { cle: 'position', label: 'Place dans la série', type: 'nombre', aide: '10, 20, 30… : le plus petit passe en premier' },
  { cle: 'statut', label: 'Vérification', type: 'statut' },
  { cle: 'visible', label: 'Montrer aux élèves', type: 'visible' },
];
export const CHAMPS_QUESTION: Champ[] = [
  { cle: 'question', label: 'Question', type: 'long' },
  { cle: 'choix', label: 'Réponses', type: 'choix' },
  { cle: 'bonne', label: 'Numéro de la bonne réponse', type: 'bonne' },
  { cle: 'explication', label: 'Explication (montrée après la réponse)', type: 'long' },
  { cle: 'source', label: 'Source exacte', type: 'texte' },
  { cle: 'degre', label: "Degré d'authenticité", type: 'degre' },
  { cle: 'visible', label: 'Montrer aux élèves', type: 'visible' },
];
