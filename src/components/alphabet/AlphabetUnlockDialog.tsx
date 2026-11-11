import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { groupColorProps } from '@/lib/studentGroups';
import { COULEUR_LETTRE, type AlphabetLetterLite, type EtatLettre } from '@/lib/alphabetProgress';
import { changerLettre } from '@/lib/alphabetOuvertures';
import { useAlphabetClasse, useLettresEnAttente, type EleveAlphabet } from '@/hooks/useAlphabetClasse';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letters: AlphabetLetterLite[];
  /** Élève présélectionné (depuis sa fiche) */
  initialStudentId?: string;
}
type Cible = { type: 'groupe'; id: string; nom: string } | { type: 'eleve'; id: string; nom: string };

/**
 * 🔓 Débloquer des lettres (Nadia, 2026-11-11) : d'abord les GROUPES (repliés) puis « Élèves sans groupe » ;
 * dans un groupe : « Débloquer pour tout le groupe » ou un élève à la fois ; ensuite la grille des 28 lettres.
 * Alif aussi attend d'être débloquée ; une lettre validée ouvre la suivante toute seule (lib/alphabetProgress).
 * Écriture : `changerLettre` (journal, notification, hors ligne), comme la fenêtre d'une lettre.
 */
export function AlphabetUnlockDialog({ open, onOpenChange, letters, initialStudentId }: Props) {
  const queryClient = useQueryClient();
  const { groupes, eleves, calc, isLoading } = useAlphabetClasse(open);
  const enAttente = useLettresEnAttente(open);
  const [cible, setCible] = useState<Cible | null>(null);
  const [deplies, setDeplies] = useState<Set<string>>(new Set());
  const [choisies, setChoisies] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const membres = (g: string) => eleves.filter((e) => e.groupes.includes(g));
  const sansGroupe = eleves.filter((e) => !e.groupes.length);
  const ouvertAvant = (c: Cible, id: number) => (calc ? (c.type === 'groupe' ? calc.groupeOuvert(c.id, id) : calc.persoOuvert(c.id, id)) : false);

  const choisir = (c: Cible) => {
    setCible(c);
    setChoisies(new Set(letters.filter((l) => ouvertAvant(c, l.id)).map((l) => l.id)));
  };
  // Ouvert depuis la fiche d'un élève : sa grille directement
  useEffect(() => {
    if (!open) { setCible(null); return; }
    if (initialStudentId && calc && !cible) {
      const e = eleves.find((x) => x.id === initialStudentId);
      if (e) choisir({ type: 'eleve', id: e.id, nom: e.nom });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une seule fois quand les données arrivent
  }, [open, initialStudentId, !!calc]);

  const enregistrer = async () => {
    if (!cible || !calc) return;
    const ajout = letters.filter((l) => choisies.has(l.id) && !ouvertAvant(cible, l.id));
    const retrait = letters.filter((l) => !choisies.has(l.id) && ouvertAvant(cible, l.id));
    if (!ajout.length && !retrait.length) { setCible(null); return; }
    setSaving(true);
    let attente = false;
    try {
      const qui = cible.type === 'groupe' ? membres(cible.id) : eleves.filter((e) => e.id === cible.id);
      for (const l of ajout) {
        const label = `${l.letter_arabic} (${l.name_french})`;
        const prevenir = qui.filter((e) => calc.pour(e, l.id).etat === 'fermee').map((e) => e.id);
        const r = await changerLettre({ sens: 'ouvrir', cible: cible.type, id: cible.id, letterId: l.id, titreLettre: label, prevenir,
          journal: `🔤 ${label} ouverte ${cible.type === 'groupe' ? `au groupe « ${cible.nom} »` : `à ${cible.nom}`}` });
        attente ||= r === 'en_attente';
      }
      for (const l of retrait) {
        const label = `${l.letter_arabic} (${l.name_french})`;
        const r = await changerLettre({ sens: 'fermer', cible: cible.type, id: cible.id, letterId: l.id, titreLettre: label, prevenir: [],
          journal: `🔤 ${label} fermée ${cible.type === 'groupe' ? `au groupe « ${cible.nom} »` : `à ${cible.nom}`}` });
        attente ||= r === 'en_attente';
      }
      for (const k of ['alphabet-classe', 'admin-alphabet-grid', 'alphabet-unlock-student', 'alphabet-admin-unlocks', 'cartes-journal']) queryClient.invalidateQueries({ queryKey: [k] });
      const txt = [ajout.length ? `🔓 ${ajout.length} lettre${ajout.length > 1 ? 's' : ''} débloquée${ajout.length > 1 ? 's' : ''}` : '', retrait.length ? `🔒 ${retrait.length} refermée${retrait.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ');
      if (attente) toast.info(`📡 Hors connexion : ${txt}, envoyé au retour du réseau`); else toast.success(`${txt} pour ${cible.nom} ✅`);
      setCible(null);
    } catch (e) {
      toast.error(`Pas enregistré : ${(e as Error).message}`);
    } finally { setSaving(false); }
  };

  const LigneEleve = ({ e }: { e: EleveAlphabet }) => (
    <button type="button" onClick={() => choisir({ type: 'eleve', id: e.id, nom: e.nom })} className="w-full flex items-center gap-2 px-3 py-2 text-start hover:bg-muted/60">
      <span className="flex-1 min-w-0 text-sm font-semibold [overflow-wrap:anywhere]">{e.nom}</span>
      {calc && <span className="text-[11px] text-muted-foreground shrink-0">{letters.filter((l) => calc.pour(e, l.id).etat === 'apprise').length} apprise{letters.filter((l) => calc.pour(e, l.id).etat === 'apprise').length > 1 ? 's' : ''}{e.adulte ? ' · 20 ans +' : ''}</span>}
      <span className="text-muted-foreground shrink-0">›</span>
    </button>
  );

  // ——— Grille des lettres d'une cible ———
  const grille = () => {
    if (!cible || !calc) return null;
    const eleve = cible.type === 'eleve' ? eleves.find((e) => e.id === cible.id) : null;
    const qui = cible.type === 'groupe' ? membres(cible.id) : [];
    const modif = letters.some((l) => choisies.has(l.id) !== ouvertAvant(cible, l.id));
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => setCible(null)} className="text-sm font-semibold text-primary">← Groupes et élèves</button>
        <p className="font-bold">{cible.type === 'groupe' ? `👥 Tout le groupe « ${cible.nom} »` : `👤 ${cible.nom}`}</p>
        {eleve?.adulte && <p className="text-xs rounded-lg bg-muted px-3 py-2">20 ans et plus : toutes ses lettres sont déjà ouvertes.</p>}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {cible.type === 'eleve'
            ? (['apprise', 'ouverte', 'attente', 'a_revoir', 'fermee'] as EtatLettre[]).map((k) => <span key={k} className="inline-flex items-center gap-1"><i className={cn('w-3 h-3 rounded inline-block', COULEUR_LETTRE[k].carre)} />{COULEUR_LETTRE[k].label}</span>)
            : <><span className="inline-flex items-center gap-1"><i className={cn('w-3 h-3 rounded inline-block', COULEUR_LETTRE.ouverte.carre)} />Ouverte au groupe</span><span>chiffre = élèves qui l'ont déjà</span></>}
          <span>✓ = débloquée par toi</span>
        </div>
        <div dir="rtl" className="grid grid-cols-7 gap-1.5">
          {letters.map((l) => {
            const coche = choisies.has(l.id);
            let cls = COULEUR_LETTRE.fermee.carre, bloque = false, bas = '';
            if (eleve) {
              const { etat, raison } = calc.pour(eleve, l.id);
              cls = coche ? COULEUR_LETTRE.ouverte.carre : COULEUR_LETTRE[etat].carre;
              // Déjà ouverte autrement (apprise, suite de l'ordre, groupe, 20 ans +) : rien à débloquer ici
              bloque = !ouvertAvant(cible, l.id) && (etat === 'apprise' || raison === 'suivi' || raison === 'groupe' || raison === 'adulte');
              bas = raison === 'groupe' && !coche ? '👥' : etat === 'attente' ? '⏳' : '';
            } else {
              const n = qui.filter((e) => calc.pour(e, l.id).etat !== 'fermee').length;
              cls = coche ? COULEUR_LETTRE.ouverte.carre : n ? 'bg-yellow-50 dark:bg-yellow-950/20' : COULEUR_LETTRE.fermee.carre;
              bas = `${n}/${qui.length}`;
            }
            return (
              <button key={l.id} type="button" disabled={bloque}
                onClick={() => setChoisies((s) => { const n = new Set(s); if (n.has(l.id)) n.delete(l.id); else n.add(l.id); return n; })}
                className={cn('relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center', cls, coche ? 'border-amber-500' : 'border-transparent', bloque && 'opacity-60 cursor-not-allowed')}
                aria-pressed={coche} aria-label={`${l.name_french}${coche ? ' (débloquée par toi)' : ''}`}>
                <span className="font-arabic text-2xl leading-none">{l.letter_arabic}</span>
                {bas && <span dir="ltr" className="text-[9px] leading-none mt-0.5 text-muted-foreground">{bas}</span>}
                {coche && <span className="absolute -top-1 -left-1 text-[10px] bg-amber-500 text-white rounded-full w-4 h-4 grid place-items-center">✓</span>}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">Une lettre débloquée s'ouvre seule ; quand tu la valides, la suivante passe toute seule à « à apprendre ».</p>
        <Button className="w-full" disabled={!modif || saving} onClick={() => void enregistrer()}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogTitle>🔓 Débloquer des lettres</DialogTitle>
        <DialogDescription>Choisis un groupe (ou un élève), puis les lettres à ouvrir. Alif aussi attend que tu la débloques.</DialogDescription>
        {enAttente > 0 && <p className="text-xs rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 px-3 py-2">📡 {enAttente} changement{enAttente > 1 ? 's' : ''} en attente du réseau</p>}
        {isLoading || !calc ? <p className="py-6 text-center text-sm text-muted-foreground">Chargement…</p> : cible ? grille() : (
          <div className="space-y-2">
            {groupes.map((g) => {
              const m = membres(g.id), ouvert = deplies.has(g.id);
              return (
                <div key={g.id} className="rounded-xl border overflow-hidden">
                  <button type="button" aria-expanded={ouvert} onClick={() => setDeplies((s) => { const n = new Set(s); if (n.has(g.id)) n.delete(g.id); else n.add(g.id); return n; })}
                    className="w-full flex items-center gap-2 px-3 py-2.5 bg-amber-50/70 dark:bg-amber-950/30 text-start">
                    <span className="text-xs w-3">{ouvert ? '▾' : '▸'}</span>
                    <span className={`w-3 h-3 rounded-full shrink-0 ${groupColorProps(g.color).className}`} style={groupColorProps(g.color).style} />
                    <span className="font-bold text-sm flex-1 min-w-0">👥 {g.name}</span>
                    <span className="text-xs text-muted-foreground">{m.length} élève{m.length > 1 ? 's' : ''}</span>
                  </button>
                  {ouvert && (
                    <div className="divide-y">
                      <div className="px-3 py-2">
                        <Button size="sm" className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-950" disabled={!m.length}
                          onClick={() => choisir({ type: 'groupe', id: g.id, nom: g.name })}>🔓 Débloquer pour tout le groupe</Button>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
