import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Message lisible d'une erreur quelconque (Error, erreur Supabase {message}, texte…) */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return String(e);
}

/** Tri alphabétique des élèves (demande de Nadia 2026-10-07) : à la française, sans tenir compte des majuscules ni des accents ; noms vides en dernier. */
const nameCollator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });
export function byName<T>(get: (item: T) => string | null | undefined = (item) => (item as { full_name?: string | null }).full_name) {
  return (a: T, b: T) => {
    const na = (get(a) ?? '').trim(), nb = (get(b) ?? '').trim();
    if (!na && nb) return 1;
    if (na && !nb) return -1;
    return nameCollator.compare(na, nb);
  };
}
export function sortByName<T>(items: T[], get?: (item: T) => string | null | undefined): T[] {
  return [...items].sort(byName(get));
}
