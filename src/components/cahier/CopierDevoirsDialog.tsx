import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { ScrollButtons } from '@/components/ui/ScrollButtons';
import { Button } from '@/components/ui/button';
import { useHolidays } from '@/hooks/useGroupCourse';
import { nextCourse, courseLabel, type GroupSchedule } from '@/lib/groupCourse';
import { COURS_PAR_DEFAUT } from '@/lib/rotationDevoirs';
import { matiereDe } from '@/lib/devoirFichiers';
import { sendPushNotification } from '@/lib/pushHelper';
import { cn, errorMessage } from '@/lib/utils';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

/**
 * 📋 Idée 5 (2026-11-04) : copier des devoirs d'un groupe vers un ou plusieurs autres groupes, avec leurs documents,
 * leur consigne audio, l'élément à ouvrir et les étapes. La date à rendre devient le prochain cours de CHAQUE groupe
 * (vacances sautées). Les élèves du groupe reçoivent « 📓 Tes nouveaux devoirs sont prêts ! ».
 */
export function CopierDevoirsDialog({ open, onClose, groupeId, groupeNom, groupes, devoirs, memberships }: {
  open: boolean; onClose: () => void; groupeId: string; groupeNom: string;
  groupes: { id: string; name: string }[]; devoirs: Tables<'devoirs'>[];
  /** 2026-11-11 : les devoirs sont donnés élève par élève → on retrouve ceux des élèves de ce groupe */
  memberships: { user_id: string; group_id: string }[];
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { scrollRef, handleScroll, showTop, showBottom, scrollToTop, scrollToBottom } = useScrollToTop();
  const { data: holidays = [] } = useHolidays();
  const { data: horaires = [] } = useQuery({
    queryKey: ['group-course', 'all-schedules'],
    queryFn: async () => ((await supabase.from('group_schedules').select('group_id, weekday, start_time')).data || []) as GroupSchedule[],
  });
  // Devoirs de ce groupe des 3 dernières semaines (les plus récents d'abord), ceux de la semaine cochés d'office
  const recents = useMemo(() => {
    const depuis = Date.now() - 21 * 86_400_000;
    const membres = new Set(memberships.filter((m) => m.group_id === groupeId).map((m) => m.user_id));
    // Devoirs du groupe entier (avant le 11/11) + devoirs donnés à ses élèves un par un (le même devoir n'apparaît qu'une fois)
    const vus = new Set<string>();
    return devoirs.filter((d) => (d.group_id === groupeId || (!!d.student_id && membres.has(d.student_id))) && new Date(d.created_at || 0).getTime() > depuis)
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .filter((d) => { const k = `${d.titre}|${d.type}|${d.cible_id ?? ''}|${d.date_limite ?? ''}`; if (vus.has(k)) return false; vus.add(k); return true; });
  }, [devoirs, groupeId, memberships]);
  const [choisis, setChoisis] = useState<string[] | null>(null);
  const coches = choisis ?? recents.filter((d) => Date.now() - new Date(d.created_at || 0).getTime() < 7 * 86_400_000).map((d) => d.id);
  const [cibles, setCibles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const autres = groupes.filter((g) => g.id !== groupeId);
  const prochainDe = (gid: string) => nextCourse(horaires.find((h) => h.group_id === gid) ?? { ...COURS_PAR_DEFAUT, group_id: gid }, holidays);

  const copier = async () => {
    if (!user || !coches.length || !cibles.length) return;
    setBusy(true);
    try {
      const lignes: TablesInsert<'devoirs'>[] = [];
      // 2026-11-11 : un devoir par ÉLÈVE du groupe visé (comme la nouvelle distribution élève par élève)
      for (const gid of cibles) {
        const date = prochainDe(gid).toISOString();
        const eleves = [...new Set(memberships.filter((m) => m.group_id === gid).map((m) => m.user_id))];
        for (const id of coches) {
          const d = recents.find((x) => x.id === id); if (!d) continue;
          for (const sid of eleves) lignes.push({
            titre: d.titre, type: d.type, description: d.description, lien_lecon: d.lien_lecon, etapes: d.etapes,
            cible_module: d.cible_module, cible_id: d.cible_id, audio_requis: d.audio_requis, consigne_audio_url: d.consigne_audio_url,
            pieces_jointes: d.pieces_jointes, matiere_label: d.matiere_label, matiere_emoji: d.matiere_emoji,
            assigned_to: 'student', student_id: sid, date_limite: date, created_by: user.id,
          });
        }
      }
      if (!lignes.length) throw new Error('Aucun élève dans le ou les groupes choisis');
      const { error } = await supabase.from('devoirs').insert(lignes);
      if (error) throw error;
      const ids = [...new Set(lignes.map((l) => l.student_id!).filter(Boolean))];
      if (ids.length) sendPushNotification({ userIds: ids, title: '📓 Tes nouveaux devoirs sont prêts !', category: 'hw_new', body: coches.map((id) => recents.find((x) => x.id === id)?.titre).filter(Boolean).join(' · '), data: { url: '/?open=devoirs' } });
      queryClient.invalidateQueries({ queryKey: ['admin-devoirs'] });
      toast.success(`📋 ${coches.length} devoir${coches.length > 1 ? 's' : ''} copié${coches.length > 1 ? 's' : ''} vers ${cibles.length} groupe${cibles.length > 1 ? 's' : ''}`);
      setCibles([]); setChoisis(null); onClose();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden" level="nested">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[88dvh] overflow-y-auto p-6 space-y-3">
        <DialogTitle className="pe-8 text-base [overflow-wrap:anywhere]">📋 Copier des devoirs de « {groupeNom} »</DialogTitle>
        {!recents.length ? <p className="text-sm text-muted-foreground">Aucun devoir donné à ce groupe ces 3 dernières semaines.</p> : (
          <div className="space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">1. Les devoirs à copier</p>
            <div className="space-y-1">
              {recents.map((d) => {
                const on = coches.includes(d.id), m = matiereDe(d);
                return (
                  <label key={d.id} className={cn('flex items-start gap-2 rounded-xl border px-2.5 py-2 cursor-pointer', on ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/30' : 'bg-card')}>
                    <input type="checkbox" checked={on} className="mt-1 h-4 w-4 accent-sky-600"
                      onChange={() => setChoisis(on ? coches.filter((x) => x !== d.id) : [...coches, d.id])} />
                    <span className="min-w-0 text-sm"><b>{m.emoji} {m.label}</b> · <span className="[overflow-wrap:anywhere]">{d.titre}</span>
                      <span className="block text-[11px] text-muted-foreground">donné le {new Date(d.created_at || 0).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}{d.consigne_audio_url ? ' · 🎧' : ''}{Array.isArray(d.pieces_jointes) && d.pieces_jointes.length ? ` · 📎 ${d.pieces_jointes.length}` : ''}</span></span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">2. Vers quels groupes ?</p>
            <div className="flex flex-wrap gap-1.5">
              {autres.map((g) => {
                const on = cibles.includes(g.id);
                return <button key={g.id} type="button" aria-pressed={on} onClick={() => setCibles((c) => (on ? c.filter((x) => x !== g.id) : [...c, g.id]))}
                  className={cn('rounded-xl border px-3 py-1.5 text-sm font-medium', on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card')}>{on ? '✓ ' : ''}{g.name}</button>;
              })}
            </div>
            {cibles.length > 0 && (
              <ul className="rounded-xl bg-muted/60 p-2 text-xs space-y-0.5">
                {cibles.map((gid) => <li key={gid}>📅 {groupes.find((g) => g.id === gid)?.name} : à rendre {courseLabel(prochainDe(gid))}</li>)}
              </ul>
            )}
            <Button className="w-full" disabled={busy || !coches.length || !cibles.length} onClick={() => void copier()}>
              {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}📋 Copier {coches.length} devoir{coches.length > 1 ? 's' : ''}
            </Button>
          </div>
        )}
        </div>
        <ScrollButtons showTop={showTop} showBottom={showBottom} onScrollTop={scrollToTop} onScrollBottom={scrollToBottom} position="absolute" />
      </DialogContent>
    </Dialog>
  );
}
