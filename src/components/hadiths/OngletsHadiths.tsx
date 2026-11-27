import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useHadithsDuJour } from '@/hooks/useHadithsDuJour';
import { HADITHS_SECOURS, versAffiche, type HadithAffiche } from '@/lib/hadithsDuJour';
import { DEGRES, LISTE_DEGRES, type Degre } from '@/lib/degreAuthenticite';
import { PastilleSource } from '@/components/shared/DegreAuthenticite';
import { NiveauxAuthenticite } from './NiveauxAuthenticite';
import { cn } from '@/lib/utils';

/**
 * 📚 Carte Hadiths (27/11) : 3 onglets en haut de /module/hadiths.
 * 🕊️ Les hadiths (ceux du « Hadith du jour », avec leur pastille et un filtre par degré) · 📊 Niveaux d'authenticité ·
 * 📚 Leçons (l'ancienne liste de la carte, `children`). Lien direct : `?onglet=niveaux` (bulle de chaque pastille).
 */
export type OngletHadiths = 'hadiths' | 'niveaux' | 'lecons';

export function OngletsHadiths({ isAdmin, nbLecons, children }: { isAdmin: boolean; nbLecons: number; children: React.ReactNode }) {
  const [params, setParams] = useSearchParams();
  const o = params.get('onglet');
  const onglet: OngletHadiths = o === 'niveaux' || o === 'lecons' ? o : 'hadiths';
  const choisir = (x: OngletHadiths) => { const p = new URLSearchParams(params); p.set('onglet', x); setParams(p, { replace: true }); };
  const { data } = useHadithsDuJour();
  const hadiths = useMemo<HadithAffiche[]>(() => {
    const v = (data ?? []).filter((h) => h.texte?.trim());
    return v.length ? v.map(versAffiche) : HADITHS_SECOURS;
  }, [data]);

  const onglets: { id: OngletHadiths; label: string }[] = [
    { id: 'hadiths', label: `🕊️ Les hadiths (${hadiths.length})` },
    { id: 'niveaux', label: "📊 Niveaux d'authenticité" },
    { id: 'lecons', label: `📚 Leçons (${nbLecons})` },
  ];

  return (
    <div className="space-y-4">
      <div role="tablist" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {onglets.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={onglet === x.id} onClick={() => choisir(x.id)}
            className={cn('rounded-2xl border-2 px-3 py-2.5 text-sm font-extrabold shadow-sm transition [overflow-wrap:anywhere]',
              onglet === x.id ? 'border-amber-600 bg-amber-500 text-white' : 'border-amber-300 bg-white text-amber-900 hover:bg-amber-50 dark:bg-slate-800 dark:text-amber-100 dark:border-amber-700')}>
            {x.label}
          </button>
        ))}
      </div>
      {onglet === 'hadiths' && <ListeHadiths hadiths={hadiths} isAdmin={isAdmin} />}
      {onglet === 'niveaux' && <NiveauxAuthenticite isAdmin={isAdmin} />}
      {onglet === 'lecons' && children}
    </div>
  );
}

function ListeHadiths({ hadiths, isAdmin }: { hadiths: HadithAffiche[]; isAdmin: boolean }) {
  const [filtre, setFiltre] = useState<Degre | 'tous'>('tous');
  const presents = LISTE_DEGRES.filter((d) => hadiths.some((h) => h.degre === d));
  const liste = filtre === 'tous' ? hadiths : hadiths.filter((h) => h.degre === filtre);
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">Chaque hadith porte la pastille de son degré : touche-la pour savoir ce qu'elle veut dire.</p>
      {presents.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setFiltre('tous')}
            className={cn('rounded-full px-3 py-1 text-xs font-bold ring-1', filtre === 'tous' ? 'bg-slate-800 text-white ring-slate-800 dark:bg-white dark:text-slate-900' : 'bg-white text-slate-800 ring-slate-300 dark:bg-slate-800 dark:text-slate-100')}>
            Tous ({hadiths.length})
          </button>
          {presents.map((d) => (
            <button key={d} type="button" onClick={() => setFiltre(d)}
              className={cn('rounded-full px-3 py-1 text-xs font-extrabold ring-1', DEGRES[d].classe, filtre === d && 'ring-2 ring-offset-1')}>
              {DEGRES[d].nom} ({hadiths.filter((h) => h.degre === d).length})
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-2.5 md:grid-cols-2">
        {liste.map((h, i) => (
          <article key={`${i}-${h.text.slice(0, 20)}`} className="rounded-2xl border-2 border-emerald-200 bg-white p-3 shadow-sm dark:border-emerald-800 dark:bg-slate-800 space-y-1.5 overflow-hidden">
            {h.theme && <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">{h.theme}</span>}
            {h.arabic && <p dir="rtl" className="font-arabic text-lg text-emerald-900 dark:text-emerald-100 [overflow-wrap:anywhere]">{h.arabic}</p>}
            <p className="text-sm font-medium text-foreground [overflow-wrap:anywhere]">« {h.text} »</p>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {h.source && <span className="[overflow-wrap:anywhere]">📚 {h.source}</span>}
              <PastilleSource source={h.source} degre={h.degre} divergence={h.divergence} aVerifier={isAdmin} />
            </div>
          </article>
        ))}
      </div>
      {isAdmin && <p className="text-xs text-muted-foreground">✏️ Pour ajouter, modifier ou ranger ces hadiths (et choisir leur degré) : crayon de la carte « Hadith du jour » de l'accueil.</p>}
    </div>
  );
}
