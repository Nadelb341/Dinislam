import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useMesEnfants, type EnfantEspace } from '@/hooks/useMesEnfants';
import { useHolidays } from '@/hooks/useGroupCourse';
import { codeOuvert, estAdulteParentPossible, prenomDe } from '@/lib/espaceParents';
import { matiereOf } from '@/lib/devoirMatieres';
import { aRattraper, horairePour, heureDeRendu, rangement, type Decision } from '@/lib/rotationDevoirs';
import type { GroupSchedule } from '@/lib/groupCourse';
import { titrePeriode, type BilanSnapshot } from '@/lib/bilanTrimestriel';
import { cn, errorMessage } from '@/lib/utils';
import { BilanVue, type BilanContenu } from '@/components/bilan/BilanVue';
import { CodeParentsDialog } from './CodeParentsDialog';
import { SignalerAbsenceDialog } from './SignalerAbsence';
import { ChoixEnfants } from './MessagesProfil';

/**
 * 👨‍👩‍👧 Espace parents dans les Paramètres (2026-10-28, choix de Nadia) :
 * enfant (moins de 18 ans) → son propre espace ; parent élève adulte → ses enfants triés par prénom.
 * Chaque enfant s'ouvre avec le code parents : 📊 bilans de chaque trimestre, 📓 cahier de texte (lecture seule),
 * 🙋 signaler une absence, 🔐 codes (jusqu'à 2 : ex. Maman et Papa).
 */
export function EspaceParentsCarte() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: enfants = [], isLoading } = useMesEnfants();
  const [demande, setDemande] = useState<EnfantEspace | null>(null);
  const [ouvert, setOuvert] = useState<EnfantEspace | null>(null);
  const [ajout, setAjout] = useState(false);

  const { data: moi } = useQuery({
    queryKey: ['espace-parents', 'moi', user?.id],
    enabled: !!user && !isAdmin,
    queryFn: async () => (await supabase.from('profiles').select('full_name, date_of_birth, age, children_question').eq('user_id', user!.id).maybeSingle()).data,
  });
  const { data: nonLus = {} } = useQuery({
    queryKey: ['espace-parents', 'non-lus', enfants.map((e) => e.child_id).join(',')],
    enabled: enfants.length > 0,
    queryFn: async () => {
      const out: Record<string, number> = {};
      await Promise.all(enfants.map(async (e) => { const { data } = await supabase.rpc('parent_unread_count', { p_child: e.child_id }); out[e.child_id] = data ?? 0; }));
      return out;
    },
  });

  // Lien d'une notification « 📊 Nouveau bilan » : /settings?espace=parents → la carte est visible tout de suite
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('espace') === 'parents') document.getElementById('espace-parents')?.scrollIntoView({ block: 'start' });
  }, [isLoading]);

  const parentPossible = estAdulteParentPossible(moi ?? null) || moi?.children_question === 'oui';
  if (isAdmin || isLoading || (!enfants.length && !parentPossible)) return null;

  const ouvrir = (e: EnfantEspace) => (codeOuvert(e.child_id) ? setOuvert(e) : setDemande(e));

  return (
    <Card id="espace-parents" className="border-2 border-violet-300 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-sky-50 dark:from-violet-950/30 dark:to-sky-950/30 scroll-mt-20">
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="font-extrabold text-violet-900 dark:text-violet-100">👨‍👩‍👧 Espace parents</p>
          <p className="text-xs text-muted-foreground">Bilans de chaque trimestre, cahier de texte et absences. Protégé par le code parents.</p>
        </div>
        {enfants.map((e) => (
          <button key={e.child_id} type="button" onClick={() => ouvrir(e)}
            className="w-full flex items-center gap-2 rounded-xl border-2 border-border bg-card px-3 py-2.5 text-left hover:border-violet-400">
            <span className="flex-1 min-w-0 font-bold [overflow-wrap:anywhere]">{e.soiMeme ? `🔐 Espace parents de ${prenomDe(e.full_name)}` : `🧒 ${prenomDe(e.full_name)}`}</span>
            {(nonLus[e.child_id] ?? 0) > 0 && <span className="shrink-0 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-extrabold text-destructive-foreground">{nonLus[e.child_id]} nouveau{nonLus[e.child_id] > 1 ? 'x' : ''} bilan{nonLus[e.child_id] > 1 ? 's' : ''}</span>}
            <span className="shrink-0 text-muted-foreground">›</span>
          </button>
        ))}
        {parentPossible && (
          ajout ? (
            <div className="rounded-xl border-2 border-dashed border-violet-300 bg-card p-3 space-y-2">
              <p className="text-sm font-bold">➕ Relier un enfant élève</p>
              <ChoixEnfants nomParent={moi?.full_name ?? null} onOk={() => { setAjout(false); queryClient.invalidateQueries({ queryKey: ['espace-parents'] }); }} />
              <button type="button" onClick={() => setAjout(false)} className="w-full text-xs font-bold text-muted-foreground">Fermer</button>
            </div>
          ) : (
            <button type="button" onClick={() => setAjout(true)} className="w-full rounded-xl border-2 border-dashed border-violet-300 px-3 py-2 text-sm font-bold text-violet-800 dark:text-violet-200">
              ➕ Relier un enfant qui suit aussi les cours
            </button>
          )
        )}
      </CardContent>
      {demande && (
        <CodeParentsDialog childId={demande.child_id} childName={prenomDe(demande.full_name)} open
          onOpenChange={(o) => { if (!o) setDemande(null); }} onOk={() => { setOuvert(demande); setDemande(null); }} />
      )}
      {ouvert && <EspaceEnfant enfant={ouvert} onClose={() => { setOuvert(null); queryClient.invalidateQueries({ queryKey: ['espace-parents', 'non-lus'] }); }} />}
    </Card>
  );
}

type BilanParent = BilanContenu & { id: string; period_label: string; sent_at: string; lu: boolean };

function EspaceEnfant({ enfant, onClose }: { enfant: EnfantEspace; onClose: () => void }) {
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  const { data: holidays = [] } = useHolidays();
  const prenom = prenomDe(enfant.full_name);
  const code = codeOuvert(enfant.child_id)?.code ?? '';
  const [onglet, setOnglet] = useState<'bilans' | 'cahier'>('bilans');
  const [bilanOuvert, setBilanOuvert] = useState<BilanParent | null>(null);
  const [absence, setAbsence] = useState(false);
  const [codes, setCodes] = useState(false);

  const { data: bilans = [], isLoading, error } = useQuery({
    queryKey: ['espace-parents', 'bilans', enfant.child_id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('parent_bilans', { p_child: enfant.child_id, p_code: code });
      if (error) throw error;
      return ((data as Record<string, unknown>[]) ?? []).map((d) => ({
        id: d.id as string, period_label: d.period_label as string, sent_at: d.sent_at as string, lu: !!d.lu,
        snapshot: d.snapshot as BilanSnapshot, appreciation: (d.appreciation as string) ?? null, motivation: (d.motivation as string) ?? null,
        note: (d.note as number) ?? null, guide: (d.guide as BilanContenu['guide']) ?? null, traduction: (d.traduction as BilanContenu['traduction']) ?? null, langueAr: (d.langue_ar as string) ?? null,
      }));
    },
  });

  // 📓 Idée 4 : le cahier de texte de l'enfant en lecture seule (pour un parent relié)
  const { data: cahier } = useQuery({
    queryKey: ['espace-parents', 'cahier', enfant.child_id],
    enabled: !enfant.soiMeme && onglet === 'cahier',
    queryFn: async () => {
      const { data, error } = await supabase.rpc('parent_child_devoirs', { p_child: enfant.child_id, p_code: code });
      if (error) throw error;
      const d = data as { groups: string[]; devoirs: { id: string; titre: string; type: string; created_at: string; visible_a: string | null; date_limite: string | null; group_id: string | null; statut: string | null; rendu_at: string | null }[] };
      const { data: h } = d.groups.length ? await supabase.from('group_schedules').select('group_id, weekday, start_time').in('group_id', d.groups) : { data: [] };
      return { ...d, horaires: (h || []) as GroupSchedule[] };
    },
  });

  const ouvrirBilan = (b: BilanParent) => {
    setBilanOuvert(b);
    if (!b.lu) void supabase.rpc('bilan_mark_read', { p_report: b.id, p_code: code });
  };

  const lignesCahier = (cahier?.devoirs ?? []).map((d) => {
    const h = horairePour(d.group_id, cahier!.groups, cahier!.horaires, holidays);
    const ligne = { id: d.id, created_at: d.created_at, visible_a: d.visible_a, date_limite: d.date_limite };
    const fait = !!d.statut && d.statut !== 'a_refaire';
    const rang = rangement(ligne, h, holidays);
    return { ...d, fait, rang, rendu: heureDeRendu(ligne, h, holidays), rattraper: aRattraper(ligne, fait, rang, undefined as Decision | undefined) };
  }).filter((d) => d.rang === 'semaine' || d.rattraper);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="p-0 overflow-hidden max-w-lg">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[88vh] overflow-y-auto p-4 space-y-3">
          <DialogHeader>
            <DialogTitle className="[overflow-wrap:anywhere]">👨‍👩‍👧 Espace parents · {prenom}</DialogTitle>
            <DialogDescription>Ouvert avec le code « {codeOuvert(enfant.child_id)?.label} » pour 15 minutes.</DialogDescription>
          </DialogHeader>

          {bilanOuvert ? (
            <div className="space-y-2">
              <button type="button" onClick={() => setBilanOuvert(null)} className="text-sm font-bold text-primary">← Tous les bilans</button>
              <BilanVue {...bilanOuvert} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setAbsence(true)} className="rounded-xl bg-red-600 text-white px-3 py-2 text-sm font-extrabold">🙋 Signaler une absence</button>
                <button type="button" onClick={() => setCodes(true)} className="rounded-xl border-2 border-violet-300 px-3 py-2 text-sm font-bold">🔐 Codes parents</button>
              </div>
              {!enfant.soiMeme && (
                <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                  {([['bilans', '📊 Bilans'], ['cahier', '📓 Cahier de texte']] as const).map(([k, t]) => (
                    <button key={k} type="button" role="tab" aria-selected={onglet === k} onClick={() => setOnglet(k)}
                      className={cn('rounded-lg py-2 text-sm font-extrabold', onglet === k ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground')}>{t}</button>
                  ))}
                </div>
              )}

              {onglet === 'bilans' && (
                isLoading ? <p className="text-center text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Un instant…</p>
                : error ? <p className="text-sm text-destructive">{errorMessage(error)}</p>
                : !bilans.length ? <p className="rounded-xl bg-muted p-3 text-sm">📊 Pas encore de bilan. Le prochain arrivera avant les vacances scolaires.</p>
                : bilans.map((b) => (
                  <button key={b.id} type="button" onClick={() => ouvrirBilan(b)} className="w-full flex items-center gap-2 rounded-xl border-2 border-border bg-card px-3 py-2.5 text-left">
                    <span className="flex-1 min-w-0 font-bold [overflow-wrap:anywhere]">📊 Bilan avant les {titrePeriode(b.period_label, b.snapshot?.periode?.fin ?? b.sent_at)}</span>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold', b.lu ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' : 'bg-destructive text-destructive-foreground')}>{b.lu ? 'lu' : 'nouveau'}</span>
                  </button>
                ))
              )}

              {onglet === 'cahier' && (
                !cahier ? <p className="text-center text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Un instant…</p>
                : !lignesCahier.length ? <p className="rounded-xl bg-muted p-3 text-sm">✅ Rien à faire pour le moment.</p>
                : lignesCahier.sort((a, b) => a.rendu.getTime() - b.rendu.getTime()).map((d) => (
                  <div key={d.id} className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2">
                    <span className="text-lg">{matiereOf(d.type).emoji}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block cahier-main text-lg leading-6 [overflow-wrap:anywhere]">{d.titre}</span>
                      <span className="block text-[11px] text-muted-foreground">{d.rattraper ? '🔁 à rattraper' : `pour le ${d.rendu.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`}</span>
                    </span>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold', d.statut === 'corrige' ? 'bg-emerald-100 text-emerald-800' : d.statut === 'rendu' ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800')}>
                      {d.statut === 'corrige' ? '💎 validé' : d.statut === 'rendu' ? '🟠 envoyé' : d.statut === 'a_refaire' ? '🔄 à refaire' : 'à faire'}
                    </span>
                  </div>
                ))
              )}
            </>
          )}
        </div>
        <ScrollButtons showTop={showTop} showBottom={showBottom} onScrollTop={scrollToTop} onScrollBottom={scrollToBottom} position="absolute" />
        {absence && <SignalerAbsenceDialog enfants={[enfant]} onClose={() => setAbsence(false)} />}
        {codes && <CodeParentsDialog childId={enfant.child_id} childName={prenom} open raison="Codes déjà créés, ou en ajouter un 2e (ex. Papa)."
          onOpenChange={(o) => { if (!o) setCodes(false); }} onOk={() => setCodes(false)} />}
      </DialogContent>
    </Dialog>
  );
}
