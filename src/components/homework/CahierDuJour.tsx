import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmValidation } from '@/hooks/useConfirmValidation';
import { useConfetti } from '@/hooks/useConfetti';
import { withName, personalize } from '@/lib/encouragements';
import { nextCourse, inDays, type GroupSchedule, type Holiday } from '@/lib/groupCourse';
import { cn } from '@/lib/utils';
import { ymd } from './objectifJour';

/**
 * 📓 Haut du cahier de texte de l'élève (2026-10-26) :
 *  - 🎒 « Prêt pour le cours ✅ » (idée 7) : de la veille 18 h jusqu'à 1 h après le début du cours ;
 * Chaque carte est protégée : une erreur ici n'empêche jamais l'accueil de s'ouvrir.
 */
class SilentBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: Error) { console.error('Cahier du jour :', e); }
  render() { return this.state.failed ? null : this.props.children; }
}

const heure = (d: Date) => `${d.getHours()} h${d.getMinutes() ? String(d.getMinutes()).padStart(2, '0') : ''}`;
const jourLong = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/** L'heure qui avance toute seule (chaque minute) : la carte apparaît à 18 h la veille sans recharger */
function useNow(ms = 60000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

/** Texte au prénom, au masculin ou au féminin selon la fiche de l'élève ({e}, {prêt|prête}) */
function useAuPrenom() {
  const { user } = useAuth();
  const { data: gender = null } = useQuery({
    queryKey: ['my-gender', user?.id],
    enabled: !!user,
    staleTime: 3600000,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('gender').eq('user_id', user!.id).maybeSingle();
      return data?.gender ?? null;
    },
  });
  return (text: string) => personalize(text, (user?.user_metadata?.full_name as string | undefined) ?? null, gender);
}

// ───────────────────────────── 🎒 Prêt pour le cours ─────────────────────────────

function PretPourLeCoursInner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { askValidation, validationDialog } = useConfirmValidation();
  const { fireSuccess } = useConfetti();
  const now = useNow();
  const auPrenom = useAuPrenom();
  const [busy, setBusy] = useState(false);

  // Groupes de l'élève → horaires de leurs cours + vacances
  const { data: info } = useQuery({
    queryKey: ['course-ready-info', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: g } = await supabase.from('student_group_members').select('group_id').eq('user_id', user!.id);
      const ids = (g || []).map((x) => x.group_id);
      if (!ids.length) return { schedules: [] as GroupSchedule[], holidays: [] as Holiday[] };
      const [{ data: s }, { data: h }] = await Promise.all([
        supabase.from('group_schedules').select('group_id, weekday, start_time').in('group_id', ids),
        supabase.from('school_holidays').select('label, start_date, end_date'),
      ]);
      return { schedules: (s || []) as GroupSchedule[], holidays: (h || []) as Holiday[] };
    },
  });

  // Le cours le plus proche (encore affiché jusqu'à 1 h après son début)
  const cours = (info?.schedules || [])
    .map((s) => nextCourse(s, info?.holidays || [], now, 60))
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  const veille18h = cours ? new Date(cours.getFullYear(), cours.getMonth(), cours.getDate() - 1, 18, 0, 0, 0) : null;
  const visible = !!cours && !!veille18h && now >= veille18h && now.getTime() <= cours.getTime() + 3600000;
  const dateKey = cours ? ymd(cours) : '';

  const { data: pret = false } = useQuery({
    queryKey: ['course-ready', user?.id, dateKey],
    enabled: !!user && visible,
    queryFn: async () => {
      const { data } = await supabase.from('course_ready').select('course_date').eq('student_id', user!.id).eq('course_date', dateKey).maybeSingle();
      return !!data;
    },
  });

  if (!user || !visible || !cours) return null;

  const rafraichir = () => queryClient.invalidateQueries({ queryKey: ['course-ready', user.id] });
  const cocher = async () => {
    setBusy(true);
    const { error } = await supabase.from('course_ready').upsert({ student_id: user.id, course_date: dateKey }, { onConflict: 'student_id,course_date' });
    setBusy(false);
    if (error) { toast.error('Erreur : ' + error.message); return; }
    fireSuccess();
    toast.success(auPrenom('🎒 Bravo {prenom}, tu es {prêt|prête} pour le cours !'));
    void rafraichir();
  };
  const decocher = async () => {
    setBusy(true);
    const { error } = await supabase.from('course_ready').delete().eq('student_id', user.id).eq('course_date', dateKey);
    setBusy(false);
    if (error) { toast.error('Erreur : ' + error.message); return; }
    void rafraichir();
  };

  return (
    <div className={cn(
      'mb-3 rounded-2xl border-2 p-3 shadow-sm',
      pret ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/30 dark:to-sky-950/30 dark:border-emerald-700'
        : 'border-sky-300 bg-gradient-to-br from-sky-50 to-amber-50 dark:from-sky-950/30 dark:to-amber-950/20 dark:border-sky-800',
    )}>
      {pret ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex-1 min-w-[12rem] text-sm font-extrabold text-emerald-800 dark:text-emerald-200 [overflow-wrap:anywhere]">
            {auPrenom(`✅ Tu es {prêt|prête} pour le cours de ${jourLong(cours)}, bravo {prenom} !`)}
          </p>
          <button type="button" disabled={busy} onClick={() => void decocher()}
            className="shrink-0 rounded-full border border-emerald-300 bg-white/80 dark:bg-slate-900/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-200">
            ↩️ Décocher
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-base font-extrabold text-sky-900 dark:text-sky-100 [overflow-wrap:anywhere]">
            {auPrenom(`🎒 Cours ${inDays(cours, now)} à ${heure(cours)} : es-tu {prêt|prête} ?`)}
          </p>
          <p className="text-xs text-sky-800/80 dark:text-sky-200/80">Ton cahier, ta trousse et tes devoirs sont prêts ? Coche quand c'est bon.</p>
          <button type="button" disabled={busy}
            onClick={() => askValidation(auPrenom('{Prêt|Prête} pour le cours ?'), auPrenom(`Tu confirmes que tu es {prêt|prête} pour le cours de ${jourLong(cours)} à ${heure(cours)}.`), () => void cocher())}
            className="w-full rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 px-4 py-2.5 text-sm font-extrabold shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{auPrenom('✅ Je suis {prêt|prête} pour le cours')}
          </button>
        </div>
      )}
      {validationDialog}
    </div>
  );
}


export function PretPourLeCours() {
  return <SilentBoundary><PretPourLeCoursInner /></SilentBoundary>;
}
