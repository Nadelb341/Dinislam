import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { matiereOf } from '@/lib/devoirMatieres';
import { errorMessage } from '@/lib/utils';
import ValiderRenduDialog from './ValiderRenduDialog';
import { useCahierClasse, dateCourte, prenomOf, type CahierDevoir, type CahierEleve, type CahierRendu } from './useCahierClasse';

type Props = { groupId: string | null; groupName: string; memberIds: string[]; onBack: () => void };

const DAY = 24 * 60 * 60 * 1000;

const COLONNES = {
  prepare: { titre: '📝 À préparer', fond: 'bg-sky-50 dark:bg-sky-950/40', bord: 'border-sky-200 dark:border-sky-900', texte: 'text-sky-900 dark:text-sky-100', pastille: 'bg-sky-600' },
  donne: { titre: '📚 Donné', fond: 'bg-red-50 dark:bg-red-950/30', bord: 'border-red-200 dark:border-red-900', texte: 'text-red-900 dark:text-red-100', pastille: 'bg-red-600' },
  valider: { titre: '🎙️ À valider', fond: 'bg-orange-50 dark:bg-orange-950/30', bord: 'border-orange-200 dark:border-orange-900', texte: 'text-orange-900 dark:text-orange-100', pastille: 'bg-orange-500' },
  termine: { titre: '✅ Terminé', fond: 'bg-emerald-50 dark:bg-emerald-950/30', bord: 'border-emerald-200 dark:border-emerald-900', texte: 'text-emerald-900 dark:text-emerald-100', pastille: 'bg-emerald-600' },
} as const;

function Colonne({ type, count, children, vide }: { type: keyof typeof COLONNES; count: number; children: React.ReactNode; vide: string }) {
  const c = COLONNES[type];
  return (
    <section className={`rounded-2xl border-2 ${c.bord} ${c.fond} p-3 min-w-0 overflow-hidden`}>
      <h3 className={`flex items-center justify-between gap-2 font-bold text-sm ${c.texte}`}>
        <span className="min-w-0 [overflow-wrap:anywhere]">{c.titre}</span>
        <span className={`shrink-0 min-w-[1.5rem] h-6 px-1.5 rounded-full text-white text-xs font-bold flex items-center justify-center ${c.pastille}`}>{count}</span>
      </h3>
      <div className="mt-2 space-y-1.5">
        {count === 0 ? <p className={`text-xs opacity-80 ${c.texte}`}>{vide}</p> : children}
      </div>
    </section>
  );
}

/** 🗂️ Proposition « E » (2026-10-26) : 4 colonnes À préparer → Donné → À valider → Terminé. */
export default function Recapitulatif({ groupId, groupName, memberIds, onBack }: Props) {
  const { calc, isLoading, error } = useCahierClasse(groupId, memberIds);
  const [choix, setChoix] = useState<{ eleve: CahierEleve; devoir: CahierDevoir | null; rendu: CahierRendu } | null>(null);

  const { data: aPreparer = [] } = useQuery({
    queryKey: ['cahier-classe', 'a-preparer', groupId],
    queryFn: async () => {
      let q = supabase.from('admin_tasks').select('id, title, due_date, urgent').eq('to_prepare', true).eq('done', false);
      q = groupId ? q.eq('group_id', groupId) : q.is('group_id', null);
      const { data, error: e } = await q.order('urgent', { ascending: false }).order('position', { ascending: true });
      if (e) throw e;
      return data || [];
    },
  });

  const colonnes = useMemo(() => {
    if (!calc) return null;
    const now = Date.now();
    const donnes: { d: CahierDevoir; valides: number; total: number }[] = [];
    const termines: { d: CahierDevoir; total: number }[] = [];
    for (const d of calc.colonnes) {
      const s = calc.stats(d);
      if (!s.concernes.length) continue;
      if (!s.termine) donnes.push({ d, valides: s.valides, total: s.concernes.length });
      else if (!d.created_at || now - new Date(d.created_at).getTime() <= 21 * DAY) termines.push({ d, total: s.concernes.length });
    }
    // Envois en attente des membres (le plus ancien d'abord : premier arrivé, premier corrigé)
    const eleveDe = new Map(calc.eleves.map((e) => [e.user_id, e]));
    // Dernier envoi de chaque élève pour chaque devoir (un ancien envoi déjà remplacé ne compte pas)
    const aValider = [...calc.renduDe.values()]
      .filter((r) => r.statut === 'rendu' && r.devoir_id && eleveDe.has(r.student_id))
      .sort((a, b) => (a.rendu_at || '').localeCompare(b.rendu_at || ''))
      .map((r) => ({ r, eleve: eleveDe.get(r.student_id)!, devoir: calc.titreDe.get(r.devoir_id!) ?? null }));
    return { donnes: donnes.reverse(), termines: termines.reverse(), aValider };
  }, [calc]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack} className="shrink-0">← Retour</Button>
        <h2 className="flex-1 min-w-0 font-bold text-base sm:text-lg text-red-800 dark:text-red-300 [overflow-wrap:anywhere]">
          🗂️ Récapitulatif · {groupName}
        </h2>
      </div>

      {error && <p className="rounded-xl bg-red-100 text-red-900 p-3 text-sm">😕 Impossible de charger le récapitulatif : {errorMessage(error)}</p>}
      {isLoading && <p className="text-sm text-sky-700 dark:text-sky-300 text-center py-6">⏳ Chargement…</p>}

      {colonnes && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
          <Colonne type="prepare" count={aPreparer.length} vide="Rien à préparer pour ce groupe 👍">
            {aPreparer.map((t) => (
              <div key={t.id} className="rounded-xl bg-white dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2.5 py-2 text-sm text-sky-950 dark:text-sky-50">
                <p className="[overflow-wrap:anywhere]">{t.urgent ? '⭐ ' : ''}{t.title}</p>
                {t.due_date && <p className="text-[11px] text-sky-700 dark:text-sky-300 mt-0.5">📅 {dateCourte(t.due_date)}</p>}
              </div>
            ))}
          </Colonne>

          <Colonne type="donne" count={colonnes.donnes.length} vide="Aucun devoir en cours.">
            {colonnes.donnes.map(({ d, valides, total }) => (
              <div key={d.id} className="rounded-xl bg-white dark:bg-red-950/50 border border-red-200 dark:border-red-900 px-2.5 py-2 text-sm text-red-950 dark:text-red-50">
                <p className="font-semibold [overflow-wrap:anywhere]">{matiereOf(d.type).emoji} {d.titre}</p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 text-[11px]">
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{valides}/{total} validé{valides > 1 ? 's' : ''}</span>
                  {d.date_limite && <span className="text-red-700 dark:text-red-300">📅 {dateCourte(d.date_limite)}</span>}
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-red-100 dark:bg-red-950 overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${total ? (valides / total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </Colonne>

          <Colonne type="valider" count={colonnes.aValider.length} vide="Aucun envoi en attente 🎉">
            {colonnes.aValider.map(({ r, eleve, devoir }) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setChoix({ eleve, devoir, rendu: r })}
                className="w-full text-left rounded-xl bg-white dark:bg-orange-950/50 border border-orange-300 dark:border-orange-800 px-2.5 py-2 text-sm text-orange-950 dark:text-orange-50 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
              >
                <p className="[overflow-wrap:anywhere]">
                  <span className="font-bold">{prenomOf(eleve.full_name)}</span> · {devoir ? `${matiereOf(devoir.type).emoji} ${devoir.titre}` : 'Devoir'}
                </p>
                <p className="text-[11px] text-orange-700 dark:text-orange-300 mt-0.5">
                  {r.audio_url ? '🎧 Audio' : '✔️ Sans audio'}{r.rendu_at ? ` · envoyé ${dateCourte(r.rendu_at)}` : ''}
                </p>
              </button>
            ))}
          </Colonne>

          <Colonne type="termine" count={colonnes.termines.length} vide="Rien de terminé ces 3 dernières semaines.">
            {colonnes.termines.map(({ d, total }) => (
              <div key={d.id} className="rounded-xl bg-white dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 px-2.5 py-2 text-sm text-emerald-950 dark:text-emerald-50">
                <p className="font-semibold [overflow-wrap:anywhere]">{matiereOf(d.type).emoji} {d.titre}</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">✨ {total}/{total} validé{total > 1 ? 's' : ''}</p>
              </div>
            ))}
          </Colonne>
        </div>
      )}

      <ValiderRenduDialog
        open={!!choix}
        onClose={() => setChoix(null)}
        eleve={choix?.eleve ?? null}
        devoir={choix?.devoir ?? null}
        rendu={choix?.rendu ?? null}
      />
    </div>
  );
}
