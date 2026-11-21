import { useQuery } from '@tanstack/react-query';
import { untypedDb } from '@/lib/untypedDb';

/**
 * 💬 Questions d'élèves sans réponse dans les « Lettres particulières » (Nadia, 2026-11-21) : pour la pastille 🔴 du cahier de texte.
 * Sans réponse = message d'un élève après lequel l'enseignante n'a encore rien écrit dans la même discussion.
 */
export interface QuestionEleve { id: string; particularite_id: string; titre: string; auteur: string | null; texte: string; created_at: string }

export function questionsSansReponse(
  messages: { id: string; parent_id: string | null; particularite_id: string; est_admin: boolean; auteur: string | null; texte: string; created_at: string }[],
  titres: Map<string, string>,
): QuestionEleve[] {
  const fil = (m: { id: string; parent_id: string | null }) => m.parent_id ?? m.id;
  const derniereReponse = new Map<string, string>();
  for (const m of messages) if (m.est_admin && (derniereReponse.get(fil(m)) ?? '') < m.created_at) derniereReponse.set(fil(m), m.created_at);
  return messages
    .filter((m) => !m.est_admin && (derniereReponse.get(fil(m)) ?? '') < m.created_at)
    .map((m) => ({ id: m.id, particularite_id: m.particularite_id, titre: titres.get(m.particularite_id) ?? 'Leçon', auteur: m.auteur, texte: m.texte, created_at: m.created_at }));
}

export function useQuestionsAlphabet(actif: boolean) {
  return useQuery({
    queryKey: ['alphabet-commentaires', 'sans-reponse'],
    enabled: actif,
    queryFn: async () => {
      const [{ data: msgs, error }, { data: parts, error: e2 }] = await Promise.all([
        untypedDb.from('alphabet_commentaires').select('id, parent_id, particularite_id, est_admin, auteur, texte, created_at').order('created_at'),
        untypedDb.from('alphabet_particularites').select('id, titre'),
      ]);
      if (error) throw error;
      if (e2) throw e2;
      const titres = new Map(((parts || []) as { id: string; titre: string }[]).map((p) => [p.id, p.titre]));
      return questionsSansReponse((msgs || []) as Parameters<typeof questionsSansReponse>[0], titres);
    },
  });
}
