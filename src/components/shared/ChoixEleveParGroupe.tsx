import { useMemo, useState } from 'react';
import { sectionsParGroupe, useComptesParGroupe } from '@/lib/comptesParGroupe';
import { Input } from '@/components/ui/input';

/** Choix d'un élève dans la page (pas une fenêtre) : groupes + boutons ; l'élève choisi est en violet plein */
export function ChoixEleveParGroupe({ value, onChange }: { value: string | null; onChange: (id: string | null, nom: string) => void }) {
  const [cherche, setCherche] = useState('');
  const { data, isLoading } = useComptesParGroupe();
  const sections = useMemo(() => sectionsParGroupe(data, cherche), [data, cherche]);
  return (
    <div className="space-y-2">
      <Input placeholder="🔎 Chercher un prénom…" value={cherche} onChange={(e) => setCherche(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const p = sections[0]?.comptes[0]; if (p) onChange(p.user_id, p.full_name || 'Élève'); } }} />
      <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
        {isLoading && <p className="text-sm text-center text-muted-foreground py-3">⏳ Chargement…</p>}
        {!isLoading && !sections.length && <p className="text-sm text-center text-muted-foreground py-3">Aucun élève trouvé</p>}
        {sections.map((s) => (
          <section key={s.titre} className="space-y-1.5">
            <p className="text-xs font-extrabold uppercase tracking-wide text-violet-700 dark:text-violet-300">{s.titre}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {s.comptes.map((c) => {
                const choisi = value === c.user_id;
                return (
                  <button key={`${s.titre}-${c.user_id}`} type="button" aria-pressed={choisi}
                    onClick={() => onChange(choisi ? null : c.user_id, c.full_name || 'Élève')}
                    className={`rounded-xl border-2 px-2 py-2 text-sm font-semibold [overflow-wrap:anywhere] ${choisi
                      ? 'border-violet-600 bg-violet-600 text-white'
                      : 'border-violet-200 bg-violet-50 text-violet-950 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-50'}`}>
                    {choisi ? '✓ ' : ''}{c.full_name || 'Sans nom'}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
