import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { groupColorProps } from '@/lib/studentGroups';
import { COULEUR_LETTRE, type EtatLettre, type RaisonLettre } from '@/lib/alphabetProgress';
import { changerLettre } from '@/lib/alphabetOuvertures';
import { useAlphabetClasse, useLettresEnAttente, type EleveAlphabet } from '@/hooks/useAlphabetClasse';

/**
 * 🔤 Une lettre, et qui l'a (Nadia, 2026-11-11 : maquette B pour le titre, bas « comme C »).
 * Groupes repliés au départ, élèves sans groupe en dessous ; dans un groupe : « Ouvrir au groupe entier »
 * ou ouvrir à quelques élèves. Carré de couleur = mêmes codes que chez l'élève (vert, jaune, ⏳, rouge clair, gris).
 */
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lettre: { id: number; letter_arabic: string; name_french: string } | null;
  rang: number;
  onFiche: () => void;
}
interface Confirmation { titre: string; texte: string; bouton: string; action: () => Promise<void> }

const RAISON: Record<NonNullable<RaisonLettre>, string> = {
  adulte: '20 ans et plus : tout est ouvert',
  suivi: 'sa prochaine lettre',
  groupe: 'ouverte à son groupe',
  lui: 'ouverte pour lui',
};

export function AlphabetLettreAcces({ open, onOpenChange, lettre, rang, onFiche }: Props) {
  const queryClient = useQueryClient();
  const { groupes, eleves, calc, isLoading, isError } = useAlphabetClasse(open);
  const enAttente = useLettresEnAttente(open);
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [enCours, setEnCours] = useState(false);

  if (!lettre) return null;
  const label = `${lettre.letter_arabic} (${lettre.name_french})`;
  const membres = (g: string) => eleves.filter((e) => e.groupes.includes(g));
  const sansGroupe = eleves.filter((e) => !e.groupes.length);
  const nomGroupe = (g: string) => groupes.find((x) => x.id === g)?.name ?? 'groupe';

  const faire = async (op: Parameters<typeof changerLettre>[0], ok: string) => {
    const r = await changerLettre(op);
    queryClient.invalidateQueries({ queryKey: ['alphabet-classe'] });
    queryClient.invalidateQueries({ queryKey: ['admin-alphabet-grid'] });
    queryClient.invalidateQueries({ queryKey: ['cartes-journal'] });
    if (r === 'en_attente') toast.info('📡 Hors connexion : gardé sur cet appareil, envoyé au retour du réseau');
    else toast.success(ok);
  };
  const lancer = async () => {
    if (!confirmation) return;
    setEnCours(true);
    try { await confirmation.action(); setConfirmation(null); } catch (e) { toast.error(`Pas enregistré : ${(e as Error).message}`); } finally { setEnCours(false); }
  };

  const groupeEntier = (g: { id: string; name: string }) => {
    if (!calc) return;
    const m = membres(g.id);
    if (calc.groupeOuvert(g.id, lettre.id)) {
      setConfirmation({
        titre: `Fermer ${label} au groupe « ${g.name} » ?`,
        texte: 'Les élèves qui l\'ont déjà apprise, ou pour qui c\'est la prochaine lettre, la gardent.',
        bouton: 'Fermer au groupe',
        action: () => faire({ sens: 'fermer', cible: 'groupe', id: g.id, letterId: lettre.id, titreLettre: label, prevenir: [], journal: `🔤 ${label} fermée au groupe « ${g.name} »` }, `${label} fermée au groupe « ${g.name} »`),
      });
    } else {
      const prevenir = m.filter((e) => calc.pour(e, lettre.id).etat === 'fermee').map((e) => e.id);
      setConfirmation({
        titre: `Ouvrir ${label} au groupe entier « ${g.name} » ?`,
        texte: `${m.length} élève${m.length > 1 ? 's' : ''} dans ce groupe${prevenir.length ? `, ${prevenir.length} la découvr${prevenir.length > 1 ? 'ent' : 'e'} (notification)` : ''}. Les élèves qui rejoindront ce groupe plus tard l'auront aussi.`,
        bouton: 'Ouvrir au groupe',
        action: () => faire({ sens: 'ouvrir', cible: 'groupe', id: g.id, letterId: lettre.id, titreLettre: label, prevenir, journal: `🔤 ${label} ouverte au groupe « ${g.name} »` }, `${label} ouverte au groupe « ${g.name} » ✅`),
      });
    }
  };

  const unEleve = (e: EleveAlphabet, raison: RaisonLettre, etat: EtatLettre) => {
    if (raison === 'lui') {
      setConfirmation({
        titre: `Fermer ${label} à ${e.nom} ?`,
        texte: etat === 'apprise' ? 'Elle est déjà apprise : elle restera verte.' : 'Elle redeviendra grise sur son alphabet (sauf si c\'est sa prochaine lettre).',
        bouton: 'Fermer',
        action: () => faire({ sens: 'fermer', cible: 'eleve', id: e.id, letterId: lettre.id, titreLettre: label, prevenir: [], journal: `🔤 ${label} fermée à ${e.nom}` }, `${label} fermée à ${e.nom}`),
      });
    } else {
      setConfirmation({
        titre: `Ouvrir ${label} à ${e.nom} ?`,
        texte: `Elle deviendra jaune sur son alphabet et ${e.nom} recevra une notification.`,
        bouton: 'Ouvrir',
        action: () => faire({ sens: 'ouvrir', cible: 'eleve', id: e.id, letterId: lettre.id, titreLettre: label, prevenir: [e.id], journal: `🔤 ${label} ouverte à ${e.nom}` }, `${label} ouverte à ${e.nom} ✅`),
      });
    }
  };

  const LigneEleve = ({ e }: { e: EleveAlphabet }) => {
    if (!calc) return null;
    const { etat, raison } = calc.pour(e, lettre.id);
    const c = COULEUR_LETTRE[etat];
    return (
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{e.nom}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">{c.label}{raison && etat !== 'apprise' ? ` · ${RAISON[raison]}` : ''}</p>
        </div>
        {(raison === 'lui' || etat === 'fermee') && (
          <button type="button" onClick={() => unEleve(e, raison, etat)}
            className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg border shrink-0', raison === 'lui' ? 'border-red-200 text-red-700 dark:text-red-300' : 'border-yellow-300 text-yellow-800 dark:text-yellow-200')}>
            {raison === 'lui' ? 'Fermer' : 'Ouvrir'}
          </button>
        )}
        <span className={cn('w-8 h-8 rounded-lg shrink-0 grid place-items-center text-xs', c.carre)} title={c.label} aria-label={c.label}>
          {etat === 'attente' ? '⏳' : etat === 'fermee' ? '🔒' : ''}
        </span>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-full rounded-2xl max-h-[92vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="p-4 pb-3 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950/40 dark:to-amber-950/40 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <span className="font-arabic text-5xl leading-none w-16 h-16 rounded-2xl bg-card grid place-items-center shrink-0">{lettre.letter_arabic}</span>
              <div className="min-w-0 text-start">
                <DialogTitle className="text-lg">{lettre.name_french}</DialogTitle>
                <DialogDescription>{rang}ᵉ lettre · qui l'a ?</DialogDescription>
              </div>
            </div>
            <Button size="sm" variant="outline" className="mt-2 self-start" onClick={onFiche}>📖 Voir la fiche de la lettre</Button>
          </DialogHeader>

          <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-2 text-[11px] text-muted-foreground border-b">
            {(['apprise', 'ouverte', 'attente', 'a_revoir', 'fermee'] as EtatLettre[]).map((k) => (
              <span key={k} className="inline-flex items-center gap-1"><i className={cn('w-3 h-3 rounded inline-block', COULEUR_LETTRE[k].carre)} />{COULEUR_LETTRE[k].label}</span>
            ))}
          </div>

          {enAttente > 0 && <p className="mx-4 mt-3 text-xs rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 px-3 py-2">📡 {enAttente} changement{enAttente > 1 ? 's' : ''} en attente du réseau</p>}
          {isError && <p className="m-4 text-sm text-destructive">📡 Impossible de charger (Internet nécessaire la toute première fois).</p>}
          {isLoading || !calc ? <p className="p-6 text-center text-sm text-muted-foreground">Chargement…</p> : (
            <div className="p-3 space-y-2">
              {groupes.map((g) => {
                const m = membres(g.id);
                const deplie = ouverts.has(g.id);
                const auGroupe = calc.groupeOuvert(g.id, lettre.id);
                const lOnt = m.filter((e) => calc.pour(e, lettre.id).etat !== 'fermee').length;
                return (
                  <div key={g.id} className="rounded-xl border overflow-hidden">
                    <button type="button" onClick={() => setOuverts((s) => { const n = new Set(s); if (n.has(g.id)) n.delete(g.id); else n.add(g.id); return n; })}
                      className="w-full flex items-center gap-2 px-3 py-2.5 bg-amber-50/70 dark:bg-amber-950/30 text-start" aria-expanded={deplie}>
                      <span className="text-xs w-3">{deplie ? '▾' : '▸'}</span>
                      <span className={`w-3 h-3 rounded-full shrink-0 ${groupColorProps(g.color).className}`} style={groupColorProps(g.color).style} />
                      <span className="font-bold text-sm flex-1 min-w-0">👥 {g.name}</span>
                      {auGroupe && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100 shrink-0">groupe entier</span>}
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">{lOnt}/{m.length}</span>
                    </button>
                    {deplie && (
                      <div className="divide-y">
                        <div className="px-3 py-2">
                          <Button size="sm" variant={auGroupe ? 'outline' : 'default'} className={cn('w-full', !auGroupe && 'bg-yellow-400 hover:bg-yellow-500 text-yellow-950')} onClick={() => groupeEntier(g)}>
                            {auGroupe ? `Fermer au groupe entier` : `Ouvrir au groupe entier`}
                          </Button>
                        </div>
                        {m.map((e) => <LigneEleve key={e.id} e={e} />)}
                        {!m.length && <p className="px-3 py-2 text-xs text-muted-foreground">Aucun élève dans ce groupe.</p>}
                      </div>
                    )}
                  </div>
                );
              })}
              {sansGroupe.length > 0 && (
                <div className="rounded-xl border overflow-hidden">
                  <p className="px-3 py-2.5 font-bold text-sm bg-muted/50">👤 Élèves sans groupe</p>
                  <div className="divide-y">{sansGroupe.map((e) => <LigneEleve key={e.id} e={e} />)}</div>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground px-1">Une lettre ouverte à la main reste ouverte, mais n'ouvre pas les suivantes : seule ta validation fait avancer l'élève.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmation} onOpenChange={(v) => { if (!v && !enCours) setConfirmation(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmation?.titre}</AlertDialogTitle>
            <AlertDialogDescription>{confirmation?.texte}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enCours}>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={enCours} onClick={(ev) => { ev.preventDefault(); void lancer(); }}>{enCours ? '…' : confirmation?.bouton}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
