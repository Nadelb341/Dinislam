/** Textes du message après le dernier cours (choisis par Nadia le 2026-10-07), accordés au féminin */
export function buildAttendanceMessage(status: string, girl: boolean, prenom = ''): string {
  const e = girl ? 'e' : '';
  const p = prenom ? ` ${prenom}` : '';
  if (status === 'present') return `Présent${e} au dernier cours, macha'Allah${p} ! 🎉 Chaque cours te fait progresser, continue sur cette lancée inch'Allah ✨`;
  if (status === 'late') return `🙂 Merci d'être venu${e} au dernier cours${prenom ? `, ${prenom}` : ''} ! Au prochain cours, on compte sur toi à l'heure pile inch'Allah ⏰💪`;
  return `📚 ${prenom ? `${prenom}, tu` : 'Tu'} étais absent${e} au dernier cours ! Reviens vite, ta place t'attend ✨`;
}

/** Nombre de cours suivis d'affilée (présent ou en retard), en partant du plus récent */
export function attendanceStreak(statuses: string[]): number {
  let n = 0;
  for (const s of statuses) { if (s === 'present' || s === 'late') n += 1; else break; }
  return n;
}
