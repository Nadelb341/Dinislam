import { Pencil, Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useReglage } from '@/hooks/usePetits';
import { cn } from '@/lib/utils';
import type { DhikrGeste, SerieDhikr } from '@/data/dhikrContenu';
import type { Couleurs } from './Ambiance';
import { BadgeStatut } from './Series';

/**
 * ⚙️ Réglages de la carte Dhikr (enseignante seulement) :
 * - 🔔 IDÉE 1 : rappels doux (matin, soir, avant de dormir) — interrupteur « pour tout le monde » ici, et chaque élève a son
 *   interrupteur personnel dans Paramètres › Notifications (règle des 2 interrupteurs). Envoyés par la tâche `taches-automatiques`.
 * - ✏️ Tous les gestes des séries, y compris ceux CACHÉS (« à confirmer » et propositions de remplacement) : un seul interrupteur
 *   « Montrer aux élèves » dans le ✏️ pour les allumer.
 */
export interface RappelsDhikr { matin: boolean; soir: boolean; nuit: boolean; heure_matin: number; heure_soir: number; heure_nuit: number }
export const RAPPELS_DEFAUT: RappelsDhikr = { matin: false, soir: false, nuit: false, heure_matin: 8, heure_soir: 18, heure_nuit: 21 };

const SERIES: { s: SerieDhikr; t: string }[] = [
  { s: 'matin', t: '🌅 Série du matin' }, { s: 'soir', t: '🌙 Série du soir' }, { s: 'reveil', t: '☀️ Les 3 gestes du réveil' }, { s: 'apres_priere', t: '🕌 Après la prière' },
];
const GENRES: Record<string, string> = { intro: 'Titre', geste: 'Geste', final: 'Fin', bonus: 'Bonus' };

export function ReglagesDhikr({ gestes, ambiance, onEditer, onNouveau }: {
  gestes: DhikrGeste[]; ambiance: Couleurs; onEditer: (g: DhikrGeste) => void; onNouveau: (serie: SerieDhikr) => void;
}) {
  const { valeur: r, changer } = useReglage<RappelsDhikr>('dhikr_rappels', RAPPELS_DEFAUT);
  const v = { ...RAPPELS_DEFAUT, ...r };
  const nuit = ambiance.nom === 'nuit';
  const carte = nuit ? 'bg-white/10 border-white/20' : 'bg-white/85 border-white';
  const heures = Array.from({ length: 24 }, (_, h) => h);
  const ligne = (cle: 'matin' | 'soir' | 'nuit', titre: string, aide: string) => {
    const hk = `heure_${cle}` as const;
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border p-2 bg-white/70 text-slate-900">
        <div className="flex-1 min-w-[10rem]"><p className="font-bold text-sm">{titre}</p><p className="text-xs text-slate-600">{aide}</p></div>
        <label className="text-xs font-bold flex items-center gap-1">à
          <select value={v[hk]} onChange={(e) => void changer({ ...v, [hk]: Number(e.target.value) })} className="rounded-md border px-2 py-1 bg-white">
            {heures.map((h) => <option key={h} value={h}>{h} h</option>)}
          </select></label>
        <Switch checked={v[cle]} onCheckedChange={(on) => void changer({ ...v, [cle]: on })} aria-label={titre} />
      </div>
    );
  };
  return (
    <div className="space-y-3">
      <div className={cn('rounded-3xl border p-3 space-y-2', carte)}>
        <h3 className="font-extrabold">🔔 Rappels doux (pour tous les élèves)</h3>
        {ligne('matin', '☀️ Le matin', '« La série du matin t\'attend » (si elle n\'est pas faite)')}
        {ligne('soir', '🌇 Le soir', '« Un petit dhikr avant la nuit ? »')}
        {ligne('nuit', '🌙 Avant de dormir', '« La série du soir t\'attend » (si elle n\'est pas faite)')}
        <p className="text-xs" style={{ color: ambiance.doux }}>Chaque élève peut aussi les couper pour lui seul dans Paramètres › Notifications. 📡 Les notifications ont besoin d'Internet.</p>
      </div>
      {SERIES.map(({ s, t }) => {
        const l = gestes.filter((g) => g.serie === s).sort((a, b) => a.position - b.position);
        return (
          <div key={s} className={cn('rounded-3xl border p-3 space-y-1.5', carte)}>
            <h3 className="font-extrabold">{t}</h3>
            {l.map((g) => (
              <div key={g.id} className={cn('flex items-start gap-2 rounded-xl border p-2 text-slate-900', g.visible ? 'bg-white/80' : 'bg-slate-200/80')}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold [overflow-wrap:anywhere]"><span className="text-[10px] uppercase tracking-wide text-slate-500 mr-1">{GENRES[g.genre]}</span>{g.titre}</p>
                  {g.source && <p className="text-xs text-slate-600">📚 {g.source}</p>}
                  <div className="flex flex-wrap gap-1 mt-0.5"><BadgeStatut g={g} /></div>
                </div>
                <button type="button" onClick={() => onEditer(g)} aria-label={`Modifier ${g.titre}`} className="h-8 w-8 shrink-0 grid place-items-center rounded-full bg-white border"><Pencil className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => onNouveau(s)} className="w-full rounded-xl border-2 border-dashed border-amber-400 py-1.5 text-sm font-bold inline-flex items-center justify-center gap-1"><Plus className="h-4 w-4" /> Nouveau geste</button>
          </div>
        );
      })}
    </div>
  );
}
