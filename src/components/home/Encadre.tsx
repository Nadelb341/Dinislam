import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useSaisonActive } from '@/lib/saisons';
import {
  ENCADREMENTS_DEFAUT, EPAISSEURS, teinteDe, useReglagesEncadrements,
  type CarteAccueil, type ReglagesEncadrements,
} from '@/lib/encadrements';

/**
 * 🖼️ Encadre une grande carte de l'accueil avec le cadre choisi dans le bouclier
 * (🔧 Apparence appli › Modifications générales › Page d'accueil › Encadrement des cartes, 2026-11-18).
 * « Sans cadre » : la carte est rendue telle quelle (rien ne change). Carte vide (rien à montrer) : le cadre se cache aussi.
 * `reglages` : pour l'aperçu en direct du bouclier (réglages pas encore enregistrés).
 */
export function Encadre({ carte, children, className, forcerHalo, reglages }: {
  carte: CarteAccueil;
  children: ReactNode;
  className?: string;
  /** Idée 5 : un devoir est à rendre aujourd'hui → Halo (si l'option est allumée) */
  forcerHalo?: boolean;
  reglages?: ReglagesEncadrements;
}) {
  const { data } = useReglagesEncadrements();
  const { saison } = useSaisonActive();
  const r = reglages ?? data ?? ENCADREMENTS_DEFAUT;
  const c = r.cartes[carte];
  const cadre = forcerHalo && r.haloJourDevoir ? 'halo' : c.cadre;
  if (cadre === 'aucun') return <>{children}</>;
  const [clair, douxClair, sombre, douxSombre] = teinteDe(cadre, c.couleur, saison, r.couleursSaison);
  const ep = EPAISSEURS.find((e) => e.v === c.epaisseur)?.f ?? 1;
  const style = { '--cadre-c': clair, '--cadre-dc': douxClair, '--cadre-s': sombre, '--cadre-ds': douxSombre, '--ep': ep } as CSSProperties;
  return (
    <div className={cn('cadre-accueil', `cadre-${cadre}`, className)} style={style}>
      {cadre === 'coins' && (['a', 'b', 'c', 'd'] as const).map((k) => <span key={k} aria-hidden className={`cadre-coin ${k}`}>✦</span>)}
      <div className="cadre-contenu">{children}</div>
    </div>
  );
}
