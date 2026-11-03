import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { bornesSaison, nomBadge, type ReglagesSaisons } from '@/lib/saisons';
import { Medaille } from '@/components/saisons/BadgeSaison';

/**
 * 🏆 Badge de la saison, partie « enseignante » de la carte Décorations saisons (2026-11-04) :
 * oui/non, nombre de jours à atteindre, et pour chaque élève ses jours d'activité de la saison + badge gagné ou non.
 * Les jours d'activité ne sont comptés que depuis le 4 novembre 2026 (avant, l'enregistrement des visites ne marchait pas).
 */
const DEBUT_COMPTAGE = '2026-11-04';

export function BadgeSaisonAdmin({ r, maj }: { r: ReglagesSaisons; maj: <K extends keyof ReglagesSaisons>(k: K, v: ReglagesSaisons[K]) => void }) {
  const b = bornesSaison();
  const debut = b.debut > DEBUT_COMPTAGE ? b.debut : DEBUT_COMPTAGE;
  const joursPossibles = Math.round((new Date(b.fin).getTime() - new Date(debut).getTime()) / 86400000) + 1;
  const { data: lignes = [] } = useQuery({
    queryKey: ['season-badge', 'admin', b.cle],
    queryFn: async () => {
      const [{ data: profils }, { data: roles }, { data: visites }, { data: badges }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').eq('is_approved', true),
        supabase.from('user_roles').select('user_id').eq('role', 'student'),
        supabase.from('module_visits').select('user_id, day').gte('day', b.debut).lte('day', b.fin),
        supabase.from('season_badges').select('user_id, earned_at').eq('season_key', b.cle),
      ]);
      const eleves = new Set((roles ?? []).map((x) => x.user_id));
      const jours = new Map<string, Set<string>>();
      for (const v of visites ?? []) { if (!jours.has(v.user_id)) jours.set(v.user_id, new Set()); jours.get(v.user_id)!.add(v.day); }
      const gagnes = new Map((badges ?? []).map((x) => [x.user_id, x.earned_at]));
      return (profils ?? []).filter((p) => eleves.has(p.user_id))
        .map((p) => ({ id: p.user_id, nom: p.full_name || 'Élève', jours: jours.get(p.user_id)?.size ?? 0, gagne: gagnes.get(p.user_id) ?? null }))
        .sort((x, y) => (y.gagne ? 1 : 0) - (x.gagne ? 1 : 0) || y.jours - x.jours || x.nom.localeCompare(y.nom));
    },
  });

  return (
    <section className="space-y-2 rounded-2xl border-2 border-border bg-card/80 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2"><Medaille saison={b.saison} taille={36} />
          <span className="min-w-0"><span className="block text-sm font-extrabold">🏆 Badge de la saison</span>
            <span className="block text-xs text-muted-foreground">« {nomBadge(b.cle)} » : gagné quand l'élève a ouvert au moins une carte pendant assez de jours</span></span></span>
        <Switch checked={r.badge} onCheckedChange={(v) => maj('badge', v)} aria-label="Badge de la saison" />
      </div>
      {r.badge && (
        <>
          <label className="block text-sm font-semibold">Jours d'activité à atteindre : <b>{r.badgeJours}</b>
            <input type="range" min={5} max={91} value={r.badgeJours} onChange={(e) => maj('badgeJours', Number(e.target.value))} className="w-full accent-[#b5562b]" />
          </label>
          {r.badgeJours > joursPossibles && (
            <p className="rounded-xl bg-amber-100 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">⚠️ Il ne reste que {joursPossibles} jours pour compter cette saison (les jours ne sont comptés que depuis le 4 novembre) : avec {r.badgeJours} jours, personne ne pourra gagner ce badge-ci.</p>
          )}
          <div className="space-y-1">
            {lignes.length === 0 && <p className="text-xs text-muted-foreground">Aucun élève pour l'instant.</p>}
            {lignes.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-background/70 px-2 py-1 text-sm">
                <span className="min-w-0 [overflow-wrap:anywhere]">{l.gagne ? '🏅' : '•'} {l.nom}</span>
                <span className="shrink-0 tabular-nums text-xs font-bold">{l.gagne ? 'Badge gagné' : `${l.jours} / ${r.badgeJours} jours`}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
