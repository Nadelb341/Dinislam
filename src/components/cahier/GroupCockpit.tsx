import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useGroupCourse } from '@/hooks/useGroupCourse';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { courseAfter, courseLabel, inDays, WEEKDAYS, type CahierVue } from '@/lib/groupCourse';
import { saveDraft, loadDraft, clearDraft } from '@/hooks/useDraftRecovery';
import { errorMessage, cn } from '@/lib/utils';
import type { AdminTask, TodoGroup } from '@/lib/adminTasks';
import type { WeeklyProgram } from '@/lib/weeklyProgram';


const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * 📓 Déroulé du cours (proposition « D » choisie par Nadia, 2026-10-26) en tête de chaque groupe du Cahier de texte :
 * horaire du cours (vacances de la zone C sautées), « Cette semaine » (diamants, devoirs à valider, élèves prêts),
 * ① Avant le cours · ② Pendant (Mode cours, « Ce qu'on a vu », dupliquer la séance) · ③ Après (distribuer les devoirs, niveaux) · 🗂️ Mémo,
 * et les boutons 📊 Tableau de la classe, 📋 Récapitulatif, 📈 Bilans.
 */
export function GroupCockpit({ group, tasks, onOpen, onCourseMode, onMemo, memoOpen }: {
  group: TodoGroup; tasks: AdminTask[];
  onOpen: (vue: CahierVue) => void;
  onCourseMode: () => void;
  onMemo: () => void; memoOpen: boolean;
}) {
  const queryClient = useQueryClient();
  const { schedule, holidays, next } = useGroupCourse(group.id);
  const { askValidation, validationDialog } = useConfirmValidation();
  const [editHoraire, setEditHoraire] = useState(false);
  const [jour, setJour] = useState(3);
  const [heure, setHeure] = useState('14:00');
  const [vu, setVu] = useState('');
  const [vuOuvert, setVuOuvert] = useState(false);
  const members = group.memberIds;
  const nextDay = next ? ymd(next) : null;

  // « Cette semaine » : diamants des élèves du groupe, devoirs à valider, élèves prêts pour le prochain cours
  const { data: semaine } = useQuery({
    queryKey: ['cahier-classe', 'cockpit', group.id ?? 'general', nextDay],
    enabled: members.length > 0,
    queryFn: async () => {
      const [{ data: view }, { data: rendus }, { data: prets }] = await Promise.all([
        supabase.rpc('weekly_program_view', {}),
        supabase.from('devoirs_rendus').select('student_id').eq('statut', 'rendu').in('student_id', members),
        nextDay ? supabase.from('course_ready').select('student_id').eq('course_date', nextDay).in('student_id', members) : Promise.resolve({ data: [] as { student_id: string }[] }),
      ]);
      const progs = ((view || []) as unknown as WeeklyProgram[]).filter((p) => members.includes(p.student_id));
      const total = progs.reduce((s, p) => s + p.items.length, 0);
      const done = progs.reduce((s, p) => s + p.items.filter((i) => i.done).length, 0);
      return { total, done, aValider: (rendus || []).length, prets: new Set((prets || []).map((r) => r.student_id)).size };
    },
  });

  // « Ce qu'on a vu » du prochain cours (ou de celui du jour) : brouillon gardé sur l'appareil
  const draftKey = `dinislam_ce_quon_a_vu_${group.id ?? 'general'}`;
  const { data: session } = useQuery({
    queryKey: ['cahier-classe', 'session', group.id, nextDay],
    enabled: !!group.id && !!nextDay,
    queryFn: async () => {
      const { data } = await supabase.from('group_sessions').select('seen, seen_sent_at').eq('group_id', group.id!).eq('session_date', nextDay!).maybeSingle();
      return data;
    },
  });
  useEffect(() => { setVu(loadDraft<string>(draftKey) ?? session?.seen ?? ''); }, [session?.seen, draftKey]);
  useEffect(() => { if (vuOuvert && vu.trim() && vu !== (session?.seen ?? '')) saveDraft(draftKey, vu); }, [vu, vuOuvert, draftKey, session?.seen]);

  const saveHoraire = async () => {
    if (!group.id) return;
    const { error } = await supabase.from('group_schedules').upsert({ group_id: group.id, weekday: jour, start_time: heure, updated_at: new Date().toISOString() }, { onConflict: 'group_id' });
    if (error) { toast.error(errorMessage(error)); return; }
    queryClient.invalidateQueries({ queryKey: ['group-course'] });
    setEditHoraire(false);
    toast.success(`🕒 Cours du ${group.name} : le ${WEEKDAYS[jour - 1]} à ${heure.replace(':', ' h ')}`);
  };

  const saveVu = async () => {
    if (!group.id || !nextDay) return;
    const { error } = await supabase.from('group_sessions').upsert({ group_id: group.id, session_date: nextDay, seen: vu.trim() || null, updated_at: new Date().toISOString() }, { onConflict: 'group_id,session_date' });
    if (error) { toast.error(errorMessage(error)); return; }
    clearDraft(draftKey);
    queryClient.invalidateQueries({ queryKey: ['cahier-classe', 'session'] });
    toast.success(vu.trim() ? "📝 Enregistré : les absents le recevront ce soir à 20 h" : 'Effacé');
    setVuOuvert(false);
  };

  // Idée 6 : la séance (lignes « Prochain cours » et « À apporter ») recopiée pour le cours suivant
  const dupliquer = async () => {
    if (!schedule || !next) return;
    const lignes = tasks.filter((t) => !t.done && (t.next_course || t.to_bring));
    if (!lignes.length) { toast('Rien à dupliquer : ajoute d\'abord des lignes 🎒 ou 🧳'); return; }
    const suivant = courseAfter(schedule, holidays, next);
    const { error } = await supabase.from('admin_tasks').insert(lignes.map((t) => ({
      group_id: t.group_id, title: t.title, next_course: t.next_course, to_bring: t.to_bring, to_prepare: false,
      position: t.position, urgent: false, due_date: ymd(suivant), attachments: t.attachments ?? [],
    })));
    if (error) { toast.error(errorMessage(error)); return; }
    queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
    toast.success(`🔁 ${lignes.length} ligne${lignes.length > 1 ? 's' : ''} recopiée${lignes.length > 1 ? 's' : ''} pour le ${courseLabel(suivant)}`);
  };

  const pct = semaine && semaine.total ? Math.round((semaine.done / semaine.total) * 100) : 0;
  const aPreparer = tasks.filter((t) => !t.done && t.to_prepare).length;
  const aApporter = tasks.filter((t) => !t.done && t.to_bring).length;

  return (
    <div className="space-y-2.5">
      {/* Horaire du cours */}
      {group.id && (editHoraire || !schedule ? (
        <div className="rounded-2xl border-2 border-dashed border-sky-400 bg-sky-50 dark:bg-sky-950/30 p-3 space-y-2">
          <p className="text-sm font-bold">🕒 Quand a lieu le cours de ce groupe ?</p>
          <div className="flex flex-wrap items-center gap-2">
            <select value={jour} onChange={(e) => setJour(Number(e.target.value))} className="rounded-lg border bg-background px-2 py-2 text-sm" aria-label="Jour du cours">
              {WEEKDAYS.map((w, i) => <option key={w} value={i + 1}>{w}</option>)}
            </select>
            <Input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className="w-28" aria-label="Heure du cours" />
            <button type="button" onClick={() => void saveHoraire()} className="rounded-lg bg-sky-600 text-white px-3 py-2 text-sm font-bold">Enregistrer</button>
            {schedule && <button type="button" onClick={() => setEditHoraire(false)} className="text-sm font-semibold text-muted-foreground">Annuler</button>}
          </div>
          <p className="text-[11px] text-muted-foreground">Sert à la date à rendre automatique, au message « prêt ? » 2 h avant le cours, et au compte à rebours. Pas de cours pendant les vacances de la zone C.</p>
        </div>
      ) : next && (
        <button type="button" onClick={() => { setJour(schedule!.weekday); setHeure(schedule!.start_time.slice(0, 5)); setEditHoraire(true); }}
          className="w-full flex items-center justify-between gap-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 px-3 py-2 text-start">
          <span className="text-sm font-bold">⏳ Prochain cours : {courseLabel(next)}</span>
          <span className="shrink-0 rounded-full bg-sky-600 text-white px-2.5 py-0.5 text-xs font-extrabold">{inDays(next)}</span>
        </button>
      ))}

      {/* Cette semaine */}
      <div className="rounded-2xl bg-gradient-to-br from-[#2457a5] to-[#1e3a8a] text-white px-4 py-3">
        <p className="text-lg font-extrabold">Cette semaine</p>
        <p className="text-sm text-white/90">
          💎 {semaine?.done ?? 0} diamant{(semaine?.done ?? 0) > 1 ? 's' : ''} sur {semaine?.total ?? 0}
          {' · '}🎙️ {semaine?.aValider ?? 0} à valider
          {group.id && next ? ` · ✅ ${semaine?.prets ?? 0}/${members.length} prêts` : ''}
          {aApporter ? ` · 🧳 ${aApporter} à apporter` : ''}
        </p>
        <div className="mt-2 h-2 rounded-full bg-white/25 overflow-hidden"><div className="h-full bg-yellow-300 transition-all duration-500" style={{ width: `${pct}%` }} /></div>
      </div>

      {/* ① ② ③ 🗂️ */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border bg-card p-2.5 flex flex-col gap-1.5">
          <p className="text-sm font-extrabold">① Avant le cours</p>
          <p className="text-[11px] text-muted-foreground">{semaine?.aValider ?? 0} devoir{(semaine?.aValider ?? 0) > 1 ? 's' : ''} à valider · {aPreparer} à préparer</p>
          <button type="button" onClick={() => onOpen('tableau')} className="mt-auto rounded-xl bg-emerald-600 text-white py-2 text-xs font-extrabold">🎙️ Valider les devoirs</button>
        </div>
        <div className="rounded-2xl border bg-card p-2.5 flex flex-col gap-1.5">
          <p className="text-sm font-extrabold">② Pendant le cours</p>
          <p className="text-[11px] text-muted-foreground">Programme, appel, ce qu'on a vu</p>
          <button type="button" onClick={onCourseMode} className="mt-auto rounded-xl bg-amber-500 text-white py-2 text-xs font-extrabold">▶️ Mode cours</button>
          {group.id && next && (
            <div className="grid grid-cols-2 gap-1">
              <button type="button" onClick={() => setVuOuvert((v) => !v)} className={cn('rounded-lg border py-1.5 text-[11px] font-bold', session?.seen && 'border-emerald-500 text-emerald-700 dark:text-emerald-300')}>📝 Ce qu'on a vu{session?.seen ? ' ✓' : ''}</button>
              <button type="button" onClick={() => askValidation('Dupliquer la séance ?', 'Les lignes « Prochain cours » et « À apporter » seront recopiées pour le cours suivant.', () => void dupliquer())} className="rounded-lg border py-1.5 text-[11px] font-bold">🔁 Dupliquer</button>
            </div>
          )}
        </div>
        <div className="rounded-2xl border bg-card p-2.5 flex flex-col gap-1.5">
          <p className="text-sm font-extrabold">③ Après le cours</p>
          <p className="text-[11px] text-muted-foreground">Donner les devoirs, par niveau si besoin</p>
          <button type="button" onClick={() => onOpen('devoirs')} className="mt-auto rounded-xl bg-[#2457a5] text-white py-2 text-xs font-extrabold">📚 Distribuer les devoirs</button>
          {group.id && <button type="button" onClick={() => onOpen('niveaux')} className="rounded-lg border py-1.5 text-[11px] font-bold">🎚️ Niveaux du groupe</button>}
        </div>
        <div className="rounded-2xl border bg-card p-2.5 flex flex-col gap-1.5">
          <p className="text-sm font-extrabold">🗂️ Mémo</p>
          <p className="text-[11px] text-muted-foreground">Prochain cours, à préparer, à apporter, notes et fichiers</p>
          <button type="button" onClick={onMemo} className={cn('mt-auto rounded-xl py-2 text-xs font-extrabold text-white', memoOpen ? 'bg-violet-800' : 'bg-violet-600')}>{memoOpen ? '▲ Fermer le mémo' : '▼ Ouvrir le mémo'}</button>
        </div>
      </div>

      {vuOuvert && group.id && next && (
        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-3 space-y-2">
          <p className="text-sm font-bold">📝 Ce qu'on a vu au cours du {courseLabel(next)}</p>
          <Textarea value={vu} onChange={(e) => setVu(e.target.value)} rows={3} placeholder="Ex. : leçon 10 lignes 1 à 4, révision d'Al-Masad…" />
          <p className="text-[11px] text-muted-foreground">Envoyé tout seul ce soir à 20 h aux élèves notés absents à l'appel (seulement si tu as écrit quelque chose).{session?.seen_sent_at ? ' ✅ Déjà envoyé.' : ''}</p>
          <button type="button" onClick={() => void saveVu()} className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-bold">💾 Enregistrer</button>
        </div>
      )}

      {/* 📊 📋 📈 */}
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={() => onOpen('tableau')} className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 py-2.5 text-xs font-extrabold">📊 Tableau de la classe</button>
        <button type="button" onClick={() => onOpen('recap')} className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 py-2.5 text-xs font-extrabold">📋 Récapitulatif</button>
        <button type="button" onClick={() => onOpen('bilans')} className="rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 py-2.5 text-xs font-extrabold">📈 Bilans</button>
      </div>
      {validationDialog}
    </div>
  );
}
