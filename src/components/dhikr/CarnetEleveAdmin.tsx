import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { untypedDb } from '@/lib/untypedDb';
import { cleSemaine, dhikrTries, semainePasseeDe, type ResumeSemaine } from '@/lib/dhikr';

/**
 * 📿 Ligne « Dhikr » de la fiche d'un élève côté enseignante (Nadia, 27/11) : le carnet de dhikr de l'élève,
 * CETTE semaine et la semaine passée (total, séries du matin / du soir / du réveil, détail par dhikr).
 * Lu dans `dhikr_carnet_semaines` (envoyé par l'appareil de l'élève ; en direct via realtimeSync « dhikr-carnet-eleve »).
 * Les semaines vont du lundi au dimanche soir minuit (heure de l'appareil de l'élève). Aucun lien avec les points.
 */
type Ligne = ResumeSemaine & { updated_at: string };

const jours = (n: number | null | undefined) => (n ? `${n} jour${n > 1 ? 's' : ''}` : 'aucun jour');

function BlocSemaine({ titre, l }: { titre: string; l: Ligne | undefined }) {
  const [ouvert, setOuvert] = useState(false);
  const liste = dhikrTries(l?.par_dhikr);
  return (
    <div className="min-w-0 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-50">
      <p className="text-xs font-bold text-amber-800 dark:text-amber-200 [overflow-wrap:anywhere]">{titre}</p>
      <p className="text-xl font-black tabular-nums">{l?.total ?? 0} <span className="text-xs font-bold">dhikr</span></p>
      <p className="text-[11px] font-bold">Séries faites :</p>
      <ul className="text-[11px] font-semibold leading-snug [overflow-wrap:anywhere]">
        <li>☀️ Matin : {jours(l?.series_matin)}</li>
        <li>🌙 Soir : {jours(l?.series_soir)}</li>
        {!!l?.series_reveil && <li>🌅 Réveil : {jours(l.series_reveil)}</li>}
      </ul>
      {liste.length > 0 && (
        <>
          <button type="button" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert}
            className="mt-1 text-[11px] font-bold text-amber-800 underline underline-offset-2 dark:text-amber-200">
            {ouvert ? '▲ Masquer le détail' : `▼ Détail (${liste.length})`}
          </button>
          {ouvert && (
            <ul className="mt-1 space-y-0.5 text-[11px] leading-snug">
              {liste.map((d) => (
                <li key={d.cle} className="flex items-start justify-between gap-2">
                  <span className="min-w-0 [overflow-wrap:anywhere]">{d.titre}</span>
                  <span className="shrink-0 font-bold tabular-nums">{d.nombre}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export function CarnetDhikrEleve({ userId }: { userId: string }) {
  const maintenant = new Date();
  const cette = cleSemaine(maintenant);
  const passee = semainePasseeDe(maintenant);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dhikr-carnet-eleve', userId, cette],
    queryFn: async () => {
      const { data, error } = await untypedDb.from('dhikr_carnet_semaines').select('*')
        .eq('user_id', userId).in('semaine', [cette, passee]);
      if (error) throw error;
      return (data || []) as Ligne[];
    },
  });
  const parSemaine = new Map((data ?? []).map((l) => [l.semaine, l]));
  const derniere = (data ?? []).map((l) => l.updated_at).sort().pop();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-base">📿</span>
        <span className="text-sm font-medium">Dhikr</span>
      </div>
      {isError && !data ? (
        <p className="text-xs text-muted-foreground">📡 Carnet pas encore chargé sur cet appareil : Internet nécessaire.</p>
      ) : isLoading ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <BlocSemaine titre="Cette semaine" l={parSemaine.get(cette)} />
            <BlocSemaine titre="La semaine passée" l={parSemaine.get(passee)} />
          </div>
          <p className="text-[11px] text-muted-foreground [overflow-wrap:anywhere]">
            Nombre de dhikr comptés dans la carte Dhikr (semaine du lundi au dimanche soir).
            {derniere ? ` Dernier envoi : ${new Date(derniere).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.` : ' Rien d\'envoyé pour ces 2 semaines.'}
          </p>
        </>
      )}
    </div>
  );
}
