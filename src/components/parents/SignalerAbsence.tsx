import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMesEnfants, type EnfantEspace } from '@/hooks/useMesEnfants';
import { useHolidays } from '@/hooks/useGroupCourse';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { sendPushNotification } from '@/lib/pushHelper';
import { codeOuvert, prenomDe } from '@/lib/espaceParents';
import { coursApres, COURS_PAR_DEFAUT } from '@/lib/rotationDevoirs';
import { courseLabel, type GroupSchedule } from '@/lib/groupCourse';
import { cn, errorMessage } from '@/lib/utils';
import { CodeParentsDialog } from './CodeParentsDialog';

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Cours d'un enfant : les 2 derniers (absence à justifier après coup) et les 4 prochains */
function coursDe(horaires: GroupSchedule[], holidays: { label: string; start_date: string; end_date: string }[]) {
  const liste = horaires.length ? horaires : [{ group_id: '', ...COURS_PAR_DEFAUT }];
  const out = new Map<string, Date>();
  for (const h of liste) {
    let c = coursApres(h, holidays, new Date(Date.now() - 15 * 86400000));
    for (let i = 0; i < 8 && out.size < 40; i++) {
      out.set(ymd(c), c);
      c = coursApres(h, holidays, c);
    }
  }
  const now = Date.now();
  const tous = [...out.values()].sort((a, b) => a.getTime() - b.getTime());
  const passes = tous.filter((c) => c.getTime() + 3 * 3600000 < now).slice(-2);
  const futurs = tous.filter((c) => c.getTime() + 3 * 3600000 >= now).slice(0, 4);
  return [...passes, ...futurs];
}

/**
 * 🙋 « Signaler une absence » (2026-10-28, demande de Nadia) : bouton rouge à droite du texte d'accueil.
 * Sur le compte d'un enfant (ses parents l'utilisent) ou d'un parent élève adulte (il choisit le ou les prénoms).
 * Le code parents est demandé avant de valider, pour qu'un enfant ne justifie pas lui-même son absence.
 */
export function BoutonSignalerAbsence() {
  const { data: enfants = [] } = useMesEnfants();
  const [ouvert, setOuvert] = useState(false);
  if (!enfants.length) return null;
  return (
    <>
      <button type="button" onClick={() => setOuvert(true)}
        className="shrink-0 rounded-full bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs sm:text-sm font-extrabold shadow-md ring-4 ring-red-200 dark:ring-red-900/60 active:scale-95 transition-transform">
        🙋 Signaler une absence
      </button>
      {ouvert && <SignalerAbsenceDialog enfants={enfants} onClose={() => setOuvert(false)} />}
    </>
  );
}

export function SignalerAbsenceDialog({ enfants, onClose }: { enfants: EnfantEspace[]; onClose: () => void }) {
  const { data: holidays = [] } = useHolidays();
  const { askValidation, validationDialog } = useConfirmValidation();
  const [choisis, setChoisis] = useState<string[]>(enfants.length === 1 ? [enfants[0].child_id] : []);
  const [etape, setEtape] = useState<'enfants' | 'cours'>(enfants.length === 1 ? 'cours' : 'enfants');
  const [codeDemande, setCodeDemande] = useState<EnfantEspace | null>(null);
  const [cours, setCours] = useState<Record<string, Date[]>>({});
  const [dates, setDates] = useState<Record<string, string[]>>({});
  const [motif, setMotif] = useState('');
  const [busy, setBusy] = useState(false);
  const nom = (id: string) => prenomDe(enfants.find((e) => e.child_id === id)?.full_name);

  /** Après le code : les cours de l'enfant (ses groupes et leurs heures) */
  const chargerCours = async (e: EnfantEspace, code: string) => {
    const { data, error } = await supabase.rpc('parent_child_devoirs', { p_child: e.child_id, p_code: code });
    if (error) { toast.error(errorMessage(error)); return; }
    const groupes = ((data as { groups?: string[] } | null)?.groups ?? []);
    const { data: h } = groupes.length ? await supabase.from('group_schedules').select('group_id, weekday, start_time').in('group_id', groupes) : { data: [] };
    const liste = coursDe((h || []) as GroupSchedule[], holidays);
    setCours((c) => ({ ...c, [e.child_id]: liste }));
    // Par défaut : le prochain cours
    const prochain = liste.find((c) => c.getTime() + 3 * 3600000 >= Date.now());
    setDates((d) => ({ ...d, [e.child_id]: prochain ? [ymd(prochain)] : [] }));
  };

  /** Chaque enfant choisi demande son code (s'il n'est pas déjà ouvert), puis ses cours */
  const suite = async (liste = choisis) => {
    for (const id of liste) {
      if (cours[id]) continue;
      const e = enfants.find((x) => x.child_id === id)!;
      const ouvertCode = codeOuvert(id);
      if (!ouvertCode) { setCodeDemande(e); return; }
      await chargerCours(e, ouvertCode.code);
    }
    setEtape('cours');
  };

  const envoyer = async () => {
    setBusy(true);
    try {
      const resume: string[] = [];
      for (const id of choisis) {
        const c = codeOuvert(id);
        const ds = dates[id] || [];
        if (!c || !ds.length) continue;
        const { data: label, error } = await supabase.rpc('justify_absence', { p_child: id, p_code: c.code, p_dates: ds, p_reason: motif.trim() || null });
        if (error) throw error;
        const jours = ds.map((x) => new Date(`${x}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })).join(', ');
        resume.push(`${nom(id)} : ${jours}`);
        sendPushNotification({ type: 'admin', category: 'adm_abs', title: '🙋 Absence signalée par les parents',
          body: `Absence de ${nom(id)} : ${jours}${motif.trim() ? ` (${motif.trim()})` : ''} · ${label}`, data: { url: '/admin?section=attendance' } });
      }
      toast.success(`✅ Absence justifiée, la professeure est prévenue. ${resume.join(' · ')}`);
      onClose();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  // Un seul enfant : on passe tout de suite au code
  const demarre = useRef(false);
  useEffect(() => {
    if (demarre.current || enfants.length !== 1) return;
    demarre.current = true;
    void suite([enfants[0].child_id]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = choisis.reduce((n, id) => n + (dates[id]?.length || 0), 0);

  return (
    <>
      <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>🙋 Signaler une absence</DialogTitle>
            <DialogDescription>Réservé aux parents : le code parents est demandé.</DialogDescription>
          </DialogHeader>

          {etape === 'enfants' ? (
            <div className="space-y-2">
              <p className="text-sm font-bold">Quel enfant sera absent ? (un ou plusieurs)</p>
              {enfants.map((e) => {
                const on = choisis.includes(e.child_id);
                return (
                  <button key={e.child_id} type="button" aria-pressed={on} onClick={() => setChoisis((c) => on ? c.filter((x) => x !== e.child_id) : [...c, e.child_id])}
                    className={cn('w-full flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left font-bold', on ? 'border-primary bg-primary/10' : 'border-border')}>
                    <span className={cn('h-5 w-5 rounded-md border-2 grid place-items-center text-xs', on ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground')}>{on ? '✓' : ''}</span>
                    <span className="flex-1 min-w-0 [overflow-wrap:anywhere]">{prenomDe(e.full_name)}</span>
                  </button>
                );
              })}
              <Button className="w-full" disabled={!choisis.length} onClick={() => void suite()}>Continuer</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {choisis.some((id) => !cours[id]) && <p className="text-center text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin" /> Un instant…</p>}
              {choisis.filter((id) => cours[id]).map((id) => (
                <div key={id} className="space-y-1.5">
                  <p className="text-sm font-bold">📅 Cours concernés pour {nom(id)}</p>
                  <div className="grid gap-1.5">
                    {cours[id].map((c) => {
                      const k = ymd(c);
                      const on = (dates[id] || []).includes(k);
                      const passe = c.getTime() + 3 * 3600000 < Date.now();
                      return (
                        <button key={k} type="button" aria-pressed={on}
                          onClick={() => setDates((d) => ({ ...d, [id]: on ? (d[id] || []).filter((x) => x !== k) : [...(d[id] || []), k] }))}
                          className={cn('flex items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-left text-sm', on ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : 'border-border')}>
                          <span className={cn('h-5 w-5 rounded-md border-2 grid place-items-center text-xs shrink-0', on ? 'bg-red-600 border-red-600 text-white' : 'border-muted-foreground')}>{on ? '✓' : ''}</span>
                          <span className="flex-1 min-w-0 first-letter:uppercase">{courseLabel(c)}</span>
                          {passe && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">passé</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={2} placeholder="Motif (facultatif) : maladie, rendez-vous…" />
              <Button className="w-full bg-red-600 hover:bg-red-700" disabled={busy || total === 0}
                onClick={() => askValidation('Justifier cette absence ?', `${choisis.map((id) => `${nom(id)} (${(dates[id] || []).length} cours)`).join(', ')} : la professeure sera prévenue.`, () => void envoyer())}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}✅ Absence justifiée
              </Button>
              {enfants.length > 1 && <button type="button" onClick={() => setEtape('enfants')} className="w-full text-xs font-bold text-primary">← Changer d'enfant</button>}
            </div>
          )}
          {validationDialog}
        </DialogContent>
      </Dialog>
      {codeDemande && (
        <CodeParentsDialog childId={codeDemande.child_id} childName={prenomDe(codeDemande.full_name)} open
          raison={`Pour signaler l'absence de ${prenomDe(codeDemande.full_name)}.`}
          onOpenChange={(o) => { if (!o) { setCodeDemande(null); if (enfants.length === 1) onClose(); } }}
          onOk={async (code) => { const e = codeDemande; setCodeDemande(null); await chargerCours(e, code); void suite(); }} />
      )}
    </>
  );
}
