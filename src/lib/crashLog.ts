import { supabase } from '@/integrations/supabase/client';

/** Nom des plantages dans app_logs (alerte « chat qui pleure », 2026-10-19) */
export const CRASH_ACTION = 'Écran « chat qui pleure »';

let alreadyLogged = false;

/**
 * Un élève tombe sur l'écran du chat qui pleure : on l'écrit dans le Monitoring (rouge, pastille).
 * L'enseignante reçoit une notification qui revient (toutes les 1 à 4 h) jusqu'à « Problème résolu »
 * — envoyée par process-scheduled-notifications. Une seule trace par ouverture de page.
 */
export async function logCrash(error: Error, componentStack?: string | null) {
  if (alreadyLogged) return;
  alreadyLogged = true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;
    await supabase.from('app_logs').insert({
      user_id: userId,
      level: 'error',
      action: CRASH_ACTION,
      details: {
        error: String(error?.message || error).slice(0, 500),
        stack: (error?.stack || '').slice(0, 1500),
        component: (componentStack || '').slice(0, 800),
        page: window.location.pathname + window.location.search,
        user_agent: navigator.userAgent,
      },
    });
  } catch { /* le Monitoring ne doit jamais faire planter l'écran d'erreur */ }
}

/**
 * 🎙️ Envoi d'un audio raté (2026-11-04, Yacine n'arrivait pas à envoyer sa récitation et rien n'était arrivé) :
 * la vraie raison (micro refusé, réseau, format…) est notée dans le Monitoring pour que le professeur la voie.
 */
export async function logEchecAudio(etape: 'micro' | 'envoi', error: unknown, contexte: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;
    const e = error as { message?: string; name?: string; statusCode?: string } | null;
    await supabase.from('app_logs').insert({
      user_id: userId, level: 'error', action: etape === 'micro' ? '🎙️ Micro inaccessible' : '🎙️ Envoi d\'un audio raté',
      details: { error: String(e?.message || e?.name || error).slice(0, 500), code: e?.statusCode ?? null, contexte, page: window.location.pathname, user_agent: navigator.userAgent, en_ligne: navigator.onLine },
    });
  } catch { /* le journal ne doit jamais bloquer l'élève */ }
}
