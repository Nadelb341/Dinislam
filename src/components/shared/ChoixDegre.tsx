import { useId } from 'react';
import { DEGRES, LISTE_DEGRES, degreDeSource, normaliserDegre } from '@/lib/degreAuthenticite';
import { PastilleSource } from './DegreAuthenticite';

/**
 * ✏️ Choisir le degré d'authenticité d'une citation (formulaires de Nadia, 27/11) : menu + phrase « avis divergents ».
 * « Selon la source » = vide en base : l'appli le devine (Al-Boukhârî / Mouslim = SAHIH, Coran = CORAN),
 * sinon « 🔎 Degré à vérifier » côté enseignante et RIEN côté élèves (on n'invente pas).
 */
export function ChoixDegre({ degre, divergence, source, onChange, libelle = "Degré d'authenticité" }: {
  degre: string | null; divergence: string | null; source?: string | null;
  onChange: (v: { degre: string | null; divergence: string | null }) => void;
  libelle?: string;
}) {
  const id = useId();
  const devine = degreDeSource(source);
  return (
    <div className="space-y-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-2.5">
      <label className="text-xs font-semibold block" htmlFor={`${id}-d`}>{libelle}</label>
      <select id={`${id}-d`} value={normaliserDegre(degre) ?? ''}
        onChange={(e) => onChange({ degre: e.target.value || null, divergence })}
        className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm">
        <option value="">{devine ? `Selon la source (${DEGRES[devine].nom} · ${DEGRES[devine].fr})` : 'Pas encore établi (à vérifier)'}</option>
        {LISTE_DEGRES.map((d) => <option key={d} value={d}>{DEGRES[d].nom} · {DEGRES[d].fr}</option>)}
      </select>
      <label className="text-xs font-semibold block" htmlFor={`${id}-v`}>⚖️ Avis divergents (facultatif, une phrase courte)</label>
      <input id={`${id}-v`} value={divergence ?? ''} onChange={(e) => onChange({ degre, divergence: e.target.value || null })}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
        placeholder="Ex. : jugé bon par Al-Albânî ; d'autres l'ont jugé faible."
        className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm" />
      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        Aperçu : <PastilleSource source={source} degre={degre} divergence={divergence} aVerifier interactif={false} />
      </div>
    </div>
  );
}
