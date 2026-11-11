import { useAlphabetClasse } from '@/hooks/useAlphabetClasse';
import { COULEUR_LETTRE, type EtatLettre } from '@/lib/alphabetProgress';
import { cn } from '@/lib/utils';

/**
 * Idée bonus 9 (2026-10-07) : grille élèves × 28 lettres.
 * 2026-11-11 : mêmes couleurs que l'élève et que la fenêtre d'une lettre (vert, jaune, ⏳, rouge clair, gris),
 * en comptant les lettres ouvertes à un groupe (même calcul : useAlphabetClasse).
 */
export function AlphabetProgressGrid() {
  const { lettres, eleves, groupes, calc } = useAlphabetClasse();
  if (!calc) return <div className="h-40 rounded-2xl bg-muted/50 animate-pulse" />;
  const nomsGroupes = (ids: string[]) => ids.map((id) => groupes.find((g) => g.id === id)?.name).filter(Boolean).join(', ');

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {(['apprise', 'ouverte', 'attente', 'a_revoir', 'fermee'] as EtatLettre[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1"><i className={cn('w-3 h-3 rounded inline-block', COULEUR_LETTRE[k].carre)} />{COULEUR_LETTRE[k].label}</span>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="text-xs border-separate border-spacing-0.5 p-1">
          <thead>
            <tr>
              <th className="sticky start-0 bg-card text-start px-2 font-semibold">Élève</th>
              {[...lettres].reverse().map((l) => (
                <th key={l.id} className="font-arabic text-base font-bold w-7" title={l.name_french}>{l.letter_arabic}</th>
              ))}
              <th className="px-1">✓</th>
            </tr>
          </thead>
          <tbody>
            {eleves.map((e) => {
              const etats = lettres.map((l) => calc.pour(e, l.id).etat);
              return (
                <tr key={e.id}>
                  <td className="sticky start-0 bg-card px-2 py-1 whitespace-nowrap">
                    <span className="font-semibold block leading-tight">{e.nom}</span>
                    <span className="text-[10px] text-muted-foreground">{nomsGroupes(e.groupes) || 'sans groupe'}{e.adulte ? ' · 20 ans +' : ''}</span>
                  </td>
                  {[...lettres].reverse().map((l) => {
                    const etat = calc.pour(e, l.id).etat;
                    return (
                      <td key={l.id} className={cn('h-6 w-7 rounded text-center text-[10px]', COULEUR_LETTRE[etat].carre)} title={`${e.nom} · ${l.name_french} : ${COULEUR_LETTRE[etat].label}`}>
                        {etat === 'attente' ? '⏳' : ''}
                      </td>
                    );
                  })}
                  <td className="px-1 text-center font-bold tabular-nums">{etats.filter((x) => x === 'apprise').length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">Lecture de droite à gauche, comme l'alphabet. Fais glisser le tableau sur le côté pour tout voir.</p>
    </div>
  );
}
