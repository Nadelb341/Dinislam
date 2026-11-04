import { supabase } from '@/integrations/supabase/client';

/**
 * ⭐ Demande de Nadia (2026-11-04) : quand le professeur valide une sourate d'un élève (récitation ou demande),
 * toutes les sourates AVANT elle dans le parcours sont validées aussi.
 * Ordre du parcours : 114, 113, 112, Ayat Al-Kursi (n° 1000), 111, 110 … 1.
 */
export const rangParcours = (numero: number) => (numero === 1000 ? 111.5 : numero);

/** Numéros des sourates qui viennent avant `numero` dans le parcours */
export function souratesAvant(numero: number, tous: number[]): number[] {
  // Al-Fatiha (n° 1) est apprise à part, souvent dès le début : la valider ne valide jamais les 113 autres
  if (numero === 1) return [];
  const r = rangParcours(numero);
  return tous.filter((n) => n !== 1 && rangParcours(n) > r);
}

/** Valide pour l'élève toutes les sourates d'avant (celles déjà validées ne bougent pas) ; renvoie combien ont été ajoutées */
export async function validerSouratesPrecedentes(studentId: string, sourateId: string): Promise<number> {
  const { data: sourates } = await supabase.from('sourates').select('id, number');
  const cible = sourates?.find((s) => s.id === sourateId);
  if (!sourates || !cible) return 0;
  const avant = new Set(souratesAvant(cible.number, sourates.map((s) => s.number)));
  const ids = sourates.filter((s) => avant.has(s.number)).map((s) => s.id);
  if (!ids.length) return 0;
  const { data: deja } = await supabase.from('user_sourate_progress').select('sourate_id')
    .eq('user_id', studentId).eq('context', 'sourates').eq('is_validated', true).in('sourate_id', ids);
  const faits = new Set((deja || []).map((d) => d.sourate_id));
  const manquantes = ids.filter((id) => !faits.has(id));
  if (!manquantes.length) return 0;
  const { error } = await supabase.from('user_sourate_progress').upsert(
    manquantes.map((id) => ({ user_id: studentId, sourate_id: id, is_validated: true, progress_percentage: 100, context: 'sourates' })),
    { onConflict: 'user_id,sourate_id,context' });
  if (error) throw error;
  return manquantes.length;
}
