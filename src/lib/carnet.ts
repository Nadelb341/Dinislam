/**
 * 📒 Carnet de liaison (Nadia, 2026-11-11 : liste A « J'ai lu » + écriture manuscrite B + bandeau C qui se déplie).
 * Règles sans écran (testées dans carnet.test.ts) : ordre, archive par mois, qui l'a lu, texte WhatsApp / SMS.
 */
export interface MessageCarnet {
  id: string; emoji: string; titre: string; texte: string;
  cible: string; group_ids: string[]; student_ids: string[];
  piece_url: string | null; piece_nom: string | null; piece_type: string | null;
  epingle: boolean; signature: boolean; relance: boolean;
  envoyer_le: string; created_at: string;
}
export interface LectureCarnet { id?: string; message_id: string; user_id: string; role: string; lu_le: string; reponse: string | null }
export interface EleveCarnet { id: string; nom: string; groupes: string[]; parents: string[] }

/** Épinglés d'abord, puis le plus récent en haut (demande de Nadia : « la plus récente toujours en haut ») */
export function trierCarnet<T extends Pick<MessageCarnet, 'epingle' | 'envoyer_le'>>(msgs: T[]): T[] {
  return [...msgs].sort((a, b) => (Number(b.epingle) - Number(a.epingle)) || (b.envoyer_le.localeCompare(a.envoyer_le)));
}

export const libelleMois = (aaaamm: string) => {
  const [a, m] = aaaamm.split('-').map(Number);
  const t = new Date(a, m - 1, 15).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Élèves visés par un message */
export function elevesVises(m: Pick<MessageCarnet, 'cible' | 'group_ids' | 'student_ids'>, eleves: EleveCarnet[]): EleveCarnet[] {
  if (m.cible === 'tous') return eleves;
  if (m.cible === 'groupes') return eleves.filter((e) => e.groupes.some((g) => m.group_ids.includes(g)));
  return eleves.filter((e) => m.student_ids.includes(e.id));
}

/**
 * Qui a lu, qui a signé, qui a répondu. Un élève compte comme « lu » s'il a touché « J'ai lu » OU si un de ses parents
 * reliés l'a lu depuis son compte. « Signé » = « Vu par un parent » (dans l'Espace parents du compte de l'enfant, ou
 * depuis le compte du parent).
 */
export function suiviLecture(m: MessageCarnet, eleves: EleveCarnet[], lectures: LectureCarnet[]) {
  const vises = elevesVises(m, eleves);
  const ici = lectures.filter((l) => l.message_id === m.id);
  const lignes = vises.map((e) => {
    const siennes = ici.filter((l) => l.user_id === e.id || e.parents.includes(l.user_id));
    const reponse = siennes.find((l) => l.reponse)?.reponse ?? null;
    return {
      eleve: e,
      lu: siennes.length > 0,
      signe: siennes.some((l) => l.role === 'parent' || e.parents.includes(l.user_id)),
      reponse,
    };
  });
  return {
    lignes,
    total: vises.length,
    lus: lignes.filter((l) => l.lu).length,
    signes: lignes.filter((l) => l.signe).length,
    pasLu: lignes.filter((l) => !l.lu).map((l) => l.eleve),
  };
}

/** Résumé de la cible (« 🌍 Tout le monde », « 👥 Groupe 2, Groupe 3 », « 👤 3 élèves ») */
export function resumeCible(m: Pick<MessageCarnet, 'cible' | 'group_ids' | 'student_ids'>, groupes: { id: string; name: string }[]) {
  if (m.cible === 'tous') return '🌍 Tout le monde';
  if (m.cible === 'groupes') return `👥 ${m.group_ids.map((g) => groupes.find((x) => x.id === g)?.name).filter(Boolean).join(', ') || 'aucun groupe'}`;
  return `👤 ${m.student_ids.length} élève${m.student_ids.length > 1 ? 's' : ''}`;
}

/** Texte prêt pour WhatsApp / SMS (le même que dans l'appli) */
export function texteCarnetPartage(m: Pick<MessageCarnet, 'emoji' | 'titre' | 'texte' | 'signature'>) {
  const l = [`📒 Carnet de liaison — ${m.emoji} ${m.titre}`.trim(), '', m.texte.trim()];
  if (m.signature) l.push('', '✍️ Merci de confirmer la lecture dans l\'appli Dinislam (Espace parents).');
  return l.join('\n').trim();
}

/** Date courte : « mercredi 18 novembre » (+ l'heure si demandée) */
export const dateCarnet = (iso: string, heure = false) => {
  const d = new Date(iso);
  const j = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return heure ? `${j} à ${d.getHours()} h${d.getMinutes() ? String(d.getMinutes()).padStart(2, '0') : ''}` : j;
};

/**
 * Côté élève / parent (Nadia, 2026-11-12) : tout ce qui reste à lire est affiché DÉPLIÉ ; après « J'ai lu », le message
 * passe dans « Voir l'historique » (le plus récent en tête), gardé 6 mois. Restent en haut : les messages épinglés, et ceux qui attendent
 * encore la signature d'un parent (sinon le parent ne la verrait plus).
 */
export function separerPourEleve<T extends MessageCarnet>(msgs: T[], lectures: LectureCarnet[], uid: string, estParent: boolean, maintenant = new Date()) {
  const miennes = (id: string) => lectures.filter((l) => l.message_id === id && l.user_id === uid);
  const lu = (m: T) => miennes(m.id).length > 0;
  const signe = (m: T) => miennes(m.id).some((l) => l.role === 'parent') || (estParent && lu(m));
  const aLire: T[] = [], historique: T[] = [];
  for (const m of trierCarnet(msgs)) (m.epingle || !lu(m) || (m.signature && !signe(m)) ? aLire : historique).push(m);
  historique.sort((a, b) => b.envoyer_le.localeCompare(a.envoyer_le));
  // 🗂️ Côté élève, l'historique ne garde que 6 mois (Nadia, 2026-11-12)
  const limite = maintenant.getTime() - MOIS_HISTORIQUE_ELEVE * 30.44 * 86400000;
  return { aLire, historique: historique.filter((m) => new Date(m.envoyer_le).getTime() >= limite) };
}

export const MOIS_HISTORIQUE_ELEVE = 6;
/** Côté enseignante : effacés (→ corbeille de Paramètres) au bout de 14 mois, par la tâche automatique `taches-automatiques` */
export const MOIS_HISTORIQUE_PROF = 14;

/**
 * Côté enseignante (Nadia, 2026-11-12 : « l'historique exactement comme pour l'élève ») : en haut, le dernier message envoyé,
 * les épinglés et les programmés ; tout le reste dans « Voir l'historique », le plus récent en tête.
 */
export function separerPourProf<T extends MessageCarnet>(msgs: T[], maintenant = new Date()) {
  const tries = trierCarnet(msgs);
  const futur = (m: T) => new Date(m.envoyer_le).getTime() > maintenant.getTime();
  const dernier = tries.filter((m) => !futur(m)).sort((a, b) => b.envoyer_le.localeCompare(a.envoyer_le))[0];
  const enHaut = tries.filter((m) => m.epingle || futur(m) || m === dernier);
  const historique = tries.filter((m) => !enHaut.includes(m)).sort((a, b) => b.envoyer_le.localeCompare(a.envoyer_le));
  return { enHaut, historique };
}
