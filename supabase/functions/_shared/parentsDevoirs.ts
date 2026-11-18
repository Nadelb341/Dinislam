import { sendPushInternal } from "./parisTime.ts";

/**
 * 👪 Parents prévenus des devoirs de leur enfant (Nadia, 2026-11-18) — version serveur (devoirs programmés, rappel la veille).
 * Seulement les liens CONFIRMÉS ; une notification par enfant avec SON prénom, catégorie à part (par_dev / par_rap).
 */
// deno-lint-ignore no-explicit-any
export async function prevenirParents(supabase: any, eleveIds: string[], category: 'par_dev' | 'par_rap', titre: (prenom: string) => string, texte: string): Promise<number> {
  if (!eleveIds.length) return 0;
  const { data: liens } = await supabase.from('parent_links').select('parent_id, child_id').in('child_id', eleveIds).eq('confirme', true);
  if (!liens?.length) return 0;
  const enfants = [...new Set((liens as { child_id: string }[]).map((l) => l.child_id))];
  const { data: profils } = await supabase.from('profiles').select('user_id, full_name').in('user_id', enfants);
  let envoyes = 0;
  for (const enfant of enfants) {
    const parents = [...new Set((liens as { parent_id: string; child_id: string }[]).filter((l) => l.child_id === enfant && l.parent_id !== enfant).map((l) => l.parent_id))];
    if (!parents.length) continue;
    const prenom = (((profils ?? []) as { user_id: string; full_name: string | null }[]).find((p) => p.user_id === enfant)?.full_name || 'Ton enfant').trim().split(/\s+/)[0];
    try {
      const r = await sendPushInternal({ userIds: parents, category, type: 'user', title: titre(prenom), body: texte, tag: `${category}-${enfant}`.slice(0, 32), data: { url: '/?open=enfants' } });
      envoyes += r?.sent || 0;
    } catch (e) { console.error('Parents non prévenus', enfant, e); }
  }
  return envoyes;
}
