/** 💎 Chemin de la semaine : types et petites règles partagées (élève et enseignante) */
export interface ProgramItem { module: string; item_id: string; label: string; detail: string; path: string; emoji: string; done: boolean }
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
