import { toast } from 'sonner';
import { addMoodEmojis, type Tone } from '@/lib/moodEmojis';

type ToastFn = (message: unknown, data?: unknown) => string | number;

/**
 * Émojis sur tous les petits messages de l'appli (toast.success / error / warning / info), 2026-10-19.
 * Installé une seule fois au démarrage (main.tsx). Les messages qui ont déjà un émoji ne changent pas.
 */
export function installMoodToasts() {
  const t = toast as unknown as Record<string, ToastFn> & { __mood?: boolean };
  if (t.__mood) return;
  t.__mood = true;
  const wrap = (name: string, tone?: Tone) => {
    const original = t[name].bind(toast);
    t[name] = (message, data) => original(typeof message === 'string' ? addMoodEmojis(message, tone) : message, data);
  };
  wrap('success', 'joie');
  wrap('error', 'triste');
  wrap('warning', 'triste');
  wrap('info');
  wrap('message');
}
