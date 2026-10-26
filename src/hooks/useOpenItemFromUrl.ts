import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Message affiché quand le devoir mène à un élément encore verrouillé pour l'élève.
 * Ex. lockedItemMessage('Cette leçon') → « Cette leçon n'est pas encore ouverte pour toi : demande à ton professeur 🙂 »
 */
export const lockedItemMessage = (subject = 'Cette leçon', feminine = true) =>
  `${subject} n'est pas encore ${feminine ? 'ouverte' : 'ouvert'} pour toi : demande à ton professeur 🙂`;
/** Message affiché quand l'élément du lien n'existe plus (retiré entre-temps). */
export const MISSING_ITEM_MESSAGE = "Je n'ai pas trouvé ce travail dans cette carte : demande à ton professeur 🙂";

/**
 * « Commencer mon travail » d'un devoir : le lien a la forme `<route>?item=<identifiant>&devoir=<uuid>`.
 * Quand `ready` passe à vrai (données de la page chargées), appelle `open(item)` UNE seule fois
 * pour ce lien : si l'élève referme l'élément, il ne se rouvre pas. Un autre lien (autre `item` ou
 * autre `devoir`) le rouvre. Le paramètre `devoir` n'est jamais touché (il sert ailleurs).
 */
export function useOpenItemFromUrl(ready: boolean, open: (item: string) => void): string | null {
  const [searchParams] = useSearchParams();
  const item = searchParams.get('item');
  const devoir = searchParams.get('devoir') ?? '';

  // Toujours la dernière version de `open` (elle lit l'état à jour de la page)
  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; });

  const handledRef = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !item) return;
    const key = `${item}|${devoir}`;
    if (handledRef.current === key) return;
    handledRef.current = key;
    try {
      openRef.current(item);
    } catch (e) {
      // Ne jamais faire planter la page pour un lien
      console.error('useOpenItemFromUrl', e);
    }
  }, [ready, item, devoir]);

  return item;
}
