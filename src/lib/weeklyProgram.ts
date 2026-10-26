/** 💎 Chemin de la semaine : types et petites règles partagées (élève et enseignante) */
export interface ProgramItem {
  module: string; item_id: string; label: string; detail: string; path: string; emoji: string; done: boolean;
  /** Quand le diamant s'est allumé (pour le diamant bonus) */
  done_at?: string | null;
  /** Devoir en étapes (ex. 3 lignes) : le diamant se remplit petit à petit */
  steps_total?: number; steps_done?: number;
}
export interface WeeklyProgram {
  program_id: string; student_id: string; week_start: string; items: ProgramItem[]; message_index: number;
  teacher_note: string | null; full_name: string | null; gender: string | null;
}

/** Prochain mercredi (jour du cours) après la création du programme */
export function nextCourseDay(weekStart: string): Date {
  const d = new Date(`${weekStart}T12:00:00`);
  do d.setDate(d.getDate() + 1); while (d.getDay() !== 3);
  return d;
}

/** Part du diamant remplie (0 à 1) : étapes cochées d'un devoir, sinon tout ou rien */
export function itemFill(i: ProgramItem): number {
  if (i.done) return 1;
  const t = i.steps_total ?? 0;
  return t > 0 ? Math.min(1, (i.steps_done ?? 0) / t) : 0;
}

/** 🌟 Diamant bonus : tous les diamants allumés avant le jour du cours */
export function bonusEarned(p: WeeklyProgram): boolean {
  if (!p.items.length || !p.items.every((i) => i.done)) return false;
  const course = nextCourseDay(p.week_start);
  course.setHours(0, 0, 0, 0);
  return p.items.every((i) => !i.done_at || new Date(i.done_at) < course);
}

/** Petit hash stable : même devoir + même élève = même message (il ne change pas à chaque ouverture) */
function seed(text: string): number {
  let h = 0;
  for (let k = 0; k < text.length; k++) h = (h * 31 + text.charCodeAt(k)) | 0;
  return Math.abs(h);
}

/** ⭐ Petit mot automatique et aléatoire sur un devoir travaillé (Nadia n'a pas à l'écrire) */
export const PRAISES = [
  '⭐ Bravo {prenom}, beau travail !',
  '🌟 Ma shā\' Allah {prenom}, continue comme ça !',
  '💪 Super effort {prenom}, quel courage !',
  '🎉 Excellent {prenom}, tu progresses vite !',
  '🤲 Qu\'Allah te récompense {prenom} pour ce travail !',
  '✨ Très bien {prenom}, ta régularité paie !',
  '🏆 Top {prenom}, encore un devoir de fait !',
  '🌱 Petit à petit {prenom}, tu grandis dans ton apprentissage !',
];
export const praiseFor = (devoirId: string, studentId: string) => PRAISES[seed(devoirId + studentId) % PRAISES.length];

/** 🎁 Récompenses du trésor : un hadith authentique tiré au hasard (le même toute la semaine) */
export const TREASURES: { emoji: string; text: string; source: string }[] = [
  { emoji: '💚', text: "Les actions les plus aimées d'Allah sont les plus régulières, même si elles sont peu nombreuses.", source: 'Al-Bukhârî n° 6464 · Muslim n° 783' },
  { emoji: '📖', text: "Le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne.", source: 'Al-Bukhârî n° 5027' },
  { emoji: '🛤️', text: "Celui qui emprunte un chemin pour chercher une science, Allah lui facilite un chemin vers le Paradis.", source: 'Muslim n° 2699' },
  { emoji: '🌟', text: "Celui qui lit une lettre du Livre d'Allah a une bonne action, et la bonne action vaut dix fois plus.", source: 'At-Tirmidhî n° 2910 (authentique)' },
  { emoji: '🏅', text: "Celui qui récite le Coran avec aisance sera avec les nobles anges, et celui qui le récite avec difficulté aura deux récompenses.", source: 'Al-Bukhârî n° 4937 · Muslim n° 798' },
  { emoji: '😊', text: "Ton sourire à ton frère est une aumône.", source: 'At-Tirmidhî n° 1956 (hasan)' },
  { emoji: '🤝', text: "Aucun de vous n'est vraiment croyant tant qu'il n'aime pas pour son frère ce qu'il aime pour lui-même.", source: 'Al-Bukhârî n° 13 · Muslim n° 45' },
];
export const treasureFor = (programId: string) => TREASURES[seed(programId) % TREASURES.length];
