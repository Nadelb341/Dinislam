import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { groupColorProps } from '@/lib/studentGroups';
import { useCartesAcces, useAccesEnAttente, rafraichirCartes, type CarteAcces } from '@/hooks/useCartesAcces';
import { dansLaPeriode, fermerAEleve, fermerAGroupe, ouvrirAEleve, ouvrirAGroupe, raisonAcces, reserverSauf, textePeriode, type Acces } from '@/lib/cartesAcces';
import { enregistrerAcces } from '@/lib/cartesAccesEnregistrer';
import ModuleVisibilityDialog from '@/components/admin/ModuleVisibilityDialog';

/**
 * 🗂️ « Qui voit quoi » (Nadia, 2026-11-11 — maquette A, inspirée de Google Classroom et des tableaux de partage de Notion).
 * Onglet Groupes : une ligne par carte, une colonne par groupe ; Élèves : une ligne par élève, une colonne par carte ;
 * Journal : qui a ouvert quoi, et quand. Un appui sur une case ouvre ou ferme (avec confirmation).
 * Idées gardées : 1 groupes+élèves, 2 un seul appui, 4 plusieurs cartes d'un coup, 5 dates, 6 notification,
 * 7 journal, 8 alertes douces, 9 filtres, 10 hors ligne (+ 3 « Ses cartes » dans la fiche élève).
 */
type Filtre = 'toutes' | 'fermees' | 'un_seul' | 'dates';
interface Confirmation { titre: string; texte: string; bouton?: string; action?: () => Promise<void> }

const PUCE: Record<Acces['mode'], { emoji: string; label: string; cls: string }> = {
  tous: { emoji: '🌍', label: 'Tout le monde', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' },
  certains: { emoji: '🎯', label: 'Certains', cls: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' },
  personne: { emoji: '🔒', label: 'Personne', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' },
};

const Case = ({ etat, n, onClick, titre }: { etat: 'oui' | 'groupe' | 'lui' | 'tous' | 'quelques' | 'non'; n?: number; onClick: () => void; titre: string }) => (
  <button type="button" onClick={onClick} title={titre} aria-label={titre}
    className={cn('w-8 h-8 rounded-lg inline-flex items-center justify-center text-sm font-bold transition-transform active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
      etat === 'oui' && 'bg-emerald-600 text-white',
      etat === 'tous' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
      etat === 'lui' && 'bg-sky-600 text-white',
      etat === 'groupe' && 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
      etat === 'quelques' && 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
      etat === 'non' && 'bg-muted text-muted-foreground/60')}>
    {etat === 'oui' || etat === 'lui' ? '✓' : etat === 'tous' ? '🌍' : etat === 'groupe' ? '👥' : etat === 'quelques' ? n : '·'}
  </button>
);

export default function AdminCartesAcces({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const { cartes, groupes, eleves, isLoading, isError, nomGroupe, nomEleve } = useCartesAcces();
  const enAttente = useAccesEnAttente();
  const [filtre, setFiltre] = useState<Filtre>('toutes');
  const [cible, setCible] = useState(''); // 'g:<id>' | 'e:<id>' | ''
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [reglage, setReglage] = useState<{ id: string; title: string } | null>(null);
  const [plusieurs, setPlusieurs] = useState(false);
  const [alertesOuvertes, setAlertesOuvertes] = useState(false);

  const { data: journal = [] } = useQuery({
    queryKey: ['cartes-journal'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cartes_journal').select('id, cree_le, carte, quoi').order('cree_le', { ascending: false }).limit(300);
      if (error) throw error;
      return data || [];
    },
  });

  const eleve = (id: string) => eleves.find((e) => e.id === id);
  const membres = (g: string) => eleves.filter((e) => e.groupes.includes(g));

  // ——— Ce que voit la cible choisie (« Tout ce que voit… », idée 9) ———
  const voitCible = (c: CarteAcces) => {
    if (!cible) return true;
    const [t, id] = [cible.slice(0, 1), cible.slice(2)];
    if (t === 'e') { const e = eleve(id); return !!e && raisonAcces(c.acces, e.id, e.groupes) !== null; }
    return c.acces.mode === 'tous' || (c.acces.mode === 'certains' && c.acces.groupes.includes(id));
  };
  const cartesFiltrees = cartes.filter((c) => {
    if (filtre === 'fermees' && c.acces.mode !== 'personne') return false;
    if (filtre === 'un_seul' && !(c.acces.mode === 'certains' && !c.acces.groupes.length && c.acces.eleves.length === 1)) return false;
    if (filtre === 'dates' && !c.ouverte_du && !c.ouverte_jusquau) return false;
    return voitCible(c);
  });
  const elevesFiltres = cible.startsWith('e:') ? eleves.filter((e) => e.id === cible.slice(2)) : cible.startsWith('g:') ? membres(cible.slice(2)) : eleves;

  // ——— Alertes douces (idée 8) ———
  const alertes = (() => {
    const l: string[] = [];
    const sansGroupe = eleves.filter((e) => !e.groupes.length);
    if (sansGroupe.length) l.push(`👤 ${sansGroupe.length} élève${sansGroupe.length > 1 ? 's ne sont' : ' n\'est'} dans aucun groupe : ${sansGroupe.map((e) => e.nom).join(', ')}.`);
    const nbTous = cartes.filter((c) => c.acces.mode === 'tous').length;
    for (const g of groupes) {
      const m = membres(g.id).length;
      if (!m) { l.push(`👥 « ${g.name} » n'a aucun élève.`); continue; }
      const aLui = cartes.filter((c) => c.acces.mode === 'certains' && c.acces.groupes.includes(g.id)).length;
      if (!aLui) l.push(`👥 « ${g.name} » voit seulement les ${nbTous} carte${nbTous > 1 ? 's' : ''} ouverte${nbTous > 1 ? 's' : ''} à tout le monde.`);
    }
    return l;
  })();

  // ——— Enregistrer (idées 2, 6, 10) ———
  const appliquer = async (c: CarteAcces, apres: Acces) => {
    const r = await enregistrerAcces({ carte: c, avant: c.acces, apres, eleves, nomGroupe, nomEleve });
    rafraichirCartes(queryClient);
    if (r === 'en_attente') toast.info('📡 Hors connexion : gardé sur cet appareil, envoyé au retour du réseau');
    else if (r === 'ok') toast.success(`« ${c.title} » : enregistré ✅`);
  };
  const lancer = async () => {
    if (!confirmation?.action) { setConfirmation(null); return; }
    setEnCours(true);
    try { await confirmation.action(); setConfirmation(null); } catch (e) { toast.error(`Pas enregistré : ${(e as Error).message}`); } finally { setEnCours(false); }
  };
  const noteDates = (c: CarteAcces) => (!dansLaPeriode(c) && textePeriode(c) ? `\n\n⏰ Attention : cette carte est ouverte ${textePeriode(c)} seulement.` : '');

  const clicGroupe = (c: CarteAcces, g: { id: string; name: string }) => {
    const n = membres(g.id).length;
    if (c.acces.mode === 'tous') {
      const sansGroupe = eleves.filter((e) => !e.groupes.length).length;
      setConfirmation({
        titre: `« ${c.title} » est ouverte à tout le monde`,
        texte: `Veux-tu la fermer au groupe « ${g.name} » ? Elle restera ouverte à tous les AUTRES groupes.${sansGroupe ? `\n\n⚠️ ${sansGroupe} élève${sansGroupe > 1 ? 's' : ''} sans groupe ne la verr${sansGroupe > 1 ? 'ont' : 'a'} plus.` : ''}`,
        bouton: `Fermer à « ${g.name} »`, action: () => appliquer(c, reserverSauf(groupes.map((x) => x.id), g.id)),
      });
    } else if (c.acces.mode === 'certains' && c.acces.groupes.includes(g.id)) {
      const gardent = membres(g.id).filter((e) => c.acces.eleves.includes(e.id) || e.groupes.some((x) => x !== g.id && c.acces.groupes.includes(x))).length;
      setConfirmation({
        titre: `Fermer « ${c.title} » au groupe « ${g.name} » ?`,
        texte: `${n} élève${n > 1 ? 's' : ''} dans ce groupe.${gardent ? ` ${gardent} la garder${gardent > 1 ? 'ont' : 'a'} (ouverte pour eux personnellement ou par un autre groupe).` : ''}`,
        bouton: 'Fermer', action: () => appliquer(c, fermerAGroupe(c.acces, g.id)),
      });
    } else {
      setConfirmation({
        titre: `Ouvrir « ${c.title} » au groupe « ${g.name} » ?`,
        texte: `${n} élève${n > 1 ? 's' : ''} la verr${n > 1 ? 'ont' : 'a'} ; ceux qui ne l'avaient pas encore recevront une notification.${noteDates(c)}`,
        bouton: 'Ouvrir', action: () => appliquer(c, ouvrirAGroupe(c.acces, g.id)),
      });
    }
  };

  const clicEleve = (c: CarteAcces, e: { id: string; nom: string; groupes: string[] }) => {
    const r = raisonAcces(c.acces, e.id, e.groupes);
    if (r === 'tous') { setConfirmation({ titre: `« ${c.title} » est ouverte à tout le monde`, texte: `${e.nom} la voit comme tous les élèves. Pour la réserver à certains, utilise ✏️ à côté du nom de la carte (onglet Groupes).` }); return; }
    if (r === 'groupe') {
      const via = e.groupes.filter((g) => c.acces.groupes.includes(g)).map(nomGroupe).join(', ');
      setConfirmation({ titre: `${e.nom} voit « ${c.title} » grâce à son groupe`, texte: `Groupe : ${via}.\n\nPour la lui fermer, ferme la carte à ce groupe (onglet Groupes) ou retire ${e.nom} du groupe.` });
      return;
    }
    if (r === 'lui') {
      setConfirmation({ titre: `Fermer « ${c.title} » à ${e.nom} ?`, texte: 'La carte disparaîtra de son accueil.', bouton: 'Fermer', action: () => appliquer(c, fermerAEleve(c.acces, e.id)) });
      return;
    }
    setConfirmation({ titre: `Ouvrir « ${c.title} » à ${e.nom} ?`, texte: `Elle apparaîtra sur son accueil et ${e.nom} recevra une notification.${noteDates(c)}`, bouton: 'Ouvrir', action: () => appliquer(c, ouvrirAEleve(c.acces, e.id)) });
  };

  const NomCarte = ({ c }: { c: CarteAcces }) => (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="font-semibold text-sm leading-tight">{c.title}</span>
      <span className={cn('shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-bold', PUCE[c.acces.mode].cls)} title={PUCE[c.acces.mode].label}>{PUCE[c.acces.mode].emoji}</span>
      {(c.ouverte_du || c.ouverte_jusquau) && <span className="shrink-0 text-[10px]" title={`Ouverte ${textePeriode(c)}`}>⏰</span>}
      <button type="button" onClick={() => setReglage({ id: c.id, title: c.title })} className="shrink-0 ml-auto text-xs px-1.5 py-0.5 rounded-md hover:bg-muted" aria-label={`Régler « ${c.title} »`}>✏️</button>
    </div>
  );

  const FILTRES: { id: Filtre; label: string }[] = [
    { id: 'toutes', label: 'Toutes' }, { id: 'fermees', label: '🔒 Fermées à tous' }, { id: 'un_seul', label: '👤 Un seul élève' }, { id: 'dates', label: '⏰ Avec dates' },
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <Button variant="ghost" onClick={onBack}>← Retour</Button>
      <div>
        <h2 className="text-xl font-bold">🗂️ Qui voit quoi</h2>
        <p className="text-sm text-muted-foreground">Les cartes ouvertes à chaque groupe et à chaque élève. Appuie sur une case pour ouvrir ou fermer.</p>
      </div>

      {enAttente > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 px-4 py-2 text-sm">
          📡 {enAttente} changement{enAttente > 1 ? 's' : ''} pas encore envoyé{enAttente > 1 ? 's' : ''} (hors connexion). {enAttente > 1 ? 'Ils partiront' : 'Il partira'} tout seul au retour du réseau.
        </div>
      )}

      {alertes.length > 0 && (
        <div className="rounded-xl border bg-card px-4 py-2 text-sm">
          <button type="button" className="font-semibold w-full text-left" onClick={() => setAlertesOuvertes((v) => !v)}>
            💡 {alertes.length} chose{alertes.length > 1 ? 's' : ''} à regarder {alertesOuvertes ? '▲' : '▼'}
          </button>
          {alertesOuvertes && <ul className="mt-2 space-y-1 text-muted-foreground">{alertes.map((a) => <li key={a}>{a}</li>)}</ul>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTRES.map((f) => (
          <button key={f.id} type="button" onClick={() => setFiltre(f.id)}
            className={cn('text-xs px-3 py-1.5 rounded-full border font-semibold', filtre === f.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card')}>{f.label}</button>
        ))}
        <select id="qui-voit-cible" value={cible} onChange={(e) => setCible(e.target.value)} className="text-xs h-8 rounded-full border bg-card px-3 max-w-full" aria-label="Tout ce que voit…">
          <option value="">👀 Tout ce que voit…</option>
          <optgroup label="Groupes">{groupes.map((g) => <option key={g.id} value={`g:${g.id}`}>{g.name}</option>)}</optgroup>
          <optgroup label="Élèves">{eleves.map((e) => <option key={e.id} value={`e:${e.id}`}>{e.nom}</option>)}</optgroup>
        </select>
        <Button size="sm" variant="outline" className="ml-auto rounded-full" onClick={() => setPlusieurs(true)}>➕ Ouvrir plusieurs cartes</Button>
      </div>

      {isError && <p className="text-sm text-destructive">📡 Impossible de charger (Internet nécessaire la toute première fois).</p>}
      {isLoading ? <p className="text-sm text-muted-foreground py-8 text-center">Chargement…</p> : (
        <Tabs defaultValue="groupes">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="groupes">👥 Groupes</TabsTrigger>
            <TabsTrigger value="eleves">👤 Élèves</TabsTrigger>
            <TabsTrigger value="journal">📜 Journal</TabsTrigger>
          </TabsList>

          <TabsContent value="groupes">
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="text-sm w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="sticky left-0 z-10 bg-card text-left px-3 py-2 min-w-[190px]">Carte</th>
                    {groupes.map((g) => (
                      <th key={g.id} className={cn('px-1 py-2 text-[11px] font-semibold text-muted-foreground align-bottom min-w-[64px]', cible === `g:${g.id}` && 'bg-primary/10 text-primary')}>
                        <span className={`block mx-auto mb-1 w-2.5 h-2.5 rounded-full ${groupColorProps(g.color).className}`} style={groupColorProps(g.color).style} />
                        {g.name.replace(/^Groupe\s*/i, 'G')}
                        <span className="block font-normal">{membres(g.id).length} él.</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cartesFiltrees.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="sticky left-0 z-10 bg-card px-3 py-1.5"><NomCarte c={c} /></td>
                      {groupes.map((g) => {
                        const tousG = c.acces.mode === 'tous', cibleG = c.acces.mode === 'certains' && c.acces.groupes.includes(g.id);
                        const n = c.acces.mode === 'certains' ? membres(g.id).filter((e) => c.acces.eleves.includes(e.id)).length : 0;
                        const etat = tousG ? 'tous' : cibleG ? 'oui' : n ? 'quelques' : 'non';
                        const titre = tousG ? 'Ouverte à tout le monde' : cibleG ? `Ouverte au groupe ${g.name}` : n ? `${n} élève(s) de ce groupe l'ont personnellement` : `Fermée pour ${g.name}`;
                        return <td key={g.id} className={cn('text-center px-1 py-1.5', cible === `g:${g.id}` && 'bg-primary/5')}><Case etat={etat} n={n} titre={titre} onClick={() => clicGroupe(c, g)} /></td>;
                      })}
                    </tr>
                  ))}
                  {!cartesFiltrees.length && <tr><td colSpan={groupes.length + 1} className="text-center text-muted-foreground py-6">Aucune carte pour ce filtre</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">🌍 ouverte à tout le monde · ✓ ouverte au groupe · chiffre = élèves du groupe qui l'ont personnellement · · fermée</p>
          </TabsContent>

          <TabsContent value="eleves">
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="text-sm w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="sticky left-0 z-10 bg-card text-left px-3 py-2 min-w-[150px]">Élève</th>
                    {cartesFiltrees.map((c) => (
                      <th key={c.id} className="px-1 py-2 text-[11px] font-semibold text-muted-foreground align-bottom min-w-[58px] leading-tight">
                        {c.title.replace(/ \(.*\)$/, '').replace(' & Conjugaison', '').replace("99 Noms d'Allah", '99 Noms').replace('Histoires des Prophètes', 'Prophètes').replace('Lecture du Coran', 'Lecture Coran')}
                        <span className="block">{PUCE[c.acces.mode].emoji}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {elevesFiltres.map((e) => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="sticky left-0 z-10 bg-card px-3 py-1.5">
                        <span className="font-semibold text-sm block leading-tight">{e.nom}</span>
                        <span className="text-[10px] text-muted-foreground">{e.groupes.length ? e.groupes.map(nomGroupe).join(', ') : 'sans groupe'}</span>
                      </td>
                      {cartesFiltrees.map((c) => {
                        const r = raisonAcces(c.acces, e.id, e.groupes);
                        const titre = r === 'tous' ? 'Ouverte à tout le monde' : r === 'groupe' ? 'Grâce à son groupe' : r === 'lui' ? 'Ouverte pour lui personnellement' : 'Fermée';
                        return <td key={c.id} className="text-center px-1 py-1.5"><Case etat={r === 'tous' ? 'tous' : r === 'groupe' ? 'groupe' : r === 'lui' ? 'lui' : 'non'} titre={`${c.title} : ${titre}`} onClick={() => clicEleve(c, e)} /></td>;
                      })}
                    </tr>
                  ))}
                  {!elevesFiltres.length && <tr><td colSpan={cartesFiltrees.length + 1} className="text-center text-muted-foreground py-6">Aucun élève</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">🌍 tout le monde · 👥 grâce à son groupe · ✓ ouverte pour lui · · fermée</p>
          </TabsContent>

          <TabsContent value="journal">
            <div className="rounded-xl border bg-card divide-y">
              {journal.length === 0 && <p className="text-sm text-muted-foreground p-4">Rien encore : chaque ouverture ou fermeture s'écrira ici à partir d'aujourd'hui.</p>}
              {journal.map((j) => (
                <div key={j.id} className="px-4 py-2 text-sm flex flex-wrap gap-x-3 gap-y-0.5">
                  <span className="text-muted-foreground tabular-nums shrink-0">{new Date(j.cree_le).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="font-semibold">{j.carte}</span>
                  <span className="min-w-0">{j.quoi}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <AlertDialog open={!!confirmation} onOpenChange={(v) => { if (!v && !enCours) setConfirmation(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmation?.titre}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">{confirmation?.texte}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {confirmation?.action ? (
              <>
                <AlertDialogCancel disabled={enCours}>Annuler</AlertDialogCancel>
                <AlertDialogAction disabled={enCours} onClick={(ev) => { ev.preventDefault(); void lancer(); }}>{enCours ? '…' : confirmation.bouton}</AlertDialogAction>
              </>
            ) : <AlertDialogAction>J'ai compris</AlertDialogAction>}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ModuleVisibilityDialog open={!!reglage} onOpenChange={(v) => { if (!v) setReglage(null); }} module={reglage} />
      <OuvrirPlusieurs open={plusieurs} onOpenChange={setPlusieurs} />
    </div>
  );
}

/** ➕ Ouvrir plusieurs cartes d'un coup à un groupe ou à un élève (idée 4) */
function OuvrirPlusieurs({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const { cartes, groupes, eleves, nomGroupe, nomEleve } = useCartesAcces(open);
  const [cible, setCible] = useState('');
  const [choix, setChoix] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [t, id] = [cible.slice(0, 1), cible.slice(2)];
  const e = eleves.find((x) => x.id === id);
  const dejaVue = (c: CarteAcces) => !cible ? false : t === 'e' ? !!e && raisonAcces(c.acces, e.id, e.groupes) !== null
    : c.acces.mode === 'tous' || (c.acces.mode === 'certains' && c.acces.groupes.includes(id));
  const nomCible = t === 'g' ? `le groupe « ${nomGroupe(id)} »` : e ? e.nom : '';

  const ouvrir = async () => {
    setEnCours(true);
    let ok = 0, attente = 0;
    try {
      for (const c of cartes.filter((x) => choix.includes(x.id))) {
        const apres = t === 'g' ? ouvrirAGroupe(c.acces, id) : ouvrirAEleve(c.acces, id);
        const r = await enregistrerAcces({ carte: c, avant: c.acces, apres, eleves, nomGroupe, nomEleve });
        if (r === 'ok') ok++; else if (r === 'en_attente') attente++;
      }
      rafraichirCartes(queryClient);
      toast.success(`${ok + attente} carte${ok + attente > 1 ? 's' : ''} ouverte${ok + attente > 1 ? 's' : ''} pour ${nomCible}${attente ? ' (📡 envoi au retour du réseau)' : ''} ✅`);
      setChoix([]); onOpenChange(false);
    } catch (err) {
      rafraichirCartes(queryClient);
      toast.error(`Arrêté : ${(err as Error).message}`);
    } finally { setEnCours(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!enCours) onOpenChange(v); }}>
      <DialogContent className="max-w-md w-full rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>➕ Ouvrir plusieurs cartes</DialogTitle>
          <DialogDescription>Choisis un groupe ou un élève, puis coche les cartes à lui ouvrir.</DialogDescription>
        </DialogHeader>
        <select id="plusieurs-cible" value={cible} onChange={(ev) => { setCible(ev.target.value); setChoix([]); }} className="w-full h-10 rounded-xl border bg-card px-3 text-sm">
          <option value="">Pour qui ?</option>
          <optgroup label="Groupes">{groupes.map((g) => <option key={g.id} value={`g:${g.id}`}>{g.name}</option>)}</optgroup>
          <optgroup label="Élèves">{eleves.map((x) => <option key={x.id} value={`e:${x.id}`}>{x.nom}</option>)}</optgroup>
        </select>
        {cible && (
          <div className="border rounded-xl p-2 space-y-0.5 max-h-80 overflow-y-auto">
            {cartes.map((c) => {
              const deja = dejaVue(c);
              return (
                <label key={c.id} className={cn('flex items-center gap-3 py-1.5 px-2 rounded-lg', deja ? 'opacity-50' : 'hover:bg-muted cursor-pointer')}>
                  <Checkbox disabled={deja} checked={deja || choix.includes(c.id)} onCheckedChange={() => setChoix((l) => l.includes(c.id) ? l.filter((x) => x !== c.id) : [...l, c.id])} />
                  <span className="text-sm font-medium flex-1">{c.title}</span>
                  {deja && <span className="text-[11px] text-muted-foreground">déjà ouverte</span>}
                </label>
              );
            })}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={enCours} onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button disabled={!choix.length || enCours} onClick={ouvrir}>{enCours ? 'Ouverture…' : `Ouvrir ${choix.length || ''} carte${choix.length > 1 ? 's' : ''}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
