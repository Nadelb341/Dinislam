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

/** Les messages de plus de 30 jours (non épinglés) passent dans l'archive, rangée par mois (le plus récent d'abord) */
export function separerArchive<T extends Pick<MessageCarnet, 'epingle' | 'envoyer_le'>>(msgs: T[], now = new Date()) {
  const limite = now.getTime() - 30 * 86400000;
  const recents: T[] = [];
  const parMois = new Map<string, T[]>();
  for (const m of trierCarnet(msgs)) {
    if (m.epingle || new Date(m.envoyer_le).getTime() >= limite) { recents.push(m); continue; }
    const k = m.envoyer_le.slice(0, 7);
    parMois.set(k, [...(parMois.get(k) || []), m]);
  }
  const archive = [...parMois.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([k, items]) => ({ mois: libelleMois(k), cle: k, items }));
  return { recents, archive };
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
