/** 🎯 Objectif du jour (2026-10-26) : calculs sans écran, testés dans objectifJour.test.ts */

/** Date locale « AAAA-MM-JJ » */
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export interface DevoirObjectif {
  id: string;
  titre: string;
  date_limite?: string;
  rendu: boolean;
  statut_rendu: string | null;
  etapes: string[];
  etapesFaites: number[];
}

const OBJECTIF_LIBRE = 'révise ta dernière leçon 10 minutes';

/** Le prochain devoir pas encore envoyé (le plus proche par date à rendre) et sa prochaine étape non cochée */
export function objectifDuJour(devoirs: DevoirObjectif[]): string {
  const prochain = devoirs
    .filter((d) => !d.rendu || d.statut_rendu === 'a_refaire')
    .sort((a, b) => (a.date_limite || '9999').localeCompare(b.date_limite || '9999'))[0];
  if (!prochain) return OBJECTIF_LIBRE;
  const k = prochain.etapes.findIndex((_, i) => !prochain.etapesFaites.includes(i + 1));
  return `10 minutes · ${prochain.titre}${k >= 0 ? ` · ${prochain.etapes[k]}` : ''}`;
}

/** Jours d'affilée jusqu'à aujourd'hui (ou hier si pas encore fait aujourd'hui) */
export function serieJours(jours: Set<string>, now = new Date()): number {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  if (!jours.has(ymd(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (jours.has(ymd(d)) && n < 1000) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
