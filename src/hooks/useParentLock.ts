import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * « Espace parents » (demande de Nadia du 2026-09-30) : pour un élève de MOINS de 12 ans, l'accès aux
 * paramètres (roue dentée et page Paramètres) demande le mot de passe de connexion de l'enfant.
 * Une fois déverrouillé, l'accès reste ouvert 15 minutes sur cet appareil.
 * L'enseignante peut forcer le verrou (on) ou le retirer (off) pour un élève dans sa fiche du bouclier ;
 * par défaut (auto) il dépend de l'âge.
 */
const UNLOCK_KEY = 'parent_unlock_until';
const UNLOCK_MINUTES = 15;

export function childAge(profile: { date_of_birth?: string | null; age?: number | null } | null): number | null {
  if (!profile) return null;
  if (profile.date_of_birth) {
    const b = new Date(profile.date_of_birth);
    const n = new Date();
    return n.getFullYear() - b.getFullYear() - (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate()) ? 1 : 0);
  }
  return profile.age ?? null;
}

function unlockedNow(): boolean {
  try { return Number(sessionStorage.getItem(UNLOCK_KEY) || 0) > Date.now(); } catch { return false; }
}

export function useParentLock() {
  const { user, isAdmin } = useAuth();
  const [isChild, setIsChild] = useState(false);
  const [unlocked, setUnlocked] = useState(unlockedNow);

  useEffect(() => {
    if (!user || isAdmin) { setIsChild(false); return; }
    Promise.all([
      (supabase as any).from('profiles').select('date_of_birth, age').eq('user_id', user.id).maybeSingle(),
      (supabase as any).from('parent_lock_settings').select('mode').eq('user_id', user.id).maybeSingle(),
    ]).then(([{ data: profile }, { data: setting }]: any[]) => {
      const mode = setting?.mode ?? 'auto';
      if (mode === 'on') { setIsChild(true); return; }
      if (mode === 'off') { setIsChild(false); return; }
      const a = childAge(profile);
      setIsChild(a !== null && a < 12);
    });
  }, [user, isAdmin]);

  /** Vérifie le mot de passe de connexion de l'enfant ; true si correct */
  const unlock = async (password: string): Promise<boolean> => {
    if (!user?.email) return false;
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
    if (error) return false;
    try { sessionStorage.setItem(UNLOCK_KEY, String(Date.now() + UNLOCK_MINUTES * 60000)); } catch { /* stockage indisponible */ }
    setUnlocked(true);
    return true;
  };

  return { locked: isChild && !unlocked, isChild, unlock };
}
