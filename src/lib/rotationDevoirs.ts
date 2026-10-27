/**
 * 🔄 Rotation des devoirs à l'heure du cours (2026-10-27, choix de Nadia : B + C + D + E).
 *
 * Chaque devoir a une « heure de rendu » = le premier cours du groupe après le moment où il a été donné
 * (ou le cours du jour de sa date à rendre si elle est plus loin). Vacances de la zone C sautées (idée 8).
 *  - avant cette heure : onglet « Cette semaine » ;
 *  - de cette heure jusqu'au cours suivant : onglet « Semaine passée » (grisé) ;
 *  - ensuite : « Historique » (bande de semaines).
 * Un devoir obligatoire pas fait (donné depuis le 26/10/2026) monte dans « 🔁 À rattraper » jusqu'à ce qu'il soit fait,
 * sauf si le professeur l'a rangé dans l'historique (table devoir_decisions).
 */
import { nextCourse, type GroupSchedule, type Holiday } from './groupCourse';

/** Groupe sans heure réglée : mercredi 14 h par défaut (choix de Nadia) */
export const COURS_PAR_DEFAUT: Omit<GroupSchedule, 'group_id'> = { weekday: 3, start_time: '14:00:00' };
/** Règle « devoir obligatoire » : seulement pour les devoirs donnés à partir de cette date */
export const DEBUT_OBLIGATOIRE = '2026-10-26';

export type Rangement = 'semaine' | 'passee' | 'historique';
export type Decision = 'rattraper' | 'historique';

export interface DevoirRotation {
  id: string;
  created_at: string;
  visible_a?: string | null;
  date_limite?: string | null;
}

const asSchedule = (s: Omit<GroupSchedule, 'group_id'> | GroupSchedule): GroupSchedule => ({ group_id: '', ...s });

/** Premier cours strictement après `t` */
export const coursApres = (s: Omit<GroupSchedule, 'group_id'>, holidays: Holiday[], t: Date) =>
  nextCourse(asSchedule(s), holidays, t, 0);

/** Moment où le devoir a été donné aux élèves (préparé à l'avance : son heure de publication) */
export const donneLe = (d: DevoirRotation) => new Date(d.visible_a || d.created_at);

/** Heure de rendu du devoir : le cours où il est attendu */
export function heureDeRendu(d: DevoirRotation, s: Omit<GroupSchedule, 'group_id'>, holidays: Holiday[]): Date {
  let from = donneLe(d);
  if (d.date_limite) {
    const jour = new Date(d.date_limite);
    jour.setHours(0, 0, 0, 0);
    if (jour > from) from = jour;
  }
  return coursApres(s, holidays, from);
}

/** Onglet où se range le devoir maintenant */
export function rangement(d: DevoirRotation, s: Omit<GroupSchedule, 'group_id'>, holidays: Holiday[], now = new Date()): Rangement {
  const rendu = heureDeRendu(d, s, holidays);
  if (now < rendu) return 'semaine';
  return now < coursApres(s, holidays, rendu) ? 'passee' : 'historique';
}

/** Le devoir est soumis à la règle « obligatoire » (sinon il part simplement dans l'historique « pas fait ») */
export const estObligatoire = (d: DevoirRotation, arriveeEleve?: string | null) =>
  d.created_at >= DEBUT_OBLIGATOIRE && (!arriveeEleve || d.created_at >= arriveeEleve);

/** Pas fait + semaine terminée + obligatoire + pas rangé par le professeur → boîte « À rattraper » */
export const aRattraper = (d: DevoirRotation, fait: boolean, rang: Rangement, decision: Decision | undefined, arriveeEleve?: string | null) =>
  !fait && rang !== 'semaine' && decision !== 'historique' && estObligatoire(d, arriveeEleve);

/** Fait (pour l'élève) dès qu'il l'a envoyé ; « à refaire » = pas fait */
export const estFaitRange = (d: { rendu: boolean; statut_rendu: string | null }) => d.rendu && d.statut_rendu !== 'a_refaire';

/** Rendu après son heure de rendu (idée 7) */
export const renduEnRetard = (renduAt: string | null | undefined, rendu: Date) => !!renduAt && new Date(renduAt) > rendu;

/** Horaire à utiliser pour un élève : celui du groupe du devoir, sinon le plus proche de ses groupes, sinon mercredi 14 h */
export function horairePour(
  groupeDuDevoir: string | null | undefined,
  groupesEleve: string[],
  horaires: GroupSchedule[],
  holidays: Holiday[],
): Omit<GroupSchedule, 'group_id'> {
  const parGroupe = (g: string) => horaires.find((h) => h.group_id === g);
  if (groupeDuDevoir && parGroupe(groupeDuDevoir)) return parGroupe(groupeDuDevoir)!;
  const siens = groupesEleve.map(parGroupe).filter((h): h is GroupSchedule => !!h);
  if (!siens.length) return COURS_PAR_DEFAUT;
  return siens.sort((a, b) => nextCourse(a, holidays).getTime() - nextCourse(b, holidays).getTime())[0];
}

/** Clé AAAA-MM-JJ d'un cours (pour la bande de semaines) */
export const cleCours = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Tous les cours depuis `debut` jusqu'au dernier cours passé (bande de semaines, à l'infini vers le passé) */
export function coursPasses(s: Omit<GroupSchedule, 'group_id'>, holidays: Holiday[], debut: Date, now = new Date()): Date[] {
  const out: Date[] = [];
  let c = coursApres(s, holidays, new Date(debut.getTime() - 1));
  for (let i = 0; i < 520 && c <= now; i++) { out.push(c); c = coursApres(s, holidays, c); }
  return out;
}

/** « Encore 2 j 3 h » (idée 5) ; `veille` = moins de 24 h (affiché en orange) */
export function compteARebours(cible: Date, now = new Date()): { texte: string; veille: boolean } {
  const ms = Math.max(0, cible.getTime() - now.getTime());
  const h = Math.floor(ms / 3600000);
  const j = Math.floor(h / 24);
  const texte = j > 0 ? `⏳ Encore ${j} j ${h % 24} h` : h > 0 ? `⏳ Encore ${h} h ${Math.floor((ms % 3600000) / 60000)} min` : `⏳ Encore ${Math.ceil(ms / 60000)} min`;
  return { texte, veille: ms < 86400000 };
}

/** « mer. 4 nov. » */
export const jourCourt = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
