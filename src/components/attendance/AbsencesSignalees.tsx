import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { todayIso } from '@/lib/attendanceSessions';
import { groupColorProps, trierGroupesParNumero } from '@/lib/studentGroups';
import { cn } from '@/lib/utils';

/**
 * 📩 « Absences signalées par les parents » (aujourd'hui et à venir), rangées par groupe :
 * Groupe 0, Groupe 1, Groupe 2…, puis les groupes sans numéro ; élèves numérotés sous leur groupe.
 * La même carte dans le Registre de présence et sur l'accueil, au-dessus du Cahier de texte (2026-10-30).
 * Sur l'accueil (`compacte`), elle ne s'affiche que s'il y a au moins une absence.
 */
export function AbsencesSignalees({ compacte = false }: { compacte?: boolean }) {
  const { data } = useQuery({
    queryKey: ['absences-justifiees', 'carte'],
    queryFn: async () => {
      const { data: abs, error } = await supabase.from('absence_justifications')
        .select('student_id, course_date, reason, declared_label').gte('course_date', todayIso()).order('course_date');
      if (error) throw error;
      const ids = [...new Set((abs || []).map((a) => a.student_id))];
      if (!ids.length) return { abs: [], noms: [], membres: [], groupes: [] };
      const [{ data: noms }, { data: membres }, { data: groupes }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').in('user_id', ids),
        supabase.from('student_group_members').select('user_id, group_id').in('user_id', ids),
        supabase.from('student_groups').select('id, name, color'),
      ]);
      return { abs: abs || [], noms: noms || [], membres: membres || [], groupes: groupes || [] };
    },
  });

  if (!data || (compacte && !data.abs.length)) return null;
  const aujourdhui = todayIso();
  const nom = (id: string) => data.noms.find((n) => n.user_id === id)?.full_name || 'Élève';
  // Chaque élève sous son (premier) groupe, groupes triés par numéro, « Sans groupe » à la fin
  const groupeDe = (id: string) => data.membres.find((m) => m.user_id === id)?.group_id ?? null;
  const groupesTries = trierGroupesParNumero(data.groupes.filter((g) => data.abs.some((a) => groupeDe(a.student_id) === g.id)));
  const blocs = [
    ...groupesTries.map((g) => ({ id: g.id, nom: g.name, color: g.color as string | null, liste: data.abs.filter((a) => groupeDe(a.student_id) === g.id) })),
    ...(data.abs.some((a) => !groupeDe(a.student_id)) ? [{ id: 'sans', nom: 'Sans groupe', color: null, liste: data.abs.filter((a) => !groupeDe(a.student_id)) }] : []),
  ];
  const duJour = data.abs.filter((a) => a.course_date === aujourdhui).length;

  return (
    <section className="rounded-2xl border-2 border-sky-300 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-800 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 min-w-0 text-sm font-extrabold text-sky-900 dark:text-sky-100">📩 Absences signalées par les parents</p>
        {duJour > 0 && <span className="shrink-0 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-extrabold text-white">🔵 {duJour} aujourd'hui</span>}
      </div>
      {!data.abs.length && <p className="text-sm text-muted-foreground">Aucune absence signalée pour aujourd'hui ni pour les prochains cours.</p>}
      {blocs.map((b) => {
        const couleur = groupColorProps(b.color);
        return (
          <div key={b.id} className="rounded-xl bg-card overflow-hidden border border-sky-200 dark:border-sky-900">
            <p className={cn('px-3 py-1.5 text-xs font-extrabold text-white [overflow-wrap:anywhere]', couleur.className)} style={couleur.style}>👥 {b.nom}</p>
            <ol className="px-3 py-2 space-y-1">
              {b.liste.map((a, i) => (
                <li key={`${a.student_id}-${a.course_date}`} className={cn('text-sm [overflow-wrap:anywhere]', a.course_date === aujourdhui && 'font-semibold')}>
                  <span className="text-muted-foreground tabular-nums">{i + 1}.</span> <b>{nom(a.student_id)}</b>
                  {' · '}{a.course_date === aujourdhui ? <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-1.5 text-blue-800 dark:text-blue-200 font-bold">aujourd'hui</span> : format(parseISO(a.course_date), 'EEEE d MMMM', { locale: fr })}
                  {a.reason ? ` · ${a.reason}` : ''}{a.declared_label ? ` (${a.declared_label})` : ''}
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </section>
  );
}
