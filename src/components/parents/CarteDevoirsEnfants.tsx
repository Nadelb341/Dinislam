import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMesEnfants } from '@/hooks/useMesEnfants';
import { cn } from '@/lib/utils';

/**
 * 👪 « Devoirs de mes enfants » (Nadia, 2026-11-18 — idée 16, modèle 2 « Carte à part sur l'accueil », idée 2 « voir si l'enfant a rendu »).
 * Carte SÉPARÉE de « Devoirs à faire » : les devoirs du parent (s'il est aussi élève) ne s'y mélangent jamais.
 * Une ligne par enfant relié et CONFIRMÉ (lecture autorisée par la base : weekly_program_view + is_parent_of).
 * États = ceux des diamants de l'enfant : ✅ validé, 🟠 envoyé, ⏳ à faire.
 * Visible seulement pour un parent relié (rien du tout sinon).
 */
type ItemProgramme = { module: string; item_id: string; label: string; emoji?: string | null; due?: string | null; done?: boolean | null; pending?: boolean | null };
type DevoirsEnfant = { id: string; prenom: string; devoirs: ItemProgramme[] };

const COULEURS = ['bg-rose-500', 'bg-violet-600', 'bg-sky-600', 'bg-emerald-600', 'bg-amber-600'];

const pourLe = (due?: string | null) => {
  if (!due) return null;
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'numeric' });
};

export default function CarteDevoirsEnfants() {
  const { user } = useAuth();
  const { data: enfants = [] } = useMesEnfants();
  // Le compte de l'enfant lui-même (Espace parents « soi-même ») a déjà ses devoirs dans « Devoirs à faire »
  const relies = enfants.filter((e) => !e.soiMeme);
  const ids = relies.map((e) => e.child_id);

  const { data = [], isLoading } = useQuery({
    queryKey: ['weekly-program', 'enfants', user?.id, ids.join(',')],
    enabled: !!user && ids.length > 0,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<DevoirsEnfant[]> => {
      const lignes = await Promise.all(relies.map(async (e) => {
        const { data: prog, error } = await supabase.rpc('weekly_program_view', { p_student: e.child_id });
        if (error) throw error;
        const items = ((prog?.[0]?.items ?? []) as unknown as ItemProgramme[]).filter((i) => i.module === 'devoir');
        return { id: e.child_id, prenom: (e.full_name || 'Mon enfant').trim().split(/\s+/)[0], devoirs: items };
      }));
      return lignes;
    },
  });

  if (!ids.length) return null;

  return (
    <section id="enfants" className="scroll-mt-20 rounded-2xl border-2 border-[#e2bb57] bg-card p-3 shadow-sm space-y-3" aria-label="Devoirs de mes enfants">
      <div>
        <h2 className="text-base font-extrabold text-foreground">👪 Devoirs de mes enfants</h2>
        <p className="text-xs text-muted-foreground">À part de tes propres devoirs.</p>
      </div>
      {isLoading && !data.length ? (
        <div className="h-14 rounded-xl bg-muted/50 animate-pulse" />
      ) : (
        data.map((e, idx) => {
          const restants = e.devoirs.filter((d) => !d.done && !d.pending).length;
          return (
            <div key={e.id} className="rounded-xl border bg-background/60 p-2.5 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold text-white', COULEURS[idx % COULEURS.length])}>{e.prenom}</span>
                <span className="text-sm font-semibold text-foreground">
                  {!e.devoirs.length ? 'Pas de devoir cette semaine' : restants === 0 ? 'Tout est rendu ✅' : `${restants} à faire`}
                </span>
              </div>
              {e.devoirs.length > 0 && (
                <ul className="space-y-1">
                  {e.devoirs.map((d) => {
                    const etat = d.done ? { t: '✅ Validé', c: 'text-emerald-700 dark:text-emerald-300' }
                      : d.pending ? { t: '🟠 Envoyé', c: 'text-orange-700 dark:text-orange-300' }
                      : { t: '⏳ À faire', c: 'text-muted-foreground' };
                    const date = pourLe(d.due);
                    return (
                      <li key={d.item_id} className="flex items-start justify-between gap-2 text-sm">
                        <span className="min-w-0 [overflow-wrap:anywhere] text-foreground">
                          {d.emoji ? `${d.emoji} ` : ''}{d.label}
                          {date && <span className="block text-xs text-muted-foreground">pour {date}</span>}
                        </span>
                        <span className={cn('shrink-0 text-xs font-bold whitespace-nowrap', etat.c)}>{etat.t}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
