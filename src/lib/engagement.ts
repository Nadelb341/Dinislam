/** Suivi des élèves qui décrochent (2026-10-08) : règles partagées entre la carte À FAIRE et le Cahier de texte */
export interface EngagementWeek { week: string; total: number; done: number }
export interface Engagement {
  student_id: string; full_name: string | null; gender: string | null;
  joined_at: string | null; last_validation: string | null; missed_streak: number; weeks: EngagementWeek[];
}

export const daysSince = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null);

/** Rouge : 2 chemins de la semaine (ou plus) sans aucun diamant, ou rien validé depuis 3 semaines. Orange : le chemin de la semaine dernière sans aucun diamant. */
export function dropoutLevel(e: Engagement): 'red' | 'orange' | null {
  const idle = daysSince(e.last_validation ?? e.joined_at);
  if (e.missed_streak >= 2 || (idle !== null && idle >= 21)) return 'red';
  if (e.missed_streak === 1) return 'orange';
  return null;
}

export function dropoutReason(e: Engagement): string {
  const parts: string[] = [];
  if (e.missed_streak >= 1) parts.push(e.missed_streak === 1 ? 'aucun diamant la semaine dernière' : `aucun diamant depuis ${e.missed_streak} semaines`);
  const d = daysSince(e.last_validation);
  if (e.last_validation === null) parts.push('rien validé depuis son inscription');
  else if (d !== null && d >= 21) parts.push(`rien validé depuis ${d} jours`);
  return parts.join(' · ');
}

/** Messages d'encouragement proposés (modifiables avant l'envoi) */
export const NUDGES = [
  "Salam {prenom} ! 🌟 Ça fait un moment que je n'ai pas eu de tes nouvelles. Ton chemin de la semaine t'attend dans le Cahier de texte, je suis sûre que tu vas y arriver 💪",
  "Coucou {prenom} 👋 Tu me manques dans les validations ! Un petit effort cette semaine et tes diamants vont briller 💎 Je crois en toi !",
  "{prenom}, n'oublie pas : 10 minutes par jour suffisent pour avancer 📖 Je t'attends avec ta prochaine leçon, inch'Allah 🤲",
  "Salam {prenom} 🌸 Si tu as besoin d'aide pour ta leçon ou ta sourate, écris-moi ici, je suis là pour t'aider 😊",
  "{prenom}, tu es capable de grandes choses, bismillah ! 🚀 Ouvre ton chemin de la semaine et commence par le diamant que tu préfères 💎",
];
