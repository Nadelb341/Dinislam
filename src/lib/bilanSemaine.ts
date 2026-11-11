/**
 * 📊 Bilan de la semaine aux parents (Nadia, 2026-11-11, idée 6) : proposé chaque MARDI à 16 h (tâche taches-automatiques),
 * c'est Nadia qui décide de l'envoyer. Un petit texte par élève, sur les 7 derniers jours.
 */
export interface ChiffresSemaine {
  devoirsDonnes: number; devoirsFaits: number; lignes: number;
  lecons: string[]; sourates: string[]; invocations: string[];
}

export const prenomSeul = (nom: string | null | undefined) => (nom || 'Élève').trim().split(/\s+/)[0];

export function texteBilanSemaine(nom: string, c: ChiffresSemaine): string {
  const l = [`📊 Bilan de la semaine de ${prenomSeul(nom)}`];
  if (c.devoirsDonnes) l.push(`💎 Devoirs faits : ${Math.min(c.devoirsFaits, c.devoirsDonnes)} / ${c.devoirsDonnes}`);
  if (c.lignes) l.push(`✨ Lignes de Nourania lues : ${c.lignes}`);
  if (c.lecons.length) l.push(`✨ Leçon${c.lecons.length > 1 ? 's' : ''} Nourania validée${c.lecons.length > 1 ? 's' : ''} : ${c.lecons.join(', ')}`);
  if (c.sourates.length) l.push(`📖 Sourate${c.sourates.length > 1 ? 's' : ''} validée${c.sourates.length > 1 ? 's' : ''} : ${c.sourates.join(', ')}`);
  if (c.invocations.length) l.push(`🤲 Invocation${c.invocations.length > 1 ? 's' : ''} validée${c.invocations.length > 1 ? 's' : ''} : ${c.invocations.join(', ')}`);
  l.push(encouragement(c));
  return l.join('\n');
}

/** Phrase de fin selon la semaine (jamais décourageante) */
export function encouragement(c: ChiffresSemaine): string {
  const progres = c.lignes + c.lecons.length + c.sourates.length + c.invocations.length;
  if (c.devoirsDonnes && c.devoirsFaits >= c.devoirsDonnes) return 'Tous les devoirs sont faits : bravo, continue comme ça ! 🌟';
  if (progres > 0 || c.devoirsFaits > 0) return 'Beau travail cette semaine, on continue in shaa Allah 💪';
  return 'Cette semaine a été calme : un petit effort chaque jour fera la différence in shaa Allah 🌱';
}

/** Semaine déjà envoyée sur cet appareil (clé = lundi de la semaine) */
export const CLE_BILAN_ENVOYE = 'dinislam_bilan_semaine_envoye';
export const cleSemaine = (d = new Date()) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.toLocaleDateString('en-CA'); };
/** À proposer : à partir du mardi 16 h, tant que le bilan de la semaine n'est pas envoyé (ou refusé) */
export const bilanAProposer = (d = new Date(), dejaFait: string | null) => {
  const j = (d.getDay() + 6) % 7; // 0 = lundi, 1 = mardi
  return (j > 1 || (j === 1 && d.getHours() >= 16)) && dejaFait !== cleSemaine(d);
};
