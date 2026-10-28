import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { matiereOf } from '@/lib/devoirMatieres';
import { errorMessage } from '@/lib/utils';
import ValiderRenduDialog from './ValiderRenduDialog';
import { envoyerEncouragement, messageEncouragement } from './encourager';
import {
  useCahierClasse, dateCourte, enRetard, prenomOf,
  type CahierDevoir, type CahierEleve, type EtatCase,
} from './useCahierClasse';

type Props = { groupId: string | null; groupName: string; memberIds: string[]; onBack: () => void };
type ItemProgramme = { done?: boolean };

const CASE: Record<EtatCase, { emoji: string; cls: string; label: string }> = {
  hors: { emoji: '—', cls: 'bg-slate-50 text-slate-400 dark:bg-slate-900/40 dark:text-slate-600', label: 'pas concerné' },
  corrige: { emoji: '✅', cls: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200', label: 'validé' },
  rendu: { emoji: '🟠', cls: 'bg-orange-100 text-orange-900 ring-2 ring-orange-300 dark:bg-orange-950/60 dark:text-orange-200 dark:ring-orange-800', label: 'à valider' },
  a_refaire: { emoji: '🔄', cls: 'bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200', label: 'à refaire' },
  rien: { emoji: '⏳', cls: 'bg-red-200 text-red-900 dark:bg-red-950/70 dark:text-red-200', label: 'rien envoyé' },
};

const COMPORTEMENTS = [
  { k: 'attentif', e: '🙂', t: 'Attentif', on: 'bg-emerald-200 dark:bg-emerald-900' },
  { k: 'participe', e: '✋', t: 'Participe', on: 'bg-sky-200 dark:bg-sky-900' },
  { k: 'bavarde', e: '💬', t: 'Bavarde', on: 'bg-amber-200 dark:bg-amber-900' },
];

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Titre de colonne : sans la matière au début (déjà montrée par l'émoji), jamais coupé par « … » */
function titreCourt(titre: string, label: string) {
  const sans = titre.replace(new RegExp(`^\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*`, 'i'), '').trim();
  return sans || titre;
}

/** 📊 Proposition « C » choisie par Nadia (2026-10-26) : élèves × devoirs du groupe, une case par devoir. */
export default function TableauClasse({ groupId, groupName, memberIds, onBack }: Props) {
  const { calc, isLoading, error } = useCahierClasse(groupId, memberIds);
  const [cellule, setCellule] = useState<{ eleve: CahierEleve; devoir: CahierDevoir } | null>(null);
  const [encourage, setEncourage] = useState<{ eleves: CahierEleve[]; apercu: string } | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const membersKey = [...memberIds].sort().join(',');

  // 💎 diamants de la semaine
  const { data: diamants = new Map<string, { done: number; total: number }>() } = useQuery({
    queryKey: ['cahier-classe', 'diamants', membersKey],
    queryFn: async () => {
      const { data, error: e } = await supabase.rpc('weekly_program_view', {});
      if (e) throw e;
      const ids = new Set(membersKey.split(','));
      const map = new Map<string, { done: number; total: number }>();
      for (const p of data || []) {
        if (!ids.has(p.student_id)) continue;
        const items = (Array.isArray(p.items) ? p.items : []) as ItemProgramme[];
        map.set(p.student_id, { done: items.filter((i) => i?.done).length, total: items.length });
      }
      return map;
    },
  });
  // 🙂 Comportement au cours d'aujourd'hui (bilan, idée I)
  const queryClient = useQueryClient();
  const { data: comportements = new Set<string>() } = useQuery({
    queryKey: ['comportement', membersKey, todayIso()],
    enabled: !!membersKey,
    queryFn: async () => {
      const { data, error: e } = await supabase.from('behavior_marks').select('student_id, kind').in('student_id', membersKey.split(',')).eq('course_date', todayIso());
      if (e) throw e;
      return new Set((data || []).map((r) => `${r.student_id}|${r.kind}`));
    },
  });
  const basculerComportement = async (sid: string, kind: string, on: boolean) => {
    const { error: e } = on
      ? await supabase.from('behavior_marks').delete().eq('student_id', sid).eq('course_date', todayIso()).eq('kind', kind)
      : await supabase.from('behavior_marks').insert({ student_id: sid, course_date: todayIso(), kind });
    if (e) { toast.error(errorMessage(e)); return; }
    void queryClient.invalidateQueries({ queryKey: ['comportement'] });
  };
  // 🔥 séries
  const { data: series = new Map<string, number>() } = useQuery({
    queryKey: ['cahier-classe', 'series'],
    queryFn: async () => {
      const { data, error: e } = await supabase.rpc('class_program_streaks');
      if (e) throw e;
      return new Map((data || []).map((r) => [r.student_id, r.streak]));
    },
  });
  // ✅ prêt pour le cours (une ligne pour aujourd'hui ou plus tard)
  const { data: prets = new Set<string>() } = useQuery({
    queryKey: ['cahier-classe', 'prets', membersKey],
    enabled: !!membersKey,
    queryFn: async () => {
      const { data, error: e } = await supabase.from('course_ready')
        .select('student_id').in('student_id', membersKey.split(',')).gte('course_date', todayIso());
      if (e) return new Set<string>(); // table pas encore créée : on n'affiche simplement rien
      return new Set((data || []).map((r) => r.student_id));
    },
  });

  const resume = useMemo(() => {
    if (!calc) return null;
    let concernes = 0, valides = 0, aValider = 0, retard = 0;
    const enAttente: CahierEleve[] = [];
    for (const e of calc.eleves) {
      let rien = false;
      for (const d of calc.colonnes) {
        const etat = calc.etat(d, e.user_id);
        if (etat === 'hors') continue;
        concernes++;
        if (etat === 'corrige') valides++;
        if (etat === 'rendu') aValider++;
        if (etat === 'rien') { rien = true; if (enRetard(d)) retard++; }
      }
      if (rien) enAttente.push(e);
    }
    return { concernes, valides, aValider, retard, enAttente };
  }, [calc]);

  const demanderEncouragement = (eleves: CahierEleve[]) => {
    if (!eleves.length) return;
    setEncourage({ eleves, apercu: messageEncouragement(eleves[0].full_name, eleves[0].gender) });
  };

  const envoyerEncouragements = async () => {
    if (!encourage) return;
    setEnvoi(true);
    let ok = 0;
    try {
      for (const [i, e] of encourage.eleves.entries()) {
        // Un seul élève : le message montré ; plusieurs : un message au hasard pour chacun
        const msg = i === 0 ? encourage.apercu : messageEncouragement(e.full_name, e.gender);
        await envoyerEncouragement(e.user_id, msg);
        ok++;
      }
      toast.success(ok > 1 ? `💌 ${ok} messages d'encouragement envoyés` : `💌 Message envoyé à ${prenomOf(encourage.eleves[0].full_name)}`);
    } catch (err) {
      toast.error(`${ok} envoyé(s), puis une erreur : ${errorMessage(err)}`);
    } finally {
      setEnvoi(false);
      setEncourage(null);
    }
  };

  // Deux élèves au même prénom : « Lina N. » / « Lina P. »
  const nomCourt = useMemo(() => {
    const map = new Map<string, string>();
    const eleves = calc?.eleves ?? [];
    for (const e of eleves) {
      const p = prenomOf(e.full_name);
      const doublon = eleves.filter((x) => prenomOf(x.full_name) === p).length > 1;
      const nom = (e.full_name || '').trim().split(/\s+/)[1];
      map.set(e.user_id, doublon && nom ? `${p} ${nom[0].toUpperCase()}.` : p);
    }
    return map;
  }, [calc]);

  const rendu = cellule && calc ? calc.renduDe.get(`${cellule.devoir.id}|${cellule.eleve.user_id}`) ?? null : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack} className="shrink-0">← Retour</Button>
        <h2 className="flex-1 min-w-0 font-bold text-base sm:text-lg text-red-800 dark:text-red-300 [overflow-wrap:anywhere]">
          📊 Tableau de la classe · {groupName}
        </h2>
      </div>

      {error && <p className="rounded-xl bg-red-100 text-red-900 p-3 text-sm">😕 Impossible de charger le tableau : {errorMessage(error)}</p>}
      {isLoading && <p className="text-sm text-sky-700 dark:text-sky-300 text-center py-6">⏳ Chargement du tableau…</p>}

      {calc && resume && (
        <>
          <div className="rounded-2xl border-2 border-sky-200 bg-gradient-to-r from-sky-50 to-emerald-50 dark:border-sky-900 dark:from-sky-950/50 dark:to-emerald-950/40 p-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="flex-1 min-w-0 text-sm font-semibold text-sky-950 dark:text-sky-100">
              <span className="text-emerald-700 dark:text-emerald-300">✅ {resume.valides}/{resume.concernes} devoirs validés</span>
              {' · '}<span className="text-orange-700 dark:text-orange-300">🟠 {resume.aValider} à valider</span>
              {' · '}<span className="text-red-700 dark:text-red-300">⏳ {resume.retard} en retard</span>
            </p>
            {resume.enAttente.length > 0 && (
              <Button size="sm" className="shrink-0 bg-pink-600 hover:bg-pink-700 text-white" onClick={() => demanderEncouragement(resume.enAttente)}>
                💌 Encourager les ⏳ ({resume.enAttente.length})
              </Button>
            )}
          </div>

          {calc.eleves.length === 0 && <p className="text-sm text-center py-6 text-sky-800 dark:text-sky-200">👥 Aucun élève dans ce groupe pour l'instant.</p>}
          {calc.eleves.length > 0 && calc.colonnes.length === 0 && (
            <p className="text-sm text-center py-6 text-sky-800 dark:text-sky-200">📚 Aucun devoir donné à ce groupe ces 5 dernières semaines.</p>
          )}

          {calc.eleves.length > 0 && calc.colonnes.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border-2 border-red-100 dark:border-red-950 bg-white dark:bg-[#1c1212]">
              <table className="border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 bg-red-50 dark:bg-[#2a1515] px-2 py-2 text-left text-xs font-bold text-red-900 dark:text-red-200 border-b-2 border-red-100 dark:border-red-950 min-w-[6.5rem]">
                      Élève
                    </th>
                    {calc.colonnes.map((d) => {
                      const m = matiereOf(d.type);
                      const retard = enRetard(d);
                      return (
                        <th key={d.id} className="bg-red-50 dark:bg-[#2a1515] px-1.5 py-2 align-bottom border-b-2 border-red-100 dark:border-red-950 min-w-[5.5rem] max-w-[8rem]">
                          <div className="text-lg leading-none" aria-hidden>{m.emoji}</div>
                          <div className="mt-1 text-[11px] font-semibold leading-tight text-red-950 dark:text-red-100 [overflow-wrap:anywhere]" title={d.titre}>{titreCourt(d.titre, m.label)}</div>
                          {d.date_limite && (
                            <div className={`mt-0.5 text-[10px] font-medium ${retard ? 'text-red-600 dark:text-red-400' : 'text-sky-700 dark:text-sky-300'}`}>
                              📅 {dateCourte(d.date_limite)}
                            </div>
                          )}
                        </th>
                      );
                    })}
                    <th className="bg-sky-50 dark:bg-sky-950/50 px-1.5 py-2 text-xs font-bold text-sky-900 dark:text-sky-200 border-b-2 border-red-100 dark:border-red-950" title="Diamants de la semaine">💎</th>
                    <th className="bg-sky-50 dark:bg-sky-950/50 px-1.5 py-2 text-xs font-bold text-sky-900 dark:text-sky-200 border-b-2 border-red-100 dark:border-red-950" title="Série de semaines">🔥</th>
                    <th className="bg-sky-50 dark:bg-sky-950/50 px-1.5 py-2 text-xs font-bold text-sky-900 dark:text-sky-200 border-b-2 border-red-100 dark:border-red-950" title="Prêt pour le cours">Prêt</th>
                    <th className="bg-violet-50 dark:bg-violet-950/50 px-1.5 py-2 text-xs font-bold text-violet-900 dark:text-violet-200 border-b-2 border-red-100 dark:border-red-950" title="Comportement au cours d'aujourd'hui (pour le bilan)">Aujourd'hui</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.eleves.map((e) => {
                    const diam = diamants.get(e.user_id);
                    const serie = series.get(e.user_id) ?? 0;
                    return (
                      <tr key={e.user_id}>
                        <th scope="row" className="sticky left-0 z-10 bg-white dark:bg-[#1c1212] px-2 py-1.5 text-left text-sm font-semibold text-red-950 dark:text-red-100 border-b border-red-50 dark:border-red-950/60 [overflow-wrap:anywhere] max-w-[7.5rem]">
                          {nomCourt.get(e.user_id) ?? prenomOf(e.full_name)}
                        </th>
                        {calc.colonnes.map((d) => {
                          const etat = calc.etat(d, e.user_id);
                          const c = CASE[etat];
                          const touchable = etat !== 'hors';
                          return (
                            <td key={d.id} className="p-1 border-b border-red-50 dark:border-red-950/60 text-center">
                              {touchable ? (
                                <button
                                  type="button"
                                  onClick={() => setCellule({ eleve: e, devoir: d })}
                                  className={`w-full min-h-[2.25rem] rounded-lg text-base transition-transform active:scale-95 ${c.cls}`}
                                  aria-label={`${prenomOf(e.full_name)}, ${d.titre} : ${c.label}`}
                                >{c.emoji}</button>
                              ) : (
                                <span className={`block w-full min-h-[2.25rem] leading-[2.25rem] rounded-lg ${c.cls}`} aria-label={c.label}>{c.emoji}</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-1.5 border-b border-red-50 dark:border-red-950/60 text-center text-xs font-semibold text-sky-900 dark:text-sky-200 whitespace-nowrap">
                          {diam ? `${diam.done}/${diam.total}` : '—'}
                        </td>
                        <td className="px-1.5 border-b border-red-50 dark:border-red-950/60 text-center text-xs font-semibold text-orange-700 dark:text-orange-300 whitespace-nowrap">
                          {serie > 0 ? `🔥 ${serie}` : '—'}
                        </td>
                        <td className="px-1.5 border-b border-red-50 dark:border-red-950/60 text-center">
                          {prets.has(e.user_id) ? '✅' : <span className="text-slate-400">—</span>}
                        </td>
                        {/* Idée I du bilan (2026-10-28) : comportement noté pendant le cours, un toucher par bouton */}
                        <td className="px-1 border-b border-red-50 dark:border-red-950/60">
                          <div className="flex gap-0.5 justify-center">
                            {COMPORTEMENTS.map((c) => {
                              const on = comportements.has(`${e.user_id}|${c.k}`);
                              return (
                                <button key={c.k} type="button" title={c.t} aria-label={`${c.t} : ${prenomOf(e.full_name)}`} aria-pressed={on}
                                  onClick={() => void basculerComportement(e.user_id, c.k, on)}
                                  className={`h-8 w-8 rounded-lg text-base ${on ? c.on : 'bg-slate-100 dark:bg-slate-800 opacity-50 grayscale'}`}>{c.e}</button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[11px] text-sky-800 dark:text-sky-300">
            ✅ validé · 🟠 à valider (touche la case) · 🔄 à refaire · ⏳ rien envoyé · — pas concerné
          </p>
        </>
      )}

      <ValiderRenduDialog
        open={!!cellule}
        onClose={() => setCellule(null)}
        eleve={cellule?.eleve ?? null}
        devoir={cellule?.devoir ?? null}
        rendu={rendu}
        onEncourage={cellule ? () => demanderEncouragement([cellule.eleve]) : undefined}
      />

      <AlertDialog open={!!encourage} onOpenChange={(o) => { if (!o && !envoi) setEncourage(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>💌 Envoyer un encouragement ?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                {encourage && encourage.eleves.length > 1 ? (
                  <>
                    <p>Un petit mot (différent pour chacun) part dans la messagerie de :</p>
                    <p className="font-semibold text-foreground [overflow-wrap:anywhere]">{encourage.eleves.map((e) => prenomOf(e.full_name)).join(', ')}</p>
                  </>
                ) : (
                  <>
                    <p>Ce message part dans la messagerie de {prenomOf(encourage?.eleves[0]?.full_name)}, avec une notification :</p>
                    <p className="rounded-xl bg-pink-50 text-pink-950 dark:bg-pink-950/40 dark:text-pink-100 p-2 [overflow-wrap:anywhere]">{encourage?.apercu}</p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={envoi}>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={envoi} className="bg-pink-600 hover:bg-pink-700 text-white" onClick={() => void envoyerEncouragements()}>
              💌 Envoyer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
