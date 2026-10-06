import { supabase } from '@/integrations/supabase/client';

/**
 * Garde le mot de passe d'un élève pour que l'enseignante puisse le lui redonner (bouclier › Élèves › ⋮ ›
 * Modifier le mot de passe). La fonction serveur vérifie qu'il est juste avant de l'enregistrer, et ignore
 * les comptes admin. N'empêche jamais la connexion : une erreur ici est simplement ignorée.
 */
export function rememberPassword(password: string, source: 'connexion' | 'oubli' | 'parametres') {
  supabase.functions.invoke('remember-password', { body: { password, source } }).catch(() => {});
}

/** Traduit en français les messages d'erreur de connexion de Supabase */
export function authErrorFr(message: string | undefined): string {
  const m = message || '';
  if (m === 'Invalid login credentials') return 'E-mail ou mot de passe incorrect';
  if (/email not confirmed/i.test(m)) return "Ton adresse e-mail n'est pas encore confirmée : ouvre l'e-mail « Confirmation d'inscription » de Dinislam (regarde aussi dans les courriers indésirables) ou demande à ton enseignante.";
  const wait = m.match(/after (\d+) seconds?/i);
  if (wait) return `Par sécurité, attends ${wait[1]} secondes avant de redemander un e-mail.`;
  if (/rate limit/i.test(m)) return "Trop de demandes d'e-mails en peu de temps. Réessaie dans quelques minutes.";
  if (/token has expired|invalid/i.test(m) && /otp|token/i.test(m)) return 'Ce code ou ce lien a expiré ou a déjà servi. Redemande un e-mail.';
  if (/should be different/i.test(m)) return "Le nouveau mot de passe doit être différent de l'ancien.";
  if (/at least \d+ characters|password should be/i.test(m)) return 'Le mot de passe doit contenir au moins 6 caractères.';
  return m || 'Une erreur est survenue';
}
