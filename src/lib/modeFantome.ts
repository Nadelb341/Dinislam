import { supabase } from '@/integrations/supabase/client';

/**
 * 👻 Mode fantôme (demande de Nadia, 2026-11-05) : l'enseignante entre dans le compte d'un élève et agit
 * comme lui. Sa propre session est gardée de côté (localStorage : une appli fermée puis rouverte reste en mode
 * fantôme AVEC le bandeau « Revenir à mon compte », jamais coincée dans le compte de l'élève).
 * Pendant le mode fantôme : pas d'abonnement aux notifications (ce téléphone resterait celui de Nadia),
 * pas de « dernière connexion » ni de journal de connexion au nom de l'élève.
 */
const CLE = 'dinislam_mode_fantome';

export type Fantome = {
  retour: { access_token: string; refresh_token: string };
  eleveId: string;
  eleveNom: string;
  depuis: string;
};

export function lireFantome(): Fantome | null {
  try {
    const v = localStorage.getItem(CLE);
    if (!v) return null;
    const f = JSON.parse(v) as Fantome;
    return f?.retour?.refresh_token && f.eleveId ? f : null;
  } catch { return null; }
}

export const estEnModeFantome = () => !!lireFantome();

/** Entre dans le compte de l'élève ; renvoie un message d'erreur, ou null si c'est fait (la page se recharge) */
export async function entrerFantome(eleveId: string, eleveNom: string): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 'Ta session est introuvable, reconnecte-toi.';
  if (lireFantome()) return 'Tu es déjà en mode fantôme : reviens d\'abord à ton compte.';
  const { data, error } = await supabase.functions.invoke('ghost-session', { body: { user_id: eleveId } });
  if (error || !data?.token_hash) {
    let msg = (data as { error?: string } | null)?.error;
    try { const ctx = (error as { context?: Response } | null)?.context; if (!msg && ctx) msg = (await ctx.json())?.error; } catch { /* rien */ }
    return msg || 'Impossible d\'ouvrir ce compte pour le moment.';
  }
  const f: Fantome = { retour: { access_token: session.access_token, refresh_token: session.refresh_token }, eleveId, eleveNom, depuis: new Date().toISOString() };
  try { localStorage.setItem(CLE, JSON.stringify(f)); } catch { return 'Ce téléphone ne permet pas le mode fantôme (stockage bloqué).'; }
  const { error: otpErr } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: 'magiclink' });
  if (otpErr) {
    try { localStorage.removeItem(CLE); } catch { /* rien */ }
    // Par sécurité : on remet la session de l'enseignante telle qu'elle était
    await supabase.auth.setSession(f.retour).catch(() => {});
    return 'Impossible d\'ouvrir ce compte : ' + otpErr.message;
  }
  // Rechargement complet : aucune donnée de l'enseignante ne reste en mémoire dans l'écran de l'élève
  window.location.assign('/');
  return null;
}

/** Revient au compte de l'enseignante (même si sa session a expiré entre-temps : renouvelée avec son jeton) */
export async function quitterFantome(): Promise<void> {
  const f = lireFantome();
  try { localStorage.removeItem(CLE); } catch { /* rien */ }
  if (f) {
    const { error } = await supabase.auth.setSession(f.retour);
    if (!error) { window.location.assign('/admin'); return; }
  }
  // Session de l'enseignante plus valable : on quitte seulement CE téléphone (l'élève reste connecté chez lui)
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  window.location.assign('/auth');
}
