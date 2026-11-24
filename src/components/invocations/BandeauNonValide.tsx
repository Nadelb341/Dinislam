import type { KeyboardEvent, MouseEvent } from 'react';
import { toast } from 'sonner';
import { dureeMessage } from '@/lib/dureeMessage';

/**
 * ⚠️ Bandeau rouge fixe (Nadia, 24/11 ; le clignotement retiré le 25/11 : « agressif ») : en haut de chaque invocation pas encore validée
 * (ni validée par le prof, ni récitation envoyée). Le toucher affiche un message éphémère qui dit quoi faire.
 */
export function BandeauNonValide({ compact = false, audioObligatoire }: { compact?: boolean; audioObligatoire: boolean }) {
  const message = audioObligatoire
    ? '🎙️ Tu dois envoyer un enregistrement à ton professeur, pour qu\'il te la valide.'
    : '✅ Tu peux la valider toi-même avec le bouton « Valider l\'invocation ».';
  const montrer = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toast(message, { id: 'invocation-non-validee', duration: dureeMessage(message) });
  };
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={montrer}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') montrer(e); }}
      className={`block cursor-pointer w-full bg-red-600 text-white font-extrabold text-center leading-tight [overflow-wrap:anywhere] ${compact ? 'rounded-t-2xl px-1 py-1 text-[10px]' : 'rounded-xl px-3 py-2 text-sm'}`}
    >
      {compact ? '⚠️ Pas encore validée' : '⚠️ Cette invocation n\'a toujours pas été validée !'}
    </span>
  );
}
