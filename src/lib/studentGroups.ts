import { byName } from '@/lib/utils';

export interface GroupLite { id: string; name: string; color: string | null; position?: number | null }
export interface GroupedStudents<S> { groupId: string | null; groupName: string | null; groupColor: string | null; members: S[] }

/** Groupes dans l'ordre 0, 1, 2… (ordre choisi s'il existe, sinon nom, « Groupe 10 » après « Groupe 9 ») */
export function sortGroups<G extends GroupLite>(groups: G[]): G[] {
  return [...groups].sort((a, b) => {
    const pa = a.position ?? Number.MAX_SAFE_INTEGER, pb = b.position ?? Number.MAX_SAFE_INTEGER;
    return pa !== pb ? pa - pb : byName<G>((g) => g.name)(a, b);
  });
}

/**
 * Élèves rangés par groupe (demande de Nadia 2026-10-07, « Ma Présence » et Registre) :
 * groupes dans l'ordre, élèves par ordre alphabétique dans chaque groupe, « Sans groupe » à la fin.
 */
export function groupStudents<S extends { user_id: string; full_name: string | null }>(
  students: S[], groups: GroupLite[], members: { user_id: string; group_id: string }[],
): GroupedStudents<S>[] {
  const sorted = [...students].sort(byName<S>());
  if (groups.length === 0) return [{ groupId: null, groupName: null, groupColor: null, members: sorted }];
  const memberOf = new Map<string, string>();
  for (const m of members) if (!memberOf.has(m.user_id)) memberOf.set(m.user_id, m.group_id);
  const out: GroupedStudents<S>[] = [];
  for (const g of sortGroups(groups)) {
    const list = sorted.filter((s) => memberOf.get(s.user_id) === g.id);
    if (list.length) out.push({ groupId: g.id, groupName: g.name, groupColor: g.color, members: list });
  }
  const known = new Set(groups.map((g) => g.id));
  const ungrouped = sorted.filter((s) => !memberOf.has(s.user_id) || !known.has(memberOf.get(s.user_id)!));
  if (ungrouped.length) out.push({ groupId: null, groupName: 'Sans groupe', groupColor: null, members: ungrouped });
  return out;
}

/** Couleur d'un groupe : enregistrée comme classe (« bg-purple-500 ») ; une ancienne couleur « #… » marche aussi */
export function groupColorProps(color: string | null): { className: string; style?: { backgroundColor: string } } {
  if (color && color.startsWith('bg-')) return { className: color };
  return { className: '', style: { backgroundColor: color || '#6b7280' } };
}
